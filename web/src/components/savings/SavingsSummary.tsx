import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/UserAuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SavingsSummary {
  totalSaved: number;
  activePlans: number;
  plans: {
    id: string;
    name: string;
    frequency: string;
    amount: number;
    nextExecution: string;
  }[];
}

const SavingsSummary: React.FC = () => {
  const { api, user } = useAuth();
  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('SavingsSummary component mounted');

    const fetchSummary = async () => {
      setLoading(true);
      console.log('Attempting to fetch savings summary');

      try {
        if (!api) return;

        const summaryData = await api.getChildSavingsSummary();
        console.log('Received savings summary data:', summaryData);
        setSummary(summaryData);
      } catch (error) {
        console.error('Error fetching savings summary:', error);
        toast({
          variant: 'warning',
          title: 'Could not load savings summary',
          description: 'Using demo data instead',
        });

        // Use mock data if API fails
        setSummary({
          totalSaved: 1250,
          activePlans: 2,
          plans: [
            {
              id: 'mock-1',
              name: 'Weekly Savings',
              frequency: 'weekly',
              amount: 100,
              nextExecution: new Date(Date.now() + 86400000 * 3).toISOString(),
            },
            {
              id: 'mock-2',
              name: 'Monthly Boost',
              frequency: 'monthly',
              amount: 500,
              nextExecution: new Date(Date.now() + 86400000 * 15).toISOString(),
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [api]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not scheduled';

    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center p-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Your Savings</CardTitle>
          <CardDescription>
            {summary.activePlans === 0
              ? "You don't have any active savings plans yet"
              : `You have ${summary.activePlans} active savings plan${
                  summary.activePlans !== 1 ? 's' : ''
                }`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div>
              <div className='flex justify-between mb-2'>
                <span className='text-sm font-medium'>Total Saved</span>
                <span className='text-sm font-medium'>
                  {summary.totalSaved} sats
                </span>
              </div>
              <Progress
                value={Math.min((summary.totalSaved / 10000) * 100, 100)}
                className='h-2'
              />
              <p className='text-xs text-muted-foreground mt-1'>
                {summary.totalSaved >= 10000
                  ? 'Amazing job saving!'
                  : `${(
                      10000 - summary.totalSaved
                    ).toLocaleString()} sats until your next milestone`}
              </p>
            </div>

            {summary.plans.length > 0 && (
              <div className='space-y-4 mt-6'>
                <h3 className='text-sm font-medium'>Upcoming Savings</h3>
                {summary.plans.map((plan) => (
                  <div
                    key={plan.id}
                    className='flex justify-between items-center border-b pb-2'
                  >
                    <div>
                      <p className='font-medium'>{plan.name}</p>
                      <p className='text-sm text-muted-foreground'>
                        Next: {formatDate(plan.nextExecution)}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='font-medium'>{plan.amount} sats</p>
                      <p className='text-xs text-muted-foreground capitalize'>
                        {plan.frequency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavingsSummary;
