import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RefreshCcw,
  Wallet,
  Zap,
  History,
  LogOut,
  PiggyBank,
  Book,
  Award,
  Star,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/UserAuthContext';

interface DashboardProps {
  onShowLightning: () => void;
  onShowMpesa: () => void;
  onShowHistory: () => void;
  onLogout: () => void;
  onShowGoals?: () => void;
  onShowAchievements?: () => void;
  onShowLearning?: () => void;
}

const Dashboard = ({
  onShowLightning,
  onShowMpesa,
  onShowHistory,
  onLogout,
  onShowGoals,
  onShowAchievements,
  onShowLearning,
}: DashboardProps) => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const { toast } = useToast();
  const { user, api } = useAuth();

  const fetchBalance = async () => {
    if (!api) return;

    setIsLoadingBalance(true);
    try {
      const result = await api.getBalance();
      setBalance(result.balance);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching balance',
        description:
          error instanceof Error
            ? error.message
            : 'Could not fetch your balance',
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (api) {
      fetchBalance();
    }
  }, [api]);

  return (
    <div className='space-y-4 animate-fade-in p-4'>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-lg font-medium'>
            Welcome, {user?.name || 'User'}!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col space-y-2'>
            <div className='flex justify-between items-center'>
              <span className='text-muted-foreground'>Current Balance</span>
              <Button
                variant='ghost'
                size='icon'
                onClick={fetchBalance}
                disabled={isLoadingBalance}
              >
                <RefreshCcw
                  className={`h-4 w-4 ${
                    isLoadingBalance ? 'animate-spin' : ''
                  }`}
                />
              </Button>
            </div>
            <div className='flex items-baseline'>
              <span className='text-3xl font-bold'>
                {balance.toLocaleString()}
              </span>
              <span className='ml-1 text-muted-foreground'>sats</span>
            </div>
            <Progress
              value={Math.min((balance / 10000) * 100, 100)}
              className='h-2'
            />
            <span className='text-xs text-muted-foreground text-right'>
              {(balance / 100000000).toFixed(8)} BTC
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard buttons with improved layout */}
      <div className='grid grid-cols-2 gap-3'>
        <Button
          variant='outline'
          className='h-24 flex flex-col items-center justify-center bg-amber-50 hover:bg-amber-100 border-amber-200'
          onClick={onShowLightning}
        >
          <Zap className='h-8 w-8 mb-2 text-amber-500' />
          <span className='text-sm font-medium'>Lightning</span>
        </Button>

        <Button
          variant='outline'
          className='h-24 flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 border-green-200'
          onClick={onShowMpesa}
        >
          <Wallet className='h-8 w-8 mb-2 text-green-500' />
          <span className='text-sm font-medium'>M-Pesa</span>
        </Button>

        <Button
          variant='outline'
          className='h-24 flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 border-blue-200'
          onClick={onShowHistory}
        >
          <History className='h-8 w-8 mb-2 text-blue-500' />
          <span className='text-sm font-medium'>History</span>
        </Button>

        {onShowGoals && (
          <Button
            variant='outline'
            className='h-24 flex flex-col items-center justify-center bg-purple-50 hover:bg-purple-100 border-purple-200'
            onClick={onShowGoals}
          >
            <PiggyBank className='h-8 w-8 mb-2 text-purple-500' />
            <span className='text-sm font-medium'>Goals</span>
          </Button>
        )}

        {onShowLearning && (
          <Button
            variant='outline'
            className='h-24 flex flex-col items-center justify-center bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
            onClick={onShowLearning}
          >
            <Book className='h-8 w-8 mb-2 text-indigo-500' />
            <span className='text-sm font-medium'>Learn</span>
          </Button>
        )}

        {onShowAchievements && (
          <Button
            variant='outline'
            className='h-24 flex flex-col items-center justify-center bg-yellow-50 hover:bg-yellow-100 border-yellow-200'
            onClick={onShowAchievements}
          >
            <Award className='h-8 w-8 mb-2 text-yellow-500' />
            <span className='text-sm font-medium'>Achievements</span>
          </Button>
        )}

        <Button
          variant='outline'
          className='h-24 flex flex-col items-center justify-center bg-red-50 hover:bg-red-100 border-red-200'
          onClick={onLogout}
        >
          <LogOut className='h-8 w-8 mb-2 text-red-500' />
          <span className='text-sm font-medium'>Logout</span>
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
