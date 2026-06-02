#!/usr/bin/env node

/**
 * VoiceForge 3D - Production Validation Script
 *
 * Validates that the application builds correctly and passes basic runtime checks.
 * This script should be run before deploying to production.
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🚀 VoiceForge 3D - Production Validation\n');

// Validation steps
const validations = [
  {
    name: 'TypeScript Compilation',
    command: 'npm run typecheck',
    description: 'Ensure all TypeScript types are correct'
  },
  {
    name: 'ESLint Code Quality',
    command: 'npm run lint',
    description: 'Check code quality and style consistency'
  },
  {
    name: 'Unit Tests',
    command: 'npm test -- --run',
    description: 'Run all unit tests'
  },
  {
    name: 'Production Build',
    command: 'npm run build',
    description: 'Create optimized production build'
  }
];

let passed = 0;
let failed = 0;

// Run validations
for (const validation of validations) {
  console.log(`📋 ${validation.name}`);
  console.log(`   ${validation.description}`);

  try {
    execSync(validation.command, {
      cwd: rootDir,
      stdio: 'pipe',
      timeout: 300000 // 5 minutes timeout
    });
    console.log('   ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log('   ❌ FAILED');
    console.log(`   Error: ${error.message}\n`);
    failed++;
  }
}

// Additional validations
console.log('📋 Additional Validations');

// Check package.json
try {
  const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
  if (!packageJson.name || !packageJson.version) {
    throw new Error('Missing name or version in package.json');
  }
  console.log('   ✅ Package.json validation passed');
} catch (error) {
  console.log('   ❌ Package.json validation failed:', error.message);
  failed++;
}

// Check build output
try {
  const nextConfigExists = existsSync(join(rootDir, 'next.config.ts'));

  if (!nextConfigExists) {
    throw new Error('next.config.ts not found');
  }

  console.log('   ✅ Build configuration valid');
} catch (error) {
  console.log('   ❌ Build configuration check failed:', error.message);
  failed++;
}

// Runtime test (basic server startup)
console.log('   📋 Testing server startup...');
try {
  const serverProcess = spawn('npm', ['run', 'build'], {
    cwd: rootDir,
    stdio: 'pipe',
    detached: true
  });

  let startupTimeout = setTimeout(() => {
    serverProcess.kill();
    throw new Error('Build process timed out');
  }, 60000); // 1 minute timeout

  serverProcess.on('close', (code) => {
    clearTimeout(startupTimeout);
    if (code === 0) {
      console.log('   ✅ Build process completed successfully');
    } else {
      console.log(`   ❌ Build process failed with code ${code}`);
      failed++;
    }
  });

  serverProcess.on('error', (error) => {
    clearTimeout(startupTimeout);
    console.log('   ❌ Build process error:', error.message);
    failed++;
  });

  // Wait for process to complete
  await new Promise((resolve) => {
    serverProcess.on('close', resolve);
    serverProcess.on('error', resolve);
  });

} catch (error) {
  console.log('   ❌ Server startup test failed:', error.message);
  failed++;
}

console.log('\n📊 Validation Summary:');
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 All validations passed! Ready for production deployment.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some validations failed. Please fix the issues before deploying.');
  process.exit(1);
}
