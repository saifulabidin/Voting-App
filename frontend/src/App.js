import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PollList from './components/PollList';
import PollDetails from './components/PollDetails';
import CreatePoll from './components/CreatePoll';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import { LanguageProvider } from './context/LanguageContext';

const App = () => {
  return (
    <LanguageProvider>
      <Router>
        <Navigation />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PollList />} />
          <Route path="/polls/:id" element={<PollDetails />} />
          <Route path="/create" element={
            <ProtectedRoute>
              <CreatePoll />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </LanguageProvider>
  );
};

export default App;
