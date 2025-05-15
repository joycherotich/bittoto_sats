import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import { ArrowLeft, ArrowUp, ArrowDown, Calendar, Filter } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface Transaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'reward' | 'transfer';
  description: string;
  timestamp: string;
  balance: number;
  source?: string;
}

interface SavingsHistoryProps {
  childId?: string;
  onBack: () => void;
}

const SavingsHistory: React.FC<SavingsHistoryProps> = ({ childId, onBack }) => {
  const { toast } = useToast();
  const { api, isParent, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [transactionType, setTransactionType] = useState<'all' | 'deposit' | 'withdrawal' | 'reward'>('all');

  // Fetch savings history
  useEffect(() => {
    const fetchSavingsHistory = async () => {
      setIsLoading(true);
      try {
        let transactionsData;
        
        if (isParent && childId) {
          // If parent is viewing a child's savings history
          transactionsData = await api?.getChildSavingsHistory(childId);
        } else {
          // For child viewing their own savings history
          transactionsData = await api?.getSavingsHistory();
        }
        
        console.log("Savings history data:", transactionsData);
        
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
  }, [api, childId, isParent, toast]);

  const getMockTransactions = (): Transaction[] => {
    const now = new Date();
    const transactions: Transaction[] = [];
    
    // Generate transactions for the past 30 days
    let balance = 500;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      // Every 5 days, add a deposit
      if (i % 5 === 0) {
        const amount = Math.floor(Math.random() * 100) + 50;
        balance += amount;
        transactions.push({
          id: `dep-${i}`,
          amount,
          type: 'deposit',
          description: 'Weekly allowance',
          timestamp: date.toISOString(),
          balance,
          source: 'Parent'
        });
      }
      
      // Every 7 days, add a reward
      if (i % 7 === 0) {
        const amount = Math.floor(Math.random() * 20) + 10;
        balance += amount;
        transactions.push({
          id: `rew-${i}`,
          amount,
          type: 'reward',
          description: 'Completed lesson',
          timestamp: date.toISOString(),
          balance,
          source: 'Learning'
        });
      }
      
      // Every 10 days, add a withdrawal
      if (i % 10 === 0 && i > 0) {
        const amount = Math.floor(Math.random() * 30) + 20;
        balance -= amount;
        transactions.push({
          id: `wit-${i}`,
          amount: -amount,
          type: 'withdrawal',
          description: 'Savings goal contribution',
          timestamp: date.toISOString(),
          balance,
          source: 'Goal'
        });
      }
    }
    
    return transactions.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  // Filter transactions based on selected timeframe and type
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.timestamp);
    const now = new Date();
    
    // Filter by timeframe
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      if (transactionDate < weekAgo) return false;
    } else if (timeframe === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      if (transactionDate < monthAgo) return false;
    } else if (timeframe === 'year') {
      const yearAgo = new Date();
      yearAgo.setFullYear(now.getFullYear() - 1);
      if (transactionDate < yearAgo) return false;
    }
    
    // Filter by transaction type
    if (transactionType !== 'all') {
      return transaction.type === transactionType;
    }
    
    return true;
  });

  // Prepare chart data
  const prepareChartData = () => {
    const chartData: any[] = [];
    const dateMap = new Map<string, number>();
    
    // Group transactions by date
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.timestamp);
      const dateStr = date.toLocaleDateString();
      
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, transaction.balance);
      }
    });
    
    // Convert map to array for chart
    dateMap.forEach((balance, date) => {
      chartData.push({
        date,
        balance
      });
    });
    
    // Sort by date
    return chartData.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  // Calculate statistics
  const totalDeposits = filteredTransactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
  const totalRewards = filteredTransactions
    .filter(t => t.type === 'reward')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
  const totalWithdrawals = filteredTransactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const chartData = prepareChartData();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {isParent && childId ? "Child's Savings History" : "My Savings History"}
        </h2>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center mr-4">
          <Calendar className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Timeframe:</span>
        </div>
        <Button
          variant={timeframe === 'week' ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeframe('week')}
        >
          Week
        </Button>
        <Button
          variant={timeframe === 'month' ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeframe('month')}
        >
          Month
        </Button>
        <Button
          variant={timeframe === 'year' ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeframe('year')}
        >
          Year
        </Button>

        <div className="flex items-center ml-4 mr-4">
          <Filter className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Type:</span>
        </div>
        <Button
          variant={transactionType === 'all' ? "default" : "outline"}
          size="sm"
          onClick={() => setTransactionType('all')}
        >
          All
        </Button>
        <Button
          variant={transactionType === 'deposit' ? "default" : "outline"}
          size="sm"
          onClick={() => setTransactionType('deposit')}
        >
          Deposits
        </Button>
        <Button
          variant={transactionType === 'withdrawal' ? "default" : "outline"}
          size="sm"
          onClick={() => setTransactionType('withdrawal')}
        >
          Withdrawals
        </Button>
        <Button
          variant={transactionType === 'reward' ? "default" : "outline"}
          size="sm"
          onClick={() => setTransactionType('reward')}
        >
          Rewards
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Deposits</p>
                <p className="text-2xl font-bold">{totalDeposits} sats</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <ArrowDown className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rewards</p>
                <p className="text-2xl font-bold">{totalRewards} sats</p>
              </div>
              <div className="bg-amber-100 p-2 rounded-full">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Withdrawals</p>
                <p className="text-2xl font-bold">{totalWithdrawals} sats</p>
              </div>
              <div className="bg-red-100 p-2 rounded-full">
                <ArrowUp className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Balance Over Time</CardTitle>
          <CardDescription>
            {timeframe === 'week' ? 'Last 7 days' : timeframe === 'month' ? 'Last 30 days' : 'Last 12 months'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 border-b last:border-b-0"
                >
                  <div className="flex items-center">
                    <div className={`rounded-full p-2 mr-3 ${
                      transaction.type === 'deposit' ? 'bg-green-100' : 
                      transaction.type === 'withdrawal' ? 'bg-red-100' : 
                      'bg-amber-100'
                    }`}>
                      {transaction.type === 'deposit' && <ArrowDown className="h-4 w-4 text-green-600" />}
                      {transaction.type === 'withdrawal' && <ArrowUp className="h-4 w-4 text-red-600" />}
                      {transaction.type === 'reward' && <Award className="h-4 w-4 text-amber-600" />}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>{new Date(transaction.timestamp).toLocaleDateString()}</span>
                        {transaction.source && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{transaction.source}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount} sats
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