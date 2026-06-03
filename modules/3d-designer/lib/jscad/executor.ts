import { JSCADGeometry, JSCADGeometryWithPolygons, MeshData } from '@/types';
import { JSCAD, ERROR_CODES } from '@/lib/constants';
import { validateJSCADCode, ValidationResult } from './validator';

// Cache for JSCAD execution results to avoid regenerating identical geometry
const jscadCache = new Map<string, JSCADGeometry>();
const MAX_CACHE_SIZE = 50; // Limit cache size to prevent memory issues

// Store last validation result for debugging
let lastValidationResult: ValidationResult | null = null;

/**
 * Get the last validation result (useful for debugging/UI feedback)
 */
export function getLastValidationResult(): ValidationResult | null {
  return lastValidationResult;
}

/**
 * All functions/variables provided by the worker API.
 * These should NOT be redefined in user code - they're already globals.
 */
const WORKER_PROVIDED_GLOBALS = [
  // Primitives
  'cuboid', 'cube', 'box', 'roundedCuboid', 'roundedBox',
  'cylinder', 'roundedCylinder', 'sphere', 'torus', 'ellipsoid',
  'geodesicSphere', 'polyhedron',
  // 2D shapes
  'circle', 'ellipse', 'rectangle', 'roundedRectangle', 'polygon', 'star',
  // Extrusions
  'extrudeLinear', 'extrudeRotate', 'extrudeRectangular', 'extrudeFromSlices', 'project',
  // Booleans
  'union', 'subtract', 'intersect', 'scission',
  // Transforms
  'translate', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'mirror', 'center', 'align',
  // Hulls & Expansions
  'hull', 'hullChain', 'expand', 'offset',
  // Measurements
  'measureBoundingBox', 'measureVolume', 'measureArea', 'measureCenter',
  // Colors
  'colorize', 'colors',
  // Utilities
  'degToRad', 'radToDeg', 'PI',
  // Custom helpers provided by worker
  'tube', 'cone', 'pyramid', 'wedge', 'grid', 'circularArray',
  // Console
  'console',
];

/**
 * Preprocess JSCAD code to make it compatible with the worker environment.
 * The worker already provides all JSCAD primitives as globals, so we need to:
 * 1. Remove require('@jscad/modeling') statements
 * 2. Remove const destructuring of primitives that are already provided
 * 3. Remove custom helper function definitions that duplicate worker globals
 * 4. Remove duplicate constant declarations (AI often declares same constant twice)
 * 5. Extract and return the main() function result
 */
function preprocessJSCADCode(code: string): string {
  let processed = code;
  
  // =========================================================================
  // STEP 1: Remove all require/import statements for @jscad/modeling
  // =========================================================================
  
  // Remove: const jscad = require('@jscad/modeling')
  processed = processed.replace(
    /const\s+jscad\s*=\s*require\s*\(\s*['"]@jscad\/modeling['"]\s*\)\s*;?/g, 
    ''
  );
  
  // Remove: const { ... } = jscad.anything
  processed = processed.replace(
    /const\s+\{\s*[^}]+\}\s*=\s*jscad\.\w+\s*;?/g, 
    ''
  );
  
  // Remove: const { ... } = require('@jscad/modeling').anything  
  processed = processed.replace(
    /const\s+\{\s*[^}]+\}\s*=\s*require\s*\(\s*['"]@jscad\/modeling['"]\s*\)\.\w+\s*;?/g, 
    ''
  );
  
  // Remove: const { ... } = require('@jscad/modeling/src/...')
  processed = processed.replace(
    /const\s+\{\s*[^}]+\}\s*=\s*require\s*\(\s*['"]@jscad\/modeling\/[^'"]+['"]\s*\)\s*;?/g, 
    ''
  );
  
  // Remove ES6 imports: import * as jscad from '@jscad/modeling'
  processed = processed.replace(
    /import\s+\*\s+as\s+\w+\s+from\s+['"]@jscad\/modeling['"]\s*;?/g, 
    ''
  );
  
  // Remove ES6 imports: import { ... } from '@jscad/modeling...'
  processed = processed.replace(
    /import\s+\{\s*[^}]+\}\s+from\s+['"]@jscad\/modeling[^'"]*['"]\s*;?/g, 
    ''
  );
  
  // =========================================================================
  // STEP 2: Remove module.exports and export statements
  // =========================================================================
  
  processed = processed.replace(/module\.exports\s*=\s*\{\s*main\s*\}\s*;?/g, '');
  processed = processed.replace(/module\.exports\s*=\s*\{\s*main:\s*main\s*\}\s*;?/g, '');
  processed = processed.replace(/module\.exports\s*=\s*main\s*;?/g, '');
  processed = processed.replace(/module\.exports\s*=\s*\{[^}]*\}\s*;?/g, '');
  processed = processed.replace(/export\s+default\s+main\s*;?/g, '');
  processed = processed.replace(/export\s+\{\s*main\s*\}\s*;?/g, '');
  processed = processed.replace(/export\s+\{[^}]*\}\s*;?/g, '');
  
  // =========================================================================
  // STEP 3: Remove custom function definitions that shadow worker globals
  // =========================================================================
  
  // Build a pattern to match any worker-provided function name
  // We need to be careful to only remove DEFINITIONS, not USAGES
  for (const funcName of WORKER_PROVIDED_GLOBALS) {
    // Skip common names that might be legitimately defined differently
    if (['PI', 'console', 'colors'].includes(funcName)) continue;
    
    // Pattern 1: const funcName = (args) => expression;
    // This handles both single-line and multiline arrow functions
    const arrowPattern = new RegExp(
      `(^|\\n)\\s*const\\s+${funcName}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*[^;{]+;`,
      'g'
    );
    processed = processed.replace(arrowPattern, '$1// ' + funcName + ' is provided by worker');
    
    // Pattern 2: const funcName = (args) => { ... }; (with braces)
    // Need to handle nested braces properly
    const arrowWithBracesPattern = new RegExp(
      `(^|\\n)\\s*const\\s+${funcName}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*\\{`,
      'g'
    );
    let match;
    while ((match = arrowWithBracesPattern.exec(processed)) !== null) {
      const startIndex = match.index;
      const braceStart = processed.indexOf('{', startIndex + match[0].length - 1);
      if (braceStart === -1) continue;
      
      // Find matching closing brace
      let braceCount = 1;
      let endIndex = braceStart + 1;
      while (endIndex < processed.length && braceCount > 0) {
        if (processed[endIndex] === '{') braceCount++;
        if (processed[endIndex] === '}') braceCount--;
        endIndex++;
      }
      
      // Include trailing semicolon if present
      if (processed[endIndex] === ';') endIndex++;
      
      // Replace the entire function definition
      const beforeMatch = processed.substring(0, startIndex);
      const afterMatch = processed.substring(endIndex);
      processed = beforeMatch + '\n// ' + funcName + ' is provided by worker' + afterMatch;
      
      // Reset regex since we modified the string
      arrowWithBracesPattern.lastIndex = 0;
    }
    
    // Pattern 3: function funcName(args) { ... }
    const funcDeclPattern = new RegExp(
      `(^|\\n)\\s*function\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{`,
      'g'
    );
    while ((match = funcDeclPattern.exec(processed)) !== null) {
      const startIndex = match.index;
      const braceStart = processed.indexOf('{', startIndex);
      if (braceStart === -1) continue;
      
      let braceCount = 1;
      let endIndex = braceStart + 1;
      while (endIndex < processed.length && braceCount > 0) {
        if (processed[endIndex] === '{') braceCount++;
        if (processed[endIndex] === '}') braceCount--;
        endIndex++;
      }
      
      const beforeMatch = processed.substring(0, startIndex);
      const afterMatch = processed.substring(endIndex);
      processed = beforeMatch + '\n// ' + funcName + ' is provided by worker' + afterMatch;
      funcDeclPattern.lastIndex = 0;
    }
    
    // Pattern 4: const funcName = function(args) { ... }
    const funcExprPattern = new RegExp(
      `(^|\\n)\\s*const\\s+${funcName}\\s*=\\s*function\\s*\\([^)]*\\)\\s*\\{`,
      'g'
    );
    while ((match = funcExprPattern.exec(processed)) !== null) {
      const startIndex = match.index;
      const braceStart = processed.indexOf('{', startIndex);
      if (braceStart === -1) continue;
      
      let braceCount = 1;
      let endIndex = braceStart + 1;
      while (endIndex < processed.length && braceCount > 0) {
        if (processed[endIndex] === '{') braceCount++;
        if (processed[endIndex] === '}') braceCount--;
        endIndex++;
      }
      
      if (processed[endIndex] === ';') endIndex++;
      
      const beforeMatch = processed.substring(0, startIndex);
      const afterMatch = processed.substring(endIndex);
      processed = beforeMatch + '\n// ' + funcName + ' is provided by worker' + afterMatch;
      funcExprPattern.lastIndex = 0;
    }
  }
  
  // =========================================================================
  // STEP 4: Remove duplicate constant declarations
  // =========================================================================
  
  processed = removeDuplicateConstants(processed);
  
  // =========================================================================
  // STEP 5: Clean up and add main() call
  // =========================================================================
  
  // Clean up multiple empty lines
  processed = processed.replace(/\n\s*\n\s*\n+/g, '\n\n');
  
  // Clean up lines that are just comments from our replacements
  processed = processed.replace(/^\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n/gm, '');
  
  // Add a call to main() at the end if it exists and return its result
  if (processed.includes('const main') || processed.includes('function main')) {
    processed = processed + '\nreturn main();';
  }
  
  return processed.trim();
}

/**
 * Remove duplicate constant declarations inside main() if they already exist at module scope.
 * AI models often declare the same constant (like WALL) both at module scope and inside main().
 */
function removeDuplicateConstants(code: string): string {
  // Find all module-scope constant names (before main function)
  const mainMatch = code.match(/const\s+main\s*=\s*\(\s*\)\s*=>\s*\{/);
  if (!mainMatch || mainMatch.index === undefined) return code;
  
  const beforeMain = code.substring(0, mainMatch.index);
  
  // Extract constant names declared at module scope
  const moduleConstPattern = /const\s+([A-Z][A-Z_0-9]*)\s*=/g;
  const moduleConstants = new Set<string>();
  let constMatch;
  while ((constMatch = moduleConstPattern.exec(beforeMain)) !== null) {
    if (constMatch[1]) {
      moduleConstants.add(constMatch[1]);
    }
  }
  
  if (moduleConstants.size === 0) return code;
  
  // Find main function body
  const mainStart = mainMatch.index + mainMatch[0].length;
  let braceCount = 1;
  let mainEnd = mainStart;
  for (let i = mainStart; i < code.length && braceCount > 0; i++) {
    if (code[i] === '{') braceCount++;
    if (code[i] === '}') braceCount--;
    mainEnd = i;
  }
  
  let mainBody = code.substring(mainStart, mainEnd);
  
  // Remove duplicate declarations from main body
  for (const constName of moduleConstants) {
    // Match const NAME = value; and replace with comment
    const duplicatePattern = new RegExp(`const\\s+${constName}\\s*=\\s*[^;]+;`, 'g');
    mainBody = mainBody.replace(duplicatePattern, `// ${constName} already declared at module scope`);
  }
  
  // Reconstruct code
  return code.substring(0, mainStart) + mainBody + code.substring(mainEnd);
}

/**
 * Execute JSCAD code using a bundled worker for deterministic behavior.
 * Includes timeout handling to prevent infinite execution.
 * Results are cached to improve performance for repeated identical code.
 * 
 * Now includes automatic validation and optimization of AI-generated code.
 */
export async function executeJSCAD(code: string): Promise<JSCADGeometry> {
  // Validate and optimize the code before preprocessing
  const validation = validateJSCADCode(code);
  lastValidationResult = validation;
  
  // Log validation results for debugging
  if (validation.warnings.length > 0) {
    console.log('[JSCAD] Validation warnings:', validation.warnings.map(w => w.message).join(', '));
  }
  if (validation.errors.length > 0) {
    console.warn('[JSCAD] Validation errors:', validation.errors.map(e => e.message).join(', '));
  }
  console.log('[JSCAD] Estimated complexity:', validation.estimatedComplexity);
  
  // CRITICAL: Stop execution if fatal errors detected (e.g., hallucinated APIs)
  const fatalErrors = validation.errors.filter(e => e.fatal);
  if (fatalErrors.length > 0) {
    const errorMessages = fatalErrors.map(e => e.message).join('\n\n');
    const error = new Error(
      `Code validation failed - AI generated invalid code:\n\n${errorMessages}\n\n` +
      `Try asking the AI to use a simpler approach or ask it what JSCAD functions are available.`
    );
    error.name = 'JSCAD_VALIDATION_ERROR';
    throw error;
  }
  
  // Use the optimized code
  const codeToProcess = validation.optimizedCode;
  
  // Preprocess code to make it compatible with worker environment
  const processedCode = preprocessJSCADCode(codeToProcess);
  
  // Check cache first for performance
  const cacheKey = processedCode.trim();
  
  // Validate cache key to prevent issues
  if (!cacheKey || cacheKey.length > 10000) {
    throw new Error('Invalid code for JSCAD execution');
  }
  
  const cached = jscadCache.get(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    let worker: Worker | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Create worker with error handling
      worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

      // Create timeout promise to prevent infinite execution
      timeoutId = setTimeout(() => {
        if (worker) {
          worker.terminate();
          worker = null;
        }
        reject(new Error(`JSCAD execution timeout after ${JSCAD.EXECUTION_TIMEOUT}ms - code may contain infinite loops or complex calculations`));
      }, JSCAD.EXECUTION_TIMEOUT);

      // Main execution promise
      const executionPromise = new Promise<JSCADGeometry>((resolvePromise, rejectPromise) => {
        if (!worker) {
          rejectPromise(new Error('Failed to create worker'));
          return;
        }
        
        worker.onmessage = (event) => {
          const { type, result, error, args } = event.data;

          if (type === 'result') {
            // Cache the result for future use (with size limit)
            if (jscadCache.size >= MAX_CACHE_SIZE) {
              // Remove oldest entry (simple FIFO)
              const firstKey = jscadCache.keys().next().value;
              if (firstKey) {
                jscadCache.delete(firstKey);
              }
            }
            jscadCache.set(cacheKey, result);
            resolvePromise(result);
            return;
          }

          if (type === 'error') {
            const message = typeof error === 'string'
              ? error
              : Array.isArray(error)
                ? error.join(' ')
                : 'JSCAD execution failed';
          
            const errorObj = new Error(message);
            errorObj.name = ERROR_CODES.JSCAD_EXECUTION_ERROR;
            rejectPromise(errorObj);
            return;
          }

          if (type === 'log' && args) {
            console.log('[JSCAD]', ...args);
            return;
          }

          if (type === 'warn' && args) {
            console.warn('[JSCAD]', ...args);
          }
        };

        worker.onerror = (error) => {
          console.error('Worker error:', error);
          const errorObj = new Error(`Worker error: ${error.message || 'Unknown worker error'}`);
          errorObj.name = ERROR_CODES.JSCAD_EXECUTION_ERROR;
          rejectPromise(errorObj);
        };

        worker.postMessage({ code: processedCode });
      });

      // Race between execution and timeout
      Promise.race([executionPromise, new Promise((_, timeoutReject) => {
        timeoutId = setTimeout(() => {
          timeoutReject(new Error('JSCAD execution timeout'));
        }, JSCAD.EXECUTION_TIMEOUT);
      })])
        .then((result) => {
          resolve(result as JSCADGeometry);
        })
        .catch((error) => {
          reject(error);
        });

    } catch (error) {
      // Cleanup on creation failure
      if (worker) {
        worker.terminate();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      const errorObj = error instanceof Error 
        ? error 
        : new Error('Failed to initialize JSCAD worker');
      errorObj.name = ERROR_CODES.JSCAD_EXECUTION_ERROR;
      reject(errorObj);
    } finally {
      // Ensure cleanup happens
      if (worker) {
        // Worker will be terminated by timeout or completion
        setTimeout(() => {
          if (worker) {
            worker.terminate();
            worker = null;
          }
        }, 1000); // Give some time for cleanup
      }
    }
  });
}

/**
 * Clear the JSCAD execution cache.
 * Useful for development and testing to ensure fresh execution.
 */
export function clearJSCADCache(): void {
  jscadCache.clear();
}

/**
 * Convert JSCAD geometry to Three.js-friendly mesh data.
 *
 * Transforms JSCAD polygon-based geometry into vertex, index, and normal arrays
 * suitable for Three.js BufferGeometry. Only processes geometry with polygons
 * (ignores shapes and paths which don't render as meshes).
 * 
 * IMPORTANT: JSCAD uses Z-up coordinate system, Three.js uses Y-up.
 * This function swaps Y and Z axes during conversion.
 *
 * @param jscadGeom - JSCAD geometry object(s) to convert
 * @returns Mesh data containing vertices, indices, and normals for Three.js
 *
 * @example
 * const geometry = await executeJSCAD('cube(10)');
 * const meshData = jscadToThreeJS(geometry);
 * // Use meshData.vertices, meshData.indices, meshData.normals with Three.js
 */
export function jscadToThreeJS(jscadGeom: JSCADGeometry): MeshData {
  const geometries = Array.isArray(jscadGeom) ? jscadGeom : [jscadGeom];
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];

  for (const geom of geometries) {
    if (geom && typeof geom === 'object' && 'polygons' in geom) {
      const polygons = (geom as JSCADGeometryWithPolygons).polygons || [];

      for (const polygon of polygons) {
        const points = polygon.vertices || [];

        // Ensure we have enough points for triangulation
        if (points.length < 3) continue;

        for (let i = 1; i < points.length - 1; i++) {
          const v0 = points[0];
          const v1 = points[i];
          const v2 = points[i + 1];

          // Validate vertices exist and are valid numbers
          if (!v0 || !v1 || !v2) continue;
          if (!Array.isArray(v0) || !Array.isArray(v1) || !Array.isArray(v2)) continue;
          
          // Convert from JSCAD (Z-up) to Three.js (Y-up) by swapping Y and Z
          // JSCAD: [x, y, z] where Z is up
          // Three.js: [x, y, z] where Y is up
          // So we map: JSCAD.x -> Three.x, JSCAD.z -> Three.y, JSCAD.y -> Three.z
          const v0_valid = [v0[0] ?? 0, v0[2] ?? 0, v0[1] ?? 0];
          const v1_valid = [v1[0] ?? 0, v1[2] ?? 0, v1[1] ?? 0];
          const v2_valid = [v2[0] ?? 0, v2[2] ?? 0, v2[1] ?? 0];

          vertices.push(...v0_valid, ...v1_valid, ...v2_valid);

          const baseIndex = vertices.length / 3 - 3;
          indices.push(baseIndex, baseIndex + 1, baseIndex + 2);

          const normal = calculateNormal(v0_valid, v1_valid, v2_valid);
          normals.push(...normal, ...normal, ...normal);
        }
      }
    }
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
    normals: new Float32Array(normals),
  };
}

/**
 * Calculate the normal vector for a triangle with null safety.
 */
function calculateNormal(p1: number[], p2: number[], p3: number[]): number[] {
  const v1 = [
    (p2[0] ?? 0) - (p1[0] ?? 0), 
    (p2[1] ?? 0) - (p1[1] ?? 0), 
    (p2[2] ?? 0) - (p1[2] ?? 0)
  ];
  const v2 = [
    (p3[0] ?? 0) - (p1[0] ?? 0), 
    (p3[1] ?? 0) - (p1[1] ?? 0), 
    (p3[2] ?? 0) - (p1[2] ?? 0)
  ];

  const normal = [
    (v1[1] ?? 0) * (v2[2] ?? 0) - (v1[2] ?? 0) * (v2[1] ?? 0),
    (v1[2] ?? 0) * (v2[0] ?? 0) - (v1[0] ?? 0) * (v2[2] ?? 0),
    (v1[0] ?? 0) * (v2[1] ?? 0) - (v1[1] ?? 0) * (v2[0] ?? 0),
  ];

  const length = Math.sqrt(
    (normal[0] ?? 0) * (normal[0] ?? 0) + 
    (normal[1] ?? 0) * (normal[1] ?? 0) + 
    (normal[2] ?? 0) * (normal[2] ?? 0)
  );
  
  if (length === 0) {
    return [0, 0, 1];
  }

  return [
    (normal[0] ?? 0) / length, 
    (normal[1] ?? 0) / length, 
    (normal[2] ?? 0) / length
  ];
}
