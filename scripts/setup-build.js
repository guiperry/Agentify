#!/usr/bin/env node

/**
 * Build setup script for Agentify
 * Ensures all necessary directories exist and toolchains are available before build
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

// Directories that need to exist for the build
const requiredDirectories = [
  'public/output',
  'public/output/plugins',
  'public/output/temp',
  '.next',
  'data'
];

console.log('🔧 Setting up build environment...');

// Create required directories
requiredDirectories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);

  if (!fs.existsSync(fullPath)) {
    console.log(`📁 Creating directory: ${dir}`);
    fs.mkdirSync(fullPath, { recursive: true });
  } else {
    console.log(`✅ Directory exists: ${dir}`);
  }
});

// Create a placeholder file in public/output to ensure it's included in builds
const placeholderPath = path.join(process.cwd(), 'public/output/.gitkeep');
if (!fs.existsSync(placeholderPath)) {
  console.log('📄 Creating placeholder file in public/output');
  fs.writeFileSync(placeholderPath, '# This file ensures the output directory is included in builds\n');
}

console.log('✅ Build environment setup complete!');
