/**
 * Bridge Mode WebSocket Relay Server
 *
 * Pairs Bridge displays with Echo phone clients using session codes.
 * Relays volume/speech data from Echo → Bridge in real-time.
 *
 * Usage:
 *   node server/index.js
 *   PORT=8081 node server/index.js
 */

import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8080;

// Sessions: code → { bridges: Set<ws>, echoes: Map<ws, deviceInfo> }
const sessions = new Map();

const wss = new WebSocketServer({ port: PORT });

console.log(`Bridge WS relay listening on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  let sessionCode = null;
  let role = null;
  let deviceId = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    // --- JOIN a session ---
    if (msg.type === 'join') {
      sessionCode = msg.code?.toUpperCase();
      role = msg.role; // 'bridge' | 'echo'
      deviceId = msg.deviceId || `device-${Date.now()}`;

      if (!sessionCode || !role) {
        ws.send(JSON.stringify({ type: 'error', message: 'Missing code or role' }));
        return;
      }

      // Create session if it doesn't exist
      if (!sessions.has(sessionCode)) {
        sessions.set(sessionCode, { bridges: new Set(), echoes: new Map() });
      }

      const session = sessions.get(sessionCode);

      if (role === 'bridge') {
        session.bridges.add(ws);
        // Notify bridge of currently connected echoes
        const devices = Array.from(session.echoes.values());
        ws.send(JSON.stringify({ type: 'joined', role, code: sessionCode, devices }));
        console.log(`Bridge joined session ${sessionCode} (${session.bridges.size} bridges, ${session.echoes.size} echoes)`);
      } else if (role === 'echo') {
        const info = { deviceId, name: msg.name || 'Player', language: msg.language || 'en', joinedAt: Date.now() };

        // Dedup: remove old WS entry for same deviceId (reconnecting player)
        for (const [oldWs, oldInfo] of session.echoes) {
          if (oldInfo.deviceId === deviceId && oldWs !== ws) {
            session.echoes.delete(oldWs);
            try { oldWs.close(); } catch {}
            console.log(`Dedup: removed stale connection for ${deviceId}`);
            break;
          }
        }

        session.echoes.set(ws, info);

        ws.send(JSON.stringify({ type: 'joined', role, code: sessionCode, deviceId }));

        // Notify all bridges that a new echo connected
        for (const bridge of session.bridges) {
          if (bridge.readyState === 1) {
            bridge.send(JSON.stringify({
              type: 'echo_connected',
              device: info,
              deviceCount: session.echoes.size,
            }));
          }
        }
        console.log(`Echo ${deviceId} joined session ${sessionCode} (${session.echoes.size} echoes)`);
      }
      return;
    }

    // --- VOLUME data from echo → relay to bridges ---
    if (msg.type === 'volume' && role === 'echo' && sessionCode) {
      const session = sessions.get(sessionCode);
      if (!session) return;

      const payload = JSON.stringify({
        type: 'volume',
        deviceId,
        volume: msg.volume,
        isSpeaking: msg.isSpeaking,
      });

      for (const bridge of session.bridges) {
        if (bridge.readyState === 1) {
          bridge.send(payload);
        }
      }
      return;
    }

    // --- FUEL BOOST from bridge (teacher action) → relay to echoes ---
    if (msg.type === 'fuel_boost' && role === 'bridge' && sessionCode) {
      const session = sessions.get(sessionCode);
      if (!session) return;

      const payload = JSON.stringify({ type: 'fuel_boost', amount: msg.amount });
      for (const [echo] of session.echoes) {
        if (echo.readyState === 1) {
          echo.send(payload);
        }
      }
      return;
    }

    // --- GAME EVENTS from bridge → relay to all echoes ---
    if (msg.type?.startsWith('game:') && role === 'bridge' && sessionCode) {
      const session = sessions.get(sessionCode);
      if (!session) return;
      const payload = JSON.stringify(msg);
      for (const [echo] of session.echoes) {
        if (echo.readyState === 1) echo.send(payload);
      }
      return;
    }

    // --- PLAYER EVENTS from echo → relay to all bridges ---
    if (msg.type?.startsWith('player:') && role === 'echo' && sessionCode) {
      const session = sessions.get(sessionCode);
      if (!session) return;
      const payload = JSON.stringify({ ...msg, deviceId });
      for (const bridge of session.bridges) {
        if (bridge.readyState === 1) bridge.send(payload);
      }
      return;
    }
  });

  ws.on('close', () => {
    if (!sessionCode) return;
    const session = sessions.get(sessionCode);
    if (!session) return;

    if (role === 'bridge') {
      session.bridges.delete(ws);
      console.log(`Bridge left session ${sessionCode}`);
    } else if (role === 'echo') {
      const info = session.echoes.get(ws);
      session.echoes.delete(ws);

      // Notify bridges
      for (const bridge of session.bridges) {
        if (bridge.readyState === 1) {
          bridge.send(JSON.stringify({
            type: 'echo_disconnected',
            deviceId: info?.deviceId,
            deviceCount: session.echoes.size,
          }));
        }
      }
      console.log(`Echo ${info?.deviceId} left session ${sessionCode} (${session.echoes.size} remaining)`);
    }

    // Clean up empty sessions
    if (session.bridges.size === 0 && session.echoes.size === 0) {
      sessions.delete(sessionCode);
      console.log(`Session ${sessionCode} cleaned up`);
    }
  });

  ws.on('error', (err) => {
    console.error('WS error:', err.message);
  });
});

// Periodic cleanup of stale sessions (every 5 min)
setInterval(() => {
  for (const [code, session] of sessions) {
    if (session.bridges.size === 0 && session.echoes.size === 0) {
      sessions.delete(code);
    }
  }
}, 5 * 60 * 1000);
