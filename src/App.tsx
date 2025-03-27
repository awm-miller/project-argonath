import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import ProfileList from './components/ProfileList';
import ProfileView from './components/ProfileView';
import Transcriber from './components/Transcriber';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sunlight" element={<ProfileList />} />
        <Route path="/sunlight/profile/:id" element={<ProfileView />} />
        <Route path="/transcriber" element={<Transcriber />} />
        <Route path="/bundle" element={<div className="p-8"><h1 className="text-2xl font-bold">Bundle OSINT - Coming Soon</h1></div>} />
        <Route path="/ai-search" element={<div className="p-8"><h1 className="text-2xl font-bold">AI Search - Coming Soon</h1></div>} />
        <Route path="/weezr" element={<div className="p-8"><h1 className="text-2xl font-bold">Weezr - Coming Soon</h1></div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;