import { createPortal } from 'react-dom';
import { X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { usePreferencesStore } from '@/lib/preferences/store';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { aiProvider, setAIProvider, voiceEnabled, setVoiceEnabled } = usePreferencesStore();

  if (!open) return null;

  const isProviderConfigured = !!aiProvider.apiKey?.trim();

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative ml-auto w-full max-w-md h-full bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Settings</h2>
            <p className="text-sm text-gray-500">Configure GLM-4.7 Intelligence</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* AI Provider */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                AI_CORE (GLM-4.7)
              </h3>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Model</label>
                <input
                  type="text"
                  value={aiProvider.model}
                  disabled
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white/50 focus:outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">API Key (Handoff-Overload)</label>
                <input
                  type="password"
                  value={aiProvider.apiKey ?? ''}
                  onChange={(e) => setAIProvider({ apiKey: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  placeholder="sk-..."
                />
                <p className="text-xs text-secondary-foreground/40 mt-2">
                  ZhipuAI API key is used for parametric design and evaluation.
                </p>
              </div>

              {!isProviderConfigured && (
                <div className="flex items-start gap-2 bg-yellow-950/30 border border-yellow-800/50 rounded-lg px-3 py-2 text-xs text-yellow-200/70">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-yellow-500" />
                  <span>
                    No API key provided. System will use environment variables if available.
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Voice */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Voice Input
              </h3>
            </div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">Enable voice commands (Ctrl+Space)</span>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Requires Chrome, Edge, or Safari with microphone permissions enabled.
            </p>
          </section>
        </div>
      </aside>
    </div>,
    document.body
  );
}

