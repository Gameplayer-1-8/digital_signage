import { useState, useEffect } from 'react';
import { Monitor, Server, PlayCircle, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Device {
  id: number;
  name: string;
  isOnline: boolean;
  activeMediaId: number | null;
}

interface MediaItem {
  id: number;
  filename: string;
}

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devRes, mediaRes] = await Promise.all([
          fetch('http://localhost:3000/api/devices'),
          fetch('http://localhost:3000/api/media')
        ]);
        const [devData, mediaData] = await Promise.all([devRes.json(), mediaRes.json()]);
        setDevices(devData);
        setMediaItems(mediaData);
      } catch (err) {
        console.error('Fehler beim Laden der Dashboard-Daten:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // Refresh every 10 seconds to keep stats updated
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const onlineDevices = devices.filter(d => d.isOnline).length;
  const activeDisplays = devices.filter(d => d.activeMediaId !== null).length;

  if (loading) {
    return <div className="text-center py-10 text-corporate-grey">Lade Dashboard...</div>;
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-corporate-dark mb-2">Dashboard</h1>
          <p className="text-corporate-grey">Übersicht über Ihr Signage-Netzwerk.</p>
        </div>
        <a 
          href="/display/browser" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-corporate-blue hover:bg-corporate-dark text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors shadow-sm"
        >
          <Monitor size={20} />
          <span>Display im Browser Starten</span>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-corporate-blue">
            <Monitor size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Alle Geräte</p>
            <p className="text-2xl font-bold text-corporate-dark">{devices.length}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
            <Server size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Online</p>
            <p className="text-2xl font-bold text-corporate-dark">{onlineDevices}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-500">
            <PlayCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Aktive Wiedergaben</p>
            <p className="text-2xl font-bold text-corporate-dark">{activeDisplays}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Medien Dateien</p>
            <p className="text-2xl font-bold text-corporate-dark">{mediaItems.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-corporate-dark mb-4">Gerätestatus</h2>
          {devices.length === 0 ? (
            <p className="text-gray-500 text-sm">Keine Geräte registriert.</p>
          ) : (
            <div className="space-y-4">
              {devices.map(device => {
                const activeMedia = device.activeMediaId 
                  ? mediaItems.find(m => m.id === device.activeMediaId)?.filename || 'Unbekanntes Medium'
                  : 'Nichts wird abgespielt';

                return (
                  <div key={device.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${device.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <p className="font-medium text-corporate-dark text-sm">{device.name}</p>
                        <p className="text-xs text-gray-500">{activeMedia}</p>
                      </div>
                    </div>
                    <Link to="/admin/devices" className="text-xs text-corporate-blue hover:underline">Verwalten</Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-corporate-dark mb-4">Neueste Medien</h2>
          {mediaItems.length === 0 ? (
            <p className="text-gray-500 text-sm">Keine Medien vorhanden.</p>
          ) : (
            <div className="space-y-4">
              {mediaItems.slice(-5).map(media => (
                <div key={media.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center space-x-3">
                    <PlayCircle className="text-corporate-grey" size={18} />
                    <p className="font-medium text-corporate-dark text-sm">{media.filename}</p>
                  </div>
                  <Link to="/admin/media" className="text-xs text-corporate-blue hover:underline">Ansehen</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
