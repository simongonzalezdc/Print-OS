'use client';

import { OrbitControls } from '@react-three/drei';

/**
 * Camera controls for the 3D CAD scene
 * Optimized for CAD: Only updates on user interaction, not per-frame
 */
export function CameraControls() {
  return (
    <OrbitControls
      makeDefault
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      zoomSpeed={0.6}
      panSpeed={0.8}
      rotateSpeed={0.4}
      minDistance={1}
      maxDistance={1000}
      maxPolarAngle={Math.PI}
      target={[0, 0, 0]}
      // CAD-optimized settings
      enableDamping={true}      // Smooth camera movement
      dampingFactor={0.05}      // Moderate damping for precision
      // Additional CAD-specific optimizations
      screenSpacePanning={false} // Better CAD-like panning behavior
      keyPanSpeed={10.0}        // Faster keyboard panning for efficiency
    />
  );
}
