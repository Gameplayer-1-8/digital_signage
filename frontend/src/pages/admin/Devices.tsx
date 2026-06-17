import { useState, useEffect } from 'react';
import { Monitor, Plus, Trash2, Edit2, Play, Image as ImageIcon, Check, X, ChevronDown } from 'lucide-react';
import Modal from '../../components/Modal';

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
  filepath: string;
  type: string;
}

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addLocation, setAddLocation] = useState('');

  const [editingDeviceId, setEditingDeviceId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');

  const [deleteDeviceId, setDeleteDeviceId] = useState<number | null>(null);

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

    const interval = setInterval(fetchData, 10000);
    const sse = new EventSource(`${import.meta.env.VITE_API_BASE_URL}/api/sse`);
    sse.addEventListener('device-update', () => {
      fetchData();
    });

    return () => {
      clearInterval(interval);
      sse.close();
    };
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;

    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: addName, location: addLocation })
    });
    
    setIsAddModalOpen(false);
    setAddName('');
    setAddLocation('');
    fetchData();
  };

  const handleInlineEditSubmit = async () => {
    if (!editingDeviceId || !editName.trim()) return;

    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/devices/${editingDeviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, location: editLocation })
    });
    
    setEditingDeviceId(null);
    fetchData();
  };

  const confirmDelete = async () => {
    if (!deleteDeviceId) return;
    await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/devices/${deleteDeviceId}`, { method: 'DELETE' });
    setDeleteDeviceId(null);
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
          onClick={() => setIsAddModalOpen(true)}
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
                devices.map(device => {
                  const activeMedia = mediaItems.find(m => m.id === device.activeMediaId);
                  const isEditing = editingDeviceId === device.id;
                  
                  return (
                    <tr key={device.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4" title={`Letzter Ping: ${new Date(device.lastPing).toLocaleString()}`}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${device.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
                          <span className="text-sm text-gray-600">{device.isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-corporate-dark">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-corporate-blue w-full max-w-[200px]"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center space-x-3">
                            <Monitor className="text-corporate-grey shrink-0" size={20} />
                            <span className="truncate max-w-[200px] block">{device.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-corporate-blue w-full max-w-[150px]"
                          />
                        ) : (
                          device.location || '-'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {activeMedia ? (
                            <div className="w-10 h-10 rounded bg-black overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200 shadow-sm relative group">
                              {activeMedia.type === 'video' ? (
                                <>
                                  <video src={`${import.meta.env.VITE_API_BASE_URL}${activeMedia.filepath}`} className="w-full h-full object-cover" muted />
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <Play size={14} className="text-white opacity-70" />
                                  </div>
                                </>
                              ) : (
                                <img src={`${import.meta.env.VITE_API_BASE_URL}${activeMedia.filepath}`} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 border-dashed flex-shrink-0 flex items-center justify-center text-gray-400">
                              <ImageIcon size={16} />
                            </div>
                          )}
                          <div className="relative">
                            <select 
                              className="bg-white border border-gray-300 text-gray-800 rounded-md py-1.5 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-corporate-blue focus:border-transparent text-sm w-48 appearance-none"
                              value={device.activeMediaId || ''}
                              onChange={(e) => handleMediaChange(device.id, e.target.value)}
                              disabled={isEditing}
                            >
                              <option value="">Keine Zuweisung</option>
                              {mediaItems.map(m => (
                                <option key={m.id} value={m.id}>{m.filename}</option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-500">
                              <ChevronDown size={16} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {isEditing ? (
                          <>
                            <button 
                              onClick={handleInlineEditSubmit}
                              className="p-2 text-green-600 hover:text-green-700 transition-colors rounded-full hover:bg-green-50 inline-block"
                              title="Speichern"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => setEditingDeviceId(null)}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 inline-block"
                              title="Abbrechen"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => {
                                setEditingDeviceId(device.id);
                                setEditName(device.name);
                                setEditLocation(device.location || '');
                              }} 
                              className="p-2 text-gray-400 hover:text-corporate-blue transition-colors rounded-full hover:bg-blue-50 inline-block"
                              title="Bearbeiten"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => setDeleteDeviceId(device.id)} 
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50 inline-block"
                              title="Löschen"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Neues Gerät hinzufügen">
        <form onSubmit={handleAddSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name des Bildschirms</label>
              <input 
                type="text" 
                required
                value={addName}
                onChange={e => setAddName(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-corporate-blue"
                placeholder="z.B. Foyer Links"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standort (optional)</label>
              <input 
                type="text" 
                value={addLocation}
                onChange={e => setAddLocation(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-corporate-blue"
                placeholder="z.B. Erdgeschoss"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">Abbrechen</button>
            <button type="submit" className="px-4 py-2 bg-corporate-blue text-white rounded-md hover:bg-corporate-darkBlue transition-colors font-medium">Hinzufügen</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteDeviceId} onClose={() => setDeleteDeviceId(null)} title="Gerät löschen">
        <p className="text-gray-600 mb-6">Möchten Sie dieses Gerät wirklich unwiderruflich löschen? Es wird anschließend nicht mehr über das Dashboard steuerbar sein.</p>
        <div className="flex justify-end space-x-3">
          <button onClick={() => setDeleteDeviceId(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">Abbrechen</button>
          <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium">Endgültig Löschen</button>
        </div>
      </Modal>
    </div>
  );
}
