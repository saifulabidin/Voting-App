import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PollList from './components/PollList';
import PollDetails from './components/PollDetails';
import CreatePoll from './components/CreatePoll';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';

const App = () => {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <PollList />
          </ProtectedRoute>
        } />
        <Route path="/polls/:id" element={
          <ProtectedRoute>
            <PollDetails />
          </ProtectedRoute>
        } />
        <Route path="/create" element={
          <ProtectedRoute>
            <CreatePoll />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default App;
