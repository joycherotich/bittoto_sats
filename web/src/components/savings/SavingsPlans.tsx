import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/UserAuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PiggyBank } from 'lucide-react';

interface SavingsPlan {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  amount: number;
  active: boolean;
  nextExecution: string;
  goalId?: string;
}

interface Goal {
  id: string;
  name: string;
}

interface SavingsPlansProps {
  childId?: string;
}

const SavingsPlans: React.FC<SavingsPlansProps> = ({ childId }) => {
  const { toast } = useToast();
  const { api, user } = useAuth();
  const [plans, setPlans] = useState<SavingsPlan[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [planName, setPlanName] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
    'weekly'
  );
  const [amount, setAmount] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const isChild = user?.role === 'child';
  const effectiveChildId = childId || (isChild ? user?.id : undefined);

  console.log('SavingsPlans component', { childId, effectiveChildId, isChild });

  // Fetch savings plans
  const fetchPlans = async () => {
    setLoading(true);
    try {
      if (!api) return;
      console.log('Fetching savings plans for child:', effectiveChildId);

      const plansData = await api.getSavingsPlans(effectiveChildId);
      console.log('Received plans data:', plansData);
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (error) {
      console.error('Error fetching savings plans:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load savings plans',
        description: 'Please try again later',
      });
      // Set mock data for testing
      setPlans([
        {
          id: 'mock-1',
          name: 'Weekly Savings',
          frequency: 'weekly',
          amount: 100,
          active: true,
          nextExecution: new Date(Date.now() + 86400000 * 3).toISOString(),
        },
        {
          id: 'mock-2',
          name: 'Monthly Boost',
          frequency: 'monthly',
          amount: 500,
          active: true,
          nextExecution: new Date(Date.now() + 86400000 * 15).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch goals for dropdown
  const fetchGoals = async () => {
    try {
      if (!api) return;
      console.log('Fetching goals for child:', effectiveChildId);

      const goalsData = await api.getGoals(effectiveChildId);
      console.log('Received goals data:', goalsData);
      setGoals(Array.isArray(goalsData) ? goalsData : []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      // Set mock data for testing
      setGoals([
        { id: 'g1', name: 'New Bike' },
        { id: 'g2', name: 'Gaming Console' },
      ]);
    }
  };

  useEffect(() => {
    console.log('SavingsPlans component mounted');
    if (effectiveChildId) {
      fetchPlans();
      fetchGoals();
    }
  }, [api, effectiveChildId]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (!api) return;

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid amount',
          description: 'Please enter a valid amount greater than zero',
        });
        setFormLoading(false);
        return;
      }

      console.log('Creating savings plan:', {
        name: planName,
        frequency,
        amount: amountValue,
        goalId: selectedGoal === 'none' ? undefined : selectedGoal, // Handle "none" value
        childId: effectiveChildId,
      });

      await api.createSavingsPlan({
        name: planName,
        frequency,
        amount: amountValue,
        goalId: selectedGoal === 'none' ? undefined : selectedGoal, // Handle "none" value
        childId: effectiveChildId,
      });

      toast({
        title: 'Savings plan created',
        description: 'Your savings plan has been created successfully',
      });

      // Reset form
      setPlanName('');
      setFrequency('weekly');
      setAmount('');
      setSelectedGoal('');
      setShowForm(false);

      // Refresh plans
      fetchPlans();
    } catch (error) {
      console.error('Error creating savings plan:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create savings plan',
        description: 'Please try again later',
      });

      // For testing, add a mock plan
      const newPlan = {
        id: `mock-${Date.now()}`,
        name: planName,
        frequency,
        amount: parseFloat(amount),
        active: true,
        nextExecution: new Date(Date.now() + 86400000 * 3).toISOString(),
        goalId: selectedGoal || undefined,
      };
      setPlans([...plans, newPlan]);

      // Reset form
      setPlanName('');
      setFrequency('weekly');
      setAmount('');
      setSelectedGoal('');
      setShowForm(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleTogglePlan = async (planId: string, currentStatus: boolean) => {
    try {
      if (!api) return;

      await api.toggleSavingsPlan(planId);

      // Update local state
      setPlans(
        plans.map((plan) =>
          plan.id === planId ? { ...plan, active: !currentStatus } : plan
        )
      );

      toast({
        title: `Savings plan ${currentStatus ? 'paused' : 'activated'}`,
        description: `Your savings plan has been ${
          currentStatus ? 'paused' : 'activated'
        } successfully`,
      });
    } catch (error) {
      console.error('Error toggling savings plan:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update savings plan',
        description: 'Please try again later',
      });
    }
  };

  // Helper function to format frequency for display
  const formatFrequency = (freq: string) => {
    switch (freq) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return freq;
    }
  };

  // Helper function to format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (!effectiveChildId) {
    return (
      <Card>
        <CardContent className='py-8 text-center'>
          <p className='text-muted-foreground'>
            Please select a child to view savings plans.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Create plan form */}
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Create Savings Plan</CardTitle>
            <CardDescription>
              Set up automatic savings for {isChild ? 'yourself' : 'this child'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePlan} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='plan-name'>Plan Name</Label>
                <Input
                  id='plan-name'
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder='Weekly Savings'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='frequency'>Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                    setFrequency(value)
                  }
                >
                  <SelectTrigger id='frequency'>
                    <SelectValue placeholder='Select frequency' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='daily'>Daily</SelectItem>
                    <SelectItem value='weekly'>Weekly</SelectItem>
                    <SelectItem value='monthly'>Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='amount'>Amount (sats)</Label>
                <Input
                  id='amount'
                  type='number'
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder='100'
                  required
                />
              </div>

              {goals.length > 0 && (
                <div className='space-y-2'>
                  <Label htmlFor='goal'>Link to Goal (Optional)</Label>
                  <Select
                    value={selectedGoal}
                    onValueChange={(value) => setSelectedGoal(value)}
                  >
                    <SelectTrigger id='goal'>
                      <SelectValue placeholder='Select a goal' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>No goal</SelectItem>{' '}
                      {/* Changed from empty string to "none" */}
                      {goals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form>
          </CardContent>
          <CardFooter className='flex justify-between'>
            <Button variant='outline' onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan} disabled={formLoading}>
              {formLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Create Plan
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className='flex justify-end'>
          <Button onClick={() => setShowForm(true)}>Create New Plan</Button>
        </div>
      )}

      {/* Plans list */}
      {loading ? (
        <div className='flex justify-center p-8'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className='p-8 text-center'>
            <PiggyBank className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
            <p className='text-muted-foreground'>
              No savings plans found. Create your first plan to start saving
              automatically!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2'>
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className='flex justify-between items-start'>
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      {formatFrequency(plan.frequency)} • {plan.amount} sats
                    </CardDescription>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Switch
                      checked={plan.active}
                      onCheckedChange={() =>
                        handleTogglePlan(plan.id, plan.active)
                      }
                    />
                    <span
                      className={
                        plan.active ? 'text-green-600' : 'text-gray-400'
                      }
                    >
                      {plan.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Next execution:
                    </span>
                    <span>{formatDate(plan.nextExecution)}</span>
                  </div>
                  {plan.goalId && (
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>
                        Linked goal:
                      </span>
                      <span>
                        {goals.find((g) => g.id === plan.goalId)?.name ||
                          'Unknown goal'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavingsPlans;
