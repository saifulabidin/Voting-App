import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      // Simpan token
      localStorage.setItem('token', token);
      navigate('/');
    } else if (error) {
      // Handle error cases
      navigate('/login', { state: { error } });
    } else {
      // Fallback jika tidak ada token atau error
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Authentication in progress...</h2>
        <p>Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
};

export default AuthCallback;