const fs = require('fs');
const path = require('path');

const targetPathJs = path.join(__dirname, '..', 'node_modules', 'vscode-jsonrpc', 'node.js');
const targetPathDir = path.join(__dirname, '..', 'node_modules', 'vscode-jsonrpc', 'node');
const targetPathIndex = path.join(targetPathDir, 'index.js');
const content = "module.exports = require('./lib/node/main.js');\n";

// ─── Patch 1: vscode-jsonrpc ──────────────────────────────────────────────────
try {
  const packageDir = path.join(__dirname, '..', 'node_modules', 'vscode-jsonrpc');
  if (!fs.existsSync(packageDir)) {
    console.warn('[patch] vscode-jsonrpc not found in node_modules; skipping patch.');
  } else {
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
      console.log('[patch] vscode-jsonrpc already patched; skipping.');
    } else {
      if (needsNodeJs) {
        fs.writeFileSync(targetPathJs, content, { encoding: 'utf8' });
      }

      if (needsNodeDir) {
        if (!fs.existsSync(targetPathDir)) {
          fs.mkdirSync(targetPathDir, { recursive: true });
        }
        fs.writeFileSync(targetPathIndex, content, { encoding: 'utf8' });
      }

      console.log('[patch] Created vscode-jsonrpc/node directory + shims for @github/copilot-sdk');
    }
  }
} catch (err) {
  console.warn('[patch] Failed to patch vscode-jsonrpc:', err.message);
}

// ─── Patch 2: @github/copilot-sdk client.js ──────────────────────────────────
// In Electron, process.execPath points to electron.exe, NOT node.exe.
// When the Copilot SDK spawns its CLI server as a child process, it uses
// process.execPath — causing the CLI to exit immediately with code 0.
// We patch getNodeExecPath() to always return "node" so the real Node binary
// is used, both in dev mode and in the packaged production build.
// ─────────────────────────────────────────────────────────────────────────────
try {
  const copilotSdkClientPath = path.join(
    __dirname, '..', 'node_modules', '@github', 'copilot-sdk', 'dist', 'client.js'
  );

  if (!fs.existsSync(copilotSdkClientPath)) {
    console.warn('[patch] @github/copilot-sdk client.js not found; skipping Electron exec patch.');
  } else {
    let clientJs = fs.readFileSync(copilotSdkClientPath, 'utf8');

    if (clientJs.includes('// [LUMOFLOW-PATCHED]')) {
      console.log('[patch] @github/copilot-sdk client.js already patched; skipping.');
    } else {
      // Use a flexible regex to match the function regardless of exact whitespace
      const patched = clientJs.replace(
        /function getNodeExecPath\(\) \{[\s\S]*?\n\}/,
        `function getNodeExecPath() {\n  return "node"; // [LUMOFLOW-PATCHED] Always use node, not electron's process.execPath\n}`
      );

      if (patched !== clientJs) {
        fs.writeFileSync(copilotSdkClientPath, patched, 'utf8');
        console.log('[patch] Patched @github/copilot-sdk client.js: getNodeExecPath -> "node"');
      } else {
        console.warn('[patch] @github/copilot-sdk client.js: could not find getNodeExecPath to patch (may already be patched).');
      }
    }
  }
} catch (err) {
  console.warn('[patch] Failed to patch @github/copilot-sdk client.js:', err.message);
}
