const translations = {
  es: {
    title: 'MU Giloria',
    character: 'Nombre de personaje',
    characterPlaceholder: 'Escribe tu personaje...',
    server: 'Servidor',
    resolution: 'Resolución',
    language: 'Idioma',
    theme: 'Tema',
    play: 'JUGAR',
    voice: 'Chat de voz',
    voiceOn: 'Voz activada',
    voiceOff: 'Voz desactivada',
    mute: 'Silenciar',
    unmute: 'Activar micro',
    connecting: 'Conectando...',
    connected: 'Conectado',
    disconnected: 'Desconectado',
    nearbyPlayers: 'Jugadores cerca',
    noPlayersNearby: 'Nadie cerca',
    gameRunning: 'Juego en ejecución',
    gameClosed: 'Juego cerrado',
    errorNoMainExe: 'main.exe no encontrado. Coloca el launcher en la carpeta del juego.',
    errorLaunch: 'Error al lanzar el juego',
    themeDark: 'Oscuro',
    themeBlue: 'Azul MU',
    themeRed: 'Rojo MU',
    themeLight: 'Claro',
  },
  en: {
    title: 'MU Giloria',
    character: 'Character name',
    characterPlaceholder: 'Enter your character...',
    server: 'Server',
    resolution: 'Resolution',
    language: 'Language',
    theme: 'Theme',
    play: 'PLAY',
    voice: 'Voice chat',
    voiceOn: 'Voice enabled',
    voiceOff: 'Voice disabled',
    mute: 'Mute',
    unmute: 'Unmute',
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    nearbyPlayers: 'Nearby players',
    noPlayersNearby: 'Nobody nearby',
    gameRunning: 'Game running',
    gameClosed: 'Game closed',
    errorNoMainExe: 'main.exe not found. Place the launcher in the game folder.',
    errorLaunch: 'Error launching game',
    themeDark: 'Dark',
    themeBlue: 'MU Blue',
    themeRed: 'MU Red',
    themeLight: 'Light',
  },
  pt: {
    title: 'MU Giloria',
    character: 'Nome do personagem',
    characterPlaceholder: 'Digite seu personagem...',
    server: 'Servidor',
    resolution: 'Resolução',
    language: 'Idioma',
    theme: 'Tema',
    play: 'JOGAR',
    voice: 'Chat de voz',
    voiceOn: 'Voz ativada',
    voiceOff: 'Voz desativada',
    mute: 'Silenciar',
    unmute: 'Ativar microfone',
    connecting: 'Conectando...',
    connected: 'Conectado',
    disconnected: 'Desconectado',
    nearbyPlayers: 'Jogadores próximos',
    noPlayersNearby: 'Ninguém por perto',
    gameRunning: 'Jogo em execução',
    gameClosed: 'Jogo fechado',
    errorNoMainExe: 'main.exe não encontrado. Coloque o launcher na pasta do jogo.',
    errorLaunch: 'Erro ao iniciar o jogo',
    themeDark: 'Escuro',
    themeBlue: 'Azul MU',
    themeRed: 'Vermelho MU',
    themeLight: 'Claro',
  },
};

function t(key, lang = 'es') {
  return (translations[lang] && translations[lang][key]) || translations.es[key] || key;
}

function applyTranslations(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (el.tagName === 'INPUT' && el.getAttribute('placeholder') !== null) {
      el.placeholder = t(key, lang);
    } else {
      el.textContent = t(key, lang);
    }
  });
}
