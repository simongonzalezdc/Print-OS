'use client';

import { useRef, useEffect, useCallback } from 'react';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '@/lib/scene/store';

interface TransformGizmoProps {
  objectRef: React.RefObject<THREE.Object3D>;
  objectId: string;
  enabled: boolean;
}

/**
 * TransformGizmo - Interactive transform handles for a single object
 * 
 * Provides move/rotate/scale gizmos like Blender, Fusion 360, etc.
 */
export function TransformGizmo({ objectRef, objectId, enabled }: TransformGizmoProps) {
  // TransformControls from drei wraps THREE.TransformControls
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  
  // Get store state
  const transformMode = useSceneStore((state) => state.transformMode);
  const updateObject = useSceneStore((state) => state.updateObject);
  
  // Handle transform end (commit changes to store)
  const handleMouseUp = useCallback(() => {
    if (!objectRef.current) return;
    
    const obj = objectRef.current;
    
    // Get the new transform values
    const position: [number, number, number] = [
      obj.position.x,
      obj.position.y,
      obj.position.z,
    ];
    
    const rotation: [number, number, number] = [
      obj.rotation.x,
      obj.rotation.y,
      obj.rotation.z,
    ];
    
    const scale: [number, number, number] = [
      obj.scale.x,
      obj.scale.y,
      obj.scale.z,
    ];
    
    // Update store
    updateObject(objectId, { position, rotation, scale });
  }, [objectId, objectRef, updateObject]);
  
  // Disable orbit controls while transforming
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    
    const callback = (event: { value: boolean }) => {
      // Disable orbit controls when dragging transform gizmo
      const orbitControls = document.querySelector('canvas')?.parentElement;
      if (orbitControls) {
        orbitControls.style.pointerEvents = event.value ? 'none' : 'auto';
      }
    };
    
    // drei TransformControls wraps THREE.TransformControls which has addEventListener
    if ('addEventListener' in controls && typeof controls.addEventListener === 'function') {
      controls.addEventListener('dragging-changed', callback);
    }
    
    return () => {
      if ('removeEventListener' in controls && typeof controls.removeEventListener === 'function') {
        controls.removeEventListener('dragging-changed', callback);
      }
    };
  }, []);
  
  if (!enabled || !objectRef.current) return null;
  
  return (
    <TransformControls
      ref={controlsRef}
      object={objectRef.current}
      mode={transformMode}
      onMouseUp={handleMouseUp}
      size={0.7}
      showX
      showY
      showZ
    />
  );
}
