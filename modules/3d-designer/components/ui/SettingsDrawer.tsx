'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Link2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { usePreferencesStore } from '@/lib/preferences/store';
import { AI_PROVIDERS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  [AI_PROVIDERS.OLLAMA]: 'Ollama (Local)',
  [AI_PROVIDERS.ANTHROPIC]: 'Anthropic Claude',
  [AI_PROVIDERS.OPENAI]: 'OpenAI',
  [AI_PROVIDERS.GOOGLE]: 'Google Gemini',
  [AI_PROVIDERS.GROQ]: 'Groq',
  [AI_PROVIDERS.OPENROUTER]: 'OpenRouter',
  [AI_PROVIDERS.TOGETHER]: 'Together AI',
};

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { aiProvider, setAIProvider, voiceEnabled, setVoiceEnabled } = usePreferencesStore();
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (!open) {
      setIsTesting(false);
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [open]);

  if (!open) return null;

  const isOllama = aiProvider.provider === AI_PROVIDERS.OLLAMA;
  const requiresApiKey = !isOllama;
  const isProviderConfigured =
    (requiresApiKey && !!aiProvider.apiKey?.trim()) ||
    (!requiresApiKey && !!aiProvider.baseURL?.trim());

  const testOllamaConnection = async () => {
    if (!aiProvider.baseURL) {
      setTestStatus('error');
      setTestMessage('Base URL is required');
      return;
    }

    try {
      setIsTesting(true);
      setTestStatus('idle');
      setTestMessage('Testing connection...');

      const response = await fetch(`${aiProvider.baseURL.replace(/\/$/, '')}/api/tags`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setTestStatus('success');
      setTestMessage('Connected to Ollama successfully');
    } catch (error) {
      setTestStatus('error');
      setTestMessage(
        error instanceof Error ? error.message : 'Failed to connect to Ollama'
      );
    } finally {
      setIsTesting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative ml-auto w-full max-w-md h-full bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Settings</h2>
            <p className="text-sm text-gray-500">Configure AI providers and voice input</p>
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
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                AI Provider
              </h3>
            </div>

            <label className="text-sm text-gray-400 mb-2 block">Provider</label>
            <select
              value={aiProvider.provider}
              onChange={(e) =>
                setAIProvider({
                  provider: e.target.value as typeof aiProvider.provider,
                })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {Object.values(AI_PROVIDERS).map((provider) => (
                <option key={provider} value={provider}>
                  {PROVIDER_LABELS[provider] || provider}
                </option>
              ))}
            </select>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Model</label>
                <input
                  type="text"
                  value={aiProvider.model}
                  onChange={(e) => setAIProvider({ model: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g. claude-3.5-sonnet"
                />
              </div>

              {isOllama ? (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Base URL</label>
                  <input
                    type="text"
                    value={aiProvider.baseURL ?? ''}
                    onChange={(e) => setAIProvider({ baseURL: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="http://localhost:11434"
                  />
                  <button
                    onClick={testOllamaConnection}
                    disabled={isTesting}
                    className="mt-3 inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Link2 className="w-4 h-4" />
                    {isTesting ? 'Testing...' : 'Test Connection'}
                  </button>
                  {testStatus !== 'idle' && (
                    <p
                      className={cn(
                        'mt-2 text-sm',
                        testStatus === 'success' ? 'text-green-400' : 'text-red-400'
                      )}
                    >
                      {testMessage}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">API Key</label>
                  <input
                    type="password"
                    value={aiProvider.apiKey ?? ''}
                    onChange={(e) => setAIProvider({ apiKey: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="sk-..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    API key is stored locally and used for this session only.
                  </p>
                </div>
              )}

              {!isProviderConfigured && (
                <div className="flex items-start gap-2 bg-yellow-950 border border-yellow-800 rounded-lg px-3 py-2 text-xs text-yellow-200">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-yellow-500" />
                  <span>
                    {isOllama
                      ? 'Set your Ollama base URL to enable local AI generation.'
                      : 'Enter an API key to enable this provider.'}
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

