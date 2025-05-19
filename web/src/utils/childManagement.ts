import { useAuth } from '@/contexts/UserAuthContext';
import { useToast } from '@/hooks/use-toast';

// Define types
export interface ChildData {
  id: string;
  name: string;
  age: number;
  jarId: string;
  balance?: number;
}

export interface CreateChildParams {
  childName: string;
  childAge: number;
  childPin: string;
}

export interface ChildManagementResult {
  success: boolean;
  message: string;
  childId?: string;
  error?: any;
}

// API URL for direct calls if needed
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Creates a child account using the API client or direct API call
 * @param params Child creation parameters
 * @param token Authentication token
 * @param apiClient Optional API client
 * @returns Result object with success status and child ID if successful
 */
export const createChild = async (
  params: CreateChildParams,
  token: string,
  apiClient?: any
): Promise<ChildManagementResult> => {
  try {
    // Validate token
    if (!token) {
      return {
        success: false,
        message: 'Authentication required to create a child account',
      };
    }

    console.log('childManagement: Creating child account', {
      name: params.childName,
      age: params.childAge,
    });

    // Validate inputs
    if (!params.childName || !params.childAge || !params.childPin) {
      return {
        success: false,
        message: 'Child name, age, and PIN are required',
      };
    }

    // Validate age
    if (
      isNaN(params.childAge) ||
      params.childAge <= 0 ||
      params.childAge > 18
    ) {
      return {
        success: false,
        message: 'Age must be between 1 and 18',
      };
    }

    // Validate PIN
    if (params.childPin.length !== 6 || !/^\d+$/.test(params.childPin)) {
      return {
        success: false,
        message: 'PIN must be exactly 6 digits',
      };
    }

    let result;

    // Try using the API client if provided
    if (apiClient) {
      console.log('childManagement: Using API client');

      // Check for createChildAccount method
      if (typeof apiClient.createChildAccount === 'function') {
        console.log('childManagement: Using createChildAccount method');
        result = await apiClient.createChildAccount(params, token);
      }
      // Check for createChild method as fallback
      else if (typeof apiClient.createChild === 'function') {
        console.log('childManagement: Using createChild method');
        result = await apiClient.createChild(params, token);
      }
      // If neither method exists, use direct API call
      else {
        console.log(
          'childManagement: API client missing required methods, using direct API call'
        );
        result = await directCreateChild(params, token);
      }
    }
    // Use direct API call if no API client provided
    else {
      console.log(
        'childManagement: No API client provided, using direct API call'
      );
      result = await directCreateChild(params, token);
    }

    console.log('childManagement: Child created successfully', result);

    return {
      success: true,
      message: `Child account created for ${params.childName}`,
      childId: result.childId,
    };
  } catch (error: any) {
    console.error('childManagement: Error creating child account', error);
    return {
      success: false,
      message: error.message || 'Failed to create child account',
      error,
    };
  }
};

/**
 * Direct API call to create a child account
 * @param params Child creation parameters
 * @param token Authentication token
 * @returns API response
 */
const directCreateChild = async (
  params: CreateChildParams,
  token: string
): Promise<{ childId: string }> => {
  console.log('childManagement: Making direct API call to create child');

  const response = await fetch(`${API_URL}/auth/create-child`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || `Failed with status: ${response.status}`
    );
  }

  return response.json();
};

/**
 * Hook for child management operations
 * Returns functions for creating, updating, and deleting children
 */
export const useChildManagement = () => {
  const { api, token, user } = useAuth();
  const { toast } = useToast();

  /**
   * Creates a child account
   * @param params Child creation parameters
   * @returns Result object with success status and child ID if successful
   */
  const createChildAccount = async (
    params: CreateChildParams
  ): Promise<ChildManagementResult> => {
    try {
      // Check if user is authenticated
      if (!token || !user) {
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'You must be logged in to create a child account',
        });
        return {
          success: false,
          message: 'Authentication required',
        };
      }

      // Check if user is a parent
      if (user.role !== 'parent') {
        toast({
          variant: 'destructive',
          title: 'Permission Error',
          description: 'Only parents can create child accounts',
        });
        return {
          success: false,
          message: 'Only parents can create child accounts',
        };
      }

      const result = await createChild(params, token, api);

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }

      return result;
    } catch (error: any) {
      console.error('useChildManagement: Error creating child', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create child account',
      });
      return {
        success: false,
        message: error.message || 'Failed to create child account',
        error,
      };
    }
  };

  /**
   * Fetches all children for the current parent
   * @returns Array of child data
   */
  const getChildren = async (): Promise<ChildData[]> => {
    try {
      // Check if user is authenticated
      if (!token || !user) {
        console.error('useChildManagement: No token or user available');
        return [];
      }

      // Check if user is a parent
      if (user.role !== 'parent') {
        console.error('useChildManagement: User is not a parent');
        return [];
      }

      // Try using the API client's getChildren method
      if (api && typeof api.getChildren === 'function') {
        console.log('useChildManagement: Using API client getChildren method');
        return await api.getChildren();
      }

      // Direct API call as fallback
      console.log('useChildManagement: Using direct API call to get children');
      const response = await fetch(`${API_URL}/parent/children`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch children');
      }

      const data = await response.json();
      return data.children || [];
    } catch (error) {
      console.error('useChildManagement: Error fetching children', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch children accounts',
      });
      return [];
    }
  };

  /**
   * Removes a child account
   * @param childId ID of the child to remove
   * @returns Result object with success status
   */
  const removeChildAccount = async (
    childId: string
  ): Promise<ChildManagementResult> => {
    try {
      // Check if user is authenticated
      if (!token || !user) {
        return {
          success: false,
          message: 'Authentication required',
        };
      }

      // Check if user is a parent
      if (user.role !== 'parent') {
        return {
          success: false,
          message: 'Only parents can remove child accounts',
        };
      }

      // Try using the API client's removeChild method
      if (api && typeof api.removeChild === 'function') {
        await api.removeChild(childId);
      } else {
        // Direct API call as fallback
        const response = await fetch(`${API_URL}/parent/children/${childId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to remove child account');
        }
      }

      toast({
        title: 'Success',
        description: 'Child account removed successfully',
      });

      return {
        success: true,
        message: 'Child account removed successfully',
      };
    } catch (error: any) {
      console.error('useChildManagement: Error removing child', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to remove child account',
      });
      return {
        success: false,
        message: error.message || 'Failed to remove child account',
        error,
      };
    }
  };

  /**
   * Resets a child's PIN
   * @param childId ID of the child
   * @param newPin New PIN for the child
   * @returns Result object with success status
   */
  const resetChildPin = async (
    childId: string,
    newPin: string
  ): Promise<ChildManagementResult> => {
    try {
      // Check if user is authenticated
      if (!token || !user) {
        return {
          success: false,
          message: 'Authentication required',
        };
      }

      // Check if user is a parent
      if (user.role !== 'parent') {
        return {
          success: false,
          message: 'Only parents can reset child PINs',
        };
      }

      // Validate PIN
      if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
        return {
          success: false,
          message: 'PIN must be exactly 6 digits',
        };
      }

      // Try using the API client's resetChildPin method
      if (api && typeof api.resetChildPin === 'function') {
        await api.resetChildPin(childId, newPin);
      } else {
        // Direct API call as fallback
        const response = await fetch(
          `${API_URL}/parent/children/${childId}/reset-pin`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ newPin }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to reset child PIN');
        }
      }

      toast({
        title: 'Success',
        description: 'Child PIN reset successfully',
      });

      return {
        success: true,
        message: 'Child PIN reset successfully',
      };
    } catch (error: any) {
      console.error('useChildManagement: Error resetting child PIN', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to reset child PIN',
      });
      return {
        success: false,
        message: error.message || 'Failed to reset child PIN',
        error,
      };
    }
  };

  return {
    createChildAccount,
    getChildren,
    removeChildAccount,
    resetChildPin,
    // Return whether the current user is a parent
    isParent: user?.role === 'parent',
  };
};
