import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import Layout from './components/Layout';
import Home from './components/Home';
import ProfileList from './components/ProfileList';
import ProfileView from './components/ProfileView';
import Transcriber from './components/Transcriber';
import MindMap from './components/MindMap';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import UserManagement from './components/UserManagement';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, profile, loading } = useAuth();

  React.useEffect(() => {
    // Handle auth callback
    const handleAuthCallback = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        // Clear the hash without triggering a reload
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    handleAuthCallback();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // If user has no classification, only allow access to home and profile pages
  const hasNoClassification = !profile?.classification;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        {hasNoClassification ? (
          <>
            <Route path="/profile" element={<UserProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/sunlight" element={<ProfileList />} />
            <Route path="/sunlight/profile/:id" element={<ProfileView />} />
            <Route path="/transcriber" element={<Transcriber />} />
            <Route path="/connections" element={
              <ReactFlowProvider>
                <MindMap />
              </ReactFlowProvider>
            } />
            <Route path="/bundle" element={<div className="p-8"><h1 className="text-2xl font-bold">Bundle OSINT - Coming Soon</h1></div>} />
            <Route path="/ai-search" element={<div className="p-8"><h1 className="text-2xl font-bold">AI Search - Coming Soon</h1></div>} />
            <Route path="/weezr" element={<div className="p-8"><h1 className="text-2xl font-bold">Weezr - Coming Soon</h1></div>} />
            <Route path="/profile" element={<UserProfile />} />
            <Route 
              path="/users" 
              element={
                profile?.classification?.name === 'black' ? <UserManagement /> : <Navigate to="/" replace />
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Layout>
  );
}

export default App;