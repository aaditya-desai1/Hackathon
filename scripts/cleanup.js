/**
 * Cleanup script for removing temporary files and test data
 */
const fs = require('fs-extra');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const testDataDir = path.join(rootDir, 'test_data');
const testingDataDir = path.join(rootDir, 'testing_data');
const buildDir = path.join(rootDir, 'build');
const frontendBuildDir = path.join(rootDir, 'frontend', 'build');

console.log('Starting cleanup process...');

// Clean test data directories
if (fs.existsSync(testDataDir)) {
  console.log('Cleaning test_data directory...');
  fs.emptyDirSync(testDataDir);
}

if (fs.existsSync(testingDataDir)) {
  console.log('Cleaning testing_data directory...');
  fs.emptyDirSync(testingDataDir);
}

// Clean build directories
if (fs.existsSync(buildDir)) {
  console.log('Cleaning build directory...');
  fs.emptyDirSync(buildDir);
}

if (fs.existsSync(frontendBuildDir)) {
  console.log('Cleaning frontend build directory...');
  fs.emptyDirSync(frontendBuildDir);
}

console.log('Cleanup completed successfully!'); 