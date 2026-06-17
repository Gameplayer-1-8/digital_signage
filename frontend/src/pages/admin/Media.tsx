import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, AlertCircle, Play, Search, ChevronDown, X } from 'lucide-react';
import Modal from '../../components/Modal';

interface MediaItem {
  id: number;
  filename: string;
  filepath: string;
  type: string;
}

interface Device {
  id: number;
  name: string;
}

export default function Media() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Modal States
  const [deleteMediaId, setDeleteMediaId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Assign Media States
  const [assignMediaId, setAssignMediaId] = useState<number | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const fetchMedia = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/media`);
      const data = await res.json();
      setMediaItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/devices`);
      const data = await res.json();
      setDevices(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMedia();
    fetchDevices();
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/media`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Upload fehlgeschlagen');
      }
      
      await fetchMedia();
    } catch (err) {
      console.error('Upload failed', err);
      setErrorMessage('Es gab ein Problem beim Hochladen der Datei. Bitte versuchen Sie es erneut.');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete media using DELETE /api/media/:id
  const handleDeleteExecute = async () => {
    if (!deleteMediaId) return;
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/media/${deleteMediaId}`, { method: 'DELETE' });
      setDeleteMediaId(null);
      await fetchMedia();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleAssignMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignMediaId || !selectedDeviceId) return;

    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/devices/${selectedDeviceId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: assignMediaId })
      });
      setAssignMediaId(null);
      setSelectedDeviceId('');
      // Optionally show a success toast here
    } catch (err) {
      console.error('Assign failed', err);
      setErrorMessage('Zuweisung fehlgeschlagen.');
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const filteredMedia = mediaItems.filter(item => 
    item.filename.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-corporate-dark mb-2">Medienbibliothek</h1>
          <p className="text-corporate-grey">Verwalten Sie Bilder und Videos für Ihre Kampagnen.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Volltextsuche..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-corporate-blue w-64 bg-white text-gray-800"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Suche leeren"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*,video/*" 
            onChange={handleFileChange} 
          />
          <button 
            onClick={triggerUpload}
            disabled={uploading}
            className={`px-4 py-2 rounded-md font-medium flex items-center space-x-2 transition-colors shadow-sm text-white ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-corporate-blue hover:bg-corporate-darkBlue'}`}
          >
            <Upload size={20} />
            <span>{uploading ? 'Wird hochgeladen...' : 'Medium hochladen'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-corporate-grey">Lade Medien...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMedia.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
              <Upload className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-medium">Keine Medien gefunden.</p>
            </div>
          ) : (
            filteredMedia.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group relative">
                <div className="aspect-video bg-black flex items-center justify-center overflow-hidden relative">
                  {item.type === 'video' ? (
                    <video src={`${import.meta.env.VITE_API_BASE_URL}${item.filepath}`} className="w-full h-full object-cover" preload="metadata" muted />
                  ) : (
                    <img src={`${import.meta.env.VITE_API_BASE_URL}${item.filepath}`} alt={item.filename} className="w-full h-full object-cover" />
                  )}
                  {/* Overlay Action Buttons */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                    <button 
                      onClick={() => setAssignMediaId(item.id)}
                      className="p-3 bg-corporate-blue text-white rounded-full hover:bg-corporate-darkBlue shadow-lg transform hover:scale-105 transition-all"
                      title="Auf Bildschirm abspielen"
                    >
                      <Play size={20} />
                    </button>
                    <button 
                      onClick={() => setDeleteMediaId(item.id)}
                      className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg transform hover:scale-105 transition-all"
                      title="Löschen"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-100">
                  <p className="font-medium text-corporate-dark truncate" title={item.filename}>{item.filename}</p>
                  <p className="text-sm text-gray-500 uppercase mt-1">{item.type}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Assign Modal */}
      <Modal isOpen={!!assignMediaId} onClose={() => setAssignMediaId(null)} title="Medium auf Bildschirm abspielen">
        <form onSubmit={handleAssignMedia}>
          <p className="text-gray-600 mb-4">Wählen Sie einen Bildschirm aus, auf dem dieses Medium sofort angezeigt werden soll.</p>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bildschirm auswählen</label>
            <div className="relative">
              <select 
                required
                value={selectedDeviceId}
                onChange={e => setSelectedDeviceId(e.target.value)}
                className="w-full bg-white text-gray-800 border border-gray-300 rounded-md py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-corporate-blue appearance-none"
              >
                <option value="" disabled>-- Bitte wählen --</option>
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => setAssignMediaId(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">Abbrechen</button>
            <button type="submit" className="px-4 py-2 bg-corporate-blue text-white rounded-md hover:bg-corporate-darkBlue transition-colors font-medium">Zuweisen</button>
          </div>
        </form>
      </Modal>

      {/* Error Modal */}
      <Modal isOpen={!!errorMessage} onClose={() => setErrorMessage(null)} title="Fehler">
        <div className="flex items-start space-x-3 text-red-600 mb-6">
          <AlertCircle className="shrink-0 mt-0.5" size={24} />
          <p>{errorMessage}</p>
        </div>
        <div className="flex justify-end">
          <button onClick={() => setErrorMessage(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium">Schließen</button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteMediaId} onClose={() => setDeleteMediaId(null)} title="Medium löschen">
        <p className="text-gray-600 mb-6">Möchten Sie dieses Medium wirklich unwiderruflich löschen? Wenn es aktuell auf Bildschirmen läuft, werden diese Bildschirme sofort gestoppt.</p>
        <div className="flex justify-end space-x-3">
          <button onClick={() => setDeleteMediaId(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">Abbrechen</button>
          <button onClick={handleDeleteExecute} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium">Endgültig Löschen</button>
        </div>
      </Modal>
    </div>
  );
}
