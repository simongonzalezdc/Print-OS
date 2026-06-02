# VoiceForge 3D – Codebase Audit

## Summary
- AI workflows are currently non-functional: the chat API contract does not match the client, and provider creation is executed on the client, risking secret exposure and runtime failures.
- Scene state management (undo/redo, auto-save) mutates state outside Zustand setters and touches `localStorage` at module scope, which will break SSR/hydration and prevents UI updates.
- Geometry/exports are unreliable: JSCAD conversion builds invalid normals and depends on a CDN mismatch; STL/3MF exports ignore transforms.
- Tests/tooling are red: `npm test` fails immediately because `jsdom` is missing (Vitest stays in watch mode afterwards).
- Panels and UI controls don’t reflect their props (collapse, toggle) and duplicate AI messages; several options are no-ops (e.g., export thumbnail/repair).

## Test/Tooling Run
- `npm test` → fails: `Cannot find dependency 'jsdom'`; Vitest keeps running in watch mode.

## Critical Findings
- AI API contract mismatch: `/api/ai/generate` expects `{ prompt }` (app/api/ai/generate/route.ts:12-37) but `useChat` sends `{ messages }`, so submissions return 400 and AI cannot generate anything.  
- Secrets & client bundle risk: `AIPanel` calls `validateAIProvider()` client-side (components/panels/AIPanel.tsx:92-108), which instantiates providers using server-only env vars (lib/ai/provider.ts:1-165). This can leak API keys into the browser and pulls server-side SDKs into the client bundle, likely throwing at runtime.  
- Undo/redo no-ops: `applyHistoryEntry` mutates `useSceneStore` state directly without `set` (lib/scene/store.ts:124-145, 244-266), so subscribers never update—history buttons won’t change the UI.  
- SSR breakage: `saveProject` and the autosave subscription touch `localStorage` at module scope (lib/scene/store.ts:159-179, 291-305). On server render this will throw and block hydration.  
- Invalid geometry conversion: `jscadToThreeJS` only writes normals for the first triangle (lib/jscad/executor.ts:131-172), producing mismatched attribute lengths and broken shading/exports.  
- Network/CSP dependency + version mismatch: JSCAD worker loads from `https://unpkg.com/@jscad/modeling@2.12.0` (lib/jscad/executor.ts:45-91) while the project depends on 2.12.6, and it fails offline/CSP environments despite the package already being installed.  
- Exports ignore transforms: `sceneObjectToMesh3MF` and `sceneObjectToSTLMesh` drop position/rotation/scale (lib/export/3mf.ts:175-182, lib/export/stl.ts:179-185), so exported files are always at the origin/unscaled.  
- Test suite broken: `jsdom` is not installed; `npm test` fails before running specs and stays in watch mode (Vitest 4.0.14).  

## High Findings
- Panel props unused: `isExpanded/onToggle` are ignored in AIPanel/CodePanel/PropertiesPanel/ExportPanel; page renders panels with width 0 but content still mounted (app/page.tsx:83-105, components/panels/AIPanel.tsx:17-200). Collapsing doesn’t save work, and existing Vitest tests (components/panels/__tests__/AIPanel.test.tsx:31-43) fail.  
- AI message duplication: Messages are pushed into `aiMessages` and also rendered from `useChat` state (components/panels/AIPanel.tsx:39-76, 92-164), so each exchange can display twice and bloat history.  
- STL export only handles one mesh: `ExportPanel` picks the first mesh for STL (components/panels/ExportPanel.tsx:56-118, 157-200) even when multiple objects are selected.  
- Export options are misleading: `includeThumbnail` and `autoRepair` toggles are rendered but never used (`autoRepair` is dead state, thumbnail requires unused `thumbnailData`).  
- React/Next compatibility risk: Package.json uses Next 16.0.4 with React 19.2.0 while `@react-three/fiber`/`drei` targets React 18; expect instability until those libs add React 19 support.  

## Medium Findings
- Geometry/material lifecycle: `SceneObject` creates new `MeshStandardMaterial` and `BufferGeometry` without disposing them on unmount/update and never resets the hand cursor on unmount (components/canvas/SceneObject.tsx:20-175), leading to GPU leaks and occasional stuck cursors.  
- `frameloop="demand"` without invalidation: `Scene` sets demand rendering (components/canvas/Scene.tsx) but does not call `invalidate` on state changes, so object updates may not render after the first frame.  
- Saving without a project: `Toolbar` calls `saveProject` even when `project` is null (components/ui/Toolbar.tsx, lib/scene/store.ts:159-179), giving the user no feedback and doing nothing.  
- Export normals ignored: STL/3MF writers recompute or ignore normals (lib/export/stl.ts, lib/export/3mf.ts), so smoothing/vertex normals from generated meshes are lost.  
- Unused imports/states throughout (e.g., CameraControls.tsx, Scene.tsx, panels) will fail `next lint` once run.  

## Low Findings / UX Nits
- Right sidebar keeps all panels mounted even when width is 0, increasing memory and hurting accessibility (tab focus goes to hidden controls).  
- Static “FPS: 60” overlay is hard-coded (app/page.tsx:75-80), which can mislead users when performance drops.  
- Color/number inputs in PropertiesPanel coerce invalid input to 0 immediately, making precise edits frustrating (components/panels/PropertiesPanel.tsx).  

## Recommendations (prioritized)
1) Fix AI pipeline: align the API with `useChat` message payloads, and move provider validation to the server to avoid leaking API keys.  
2) Refactor `useSceneStore` history/autosave to use `set`, guard `localStorage` behind `typeof window`, and add proper undo/redo logic.  
3) Replace the JSCAD worker with a bundled worker (no CDN), update to the installed modeling version, and regenerate normals/indices correctly (or call `BufferGeometry.computeVertexNormals`).  
4) Include transforms in export writers and support multi-mesh STL; wire up export options or hide them.  
5) Add `jsdom` dev dependency and a CI-friendly `vitest run` script; fix panel tests by honoring `isExpanded/onToggle`.  
6) Clean up unused imports/states and add disposal/cleanup for geometries/materials and cursors.  
