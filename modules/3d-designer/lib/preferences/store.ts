import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AI, AI_PROVIDERS, STORAGE_KEYS } from '@/lib/constants';
import type { AIProvider } from '@/lib/constants';

export interface AIProviderSettings {
  provider: AIProvider;
  model: string;
  apiKey?: string;
  baseURL?: string;
}

interface PreferencesStore {
  aiProvider: AIProviderSettings;
  voiceEnabled: boolean;
  setAIProvider: (settings: Partial<AIProviderSettings>) => void;
  setVoiceEnabled: (enabled: boolean) => void;
}

const defaultProvider = AI.DEFAULT_PROVIDER;

const defaultAISettings: AIProviderSettings = {
  provider: defaultProvider,
  model: AI.DEFAULT_MODELS[defaultProvider],
  baseURL: defaultProvider === AI_PROVIDERS.OLLAMA ? 'http://localhost:11434' : undefined,
};

const memoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const usePreferencesStore = create(
  persist<PreferencesStore>(
    (set, get) => ({
      aiProvider: defaultAISettings,
      voiceEnabled: true,
      setAIProvider: (settings) =>
        set({
          aiProvider: {
            ...get().aiProvider,
            ...settings,
          },
        }),
      setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
    }),
    {
      name: STORAGE_KEYS.PREFERENCES,
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? memoryStorage : localStorage
      ),
    }
  )
);

