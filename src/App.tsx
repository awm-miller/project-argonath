import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ReactFlowProvider } from 'reactflow';
import Layout from './components/Layout';
import Home from './components/Home';
import ProfileList from './components/ProfileList';
import ProfileView from './components/ProfileView';
import Transcriber from './components/Transcriber';
import MindMap from './components/MindMap';
import Reverberate from './components/Reverberate';
import InternetArchive from './components/InternetArchive';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import UserManagement from './components/UserManagement';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, profile, loading } = useAuth();

  React.useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add('dark');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

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
            <Route path="/reverberate" element={<Reverberate />} />
            <Route path="/archive" element={<InternetArchive />} />
            <Route path="/connections" element={
              <ReactFlowProvider>
                <MindMap />
              </ReactFlowProvider>
            } />
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