# Caedo 3D - Setup Guide

> Local-first parametric 3D design for Orca Slicer

---

## Quick Start

### Prerequisites

- **Node.js** 20+ (recommend 22 LTS)
- **pnpm** 9+ (or npm)
- **Browser:** Chrome/Edge (for Web Speech API)

### 1. Install Dependencies

```bash
# Clone the repository
git clone <repository-url> caedo-3d
cd caedo-3d

# Install dependencies
pnpm install
```

### 2. Configure AI Provider

Copy the environment template and choose your AI provider:

```bash
cp env.example.txt .env.local
```

Edit `.env.local` — you only need **ONE** AI provider:

**Option A: Local AI (Ollama) — Free, Private**
```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=codellama:13b
```

**Option B: Cloud AI (Anthropic) — Best Quality**
```bash
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

See [AI_PROVIDERS.md](./AI_PROVIDERS.md) for all options.

### 3. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Using Ollama (Fully Local)

For completely local operation with no cloud dependencies:

### Install Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

### Pull a Code Model

```bash
# Recommended for code generation
ollama pull codellama:13b

# Alternatives
ollama pull qwen2.5-coder:7b    # Fast, good quality
ollama pull deepseek-coder:6.7b # Great for code
ollama pull llama3.1:8b          # General purpose
```

### Start Ollama

```bash
ollama serve
```

### Configure Caedo 3D

In `.env.local`:
```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=codellama:13b
```

---

## Project Structure

```
caedo-3d/
├── app/
│   ├── page.tsx              # Main editor
│   └── api/v1/ai/generate/   # AI code generation endpoint (v1)
├── components/
│   ├── canvas/               # React Three Fiber viewport
│   ├── panels/               # UI panels (chat, code, export)
│   ├── providers/            # Context providers (WebSocket, etc.)
│   └── voice/                # Voice input
├── lib/
│   ├── jscad/                # JSCAD code executor
│   ├── export/               # 3MF/STL export
│   ├── ai/                   # AI provider integration
│   ├── hooks/                # Custom hooks (useWebSocket, etc.)
│   ├── constants/            # DFM rules, component specs
│   └── storage/              # IndexedDB local storage
├── knowledge/                # AI knowledge base
│   ├── templates/            # JSCAD starter templates
│   └── examples/             # AI few-shot examples
├── docs/
│   ├── DFM_KNOWLEDGE_BASE.md # Printing rules
│   ├── COMPONENT_LIBRARY.md  # RPi, Arduino dimensions
│   └── EXPORT_PIPELINE.md    # Orca Slicer export
└── types/                    # TypeScript definitions
```

---

## Development Commands

```bash
# Start development server
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test
```

---

## Troubleshooting

### Voice Recognition Not Working

1. **Check browser permissions** — Allow microphone access
2. **Use HTTPS in production** — Web Speech API requires secure context
3. **Try Chrome** — Best Web Speech API support

### AI Responses Slow

1. **Ollama:** Use a smaller model (`llama3.1:8b`)
2. **Cloud:** Check API status, try a different provider
3. **Network:** Ensure stable connection for cloud providers

### JSCAD Code Errors

1. Check browser console for error details
2. AI-generated code is validated — errors show in UI
3. Syntax errors are highlighted in code panel

### Export Issues

1. **Non-manifold mesh:** Use auto-repair option
2. **File too large:** Reduce triangle count
3. **Orca Slicer can't open:** Ensure valid 3MF structure

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `AI_PROVIDER` | Yes | Which AI to use: `ollama`, `anthropic`, `openai`, etc. |
| `ANTHROPIC_API_KEY` | If using Anthropic | Claude API key |
| `OPENAI_API_KEY` | If using OpenAI | GPT-4 API key |
| `OLLAMA_BASE_URL` | If using Ollama | Ollama server URL (default: `http://localhost:11434`) |
| `OLLAMA_MODEL` | If using Ollama | Model name (e.g., `codellama:13b`) |
| `NEXT_PUBLIC_ENABLE_VOICE` | No | Enable voice input (default: `true`) |
| `NEXT_PUBLIC_DEBUG_MODE` | No | Show debug overlays (default: `false`) |

---

## Next Steps

1. **Try voice commands:** Press the microphone or Ctrl+Space
2. **Ask the AI:** "Create a box 50mm wide with rounded corners"
3. **Export:** Click Export → Save as 3MF → Open in Orca Slicer
4. **Read the docs:**
   - [DFM Knowledge Base](./DFM_KNOWLEDGE_BASE.md) — Printing rules
   - [Component Library](./COMPONENT_LIBRARY.md) — Standard dimensions
   - [AI Providers](./AI_PROVIDERS.md) — Configure different AI services

