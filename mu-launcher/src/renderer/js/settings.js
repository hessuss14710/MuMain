let currentSettings = {};

async function initSettings() {
  const config = await window.api.getConfig();
  currentSettings = config.settings;
  return config;
}

function getSetting(key) {
  return currentSettings[key];
}

function setSetting(key, value) {
  currentSettings[key] = value;
  window.api.saveSettings(currentSettings);
}

function getSettings() {
  return { ...currentSettings };
}
