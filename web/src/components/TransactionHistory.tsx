import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowDownUp,
  ArrowUpRight,
  ArrowDownRight,
  History,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'quiz_reward';
  amount: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  description?: string;
}

interface TransactionHistoryProps {
  onBack: () => void;
  childId?: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  onBack,
  childId,
}) => {
  const { api, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isParent = user?.role === 'parent';
  const isChild = user?.role === 'child';
  const effectiveChildId = childId || (isChild ? user?.id : undefined);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!api) {
          throw new Error('API not available');
        }

        console.log('Fetching transactions for:', {
          userId: user?.id,
          childId: effectiveChildId,
          isParent,
          isChild,
        });

        let result;

        if (isParent && effectiveChildId) {
          // Parent viewing child's transactions
          result = await api.getTransactions({ childId: effectiveChildId });
        } else {
          // User viewing their own transactions
          result = await api.getTransactions();
        }

        console.log('Transaction result:', result);

        if (Array.isArray(result)) {
          setTransactions(result);
        } else {
          setTransactions([]);
          console.warn('Unexpected transactions response format:', result);
        }
      } catch (err: any) {
        console.error('Error fetching transactions:', err);
        setError(err.message || 'Failed to load transactions');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [api, user, effectiveChildId, isParent, isChild]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'quiz_reward':
        return <ArrowDownRight className='h-4 w-4 text-green-500' />;
      case 'withdrawal':
        return <ArrowUpRight className='h-4 w-4 text-red-500' />;
      case 'transfer':
        return <ArrowDownUp className='h-4 w-4 text-blue-500' />;
      default:
        return <ArrowDownUp className='h-4 w-4' />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <div className='space-y-4 animate-fade-in'>
      <div className='flex items-center'>
        <Button variant='ghost' size='icon' onClick={onBack}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <h2 className='text-xl font-semibold ml-2'>
          Transaction History{' '}
          {childId && user?.role === 'parent' ? '(Child Account)' : ''}
        </h2>
      </div>

      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-lg font-medium'>
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex justify-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
            </div>
          ) : error ? (
            <div className='text-center py-8 text-red-500'>{error}</div>
          ) : transactions.length === 0 ? (
            <div className='text-center py-8'>
              <div className='mb-4'>
                <History className='h-12 w-12 mx-auto text-gray-400' />
              </div>
              <h3 className='text-lg font-medium'>No transactions yet</h3>
              <p className='text-sm text-muted-foreground mt-1'>
                {isParent && effectiveChildId
                  ? "This child hasn't made any transactions yet."
                  : "You haven't made any transactions yet."}
              </p>
              {isParent && effectiveChildId && (
                <Button
                  variant='outline'
                  className='mt-4'
                  onClick={() => {
                    // Navigate to deposit page for this child
                    // Implementation depends on your routing setup
                  }}
                >
                  Add funds to child's account
                </Button>
              )}
            </div>
          ) : (
            <div className='space-y-4'>
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className='flex items-center justify-between border-b pb-3'
                >
                  <div className='flex items-center'>
                    <div className='bg-muted p-2 rounded-full mr-3'>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <div className='font-medium'>
                        {transaction.type === 'deposit'
                          ? 'Deposit'
                          : transaction.type === 'withdrawal'
                          ? 'Withdrawal'
                          : transaction.type === 'transfer'
                          ? 'Transfer'
                          : 'Quiz Reward'}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {formatDate(transaction.timestamp)}
                      </div>
                      {transaction.description && (
                        <div className='text-xs text-muted-foreground'>
                          {transaction.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className='text-right'>
                    <div
                      className={`font-medium ${
                        transaction.type === 'deposit' ||
                        transaction.type === 'quiz_reward'
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {transaction.type === 'deposit' ||
                      transaction.type === 'quiz_reward'
                        ? '+'
                        : '-'}
                      {transaction.amount.toLocaleString()} sats
                    </div>
                    <div
                      className={`text-xs ${
                        transaction.status === 'completed'
                          ? 'text-green-500'
                          : transaction.status === 'pending'
                          ? 'text-amber-500'
                          : 'text-red-500'
                      }`}
                    >
                      {transaction.status.charAt(0).toUpperCase() +
                        transaction.status.slice(1)}
                    </div>
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

export default TransactionHistory;
