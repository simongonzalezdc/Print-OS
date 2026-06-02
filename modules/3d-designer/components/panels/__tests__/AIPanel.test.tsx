import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIPanel } from '../AIPanel';
import { useSceneStore } from '@/lib/scene/store';
import type { SceneStore } from '@/types';

vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: [],
    input: '',
    setInput: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
    status: 'ready' as const,
    error: undefined,
  }),
}));

beforeEach(() => {
  useSceneStore.setState({
    objects: new Map(),
    selectedIds: new Set(),
    setAIProcessing: vi.fn(),
  } as Partial<SceneStore>);

  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ isValid: true }),
    })
  ));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AIPanel - Floating Glassmorphic Panel', () => {
  it('renders the AI copilot panel with proper styling', async () => {
    const { container } = render(<AIPanel onToggle={() => {}} />);
    const panel = container.firstChild as HTMLElement;
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(panel.className).toContain('w-96');
    expect(panel.className).toContain('glass-pro-elevated');
  });

  it('calls onToggle when close button is clicked', async () => {
    const handleToggle = vi.fn();
    render(<AIPanel onToggle={handleToggle} />);
    const closeButton = screen.getByRole('button', { name: /Close AI panel/i });
    fireEvent.click(closeButton);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(handleToggle).toHaveBeenCalled();
  });

  it('displays AI Copilot header text', async () => {
    render(<AIPanel onToggle={() => {}} />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByText('AI Copilot')).toBeInTheDocument();
  });
});
