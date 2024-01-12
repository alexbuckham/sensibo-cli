const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const CACHE_DIR = path.join(os.homedir(), '.config', 'sensibo');
const CACHE_FILE = path.join(CACHE_DIR, 'customCache.json');

const cache = () => {
  const loadCache = async () => {
    if (await fs.pathExists(CACHE_FILE)) {
      return await fs.readJson(CACHE_FILE);
    }
    return {};
  };

  const saveCache = async (data) => {
    await fs.ensureDir(CACHE_DIR);
    await fs.writeJson(CACHE_FILE, data);
  };

  const put = async (key, value, expiry) => {
    const data = await loadCache();
    data[key] = {
      value,
      expiry: new Date().getTime() + expiry
    };
    await saveCache(data);
  };

  const get = async (key) => {
    const data = await loadCache();
    if (data[key] && new Date().getTime() < data[key].expiry) {
      return data[key].value;
    }
    return null;
  };

  return { put, get };
};

module.exports = cache;
