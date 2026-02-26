import { useEffect, useRef, useCallback, useState } from 'react';
import { useBridgeStore } from '../stores/bridgeStore';

/**
 * WebSocket hook for Bridge Mode.
 * Connects to the relay server, receives volume data from Echo devices,
 * and feeds it into the bridge store.
 */
export default function useBridgeSocket(sessionCode) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const connect = useCallback(() => {
    if (!sessionCode) return;

    // Determine WS URL — same host as the page, port 8080
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
            // Initial device list
            if (msg.devices) {
              store.setConnectedDevices(msg.devices);
            }
            break;

          case 'echo_connected':
            store.addConnectedDevice(msg.device);
            break;

          case 'echo_disconnected':
            store.removeConnectedDevice(msg.deviceId);
            break;

          case 'volume':
            // Feed remote volume into the store
            store.setRemoteVolume(msg.deviceId, msg.volume, msg.isSpeaking);
            break;
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        // Reconnect after 2s
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

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connected };
}
