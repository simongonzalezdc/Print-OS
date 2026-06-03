import { useSceneStore } from '@/lib/scene/store';
import { toast } from 'sonner';

export interface VoiceCommand {
  keywords: string[];
  action: (transcript: string) => void;
  description: string;
}

/**
 * Registry of system voice commands.
 */
export const VOICE_COMMANDS: VoiceCommand[] = [
  {
    keywords: ['undo', 'go back', 'revert'],
    action: () => {
      useSceneStore.getState().undo();
      toast.info('Action undone via voice');
    },
    description: 'Undo last action'
  },
  {
    keywords: ['redo', 'go forward'],
    action: () => {
      useSceneStore.getState().redo();
      toast.info('Action redone via voice');
    },
    description: 'Redo last action'
  },
  {
    keywords: ['clear', 'delete everything', 'reset scene'],
    action: () => {
      const store = useSceneStore.getState();
      store.deselectAll();
      const allIds = Array.from(store.objects.keys());
      allIds.forEach(id => store.deleteObject(id));
      toast.error('Scene cleared via voice');
    },
    description: 'Clear the entire scene'
  },
  {
    keywords: ['select all', 'choose everything'],
    action: () => {
      const store = useSceneStore.getState();
      const allIds = Array.from(store.objects.keys());
      allIds.forEach(id => store.selectObject(id, true));
      toast.info('All objects selected');
    },
    description: 'Select all objects'
  },
  {
    keywords: ['deselect', 'stop selection'],
    action: () => {
      useSceneStore.getState().deselectAll();
      toast.info('Selection cleared');
    },
    description: 'Deselect all objects'
  },
  {
    keywords: ['move', 'translate mode'],
    action: () => {
      useSceneStore.getState().setTransformMode('translate');
      toast.info('Switched to MOVE mode');
    },
    description: 'Switch to move mode'
  },
  {
    keywords: ['rotate mode'],
    action: () => {
      useSceneStore.getState().setTransformMode('rotate');
      toast.info('Switched to ROTATE mode');
    },
    description: 'Switch to rotate mode'
  },
  {
    keywords: ['scale mode', 'resize mode'],
    action: () => {
      useSceneStore.getState().setTransformMode('scale');
      toast.info('Switched to SCALE mode');
    },
    description: 'Switch to scale mode'
  }
];

/**
 * Matches a transcript against registered commands.
 */
export function processVoiceCommand(transcript: string): boolean {
  const lower = transcript.toLowerCase();
  
  for (const cmd of VOICE_COMMANDS) {
    if (cmd.keywords.some(kw => lower.includes(kw))) {
      cmd.action(lower);
      return true;
    }
  }
  
  return false;
}

