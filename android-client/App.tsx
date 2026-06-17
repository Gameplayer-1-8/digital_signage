import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Linking, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import dgram from 'react-native-udp';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

type GithubReleaseAsset = {
  name: string;
  browser_download_url: string;
};

type GithubRelease = {
  tag_name: string;
  assets?: GithubReleaseAsset[];
};

const UPDATE_API_URL = 'https://api.github.com/repos/Gameplayer-1-8/digital_signage/releases/latest';
const CURRENT_APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

function normalizeVersion(version: string) {
  return version.replace(/^v/i, '').trim();
}

function isVersionNewer(currentVersion: string, releaseVersion: string) {
  const current = normalizeVersion(currentVersion).split('.').map((part) => Number.parseInt(part, 10) || 0);
  const next = normalizeVersion(releaseVersion).split('.').map((part) => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(current.length, next.length);

  for (let i = 0; i < maxLength; i += 1) {
    const currentPart = current[i] ?? 0;
    const nextPart = next[i] ?? 0;
    if (nextPart > currentPart) return true;
    if (nextPart < currentPart) return false;
  }

  return false;
}

export default function App() {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [updateDownloadUrl, setUpdateDownloadUrl] = useState<string | null>(null);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const webviewRef = useRef<WebView>(null);

  const downloadLatestUpdate = async (downloadUrl: string) => {
    try {
      await Linking.openURL(downloadUrl);
    } catch (err) {
      console.error('Unable to open release URL', err);
      setUpdateError('Update verfügbar, aber Download-Link konnte nicht geöffnet werden.');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkGithubReleaseUpdate = async () => {
      try {
        const response = await fetch(UPDATE_API_URL, {
          headers: { Accept: 'application/vnd.github+json' }
        });
        if (!response.ok) return;

        const release = (await response.json()) as GithubRelease;
        const releaseVersion = normalizeVersion(release.tag_name || '');
        if (!releaseVersion || !isVersionNewer(CURRENT_APP_VERSION, releaseVersion)) return;

        const apkAsset = release.assets?.find((asset) => asset.name.endsWith('.apk'));
        if (!apkAsset?.browser_download_url || !isMounted) return;

        setUpdateVersion(releaseVersion);
        setUpdateDownloadUrl(apkAsset.browser_download_url);
        await downloadLatestUpdate(apkAsset.browser_download_url);
      } catch (err) {
        if (isMounted) {
          console.error('Update check failed', err);
        }
      }
    };

    checkGithubReleaseUpdate();

    return () => {
      isMounted = false;
    };
  }, []);

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

    const connectWs = async () => {
      if (!isMounted) return;
      
      const apiPort = (await AsyncStorage.getItem('SIGNAGE_API_PORT')) || '3000';
      ws = new WebSocket(`ws://${ip}:${apiPort}/api/ws`);

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
          } else if (data.type === 'invalid_device') {
            AsyncStorage.removeItem('DEVICE_UUID').then(() => {
              setServerUrl(null);
            });
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
          const parts = data.split(':');
          const port = parts[2];
          const apiPort = parts[3] === 'API' && parts[4] ? parts[4] : '3000';
          
          // Get or create UUID
          let deviceUuid = await AsyncStorage.getItem('DEVICE_UUID');
          
          if (!deviceUuid) {
            if (isRegistering) return; // Prevent concurrent registrations
            
            isRegistering = true;
            try {
              const res = await fetch(`http://${rinfo.address}:${apiPort}/api/devices/register`, {
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
              await AsyncStorage.setItem('SIGNAGE_API_PORT', apiPort);
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
        <Image source={require('./assets/logo.jpg')} style={styles.logo} resizeMode="contain" />
        <ActivityIndicator size="large" color="#0056b3" />
        <Text style={styles.text}>Suche nach Server im Netzwerk...</Text>
      </View>
    );
  }

  return (
    <View style={styles.webviewContainer}>
      {updateDownloadUrl && (
        <View style={styles.updateBanner}>
          <Text style={styles.updateTitle}>Neue App-Version verfügbar ({updateVersion})</Text>
          <TouchableOpacity onPress={() => downloadLatestUpdate(updateDownloadUrl)} style={styles.updateButton}>
            <Text style={styles.updateButtonText}>Update jetzt laden</Text>
          </TouchableOpacity>
          {updateError ? <Text style={styles.updateErrorText}>{updateError}</Text> : null}
        </View>
      )}
      <WebView 
        ref={webviewRef}
        source={{ uri: serverUrl }} 
        style={{ flex: 1 }}
        cacheEnabled={false}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'invalid_device') {
              AsyncStorage.removeItem('DEVICE_UUID').then(() => {
                setServerUrl(null);
              });
            }
          } catch(e) {}
        }}
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
  logo: {
    width: 250,
    height: 100,
    marginBottom: 30,
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  },
  updateBanner: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    gap: 8
  },
  updateTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  updateButton: {
    backgroundColor: '#2563eb',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start'
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  updateErrorText: {
    color: '#fca5a5',
    fontSize: 12
  },
});
