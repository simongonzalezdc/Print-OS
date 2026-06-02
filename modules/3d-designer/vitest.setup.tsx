import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Polyfill ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Three.js and React Three Fiber to avoid WebGL context issues in tests
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useThree: () => ({
    camera: { position: [0, 0, 0] },
    gl: { domElement: document.createElement('canvas') },
    viewport: { width: 100, height: 100, factor: 1 },
    invalidate: vi.fn(),
  }),
  useFrame: vi.fn(),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Stage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Grid: () => null,
  Environment: () => null,
  PerformanceMonitor: () => null,
  AdaptiveDpr: () => null,
  AdaptiveEvents: () => null,
  Bvh: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Stats: () => null,
  Preload: () => null,
}));

// Mock IndexedDB for testing
if (typeof window !== 'undefined' && !window.indexedDB) {
  const mockRequest = {
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    result: {
      createObjectStore: vi.fn().mockReturnValue({
        createIndex: vi.fn(),
      }),
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          get: vi.fn().mockReturnValue({ onsuccess: null }),
          put: vi.fn().mockReturnValue({ onsuccess: null }),
          delete: vi.fn().mockReturnValue({ onsuccess: null }),
          clear: vi.fn().mockReturnValue({ onsuccess: null }),
        }),
        oncomplete: null,
        onerror: null,
      }),
    },
  };

  const mockIDB = {
    open: vi.fn().mockReturnValue(mockRequest),
    deleteDatabase: vi.fn().mockReturnValue(mockRequest),
  };

  window.indexedDB = mockIDB as unknown as IDBFactory;
}
