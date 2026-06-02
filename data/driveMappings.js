const fs = require('fs');
const path = require('path');

const mappingsPath = path.join(__dirname, 'drive-mappings.json');
let mappingsCache = null;

function loadMappings() {
  if (mappingsCache) return mappingsCache;
  if (!fs.existsSync(mappingsPath)) {
    mappingsCache = {};
    return mappingsCache;
  }
  try {
    mappingsCache = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
  } catch (e) {
    console.error('⚠️ [driveMappings] Erro ao ler drive-mappings.json:', e.message);
    mappingsCache = {};
  }
  return mappingsCache;
}

function saveMapping(filename, fileId) {
  const cache = loadMappings();
  cache[filename] = fileId;
  try {
    fs.writeFileSync(mappingsPath, JSON.stringify(cache, null, 2), 'utf8');
    console.log(`💾 [driveMappings] Mapeamento salvo: ${filename} -> ${fileId}`);
  } catch (e) {
    console.error('❌ [driveMappings] Erro ao salvar drive-mappings.json:', e.message);
  }
}

function getMapping(filename) {
  const cache = loadMappings();
  return cache[filename] || null;
}

module.exports = {
  saveMapping,
  getMapping
};
