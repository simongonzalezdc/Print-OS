# VoiceForge 3D - Design for Manufacturing (DFM) Knowledge Base

> **Purpose:** This document defines the 3D printing rules and constraints that the AI must apply when generating models. These rules ensure that every generated part is print-ready without manual repair.

---

## 1. FDM/FFF Printing Constraints

### 1.1 Wall Thickness

| Feature | Minimum | Recommended | Maximum |
|---------|---------|-------------|---------|
| **Outer walls** | 1.2mm (3 perimeters) | 1.6mm (4 perimeters) | No limit |
| **Internal walls** | 0.8mm (2 perimeters) | 1.2mm | No limit |
| **Thin features** | 0.4mm (1 line) | 0.8mm | N/A |
| **Embossed text** | 0.6mm depth | 1.0mm depth | N/A |
| **Engraved text** | 0.4mm depth | 0.8mm depth | N/A |

**AI Rule:** Never generate walls thinner than 1.2mm for structural parts. Warn user if thin features detected.

```typescript
const DFM_WALL_THICKNESS = {
  absolute_minimum: 0.4,  // Single extrusion width
  structural_minimum: 1.2, // 3 perimeters at 0.4mm
  recommended: 1.6,        // 4 perimeters
  default: 2.0,           // Safe default for functional parts
};
```

### 1.2 Overhangs

| Angle | Printability | AI Action |
|-------|-------------|-----------|
| 0-45° | Prints well | Allow |
| 45-60° | May need supports | Add chamfer or warn |
| 60-90° | Requires supports | Redesign or add supports |
| >90° | Impossible without supports | Always redesign |

**AI Rule:** Design with self-supporting angles. Use 45° chamfers instead of 90° overhangs.

```typescript
const DFM_OVERHANG = {
  safe_angle: 45,           // degrees from vertical
  max_without_support: 55,   // degrees, with quality loss
  chamfer_angle: 45,         // default chamfer for overhangs
};
```

### 1.3 Bridges (Horizontal Spans)

| Span Length | Quality | AI Action |
|-------------|---------|-----------|
| < 5mm | Excellent | Allow |
| 5-10mm | Good | Allow with warning |
| 10-20mm | Acceptable | Suggest redesign |
| > 20mm | Poor | Require supports or redesign |

**AI Rule:** Limit unsupported horizontal spans to 10mm. Add supports or redesign for longer bridges.

### 1.4 Holes and Cylinders

| Orientation | Issue | AI Solution |
|-------------|-------|-------------|
| Vertical holes | Slight ovality | Oversize by 0.2-0.4mm |
| Horizontal holes | Top sag | Use teardrop shape or supports |
| Screw holes | Need clearance | Use tap drill + 0.2mm |

**Standard Hole Sizes (Clearance):**

```typescript
const SCREW_HOLES = {
  M2: { tap: 1.6, clearance: 2.2, counterbore: 4.0 },
  M2_5: { tap: 2.05, clearance: 2.7, counterbore: 5.0 },
  M3: { tap: 2.5, clearance: 3.2, counterbore: 6.0 },
  M4: { tap: 3.3, clearance: 4.3, counterbore: 8.0 },
  M5: { tap: 4.2, clearance: 5.3, counterbore: 10.0 },
  M6: { tap: 5.0, clearance: 6.4, counterbore: 12.0 },
  M8: { tap: 6.8, clearance: 8.4, counterbore: 16.0 },
};
```

### 1.5 Tolerances and Fits

| Fit Type | Clearance | Use Case |
|----------|-----------|----------|
| **Interference** | -0.1mm | Press-fit pins |
| **Transition** | 0.0-0.1mm | Snap-fits |
| **Sliding** | 0.2-0.3mm | Moving parts |
| **Loose** | 0.4-0.5mm | Easy assembly |
| **Clearance** | 0.5mm+ | Space around components |

**AI Rule:** Always add printer tolerance to designed dimensions.

```typescript
const PRINTER_TOLERANCE = {
  xy_accuracy: 0.2,      // mm, typical XY accuracy
  z_accuracy: 0.1,       // mm, typical Z accuracy  
  default_clearance: 0.3, // mm, default gap for fits
  interference_fit: -0.1, // mm, for press-fits
};
```

### 1.6 First Layer (Elephant's Foot)

**Problem:** First layer squish causes bottom edge to bulge outward.

**AI Solution:** Add 0.5mm chamfer to all bottom edges.

```typescript
const FIRST_LAYER = {
  chamfer_height: 0.5,    // mm
  chamfer_angle: 45,      // degrees
  apply_to: 'bottom_edges',
};
```

### 1.7 Minimum Feature Sizes

| Feature | Minimum Size | Notes |
|---------|-------------|-------|
| **Holes** | 2.0mm diameter | Smaller may close up |
| **Pins/Posts** | 3.0mm diameter | Need strength |
| **Text height** | 5.0mm | For readability |
| **Text stroke** | 0.8mm | Minimum emboss width |
| **Slots** | 2.0mm width | May close due to oozing |
| **Details** | 0.4mm | Single extrusion width |

---

## 2. Part Orientation Rules

### 2.1 Strength Considerations

| Load Direction | Orientation | Reason |
|----------------|-------------|--------|
| **Tension** | Layers perpendicular to load | Maximize layer adhesion |
| **Compression** | Layers perpendicular to load | Even load distribution |
| **Bending** | Layers along length | Prevent delamination |
| **Shear** | Avoid if possible | Weakest failure mode |

**AI Rule:** Orient parts for optimal strength based on intended use.

### 2.2 Surface Quality

| Surface | Orientation | Result |
|---------|-------------|--------|
| **Top** | Horizontal | Smooth, accurate |
| **Bottom** | On bed | Glossy, accurate |
| **Sides** | Vertical | Layer lines visible |
| **Angled** | 45° | Stair-stepping |

**AI Rule:** Orient cosmetic surfaces horizontally (top or bottom).

---

## 3. Standard Component Dimensions

### 3.1 Fasteners

```typescript
const HEAT_SET_INSERTS = {
  M2: { hole_diameter: 3.2, depth: 4.0 },
  M2_5: { hole_diameter: 3.6, depth: 5.0 },
  M3: { hole_diameter: 4.0, depth: 5.7 },
  M4: { hole_diameter: 5.6, depth: 8.1 },
  M5: { hole_diameter: 6.4, depth: 9.5 },
};

const CAPTIVE_NUT_POCKETS = {
  M2: { width: 4.6, height: 1.8, depth: 2.5 },
  M3: { width: 5.7, height: 2.6, depth: 3.5 },
  M4: { width: 7.2, height: 3.4, depth: 4.5 },
  M5: { width: 8.2, height: 4.0, depth: 5.5 },
};
```

### 3.2 Electronics Components

```typescript
const ELECTRONICS = {
  'raspberry-pi-4': {
    pcb_size: [85.6, 56.5],
    pcb_thickness: 1.6,
    mounting_holes: [
      [3.5, 3.5], [61.5, 3.5], [3.5, 52.5], [61.5, 52.5]
    ],
    hole_size: 'M2.5',
    standoff_height: 5,
    total_height: 17,
    usb_ports: { position: [85.6, 10], size: [15, 15] },
    ethernet: { position: [85.6, 45], size: [16, 13.5] },
    gpio: { position: [4, 29], size: [51, 5] },
    power_usbc: { position: [10.6, 0], size: [9, 3] },
    hdmi: [
      { position: [26, 0], size: [8, 4.5] },
      { position: [39.5, 0], size: [8, 4.5] },
    ],
    sd_card: { position: [-2, 22], size: [15, 12] },
    heat_sources: [{ position: [43, 28], radius: 10 }],
  },

  'arduino-uno': {
    pcb_size: [68.6, 53.4],
    pcb_thickness: 1.6,
    mounting_holes: [
      [14, 2.5], [15.2, 50.8], [66, 7.6], [66, 35.6]
    ],
    hole_size: 'M3',
    standoff_height: 4,
    total_height: 15,
  },

  'arduino-nano': {
    pcb_size: [45, 18],
    pcb_thickness: 1.6,
    pin_header_width: 15.2,
    total_height: 8,
  },

  'esp32-devkit': {
    pcb_size: [51, 28],
    pcb_thickness: 1.6,
    pin_header_spacing: 22.86,
    total_height: 10,
  },

  'nema17-stepper': {
    face_size: 42.3,
    body_length: 40, // varies: 34, 40, 48mm
    shaft_diameter: 5,
    shaft_length: 24,
    shaft_flat: true,
    mounting_holes: { pattern: 'square', spacing: 31, size: 'M3' },
    pilot_diameter: 22,
    pilot_depth: 2,
  },
};
```

### 3.3 Common Enclosure Features

```typescript
const ENCLOSURE_FEATURES = {
  snap_fit: {
    hook_length: 3.0,
    hook_depth: 0.5,
    hook_angle: 45,
    undercut: 0.3,
    clearance: 0.2,
  },
  
  living_hinge: {
    thickness: 0.4,
    length_multiple: 5, // length = thickness * 5 minimum
    relief_radius: 1.0,
  },
  
  screw_boss: {
    wall_thickness: 2.5,
    pilot_hole_factor: 0.8, // hole = screw_diameter * factor
    depth_factor: 2.0,      // depth = screw_diameter * factor
    gusset_angle: 45,
  },
  
  ventilation: {
    min_hole_size: 2.0,
    max_open_area: 0.6, // 60% open
    bar_width: 1.2,
    pattern: 'honeycomb', // or 'slots', 'circles', 'diamonds'
  },
  
  cable_routing: {
    min_bend_radius: 10, // mm, for standard cables
    channel_width: 10,
    channel_depth: 5,
    strain_relief_length: 15,
  },
};
```

---

## 4. Print Profile Presets

### 4.1 Common Printer Profiles (Orca Slicer Compatible)

```typescript
const PRINTER_PROFILES = {
  'Generic_250': {
    build_volume: [250, 250, 250],
    nozzle_sizes: [0.2, 0.4, 0.6, 0.8],
    default_nozzle: 0.4,
    layer_heights: [0.08, 0.12, 0.16, 0.20, 0.24, 0.28],
    max_speed: 500,
    has_ams: false,
    has_lidar: false,
  },
  
  'Generic_300': {
    build_volume: [300, 300, 300],
    nozzle_sizes: [0.4, 0.6, 0.8],
    default_nozzle: 0.4,
    layer_heights: [0.08, 0.12, 0.16, 0.20, 0.24, 0.28],
    max_speed: 300,
    has_ams: false,
    has_lidar: false,
  },
  
  'Generic_220': {
    build_volume: [220, 220, 220],
    nozzle_sizes: [0.4],
    default_nozzle: 0.4,
    layer_heights: [0.08, 0.12, 0.16, 0.20, 0.24, 0.28],
    max_speed: 500,
    has_ams: true,
    has_lidar: false,
  },
};

const MATERIAL_PROFILES = {
  'PLA': {
    bed_temp: 55,
    nozzle_temp: 220,
    max_volumetric_flow: 24,
    shrinkage: 0.2, // percent
    supports_needed: false,
  },
  
  'PETG': {
    bed_temp: 80,
    nozzle_temp: 250,
    max_volumetric_flow: 18,
    shrinkage: 0.4,
    supports_needed: false,
  },
  
  'ABS': {
    bed_temp: 100,
    nozzle_temp: 260,
    max_volumetric_flow: 16,
    shrinkage: 0.8,
    supports_needed: true, // for warping prevention
    enclosure_required: true,
  },
  
  'TPU': {
    bed_temp: 50,
    nozzle_temp: 230,
    max_volumetric_flow: 8,
    shrinkage: 0.2,
    flexible: true,
    shore_hardness: 95,
  },
};
```

---

## 5. Validation Checklist

The AI must validate every generated model against this checklist:

```typescript
const VALIDATION_CHECKS = [
  // Geometry checks
  { id: 'manifold', description: 'Mesh is watertight', severity: 'error' },
  { id: 'no_self_intersect', description: 'No self-intersecting faces', severity: 'error' },
  { id: 'normals_consistent', description: 'Face normals point outward', severity: 'error' },
  { id: 'no_degenerate', description: 'No zero-area faces', severity: 'error' },
  
  // DFM checks
  { id: 'min_wall', description: 'Wall thickness >= 1.2mm', severity: 'error' },
  { id: 'max_overhang', description: 'Overhangs <= 45°', severity: 'warning' },
  { id: 'max_bridge', description: 'Bridges <= 10mm', severity: 'warning' },
  { id: 'min_hole', description: 'Holes >= 2mm diameter', severity: 'warning' },
  { id: 'elephant_foot', description: 'Bottom chamfers applied', severity: 'info' },
  
  // Printability checks
  { id: 'fits_build_volume', description: 'Fits in printer build volume', severity: 'error' },
  { id: 'reasonable_size', description: 'Size is reasonable for printing', severity: 'warning' },
  { id: 'orientation_optimal', description: 'Orientation optimized', severity: 'info' },
];
```

---

## 6. AI System Prompt Integration

The following should be included in Claude's system prompt:

```
You are a 3D printing design expert. When generating JSCAD code:

1. ALWAYS apply DFM rules:
   - Minimum wall thickness: 1.2mm for structural parts
   - Maximum overhang angle: 45° without supports
   - Add 0.3mm clearance for moving parts
   - Use standard screw hole sizes from the lookup table
   - Add 0.5mm chamfer to bottom edges (elephant's foot prevention)

2. ALWAYS validate dimensions:
 - Check part fits in build volume (250x250x250mm default)
   - Warn if features are smaller than 2mm
   - Confirm hole sizes match intended fasteners

3. ALWAYS consider print orientation:
   - Minimize supports needed
   - Orient for strength based on intended loads
   - Place cosmetic surfaces on top or bottom

4. When user specifies a component (e.g., "Raspberry Pi case"):
   - Use exact dimensions from component library
   - Add appropriate clearance (0.3-0.5mm)
   - Include mounting features automatically
   - Add ventilation if heat-generating components

5. Output JSCAD code that:
   - Uses descriptive variable names
   - Includes all DFM parameters as constants at top
   - Comments explain design decisions
   - Is parametric where appropriate
```

---

## 7. Quick Reference Card

### Minimum Values (FDM with 0.4mm nozzle)

| Feature | Minimum |
|---------|---------|
| Wall thickness | 1.2mm |
| Feature size | 0.4mm |
| Hole diameter | 2.0mm |
| Pin diameter | 3.0mm |
| Text height | 5.0mm |
| Bridge length | 10mm |
| Overhang angle | 45° |

### Clearances

| Fit Type | Clearance |
|----------|-----------|
| Press fit | -0.1mm |
| Snap fit | 0.1mm |
| Sliding | 0.3mm |
| Loose | 0.5mm |

### Screw Holes (Clearance)

| Screw | Hole Ø |
|-------|--------|
| M2 | 2.2mm |
| M2.5 | 2.7mm |
| M3 | 3.2mm |
| M4 | 4.3mm |
| M5 | 5.3mm |
