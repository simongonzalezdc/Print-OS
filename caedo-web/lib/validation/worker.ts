import { MeshData } from '@/types';
import { DFMValidationOptions, validateDFM } from './dfm';

/**
 * Web Worker for Design-for-Manufacturability (DFM) analysis.
 * Handles heavy mesh processing off the main thread.
 */

self.onmessage = async (e: MessageEvent<{ 
  meshData: MeshData; 
  options?: DFMValidationOptions;
  id: string;
}>) => {
  const { meshData, options, id } = e.data;

  try {
    // Perform heavy validation
    const result = validateDFM(meshData, options);

    // Return results
    self.postMessage({
      type: 'VALIDATION_SUCCESS',
      id,
      payload: result
    });
  } catch (error) {
    self.postMessage({
      type: 'VALIDATION_ERROR',
      id,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    });
  }
};
