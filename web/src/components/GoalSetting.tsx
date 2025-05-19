import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PiggyBank, Check, Clock, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  status: 'pending' | 'approved' | 'completed';
  createdAt: string;
}

interface GoalSettingProps {
  onBack: () => void;
}

const GoalSetting = ({ onBack }: GoalSettingProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const { toast } = useToast();
  const { user, api } = useAuth();

  useEffect(() => {
    fetchGoals();
  }, [api]);

  const fetchGoals = async () => {
    if (!api) return;

    setLoading(true);
    try {
      console.log('Fetching goals in GoalSetting component');
      const data = await api.getGoals();
      console.log('Goals data received in component:', data);

      // Transform data if needed to match the expected format
      const formattedGoals = Array.isArray(data)
        ? data.map((goal) => ({
            id: goal.id || '',
            name: goal.name || '',
            targetAmount: goal.targetAmount || goal.target || 0,
            currentAmount: goal.currentAmount || goal.current || 0,
            status: goal.status || (goal.approved ? 'approved' : 'pending'),
            createdAt: goal.createdAt || new Date().toISOString(),
          }))
        : [];

      console.log('Formatted goals:', formattedGoals);
      setGoals(formattedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        variant: 'destructive',
        title: 'Error fetching goals',
        description:
          error instanceof Error
            ? error.message
            : 'Could not load your savings goals',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!api) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You are not authenticated',
      });
      return;
    }

    if (!goalName || !targetAmount) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all fields',
      });
      return;
    }

    const amountValue = parseInt(targetAmount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid target amount',
      });
      return;
    }

    setCreating(true);

    try {
      console.log('Creating goal:', {
        name: goalName,
        targetAmount: amountValue,
      });
      const result = await api.createGoal({
        name: goalName,
        targetAmount: amountValue,
      });

      console.log('Goal creation result:', result);

      toast({
        title: 'Goal created',
        description: 'Your savings goal has been created successfully',
      });

      // Reset form and fetch updated goals
      setGoalName('');
      setTargetAmount('');
      setShowForm(false);

      // Add a small delay before fetching goals to ensure the backend has processed the creation
      setTimeout(() => {
        fetchGoals();
      }, 500);
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        variant: 'destructive',
        title: 'Error creating goal',
        description:
          error instanceof Error
            ? error.message
            : 'Could not create savings goal',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleApproveGoal = async (goalId: string) => {
    if (!api) return;

    setLoading(true);
    try {
      console.log('Approving goal:', goalId);

      // Make sure we have a valid goal ID
      if (!goalId) {
        throw new Error('Invalid goal ID');
      }

      // Call the API to approve the goal
      const result = await api.approveGoal(goalId);
      console.log('Goal approval result:', result);

      toast({
        title: 'Goal approved',
        description: 'The savings goal has been approved',
      });

      // Update the goal status in the local state immediately
      setGoals(
        goals.map((goal) =>
          goal.id === goalId
            ? { ...goal, status: 'approved', approved: true }
            : goal
        )
      );

      // Refresh goals to ensure we have the latest data
      setTimeout(() => {
        fetchGoals();
      }, 500);
    } catch (error) {
      console.error('Error approving goal:', error);

      // Provide more specific error messages based on the error
      let errorMessage = 'Could not approve the goal';

      if (error instanceof Error) {
        // Check for specific error conditions
        if (error.message.includes('403')) {
          errorMessage = 'You do not have permission to approve this goal';
        } else if (error.message.includes('404')) {
          errorMessage = 'Goal not found';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid request. The goal may already be approved';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        variant: 'destructive',
        title: 'Error approving goal',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!api) return;

    // Show confirmation dialog
    if (
      !window.confirm(
        'Are you sure you want to delete this goal? This action cannot be undone.'
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      console.log('Deleting goal:', goalId);
      await api.deleteGoal(goalId);

      toast({
        title: 'Goal deleted',
        description: 'The savings goal has been deleted',
      });

      // Remove the goal from the local state immediately
      setGoals(goals.filter((goal) => goal.id !== goalId));

      // Refresh goals to ensure we have the latest data
      setTimeout(() => {
        fetchGoals();
      }, 500);
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        variant: 'destructive',
        title: 'Error deleting goal',
        description:
          error instanceof Error ? error.message : 'Could not delete the goal',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className='h-4 w-4 text-green-500' />;
      case 'pending':
        return <Clock className='h-4 w-4 text-amber-500' />;
      case 'completed':
        return <Target className='h-4 w-4 text-blue-500' />;
      default:
        return null;
    }
  };

  return (
    <div className='space-y-4 animate-fade-in'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <Button variant='ghost' size='icon' onClick={onBack}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <h2 className='text-xl font-semibold ml-2'>Savings Goals</h2>
        </div>
        {!showForm && (
          <Button size='sm' onClick={() => setShowForm(true)}>
            New Goal
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg font-medium'>
              Create New Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGoal} className='space-y-4'>
              <div className='space-y-2'>
                <label htmlFor='goalName' className='text-sm font-medium'>
                  Goal Name
                </label>
                <Input
                  id='goalName'
                  type='text'
                  placeholder='New Bicycle'
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  required
                />
              </div>

              <div className='space-y-2'>
                <label htmlFor='targetAmount' className='text-sm font-medium'>
                  Target Amount (sats)
                </label>
                <Input
                  id='targetAmount'
                  type='number'
                  min='1000'
                  step='1000'
                  placeholder='100000'
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                />
              </div>

              <div className='flex gap-2'>
                <Button type='submit' className='flex-1' disabled={creating}>
                  {creating ? (
                    <>
                      <span className='loading mr-2'></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <PiggyBank className='mr-2 h-4 w-4' />
                      Create Goal
                    </>
                  )}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className='flex justify-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className='text-center py-8'>
            <PiggyBank className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
            <p className='text-muted-foreground'>No savings goals yet</p>
            {!showForm && (
              <Button className='mt-4' onClick={() => setShowForm(true)}>
                Create Your First Goal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-4'>
          {goals.map((goal) => (
            <Card key={goal.id} className='mb-4'>
              <CardHeader className='pb-2'>
                <div className='flex justify-between items-center'>
                  <CardTitle className='text-lg'>{goal.name}</CardTitle>
                  <div className='flex space-x-2'>
                    {user?.role === 'parent' && goal.status === 'pending' && (
                      <Button
                        size='sm'
                        onClick={() => handleApproveGoal(goal.id)}
                        className='bg-green-500 hover:bg-green-600 text-white'
                        disabled={loading}
                      >
                        Approve
                      </Button>
                    )}
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => handleDeleteGoal(goal.id)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Target: {goal.targetAmount} sats
                  {goal.description && <div>{goal.description}</div>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>
                      Progress: {goal.currentAmount} / {goal.targetAmount} sats
                    </span>
                    <span>{Math.round(goal.progress)}%</span>
                  </div>
                  <Progress value={goal.progress} className='h-2' />
                  <div className='text-sm text-muted-foreground'>
                    Status:{' '}
                    <Badge
                      variant={
                        goal.status === 'completed'
                          ? 'success'
                          : goal.status === 'approved'
                          ? 'default'
                          : 'outline'
                      }
                    >
                      {goal.status}
                    </Badge>
                  </div>
                  <Progress
                    value={(goal.currentAmount / goal.targetAmount) * 100}
                    className='h-2'
                  />
                </div>

                {user?.role === 'parent' && goal.status === 'pending' && (
                  <Button
                    className='w-full mt-4'
                    size='sm'
                    onClick={() => handleApproveGoal(goal.id)}
                  >
                    <Check className='mr-2 h-4 w-4' />
                    Approve Goal
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalSetting;
