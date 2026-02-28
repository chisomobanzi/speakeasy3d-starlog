import { useEffect, useRef, useCallback, useState } from 'react';
import { useBridgeStore } from '../stores/bridgeStore';

/**
 * WebSocket hook for Bridge Mode.
 * Connects to the relay server, receives data from Echo devices,
 * and feeds it into the bridge store.
 *
 * Returns { connected, send } — send() broadcasts to all echoes in the session.
 */
export default function useBridgeSocket(sessionCode) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const connect = useCallback(() => {
    if (!sessionCode) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({
          type: 'join',
          role: 'bridge',
          code: sessionCode,
        }));
      };

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        const store = useBridgeStore.getState();

        switch (msg.type) {
          case 'joined':
            if (msg.devices) {
              store.setConnectedDevices(msg.devices);
              // Also register as players
              msg.devices.forEach((d) => {
                if (d.name) {
                  store.addPlayer({
                    id: d.deviceId,
                    name: d.name,
                    language: d.language || 'en',
                  });
                }
              });
            }
            break;

          case 'echo_connected':
            store.addConnectedDevice(msg.device);
            // Register as player if they have a name
            if (msg.device?.name) {
              store.addPlayer({
                id: msg.device.deviceId,
                name: msg.device.name,
                language: msg.device.language || 'en',
              });
            }
            break;

          case 'echo_disconnected':
            store.removeConnectedDevice(msg.deviceId);
            store.removePlayer(msg.deviceId);
            break;

          case 'volume':
            store.setRemoteVolume(msg.deviceId, msg.volume, msg.isSpeaking);
            break;

          // Player game events (relayed from echo → bridge)
          case 'player:word_scored':
            store.scoreWord({
              playerId: msg.deviceId,
              playerName: msg.playerName,
              word: msg.word,
              points: msg.points,
              team: msg.team,
            });
            break;
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        reconnectTimerRef.current = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        // onclose will fire after this
      };
    } catch {
      // Will retry via reconnect
    }
  }, [sessionCode]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  // Send a message to all echoes in the session (via server relay)
  const send = useCallback((data) => {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connected, send };
}
