// קובץ: client/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

// יוצרים אובייקט קונטקסט גלובלי שיחזיק את מצב ההתחברות והפונקציות
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  // הגנה מפני שימוש מחוץ ל-Provider (כדי למנוע באגים שקטים)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ה-Provider שעוטף את כל האפליקציה ומספק את הערכים/הפעולות לכל הילדים
export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
 
  const [loading, setLoading] = useState(true);
 
  const [token, setToken] = useState(localStorage.getItem('token'));

  // בעת טעינת האפליקציה (או שינוי ב-token) נבדוק האם המשתמש מחובר (GET /auth/me)
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const userData = await authService.getCurrentUser(); // מחייב interceptor שמוסיף Authorization
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

  // התחברות: שליחת אימייל+סיסמה לשרת (POST /auth/login)
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
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  // הרשמה: שליחת שם+אימייל+סיסמה לשרת (POST /auth/register)
  const register = async (name, email, password) => {
    try {
      const response = await authService.register(name, email, password);
      const { user: userData, token: authToken } = response;

      setUser(userData);
      setToken(authToken);
      localStorage.setItem('token', authToken);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // התנתקות: איפוס מצב הלקוח ומחיקת הטוקן (אין צורך בקריאת API)
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  // עדכון פרופיל: קריאה מאובטחת לשרת (PUT /auth/profile למשל)
  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Profile update failed'
      };
    }
  };

  // שינוי סיסמה: קריאה מאובטחת (PUT /auth/password למשל)
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Password change failed'
      };
    }
  };

  // הערך שמסופק לכל הרכיבים באפליקציה דרך הקונטקסט
  const value = {
    user,           
    loading,       
    token,          
    login,          
    register,       
    logout,         
    updateProfile,  
    changePassword  
  };

  // עוטפים את הילדים ב-Provider כדי שכל האפליקציה תיגש לערכים/פונקציות
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
