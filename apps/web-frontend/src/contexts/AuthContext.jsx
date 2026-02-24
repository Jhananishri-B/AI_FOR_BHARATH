import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { authAPI, lessonsAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loginResponse, setLoginResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure API defaults
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await authAPI.getMe();
          const userData = response.data;
          
          // Fetch additional progress data
          try {
            const progressResponse = await lessonsAPI.getUserProgress();
            const progressData = progressResponse.data;
            
            // Merge progress data with user data
            setUser({
              ...userData,
              ...progressData
            });
          } catch (progressError) {
            console.warn('Could not fetch progress data:', progressError);
            setUser(userData);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      setLoginResponse(response.data);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const response = await authAPI.getGoogleAuthUrl();
      const { auth_url } = response.data;
      
      // Redirect to Google OAuth
      window.location.href = auth_url;
    } catch (error) {
      console.error('Google login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Google login failed' 
      };
    }
  };

  const handleGoogleCallback = async (code) => {
    try {
      const response = await authAPI.googleCallback(code);
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      setLoginResponse(response.data);
      
      return { success: true };
    } catch (error) {
      console.error('Google callback failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Google authentication failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshUserProgress = async () => {
    if (token && user) {
      try {
        // Fetch fresh auth/me to include completed_topics and completed_modules
        const meResponse = await authAPI.getMe();
        const meData = meResponse.data;
        // Optionally also fetch streak/xp from lessons endpoint
        const progressResponse = await lessonsAPI.getUserProgress();
        const progressData = progressResponse.data;

        setUser(prevUser => ({
          ...prevUser,
          ...meData,
          ...progressData
        }));
      } catch (error) {
        console.warn('Could not refresh progress data:', error);
      }
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    loginWithGoogle,
    handleGoogleCallback,
    logout,
    refreshUserProgress,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
