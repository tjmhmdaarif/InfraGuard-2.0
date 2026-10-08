import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, AlertTriangle, X, Check, Map } from 'lucide-react';
import type { BridgeModel } from '../../types/bridge';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    fileType: string;
    sourceFormat: 'GLB' | 'GLTF' | 'OBJ' | null;
    fileSize: number;
    meshCount: number;
    hasTextures: boolean;
    estimatedSpan: number;
    estimatedWidth: number;
    estimatedHeight: number;
    spanAxis: 'x' | 'z';
    bounds: { min: [number, number, number]; max: [number, number, number] };
  };
}

interface ImportBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (model: BridgeModel) => void;
}

export function ImportBridgeModal({ isOpen, onClose, onImport }: ImportBridgeModalProps) {
  const [step, setStep] = useState<'upload' | 'validate' | 'preview' | 'configure' | 'sensors' | 'save'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [modelName, setModelName] = useState('');
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [sourceUnit, setSourceUnit] = useState('units');
  const [zones, setZones] = useState<string[]>(['LEFT-SUPPORT', 'LEFT-SPAN', 'CENTER-SPAN', 'RIGHT-SPAN', 'RIGHT-SUPPORT']);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  async function validateModel(file: File): Promise<ValidationResult> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const ext = extension ? `.${extension}` : '';
    const errors: string[] = [];
    const warnings: string[] = [];
    let meshCount = 0;
    let hasTextures = false;
    let bounds = {
      min: [Infinity, Infinity, Infinity] as [number, number, number],
      max: [-Infinity, -Infinity, -Infinity] as [number, number, number],
    }

    if (!['.glb', '.gltf', '.obj'].includes(ext)) {
      errors.push(`Unsupported format: ${ext}. Use .glb, .gltf, or .obj.`);
    }
    if (file.size > 50 * 1024 * 1024) {
      errors.push('File exceeds 50MB limit.');
    }
    if (file.size === 0) {
      errors.push('The selected file is empty.');
    }

    if (errors.length === 0 && ext === '.obj') {
      const text = await file.text();
      const groups = text.match(/^(?:o|g)\s+.+$/gm);
      meshCount = groups?.length ?? 0;
      for (const line of text.split(/\r?\n/)) {
        if (!line.startsWith('v ')) continue;
        const values = line.trim().split(/\s+/).slice(1, 4).map(Number);
        if (values.length !== 3 || values.some((value) => !Number.isFinite(value))) continue;
        values.forEach((value, axis) => {
          bounds.min[axis] = Math.min(bounds.min[axis], value);
          bounds.max[axis] = Math.max(bounds.max[axis], value);
        });
      }
      hasTextures = /^mtllib\s+/m.test(text);
      if (meshCount === 0 && Number.isFinite(bounds.min[0])) meshCount = 1;
    } else if (errors.length === 0) {
      const buffer = await file.arrayBuffer();
      let document: Record<string, unknown>;
      if (ext === '.glb') {
        const view = new DataView(buffer);
        if (buffer.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2) {
          errors.push('Invalid GLB header. Expected a glTF 2.0 binary model.');
          document = {};
        } else {
          const declaredLength = view.getUint32(8, true);
          const jsonLength = view.getUint32(12, true);
          const jsonType = view.getUint32(16, true);
          if (declaredLength > buffer.byteLength || jsonType !== 0x4e4f534a || 20 + jsonLength > buffer.byteLength) {
            errors.push('The GLB file has an incomplete or invalid JSON chunk.');
            document = {};
          } else {
            document = JSON.parse(new TextDecoder().decode(buffer.slice(20, 20 + jsonLength)).replace(/\0+\s*$/, '')) as Record<string, unknown>;
          }
        }
      } else {
        document = JSON.parse(new TextDecoder().decode(buffer)) as Record<string, unknown>;
      }

      if (!errors.length) {
        const meshes = Array.isArray(document.meshes) ? document.meshes : [];
        const accessors = Array.isArray(document.accessors) ? document.accessors : [];
        meshCount = meshes.length;
        hasTextures = Array.isArray(document.images) && document.images.length > 0;
        for (const mesh of meshes) {
          if (!mesh || typeof mesh !== 'object' || !Array.isArray((mesh as { primitives?: unknown[] }).primitives)) continue;
          for (const primitive of (mesh as { primitives: Array<{ attributes?: Record<string, number> }> }).primitives) {
            const accessorIndex = primitive.attributes?.POSITION;
            const accessor = typeof accessorIndex === 'number' ? accessors[accessorIndex] as { min?: number[]; max?: number[] } | undefined : undefined;
            if (!accessor?.min || !accessor.max) continue;
            for (let axis = 0; axis < 3; axis++) {
              bounds.min[axis] = Math.min(bounds.min[axis], accessor.min[axis]);
              bounds.max[axis] = Math.max(bounds.max[axis], accessor.max[axis]);
            }
          }
        }
        const buffers = Array.isArray(document.buffers) ? document.buffers as Array<{ uri?: string }> : [];
        if (ext === '.gltf' && buffers.some((entry) => entry.uri && !entry.uri.startsWith('data:'))) {
          errors.push('This glTF references external files. Use a self-contained GLB or embed its resources before importing.');
        }
      }
    }

    if (!errors.length && (!Number.isFinite(bounds.min[0]) || meshCount === 0)) {
      errors.push('No mesh geometry bounds were found in this file.');
    }
    if (meshCount > 0 && !bounds.min.every(Number.isFinite)) {
      warnings.push('Mesh count was read, but the file does not include position bounds. Default bridge dimensions cannot be inferred.');
    }
    const size = bounds.min.every(Number.isFinite) && bounds.max.every(Number.isFinite)
      ? bounds.max.map((value, axis) => Math.max(0, value - bounds.min[axis]))
      : [0, 0, 0];
    const spanAxis: 'x' | 'z' = size[0] >= size[2] ? 'x' : 'z';

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        fileType: ext.replace('.', '').toUpperCase(),
        sourceFormat: ext === '.glb' ? 'GLB' : ext === '.gltf' ? 'GLTF' : ext === '.obj' ? 'OBJ' : null,
        fileSize: file.size,
        meshCount,
        hasTextures,
        estimatedSpan: spanAxis === 'x' ? size[0] : size[2],
        estimatedWidth: spanAxis === 'x' ? size[2] : size[0],
        estimatedHeight: size[1],
        spanAxis,
        bounds: { min: bounds.min, max: bounds.max },
      },
    };
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = event.target.files?.[0];
    if (!uploaded) return;
    setFile(uploaded);
    setStep('validate');
    setValidation(null);
    setValidationError(null);
    setValidating(true);
    try {
      const result = await validateModel(uploaded);
      setValidation(result);
      if (result.valid && !modelName) setModelName(uploaded.name.replace(/\.[^/.]+$/, ''));
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Could not inspect this model file.');
    } finally {
      setValidating(false);
    }
  };

  const handleNext = () => {
    if (step === 'upload' && file) setStep('validate');
    else if (step === 'validate' && validation?.valid) setStep('preview');
    else if (step === 'preview') setStep('configure');
    else if (step === 'configure') setStep('sensors');
    else if (step === 'sensors') setStep('save');
  };

  const handleBack = () => {
    if (step === 'validate') setStep('upload');
    else if (step === 'preview') setStep('validate');
    else if (step === 'configure') setStep('preview');
    else if (step === 'sensors') setStep('configure');
    else if (step === 'save') setStep('sensors');
  };

  const handleComplete = () => {
    if (!file || !validation?.valid) return;
    const { spanAxis, sourceFormat } = validation.metadata;
    if (!sourceFormat) {
      setValidationError('The selected file format could not be confirmed.');
      return;
    }
    const span = validation.metadata.estimatedSpan * scale;
    const width = validation.metadata.estimatedWidth * scale;
    const height = validation.metadata.estimatedHeight * scale;
    const min = { x: -span / 2, y: -height / 2, z: -width / 2 };
    const max = { x: span / 2, y: height / 2, z: width / 2 };
    const zoneCount = Math.max(1, zones.length);
    const bridgeZones = zones.map((name, index) => {
      const zoneMinX = min.x + span * index / zoneCount;
      const zoneMaxX = min.x + span * (index + 1) / zoneCount;
      return {
        zoneId: name,
        name: name.replace(/_/g, ' '),
        description: `Longitudinal segment ${index + 1} of ${zoneCount}`,
        color: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][index % 5],
        bounds: { min: { ...min, x: zoneMinX }, max: { ...max, x: zoneMaxX } },
        center: { x: (zoneMinX + zoneMaxX) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 },
      };
    });
    const model: BridgeModel = {
      id: `imported-${Date.now()}`,
      name: modelName || file?.name.replace(/\.[^/.]+$/, '') || 'Imported Bridge',
      description: `${file.name} · ${validation.metadata.fileType} · ${validation.metadata.meshCount} mesh${validation.metadata.meshCount === 1 ? '' : 'es'}`,
      modelPath: URL.createObjectURL(file),
      coordinateSystem: {
        origin: { x: 0, y: 0, z: 0 },
        scale,
        orientation: {
          x: 0,
          y: Math.sin((rotation + (spanAxis === 'z' ? 90 : 0)) * Math.PI / 360),
          z: 0,
          w: Math.cos((rotation + (spanAxis === 'z' ? 90 : 0)) * Math.PI / 360),
        },
        boundingBox: { min, max },
        deckPlane: { point: { x: 0, y: min.y + height * 0.28, z: 0 }, normal: { x: 0, y: 1, z: 0 } },
      },
      zones: bridgeZones,
      components: [],
      defaultSensors: [],
      metadata: {
        span,
        width,
        height,
        material: 'Unspecified',
        location: 'Imported model',
        spanAxis,
        sourceUnit,
        sourceFormat,
      },
    };
    onImport(model);
    onClose();
    setStep('upload');
    setFile(null);
    setValidation(null);
    setModelName('');
    setSourceUnit('units');
    setValidationError(null);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
          <h3 className="font-semibold text-[var(--fg-primary)]">Import Bridge Model</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--fg-muted)]"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)] mb-4 overflow-x-auto pb-2">
            {['upload', 'validate', 'preview', 'configure', 'sensors', 'save'].map((s, i) => (
              <span key={s} className={`flex items-center gap-1 ${step === s ? 'text-[var(--accent-cyan)] font-medium' : i < ['upload', 'validate', 'preview', 'configure', 'sensors', 'save'].indexOf(step) ? 'text-[var(--accent-green)]' : 'text-[var(--fg-muted)]'}`}>
                {i < ['upload', 'validate', 'preview', 'configure', 'sensors', 'save'].indexOf(step) && <Check className="w-3 h-3" />}
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            ))}
          </div>

          <div className="min-h-[200px]">
            {step === 'upload' && (
              <div className="space-y-4">
                <label className="block border-2 border-dashed border-[var(--border-primary)] rounded-lg p-8 text-center cursor-pointer hover:border-[var(--accent-cyan)] transition-colors">
                  <Upload className="w-10 h-10 mx-auto mb-2 text-[var(--fg-muted)]" />
                  <p className="text-[var(--fg-primary)] font-medium">Click to upload GLB, GLTF, or OBJ</p>
                  <p className="text-xs text-[var(--fg-muted)] mt-1">Max 50MB. Imported locally in your browser.</p>
                  <input type="file" accept=".glb,.gltf,.obj" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}

            {step === 'validate' && validation && (
              <div className="space-y-4">
                <div className={`p-3 rounded-lg border ${validation.valid ? 'bg-[var(--accent-green)]/10 border-[var(--accent-green)]/20' : 'bg-[var(--accent-red)]/10 border-[var(--accent-red)]/20'}`}>
                  <p className={`font-medium ${validation.valid ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                    {validation.valid ? '✓ Validation passed' : '✗ Validation failed'}
                  </p>
                  <p className="text-sm text-[var(--fg-secondary)] mt-1">{file?.name} • {(file!.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {validation.errors.length > 0 && (
                  <div className="space-y-1">
                    {validation.errors.map((err, i) => (
                      <p key={i} className="text-sm text-[var(--accent-red)] flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" /> {err}</p>
                    ))}
                  </div>
                )}
                {validation.warnings.length > 0 && (
                  <div className="space-y-1">
                    {validation.warnings.map((warn, i) => (
                      <p key={i} className="text-sm text-[var(--accent-amber)] flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" /> {warn}</p>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-2 bg-[var(--bg-tertiary)] rounded"><span className="text-[var(--fg-muted)]">Meshes:</span> <span className="font-medium">{validation.metadata.meshCount}</span></div>
                  <div className="p-2 bg-[var(--bg-tertiary)] rounded"><span className="text-[var(--fg-muted)]">Textures:</span> <span className="font-medium">{validation.metadata.hasTextures ? 'Yes' : 'None'}</span></div>
                  <div className="p-2 bg-[var(--bg-tertiary)] rounded"><span className="text-[var(--fg-muted)]">Est. span:</span> <span className="font-medium">{validation.metadata.estimatedSpan.toFixed(2)} units</span></div>
                </div>
              </div>
            )}
            {step === 'validate' && validating && (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-sm text-[var(--fg-secondary)]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-primary)] border-t-[var(--accent-cyan)]" />
                Inspecting model geometry and bounds…
              </div>
            )}
            {step === 'validate' && validationError && (
              <div role="alert" className="rounded-lg border border-[var(--accent-red)]/30 bg-[var(--accent-red)]/10 p-4 text-sm text-[var(--accent-red)]">
                {validationError}
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-5">
                  <div className="flex items-start gap-3">
                    <Map className="mt-1 h-6 w-6 text-[var(--accent-cyan)]" />
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--fg-primary)]">{file?.name}</p>
                      <p className="mt-1 text-sm text-[var(--fg-secondary)]">Geometry bounds were read from the selected file. Model rendering is not available in this import preview.</p>
                    </div>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div><dt className="text-[var(--fg-muted)]">Span</dt><dd className="font-mono">{validation?.metadata.estimatedSpan.toFixed(2)} units</dd></div>
                    <div><dt className="text-[var(--fg-muted)]">Width</dt><dd className="font-mono">{validation?.metadata.estimatedWidth.toFixed(2)} units</dd></div>
                    <div><dt className="text-[var(--fg-muted)]">Height</dt><dd className="font-mono">{validation?.metadata.estimatedHeight.toFixed(2)} units</dd></div>
                    <div><dt className="text-[var(--fg-muted)]">Meshes</dt><dd className="font-mono">{validation?.metadata.meshCount}</dd></div>
                  </dl>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex-1 text-sm">
                    <span className="text-[var(--fg-muted)]">Scale</span>
                    <input type="range" min={0.5} max={3} step={0.1} value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-full" />
                  </label>
                  <label className="flex-1 text-sm">
                    <span className="text-[var(--fg-muted)]">Rotate</span>
                    <input type="range" min={-180} max={180} step={5} value={rotation} onChange={(e) => setRotation(parseFloat(e.target.value))} className="w-full" />
                  </label>
                </div>
              </div>
            )}

            {step === 'configure' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  <span className="text-[var(--fg-primary)]">Model Name</span>
                  <input type="text" value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="e.g. Nilgiri River Bridge" className="mt-1 w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--fg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]" />
                </label>
                <label className="block text-sm font-medium text-[var(--fg-primary)]">
                  Source unit
                  <select
                    value={sourceUnit}
                    onChange={(event) => setSourceUnit(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-3 py-2 text-[var(--fg-primary)]"
                  >
                    <option value="units">Unspecified units</option>
                    <option value="m">Meters</option>
                    <option value="ft">Feet</option>
                  </select>
                </label>
                <div>
                  <span className="text-sm font-medium text-[var(--fg-primary)]">Zones</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {zones.map((z) => (
                      <span key={z} className="px-3 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-full text-sm">{z.replace(/_/g, ' ')}</span>
                    ))}
                    <button onClick={() => setZones([...zones, `ZONE_${zones.length + 1}`])} className="px-3 py-1 bg-[var(--bg-tertiary)] border border-dashed border-[var(--border-primary)] rounded-full text-sm text-[var(--fg-muted)] hover:text-[var(--fg-primary)]">+ Add</button>
                  </div>
                </div>
              </div>
            )}

            {step === 'sensors' && (
              <div className="space-y-4 text-center py-8">
                <MapPinPlaceholder />
                <p className="text-[var(--fg-secondary)]">After import, use "Place" mode in Digital Twin to assign sensors to zones.</p>
              </div>
            )}

            {step === 'save' && (
              <div className="space-y-3">
                <p className="text-[var(--fg-primary)] font-medium">Ready to import:</p>
                <div className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg p-4 space-y-2 text-sm">
                  <p><span className="text-[var(--fg-muted)]">Name:</span> <span className="font-medium">{modelName || file?.name}</span></p>
                  <p><span className="text-[var(--fg-muted)]">Scale:</span> {scale}x, <span className="text-[var(--fg-muted)]">Rotation:</span> {rotation}°</p>
                  <p><span className="text-[var(--fg-muted)]">Zones:</span> {zones.length}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--border-primary)]">
            <button onClick={handleBack} disabled={step === 'upload'} className="px-4 py-2 text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] disabled:opacity-30">Back</button>
            <div className="flex items-center gap-2">
              {step === 'save' ? (
                <button onClick={handleComplete} className="px-4 py-2 bg-[var(--accent-cyan)] text-[var(--bg-primary)] rounded-lg font-medium hover:opacity-90">Import Bridge</button>
              ) : (
                <button onClick={handleNext} disabled={step === 'validate' && (!validation?.valid || validating)} className="px-4 py-2 bg-[var(--accent-cyan)] text-[var(--bg-primary)] rounded-lg font-medium hover:opacity-90 disabled:opacity-30">Next</button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MapPinPlaceholder() {
  return (
    <div className="w-16 h-16 mx-auto bg-[var(--accent-cyan)]/20 rounded-full flex items-center justify-center">
      <MapPin className="w-8 h-8 text-[var(--accent-cyan)]" />
    </div>
  );
}

import { MapPin } from 'lucide-react';