'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { Outlines, Html, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '@/lib/scene/store';
import { SceneObject as SceneObjectType } from '@/types';
import { executeJSCAD, jscadToThreeJS } from '@/lib/jscad/executor';
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
  
  // Create material with proper cleanup handling
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: object.color,
      transparent: false,
      side: THREE.DoubleSide,
    });
    return mat;
  }, [object.color]);

  // Generate mesh from JSCAD code
  useEffect(() => {
    const generateMesh = async () => {
      // Defensive check: ensure jscadCode is a string
      if (!object.jscadCode || typeof object.jscadCode !== 'string' || !object.jscadCode.trim()) return;

      setIsGenerating(true);
      setError(null);

      try {
        // Execute JSCAD code
        const jscadGeom = await executeJSCAD(object.jscadCode);

        // Convert to Three.js geometry
        const meshData = jscadToThreeJS(jscadGeom);

        // Create Three.js buffer geometry
        const bufferGeometry = new THREE.BufferGeometry();
        bufferGeometry.setAttribute('position', new THREE.BufferAttribute(meshData.vertices, 3));
        bufferGeometry.setAttribute('normal', new THREE.BufferAttribute(meshData.normals, 3));
        bufferGeometry.setIndex(new THREE.BufferAttribute(meshData.indices, 1));

        bufferGeometry.computeBoundingBox();
        bufferGeometry.computeBoundingSphere();

        setGeometry(bufferGeometry);

        // Update object with generated mesh data
        updateObject(object.id, {
          meshData,
          updatedAt: Date.now(),
        });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate mesh';
        setError(errorMessage);
        console.error('JSCAD execution error:', err);
      } finally {
        setIsGenerating(false);
      }
    };

    generateMesh();
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

  // Dispose material when component unmounts or color changes
  useEffect(() => {
    return () => {
      // Dispose of material when component unmounts or color changes
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
