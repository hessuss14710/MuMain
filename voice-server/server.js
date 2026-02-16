const { WebSocketServer } = require('ws');
const { getPositions, testConnection } = require('./db');
const { computeProximity } = require('./proximity');

const PORT = parseInt(process.env.PORT || '8200');
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '3000');

// Connected players: Map<WebSocket, { character: string }>
const clients = new Map();

// Last known positions: Map<characterName, { x, y, map }>
const positions = new Map();

// Last sent proximity data per player (to detect changes)
const lastProximity = new Map();

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws, req) => {
  const ip = req.headers['x-real-ip'] || req.socket.remoteAddress;
  console.log(`[WS] New connection from ${ip}`);

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case 'join':
        handleJoin(ws, msg, ip);
        break;
      case 'signal':
        handleSignal(ws, msg);
        break;
      case 'leave':
        handleLeave(ws);
        break;
    }
  });

  ws.on('close', () => {
    handleLeave(ws);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Error: ${err.message}`);
    handleLeave(ws);
  });
});

function handleJoin(ws, msg, ip) {
  const character = (msg.character || '').trim();
  if (!character || character.length > 10) {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid character name' }));
    return;
  }

  // Check if character already connected
  for (const [existingWs, data] of clients) {
    if (data.character === character && existingWs !== ws) {
      existingWs.send(JSON.stringify({ type: 'kicked', reason: 'Connected from another session' }));
      clients.delete(existingWs);
      existingWs.close();
      break;
    }
  }

  clients.set(ws, { character });
  console.log(`[Voice] ${character} joined (${ip})`);

  ws.send(JSON.stringify({ type: 'joined', character }));

  // Notify others
  broadcast({ type: 'player-joined', character }, ws);
}

function handleSignal(ws, msg) {
  const sender = clients.get(ws);
  if (!sender) return;

  const { target, data } = msg;
  if (!target || !data) return;

  // Find target WebSocket
  for (const [targetWs, targetData] of clients) {
    if (targetData.character === target) {
      targetWs.send(JSON.stringify({
        type: 'signal',
        from: sender.character,
        data,
      }));
      break;
    }
  }
}

function handleLeave(ws) {
  const data = clients.get(ws);
  if (!data) return;

  console.log(`[Voice] ${data.character} left`);
  clients.delete(ws);
  positions.delete(data.character);
  lastProximity.delete(data.character);

  broadcast({ type: 'player-left', character: data.character });
}

function broadcast(msg, exclude) {
  const raw = JSON.stringify(msg);
  for (const [ws] of clients) {
    if (ws !== exclude && ws.readyState === 1) {
      ws.send(raw);
    }
  }
}

// Position polling loop
async function pollPositions() {
  const names = Array.from(clients.values()).map(c => c.character);
  if (names.length === 0) return;

  try {
    const rows = await getPositions(names);
    for (const row of rows) {
      positions.set(row.name, { x: row.x, y: row.y, map: row.map });
    }
  } catch (err) {
    console.error(`[DB] Poll error: ${err.message}`);
    return;
  }

  // Compute proximity and send updates
  const posObj = Object.fromEntries(positions);
  const proximity = computeProximity(posObj);

  for (const [ws, data] of clients) {
    const peers = proximity[data.character] || [];
    const key = JSON.stringify(peers);
    if (lastProximity.get(data.character) === key) continue;
    lastProximity.set(data.character, key);

    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'peers-update', peers }));
    }
  }
}

// Start polling
setInterval(pollPositions, POLL_INTERVAL);

// Startup
(async () => {
  try {
    await testConnection();
  } catch (err) {
    console.error(`[DB] Connection failed: ${err.message}`);
    console.error('[DB] Will retry on first poll...');
  }
  console.log(`[Voice Server] Listening on port ${PORT}`);
  console.log(`[Voice Server] Polling positions every ${POLL_INTERVAL}ms`);
})();
