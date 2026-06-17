import { Link, useLocation } from 'react-router-dom';
import { Monitor, Image as ImageIcon, LayoutDashboard, Settings } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Bildschirme', path: '/admin/devices', icon: <Monitor size={20} /> },
    { name: 'Medien', path: '/admin/media', icon: <ImageIcon size={20} /> },
    { name: 'Einstellungen', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col shadow-sm">
      <div className="p-6 border-b border-gray-100 flex items-center justify-center">
        <img src="/logo.jpg" alt="Logo" className="max-h-16 object-contain" />
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                isActive 
                  ? 'bg-corporate-blue text-white font-medium shadow-sm' 
                  : 'text-corporate-grey hover:bg-gray-50 hover:text-corporate-dark'
              }`}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100 text-sm text-gray-500 text-center">
        &copy; 2026 SignagePro
      </div>
    </div>
  );
}
