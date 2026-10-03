const fs = require('fs');
const os = require('os');
const path = require('path');

const homeDir = os.homedir();

function safeParse(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      JSON.parse(content);
      console.log(`${filePath}: OK`);
      return JSON.parse(content);
    }
    return null;
  } catch (e) {
    console.log(`${filePath}: PARSE ERROR - ${e.message}`);
    return null;
  }
}

const claudeJson = safeParse(path.join(homeDir, '.claude.json'));
if (claudeJson) {
  console.log("=== CLAUDE JSON ===");
  console.log(JSON.stringify({
    installMethod: claudeJson.installMethod,
    autoUpdates: claudeJson.autoUpdates,
    autoUpdatesChannel: claudeJson.autoUpdatesChannel,
    mcpServers: claudeJson.mcpServers ? Object.keys(claudeJson.mcpServers) : [],
    skillUsage: claudeJson.skillUsage,
    pluginUsage: claudeJson.pluginUsage,
    numStartups: claudeJson.numStartups
  }, null, 2));
}

safeParse(path.join(homeDir, '.claude', 'settings.json'));
safeParse(path.join(process.cwd(), '.claude', 'settings.json'));
safeParse(path.join(process.cwd(), '.claude', 'settings.local.json'));
safeParse(path.join(process.cwd(), '.mcp.json'));

