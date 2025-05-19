import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBalance } from '@/contexts/BalanceContext';

interface MpesaPaymentProps {
  childId: string;
  onClose: () => void;
}

const MpesaPayment: React.FC<MpesaPaymentProps> = ({ childId, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    'pending' | 'completed' | 'failed' | null
  >(null);
  const { toast } = useToast();
  const { api, token } = useAuth();
  const { refreshBalance, emitBalanceRefresh } = useBalance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!api || !token) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You are not authenticated. Please log in again.',
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

    // Format phone number (remove + and ensure it starts with 254)
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
        token,
      });

      const response = await api.createMpesaDeposit({
        phoneNumber: formattedPhone,
        amount: amountValue,
      });

      console.log('M-Pesa API response:', response);

      if (!response.success || !response.checkoutRequestId) {
        throw new Error('STK Push not initiated: Invalid response');
      }

      setTransactionId(response.checkoutRequestId);

      toast({
        title: 'M-Pesa Request Sent',
        description: `STK Push initiated (Transaction ID: ${response.checkoutRequestId}). Please check your phone to complete the payment.`,
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
            : 'Could not process M-Pesa payment. Please try again.',
      });
      setTransactionId(null);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!transactionId) return;
    setCheckingStatus(true);

    try {
      const response = await api.checkMpesaStatus(transactionId);

      if (response.completed || response.status === 'completed') {
        setPaymentStatus('completed');

        // Refresh balance after successful payment
        try {
          await refreshBalance();
          emitBalanceRefresh();
          console.log('Balance refreshed after M-Pesa payment');
        } catch (balanceError) {
          console.error('Error refreshing balance:', balanceError);
        }

        toast({
          title: 'Payment Successful',
          description: `${amount} KES have been added to your balance`,
        });

        // Reset form
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
    setPhoneNumber('');
    setAmount('');
    setTransactionId(null);
    setPaymentStatus(null);
  };

  return (
    <div className='space-y-4 animate-fade-in'>
      <div className='flex items-center'>
        <Button variant='ghost' size='icon' onClick={onClose}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <h2 className='text-xl font-semibold ml-2'>M-Pesa Deposit</h2>
      </div>

      {paymentStatus === 'completed' ? (
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
      ) : transactionId ? (
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg font-medium'>
              Payment in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Alert>
              <AlertCircle className='h-4 w-4 mr-2' />
              <AlertDescription>
                An M-Pesa payment request has been sent to your phone. Please
                check your phone and complete the payment.
              </AlertDescription>
            </Alert>

            <div className='flex flex-col space-y-4 items-center'>
              <p className='text-sm text-muted-foreground text-center'>
                Once you've completed the payment on your phone, click the
                button below to check the status.
              </p>

              <Button
                onClick={checkStatus}
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

              <Button
                variant='outline'
                onClick={resetPayment}
                className='w-full'
              >
                Cancel and Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg font-medium'>
              Deposit via M-Pesa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <label htmlFor='phone' className='text-sm font-medium'>
                  M-Pesa Phone Number
                </label>
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
                <label htmlFor='amount' className='text-sm font-medium'>
                  Amount (KES)
                </label>
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
      )}
    </div>
  );
};

export default MpesaPayment;
