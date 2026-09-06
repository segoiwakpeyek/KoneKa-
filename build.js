#!/usr/bin/env node
/**
 * KoneKA Build & Verification Script
 * Validates JS syntax, JSON manifests, Netlify functions, static assets, and configurations.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('========================================');
console.log('🚀 Starting KoneKA Build & Verification...');
console.log('========================================\n');

let hasErrors = false;

// 1. Verify JSON configs
console.log('📦 [1/4] Checking JSON configuration files...');
const jsonFiles = ['manifest.json', 'package.json', 'firebase.json'];
for (const jf of jsonFiles) {
  const p = path.join(__dirname, jf);
  if (!fs.existsSync(p)) {
    console.error(`❌ Missing JSON file: ${jf}`);
    hasErrors = true;
    continue;
  }
  try {
    JSON.parse(fs.readFileSync(p, 'utf8'));
    console.log(`  ✓ Valid JSON: ${jf}`);
  } catch (err) {
    console.error(`❌ Invalid JSON in ${jf}: ${err.message}`);
    hasErrors = true;
  }
}

// 2. Verify all JS files syntax
console.log('\n🔍 [2/4] Checking JavaScript syntax...');
const jsFiles = [];
function findJs(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', '.gemini', 'scratch'].includes(entry.name)) {
        findJs(full);
      }
    } else if (entry.isFile() && entry.name.endsWith('.js') && entry.name !== 'build.js') {
      jsFiles.push(full);
    }
  }
}
findJs(__dirname);

for (const file of jsFiles) {
  const rel = path.relative(__dirname, file);
  try {
    execSync(`node -c "${file}"`, { stdio: 'pipe' });
    console.log(`  ✓ Syntax OK: ${rel}`);
  } catch (err) {
    console.error(`❌ Syntax error in ${rel}: ${err.stderr.toString()}`);
    hasErrors = true;
  }
}

// 3. Verify static assets
console.log('\n🎨 [3/4] Verifying static assets and files...');
const requiredAssets = [
  'index.html',
  'css/styles.css',
  'manifest.json',
  'sw.js',
  'server.js',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'netlify.toml',
  '_redirects',
  'firestore.rules',
  'storage.rules'
];
for (const asset of requiredAssets) {
  const p = path.join(__dirname, asset);
  if (fs.existsSync(p)) {
    console.log(`  ✓ Asset found: ${asset}`);
  } else {
    console.error(`❌ Missing asset: ${asset}`);
    hasErrors = true;
  }
}

// 4. Verify Netlify functions
console.log('\n⚡ [4/4] Verifying Netlify serverless functions...');
const netlifyFns = ['send-email.js', 'verify-turnstile.js'];
for (const fn of netlifyFns) {
  const p = path.join(__dirname, 'netlify', 'functions', fn);
  if (fs.existsSync(p)) {
    console.log(`  ✓ Function ready: ${fn}`);
  } else {
    console.error(`❌ Missing Netlify function: ${fn}`);
    hasErrors = true;
  }
}

console.log('\n========================================');
if (hasErrors) {
  console.error('💥 BUILD FAILED: One or more checks encountered errors!');
  console.log('========================================');
  process.exit(1);
} else {
  console.log('✨ BUILD SUCCESSFUL! All assets and scripts are verified.');
  console.log('========================================\n');
  process.exit(0);
}
