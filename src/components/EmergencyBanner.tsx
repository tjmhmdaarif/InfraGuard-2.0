import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, AlertOctagon, Shield, Zap, Bell } from 'lucide-react';
import { useEnvironmentStore } from '../stores/environmentStore';

export function EmergencyBanner() {
  const { emergencyStatus, emergencyRequest, bridgeIntegrity, acknowledgeEmergency, clearEmergency } = useEnvironmentStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (emergencyStatus === 'SAFETY_RESTRICTION' || emergencyStatus === 'CLOSED') {
      audioRef.current?.play().catch(() => {});
    }
  }, [emergencyStatus]);

  const isCritical = emergencyStatus === 'CLOSED';
  const isRestricted = emergencyStatus === 'SAFETY_RESTRICTION';
  const isAttention = emergencyStatus === 'ATTENTION';
  const bannerVisible = isCritical || isRestricted || isAttention;

  return (
    <AnimatePresence>
      {bannerVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-0 left-0 right-0 z-[100] px-4 py-3 flex items-center justify-between gap-4 backdrop-blur-md border-b-2 ${
            isCritical
              ? 'bg-red-900/90 border-red-500 animate-pulse'
              : isRestricted
              ? 'bg-amber-900/90 border-amber-500'
              : 'bg-yellow-900/90 border-yellow-500'
          }`}
        >
          <div className="flex items-center gap-3">
            {isCritical ? (
              <XCircle className="w-6 h-6 text-red-300" />
            ) : isRestricted ? (
              <AlertOctagon className="w-6 h-6 text-amber-300" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-300" />
            )}
            <div className="flex flex-col">
              <span className="font-bold text-white text-sm uppercase tracking-wider">
                {isCritical ? 'Bridge Closed' : isRestricted ? 'Safety Restriction' : 'Attention'}
              </span>
              <span className="text-white/80 text-xs">
                Bridge Integrity: {bridgeIntegrity.toFixed(1)}% • {emergencyStatus === 'CLOSED' ? 'Do Not Enter' : 'Emergency Vehicles Only'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {emergencyRequest && (
              <div className="hidden sm:flex items-center gap-2 text-white/90 text-sm">
                <Bell className="w-4 h-4" />
                <span>{emergencyRequest.message}</span>
              </div>
            )}
            <button
              onClick={() => {
                acknowledgeEmergency();
                clearEmergency();
              }}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {emergencyRequest ? 'Acknowledge & Close' : 'Dismiss'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Floating emergency indicator for 3D scene
export function BridgeEmergencyIndicator() {
  const { bridgeIntegrity, emergencyStatus } = useEnvironmentStore();
  const meshRef = useRef<THREE.Mesh>(null);

  if (emergencyStatus === 'NORMAL') return null;

  const isCritical = emergencyStatus === 'CLOSED';
  const color = isCritical ? '#ef4444' : '#f59e0b';

  return (
    <mesh ref={meshRef} position={[0, 12, 0]}>
      <sphereGeometry args={[0.8, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
      {/* Pulsing animation would go here via useFrame */}
    </mesh>
  );
}
