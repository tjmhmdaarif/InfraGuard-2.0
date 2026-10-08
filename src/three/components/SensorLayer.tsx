import { memo, useMemo } from 'react';
import { useSensorStore } from '../../stores/sensorStore';
import { useUIStore } from '../../stores/uiStore';
import { SensorAnchor } from '../../types/bridge';
import { SensorMarker } from './SensorMarker';

interface SensorLayerProps {
  sensors: SensorAnchor[];
  sensorConfigs: any[];
  heatmapMode: 'none' | 'health' | 'vibration' | 'strain' | 'load' | 'displacement' | 'temperature';
}

export const SensorLayer = memo(function SensorLayer({ sensors, sensorConfigs, heatmapMode }: SensorLayerProps) {
  const { selectedSensorId, hoveredSensorId, selectSensor, hoverSensor } = useSensorStore();
  const { showSensorMarkers } = useUIStore();

  if (!showSensorMarkers) return null;

  const markers = useMemo(() => {
    return sensors.map((anchor) => {
      const config = sensorConfigs.find((c) => c.sensorId === anchor.sensorId);
      const status = config?.status || 'NORMAL';
      const healthScore = config?.healthScore || 100;
      const isSelected = selectedSensorId === anchor.sensorId;
      const isHovered = hoveredSensorId === anchor.sensorId;
      const pulse = status === 'CRITICAL' && healthScore < 60;

      return (
        <SensorMarker
          key={anchor.sensorId}
          sensorId={anchor.sensorId}
          sensorType={anchor.sensorType}
          position={anchor.position}
          status={status}
          healthScore={healthScore}
          isSelected={isSelected}
          isHovered={isHovered}
          pulse={pulse}
          heatmapMode={heatmapMode}
          onClick={() => selectSensor(anchor.sensorId)}
          onHover={() => hoverSensor(anchor.sensorId)}
          onUnhover={() => hoverSensor(null)}
        />
      );
    });
  }, [sensors, sensorConfigs, selectedSensorId, hoveredSensorId, heatmapMode, selectSensor, hoverSensor]);

  return <group>{markers}</group>;
});

function group({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}