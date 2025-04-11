import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Mic, Home, LogOut, User, Shield, Users, Network, Waves, Archive } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getClassificationColor = (name?: string) => {
    switch (name?.toLowerCase()) {
      case 'green': return 'bg-green-100 text-green-800';
      case 'yellow': return 'bg-yellow-100 text-yellow-800';
      case 'black': return 'bg-gray-900 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-md">
        <nav className="mt-4 flex flex-col h-full">
          <div className="flex-1">
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
              Transcriber Helper
            </Link>
            <Link
              to="/connections"
              className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 ${
                location.pathname === '/connections' ? 'bg-gray-50 text-blue-600' : ''
              }`}
            >
              <Network className="w-5 h-5 mr-3" />
              Connections
            </Link>
            <Link
              to="/reverberate"
              className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 ${
                location.pathname === '/reverberate' ? 'bg-gray-50 text-blue-600' : ''
              }`}
            >
              <Waves className="w-5 h-5 mr-3" />
              Reverberate
            </Link>
            <Link
              to="/archive"
              className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 ${
                location.pathname === '/archive' ? 'bg-gray-50 text-blue-600' : ''
              }`}
            >
              <Archive className="w-5 h-5 mr-3" />
              Internet Archive
            </Link>
            {profile?.classification?.name === 'black' && (
              <Link
                to="/users"
                className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 ${
                  location.pathname === '/users' ? 'bg-gray-50 text-blue-600' : ''
                }`}
              >
                <Users className="w-5 h-5 mr-3" />
                Users
              </Link>
            )}
          </div>

          {location.pathname !== '/' && profile && (
            <div className="px-4 py-3 border-t border-gray-200">
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getClassificationColor(profile.classification?.name)}`}>
                <Shield className="w-3 h-3 mr-1" />
                {profile.classification?.name?.toUpperCase() || 'UNCLASSIFIED'}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200">
            <Link
              to="/profile"
              className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50"
            >
              <User className="w-5 h-5 mr-3" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 w-full"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

export default Layout;