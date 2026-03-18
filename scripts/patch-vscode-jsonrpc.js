const fs = require('fs');
const path = require('path');

const targetPathJs = path.join(__dirname, '..', 'node_modules', 'vscode-jsonrpc', 'node.js');
const targetPathDir = path.join(__dirname, '..', 'node_modules', 'vscode-jsonrpc', 'node');
const targetPathIndex = path.join(targetPathDir, 'index.js');
const content = "module.exports = require('./lib/node/main.js');\n";

try {
  const packageDir = path.join(__dirname, '..', 'node_modules', 'vscode-jsonrpc');
  if (!fs.existsSync(packageDir)) {
    console.warn('[patch] vscode-jsonrpc not found in node_modules; skipping patch.');
    process.exit(0);
  }

  // Add an exports map so ESM imports like `vscode-jsonrpc/node` can resolve.
  const pkgJsonPath = path.join(packageDir, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    if (!pkgJson.exports || typeof pkgJson.exports !== 'object') {
      pkgJson.exports = pkgJson.exports || {};
    }

    if (!pkgJson.exports['./node']) {
      pkgJson.exports['./node'] = './node.js';
    }

    if (!pkgJson.exports['./node.js']) {
      pkgJson.exports['./node.js'] = './node.js';
    }

    // Ensure root export exists so downstream ESM imports still work.
    if (!pkgJson.exports['.']) {
      pkgJson.exports['.'] = pkgJson.main || './lib/node/main.js';
    }

    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf8');
  }

  const needsNodeJs = !fs.existsSync(targetPathJs);
  const needsNodeDir = !fs.existsSync(targetPathIndex);

  if (!needsNodeJs && !needsNodeDir) {
    // Already patched
    process.exit(0);
  }

  if (needsNodeJs) {
    // Create node.js shim (for explicit .js imports)
    fs.writeFileSync(targetPathJs, content, { encoding: 'utf8' });
  }

  if (needsNodeDir) {
    // Create node/ directory + index.js so `import "vscode-jsonrpc/node"` works in ESM
    if (!fs.existsSync(targetPathDir)) {
      fs.mkdirSync(targetPathDir, { recursive: true });
    }
    fs.writeFileSync(targetPathIndex, content, { encoding: 'utf8' });
  }

  console.log('[patch] Created vscode-jsonrpc/node directory + shims for @github/copilot-sdk');
} catch (err) {
  console.warn('[patch] Failed to create vscode-jsonrpc/node.js shim:', err.message);
}
