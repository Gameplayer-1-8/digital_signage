import { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { useKeepAwake } from 'expo-keep-awake';
import { File, Paths } from 'expo-file-system';
import { getContentUriAsync } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
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

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'installing' | 'error';

const UPDATE_API_URL = 'https://api.github.com/repos/Gameplayer-1-8/digital_signage/releases/latest';
const CURRENT_APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // Check every 60 minutes

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
  // Prevent the screen from going to sleep - essential for digital signage
  useKeepAwake();

  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const webviewRef = useRef<WebView>(null);

  // Download APK directly and trigger Android package installer
  const downloadAndInstallUpdate = useCallback(async (downloadUrl: string) => {
    try {
      setUpdateStatus('downloading');
      setDownloadProgress(0);
      setUpdateError(null);

      // Reference to the APK file in cache directory
      const apkFile = new File(Paths.cache, 'update.apk');

      // Delete old APK if it exists
      if (apkFile.exists) {
        apkFile.delete();
      }

      // Download APK to cache directory
      const downloadedFile = await File.downloadFileAsync(downloadUrl, apkFile);

      if (!downloadedFile || !downloadedFile.exists) {
        throw new Error('Download fehlgeschlagen');
      }

      setDownloadProgress(1);
      setUpdateStatus('installing');

      // Convert file:// URI to content:// URI (required for Android 7+)
      // getContentUriAsync is still needed from legacy API for this
      const contentUri = await getContentUriAsync(downloadedFile.uri);

      // Launch Android package installer
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: 'application/vnd.android.package-archive',
      });

      // If we get here, the installer was shown. Reset status.
      setUpdateStatus('idle');
    } catch (err) {
      console.error('Update failed:', err);
      setUpdateError(`Update fehlgeschlagen: ${(err as Error).message}`);
      setUpdateStatus('error');
    }
  }, []);

  // Check GitHub for new releases - runs on mount and every 30 minutes
  useEffect(() => {
    let isMounted = true;
    let checkInterval: ReturnType<typeof setInterval>;

    const checkGithubReleaseUpdate = async () => {
      if (!isMounted) return;

      try {
        setUpdateStatus('checking');

        const response = await fetch(UPDATE_API_URL, {
          headers: { Accept: 'application/vnd.github+json' }
        });
        if (!response.ok) {
          setUpdateStatus('idle');
          return;
        }

        const release = (await response.json()) as GithubRelease;
        const releaseVersion = normalizeVersion(release.tag_name || '');

        if (!releaseVersion || !isVersionNewer(CURRENT_APP_VERSION, releaseVersion)) {
          if (isMounted) setUpdateStatus('idle');
          return;
        }

        const apkAsset = release.assets?.find((asset) => asset.name.endsWith('.apk'));
        if (!apkAsset?.browser_download_url || !isMounted) {
          setUpdateStatus('idle');
          return;
        }

        setUpdateVersion(releaseVersion);
        setUpdateStatus('available');

        // Auto-download and install on Fire TV (no user interaction needed for download)
        await downloadAndInstallUpdate(apkAsset.browser_download_url);
      } catch (err) {
        if (isMounted) {
          console.error('Update check failed', err);
          setUpdateStatus('idle'); // Silent fail, will retry later
        }
      }
    };

    checkGithubReleaseUpdate();

    // Periodic update check
    checkInterval = setInterval(checkGithubReleaseUpdate, UPDATE_CHECK_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(checkInterval);
    };
  }, [downloadAndInstallUpdate]);

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

  // Render update banner based on current update status
  const renderUpdateBanner = () => {
    if (updateStatus === 'idle' || updateStatus === 'checking') return null;

    return (
      <View style={styles.updateBanner}>
        {updateStatus === 'available' && (
          <>
            <Text style={styles.updateTitle}>Neue Version verfügbar ({updateVersion})</Text>
            <Text style={styles.updateSubtext}>Download wird gestartet...</Text>
          </>
        )}

        {updateStatus === 'downloading' && (
          <>
            <Text style={styles.updateTitle}>Update wird heruntergeladen... {Math.round(downloadProgress * 100)}%</Text>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${Math.round(downloadProgress * 100)}%` }]} />
            </View>
          </>
        )}

        {updateStatus === 'installing' && (
          <>
            <Text style={styles.updateTitle}>Update wird installiert...</Text>
            <ActivityIndicator size="small" color="#60a5fa" />
          </>
        )}

        {updateStatus === 'error' && (
          <>
            <Text style={styles.updateTitle}>Update fehlgeschlagen</Text>
            {updateError && <Text style={styles.updateErrorText}>{updateError}</Text>}
            <Text style={styles.updateSubtext}>Nächster Versuch in 30 Minuten</Text>
          </>
        )}
      </View>
    );
  };

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
      {renderUpdateBanner()}
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
    gap: 8,
  },
  updateTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  updateSubtext: {
    color: '#9ca3af',
    fontSize: 12,
  },
  updateErrorText: {
    color: '#fca5a5',
    fontSize: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
});
