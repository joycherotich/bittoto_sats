import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, PiggyBank } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaymentHandler from './PaymentHandler';
import { useAuth } from '@/contexts/UserAuthContext';

interface WithdrawDepositProps {
  onBack: () => void;
  childId?: string;
}

const WithdrawDeposit: React.FC<WithdrawDepositProps> = ({ onBack, childId }) => {
  const [activeTab, setActiveTab] = useState<'mpesa' | 'lightning'>('mpesa');
  const [showPaymentHandler, setShowPaymentHandler] = useState(false);
  const { user } = useAuth();
  
  const isParent = user?.role === 'parent';

  const handleShowPaymentHandler = (type: 'mpesa' | 'lightning') => {
    setActiveTab(type);
    setShowPaymentHandler(true);
  };

  if (showPaymentHandler) {
    return (
      <PaymentHandler 
        onBack={() => setShowPaymentHandler(false)} 
        type={activeTab} 
        childId={childId}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Add Funds
          {childId && isParent ? ' (Child Account)' : ''}
        </h2>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <Tabs defaultValue="mpesa" onValueChange={(value) => setActiveTab(value as 'mpesa' | 'lightning')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mpesa" className="flex items-center">
            <PiggyBank className="mr-2 h-4 w-4" />
            M-Pesa
          </TabsTrigger>
          <TabsTrigger value="lightning" className="flex items-center">
            <Zap className="mr-2 h-4 w-4" />
            Bitcoin Lightning
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="mpesa">
          <Card>
            <CardHeader>
              <CardTitle>M-Pesa Deposit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>Enter your phone number and amount to deposit via M-Pesa.</p>
                <div className="flex justify-center">
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleShowPaymentHandler('mpesa')}
                  >
                    <PiggyBank className="mr-2 h-4 w-4" />
                    Deposit with M-Pesa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="lightning">
          <Card>
            <CardHeader>
              <CardTitle>Bitcoin Lightning Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>Make a Bitcoin Lightning payment to add funds to your account.</p>
                <div className="flex justify-center">
                  <Button 
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => handleShowPaymentHandler('lightning')}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Lightning Invoice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WithdrawDeposit;