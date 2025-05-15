import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Zap } from 'lucide-react';

const PaymentSelector: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();

  const handleSelectPayment = (type: 'mpesa' | 'lightning') => {
    console.log(`Selected ${type} payment for child:`, childId);
    if (!childId) {
      console.error('childId is undefined');
      return;
    }
    navigate(`/payment/${type}/${childId}`);
  };

  return (
    <div className='flex justify-center items-center min-h-screen bg-gray-100 p-4'>
      <Card className='w-full max-w-md shadow-sm border-gray-200'>
        <CardHeader>
          <CardTitle className='text-xl font-semibold text-gray-800'>
            Select Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-gray-600 text-sm'>
            Choose how to add funds for the child.
          </p>
          <Button
            variant='outline'
            size='lg'
            className='w-full text-green-600 border-green-600 hover:text-green-700 hover:bg-green-50'
            onClick={() => handleSelectPayment('mpesa')}
          >
            M-Pesa
            <Wallet className='ml-2 h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='lg'
            className='w-full text-yellow-600 border-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
            onClick={() => handleSelectPayment('lightning')}
          >
            Bitcoin (Lightning)
            <Zap className='ml-2 h-4 w-4' />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSelector;
