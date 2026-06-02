'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { Outlines, Html, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '@/lib/scene/store';
import { SceneObject as SceneObjectType, ValidationResult } from '@/types';
import { executeJSCAD, jscadToThreeJS } from '@/lib/jscad/executor';
import { analyzeMeshDFM } from '@/lib/analysis/dfm';
import { SCENE } from '@/lib/constants';

interface SceneObjectProps {
  object: SceneObjectType;
}

/**
 * Individual 3D Object Component
 * Renders a JSCAD-generated object in the scene
 */
export function SceneObject({ object }: SceneObjectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const selectedIds = useSceneStore((state) => state.selectedIds);
  const selectObject = useSceneStore((state) => state.selectObject);
  const updateObject = useSceneStore((state) => state.updateObject);
  const transformMode = useSceneStore((state) => state.transformMode);

  const isSelected = selectedIds.has(object.id);
  
  // Persistent material reference
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: object.color,
      transparent: false,
      side: THREE.DoubleSide,
    });
  }, []); // Only create once

  // Update material color when object color changes
  useEffect(() => {
    material.color.set(object.color);
  }, [object.color, material]);

  // Track when group is mounted for TransformControls
  useEffect(() => {
    if (groupRef.current) {
      setIsMounted(true);
    }
    return () => setIsMounted(false);
  }, [geometry]); // Re-check when geometry changes
  
  // Handle transform changes from gizmo
  const handleTransformChange = () => {
    if (!groupRef.current) return;
    
    const obj = groupRef.current;
    updateObject(object.id, {
      position: [obj.position.x, obj.position.y, obj.position.z],
      rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
      scale: [obj.scale.x, obj.scale.y, obj.scale.z],
    });
  };

  // Generate mesh from JSCAD code with Level of Detail (LOD) progression
  useEffect(() => {
    let isCancelled = false;

    const generateMesh = async () => {
      // Defensive check: ensure jscadCode is a string
      if (!object.jscadCode || typeof object.jscadCode !== 'string' || !object.jscadCode.trim()) return;

      setIsGenerating(true);
      setError(null);

      const lods: ('preview' | 'draft' | 'final')[] = ['preview', 'draft', 'final'];
      
      for (const lod of lods) {
        if (isCancelled) break;

        try {
          // Execute JSCAD code at current LOD
          const jscadGeom = await executeJSCAD(object.jscadCode, lod);
          if (isCancelled) break;

          // Convert to Three.js geometry
          const meshData = jscadToThreeJS(jscadGeom);

          // Create Three.js buffer geometry
          const bufferGeometry = new THREE.BufferGeometry();
          bufferGeometry.setAttribute('position', new THREE.BufferAttribute(meshData.vertices, 3));
          bufferGeometry.setAttribute('normal', new THREE.BufferAttribute(meshData.normals, 3));
          bufferGeometry.setIndex(new THREE.BufferAttribute(meshData.indices, 1));

          bufferGeometry.computeBoundingBox();
          bufferGeometry.computeBoundingSphere();

          if (!isCancelled) {
            setGeometry(prev => {
              if (prev) prev.dispose();
              return bufferGeometry;
            });
          }

          // On final LOD, perform DFM analysis and update store
          if (lod === 'final' && !isCancelled) {
            const validation = await new Promise<ValidationResult>((resolve) => {
              const worker = new Worker(new URL('@/lib/validation/worker', import.meta.url));
              const validationId = Math.random().toString(36).substring(7);

              worker.onmessage = (e) => {
                if (e.data.id === validationId && e.data.type === 'VALIDATION_SUCCESS') {
                  resolve(e.data.payload);
                  worker.terminate();
                }
              };

              worker.onerror = (err) => {
                console.error('[DFM Worker Error]', err);
                resolve(analyzeMeshDFM(meshData));
                worker.terminate();
              };

              worker.postMessage({ meshData, id: validationId });
            });

            if (!isCancelled) {
              updateObject(object.id, {
                meshData,
                validation,
                updatedAt: Date.now(),
              });
              setIsGenerating(false);
            }
          }
        } catch (err) {
          if (!isCancelled) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate mesh';
            setError(errorMessage);
            console.error(`JSCAD execution error (${lod}):`, err);
            setIsGenerating(false);
          }
          break; // Stop LOD progression on error
        }
      }
    };

    generateMesh();

    return () => {
      isCancelled = true;
    };
  }, [object.jscadCode, object.id, updateObject]);

  // Cleanup Three.js objects when component unmounts or geometry changes
  useEffect(() => {
    return () => {
      // Dispose of geometry when component unmounts or geometry changes
      if (geometry) {
        geometry.dispose();
      }
    };
  }, [geometry]);

  // Dispose material when component unmounts
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  // Handle selection
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectObject(object.id, e.shiftKey); // Shift for multi-select
  };

  // Handle hover
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setIsHovered(false);
    document.body.style.cursor = 'auto';
  };

  // Reset cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  // Don't render if not visible
  if (!object.visible) return null;

  // Show loading state
  if (isGenerating) {
    return (
      <mesh position={object.position}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#444444" transparent opacity={0.5} />
        <Html center>
          <div className="bg-gray-800 text-white px-2 py-1 rounded text-sm">
            Generating...
          </div>
        </Html>
      </mesh>
    );
  }

  // Show error state
  if (error) {
    return (
      <mesh position={object.position}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ef4444" />
        <Html center>
          <div className="bg-red-900 text-white px-2 py-1 rounded text-sm max-w-48">
            Error: {error}
          </div>
        </Html>
      </mesh>
    );
  }

  // Don't render if no geometry yet
  if (!geometry) return null;

  return (
    <>
      <group 
        ref={groupRef}
        position={object.position} 
        rotation={object.rotation} 
        scale={object.scale}
      >
        <mesh
          ref={meshRef}
          geometry={geometry}
          material={material}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          castShadow
          receiveShadow
        >
          {/* Selection outline */}
          {isSelected && (
            <Outlines
              thickness={SCENE.OUTLINE_THICKNESS}
              color={SCENE.SELECTION_COLOR}
            />
          )}

          {/* Hover outline */}
          {isHovered && !isSelected && (
            <Outlines
              thickness={1}
              color={SCENE.HOVER_COLOR}
            />
          )}
        </mesh>

        {/* Object label when selected */}
        {isSelected && (
          <Html position={[0, 2, 0]} center>
            <div className="bg-gray-800/90 text-white px-2 py-1 rounded text-xs pointer-events-none whitespace-nowrap backdrop-blur-sm">
              {object.name}
            </div>
          </Html>
        )}
      </group>
      
      {/* TransformControls gizmo when selected and mounted */}
      {isSelected && isMounted && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode={transformMode}
          onMouseUp={handleTransformChange}
          size={0.6}
        />
      )}
    </>
  );
}
