import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Mic, Home, Search, Package, Video } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-md">
        <nav className="mt-4">
          <Link
            to="/"
            className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 ${
              location.pathname === '/' ? 'bg-gray-50 text-blue-600' : ''
            }`}
          >
            <Home className="w-5 h-5 mr-3" />
            Home
          </Link>
          <Link
            to="/sunlight"
            className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 ${
              location.pathname.startsWith('/sunlight') ? 'bg-gray-50 text-blue-600' : ''
            }`}
          >
            <Sun className="w-5 h-5 mr-3" />
            Sunlight
          </Link>
          <Link
            to="/transcriber"
            className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 ${
              location.pathname === '/transcriber' ? 'bg-gray-50 text-blue-600' : ''
            }`}
          >
            <Mic className="w-5 h-5 mr-3" />
            Transcriber
          </Link>
          <Link
            to="/bundle"
            className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 ${
              location.pathname === '/bundle' ? 'bg-gray-50 text-blue-600' : ''
            }`}
          >
            <Package className="w-5 h-5 mr-3" />
            Bundle
          </Link>
          <Link
            to="/ai-search"
            className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 ${
              location.pathname === '/ai-search' ? 'bg-gray-50 text-blue-600' : ''
            }`}
          >
            <Search className="w-5 h-5 mr-3" />
            AI Search
          </Link>
          <Link
            to="/weezr"
            className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 ${
              location.pathname === '/weezr' ? 'bg-gray-50 text-blue-600' : ''
            }`}
          >
            <Video className="w-5 h-5 mr-3" />
            Weezr
          </Link>
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

export default Layout;