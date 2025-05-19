import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/UserAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PiggyBank } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  timestamp: string;
  balance: number;
}

interface SavingsHistoryProps {
  childId?: string;
  onBack?: () => void;
}

const SavingsHistory: React.FC<SavingsHistoryProps> = ({ childId, onBack }) => {
  const { toast } = useToast();
  const { api, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>(
    'month'
  );

  const isParent = user?.role === 'parent';
  const effectiveChildId =
    childId || (user?.role === 'child' ? user?.id : undefined);

  console.log('SavingsHistory component', {
    childId,
    effectiveChildId,
    isParent,
  });

  // Fetch savings history
  useEffect(() => {
    const fetchSavingsHistory = async () => {
      if (!effectiveChildId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log('Fetching savings history for child:', effectiveChildId);

        let transactionsData;

        if (isParent && childId) {
          // If parent is viewing a child's savings history
          transactionsData = await api?.getChildSavingsHistory(childId);
        } else {
          // For child viewing their own savings history
          transactionsData = await api?.getSavingsHistory();
        }

        console.log('Savings history data:', transactionsData);

        if (Array.isArray(transactionsData)) {
          setTransactions(transactionsData);
        } else {
          // If API fails or returns invalid data, use mock data
          setTransactions(getMockTransactions());
          toast({
            variant: 'warning',
            title: 'Using demo data',
            description: 'Could not connect to savings history API',
          });
        }
      } catch (error) {
        console.error('Failed to fetch savings history:', error);
        setTransactions(getMockTransactions());
        toast({
          variant: 'warning',
          title: 'Using demo data',
          description: 'Could not connect to savings history API',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavingsHistory();
  }, [api, childId, effectiveChildId, isParent, toast]);

  const getMockTransactions = (): Transaction[] => {
    const now = new Date();
    const transactions: Transaction[] = [];

    // Generate transactions for the past 30 days
    let balance = 500;
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      if (i % 7 === 0) {
        // Weekly savings
        balance += 100;
        transactions.push({
          id: `mock-${i}-1`,
          amount: 100,
          type: 'deposit',
          description: 'Weekly Savings',
          timestamp: date.toISOString(),
          balance,
        });
      }

      if (i % 30 === 0) {
        // Monthly bonus
        balance += 500;
        transactions.push({
          id: `mock-${i}-2`,
          amount: 500,
          type: 'deposit',
          description: 'Monthly Savings Boost',
          timestamp: date.toISOString(),
          balance,
        });
      }
    }

    return transactions;
  };

  // Filter transactions based on selected timeframe
  const filteredTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.timestamp);
    const now = new Date();

    if (timeframe === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return transactionDate >= weekAgo;
    } else if (timeframe === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return transactionDate >= monthAgo;
    } else if (timeframe === 'year') {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return transactionDate >= yearAgo;
    }

    return true;
  });

  if (!effectiveChildId) {
    return (
      <Card>
        <CardContent className='py-8 text-center'>
          <p className='text-muted-foreground'>
            Please select a child to view savings history.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold'>Savings History</h2>
        {onBack && (
          <Button variant='outline' onClick={onBack}>
            Back
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <CardTitle>Transactions</CardTitle>
            <div className='flex space-x-2'>
              <Button
                variant={timeframe === 'week' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setTimeframe('week')}
              >
                Week
              </Button>
              <Button
                variant={timeframe === 'month' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setTimeframe('month')}
              >
                Month
              </Button>
              <Button
                variant={timeframe === 'year' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setTimeframe('year')}
              >
                Year
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex justify-center p-8'>
              <Loader2 className='h-8 w-8 animate-spin' />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className='text-center p-8'>
              <PiggyBank className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
              <p className='text-muted-foreground'>
                No savings transactions found for this period.
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className='flex justify-between items-center border-b pb-3'
                >
                  <div>
                    <p className='font-medium'>{transaction.description}</p>
                    <p className='text-sm text-muted-foreground'>
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p
                      className={`font-medium ${
                        transaction.type === 'deposit'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'deposit' ? '+' : '-'}
                      {transaction.amount} sats
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Balance: {transaction.balance} sats
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SavingsHistory;
