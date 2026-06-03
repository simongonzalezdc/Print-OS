import { Project, SceneObject, MeshData } from '@/types';

export const createMockMeshData = (overrides: Partial<MeshData> = {}): MeshData => ({
  vertices: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0]),
  indices: new Uint32Array([0, 1, 2]),
  normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
  ...overrides,
});

export const createMockSceneObject = (overrides: Partial<SceneObject> = {}): SceneObject => ({
  id: `obj-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Object',
  jscadCode: 'cube()',
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  color: '#ffffff',
  visible: true,
  locked: false,
  meshData: createMockMeshData(),
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
} as SceneObject);

export const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: `proj-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Project',
  description: 'A test project from factory',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  settings: {
    gridVisible: true,
    axesVisible: true,
    buildPlate: { x: 250, y: 250, z: 250 },
    displayUnits: 'mm',
  },
  objects: [],
  ...overrides,
});
