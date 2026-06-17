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
          const data = await res.json();
          setMedia(data);
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
      ws = new WebSocket(`${import.meta.env.VITE_API_BASE_URL.replace(/^http/, 'ws')}/api/ws`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        ws?.send(JSON.stringify({ type: 'register', uuid: deviceId }));

        pingInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', uuid: deviceId }));
          }
        }, 15000); // Ping every 15 seconds
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'reload') {
            console.log('Received reload signal, fetching new media...');
            fetchMedia();
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
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

  const mediaSrc = media.filepath.startsWith('http') ? media.filepath : `${import.meta.env.VITE_API_BASE_URL}${media.filepath}`;

  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      {media.type === 'video' ? (
        <video 
          key={media.id} 
          src={mediaSrc} 
          autoPlay 
          muted 
          loop // Loop the single video infinitely!
          className="w-full h-full object-cover"
        />
      ) : (
        <img 
          key={media.id}
          src={mediaSrc} 
          alt={media.filename}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
