import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

// יצירת context עבור auth
const AuthContext = createContext();

/**
 * Hook מותאם לגישה ל־Auth context.
 * מאפשר למנוע שימוש לא חוקי מחוץ ל־AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// רכיב עוטף שיספק את context לכל הרכיבים באפליקציה
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // מידע על המשתמש המחובר
  const [loading, setLoading] = useState(true); // אינדיקציה האם עדיין בטעינה
  const [token, setToken] = useState(localStorage.getItem('token')); // טוקן נשמר בזיכרון הדפדפן

  /**
   * בדיקת התחברות אוטומטית עם עליית האפליקציה.
   * אם יש טוקן – נשלחת בקשה לשרת לאמת אותו.
   */
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  /**
   * פונקציית התחברות – שומרת טוקן ומידע על המשתמש
   */
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { user: userData, token: authToken } = response;

      setUser(userData);
      setToken(authToken);
      localStorage.setItem('token', authToken);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  /**
   * פונקציית יציאה – מנקה משתמש וטוקן
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
