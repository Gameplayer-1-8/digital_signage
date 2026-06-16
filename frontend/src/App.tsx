import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './pages/admin/Layout';
import Dashboard from './pages/admin/Dashboard';
import Devices from './pages/admin/Devices';
import Media from './pages/admin/Media';
import Display from './pages/Display';
import BrowserDisplay from './pages/BrowserDisplay';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      
      {/* Admin Dashboard Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="devices" element={<Devices />} />
        <Route path="media" element={<Media />} />
        <Route path="settings" element={<div className="text-corporate-grey">Einstellungen (kommt bald)</div>} />
      </Route>

      {/* Public Display Routes */}
      <Route path="/display/browser" element={<BrowserDisplay />} />
      <Route path="/display/:deviceId" element={<Display />} />
    </Routes>
  );
}

export default App;
