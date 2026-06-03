import * as THREE from 'three';
import { MeshData, Vector3Tuple } from '@/types';

export interface ExportMeshData {
  name: string;
  vertices: Float32Array;
  indices: Uint32Array;
  normals: Float32Array;
}

export function transformMeshData(
  meshData: MeshData,
  position: Vector3Tuple,
  rotation: Vector3Tuple,
  scale: Vector3Tuple
): MeshData {
  const transformMatrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(rotation[0], rotation[1], rotation[2])
  );
  transformMatrix.compose(
    new THREE.Vector3(position[0], position[1], position[2]),
    quaternion,
    new THREE.Vector3(scale[0], scale[1], scale[2])
  );

  const normalMatrix = new THREE.Matrix3().getNormalMatrix(transformMatrix);

  const transformedVertices = new Float32Array(meshData.vertices.length);
  const normalizedSource = ensureFloat32Length(meshData.normals, meshData.vertices.length);
  const transformedNormals = new Float32Array(meshData.vertices.length);
  const vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let i = 0; i < meshData.vertices.length; i += 3) {
    vertex.set(
      meshData.vertices[i] ?? 0,
      meshData.vertices[i + 1] ?? 0,
      meshData.vertices[i + 2] ?? 0
    );
    vertex.applyMatrix4(transformMatrix);
    transformedVertices[i] = vertex.x;
    transformedVertices[i + 1] = vertex.y;
    transformedVertices[i + 2] = vertex.z;
  }

  for (let i = 0; i < transformedNormals.length; i += 3) {
    normal.set(
      normalizedSource[i] ?? 0,
      normalizedSource[i + 1] ?? 0,
      normalizedSource[i + 2] ?? 0
    );
    normal.applyMatrix3(normalMatrix).normalize();
    transformedNormals[i] = normal.x;
    transformedNormals[i + 1] = normal.y;
    transformedNormals[i + 2] = normal.z;
  }

  return {
    vertices: transformedVertices,
    normals: transformedNormals,
    indices: meshData.indices,
  };
}

export function mergeExportMeshes(meshes: ExportMeshData[]): ExportMeshData {
  if (meshes.length === 0) {
    return {
      name: 'scene',
      vertices: new Float32Array(),
      indices: new Uint32Array(),
      normals: new Float32Array(),
    };
  }

  const totalVertices = meshes.reduce((sum, mesh) => sum + mesh.vertices.length, 0);
  const totalIndices = meshes.reduce((sum, mesh) => sum + mesh.indices.length, 0);

  const mergedVertices = new Float32Array(totalVertices);
  const mergedNormals = new Float32Array(totalVertices);
  const mergedIndices = new Uint32Array(totalIndices);

  let vertexCursor = 0;
  let indexCursor = 0;
  let baseVertex = 0;

  for (const mesh of meshes) {
    mergedVertices.set(mesh.vertices, vertexCursor);
    mergedNormals.set(ensureFloat32Length(mesh.normals, mesh.vertices.length), vertexCursor);

    for (let i = 0; i < mesh.indices.length; i += 3) {
      mergedIndices[indexCursor++] = (mesh.indices[i] ?? 0) + baseVertex;
      mergedIndices[indexCursor++] = (mesh.indices[i + 1] ?? 0) + baseVertex;
      mergedIndices[indexCursor++] = (mesh.indices[i + 2] ?? 0) + baseVertex;
    }

    baseVertex += mesh.vertices.length / 3;
    vertexCursor += mesh.vertices.length;
  }

  return {
    name: meshes.map((mesh) => mesh.name).filter(Boolean).join('_') || 'scene',
    vertices: mergedVertices,
    normals: mergedNormals,
    indices: mergedIndices,
  };
}

export function autoRepairMeshes(meshes: ExportMeshData[], enabled: boolean): ExportMeshData[] {
  if (!enabled) return meshes;
  return meshes.map((mesh) => ({
    ...mesh,
    normals: ensureFloat32Length(mesh.normals, mesh.vertices.length),
  }));
}

export function generateThumbnailData(): string {
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
}

function ensureFloat32Length(source: Float32Array, length: number): Float32Array {
  if (source.length === length) return source;
  const clone = new Float32Array(length);
  const copyLength = Math.min(source.length, length);
  clone.set(source.subarray(0, copyLength));
  return clone;
}
