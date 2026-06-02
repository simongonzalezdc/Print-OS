'use client';

import { Suspense, useRef, useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  Grid,
  Environment,
  Preload,
  PerformanceMonitor,
  AdaptiveDpr,
  AdaptiveEvents,
  Bvh,
  Stats,
} from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '@/lib/scene/store';
import { SceneObject } from './SceneObject';
import { CameraControls } from './CameraControls';
import { RENDER, SCENE } from '@/lib/constants';

/**
 * Invalidation helper - forces re-render when store changes
 * Required because frameloop="demand" only renders when invalidate() is called
 * 
 * IMPORTANT: We use primitive selectors (size, not the Map itself) to avoid
 * infinite loops from object reference changes
 */
function StoreInvalidator() {
  const { invalidate } = useThree();
  
  // Use PRIMITIVE values that don't change reference on every render
  const objectCount = useSceneStore((state) => state.objects.size);
  const selectedCount = useSceneStore((state) => state.selectedIds.size);
  const transformMode = useSceneStore((state) => state.transformMode);
  
  // Subscribe to store changes and invalidate - but NOT in a way that causes loops
  useEffect(() => {
    // Subscribe to the entire store for any change
    const unsubscribe = useSceneStore.subscribe(() => {
      invalidate();
    });
    return unsubscribe;
  }, [invalidate]);
  
  // Also invalidate on mount and when these specific values change
  useEffect(() => {
    invalidate();
  }, [objectCount, selectedCount, transformMode, invalidate]);
  
  return null;
}

/**
 * Main 3D Scene Canvas Component
 *
 * Renders the complete 3D scene using React Three Fiber, including:
 * - All 3D objects from the scene store
 * - Lighting setup (ambient + directional)
 * - Build plate visualization
 * - Grid system
 * - Camera controls
 * - Performance monitoring and optimization
 *
 * @param debug - Whether to show debug stats overlay (default: false)
 *
 * @example
 * <Scene debug={process.env.NODE_ENV === 'development'} />
 */
export function Scene({ debug = false }: { debug?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className="w-full h-full relative bg-gray-900">
      <Canvas
        ref={canvasRef}
        shadows
        dpr={RENDER.DEFAULT_DPR}
        camera={{
          position: RENDER.DEFAULT_CAMERA_POSITION,
          fov: RENDER.DEFAULT_FOV,
          near: RENDER.NEAR_CLIP,
          far: RENDER.FAR_CLIP,
        }}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          preserveDrawingBuffer: true, // For screenshots
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        frameloop="demand" // Only render when needed
        onCreated={() => {
          // Enable WebGPU if available (future enhancement)
          if ('gpu' in navigator) {
            console.log('WebGPU available');
          }
        }}
      >
        {/* Performance monitoring */}
        <PerformanceMonitor
          onDecline={() => console.warn('Performance decline detected')}
          flipflops={3}
          onFallback={() => console.warn('Falling back to lower quality')}
        />

        {/* Adaptive quality */}
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />

        {/* Store invalidator for demand rendering */}
        <StoreInvalidator />

        {/* Scene content */}
        <Suspense fallback={<SceneSkeleton />}>
          <Bvh firstHitOnly>
            <SceneContent />
          </Bvh>
          <Preload all />
        </Suspense>

        {/* Debug stats */}
        {debug && <Stats />}
      </Canvas>
    </div>
  );
}

/**
 * Scene Content Component
 * Renders all the 3D objects and environment
 */
function SceneContent() {
  // Get objects directly - the store handles updates
  const objects = useSceneStore((state) => state.objects);
  const project = useSceneStore((state) => state.project);
  const gridVisible = project?.settings?.gridVisible ?? true;
  
  // Convert Map to array for rendering
  const objectList = useMemo(() => {
    return Array.from(objects.values());
  }, [objects]);

  // Environment lighting
  const environment = useMemo(() => (
    <Environment
      preset="studio"
      background={false} // We'll use our own background
    />
  ), []);

  // Build plate grid - Orca Slicer style
  const grid = useMemo(() => {
    if (!gridVisible) return null;

    return (
      <Grid
        position={[0, 0.01, 0]} // Slightly above build plate to prevent z-fighting
        args={[SCENE.GRID_SIZE, SCENE.GRID_SIZE]}
        cellSize={10} // 10mm cells like Orca Slicer
        cellThickness={0.6}
        cellColor="#3a3a3a"
        sectionSize={50} // 50mm major divisions
        sectionThickness={1.2}
        sectionColor="#505050"
        fadeDistance={400}
        fadeStrength={0.8}
        followCamera={false}
        infiniteGrid={false}
      />
    );
  }, [gridVisible]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={RENDER.SHADOW_MAP_SIZE}
        shadow-mapSize-height={RENDER.SHADOW_MAP_SIZE}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={RENDER.SHADOW_BIAS}
      />

      {/* Environment */}
      {environment}

      {/* Build plate visualization - Orca Slicer style */}
      {/* Main build plate surface */}
      <mesh position={[0, -0.5, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[SCENE.BUILD_PLATE.X, SCENE.BUILD_PLATE.Y]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Print volume wireframe - transparent blue cube showing full build volume */}
      <lineSegments position={[0, SCENE.BUILD_PLATE.Z / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(SCENE.BUILD_PLATE.X, SCENE.BUILD_PLATE.Z, SCENE.BUILD_PLATE.Y)]} />
        <lineBasicMaterial color="#4a9eff" transparent opacity={0.3} />
      </lineSegments>
      
      {/* Origin indicator (X=Red, Y=Green, Z=Blue) */}
      <group position={[-SCENE.BUILD_PLATE.X / 2, 0.1, -SCENE.BUILD_PLATE.Y / 2]}>
        {/* X axis (red) */}
        <mesh position={[15, 0, 0]}>
          <boxGeometry args={[30, 0.5, 0.5]} />
          <meshBasicMaterial color="#ff4444" />
        </mesh>
        {/* Y axis (green) - goes up in 3D printing */}
        <mesh position={[0, 15, 0]}>
          <boxGeometry args={[0.5, 30, 0.5]} />
          <meshBasicMaterial color="#44ff44" />
        </mesh>
        {/* Z axis (blue) */}
        <mesh position={[0, 0, 15]}>
          <boxGeometry args={[0.5, 0.5, 30]} />
          <meshBasicMaterial color="#4444ff" />
        </mesh>
      </group>

      {/* Grid */}
      {grid}

      {/* 3D Objects */}
      {objectList.map((obj) => (
        <SceneObject key={obj.id} object={obj} />
      ))}

      {/* Camera controls */}
      <CameraControls />
    </>
  );
}

/**
 * Loading skeleton for the 3D scene
 */
function SceneSkeleton() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#444444" wireframe />
    </mesh>
  );
}

// CameraControls is now imported from CameraControls.tsx file
