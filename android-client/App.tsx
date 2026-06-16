import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import dgram from 'react-native-udp';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    if (!serverUrl) return;

    // Parse IP and UUID from serverUrl (e.g. http://192.168.x.x:5173/display/uuid)
    const ip = serverUrl.split('//')[1]?.split(':')[0];
    const uuid = serverUrl.split('/').pop();
    
    if (!ip || !uuid) return;

    let ws: WebSocket | null = null;
    let pingInterval: any;
    let isMounted = true;
    let reconnectTimeout: any;

    const connectWs = () => {
      if (!isMounted) return;
      
      ws = new WebSocket(`ws://${ip}:3000/api/ws`);

      ws.onopen = () => {
        console.log('WS connected');
        ws?.send(JSON.stringify({ type: 'register', uuid }));
        
        pingInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', uuid })); // Also include UUID in ping for robustness
          } else if (ws?.readyState === WebSocket.CLOSED || ws?.readyState === WebSocket.CLOSING) {
            console.log('WS ping found closed socket, forcing reconnect...');
            clearInterval(pingInterval);
            if (ws) ws.close(); // Triggers onclose if not already triggered
          }
        }, 5000); // Ping every 5 seconds is enough
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'reload') {
            webviewRef.current?.reload();
          }
        } catch (err) {}
      };

      ws.onerror = (e) => {
        console.error('WS Error:', e.message);
        // Error will usually be followed by onclose, but we can close it to be safe
        if (ws) ws.close();
      };

      ws.onclose = () => {
        console.log('WS closed, reconnecting in 5s...');
        clearInterval(pingInterval);
        
        if (isMounted) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(connectWs, 5000);
        }
      };
    };

    connectWs();

    return () => {
      isMounted = false;
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null; // Prevent onclose from firing and reconnecting
        ws.close();
      }
    };
  }, [serverUrl]);

  useEffect(() => {
    let socket: any = null;
    let isRegistering = false;

    const initDiscovery = async () => {
      // 1. Try to load saved URL first for fast boot
      try {
        const savedUrl = await AsyncStorage.getItem('SIGNAGE_SERVER_URL');
        if (savedUrl) {
          setServerUrl(savedUrl);
        }
      } catch (e) {}

      // 2. Listen for UDP Broadcasts to discover/update URL
      socket = dgram.createSocket({ type: 'udp4', reuseAddress: true });
      
      socket.on('message', async (msg: any, rinfo: any) => {
        const data = msg.toString();
        if (data.startsWith('SIGNAGE_DISCOVERY:PORT:')) {
          const port = data.split(':')[2];
          
          // Get or create UUID
          let deviceUuid = await AsyncStorage.getItem('DEVICE_UUID');
          
          if (!deviceUuid) {
            if (isRegistering) return; // Prevent concurrent registrations
            
            isRegistering = true;
            try {
              const res = await fetch(`http://${rinfo.address}:3000/api/devices/register`, {
                method: 'POST'
              });
              const json = await res.json();
              if (json.uuid) {
                deviceUuid = json.uuid;
                await AsyncStorage.setItem('DEVICE_UUID', deviceUuid);
              }
            } catch (err) {
              console.error("Registration failed", err);
              return;
            } finally {
              isRegistering = false;
            }
          }

          if (deviceUuid) {
            const newUrl = `http://${rinfo.address}:${port}/display/${deviceUuid}`;
            
            setServerUrl(newUrl);
            try {
              await AsyncStorage.setItem('SIGNAGE_SERVER_URL', newUrl);
            } catch (e) {}
          }
        }
      });

      socket.on('listening', () => {
        console.log('Listening for auto-discovery...');
      });

      // Bind to the broadcast port
      socket.bind(44444);
    };

    initDiscovery();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []);

  if (!serverUrl) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0056b3" />
        <Text style={styles.text}>Suche nach Server im Netzwerk...</Text>
      </View>
    );
  }

  return (
    <View style={styles.webviewContainer}>
      <WebView 
        ref={webviewRef}
        source={{ uri: serverUrl }} 
        style={{ flex: 1 }}
        cacheEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  }
});
