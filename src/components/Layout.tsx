import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Mic, Home, LogOut, User, Shield, Users, Network, Waves, Archive, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getClassificationColor = (name?: string) => {
    switch (name?.toLowerCase()) {
      case 'green': return 'bg-green-900 text-green-100';
      case 'yellow': return 'bg-yellow-900 text-yellow-100';
      case 'black': return 'bg-gray-100 text-gray-900';
      default: return 'bg-gray-800 text-gray-100';
    }
  };

  const NavLinks = () => (
    <>
      <Link
        to="/"
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 ${
          location.pathname === '/' ? 'bg-gray-800 text-blue-400' : ''
        }`}
      >
        <Home className="w-5 h-5 mr-3" />
        Home
      </Link>
      <Link
        to="/sunlight"
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 ${
          location.pathname.startsWith('/sunlight') ? 'bg-gray-800 text-blue-400' : ''
        }`}
      >
        <Sun className="w-5 h-5 mr-3" />
        Sunlight
      </Link>
      <Link
        to="/transcriber"
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 ${
          location.pathname === '/transcriber' ? 'bg-gray-800 text-blue-400' : ''
        }`}
      >
        <Mic className="w-5 h-5 mr-3" />
        Transcriber Helper
      </Link>
      <Link
        to="/connections"
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 ${
          location.pathname === '/connections' ? 'bg-gray-800 text-blue-400' : ''
        }`}
      >
        <Network className="w-5 h-5 mr-3" />
        Connections
      </Link>
      <Link
        to="/reverberate"
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 ${
          location.pathname === '/reverberate' ? 'bg-gray-800 text-blue-400' : ''
        }`}
      >
        <Waves className="w-5 h-5 mr-3" />
        Reverberate
      </Link>
      <Link
        to="/archive"
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 ${
          location.pathname === '/archive' ? 'bg-gray-800 text-blue-400' : ''
        }`}
      >
        <Archive className="w-5 h-5 mr-3" />
        Internet Archive
      </Link>
      {profile?.classification?.name === 'black' && (
        <Link
          to="/users"
          onClick={() => setIsSidebarOpen(false)}
          className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 ${
            location.pathname === '/users' ? 'bg-gray-800 text-blue-400' : ''
          }`}
        >
          <Users className="w-5 h-5 mr-3" />
          Users
        </Link>
      )}
    </>
  );

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-400 hover:text-gray-300"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="text-white font-semibold">Argonath</div>
        <div className="w-8" /> {/* Spacer to maintain centering */}
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-200 ease-in-out w-64 bg-gray-800 shadow-md z-40`}
      >
        <nav className="mt-4 lg:mt-0 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <NavLinks />
          </div>

          {location.pathname !== '/' && profile && (
            <div className="px-4 py-3 border-t border-gray-700">
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getClassificationColor(profile.classification?.name)}`}>
                <Shield className="w-3 h-3 mr-1" />
                {profile.classification?.name?.toUpperCase() || 'UNCLASSIFIED'}
              </div>
            </div>
          )}

          <div className="border-t border-gray-700">
            <Link
              to="/profile"
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800"
            >
              <User className="w-5 h-5 mr-3" />
              Profile
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setIsSidebarOpen(false);
              }}
              className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 w-full"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto pt-16 lg:pt-0">
        {children}
      </div>
    </div>
  );
}

export default Layout;