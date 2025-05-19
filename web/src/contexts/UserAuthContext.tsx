import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';
import { createApiClient } from '@/services/api';
import { toast } from 'sonner';

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
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  api: ReturnType<typeof createApiClient> | null;
  isParent: boolean;
  isChild: boolean;
  getChildren: () => Promise<ChildProfile[]>;
  getSavingsHistory: () => Promise<any>;
  loading: boolean;
  apiConnected: boolean;
  refreshUser: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

// Export the context so it can be imported elsewhere
export const UserAuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  api: null,
  isParent: false,
  isChild: false,
  getChildren: async () => [],
  getSavingsHistory: async () => {},
  loading: true,
  apiConnected: true,
  refreshUser: async () => {},
  register: async () => {},
});

export const useAuth = () => useContext(UserAuthContext);

export const UserAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState<boolean>(true);
  const [api, setApi] = useState<ReturnType<typeof createApiClient> | null>(
    null
  );
  const connectionRef = useRef(true);

  // Create API instance when token changes
  useEffect(() => {
    if (token) {
      const apiInstance = createApiClient(token);
      setApi(apiInstance);
      console.log('API instance created with token');
    } else {
      setApi(null);
      console.log('API instance cleared (no token)');
    }
  }, [token]);

  // Improve the API connectivity check in the context
  useEffect(() => {
    if (!api) return;

    let isMounted = true;

    const checkConnectivity = async () => {
      try {
        console.log('Checking API connectivity from context...');
        const isConnected = await api.checkApiConnectivity();

        // Only update state if component is still mounted
        if (isMounted) {
          setApiConnected(isConnected);

          if (!isConnected) {
            console.warn('API connectivity check failed');
          } else {
            console.log('API connectivity check succeeded');
          }
        }
      } catch (error) {
        console.error('Error checking API connectivity:', error);

        // Only update state if component is still mounted
        if (isMounted) {
          setApiConnected(false);
        }
      }
    };

    // Check immediately but with a small delay to allow other initialization to complete
    const initialCheckTimeout = setTimeout(() => {
      checkConnectivity();
    }, 1000);

    // Then check periodically but less frequently (every 60 seconds instead of 30)
    const intervalId = setInterval(checkConnectivity, 60000);

    return () => {
      isMounted = false;
      clearTimeout(initialCheckTimeout);
      clearInterval(intervalId);
    };
  }, [api]);

  // Improve the toast notification for API connectivity
  useEffect(() => {
    // Only show toast when connectivity changes from connected to disconnected
    // to avoid showing the toast on initial load
    if (!apiConnected && connectionRef.current) {
      toast.error('Connection Issue', {
        description:
          'Having trouble connecting to the server. Some features may not work.',
        duration: 5000,
      });
      connectionRef.current = false;
    } else if (apiConnected) {
      connectionRef.current = true;
    }
  }, [apiConnected]);

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

        console.log('Auth restored from localStorage, role:', userData.role);
      } else {
        // Token is expired, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        console.warn('Stored token was invalid or expired');
      }
    }

    // Set loading to false after initial auth check
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    console.log('Logging in user:', newUser.name, 'with role:', newUser.role);
    console.log('Token (first 15 chars):', newToken.substring(0, 15) + '...');

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('userRole', newUser.role);

    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    setToken(null);
    setUser(null);
    console.log('User logged out, auth state cleared');
  };

  // Derived properties
  const isParent = !!user && user.role === 'parent';
  const isChild = !!user && user.role === 'child';

  // Helper function for auth headers
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

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
        getChildren: async () => {
          try {
            if (!api) throw new Error('API not initialized');
            return await api.getChildren();
          } catch (error) {
            console.error('Error fetching children:', error);
            return [];
          }
        },
        getSavingsHistory: async () => {
          try {
            if (!api) throw new Error('API not initialized');
            return await api.getSavingsHistory();
          } catch (error) {
            console.error('Error fetching savings history:', error);
            return [];
          }
        },
        loading,
        apiConnected,
        refreshUser: async () => {
          if (token && api) {
            try {
              const refreshedUser = await api.refreshUser();
              setUser(refreshedUser);
            } catch (error) {
              console.error('Error refreshing user:', error);
            }
          }
        },
        register: async (data: RegisterData) => {
          if (!api) throw new Error('API not initialized');
          const response = await api.register(data);
          if (response.token) {
            login(response.token, response.user);
          }
        },
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};
