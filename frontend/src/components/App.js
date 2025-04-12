import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PollList from './PollList';
import PollDetails from './PollDetails';
import CreatePoll from './CreatePoll';
import Login from './Login';
import Register from './Register';
import ProtectedRoute from './ProtectedRoute';
import Navigation from './Navigation';
import { LanguageProvider } from '../context/LanguageContext';
import AuthCallback from './AuthCallback';
import '../styles/app.css';
import '../styles/buttons.css';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<PollList />} />
          <Route path="/poll/:id" element={<PollDetails />} />
          <Route path="/create" element={<ProtectedRoute><CreatePoll /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;