import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js';
import { MeshData } from '@/types';

/**
 * Robust mesh importer using Three.js loaders
 */
export class MeshImporter {
  static async importFile(file: File): Promise<MeshData> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'stl') {
      return this.importSTL(file);
    } else if (extension === '3mf') {
      return this.import3MF(file);
    } else {
      throw new Error(`Unsupported file format: .${extension}`);
    }
  }

  private static async importSTL(file: File): Promise<MeshData> {
    const loader = new STLLoader();
    const buffer = await file.arrayBuffer();
    const geometry = loader.parse(buffer);
    
    return this.geometryToMeshData(geometry);
  }

  private static async import3MF(file: File): Promise<MeshData> {
    const loader = new ThreeMFLoader();
    const buffer = await file.arrayBuffer();
    
    return new Promise((resolve, reject) => {
      try {
        // ThreeMFLoader.parse returns a Group
        const group = loader.parse(buffer);
        const geometries: THREE.BufferGeometry[] = [];
        
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            geometries.push((child as THREE.Mesh).geometry);
          }
        });
        
        if (geometries.length === 0) {
          reject(new Error('No meshes found in 3MF file'));
          return;
        }
        
        // Merge all geometries into one for simplicity
        // In a real app we might want to keep them separate
        const merged = this.mergeGeometries(geometries);
        resolve(this.geometryToMeshData(merged));
      } catch (error) {
        reject(error);
      }
    });
  }

  private static mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    if (geometries.length === 1) return geometries[0]!;
    
    // Simple merge logic
    const totalVertices = geometries.reduce((sum, g) => sum + (g.getAttribute('position')?.count ?? 0), 0);
    const positions = new Float32Array(totalVertices * 3);
    const normals = new Float32Array(totalVertices * 3);
    
    let offset = 0;
    for (const g of geometries) {
      const posAttr = g.getAttribute('position');
      const normAttr = g.getAttribute('normal');
      if (!posAttr) continue;
      
      positions.set(posAttr.array as Float32Array, offset * 3);
      if (normAttr) {
        normals.set(normAttr.array as Float32Array, offset * 3);
      }
      
      offset += posAttr.count;
    }
    
    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    
    return merged;
  }

  private static geometryToMeshData(geometry: THREE.BufferGeometry): MeshData {
    // Ensure we have indexed geometry or convert to it
    let geo = geometry;
    if (!geo.index) {
      // For Three.js conversion, we can just use the non-indexed data
      // but indices are preferred for some operations
    }
    
    const positionAttr = geo.getAttribute('position');
    if (!positionAttr) {
      throw new Error('Imported geometry has no position attribute');
    }
    const normalAttr = geo.getAttribute('normal');
    const positions = positionAttr.array as Float32Array;
    const normals = normalAttr ? (normalAttr.array as Float32Array) : new Float32Array(positions.length);
    const indices = geo.index ? (geo.index.array as Uint32Array) : new Uint32Array(positions.length / 3).map((_, i) => i);

    return {
      vertices: positions,
      indices: indices,
      normals: normals
    };
  }
}
