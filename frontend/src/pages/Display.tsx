import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface MediaItem {
  id: number;
  filename: string;
  filepath: string;
  type: string;
}

export default function Display() {
  const { deviceId } = useParams();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch(`/api/devices/${deviceId}/media`);
        if (res.ok) {
          if (res.status === 204) {
            setMedia(null);
          } else {
            const text = await res.text();
            if (!text) {
              setMedia(null);
            } else {
              setMedia(JSON.parse(text));
            }
          }
        } else if (res.status === 404) {
          console.warn('Device not found. Re-registering.');
          // @ts-ignore
          if (window.ReactNativeWebView) {
            // @ts-ignore
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'invalid_device' }));
          } else {
            localStorage.removeItem('signage_device_uuid');
            window.location.href = '/display/browser';
          }
        } else {
          setMedia(null);
        }
      } catch (err) {
        console.error('Failed to fetch media', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();

    // WebSocket Connection
    let ws: WebSocket | null = null;
    let pingInterval: ReturnType<typeof setInterval>;

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        ws?.send(JSON.stringify({ type: 'register', uuid: deviceId }));

        pingInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', uuid: deviceId }));
          } else {
            console.log('WebSocket seems closed during ping, forcing reconnect...');
            clearInterval(pingInterval);
            ws?.close();
            setTimeout(connectWs, 5000);
          }
        }, 10000); // Ping every 10 seconds
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'reload') {
            console.log('Received reload signal, fetching new media...');
            fetchMedia();
          } else if (data.type === 'invalid_device') {
            console.warn('Device invalid or deleted. Re-registering.');
            // @ts-ignore
            if (window.ReactNativeWebView) {
              // @ts-ignore
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'invalid_device' }));
            } else {
              localStorage.removeItem('signage_device_uuid');
              window.location.href = '/display/browser';
            }
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws?.close(); // Trigger onclose
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting in 5s...');
        clearInterval(pingInterval);
        setTimeout(connectWs, 5000);
      };
    };

    connectWs();

    return () => {
      if (ws) {
        ws.onclose = null; // Prevent reconnect loop on unmount
        ws.close();
      }
      clearInterval(pingInterval);
    };
  }, [deviceId]);

  // Keep screen awake using the Screen Wake Lock API (for browser-based displays)
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake Lock activated');
          wakeLock.addEventListener('release', () => {
            console.log('Wake Lock released');
          });
        }
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    };

    requestWakeLock();

    // Re-acquire wake lock when page becomes visible again (e.g., after tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, []);

  if (loading) {
    return <div className="w-screen h-screen bg-black"></div>;
  }

  if (!media) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-white">
        <img src="/logo.jpg" alt="Logo" className="w-64 mb-6 object-contain" />
        <p className="text-gray-400">Kein Medium zugewiesen.</p>
        <p className="text-gray-600 mt-2 text-sm">Device ID: {deviceId}</p>
      </div>
    );
  }

  const mediaSrc = media.filepath;

  return (
    <div className="w-screen h-screen bg-white overflow-hidden flex items-center justify-center">
      {media.type === 'video' ? (
        <video 
          key={media.id} 
          src={mediaSrc} 
          autoPlay 
          muted 
          loop // Loop the single video infinitely!
          className="w-full h-full object-contain"
        />
      ) : (
        <img 
          key={media.id}
          src={mediaSrc} 
          alt={media.filename}
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}
