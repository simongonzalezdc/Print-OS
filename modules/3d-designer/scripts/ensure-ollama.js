#!/usr/bin/env node

/**
 * Ensures Ollama is running with the required model before launching the app.
 * - Starts `ollama serve` if it's not already running
 * - Pulls the selected model if it is missing
 * - Skips all work when SKIP_OLLAMA_BOOT=true (CI environments)
 */

import { spawn, spawnSync } from 'child_process';

const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const model = process.env.OLLAMA_MODEL || 'deepseek-coder-v2:latest';
const shouldSkip = process.env.SKIP_OLLAMA_BOOT === 'true';

if (shouldSkip) {
  process.exit(0);
}

function log(msg) {
  console.log(`[ensure-ollama] ${msg}`);
}

function commandExists(cmd) {
  const result = spawnSync(cmd, ['--version'], { encoding: 'utf8' });
  return !result.error;
}

async function isOllamaRunning() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(`${baseURL}/api/version`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

function startOllamaServe() {
  log('Starting Ollama server...');
  const child = spawn('ollama', ['serve'], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

async function waitForOllamaReady(retries = 15) {
  for (let attempt = 0; attempt < retries; attempt++) {
    if (await isOllamaRunning()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

function ensureModelInstalled() {
  const list = spawnSync('ollama', ['list'], { encoding: 'utf8' });
  if (list.status !== 0) {
    throw new Error('Failed to list Ollama models. Is the server running?');
  }

  if (!list.stdout.includes(model)) {
    log(`Pulling model ${model} ... this may take a few minutes.`);
    const pull = spawnSync('ollama', ['pull', model], { stdio: 'inherit' });
    if (pull.status !== 0) {
      throw new Error(`Failed to pull model ${model}`);
    }
    log(`Model ${model} installed.`);
  } else {
    log(`Model ${model} already installed.`);
  }
}

async function main() {
  if (!commandExists('ollama')) {
    log('Ollama CLI not found. Install it from https://ollama.com/download');
    return;
  }

  if (!(await isOllamaRunning())) {
    startOllamaServe();
    const ready = await waitForOllamaReady();
    if (!ready) {
      throw new Error('Ollama did not start within the expected time.');
    }
  }

  ensureModelInstalled();
  log(`Ollama ready at ${baseURL} using model ${model}.`);
}

main().catch((error) => {
  log(error.message);
  // Do not crash the dev server if Ollama cannot start; just warn.
});

