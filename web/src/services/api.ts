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

const getAuthHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Use the provided token or the one from the closure
  const authToken = token || getToken();

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
};

export const createApiClient = (initialToken: string) => {
  // Store token in closure
  let token = initialToken;

  // Function to get the current token
  const getToken = () => token;

  // Function to update the token
  const updateToken = (newToken: string) => {
    token = newToken;
  };

  return {
    // Balance and transaction endpoints
    getBalance: async (): Promise<BalanceResponse> => {
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          console.log(
            `Fetching user balance (attempt ${retryCount + 1}/${maxRetries})`
          );

          // Add a timeout to the fetch request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(`${API_URL}/wallet/balance`, {
            headers: getAuthHeaders(token),
            cache: 'no-store', // Ensure we don't use cached balance
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Balance error response:', errorText);
            throw new Error(
              errorText || `Failed to fetch balance: ${response.status}`
            );
          }

          const result = await response.json();
          console.log('Balance result:', result);
          return result;
        } catch (error: any) {
          retryCount++;
          console.error(
            `Failed to fetch balance (attempt ${retryCount}/${maxRetries}):`,
            error
          );

          if (error.name === 'AbortError') {
            console.warn('Balance request timed out');
          }

          if (retryCount >= maxRetries) {
            console.error('Max retries reached for balance fetch');
            // Return a default balance to prevent UI from breaking
            return { balance: 0, lastUpdated: new Date().toISOString() };
          }

          // Wait before retrying (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1))
          );
        }
      }

      // This should never be reached due to the return in the catch block
      return { balance: 0, lastUpdated: new Date().toISOString() };
    },

    getChildBalance: async (childId: string): Promise<BalanceResponse> => {
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          console.log(
            `Fetching child ${childId} balance (attempt ${
              retryCount + 1
            }/${maxRetries})`
          );

          // Add a timeout to the fetch request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(
            `${API_URL}/parent/children/${childId}/balance`,
            {
              headers: getAuthHeaders(token),
              cache: 'no-store', // Ensure we don't use cached balance
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Child balance error response:', errorText);
            throw new Error(
              errorText || `Failed to fetch child balance: ${response.status}`
            );
          }

          const result = await response.json();
          console.log('Child balance result:', result);
          return result;
        } catch (error: any) {
          retryCount++;
          console.error(
            `Failed to fetch child ${childId} balance (attempt ${retryCount}/${maxRetries}):`,
            error
          );

          if (error.name === 'AbortError') {
            console.warn('Child balance request timed out');
          }

          if (retryCount >= maxRetries) {
            console.error('Max retries reached for child balance fetch');
            // Return a default balance to prevent UI from breaking
            return { balance: 0, lastUpdated: new Date().toISOString() };
          }

          // Wait before retrying (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1))
          );
        }
      }

      // This should never be reached due to the return in the catch block
      return { balance: 0, lastUpdated: new Date().toISOString() };
    },
    getTransactions: async (options?: {
      childId?: string;
      limit?: number;
      offset?: number;
    }): Promise<any[]> => {
      try {
        const { childId, limit = 20, offset = 0 } = options || {};

        console.log('Fetching transactions:', { childId, limit, offset });

        // Determine the correct endpoint based on whether this is for a child
        let endpoint = `${API_URL}/wallet/transactions?limit=${limit}&offset=${offset}`;

        if (childId) {
          // For child transactions, use the parent/children endpoint
          endpoint = `${API_URL}/parent/children/${childId}/transactions?limit=${limit}&offset=${offset}`;
          console.log(`Using child transactions endpoint: ${endpoint}`);
        }

        const response = await fetch(endpoint, {
          headers: getAuthHeaders(token),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Transactions error response:', errorText);
          throw new Error(errorText || 'Failed to fetch transactions');
        }

        const result = await response.json();
        console.log('Transactions result:', result);

        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
        throw error;
      }
    },

    getChildTransactions: async (childId: string): Promise<any[]> => {
      try {
        console.log(`Fetching transactions for child ID: ${childId}`);
        const endpoint = `${API_URL}/parent/children/${childId}/transactions`;
        console.log(`Using child transactions endpoint: ${endpoint}`);

        const response = await fetch(endpoint, {
          headers: getAuthHeaders(token),
        });
        console.log(`Child transactions response status:`, response.status);

        if (!response.ok) {
          // Try the wallet endpoint as fallback
          console.log('Parent endpoint failed, trying wallet endpoint');
          const fallbackEndpoint = `${API_URL}/wallet/child/${childId}/transactions`;
          const fallbackResponse = await fetch(fallbackEndpoint, {
            headers: getAuthHeaders(token),
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
          headers: getAuthHeaders(token),
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

    checkMpesaStatus: async (transactionId: string): Promise<any> => {
      const response = await fetch(
        `${API_URL}/payments/status/${transactionId}`,
        {
          headers: getAuthHeaders(token),
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

        console.log('Request headers:', getAuthHeaders(token));
        console.log('Request body:', requestBody);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: getAuthHeaders(token),
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
          headers: getAuthHeaders(token),
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

    //     console.log('Request headers:', getAuthHeaders(token));
    //     console.log('Request body:', requestBody);

    //     const response = await fetch(endpoint, {
    //       method: 'POST',
    //       headers: getAuthHeaders(token),
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
        headers: getAuthHeaders(token),
      });
      return handleResponse<any>(response);
    },

    createWithdrawal: async (data: {
      phoneNumber: string;
      amount: number;
    }): Promise<any> => {
      const response = await fetch(`${API_URL}/wallet/withdraw`, {
        method: 'POST',
        headers: getAuthHeaders(token),
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
          headers: getAuthHeaders(token),
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

    getGoals: async (childId?: string) => {
      try {
        let url = `${API_URL}/goals`;

        // If childId is provided, use the parent endpoint for child goals
        if (childId) {
          // Update the URL to match your backend route structure
          // Try this format instead:
          url = `${API_URL}/parent/children/${childId}/goals`;

          // If that doesn't work, try these alternative formats:
          // url = `${API_URL}/goals?childId=${childId}`;
          // url = `${API_URL}/parent/goals?childId=${childId}`;
        }

        console.log('Fetching goals from:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: getAuthHeaders(token),
        });

        if (!response.ok) {
          // If the first endpoint fails, try a fallback endpoint
          if (childId && response.status === 404) {
            console.log('First endpoint failed, trying fallback endpoint');
            const fallbackUrl = `${API_URL}/goals?childId=${childId}`;
            console.log('Trying fallback URL:', fallbackUrl);

            const fallbackResponse = await fetch(fallbackUrl, {
              method: 'GET',
              headers: getAuthHeaders(token),
            });

            if (fallbackResponse.ok) {
              const data = await fallbackResponse.json();
              console.log('Goals data from fallback:', data);
              return Array.isArray(data) ? data : [];
            }
          }

          throw new Error(`Failed to fetch goals: ${response.status}`);
        }

        const data = await response.json();
        console.log('Goals data:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching goals:', error);
        return [];
      }
    },

    getChildGoals: async (childId: string): Promise<any[]> => {
      try {
        const response = await fetch(
          `${API_URL}/parent/children/${childId}/goals`,
          {
            headers: getAuthHeaders(token),
          }
        );
        const result = await handleResponse<any[]>(response);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error(`Failed to fetch goals for child ${childId}:`, error);
        return [];
      }
    },

    approveGoal: async (goalId: string) => {
      if (!goalId) {
        console.error('API: Cannot approve goal - missing goalId');
        throw new Error('Goal ID is required');
      }

      console.log(`API: Approving goal with ID: ${goalId}`);

      try {
        // First, check if the goal is already approved
        try {
          const goalResponse = await fetch(`${API_URL}/goals/${goalId}`, {
            method: 'GET',
            headers: getAuthHeaders(token),
          });

          if (goalResponse.ok) {
            const goalData = await goalResponse.json();
            console.log('API: Goal data before approval attempt:', goalData);

            if (goalData.approved) {
              console.log('API: Goal is already approved, returning success');
              return {
                message: 'Goal is already approved',
                goal: {
                  id: goalId,
                  approved: true,
                  status: 'approved',
                },
              };
            }
          }
        } catch (checkError) {
          console.error('API: Error checking goal status:', checkError);
          // Continue with approval attempt even if check fails
        }

        // Try multiple endpoint formats with detailed debugging
        const endpoints = [
          `${API_URL}/goals/${goalId}/approve`,
          `${API_URL}/parent/goals/${goalId}/approve`,
        ];

        let lastError = null;
        let lastResponseText = '';

        // Try each endpoint
        for (const endpoint of endpoints) {
          try {
            console.log(`API: Trying to approve goal at endpoint: ${endpoint}`);

            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                ...getAuthHeaders(token),
                'Content-Type': 'application/json',
              },
              // Include an empty body to ensure proper POST request
              body: JSON.stringify({}),
            });

            console.log(
              `API: Approve goal response status: ${response.status}`
            );

            // Get response text for debugging
            const responseText = await response.text();
            lastResponseText = responseText;
            console.log(`API: Response text: ${responseText}`);

            // Try to parse as JSON if possible
            let responseData;
            try {
              responseData = JSON.parse(responseText);
              console.log('API: Parsed response data:', responseData);
            } catch (parseError) {
              console.log('API: Response is not valid JSON');
            }

            if (response.ok) {
              console.log('API: Goal approval successful');
              return (
                responseData || {
                  message: 'Goal approved successfully',
                  goal: {
                    id: goalId,
                    approved: true,
                    status: 'approved',
                  },
                }
              );
            }

            // If we get here, this endpoint failed but we'll try the next one
            console.error(
              `API: Endpoint ${endpoint} failed with status ${response.status}`
            );
            lastError = new Error(`Failed to approve goal: ${response.status}`);
          } catch (endpointError) {
            console.error(
              `API: Error with endpoint ${endpoint}:`,
              endpointError
            );
            lastError = endpointError;
          }
        }

        // If we get here, all endpoints failed
        console.error(
          'API: All endpoints failed. Last response:',
          lastResponseText
        );
        throw (
          lastError || new Error('Failed to approve goal: All endpoints failed')
        );
      } catch (error) {
        console.error('API: Error approving goal:', error);
        throw error;
      }
    },

    deleteGoal: async (goalId: string) => {
      try {
        const response = await fetch(`${API_URL}/goals/${goalId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(token),
        });

        if (!response.ok) {
          throw new Error(`Failed to delete goal: ${response.status}`);
        }

        const data = await response.json();
        console.log('Goal deletion response:', data);
        return data;
      } catch (error) {
        console.error('Error deleting goal:', error);
        throw error;
      }
    },

    // Child management endpoints
    getChildren: async () => {
      console.log('API: Fetching children');
      try {
        // Try multiple endpoints to ensure we get the data
        const endpoints = [`${API_URL}/parent/children`, `${API_URL}/children`];

        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            console.log(`API: Trying to fetch children from ${endpoint}`);
            const response = await fetch(endpoint, {
              headers: getAuthHeaders(token),
            });

            console.log(
              `API: Children response status from ${endpoint}:`,
              response.status
            );

            if (!response.ok) {
              console.log(
                `API: Endpoint ${endpoint} returned ${response.status}`
              );
              continue; // Try next endpoint
            }

            const data = await response.json();
            console.log(`API: Children data from ${endpoint}:`, data);

            // Handle different response formats
            let children = [];
            if (Array.isArray(data)) {
              children = data;
            } else if (data.children && Array.isArray(data.children)) {
              children = data.children;
            } else if (data.data && Array.isArray(data.data)) {
              children = data.data;
            }

            // Validate children data
            const validChildren = children.filter(
              (child) =>
                child && typeof child === 'object' && child.id && child.name
            );

            console.log(`API: Valid children from ${endpoint}:`, validChildren);
            return validChildren;
          } catch (endpointError) {
            console.error(
              `API: Error fetching children from ${endpoint}:`,
              endpointError
            );
            lastError = endpointError;
          }
        }

        // If we get here, all endpoints failed
        throw (
          lastError || new Error('Failed to fetch children from all endpoints')
        );
      } catch (error) {
        console.error('API: Error fetching children:', error);
        throw error;
      }
    },

    getChildDetails: async (childId: string) => {
      try {
        console.log(`Fetching details for child: ${childId}`);
        const response = await fetch(`${API_URL}/parent/children/${childId}`, {
          method: 'GET',
          headers: getAuthHeaders(token),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch child details: ${response.status}`);
        }

        const data = await response.json();
        console.log('Child details received:', data);
        return data;
      } catch (error) {
        console.error(`Error fetching details for child ${childId}:`, error);
        return null;
      }
    },

    getChildBalance: async (childId: string) => {
      try {
        console.log(`Fetching balance for child: ${childId}`);
        const response = await fetch(
          `${API_URL}/parent/children/${childId}/balance`,
          {
            method: 'GET',
            headers: getAuthHeaders(token),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch child balance: ${response.status}`);
        }

        const data = await response.json();
        console.log('Child balance received:', data);
        return { balance: data.balance || 0 };
      } catch (error) {
        console.error(`Error fetching balance for child ${childId}:`, error);
        return { balance: 0 };
      }
    },

    createChild: async (data: {
      childName: string;
      childAge: number;
      childPin: string;
    }): Promise<{ childId: string }> => {
      const response = await fetch(`${API_URL}/auth/create-child`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data),
      });
      return handleResponse<{ childId: string }>(response);
    },

    resetChildPin: async (childId: string, newPin: string): Promise<any> => {
      const response = await fetch(
        `${API_URL}/parent/children/${childId}/reset-pin`,
        {
          method: 'POST',
          headers: getAuthHeaders(token),
          body: JSON.stringify({ newPin }),
        }
      );
      return handleResponse<any>(response);
    },

    removeChild: async (childId: string): Promise<any> => {
      const response = await fetch(`${API_URL}/parent/children/${childId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });
      return handleResponse<any>(response);
    },

    // Learning/Education endpoints
    getLearningModules: async (): Promise<any[]> => {
      try {
        const response = await fetch(`${API_URL}/education/modules`, {
          headers: getAuthHeaders(token),
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
        // Try the parent endpoint format first
        const response = await fetch(
          `${API_URL}/parent/children/${childId}/education/progress`,
          {
            headers: getAuthHeaders(token),
          }
        );

        // If that fails, try the direct education endpoint with childId as query param
        if (!response.ok) {
          console.log(
            'Parent endpoint failed, trying education endpoint with query param'
          );
          const fallbackResponse = await fetch(
            `${API_URL}/education/modules?childId=${childId}`,
            {
              headers: getAuthHeaders(token),
            }
          );

          if (fallbackResponse.ok) {
            const result = await fallbackResponse.json();
            console.log('Child learning progress from fallback:', result);
            return Array.isArray(result) ? result : [];
          }

          return [];
        }

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
            headers: getAuthHeaders(token),
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
          headers: getAuthHeaders(token),
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
        // Try the parent endpoint format first
        const response = await fetch(
          `${API_URL}/parent/children/${childId}/achievements`,
          {
            headers: getAuthHeaders(token),
          }
        );

        // If that fails, try the direct achievements endpoint with childId as query param
        if (!response.ok) {
          console.log(
            'Parent endpoint failed, trying achievements endpoint with query param'
          );
          const fallbackResponse = await fetch(
            `${API_URL}/achievements?childId=${childId}`,
            {
              headers: getAuthHeaders(token),
            }
          );

          if (fallbackResponse.ok) {
            const result = await fallbackResponse.json();
            console.log('Child achievements from fallback:', result);
            return Array.isArray(result) ? result : [];
          }

          return [];
        }

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
          headers: getAuthHeaders(token),
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
          headers: getAuthHeaders(token),
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

    // Savings plan endpoints
    createSavingsPlan: async (data: {
      name: string;
      frequency: 'daily' | 'weekly' | 'monthly';
      amount: number;
      goalId?: string;
      childId?: string;
    }): Promise<any> => {
      try {
        const response = await fetch(`${API_URL}/savings`, {
          method: 'POST',
          headers: getAuthHeaders(token),
          body: JSON.stringify(data),
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('Failed to create savings plan:', error);
        throw error;
      }
    },

    getSavingsPlans: async (childId?: string): Promise<any[]> => {
      try {
        const url = childId
          ? `${API_URL}/savings?childId=${childId}`
          : `${API_URL}/savings`;

        const response = await fetch(url, {
          headers: getAuthHeaders(token),
        });
        const result = await handleResponse<any[]>(response);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch savings plans:', error);
        return [];
      }
    },

    getChildSavingsSummary: async (): Promise<any> => {
      try {
        const response = await fetch(`${API_URL}/savings/summary`, {
          headers: getAuthHeaders(token),
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('Failed to fetch savings summary:', error);
        throw error;
      }
    },

    toggleSavingsPlan: async (planId: string): Promise<any> => {
      try {
        const response = await fetch(`${API_URL}/savings/${planId}/toggle`, {
          method: 'PATCH',
          headers: getAuthHeaders(token),
        });
        return await handleResponse(response);
      } catch (error) {
        console.error('Failed to toggle savings plan:', error);
        throw error;
      }
    },

    // Improve the API connectivity check with better timeout handling
    checkApiConnectivity: async (): Promise<boolean> => {
      try {
        console.log('Checking API connectivity...');

        // Increase timeout slightly to 5 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('API connectivity check timed out');
          controller.abort();
        }, 5000);

        try {
          // Try the health endpoint first
          console.log('Trying health endpoint...');
          const response = await fetch(`${API_URL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            console.log('Health endpoint responded successfully');
            return true;
          }

          // If health endpoint fails, try the root endpoint
          if (response.status === 404) {
            console.log(
              'Health endpoint not found (404), trying root endpoint...'
            );

            const rootController = new AbortController();
            const rootTimeoutId = setTimeout(
              () => rootController.abort(),
              5000
            );

            try {
              const rootResponse = await fetch(`${API_URL}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store',
                signal: rootController.signal,
              });

              clearTimeout(rootTimeoutId);

              console.log(
                `Root endpoint responded with status: ${rootResponse.status}`
              );
              return rootResponse.ok;
            } catch (rootError) {
              clearTimeout(rootTimeoutId);
              console.error('Root endpoint check failed:', rootError);
              return false;
            }
          }

          console.log(
            `Health endpoint responded with status: ${response.status}`
          );
          return false;
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.error('Fetch operation failed:', fetchError);
          return false;
        }
      } catch (error) {
        console.error('API connectivity check failed:', error);
        return false;
      }
    },

    // Add a function to get the API status with more details
    getApiStatus: async (): Promise<{
      isConnected: boolean;
      serverTime?: string;
      version?: string;
      message?: string;
    }> => {
      try {
        // Try the health endpoint first
        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });

        // If health endpoint returns 404, try a fallback endpoint
        if (response.status === 404) {
          console.log('Health endpoint not found, trying root endpoint');
          const fallbackResponse = await fetch(`${API_URL}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            signal: AbortSignal.timeout(5000),
          });

          if (!fallbackResponse.ok) {
            return {
              isConnected: false,
              message: `Server returned ${fallbackResponse.status}: ${fallbackResponse.statusText}`,
            };
          }

          return {
            isConnected: true,
            message: 'API is reachable but health endpoint not available',
          };
        }

        if (!response.ok) {
          return {
            isConnected: false,
            message: `Server returned ${response.status}: ${response.statusText}`,
          };
        }

        const data = await response.json();
        return {
          isConnected: true,
          serverTime: data.serverTime || data.timestamp,
          version: data.version,
          message: data.message || 'API is operational',
        };
      } catch (error: any) {
        return {
          isConnected: false,
          message: error.message || 'Could not connect to API',
        };
      }
    },

    // Add a simple ping endpoint that's more lightweight than the health check
    ping: async (): Promise<boolean> => {
      try {
        // Use a very short timeout for a quick check
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        try {
          // Try a HEAD request to the API root which is very lightweight
          const response = await fetch(`${API_URL}`, {
            method: 'HEAD',
            cache: 'no-store',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          return response.ok;
        } catch (error) {
          clearTimeout(timeoutId);
          return false;
        }
      } catch (error) {
        return false;
      }
    },

    // Add a function to get the API status with more details
    getApiStatus: async (): Promise<{
      isConnected: boolean;
      serverTime?: string;
      version?: string;
      message?: string;
    }> => {
      try {
        // Try the health endpoint first
        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });

        // If health endpoint returns 404, try a fallback endpoint
        if (response.status === 404) {
          console.log('Health endpoint not found, trying root endpoint');
          const fallbackResponse = await fetch(`${API_URL}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            signal: AbortSignal.timeout(5000),
          });

          if (!fallbackResponse.ok) {
            return {
              isConnected: false,
              message: `Server returned ${fallbackResponse.status}: ${fallbackResponse.statusText}`,
            };
          }

          return {
            isConnected: true,
            message: 'API is reachable but health endpoint not available',
          };
        }

        if (!response.ok) {
          return {
            isConnected: false,
            message: `Server returned ${response.status}: ${response.statusText}`,
          };
        }

        const data = await response.json();
        return {
          isConnected: true,
          serverTime: data.serverTime || data.timestamp,
          version: data.version,
          message: data.message || 'API is operational',
        };
      } catch (error: any) {
        return {
          isConnected: false,
          message: error.message || 'Could not connect to API',
        };
      }
    },

    // Add a simple ping endpoint that's more lightweight than the health check
    ping: async (): Promise<boolean> => {
      try {
        // Use a very short timeout for a quick check
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        try {
          // Try a HEAD request to the API root which is very lightweight
          const response = await fetch(`${API_URL}`, {
            method: 'HEAD',
            cache: 'no-store',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          return response.ok;
        } catch (error) {
          clearTimeout(timeoutId);
          return false;
        }
      } catch (error) {
        return false;
      }
    },

    getPendingGoals: async () => {
      console.log('API: Fetching pending goals');
      try {
        // Try multiple endpoints to ensure we get the data
        const endpoints = [
          `${API_URL}/goals?approved=false`,
          `${API_URL}/parent/goals?approved=false`,
          `${API_URL}/goals/pending`,
          `${API_URL}/parent/goals/pending`,
          `${API_URL}/parent/goals?status=pending`,
          `${API_URL}/goals?status=pending`,
        ];

        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            console.log(`API: Trying to fetch pending goals from ${endpoint}`);
            const response = await fetch(endpoint, {
              headers: getAuthHeaders(token),
            });

            console.log(
              `API: Pending goals response status from ${endpoint}:`,
              response.status
            );

            if (!response.ok) {
              console.log(
                `API: Endpoint ${endpoint} returned ${response.status}`
              );
              continue; // Try next endpoint
            }

            const data = await response.json();
            console.log(`API: Pending goals data from ${endpoint}:`, data);

            // Handle different response formats
            let goals = [];
            if (Array.isArray(data)) {
              goals = data;
            } else if (data.goals && Array.isArray(data.goals)) {
              goals = data.goals;
            } else if (data.data && Array.isArray(data.data)) {
              goals = data.data;
            }

            // Filter for pending/unapproved goals if needed
            const pendingGoals = goals.filter(
              (goal) =>
                goal && typeof goal === 'object' && goal.id && !goal.approved
            );

            // Process the goals to ensure they have all required properties
            const processedGoals = pendingGoals.map((goal) => ({
              id: goal.id,
              name: goal.name || 'Unnamed Goal',
              target: goal.targetAmount || goal.target || 0,
              current: goal.currentAmount || goal.current || 0,
              approved: false,
              childId: goal.childId,
              jarId: goal.jarId,
              childName: goal.childName || 'Unknown Child',
            }));

            console.log(
              `API: Valid pending goals from ${endpoint}:`,
              processedGoals
            );
            return processedGoals;
          } catch (endpointError) {
            console.error(
              `API: Error fetching pending goals from ${endpoint}:`,
              endpointError
            );
            lastError = endpointError;
          }
        }

        // If we get here, all endpoints failed
        console.error('API: All endpoints failed for pending goals');
        throw lastError || new Error('Failed to fetch pending goals');
      } catch (error) {
        console.error('API: Error in getPendingGoals:', error);
        return [];
      }
    },
  };
};
