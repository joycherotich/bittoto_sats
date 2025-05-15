import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  RefreshCcw,
  Wallet,
  Zap,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const { api, token, user } = useAuth();

  const [memo, setMemo] = useState('');
  const [invoice, setInvoice] = useState('');
  const [paymentHash, setPaymentHash] = useState('');
  const [copied, setCopied] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    'pending' | 'completed' | 'failed' | null
  >(null);

  const isParent = user?.role === 'parent';

  // const handleCreateInvoice = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!api || !token) {
  //     toast({
  //       variant: 'destructive',
  //       title: 'Error',
  //       description: 'You are not authenticated',
  //     });
  //     return;
  //   }
  //   if (!amount) {
  //     toast({
  //       variant: 'destructive',
  //       title: 'Error',
  //       description: 'Please enter an amount',
  //     });
  //     return;
  //   }
  //   const amountValue = parseInt(amount, 10);
  //   if (isNaN(amountValue) || amountValue <= 0) {
  //     toast({
  //       variant: 'destructive',
  //       title: 'Error',
  //       description: 'Please enter a valid amount',
  //     });
  //     return;
  //   }
  //   setLoading(true);
  //   try {
  //     console.log('Creating lightning invoice', {
  //       amount: amountValue,
  //       memo: memo || 'BIT Toto Deposit',
  //       childId: childId || undefined,
  //       isParent,
  //       userId: user?.id, // Include user ID for debugging
  //     });

  //     // Make sure we're using the correct endpoint based on user role
  //     const response = await api.createLightningInvoice({
  //       amount: amountValue,
  //       memo: memo || 'BIT Toto Deposit',
  //       childId: isParent && childId ? childId : undefined,
  //       userId: user?.id, // Pass user ID if needed by your API
  //     });

  //     setInvoice(response.paymentRequest);
  //     setPaymentHash(response.paymentHash);
  //     toast({
  //       title: 'Invoice Created',
  //       description: 'Lightning invoice generated successfully',
  //     });
  //   } catch (error) {
  //     console.error('Error creating invoice:', error);
  //     toast({
  //       variant: 'destructive',
  //       title: 'Error Creating Invoice',
  //       description:
  //         error instanceof Error
  //           ? error.message
  //           : 'Could not generate Lightning invoice',
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleCreateInvoice called with:', {
      isParent,
      childId,
      user,
      token: token ? 'present' : 'missing',
    });
    if (!api || !token) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You are not authenticated',
      });
      return;
    }
    if (isParent && !childId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Child ID is required for parent invoice creation',
      });
      return;
    }
    if (!amount) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter an amount',
      });
      return;
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
    try {
      console.log('Creating lightning invoice', {
        amount: amountValue,
        memo: memo || 'BIT Toto Deposit',
        childId: isParent ? childId : undefined,
        isParent,
        userId: user?.id,
        userRole: user?.role,
      });

      const response = await api.createLightningInvoice({
        amount: amountValue,
        memo: memo || 'BIT Toto Deposit',
        childId: isParent ? childId : undefined,
        userId: user?.id,
        userRole: user?.role,
      });

      if (!response.paymentRequest || !response.paymentHash) {
        throw new Error('Invalid invoice response from server');
      }

      setInvoice(response.paymentRequest);
      setPaymentHash(response.paymentHash);
      toast({
        title: 'Invoice Created',
        description: 'Lightning invoice generated successfully',
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        variant: 'destructive',
        title: 'Error Creating Invoice',
        description:
          error instanceof Error
            ? `Failed to create invoice: ${error.message}`
            : 'Could not generate Lightning invoice',
      });
    } finally {
      setLoading(false);
    }
  };
  const handleMpesaPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!api || !token) {
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
    try {
      console.log('Submitting M-Pesa deposit:', {
        phoneNumber: formattedPhone,
        amount: amountValue,
        childId: isParent ? childId : undefined,
      });

      const response = await api.createMpesaDeposit({
        phoneNumber: formattedPhone,
        amount: amountValue,
        childId: isParent ? childId : undefined,
      });

      console.log('M-Pesa API response:', response);

      if (!response.success && !response.checkoutRequestId) {
        throw new Error('STK Push not initiated: Invalid response');
      }

      setTransactionId(response.checkoutRequestId || response.transactionId);
      toast({
        title: 'M-Pesa Request Sent',
        description: `STK Push initiated. Please check your phone to complete the payment.`,
      });
    } catch (error) {
      console.error('M-Pesa deposit error:', error);
      setPaymentStatus('failed');
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Could not process M-Pesa payment',
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

  const checkLightningStatus = async () => {
    if (!api || !token || !paymentHash) return;
    setCheckingStatus(true);
    try {
      const response = await api.checkInvoiceStatus(paymentHash);
      if (response.paid) {
        toast({
          title: 'Payment Received',
          description: `${amount} sats have been added to your balance`,
        });
        setAmount('');
        setMemo('');
        setInvoice('');
        setPaymentHash('');
      } else {
        toast({
          title: 'Payment Pending',
          description: 'The invoice has not been paid yet',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Checking Status',
        description:
          error instanceof Error
            ? error.message
            : 'Could not check invoice status',
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const checkMpesaStatus = async () => {
    if (!api || !token || !transactionId) return;
    setCheckingStatus(true);
    try {
      const response = await api.checkMpesaStatus(transactionId);
      if (response.completed || response.status === 'completed') {
        setPaymentStatus('completed');
        toast({
          title: 'Payment Successful',
          description: `${
            response.amount || amount
          } KES have been added to your balance`,
        });
        setPhoneNumber('');
        setAmount('');
        setTransactionId(null);
      } else {
        toast({
          title: 'Payment Pending',
          description:
            'The payment has not been completed yet. Please check your phone and complete the payment.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Checking Payment',
        description:
          error instanceof Error
            ? error.message
            : 'Could not check payment status',
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const resetPayment = () => {
    if (type === 'lightning') {
      setInvoice('');
      setPaymentHash('');
      setMemo('');
    } else {
      setPhoneNumber('');
      setTransactionId(null);
      setPaymentStatus(null);
    }
    setAmount('');
  };

  const renderLightningForm = () => (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-lg font-medium'>
          Create Lightning Invoice
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateInvoice} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='amount'>Amount (sats)</Label>
            <Input
              id='amount'
              type='number'
              min='1'
              step='1'
              placeholder='1000'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='memo'>Memo (optional)</Label>
            <Input
              id='memo'
              type='text'
              placeholder='Deposit to SatsJar'
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
          <Button type='submit' className='w-full' disabled={loading}>
            {loading ? (
              <>
                <span className='loading mr-2'></span>
                Creating Invoice...
              </>
            ) : (
              <>
                <Zap className='mr-2 h-4 w-4' />
                Generate Invoice
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderLightningInvoice = () => (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-lg font-medium'>Lightning Invoice</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex justify-center'>
          <div className='bg-white p-4 rounded-lg'>
            <QRCodeSVG value={invoice} size={200} />
          </div>
        </div>
        <div className='space-y-2'>
          <div className='flex justify-between items-center'>
            <Label>Invoice</Label>
            <Button variant='ghost' size='icon' onClick={copyToClipboard}>
              {copied ? (
                <CheckCircle className='h-4 w-4 text-green-500' />
              ) : (
                <Copy className='h-4 w-4' />
              )}
            </Button>
          </div>
          <div className='bg-muted p-3 rounded-md'>
            <p className='text-xs break-all font-mono'>{invoice}</p>
          </div>
        </div>
        <div className='space-y-2'>
          <Button
            className='w-full'
            onClick={checkLightningStatus}
            disabled={checkingStatus}
          >
            {checkingStatus ? (
              <>
                <span className='loading mr-2'></span>
                Checking Payment...
              </>
            ) : (
              <>
                <Zap className='mr-2 h-4 w-4' />
                Check Payment Status
              </>
            )}
          </Button>
          <Button variant='outline' className='w-full' onClick={resetPayment}>
            Create New Invoice
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderMpesaForm = () => (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-lg font-medium'>
          Deposit via M-Pesa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleMpesaPayment} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='phone'>M-Pesa Phone Number</Label>
            <Input
              id='phone'
              type='text'
              placeholder='254712345678'
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
            <p className='text-xs text-muted-foreground'>
              Enter the phone number registered with M-Pesa (format:
              254XXXXXXXXX)
            </p>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='amount'>Amount (KES)</Label>
            <Input
              id='amount'
              type='number'
              min='10'
              step='1'
              placeholder='100'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <p className='text-xs text-muted-foreground'>
              Minimum amount: 10 KES
            </p>
          </div>
          <Button type='submit' className='w-full' disabled={loading}>
            {loading ? (
              <>
                <span className='loading mr-2'></span>
                Processing...
              </>
            ) : (
              <>
                <Wallet className='mr-2 h-4 w-4' />
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
            Once you've completed the payment on your phone, click the button
            below to check the status.
          </p>
          <Button
            onClick={checkMpesaStatus}
            disabled={checkingStatus}
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
          <Button variant='outline' onClick={resetPayment} className='w-full'>
            Cancel and Start Over
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderMpesaCompleted = () => (
    <Card>
      <CardContent className='pt-6 pb-6'>
        <div className='flex flex-col items-center justify-center space-y-4'>
          <CheckCircle className='h-16 w-16 text-green-500' />
          <h3 className='text-xl font-semibold'>Payment Successful!</h3>
          <p className='text-center text-muted-foreground'>
            Your deposit has been processed successfully.
          </p>
          <Button onClick={resetPayment} className='mt-4'>
            Make Another Deposit
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className='space-y-4 animate-fade-in'>
      <div className='flex items-center'>
        <Button variant='ghost' size='icon' onClick={onBack}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <h2 className='text-xl font-semibold ml-2'>
          {type === 'lightning' ? 'Lightning Deposit' : 'M-Pesa Deposit'}
          {childId && isParent ? ' (Child Account)' : ''}
        </h2>
      </div>
      {type === 'lightning'
        ? !invoice
          ? renderLightningForm()
          : renderLightningInvoice()
        : paymentStatus === 'completed'
        ? renderMpesaCompleted()
        : transactionId
        ? renderMpesaInProgress()
        : renderMpesaForm()}
    </div>
  );
};

export default PaymentHandler;
