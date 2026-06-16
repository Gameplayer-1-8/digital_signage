import { useState, useEffect } from 'react';
import { Monitor, Plus, Trash2 } from 'lucide-react';

interface Device {
  id: number;
  name: string;
  location: string;
  isOnline: boolean;
  lastPing: string;
  activeMediaId: number | null;
}

interface MediaItem {
  id: number;
  filename: string;
}

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [devRes, mediaRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/devices`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/media`)
      ]);
      const [devData, mediaData] = await Promise.all([devRes.json(), mediaRes.json()]);
      setDevices(devData);
      setMediaItems(mediaData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async () => {
    const name = prompt('Name des Bildschirms:');
    if (!name) return;
    const location = prompt('Standort (optional):');
    
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, location })
    });
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Wirklich löschen?')) return;
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/devices/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleMediaChange = async (deviceId: number, mediaId: string) => {
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/devices/${deviceId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId: mediaId === '' ? null : parseInt(mediaId) })
    });
    fetchData();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-corporate-dark mb-2">Bildschirme</h1>
          <p className="text-corporate-grey">Verwalten Sie Ihre Digital Signage Geräte und deren Wiedergabe.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-corporate-blue hover:bg-corporate-darkBlue text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Gerät hinzufügen</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-corporate-grey">Lade Geräte...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm uppercase text-gray-500">
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Standort</th>
                <th className="px-6 py-4 font-medium">Aktives Medium</th>
                <th className="px-6 py-4 font-medium text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Keine Bildschirme vorhanden. Fügen Sie Ihr erstes Gerät hinzu.
                  </td>
                </tr>
              ) : (
                devices.map(device => (
                  <tr key={device.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${device.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600">{device.isOnline ? 'Online' : 'Offline'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-corporate-dark flex items-center space-x-3">
                      <Monitor className="text-corporate-grey" size={20} />
                      <span>{device.name}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{device.location || '-'}</td>
                    <td className="px-6 py-4">
                      <select 
                        className="bg-white border border-gray-300 text-gray-700 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-corporate-blue focus:border-transparent text-sm w-48"
                        value={device.activeMediaId || ''}
                        onChange={(e) => handleMediaChange(device.id, e.target.value)}
                      >
                        <option value="">Keine Zuweisung</option>
                        {mediaItems.map(m => (
                          <option key={m.id} value={m.id}>{m.filename}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(device.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
