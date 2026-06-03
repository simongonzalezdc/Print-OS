/**
 * Keyboard Shortcuts System
 * 
 * Handles global keyboard shortcuts for VoiceForge 3D editor
 */

import { useSceneStore } from '@/lib/scene/store';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd on Mac
  action: () => void;
  description: string;
}

/**
 * Setup keyboard shortcuts for the editor
 * Call this once in the main app component
 */
export function setupKeyboardShortcuts() {
  const handleKeyDown = (event: KeyboardEvent) => {
    const store = useSceneStore.getState();
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // Ctrl+Z / Cmd+Z: Undo
    if (ctrlOrCmd && !event.shiftKey && event.key === 'z') {
      event.preventDefault();
      store.undo();
      return;
    }

    // Ctrl+Shift+Z / Cmd+Shift+Z: Redo
    if (ctrlOrCmd && event.shiftKey && event.key === 'z') {
      event.preventDefault();
      store.redo();
      return;
    }

    // Ctrl+D / Cmd+D: Duplicate selected
    if (ctrlOrCmd && event.key === 'd') {
      event.preventDefault();
      const selectedIds = Array.from(store.selectedIds);
      const firstId = selectedIds[0];
      if (firstId) {
        // Duplicate first selected object
        store.duplicateObject(firstId);
      }
      return;
    }

    // Delete / Backspace: Delete selected
    if ((event.key === 'Delete' || event.key === 'Backspace') && !ctrlOrCmd) {
      event.preventDefault();
      if (store.selectedIds.size > 0) {
        store.deleteSelectedObjects();
      }
      return;
    }

    // Ctrl+A / Cmd+A: Select all
    if (ctrlOrCmd && event.key === 'a') {
      event.preventDefault();
      const allIds = Array.from(store.objects.keys());
      allIds.forEach(id => store.selectObject(id, true));
      return;
    }

    // Escape: Deselect all
    if (event.key === 'Escape') {
      event.preventDefault();
      store.deselectAll();
      return;
    }

    // G: Move mode (translate)
    if (event.key === 'g' && !ctrlOrCmd && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      store.setTransformMode('translate');
      return;
    }

    // R: Rotate mode
    if (event.key === 'r' && !ctrlOrCmd && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      store.setTransformMode('rotate');
      return;
    }

    // S: Scale mode
    if (event.key === 's' && !ctrlOrCmd && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      store.setTransformMode('scale');
      return;
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Get list of available shortcuts for help/display
 */
export function getShortcutsList(): Array<{ keys: string; description: string }> {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const mod = isMac ? '⌘' : 'Ctrl';

  return [
    { keys: `${mod}+Z`, description: 'Undo' },
    { keys: `${mod}+Shift+Z`, description: 'Redo' },
    { keys: `${mod}+D`, description: 'Duplicate selected' },
    { keys: 'Delete / Backspace', description: 'Delete selected' },
    { keys: `${mod}+A`, description: 'Select all' },
    { keys: 'Esc', description: 'Deselect all' },
    { keys: 'G', description: 'Move mode' },
    { keys: 'R', description: 'Rotate mode' },
    { keys: 'S', description: 'Scale mode' },
  ];
}

