const fs = require('fs');
const os = require('os');
const path = require('path');
const homeDir = os.homedir();

try {
  const content = fs.readFileSync(path.join(homeDir, '.claude', 'settings.json'), 'utf8');
  const obj = JSON.parse(content);
  console.log(JSON.stringify(obj.hooks, null, 2));
} catch (e) {}

