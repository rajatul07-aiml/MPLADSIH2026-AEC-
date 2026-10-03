const fs = require('fs');
const os = require('os');
const path = require('path');
const homeDir = os.homedir();

function getPerms(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const obj = JSON.parse(content);
      console.log(filePath, "permissions.defaultMode:", obj.permissions?.defaultMode);
      console.log(filePath, "autoUpdatesChannel:", obj.autoUpdatesChannel);
      console.log(filePath, "hasHooks:", !!obj.hooks, "- length:", obj.hooks ? Object.keys(obj.hooks).length : 0);
      return obj;
    }
  } catch (e) {}
}
getPerms(path.join(homeDir, '.claude', 'settings.json'));
getPerms(path.join(process.cwd(), '.claude', 'settings.json'));
getPerms(path.join(process.cwd(), '.claude', 'settings.local.json'));
