import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowDownUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  description?: string;
}

interface TransactionHistoryProps {
  onBack: () => void;
}

const TransactionHistory = ({ onBack }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const { api } = useAuth();

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!api) return;
      
      try {
        const data = await api.getTransactions();
        setTransactions(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error fetching transactions",
          description: error instanceof Error ? error.message : "Could not load your transaction history",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [api, toast]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'transfer':
        return <ArrowDownUp className="h-4 w-4 text-blue-500" />;
      default:
        return <ArrowDownUp className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold ml-2">Transaction History</h2>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center">
                    <div className="bg-muted p-2 rounded-full mr-3">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="font-medium">
                        {transaction.type === 'deposit' ? 'Deposit' : 
                         transaction.type === 'withdrawal' ? 'Withdrawal' : 'Transfer'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(transaction.timestamp)}
                      </div>
                      {transaction.description && (
                        <div className="text-xs text-muted-foreground">
                          {transaction.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${
                      transaction.type === 'deposit' ? 'text-green-500' : 
                      transaction.type === 'withdrawal' ? 'text-red-500' : ''
                    }`}>
                      {transaction.type === 'deposit' ? '+' : 
                       transaction.type === 'withdrawal' ? '-' : ''}
                      {transaction.amount.toLocaleString()} sats
                    </div>
                    <div className={`text-xs ${
                      transaction.status === 'completed' ? 'text-green-500' : 
                      transaction.status === 'pending' ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
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