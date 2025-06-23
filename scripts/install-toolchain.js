#!/usr/bin/env node

/**
 * Toolchain installation script for Agentify
 * Installs Go, Python, and other required tools for agent compilation
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

const platform = os.platform();
const arch = os.arch();

console.log('🛠️  Installing Agentify compilation toolchain...');
console.log(`Platform: ${platform}, Architecture: ${arch}`);

/**
 * Check if a command exists
 */
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get version of a command
 */
function getVersion(command, versionFlag = '--version') {
  try {
    const output = execSync(`${command} ${versionFlag}`, { encoding: 'utf8', stdio: 'pipe' });
    return output.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Install Go
 */
function installGo() {
  console.log('📦 Checking Go installation...');
  
  if (commandExists('go')) {
    const version = getVersion('go', 'version');
    console.log(`✅ Go is already installed: ${version}`);
    return;
  }

  console.log('⬇️  Installing Go...');
  
  const goVersion = '1.21.5';
  let goUrl;
  
  if (platform === 'linux') {
    if (arch === 'x64') {
      goUrl = `https://golang.org/dl/go${goVersion}.linux-amd64.tar.gz`;
    } else if (arch === 'arm64') {
      goUrl = `https://golang.org/dl/go${goVersion}.linux-arm64.tar.gz`;
    }
  } else if (platform === 'darwin') {
    if (arch === 'x64') {
      goUrl = `https://golang.org/dl/go${goVersion}.darwin-amd64.tar.gz`;
    } else if (arch === 'arm64') {
      goUrl = `https://golang.org/dl/go${goVersion}.darwin-arm64.tar.gz`;
    }
  } else if (platform === 'win32') {
    goUrl = `https://golang.org/dl/go${goVersion}.windows-amd64.zip`;
  }

  if (!goUrl) {
    console.error(`❌ Unsupported platform: ${platform}-${arch}`);
    process.exit(1);
  }

  try {
    // Download and install Go
    const tempDir = os.tmpdir();
    const fileName = path.basename(goUrl);
    const filePath = path.join(tempDir, fileName);
    
    console.log(`⬇️  Downloading Go from ${goUrl}...`);
    execSync(`curl -L -o "${filePath}" "${goUrl}"`, { stdio: 'inherit' });
    
    if (platform === 'win32') {
      // Windows installation
      execSync(`unzip -q "${filePath}" -d "${tempDir}"`, { stdio: 'inherit' });
      const goDir = path.join(tempDir, 'go');
      const installDir = 'C:\\Go';
      execSync(`move "${goDir}" "${installDir}"`, { stdio: 'inherit' });
      console.log('✅ Go installed. Please add C:\\Go\\bin to your PATH');
    } else {
      // Unix-like installation
      execSync(`sudo tar -C /usr/local -xzf "${filePath}"`, { stdio: 'inherit' });
      console.log('✅ Go installed. Please add /usr/local/go/bin to your PATH');
    }
    
    // Clean up
    fs.unlinkSync(filePath);
    
  } catch (error) {
    console.error('❌ Failed to install Go:', error.message);
    process.exit(1);
  }
}

/**
 * Install Python
 */
function installPython() {
  console.log('🐍 Checking Python installation...');
  
  if (commandExists('python3')) {
    const version = getVersion('python3', '--version');
    console.log(`✅ Python3 is already installed: ${version}`);
  } else if (commandExists('python')) {
    const version = getVersion('python', '--version');
    console.log(`✅ Python is already installed: ${version}`);
  } else {
    console.log('⬇️  Installing Python...');
    
    if (platform === 'linux') {
      try {
        execSync('sudo apt-get update && sudo apt-get install -y python3 python3-pip python3-venv', { stdio: 'inherit' });
        console.log('✅ Python installed via apt-get');
      } catch (error) {
        try {
          execSync('sudo yum install -y python3 python3-pip', { stdio: 'inherit' });
          console.log('✅ Python installed via yum');
        } catch (error2) {
          console.error('❌ Failed to install Python. Please install manually.');
          process.exit(1);
        }
      }
    } else if (platform === 'darwin') {
      if (commandExists('brew')) {
        execSync('brew install python3', { stdio: 'inherit' });
        console.log('✅ Python installed via Homebrew');
      } else {
        console.error('❌ Homebrew not found. Please install Python manually or install Homebrew first.');
        process.exit(1);
      }
    } else {
      console.error('❌ Please install Python manually for your platform.');
      process.exit(1);
    }
  }
  
  // Install required Python packages
  console.log('📦 Installing Python dependencies...');
  try {
    const pythonCmd = commandExists('python3') ? 'python3' : 'python';
    const pipCmd = commandExists('pip3') ? 'pip3' : 'pip';
    
    execSync(`${pipCmd} install flask requests`, { stdio: 'inherit' });
    console.log('✅ Python dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install Python dependencies:', error.message);
  }
}

/**
 * Install build tools
 */
function installBuildTools() {
  console.log('🔨 Checking build tools...');
  
  if (platform === 'linux') {
    if (!commandExists('gcc')) {
      console.log('⬇️  Installing build-essential...');
      try {
        execSync('sudo apt-get install -y build-essential', { stdio: 'inherit' });
        console.log('✅ Build tools installed');
      } catch (error) {
        console.error('❌ Failed to install build tools');
      }
    } else {
      console.log('✅ GCC is already installed');
    }
  } else if (platform === 'darwin') {
    if (!commandExists('gcc')) {
      console.log('⬇️  Installing Xcode command line tools...');
      try {
        execSync('xcode-select --install', { stdio: 'inherit' });
        console.log('✅ Xcode command line tools installed');
      } catch (error) {
        console.log('ℹ️  Xcode command line tools may already be installed');
      }
    } else {
      console.log('✅ GCC is already installed');
    }
  }
}

/**
 * Verify installation
 */
function verifyInstallation() {
  console.log('🔍 Verifying installation...');
  
  const checks = [
    { name: 'Go', command: 'go', flag: 'version' },
    { name: 'Python', command: commandExists('python3') ? 'python3' : 'python', flag: '--version' },
    { name: 'GCC', command: 'gcc', flag: '--version' }
  ];
  
  let allGood = true;
  
  checks.forEach(check => {
    if (commandExists(check.command)) {
      const version = getVersion(check.command, check.flag);
      console.log(`✅ ${check.name}: ${version ? version.split('\n')[0] : 'Available'}`);
    } else {
      console.log(`❌ ${check.name}: Not found`);
      allGood = false;
    }
  });
  
  if (allGood) {
    console.log('🎉 All tools are installed and ready!');
  } else {
    console.log('⚠️  Some tools are missing. Please install them manually.');
  }
}

// Main execution
async function main() {
  try {
    installGo();
    installPython();
    installBuildTools();
    verifyInstallation();
    
    console.log('✅ Toolchain installation complete!');
  } catch (error) {
    console.error('❌ Installation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  installGo,
  installPython,
  installBuildTools,
  verifyInstallation,
  commandExists,
  getVersion
};
