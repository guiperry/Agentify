#!/usr/bin/env node

/**
 * Test script to verify that module imports are working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing module imports...');

// Test that all UI component files exist
const uiComponentsDir = path.join(__dirname, '../src/components/ui');
const requiredComponents = [
  'card.tsx',
  'badge.tsx', 
  'button.tsx',
  'alert-dialog.tsx',
  'checkbox.tsx',
  'collapsible.tsx',
  'dialog.tsx',
  'drawer.tsx',
  'input.tsx',
  'label.tsx',
  'progress.tsx',
  'scroll-area.tsx',
  'select.tsx',
  'slider.tsx',
  'switch.tsx',
  'tabs.tsx',
  'textarea.tsx',
  'toast.tsx',
  'toaster.tsx'
];

console.log(`📁 Checking UI components in: ${uiComponentsDir}`);

let allComponentsExist = true;

requiredComponents.forEach(component => {
  const componentPath = path.join(uiComponentsDir, component);
  if (fs.existsSync(componentPath)) {
    console.log(`✅ ${component} exists`);
  } else {
    console.log(`❌ ${component} missing`);
    allComponentsExist = false;
  }
});

// Test that utils file exists
const utilsPath = path.join(__dirname, '../src/lib/utils.ts');
if (fs.existsSync(utilsPath)) {
  console.log('✅ utils.ts exists');
} else {
  console.log('❌ utils.ts missing');
  allComponentsExist = false;
}

// Test that tsconfig.json has correct paths
const tsconfigPath = path.join(__dirname, '../tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths && tsconfig.compilerOptions.paths['@/*']) {
    console.log('✅ tsconfig.json has @ path mapping');
  } else {
    console.log('❌ tsconfig.json missing @ path mapping');
    allComponentsExist = false;
  }
} else {
  console.log('❌ tsconfig.json missing');
  allComponentsExist = false;
}

if (allComponentsExist) {
  console.log('🎉 All required files exist and configuration looks correct!');
  process.exit(0);
} else {
  console.log('❌ Some files are missing or configuration is incorrect');
  process.exit(1);
}
