
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { API_URL } from './lib/api';

// Pages
import Index from './pages/Index';
import NotFound from './pages/NotFound';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token validity with API
      fetch(`${API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Invalid token');
      })
      .then(data => {
        setIsLoggedIn(true);
        setUserRole(data.role);
      })
      .catch(() => {
        localStorage.removeItem('token');
      });
    }
  }, []);
  
  const handleLogin = (token: string, role: string) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
    setUserRole(role);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserRole(null);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <Index 
              isLoggedIn={isLoggedIn}
              userRole={userRole}
              onLogin={handleLogin}
              onLogout={handleLogout}
            />
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
