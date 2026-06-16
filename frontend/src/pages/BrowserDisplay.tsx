import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

export default function BrowserDisplay() {
  const [uuid, setUuid] = useState<string | null>(localStorage.getItem('signage_device_uuid'));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uuid) {
      const registerDevice = async () => {
        try {
          const res = await fetch(`http://${window.location.hostname}:3000/api/devices/register`, {
            method: 'POST'
          });
          if (res.ok) {
            const data = await res.json();
            if (data.uuid) {
              localStorage.setItem('signage_device_uuid', data.uuid);
              setUuid(data.uuid);
            } else {
              setError('Ungültige Antwort vom Server beim Registrieren.');
            }
          } else {
            setError('Fehler beim Registrieren des Geräts.');
          }
        } catch (err) {
          console.error(err);
          setError('Netzwerkfehler beim Registrieren.');
        }
      };

      registerDevice();
    }
  }, [uuid]);

  if (error) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <h1 className="text-3xl font-bold mb-4 text-red-500">Fehler</h1>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  if (!uuid) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <div className="w-8 h-8 border-4 border-corporate-blue border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400">Registriere lokales Display...</p>
      </div>
    );
  }

  return <Navigate to={`/display/${uuid}`} replace />;
}
