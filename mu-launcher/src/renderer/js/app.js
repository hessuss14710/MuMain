const voice = new VoiceManager();
let config = null;
let lang = 'es';
let gameRunning = false;

// DOM elements
const characterInput = document.getElementById('character-name');
const serverSelect = document.getElementById('server-select');
const resolutionSelect = document.getElementById('resolution-select');
const languageSelect = document.getElementById('language-select');
const themeSelect = document.getElementById('theme-select');
const btnPlay = document.getElementById('btn-play');
const btnMute = document.getElementById('btn-mute');
const voiceStatusEl = document.getElementById('voice-status');
const voiceStatusText = document.getElementById('voice-status-text');
const peersList = document.getElementById('peers-list');
const statusBar = document.getElementById('status-bar');

// Initialize
(async () => {
  config = await initSettings();
  const s = config.settings;
  lang = s.language || 'es';

  // Populate servers
  config.servers.forEach((srv, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = srv.name;
    serverSelect.appendChild(opt);
  });

  // Populate resolutions
  config.resolutions.forEach(res => {
    const opt = document.createElement('option');
    opt.value = res.label;
    opt.textContent = res.label;
    resolutionSelect.appendChild(opt);
  });

  // Restore settings
  characterInput.value = s.characterName || '';
  serverSelect.value = s.server || 0;
  resolutionSelect.value = s.resolution || '1920x1080';
  languageSelect.value = lang;
  themeSelect.value = s.theme || 'dark';

  applyTheme(s.theme || 'dark');
  applyTranslations(lang);
  updateThemeOptions();
})();

// ── Theme ──
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function updateThemeOptions() {
  document.querySelectorAll('#theme-select option').forEach(opt => {
    const key = 'theme' + opt.value.charAt(0).toUpperCase() + opt.value.slice(1);
    opt.textContent = t(key, lang);
  });
}

// ── Events: Settings ──
characterInput.addEventListener('input', () => {
  setSetting('characterName', characterInput.value.trim());
});

serverSelect.addEventListener('change', () => {
  setSetting('server', parseInt(serverSelect.value));
});

resolutionSelect.addEventListener('change', () => {
  setSetting('resolution', resolutionSelect.value);
});

languageSelect.addEventListener('change', () => {
  lang = languageSelect.value;
  setSetting('language', lang);
  applyTranslations(lang);
  updateThemeOptions();
});

themeSelect.addEventListener('change', () => {
  const theme = themeSelect.value;
  setSetting('theme', theme);
  applyTheme(theme);
});

// ── Play button ──
btnPlay.addEventListener('click', async () => {
  const charName = characterInput.value.trim();
  if (!charName) {
    characterInput.focus();
    characterInput.style.borderColor = 'var(--danger)';
    setTimeout(() => { characterInput.style.borderColor = ''; }, 2000);
    return;
  }

  btnPlay.disabled = true;

  const result = await window.api.launchGame({
    server: parseInt(serverSelect.value),
    resolution: resolutionSelect.value,
  });

  if (!result.success) {
    statusBar.textContent = result.error || t('errorLaunch', lang);
    statusBar.style.color = 'var(--danger)';
    btnPlay.disabled = false;
    return;
  }

  gameRunning = true;
  btnPlay.textContent = t('gameRunning', lang);
  statusBar.textContent = '';
  statusBar.style.color = '';

  // Connect voice
  voice.connect(config.voiceUrl, charName);
});

// ── Game closed ──
window.api.onGameClosed(() => {
  gameRunning = false;
  btnPlay.disabled = false;
  btnPlay.textContent = t('play', lang);
  voice.disconnect();
  statusBar.textContent = t('gameClosed', lang);
  setTimeout(() => { statusBar.textContent = ''; }, 3000);
});

// ── Mute ──
btnMute.addEventListener('click', () => {
  const muted = voice.toggleMute();
  btnMute.classList.toggle('active', muted);
  const muteLabel = btnMute.querySelector('span');
  muteLabel.textContent = muted ? t('unmute', lang) : t('mute', lang);
});

// ── Voice state ──
voice.onStateChange = (state) => {
  voiceStatusEl.className = 'voice-status ' + state;
  const key = state === 'error' ? 'disconnected' : state;
  voiceStatusText.textContent = t(key, lang);
};

// ── Peers update ──
voice.onPeersUpdate = (peers) => {
  if (peers.length === 0) {
    peersList.innerHTML = `<div class="no-peers">${t('noPlayersNearby', lang)}</div>`;
    return;
  }

  peersList.innerHTML = peers.map(p => `
    <div class="peer-item">
      <span class="peer-name">${escapeHtml(p.name)}</span>
      <div class="peer-volume">
        <div class="peer-volume-fill" style="width: ${Math.round(p.volume * 100)}%"></div>
      </div>
    </div>
  `).join('');
};

// ── Titlebar buttons ──
document.getElementById('btn-minimize').addEventListener('click', () => {
  window.api.minimizeWindow();
});

document.getElementById('btn-close').addEventListener('click', () => {
  if (gameRunning) {
    window.api.minimizeWindow();
  } else {
    window.api.closeApp();
  }
});

// ── Utils ──
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
