import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { ExtractorPage } from './pages/ExtractorPage';
import { LibraryPage } from './pages/LibraryPage';

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <NavBar onSignOut={signOut!} username={user?.username} />
            <main className="max-w-5xl mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<ExtractorPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      )}
    </Authenticator>
  );
}
