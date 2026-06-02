# VoiceForge 3D - AI Provider Configuration

> Choose your AI provider for JSCAD code generation

---

## Overview

VoiceForge 3D uses AI to convert natural language into parametric JSCAD code. You can choose from multiple providers:

| Provider | Type | Cost | Quality | Speed | Privacy |
|----------|------|------|---------|-------|---------|
| **Ollama** | Local | Free | Good | Varies | ✅ Full |
| **Anthropic** | Cloud | Pay-per-use | Excellent | Fast | ⚠️ Cloud |
| **OpenAI** | Cloud | Pay-per-use | Excellent | Fast | ⚠️ Cloud |
| **Groq** | Cloud | Pay-per-use | Good | Very Fast | ⚠️ Cloud |
| **OpenRouter** | Cloud | Pay-per-use | Varies | Varies | ⚠️ Cloud |
| **Together** | Cloud | Pay-per-use | Good | Fast | ⚠️ Cloud |
| **Google** | Cloud | Pay-per-use | Good | Fast | ⚠️ Cloud |

---

## 1. Ollama (Local — Recommended for Privacy)

Run AI completely on your machine. No API costs, no data leaves your computer.

### Setup

1. **Install Ollama:**
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Windows — Download from https://ollama.ai/download
   ```

2. **Pull a model:**
   ```bash
   ollama pull codellama:13b
   ```

3. **Start Ollama:**
   ```bash
   ollama serve
   ```

4. **Configure `.env.local`:**
   ```bash
   AI_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=codellama:13b
   ```

### Recommended Models

| Model | Size | Use Case |
|-------|------|----------|
| `codellama:13b` | 7GB | Best balance of quality and speed |
| `qwen2.5-coder:7b` | 4GB | Fast, good code quality |
| `deepseek-coder:6.7b` | 4GB | Great for code generation |
| `llama3.1:8b` | 5GB | General purpose, good at instructions |
| `codellama:34b` | 19GB | Best quality, needs powerful GPU |

### Hardware Requirements

- **Minimum:** 8GB RAM, any modern CPU
- **Recommended:** 16GB RAM, Apple Silicon or NVIDIA GPU
- **For 34B models:** 32GB RAM, GPU with 16GB+ VRAM

---

## 2. Anthropic Claude (Best Quality)

Claude excels at understanding intent and generating correct, well-structured code.

### Setup

1. **Get API key:** https://console.anthropic.com/
2. **Configure `.env.local`:**
   ```bash
   AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
   ANTHROPIC_MODEL=claude-sonnet-4-20250514
   ```

### Models

| Model | Cost | Use Case |
|-------|------|----------|
| `claude-sonnet-4-20250514` | $3/$15 per 1M tokens | Best quality |
| `claude-3-5-haiku-20241022` | $0.25/$1.25 per 1M tokens | Fast, affordable |

---

## 3. OpenAI (GPT-4)

Good all-around option with fast response times.

### Setup

1. **Get API key:** https://platform.openai.com/
2. **Configure `.env.local`:**
   ```bash
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-xxxxx
   OPENAI_MODEL=gpt-4o
   ```

### Models

| Model | Cost | Use Case |
|-------|------|----------|
| `gpt-4o` | $2.50/$10 per 1M tokens | Best quality |
| `gpt-4o-mini` | $0.15/$0.60 per 1M tokens | Fast, affordable |

---

## 4. Groq (Fast & Affordable)

Extremely fast inference, great for real-time voice commands.

### Setup

1. **Get API key:** https://console.groq.com/
2. **Configure `.env.local`:**
   ```bash
   AI_PROVIDER=groq
   GROQ_API_KEY=gsk_xxxxx
   GROQ_MODEL=llama-3.1-70b-versatile
   ```

### Models

| Model | Speed | Use Case |
|-------|-------|----------|
| `llama-3.1-70b-versatile` | Very Fast | Best quality on Groq |
| `llama3-8b-8192` | Fastest | Quick commands |
| `mixtral-8x7b-32768` | Fast | Long context |

---

## 5. OpenRouter (Access Many Models)

Single API key for 100+ models from different providers.

### Setup

1. **Get API key:** https://openrouter.ai/
2. **Configure `.env.local`:**
   ```bash
   AI_PROVIDER=openrouter
   OPENROUTER_API_KEY=sk-or-xxxxx
   OPENROUTER_MODEL=anthropic/claude-sonnet-4-20250514
   ```

### Popular Models

- `anthropic/claude-sonnet-4-20250514` — Best quality
- `openai/gpt-4o` — OpenAI via OpenRouter
- `meta-llama/llama-3.1-70b-instruct` — Open source, good quality
- `mistralai/mistral-large` — Fast, affordable

---

## 6. Together AI (Open Source Models)

Access to Llama, Mistral, and other open models.

### Setup

1. **Get API key:** https://api.together.xyz/
2. **Configure `.env.local`:**
   ```bash
   AI_PROVIDER=together
   TOGETHER_API_KEY=xxxxx
   TOGETHER_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo
   ```

---

## 7. Google Gemini

Google's AI models.

### Setup

1. **Get API key:** https://makersuite.google.com/app/apikey
2. **Configure `.env.local`:**
   ```bash
   AI_PROVIDER=google
   GOOGLE_AI_API_KEY=xxxxx
   GOOGLE_AI_MODEL=gemini-1.5-pro
   ```

---

## Comparison: Which Should You Choose?

### For Privacy (No Cloud)
→ **Ollama** — Everything runs locally

### For Best Quality
→ **Anthropic Claude** — Best at understanding intent and generating correct code

### For Speed
→ **Groq** — Fastest inference

### For Budget
→ **Ollama** (free) or **Groq** (affordable)

### For Flexibility
→ **OpenRouter** — Access to many models with one key

---

## Switching Providers

You can switch providers at any time by changing `AI_PROVIDER` in `.env.local`:

```bash
# Switch from Anthropic to Ollama
AI_PROVIDER=ollama
```

Then restart the dev server:
```bash
pnpm dev
```

---

## Troubleshooting

### "API key invalid"
- Check the key is correct and has no extra spaces
- Ensure the key has the right permissions

### "Model not found"
- For Ollama: Run `ollama pull <model-name>`
- For cloud: Check the model name is exact

### "Timeout" errors
- For Ollama: Use a smaller model
- For cloud: Check your internet connection

### "Rate limited"
- Wait and retry
- Consider upgrading your API plan
- Switch to a different provider temporarily

