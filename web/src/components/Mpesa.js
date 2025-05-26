import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MainNav from '@/component/MainNav';
// Constants
const API_URL = 'http://localhost:3000/api';

/**
 * Mpesa component - Adapted directly from the working app.js code
 */
const Mpesa = ({ onBack }) => {
  // State
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const { toast } = useToast();
  const { token } = useAuth();

  // API request helper - directly from app.js
  const apiRequest = async (endpoint, method = 'GET', data = null) => {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }

      if (data) {
        options.body = JSON.stringify(data);
      }

      console.log(`Making ${method} request to ${API_URL}${endpoint}`, options);
      const response = await fetch(`${API_URL}${endpoint}`, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'API request failed');
      }

      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  // Initialize component
  useEffect(() => {
    // Create transaction ID element if it doesn't exist
    if (!document.getElementById('transaction-id')) {
      const transactionIdElement = document.createElement('div');
      transactionIdElement.id = 'transaction-id';
      transactionIdElement.style.display = 'none';
      document.body.appendChild(transactionIdElement);
    }
  }, []);

  // Handle M-Pesa form submission
  const handleMpesaSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPaymentStatus('pending');

    try {
      const phoneNumber = document.getElementById('mpesa-phone').value;
      const amount = document.getElementById('mpesa-amount').value;

      if (!phoneNumber || !amount) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please fill in all fields',
        });
        setLoading(false);
        return;
      }

      console.log('Submitting M-Pesa payment:', { phoneNumber, amount });
      
      const result = await apiRequest('/payments/mpesa/stk-push', 'POST', {
        phoneNumber,
        amount: parseInt(amount),
      });

      console.log('M-Pesa API response:', result);
      
      // Store transaction ID
      const txId = result.transactionId || result.checkoutRequestId;
      if (!txId) {
        throw new Error('Transaction ID not found in response');
      }
      
      setTransactionId(txId);
      
      // Update hidden transaction ID element
      const transactionIdElement = document.getElementById('transaction-id');
      if (transactionIdElement) {
        transactionIdElement.textContent = txId;
      }

      toast({
        title: 'M-Pesa Request Sent',
        description: 'Please check your phone for the M-Pesa prompt',
      });
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      setPaymentStatus('failed');
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: error.message || 'Could not process M-Pesa payment',
      });
      setTransactionId(null);
    } finally {
      setLoading(false);
    }
  };

  // Check M-Pesa payment status
  const checkMpesaStatus = async () => {
    if (!transactionId) {
      const transactionIdElement = document.getElementById('transaction-id');
      if (transactionIdElement && transactionIdElement.textContent) {
        setTransactionId(transactionIdElement.textContent);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No transaction ID found',
        });
        return;
      }
    }

    setCheckingStatus(true);
    const statusElement = document.getElementById('mpesa-status-message');
    
    if (statusElement) {
      statusElement.innerHTML = '<span class="loading"></span> Checking payment status...';
      statusElement.className = 'text-sm text-amber-600 mt-2 mb-2';
    }

    try {
      const result = await apiRequest(`/payments/status/${transactionId}`);
      console.log('Payment status response:', result);

      if (result.status === 'completed') {
        setPaymentStatus('completed');
        if (statusElement) {
          statusElement.textContent = 'Payment completed! Your balance has been updated.';
          statusElement.className = 'text-sm text-green-600 mt-2 mb-2';
        }
        toast({
          title: 'Payment Completed!',
          description: 'Your balance has been updated.',
        });
      } else if (result.status === 'failed') {
        setPaymentStatus('failed');
        if (statusElement) {
          statusElement.textContent = 'Payment failed: ' + (result.resultDesc || 'Unknown error');
          statusElement.className = 'text-sm text-red-600 mt-2 mb-2';
        }
        toast({
          variant: 'destructive',
          title: 'Payment Failed',
          description: result.resultDesc || 'Unknown error',
        });
      } else {
        // Still pending
        if (statusElement) {
          statusElement.textContent = 'Payment is still pending. Please check your phone and complete the payment.';
          statusElement.className = 'text-sm text-amber-600 mt-2 mb-2';
        }
        toast({
          title: 'Payment Pending',
          description: 'The payment has not been completed yet. Please check your phone and complete the payment.',
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      if (statusElement) {
        statusElement.textContent = 'Error checking payment: ' + error.message;
        statusElement.className = 'text-sm text-red-600 mt-2 mb-2';
      }
      toast({
        variant: 'destructive',
        title: 'Error Checking Payment',
        description: error.message || 'Could not check payment status',
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const resetPayment = () => {
    // Reset form fields
    const phoneInput = document.getElementById('mpesa-phone');
    const amountInput = document.getElementById('mpesa-amount');
    if (phoneInput) phoneInput.value = '';
    if (amountInput) amountInput.value = '';
    
    // Reset state
    setTransactionId(null);
    setPaymentStatus(null);
    
    // Reset transaction ID element
    const transactionIdElement = document.getElementById('transaction-id');
    if (transactionIdElement) {
      transactionIdElement.textContent = '';
    }
  };

  // Render the completed payment view
  const renderMpesaCompleted = () => (
    <Card>
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h3 className="text-xl font-semibold">Payment Successful!</h3>
          <p className="text-center text-muted-foreground">
            Your deposit has been processed successfully.
          </p>
          <Button onClick={resetPayment} className="mt-4">
            Make Another Deposit
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render the payment in progress view
  const renderMpesaInProgress = () => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Payment in Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            An M-Pesa payment request has been sent to your phone. Please check your phone and complete the payment.
          </AlertDescription>
        </Alert>
        <div className="flex flex-col space-y-4 items-center mpesa-status-container">
          <p className="text-sm text-muted-foreground text-center">
            Once you've completed the payment on your phone, click the button below to check the status.
          </p>
          <div id="mpesa-status-message" className="text-sm text-amber-600 mt-2 mb-2"></div>
          <Button 
            onClick={checkMpesaStatus}
            disabled={checkingStatus}
            className="w-full"
          >
            {checkingStatus ? (
              <>
                <span className="loading mr-2"></span>
                Checking Status...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Check Payment Status
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={resetPayment}
            className="w-full"
          >
            Cancel and Start Over
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render the initial form view
  const renderMpesaForm = () => (
    <Card>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Deposit via M-Pesa</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="mpesa-form" onSubmit={handleMpesaSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="mpesa-phone" className="text-sm font-medium">
              M-Pesa Phone Number
            </label>
            <Input
              id="mpesa-phone"
              type="text"
              placeholder="254712345678"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the phone number registered with M-Pesa (format: 254XXXXXXXXX)
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="mpesa-amount" className="text-sm font-medium">
              Amount (KES)
            </label>
            <Input
              id="mpesa-amount"
              type="number"
              min="10"
              step="1"
              placeholder="100"
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimum amount: 10 KES
            </p>
          </div>
          
          {/* Hidden field to store transaction ID */}
          <div id="transaction-id" style={{ display: 'none' }}></div>
          
          {/* Status message container */}
          <div className="mpesa-status-container">
            <div id="mpesa-status-message" className="text-sm text-amber-600 mt-2 mb-2"></div>
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading mr-2"></span>
                Processing...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Deposit with M-Pesa
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <MainNav />
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold ml-2">M-Pesa Deposit</h2>
      </div>

      {paymentStatus === 'completed' ? 
        renderMpesaCompleted() : 
        transactionId ? 
          renderMpesaInProgress() : 
          renderMpesaForm()
      }
    </div>
  );
};

export default Mpesa;


