# 3d-Designer Consolidation

## Decision

`Pastorsimon1798/Print-OS` is the canonical fabrication / 3D production container.
`Pastorsimon1798/3d-Designer` has been preserved under `modules/3d-designer/`.

## Why these belong together

Both repositories are about voice/AI-assisted 3D design and printable output:

- `Print-OS` / CAEDO is the broader integrated 3D design and manufacturing platform, with a web app, API, materials data, routing/costing, and smoke tests.
- `3d-Designer` / VoiceForge 3D is a voice-first, AI-powered parametric CAD app for 3D printing, with JSCAD, mesh/export workflows, local Ollama AI, and cloud AI options.

The overlap is high enough that keeping them as separate top-level repos would make future decisions harder. This consolidation preserves `3d-Designer` history and source material while making `Print-OS` the place to compare, merge, or retire overlapping implementations.

## Canonical path

Use `Print-OS` as the suite/container.

Current preserved source material:

- `modules/3d-designer/` — imported `3d-Designer` repository history and source.
- `caedo-web/` — existing Print-OS frontend implementation.
- `caedo-api/` — existing Print-OS backend / production logic.
- `shared/materials.json` — shared material data.

## Next consolidation step

Do not blindly replace `caedo-web` with `modules/3d-designer`. First compare:

1. Voice / natural language command UX.
2. JSCAD generation and validation.
3. Export formats: STL, 3MF, Orca Slicer metadata.
4. DFM / manufacturing constraints.
5. Local AI provider setup, especially Ollama.

After comparison, promote the best code paths into `caedo-web` and retire duplicate module code intentionally.
