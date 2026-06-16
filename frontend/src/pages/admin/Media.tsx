import { useState, useEffect, useRef } from 'react';
import { Upload, FileImage, FileVideo } from 'lucide-react';

interface MediaItem {
  id: number;
  filename: string;
  filepath: string;
  type: string;
}

export default function Media() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const fetchMedia = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/media');
      const data = await res.json();
      setMediaItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await fetch('http://localhost:3000/api/media', {
        method: 'POST',
        body: formData,
      });
      
      await fetchMedia();
    } catch (err) {
      console.error('Upload failed', err);
      alert('Fehler beim Upload!');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-corporate-dark mb-2">Medienbibliothek</h1>
          <p className="text-corporate-grey">Verwalten Sie Bilder und Videos für Ihre Kampagnen.</p>
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

      {loading ? (
        <div className="text-center py-10 text-corporate-grey">Lade Medien...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mediaItems.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
              <Upload className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-medium">Noch keine Medien hochgeladen.</p>
            </div>
          ) : (
            mediaItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
                  {item.type === 'video' ? (
                    <video src={`http://localhost:3000${item.filepath}`} className="w-full h-full object-cover" preload="metadata" muted />
                  ) : (
                    <img src={`http://localhost:3000${item.filepath}`} alt={item.filename} className="w-full h-full object-cover" />
                  )}
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
    </div>
  );
}
