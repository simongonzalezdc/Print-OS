# VoiceForge 3D - Export Pipeline & Orca Slicer Integration

> **Purpose:** Define the export workflow from generated models to print-ready files for Orca Slicer and other slicers.

---

## 1. Export Formats

### 1.1 Supported Formats

| Format | Extension | Best For | Orca Slicer |
|--------|-----------|----------|--------------|
| **3MF** | `.3mf` | **Preferred** - Full metadata | ✅ Native |
| **STL Binary** | `.stl` | Universal compatibility | ✅ Supported |
| **STL ASCII** | `.stl` | Human-readable, debugging | ✅ Supported |
| **OBJ** | `.obj` | With textures/materials | ✅ Supported |
| **STEP** | `.step` | CAD interchange | ❌ Not supported |

### 1.2 Why 3MF is Preferred

3MF (3D Manufacturing Format) includes:
- Mesh geometry
- Materials and colors
- Print settings
- Thumbnails
- Build plate position
- Metadata

**STL only contains:** Raw triangle mesh (no materials, no settings)

---

## 2. 3MF Export Implementation

### 2.1 3MF File Structure

3MF is a ZIP archive containing XML files:

```
model.3mf (ZIP archive)
├── [Content_Types].xml
├── _rels/
│   └── .rels
├── 3D/
│   └── 3dmodel.model          # Main geometry
├── Metadata/
│   └── thumbnail.png          # Preview image
└── Orca/                      # Orca Slicer extensions (optional)
    └── project_settings.config
```

### 2.2 Core 3MF Generation

```typescript
// lib/export/3mf.ts
import JSZip from 'jszip';

interface Model3MF {
  meshes: Mesh[];
  materials: Material[];
  buildItems: BuildItem[];
  metadata: Metadata;
}

export async function generate3MF(model: Model3MF): Promise<Blob> {
  const zip = new JSZip();
  
  // Content Types
  zip.file('[Content_Types].xml', generateContentTypes());
  
  // Relationships
  zip.folder('_rels');
  zip.file('_rels/.rels', generateRelationships());
  
  // 3D Model
  zip.folder('3D');
  zip.file('3D/3dmodel.model', generateModelXML(model));
  
  // Thumbnail (if available)
  if (model.metadata.thumbnail) {
    zip.folder('Metadata');
    zip.file('Metadata/thumbnail.png', model.metadata.thumbnail, { base64: true });
  }
  
  return await zip.generateAsync({ type: 'blob' });
}

function generateModelXML(model: Model3MF): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">${model.metadata.title}</metadata>
  <metadata name="Designer">VoiceForge 3D</metadata>
  <metadata name="CreationDate">${new Date().toISOString()}</metadata>
  
  <resources>
    ${model.materials.map((mat, i) => `
    <basematerials id="${i + 1}">
      <base name="${mat.name}" displaycolor="${mat.color}" />
    </basematerials>
    `).join('')}
    
    ${model.meshes.map((mesh, i) => `
    <object id="${100 + i}" type="model">
      <mesh>
        <vertices>
          ${mesh.vertices.map(v => 
            `<vertex x="${v[0]}" y="${v[1]}" z="${v[2]}" />`
          ).join('\n          ')}
        </vertices>
        <triangles>
          ${mesh.faces.map(f => 
            `<triangle v1="${f[0]}" v2="${f[1]}" v3="${f[2]}" />`
          ).join('\n          ')}
        </triangles>
      </mesh>
    </object>
    `).join('')}
  </resources>
  
  <build>
    ${model.buildItems.map(item => `
    <item objectid="${item.objectId}" transform="${item.transform}" />
    `).join('')}
  </build>
</model>`;
}
```

### 2.3 STL Export

```typescript
// lib/export/stl.ts

export function generateSTLBinary(mesh: Mesh): ArrayBuffer {
  const triangleCount = mesh.faces.length;
  const bufferSize = 84 + (triangleCount * 50); // Header + triangles
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);
  
  // Header (80 bytes)
  const header = 'VoiceForge 3D Export';
  for (let i = 0; i < 80; i++) {
    view.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
  }
  
  // Triangle count (4 bytes)
  view.setUint32(80, triangleCount, true);
  
  // Triangles (50 bytes each)
  let offset = 84;
  for (const face of mesh.faces) {
    const v0 = mesh.vertices[face[0]];
    const v1 = mesh.vertices[face[1]];
    const v2 = mesh.vertices[face[2]];
    
    // Calculate normal
    const normal = calculateNormal(v0, v1, v2);
    
    // Normal vector (12 bytes)
    view.setFloat32(offset, normal[0], true); offset += 4;
    view.setFloat32(offset, normal[1], true); offset += 4;
    view.setFloat32(offset, normal[2], true); offset += 4;
    
    // Vertex 1 (12 bytes)
    view.setFloat32(offset, v0[0], true); offset += 4;
    view.setFloat32(offset, v0[1], true); offset += 4;
    view.setFloat32(offset, v0[2], true); offset += 4;
    
    // Vertex 2 (12 bytes)
    view.setFloat32(offset, v1[0], true); offset += 4;
    view.setFloat32(offset, v1[1], true); offset += 4;
    view.setFloat32(offset, v1[2], true); offset += 4;
    
    // Vertex 3 (12 bytes)
    view.setFloat32(offset, v2[0], true); offset += 4;
    view.setFloat32(offset, v2[1], true); offset += 4;
    view.setFloat32(offset, v2[2], true); offset += 4;
    
    // Attribute byte count (2 bytes)
    view.setUint16(offset, 0, true); offset += 2;
  }
  
  return buffer;
}

export function generateSTLASCII(mesh: Mesh, name: string = 'model'): string {
  let stl = `solid ${name}\n`;
  
  for (const face of mesh.faces) {
    const v0 = mesh.vertices[face[0]];
    const v1 = mesh.vertices[face[1]];
    const v2 = mesh.vertices[face[2]];
    const normal = calculateNormal(v0, v1, v2);
    
    stl += `  facet normal ${normal[0]} ${normal[1]} ${normal[2]}\n`;
    stl += `    outer loop\n`;
    stl += `      vertex ${v0[0]} ${v0[1]} ${v0[2]}\n`;
    stl += `      vertex ${v1[0]} ${v1[1]} ${v1[2]}\n`;
    stl += `      vertex ${v2[0]} ${v2[1]} ${v2[2]}\n`;
    stl += `    endloop\n`;
    stl += `  endfacet\n`;
  }
  
  stl += `endsolid ${name}\n`;
  return stl;
}
```

---

## 3. Mesh Validation Before Export

### 3.1 Validation Checks

```typescript
// lib/export/validate.ts

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: MeshStats;
}

export function validateMesh(mesh: Mesh): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // 1. Check manifold (watertight)
  const boundaryEdges = findBoundaryEdges(mesh);
  if (boundaryEdges.length > 0) {
    errors.push({
      type: 'NON_MANIFOLD',
      message: `Mesh has ${boundaryEdges.length} open edges`,
      locations: boundaryEdges,
    });
  }
  
  // 2. Check for self-intersections
  const intersections = findSelfIntersections(mesh);
  if (intersections.length > 0) {
    errors.push({
      type: 'SELF_INTERSECTION',
      message: `${intersections.length} self-intersecting faces`,
      locations: intersections,
    });
  }
  
  // 3. Check face normals consistency
  const flippedFaces = findFlippedNormals(mesh);
  if (flippedFaces.length > 0) {
    warnings.push({
      type: 'FLIPPED_NORMALS',
      message: `${flippedFaces.length} faces have inconsistent normals`,
      autoFix: true,
    });
  }
  
  // 4. Check minimum wall thickness
  const thinWalls = findThinWalls(mesh, 1.2); // 1.2mm minimum
  if (thinWalls.length > 0) {
    warnings.push({
      type: 'THIN_WALLS',
      message: `${thinWalls.length} areas below minimum wall thickness`,
      locations: thinWalls,
    });
  }
  
  // 5. Check for degenerate triangles
  const degenerates = findDegenerateTriangles(mesh);
  if (degenerates.length > 0) {
    errors.push({
      type: 'DEGENERATE_TRIANGLES',
      message: `${degenerates.length} zero-area triangles`,
      autoFix: true,
    });
  }
  
  // 6. Check size
  const bounds = calculateBounds(mesh);
  const size = [
    bounds.max[0] - bounds.min[0],
    bounds.max[1] - bounds.min[1],
    bounds.max[2] - bounds.min[2],
  ];
  
// Common 3D printer build volume (250mm cube)
const BUILD_VOLUME = [250, 250, 250];
  if (size[0] > BUILD_VOLUME[0] || size[1] > BUILD_VOLUME[1] || size[2] > BUILD_VOLUME[2]) {
    errors.push({
      type: 'TOO_LARGE',
      message: `Model (${size.map(s => s.toFixed(1)).join('x')}mm) exceeds build volume`,
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      vertices: mesh.vertices.length,
      triangles: mesh.faces.length,
      boundingBox: bounds,
      volume: calculateVolume(mesh),
      surfaceArea: calculateSurfaceArea(mesh),
    },
  };
}
```

### 3.2 Auto-Repair Functions

```typescript
// lib/export/repair.ts

export function repairMesh(mesh: Mesh): Mesh {
  let repaired = { ...mesh };
  
  // 1. Remove degenerate triangles
  repaired = removeDegenerateFaces(repaired);
  
  // 2. Fix normal orientation
  repaired = fixNormalOrientation(repaired);
  
  // 3. Merge duplicate vertices
  repaired = mergeCloseVertices(repaired, 0.001);
  
  // 4. Fill small holes
  repaired = fillSmallHoles(repaired, 5); // holes < 5 edges
  
  // 5. Remove isolated vertices
  repaired = removeIsolatedVertices(repaired);
  
  return repaired;
}
```

---

## 4. Orca Slicer Integration

### 4.1 File Association

On Windows/Mac, associate `.3mf` files with Orca Slicer:

```typescript
// Trigger native file handler
function openInOrcaSlicer(filePath: string) {
  // On Electron/Tauri, use shell.openPath
  // In browser, user downloads and manually opens
}
```

### 4.2 Direct Workflow

1. **Generate model** → JSCAD code execution
2. **Validate mesh** → Check DFM rules
3. **Export 3MF** → With metadata and thumbnail
4. **Save locally** → To user's chosen location
5. **Open Orca Slicer** → User double-clicks or we launch

### 4.3 Recommended Orca Slicer Settings Hints

Include comments in metadata about suggested settings:

```typescript
const PRINT_HINTS = {
  structural_part: {
    layer_height: 0.2,
    infill: 40,
    wall_loops: 4,
    material: 'PETG',
  },
  decorative_part: {
    layer_height: 0.12,
    infill: 15,
    wall_loops: 3,
    material: 'PLA',
  },
  flexible_part: {
    layer_height: 0.2,
    infill: 20,
    wall_loops: 3,
    material: 'TPU',
  },
};
```

---

## 5. Export UI Flow

### 5.1 Export Dialog

```typescript
interface ExportOptions {
  format: '3mf' | 'stl-binary' | 'stl-ascii' | 'obj';
  filename: string;
  includeMetadata: boolean;
  generateThumbnail: boolean;
  autoRepair: boolean;
  openAfterExport: boolean;
}
```

### 5.2 Export Component

```tsx
function ExportPanel() {
  const [options, setOptions] = useState<ExportOptions>({
    format: '3mf',
    filename: 'model',
    includeMetadata: true,
    generateThumbnail: true,
    autoRepair: true,
    openAfterExport: false,
  });
  
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  
  const handleExport = async () => {
    const mesh = getCurrentMesh();
    
    // Validate
    const result = validateMesh(mesh);
    setValidation(result);
    
    if (!result.isValid && !options.autoRepair) {
      showErrorDialog(result.errors);
      return;
    }
    
    // Repair if needed
    const finalMesh = options.autoRepair ? repairMesh(mesh) : mesh;
    
    // Generate file
    let blob: Blob;
    let extension: string;
    
    switch (options.format) {
      case '3mf':
        blob = await generate3MF({
          meshes: [finalMesh],
          materials: getMaterials(),
          metadata: {
            title: options.filename,
            thumbnail: options.generateThumbnail 
              ? await generateThumbnail() 
              : undefined,
          },
        });
        extension = '3mf';
        break;
      
      case 'stl-binary':
        blob = new Blob([generateSTLBinary(finalMesh)]);
        extension = 'stl';
        break;
      
      case 'stl-ascii':
        blob = new Blob([generateSTLASCII(finalMesh, options.filename)]);
        extension = 'stl';
        break;
    }
    
    // Download
    downloadFile(blob, `${options.filename}.${extension}`);
    
    // Show success
    toast.success(`Exported ${options.filename}.${extension}`);
  };
  
  return (
    <div className="export-panel">
      <h3>Export Model</h3>
      
      <div className="format-selector">
        <label>Format:</label>
        <select 
          value={options.format}
          onChange={(e) => setOptions({...options, format: e.target.value})}
        >
          <option value="3mf">3MF (Recommended for Orca Slicer)</option>
          <option value="stl-binary">STL Binary</option>
          <option value="stl-ascii">STL ASCII</option>
          <option value="obj">OBJ</option>
        </select>
      </div>
      
      <div className="filename-input">
        <label>Filename:</label>
        <input 
          type="text"
          value={options.filename}
          onChange={(e) => setOptions({...options, filename: e.target.value})}
        />
      </div>
      
      <div className="options">
        <label>
          <input 
            type="checkbox"
            checked={options.autoRepair}
            onChange={(e) => setOptions({...options, autoRepair: e.target.checked})}
          />
          Auto-repair mesh issues
        </label>
        
        <label>
          <input 
            type="checkbox"
            checked={options.generateThumbnail}
            onChange={(e) => setOptions({...options, generateThumbnail: e.target.checked})}
          />
          Include thumbnail preview
        </label>
      </div>
      
      {validation && !validation.isValid && (
        <div className="validation-errors">
          <h4>Issues Found:</h4>
          {validation.errors.map((err, i) => (
            <div key={i} className="error">{err.message}</div>
          ))}
        </div>
      )}
      
      <button onClick={handleExport} className="export-button">
        Export for Orca Slicer
      </button>
      
      <p className="hint">
        After export, open the file in Orca Slicer to slice and print.
      </p>
    </div>
  );
}
```

---

## 6. Voice Commands for Export

| Command | Action |
|---------|--------|
| "Export as 3MF" | Export with default settings |
| "Export as STL" | Export STL binary |
| "Save for printing" | Export 3MF with validation |
| "Check if printable" | Run validation only |
| "Fix mesh issues" | Run auto-repair |
| "Send to Orca Slicer" | Export 3MF and open |

---

## 7. Error Handling

### 7.1 Common Export Errors

| Error | User Message | AI Fix |
|-------|-------------|--------|
| Non-manifold | "Model has holes. Should I attempt repair?" | Auto-fill holes |
| Self-intersect | "Parts of the model overlap. Should I fix?" | Boolean union |
| Too large | "Model exceeds print bed. Scale to fit?" | Scale to 95% of bed |
| Thin walls | "Some walls are too thin. Increase to 1.2mm?" | Thicken walls |

### 7.2 Recovery Flow

```typescript
async function exportWithRecovery(mesh: Mesh, options: ExportOptions) {
  const validation = validateMesh(mesh);
  
  if (!validation.isValid) {
    const userChoice = await showRepairDialog(validation);
    
    if (userChoice === 'repair') {
      mesh = repairMesh(mesh);
      const revalidation = validateMesh(mesh);
      
      if (!revalidation.isValid) {
        showError("Could not automatically repair. Please modify design.");
        return;
      }
    } else if (userChoice === 'cancel') {
      return;
    }
    // else: userChoice === 'export-anyway'
  }
  
  await performExport(mesh, options);
}
```
