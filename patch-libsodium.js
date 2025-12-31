import fs from 'fs';
import { resolve } from 'path';

const path = 'node_modules/libsodium-wrappers/package.json';
const start = Date.now();

function patch() {
  if (fs.existsSync(path)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
      // Remove "exports" field to force Node to use "main" (CJS)
      if (pkg.exports) {
        delete pkg.exports;
        fs.writeFileSync(path, JSON.stringify(pkg, null, 2));
        console.log('✅ Patched libsodium-wrappers package.json (Removed "exports")');
      } else {
        console.log('ℹ️ pkg.exports already removed or missing');
      }
      process.exit(0);
    } catch (e) {
      console.error('Error patching:', e);
      process.exit(1);
    }
  } else {
    if (Date.now() - start > 60000) { // Timeout 60s
        console.error('Timeout waiting for libsodium-wrappers');
        process.exit(1);
    }
    console.log('Waiting for libsodium-wrappers...');
    setTimeout(patch, 1000);
  }
}

patch();
