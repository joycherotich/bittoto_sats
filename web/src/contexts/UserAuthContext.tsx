import React, { createContext, useContext, useState, useEffect } from 'react';
import { createApiClient } from '@/services/api';

type UserRole = 'parent' | 'child';

interface ChildProfile {
  name: string;
  age: number;
  jarId: string;
}

interface User {
  id: string;
  phoneNumber?: string;
  name: string;
  role: UserRole;
  childProfile?: ChildProfile;
  parentId?: string; // For child users, reference to their parent
  balance: number;
}

interface AuthContextType {
  user: User | null;
  token: string;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  api: ReturnType<typeof createApiClient> | null;
  isParent: boolean;
  isChild: boolean;
}

// Export the context so it can be imported elsewhere
export const UserAuthContext = createContext<AuthContextType>({
  user: null,
  token: '',
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  api: null,
  isParent: false,
  isChild: false,
});

export const useAuth = () => useContext(UserAuthContext);

export const UserAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [api, setApi] = useState<ReturnType<typeof createApiClient> | null>(
    null
  );

  // Check if token is valid (not expired)
  const checkToken = (token: string): boolean => {
    try {
      // Parse the JWT payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds

      if (Date.now() >= expiry) {
        console.warn('Token has expired');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking token:', error);
      return false;
    }
  };

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      // Verify token is still valid
      if (checkToken(storedToken)) {
        setToken(storedToken);
        const userData = JSON.parse(storedUser);
        setUser(userData);

        // Store user role for API endpoints
        localStorage.setItem('userRole', userData.role);

        setApi(createApiClient(storedToken));
        console.log('Auth restored from localStorage, role:', userData.role);
      } else {
        // Token is expired, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        console.warn('Stored token was invalid or expired');
      }
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    console.log('Logging in user:', newUser.name, 'with role:', newUser.role);
    console.log('Token (first 15 chars):', newToken.substring(0, 15) + '...');

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('userRole', newUser.role);

    setToken(newToken);
    setUser(newUser);
    setApi(createApiClient(newToken));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    setToken('');
    setUser(null);
    setApi(null);
    console.log('User logged out, auth state cleared');
  };

  // Derived properties
  const isParent = !!user && user.role === 'parent';
  const isChild = !!user && user.role === 'child';

  return (
    <UserAuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        api,
        isParent,
        isChild,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};
