import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';

// Make sure we're using the correct API URL
const API_URL = 'http://localhost:3000/api';
console.log('Using API URL:', API_URL);

export interface AuthResponse {
  token: string;
  userId: string;
  user?: {
    phoneNumber: string;
    role: 'parent' | 'child';
    name: string;
    childProfile?: {
      name: string;
      age: number;
      jarId: string;
    };
    parentId?: string; // For child users
    balance: number;
  };
  message?: string;
}

export interface ApiError {
  error: string;
  details?: any;
}

export interface MpesaDepositResponse {
  success: boolean;
  transactionId?: string;
  checkoutRequestId?: string;
  message?: string;
}

export interface ChildResponse {
  id: string;
  name: string;
  age: number;
  jarId: string;
  parentId: string;
  balance: number;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  // Handle redirects (303, 301, 302)
  if (response.status >= 300 && response.status < 400) {
    console.warn(
      `Redirect detected: ${response.status}. Following redirect...`
    );
    // For redirects, we'll return an empty result rather than throwing an error
    return {} as T;
  }

  try {
    const data = await response.json();
    console.log('API response:', { status: response.status, data });

    if (!response.ok || (data as ApiError).error) {
      const errorMessage =
        (data as ApiError).error || 'An unknown error occurred';
      const errorDetails = (data as ApiError).details || '';
      console.error(`API error: ${errorMessage}`, errorDetails);

      // Show toast only for actual errors, not for empty responses
      if (errorMessage !== 'An unknown error occurred') {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
        });
      }

      // Return empty data instead of throwing
      return {} as T;
    }

    return data as T;
  } catch (error) {
    console.error('Failed to parse response:', error);
    // Return empty data instead of throwing
    return {} as T;
  }
};

export const authApi = {
  register: async (userData: {
    phoneNumber: string;
    pin: string;
    childName: string;
    childAge: number;
    jarId: string;
  }): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse<AuthResponse>(response);
  },

  login: async (credentials: {
    phoneNumber: string;
    pin: string;
  }): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return handleResponse<AuthResponse>(response);
  },

  childLogin: async (credentials: {
    jarId: string;
    childPin: string;
  }): Promise<AuthResponse> => {
    console.log('Child login attempt with:', credentials);
    try {
      const response = await fetch(`${API_URL}/auth/child-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jarId: credentials.jarId,
          childPin: credentials.childPin,
        }),
      });

      console.log('Child login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Child login error response:', errorData);
        throw new Error(
          errorData.error || `Login failed with status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log('Child login successful response:', data);

      return data;
    } catch (error) {
      console.error('Child login error:', error);
      throw error;
    }
  },

  createChildAccount: async (
    childData: { childName: string; childAge: number; childPin: string },
    token: string
  ): Promise<{ message: string; childId: string }> => {
    const response = await fetch(`${API_URL}/auth/create-child`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(childData),
    });
    return handleResponse<{ message: string; childId: string }>(response);
  },
};

export const createApiClient = (token: string) => {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  return {
    // Balance and transaction endpoints
    getBalance: async (): Promise<{ balance: number }> => {
      try {
        const userRole = localStorage.getItem('userRole');
        console.log('Fetching balance for user role:', userRole);

        const useMockData = false; // Set to false
        if (useMockData) {
          console.log('Using mock balance for presentation');
          return { balance: 1000 };
        }

        const endpoint = `${API_URL}/wallet/balance`;
        console.log(`Using balance endpoint: ${endpoint}`);

        const response = await fetch(endpoint, { headers });
        console.log(`Balance response status:`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Balance error response:', errorText);
          throw new Error(errorText);
        }

        const result = await response.json();
        console.log('Balance result:', result);
        return { balance: result.balance || 0 };
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        throw error;
      }
    },

    getChildBalance: async (childId: string): Promise<{ balance: number }> => {
      try {
        console.log(`Fetching balance for child ID: ${childId}`);

        const useMockData = false; // Set to false
        if (useMockData) {
          console.log('Using mock child balance for presentation');
          return { balance: 750 };
        }

        const endpoint = `${API_URL}/parent/children/${childId}/balance`;
        console.log(`Using child balance endpoint: ${endpoint}`);

        const response = await fetch(endpoint, { headers });
        console.log(`Child balance response status:`, response.status);

        if (!response.ok) {
          console.log('Balance endpoint failed, trying to get child data');
          const fallbackResponse = await fetch(
            `${API_URL}/parent/children/${childId}`,
            { headers }
          );
          if (fallbackResponse.ok) {
            const childData = await fallbackResponse.json();
            console.log('Child data received from fallback:', childData);
            if (childData && typeof childData.balance === 'number') {
              return { balance: childData.balance };
            }
          }
          throw new Error('Failed to fetch child balance');
        }

        const result = await response.json();
        console.log('Child balance result:', result);
        return { balance: result.balance || 0 };
      } catch (error) {
        console.error(`Failed to fetch balance for child ${childId}:`, error);
        throw error;
      }
    },
    getTransactions: async (): Promise<any[]> => {
      try {
        const response = await fetch(`${API_URL}/wallet/transactions`, {
          headers,
        });
        const result = await handleResponse<any[]>(response);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
        return [];
      }
    },

    getChildTransactions: async (childId: string): Promise<any[]> => {
      try {
        console.log(`Fetching transactions for child ID: ${childId}`);
        // Use the correct endpoint for parent getting child's transactions
        const endpoint = `${API_URL}/parent/children/${childId}/transactions`;
        console.log(`Using child transactions endpoint: ${endpoint}`);

        const response = await fetch(endpoint, {
          headers,
        });
        console.log(`Child transactions response status:`, response.status);

        if (!response.ok) {
          // Try the wallet endpoint as fallback
          console.log('Parent endpoint failed, trying wallet endpoint');
          const fallbackEndpoint = `${API_URL}/wallet/child/${childId}/transactions`;
          const fallbackResponse = await fetch(fallbackEndpoint, {
            headers,
          });

          if (fallbackResponse.ok) {
            const result = await fallbackResponse.json();
            console.log('Child transactions from fallback:', result);
            return Array.isArray(result) ? result : [];
          }

          return [];
        }

        const result = await response.json();
        console.log('Child transactions result:', result);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error(
          `Failed to fetch transactions for child ${childId}:`,
          error
        );
        return [];
      }
    },

    // Payment endpoints
    createMpesaDeposit: async (data: {
      phoneNumber: string;
      amount: number;
      childId?: string;
    }): Promise<MpesaDepositResponse> => {
      try {
        // Determine the correct endpoint based on whether this is for a child
        const endpoint = data.childId
          ? `${API_URL}/payments/child/${data.childId}/mpesa/stk-push`
          : `${API_URL}/payments/mpesa/stk-push`;

        console.log('Sending M-Pesa request:', {
          url: endpoint,
          data,
        });

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            phoneNumber: data.phoneNumber,
            amount: data.amount,
          }),
          cache: 'no-cache',
          // Removed credentials: 'include' to fix CORS issue
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('M-Pesa error response:', errorText);
          throw new Error(
            `M-Pesa request failed: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();
        console.log('Raw M-Pesa response:', result);

        // Transform the response to ensure it has consistent properties
        const transformedResult = {
          success: true,
          transactionId: result.transactionId || result.checkoutRequestId,
          checkoutRequestId: result.checkoutRequestId || result.transactionId,
          message: result.message || 'STK push initiated',
          ...result,
        };

        console.log('Transformed M-Pesa response:', transformedResult);
        return transformedResult;
      } catch (error) {
        console.error('M-Pesa request error:', error);
        throw error;
      }
    },

    checkMpesaStatus: async (transactionId: string): Promise<any> => {
      const response = await fetch(
        `${API_URL}/payments/status/${transactionId}`,
        {
          headers,
        }
      );
      return handleResponse<any>(response);
    },

    createLightningInvoice: async (data: {
      amount: number;
      memo?: string;
      childId?: string;
      userId?: string;
      userRole: 'parent' | 'child' | null;
    }): Promise<any> => {
      try {
        console.log('Creating lightning invoice with data:', {
          amount: data.amount,
          memo: data.memo,
          childId: data.childId,
          userId: data.userId,
          userRole: data.userRole,
        });

        if (!data.userRole) {
          console.error('User role missing');
          throw new Error('User role not found. Please log in again.');
        }

        if (data.userRole === 'parent' && !data.childId) {
          console.error('Child ID required for parent');
          throw new Error('Child ID is required for parent invoice creation');
        }

        if (data.userRole === 'parent' && data.childId) {
          // Validate childId: must be a 20-character hexadecimal string
          // Note: Assumes Firestore document ID format; update if backend ID format changes
          if (!data.childId.match(/^[0-9a-fA-F]{20}$/)) {
            console.error('Invalid childId format:', data.childId);
            throw new Error('Invalid child ID format');
          }
        }

        const endpoint =
          data.userRole === 'parent' && data.childId
            ? `${API_URL}/wallet/child/${data.childId}/invoice`
            : `${API_URL}/wallet/invoice`;

        console.log('Using invoice endpoint:', endpoint);

        const requestBody = {
          amount: data.amount,
          memo: data.memo || 'BIT Toto Deposit',
        };

        console.log('Request headers:', headers);
        console.log('Request body:', requestBody);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Lightning invoice error response:', errorText);
          throw new Error(errorText);
        }

        const result = await response.json();
        console.log('Lightning invoice created successfully:', result);
        return result;
      } catch (error) {
        console.error('Lightning invoice creation error:', error);
        throw error;
      }
    },

    createMpesaDeposit: async (data: {
      phoneNumber: string;
      amount: number;
      childId?: string;
    }): Promise<MpesaDepositResponse> => {
      try {
        if (data.childId) {
          // Validate childId: must be a 20-character hexadecimal string
          // Note: Assumes Firestore document ID format; update if backend ID format changes
          if (!data.childId.match(/^[0-9a-fA-F]{20}$/)) {
            console.error('Invalid childId format:', data.childId);
            throw new Error('Invalid child ID format');
          }
        }

        // Determine the correct endpoint based on whether this is for a child
        const endpoint = data.childId
          ? `${API_URL}/payments/child/${data.childId}/mpesa/stk-push`
          : `${API_URL}/payments/mpesa/stk-push`;

        console.log('Sending M-Pesa request:', {
          url: endpoint,
          data,
        });

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            phoneNumber: data.phoneNumber,
            amount: data.amount,
          }),
          cache: 'no-cache',
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('M-Pesa error response:', errorText);
          throw new Error(
            `M-Pesa request failed: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();
        console.log('Raw M-Pesa response:', result);

        // Transform the response to ensure it has consistent properties
        const transformedResult = {
          success: true,
          transactionId: result.transactionId || result.checkoutRequestId,
          checkoutRequestId: result.checkoutRequestId || result.transactionId,
          message: result.message || 'STK push initiated',
          ...result,
        };

        console.log('Transformed M-Pesa response:', transformedResult);
        return transformedResult;
      } catch (error) {
        console.error('M-Pesa request error:', error);
        throw error;
      }
    },

    // createLightningInvoice: async (data: {
    //   amount: number;
    //   memo?: string;
    //   childId?: string;
    //   userId?: string;
    //   userRole: 'parent' | 'child' | null;
    // }): Promise<any> => {
    //   try {
    //     console.log('Creating lightning invoice with data:', {
    //       amount: data.amount,
    //       memo: data.memo,
    //       childId: data.childId,
    //       userId: data.userId,
    //       userRole: data.userRole,
    //     });

    //     if (!data.userRole) {
    //       console.error('User role missing');
    //       throw new Error('User role not found. Please log in again.');
    //     }

    //     if (data.userRole === 'parent' && !data.childId) {
    //       console.error('Child ID required for parent');
    //       throw new Error('Child ID is required for parent invoice creation');
    //     }

    //     if (data.childId && !data.childId.match(/^[0-9a-fA-F]{24}$/)) {
    //       console.error('Invalid childId format:', data.childId);
    //       throw new Error('Invalid child ID format');
    //     }

    //     const endpoint =
    //       data.userRole === 'parent' && data.childId
    //         ? `${API_URL}/wallet/child/${data.childId}/invoice`
    //         : `${API_URL}/wallet/invoice`;

    //     console.log('Using invoice endpoint:', endpoint);

    //     const requestBody = {
    //       amount: data.amount,
    //       memo: data.memo || 'BIT Toto Deposit',
    //     };

    //     console.log('Request headers:', headers);
    //     console.log('Request body:', requestBody);

    //     const response = await fetch(endpoint, {
    //       method: 'POST',
    //       headers,
    //       body: JSON.stringify(requestBody),
    //     });

    //     console.log('Response status:', response.status);

    //     if (!response.ok) {
    //       const errorText = await response.text();
    //       console.error('Lightning invoice error response:', errorText);
    //       throw new Error(errorText);
    //     }

    //     const result = await response.json();
    //     console.log('Lightning invoice created successfully:', result);
    //     return result;
    //   } catch (error) {
    //     console.error('Lightning invoice creation error:', error);
    //     throw error;
    //   }
    // },

    checkInvoiceStatus: async (paymentHash: string): Promise<any> => {
      const response = await fetch(`${API_URL}/wallet/invoice/${paymentHash}`, {
        headers,
      });
      return handleResponse<any>(response);
    },

    createWithdrawal: async (data: {
      phoneNumber: string;
      amount: number;
    }): Promise<any> => {
      const response = await fetch(`${API_URL}/wallet/withdraw`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      return handleResponse<any>(response);
    },

    // Goal endpoints
    createGoal: async (data: {
      name: string;
      targetAmount: number;
    }): Promise<any> => {
      console.log('Creating goal with data:', data);
      try {
        const response = await fetch(`${API_URL}/goals`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        });
        const result = await handleResponse<any>(response);
        console.log('Goal creation response:', result);
        return result;
      } catch (error) {
        console.error('Goal creation failed:', error);
        throw error;
      }
    },

    getGoals: async (): Promise<any[]> => {
      try {
        console.log('Fetching goals...');
        const response = await fetch(`${API_URL}/goals`, {
          headers,
        });
        console.log('Goals response status:', response.status);

        // Handle different response formats
        const result = await response.json();
        console.log('Raw goals response:', result);

        // Check if the response is an array or has a goals property
        if (Array.isArray(result)) {
          return result;
        } else if (result && Array.isArray(result.goals)) {
          return result.goals;
        } else {
          console.warn('Unexpected goals response format:', result);
          return [];
        }
      } catch (error) {
        console.error('Failed to fetch goals:', error);
        return [];
      }
    },

    getChildGoals: async (childId: string): Promise<any[]> => {
      try {
        const response = await fetch(
          `${API_URL}/parent/children/${childId}/goals`,
          {
            headers,
          }
        );
        const result = await handleResponse<any[]>(response);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error(`Failed to fetch goals for child ${childId}:`, error);
        return [];
      }
    },

    approveGoal: async (goalId: string): Promise<any> => {
      try {
        const response = await fetch(`${API_URL}/goals/${goalId}/approve`, {
          method: 'POST',
          headers,
        });
        return handleResponse<any>(response);
      } catch (error) {
        console.error(`Failed to approve goal ${goalId}:`, error);
        return { success: false };
      }
    },

    // Child management endpoints
    getChildren: async (): Promise<ChildResponse[]> => {
      try {
        const response = await fetch(`${API_URL}/parent/children`, {
          headers,
        });
        const result = await handleResponse<{ children: ChildResponse[] }>(
          response
        );
        return Array.isArray(result.children) ? result.children : [];
      } catch (error) {
        console.error('Failed to fetch children:', error);
        return [];
      }
    },

    getChild: async (childId: string): Promise<ChildResponse> => {
      try {
        const response = await fetch(`${API_URL}/parent/children/${childId}`, {
          headers,
        });
        return handleResponse<ChildResponse>(response);
      } catch (error) {
        console.error(`Failed to fetch child ${childId}:`, error);
        return {} as ChildResponse;
      }
    },

    createChild: async (data: {
      childName: string;
      childAge: number;
      childPin: string;
    }): Promise<{ childId: string }> => {
      const response = await fetch(`${API_URL}/auth/create-child`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      return handleResponse<{ childId: string }>(response);
    },

    resetChildPin: async (childId: string, newPin: string): Promise<any> => {
      const response = await fetch(
        `${API_URL}/parent/children/${childId}/reset-pin`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ newPin }),
        }
      );
      return handleResponse<any>(response);
    },

    removeChild: async (childId: string): Promise<any> => {
      const response = await fetch(`${API_URL}/parent/children/${childId}`, {
        method: 'DELETE',
        headers,
      });
      return handleResponse<any>(response);
    },

    // Learning/Education endpoints
    getLearningModules: async (): Promise<any[]> => {
      try {
        const response = await fetch(`${API_URL}/education/modules`, {
          headers,
        });
        const result = await handleResponse<any[]>(response);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch learning modules:', error);
        return [];
      }
    },

    getChildLearningProgress: async (childId: string): Promise<any> => {
      try {
        const response = await fetch(
          `${API_URL}/education/progress/${childId}`,
          {
            headers,
          }
        );
        const result = await handleResponse<any[]>(response);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error(
          `Failed to fetch learning progress for child ${childId}:`,
          error
        );
        return [];
      }
    },

    completeLesson: async (lessonId: string): Promise<any> => {
      try {
        const response = await fetch(
          `${API_URL}/education/lessons/${lessonId}/complete`,
          {
            method: 'POST',
            headers,
          }
        );
        return handleResponse<any>(response);
      } catch (error) {
        console.error(`Failed to complete lesson ${lessonId}:`, error);
        return { success: false };
      }
    },

    // Achievements endpoints
    getAchievements: async (): Promise<any[]> => {
      try {
        const response = await fetch(`${API_URL}/achievements`, {
          headers,
        });
        const result = await handleResponse<any[]>(response);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch achievements:', error);
        return [];
      }
    },

    getChildAchievements: async (childId: string): Promise<any[]> => {
      try {
        const response = await fetch(`${API_URL}/achievements/${childId}`, {
          headers,
        });
        const result = await handleResponse<any[]>(response);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error(
          `Failed to fetch achievements for child ${childId}:`,
          error
        );
        return [];
      }
    },

    // Savings endpoints
    getSavingsHistory: async (): Promise<any[]> => {
      try {
        const response = await fetch(`${API_URL}/savings/history`, {
          headers,
        });
        const result = await handleResponse<any[]>(response);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch savings history:', error);
        return [];
      }
    },

    getChildSavingsHistory: async (childId: string): Promise<any[]> => {
      try {
        const response = await fetch(`${API_URL}/savings/history/${childId}`, {
          headers,
        });
        const result = await handleResponse<any[]>(response);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error(
          `Failed to fetch savings history for child ${childId}:`,
          error
        );
        return [];
      }
    },
  };
};
