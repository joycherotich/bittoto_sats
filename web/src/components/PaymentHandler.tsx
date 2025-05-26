import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Copy, CheckCircle, Wallet, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MainNav from './MainNav';

// Define types for API responses
interface BalanceResponse {
  balance: number;
}

interface InvoiceResponse {
  paymentHash: string;
  paymentRequest: string;
  amount: number;
}

interface InvoiceStatusResponse {
  paid: boolean;
  amount: number;
  memo: string;
  createdAt: string;
}

interface MpesaDepositResponse {
  success: boolean;
  checkoutRequestId?: string;
  transactionId?: string;
}

interface MpesaStatusResponse {
  completed: boolean;
  amount: number;
  description: string;
  createdAt: string;
}

// Define BalanceContext type
interface BalanceContextType {
  balance: number | null;
  refreshBalance: () => Promise<void>;
  onBalanceRefresh: (callback: () => void) => void;
  emitBalanceRefresh: () => void;
}

// Create BalanceContext
const BalanceContext = React.createContext<BalanceContextType>({
  balance: null,
  refreshBalance: async () => {},
  onBalanceRefresh: () => {},
  emitBalanceRefresh: () => {},
});

export const useBalance = () => React.useContext(BalanceContext);

export const BalanceProvider: React.FC<{
  children: React.ReactNode;
  childId?: string;
}> = ({ children, childId }) => {
  const { api, user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [refreshCallbacks, setRefreshCallbacks] = useState<(() => void)[]>([]);

  const refreshBalance = useCallback(async () => {
    if (!api || !user) {
      console.warn('Cannot refresh balance: API or user missing');
      return;
    }
    const effectiveChildId = childId || user.id;
    let retries = 3;
    while (retries > 0) {
      try {
        console.log('Fetching balance:', {
          userId: user.id,
          childId: effectiveChildId,
        });

        // Clear any cached data to ensure fresh balance
        const cacheKey = `balance-${effectiveChildId}`;
        if (window.sessionStorage) {
          window.sessionStorage.removeItem(cacheKey);
        }

        const response: BalanceResponse = await api.getBalance({
          childId: effectiveChildId,
          _nocache: Date.now(), // Add cache-busting parameter
        });

        setBalance(response.balance);
        console.log('Balance refreshed:', {
          userId: user.id,
          childId: effectiveChildId,
          balance: response.balance,
        });
        return;
      } catch (error: any) {
        console.error('Error refreshing balance:', {
          error: error.message,
          retries,
        });
        retries--;
        if (retries === 0) {
          console.error('Max retries reached for balance refresh');
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }
  }, [api, user, childId]);

  const onBalanceRefresh = useCallback((callback: () => void) => {
    setRefreshCallbacks((prev) => [...prev, callback]);
    return () => {
      setRefreshCallbacks((prev) => prev.filter((cb) => cb !== callback));
    };
  }, []);

  const emitBalanceRefresh = useCallback(() => {
    console.log('Emitting balance refresh to callbacks:', {
      callbackCount: refreshCallbacks.length,
    });
    refreshBalance();
    refreshCallbacks.forEach((callback) => callback());
  }, [refreshBalance, refreshCallbacks]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const value = useMemo(
    () => ({ balance, refreshBalance, onBalanceRefresh, emitBalanceRefresh }),
    [balance, refreshBalance, onBalanceRefresh, emitBalanceRefresh]
  );

  return (
    <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>
  );
};

// Define props
interface PaymentHandlerProps {
  onBack: () => void;
  type: 'lightning' | 'mpesa';
  childId?: string;
}

const PaymentHandler: React.FC<PaymentHandlerProps> = ({
  onBack,
  type,
  childId,
}) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const { toast } = useToast();
  const { api, user } = useAuth();
  const { balance, refreshBalance, emitBalanceRefresh } = useBalance();

  const [memo, setMemo] = useState('');
  const [invoice, setInvoice] = useState('');
  const [paymentHash, setPaymentHash] = useState('');
  const [copied, setCopied] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    'pending' | 'completed' | 'failed' | null
  >(null);
  const [statusRetries, setStatusRetries] = useState(0);
  const MAX_RETRIES = 3;

  const isParent = user?.role === 'parent';

  // Polling for payment status with cleanup
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (
      (type === 'lightning' && paymentHash && !paymentStatus) ||
      (type === 'mpesa' && transactionId && paymentStatus === 'pending')
    ) {
      interval = setInterval(() => {
        if (type === 'lightning') {
          checkLightningStatus();
        } else {
          checkMpesaStatus();
        }
      }, 5000);
    }
    return () => {
      if (interval) {
        console.log('Clearing payment status polling interval');
        clearInterval(interval);
      }
    };
  }, [type, paymentHash, transactionId, paymentStatus]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!api || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You are not authenticated',
      });
      return;
    }
    const effectiveChildId = isParent ? childId : user.id;
    if (!effectiveChildId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Child ID is required',
      });
      return;
    }
    const amountValue = parseInt(amount, 10);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid amount',
      });
      return;
    }
    setLoading(true);
    try {
      console.log('Creating lightning invoice:', {
        amount: amountValue,
        memo: memo || 'BIT Toto Deposit',
        childId: effectiveChildId,
        userId: user.id,
        userRole: user.role,
      });
      const response: InvoiceResponse = await api.createLightningInvoice({
        amount: amountValue,
        memo: memo || 'BIT Toto Deposit',
        childId: effectiveChildId,
        userId: user.id,
        userRole: user.role,
      });
      if (!response.paymentRequest || !response.paymentHash) {
        throw new Error('Invalid invoice response');
      }
      setInvoice(response.paymentRequest);
      setPaymentHash(response.paymentHash);
      setStatusRetries(0);
      toast({
        title: 'Invoice Created',
        description: 'Lightning invoice generated. Checking payment status...',
      });
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not generate Lightning invoice',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMpesaPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!api || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You are not authenticated',
      });
      return;
    }
    if (!phoneNumber || !amount) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all fields',
      });
      return;
    }
    let formattedPhone = phoneNumber.replace(/\+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone;
    }
    const amountValue = parseInt(amount, 10);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid amount',
      });
      return;
    }
    setLoading(true);
    setPaymentStatus('pending');
    const effectiveChildId = isParent ? childId : user.id;
    if (!effectiveChildId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Child ID is required',
      });
      setLoading(false);
      return;
    }
    try {
      console.log('Submitting M-Pesa deposit:', {
        phoneNumber: formattedPhone,
        amount: amountValue,
        childId: effectiveChildId,
      });
      const response: MpesaDepositResponse = await api.createMpesaDeposit({
        phoneNumber: formattedPhone,
        amount: amountValue,
        childId: effectiveChildId,
      });
      if (
        !response.success ||
        (!response.checkoutRequestId && !response.transactionId)
      ) {
        throw new Error('STK Push not initiated');
      }
      setTransactionId(
        response.checkoutRequestId || response.transactionId || null
      );
      setStatusRetries(0);
      toast({
        title: 'M-Pesa Request Sent',
        description: 'STK Push initiated. Please check your phone.',
      });
    } catch (error: any) {
      console.error('M-Pesa deposit error:', error);
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied to Clipboard',
      description: 'Invoice copied to clipboard',
    });
  };

  const checkLightningStatus = useCallback(async () => {
    if (!api || !paymentHash || statusRetries >= MAX_RETRIES) return;
    setCheckingStatus(true);
    try {
      console.log('Checking Lightning invoice status:', { paymentHash });
      const response: InvoiceStatusResponse = await api.checkInvoiceStatus(
        paymentHash
      );
      console.log('Lightning status response:', response);
      if (response.paid) {
        setPaymentStatus('completed');

        // More robust balance update
        try {
          // First refresh the balance from the server
          await refreshBalance();

          // Then emit the balance refresh event to update all components
          emitBalanceRefresh();

          console.log('Balance refreshed after successful Lightning payment');
        } catch (balanceError) {
          console.error(
            'Error refreshing balance after payment:',
            balanceError
          );
        }

        toast({
          title: '🎉 Payment Confirmed',
          description: `${response.amount} sats added.`,
        });
        setInvoice('');
        setPaymentHash('');
        setAmount('');
        setMemo('');
      } else {
        setStatusRetries((prev) => prev + 1);
        toast({
          title: 'Payment Pending',
          description: `Invoice not paid yet. Retry ${
            statusRetries + 1
          }/${MAX_RETRIES}`,
        });
      }
    } catch (error: any) {
      console.error('Error checking Lightning status:', error);
      setStatusRetries((prev) => prev + 1);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Could not verify payment: ${
          error.message || 'Unknown error'
        }. Retry ${statusRetries + 1}/${MAX_RETRIES}`,
      });
      if (statusRetries + 1 >= MAX_RETRIES) {
        setPaymentStatus('failed');
      }
    } finally {
      setCheckingStatus(false);
    }
  }, [
    api,
    paymentHash,
    statusRetries,
    refreshBalance,
    emitBalanceRefresh,
    toast,
  ]);

  const checkMpesaStatus = useCallback(async () => {
    if (!api || !transactionId || statusRetries >= MAX_RETRIES) return;
    setCheckingStatus(true);
    try {
      console.log('Checking M-Pesa status:', { transactionId });
      const response: MpesaStatusResponse = await api.checkMpesaStatus(
        transactionId
      );
      console.log('M-Pesa status response:', response);
      if (response.completed) {
        setPaymentStatus('completed');

        // More robust balance update
        try {
          // First refresh the balance from the server
          await refreshBalance();

          // Then emit the balance refresh event to update all components
          emitBalanceRefresh();

          console.log('Balance refreshed after successful M-Pesa payment');
        } catch (balanceError) {
          console.error(
            'Error refreshing balance after payment:',
            balanceError
          );
        }

        toast({
          title: '🎉 Payment Confirmed',
          description: `${response.amount} KES added.`,
        });
        setPhoneNumber('');
        setAmount('');
        setTransactionId(null);
      } else {
        setStatusRetries((prev) => prev + 1);
        toast({
          title: 'Payment Pending',
          description: `Payment not completed yet. Retry ${
            statusRetries + 1
          }/${MAX_RETRIES}`,
        });
      }
    } catch (error: any) {
      console.error('Error checking M-Pesa status:', error);
      setStatusRetries((prev) => prev + 1);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Could not verify payment: ${
          error.message || 'Unknown error'
        }. Retry ${statusRetries + 1}/${MAX_RETRIES}`,
      });
      if (statusRetries + 1 >= MAX_RETRIES) {
        setPaymentStatus('failed');
      }
    } finally {
      setCheckingStatus(false);
    }
  }, [
    api,
    transactionId,
    statusRetries,
    refreshBalance,
    emitBalanceRefresh,
    toast,
  ]);

  const resetPayment = () => {
    setInvoice('');
    setPaymentHash('');
    setMemo('');
    setPhoneNumber('');
    setTransactionId(null);
    setPaymentStatus(null);
    setAmount('');
    setStatusRetries(0);
  };

  const renderLightningForm = () => (
  <div className="min-h-screen bg-[#f9fafb] md:ml-56 p-4 sm:p-6 md:p-8">
 <header className="fixed top-0 left-0 right-0 z-50 bg-blue-800 shadow-md md:ml-56">
    <div className="max-w-full md:max-w-[calc(100%-14rem)] mx-auto flex justify-between items-center px-6 py-4">
      <div className="text-2xl font-serif font-bold text-white">Payments</div>
   
    </div>
  </header>
  <div className="mb-6">
    <h1 className="text-2xl font-semibold text-gray-800">Lightning Invoices</h1>
    <p className="text-sm text-gray-500">Generate and manage Lightning Network invoices.</p>
  </div>

  {/* Invoice Form Card */}
  <div className="max-w-xl mx-auto">
    <Card className="shadow-md rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Create Lightning Invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (sats)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="1"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memo">Memo (optional)</Label>
            <Input
              id="memo"
              type="text"
              placeholder="Deposit to SatsJar"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Creating Invoice...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Generate Invoice
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</div>

  );

  const renderLightningInvoice = () => (
    <Card className="w-full max-w-md mx-auto">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg sm:text-xl font-medium">Lightning Invoice</CardTitle>
    </CardHeader>
  
    <CardContent className="space-y-4">
      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <QRCodeSVG value={invoice} size={200} />
        </div>
      </div>
  
      {/* Invoice Text & Copy Button */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Invoice</Label>
          <Button variant="ghost" size="icon" onClick={copyToClipboard}>
            {copied ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="bg-muted p-3 rounded-md overflow-x-auto">
          <p className="text-xs break-all font-mono">{invoice}</p>
        </div>
      </div>
  
      {/* Buttons */}
      <div className="space-y-2">
        <Button
          className="w-full"
          onClick={checkLightningStatus}
          disabled={checkingStatus || statusRetries >= MAX_RETRIES}
        >
          {checkingStatus ? (
            <>
              <span className="loading mr-2"></span>
              Checking Payment...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Check Payment Status
            </>
          )}
        </Button>
        <Button variant="outline" className="w-full" onClick={resetPayment}>
          Create New Invoice
        </Button>
      </div>
    </CardContent>
  </Card>
  
  );

  const renderMpesaForm = () => (
    <Card className="w-full max-w-md mx-auto">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg sm:text-xl font-medium">
        Deposit via M-Pesa
      </CardTitle>
    </CardHeader>
  
    <CardContent>
      <form onSubmit={handleMpesaPayment} className="space-y-4">
        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone">M-Pesa Phone Number</Label>
          <Input
            id="phone"
            type="text"
            placeholder="254712345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Enter the phone number registered with M-Pesa (format: 254XXXXXXXXX)
          </p>
        </div>
  
        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (KES)</Label>
          <Input
            id="amount"
            type="number"
            min="10"
            step="1"
            placeholder="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">Minimum amount: 10 KES</p>
        </div>
  
        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={loading}>
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

  const renderMpesaInProgress = () => (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-lg font-medium'>
          Payment in Progress
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <Alert>
          <AlertDescription>
            An M-Pesa payment request has been sent to your phone. Please check
            your phone and complete the payment.
          </AlertDescription>
        </Alert>
        <div className='flex flex-col space-y-4 items-center'>
          <p className='text-sm text-muted-foreground text-center'>
            The status will update automatically once payment is completed.
          </p>
          <Button
            onClick={checkMpesaStatus}
            disabled={checkingStatus || statusRetries >= MAX_RETRIES}
            className='w-full'
          >
            {checkingStatus ? (
              <>
                <span className='loading mr-2'></span>
                Checking Status...
              </>
            ) : (
              <>
                <CheckCircle className='mr-2 h-4 w-4' />
                Check Payment Status
              </>
            )}
          </Button>
          <Button variant='outline' className='w-full' onClick={resetPayment}>
            Cancel and Start Over
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPaymentCompleted = () => (
    <Card>
      <CardContent className='pt-6 pb-6'>
        <div className='flex flex-col items-center justify-center space-y-4'>
          <CheckCircle className='h-16 w-16 text-green-500' />
          <h3 className='text-xl font-semibold'>Payment Successful!</h3>
          <p className='text-center text-muted-foreground'>
            Your deposit of {amount} {type === 'lightning' ? 'sats' : 'KES'} has
            been processed.
          </p>
          <p className='text-center font-medium'>
            New Balance: {balance !== null ? `${balance} sats` : 'Loading...'}
          </p>
          <Button onClick={resetPayment} className='mt-4'>
            Make Another Deposit
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 animate-fade-in px-4 sm:px-6 md:px-8">
    {/* Navigation */}
    <MainNav />
  
    {/* Back button and heading */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h2 className="text-lg sm:text-xl font-semibold">
        {type === 'lightning' ? 'Lightning Deposit' : 'M-Pesa Deposit'}
        {childId && isParent ? ' (Child Account)' : ''}
      </h2>
    </div>
  
    {/* Conditional rendering of forms or messages */}
    <div>
      {type === 'lightning' ? (
        !invoice ? (
          renderLightningForm()
        ) : paymentStatus === 'completed' ? (
          renderPaymentCompleted()
        ) : (
          renderLightningInvoice()
        )
      ) : paymentStatus === 'completed' ? (
        renderPaymentCompleted()
      ) : transactionId ? (
        renderMpesaInProgress()
      ) : (
        renderMpesaForm()
      )}
    </div>
  </div>
  
  );
};

export default PaymentHandler;
