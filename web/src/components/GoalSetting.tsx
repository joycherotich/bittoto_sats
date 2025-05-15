import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PiggyBank, Check, Clock, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
      const formattedGoals = Array.isArray(data) ? data.map(goal => ({
        id: goal.id || '',
        name: goal.name || '',
        targetAmount: goal.targetAmount || goal.target || 0,
        currentAmount: goal.currentAmount || goal.current || 0,
        status: goal.status || (goal.approved ? 'approved' : 'pending'),
        createdAt: goal.createdAt || new Date().toISOString()
      })) : [];
      
      console.log('Formatted goals:', formattedGoals);
      setGoals(formattedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        variant: "destructive",
        title: "Error fetching goals",
        description: error instanceof Error ? error.message : "Could not load your savings goals",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!api) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You are not authenticated",
      });
      return;
    }
    
    if (!goalName || !targetAmount) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields",
      });
      return;
    }
    
    const amountValue = parseInt(targetAmount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid target amount",
      });
      return;
    }
    
    setCreating(true);
    
    try {
      console.log('Creating goal:', { name: goalName, targetAmount: amountValue });
      const result = await api.createGoal({
        name: goalName,
        targetAmount: amountValue
      });
      
      console.log('Goal creation result:', result);
      
      toast({
        title: "Goal created",
        description: "Your savings goal has been created successfully",
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
        variant: "destructive",
        title: "Error creating goal",
        description: error instanceof Error ? error.message : "Could not create savings goal",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleApproveGoal = async (goalId: string) => {
    if (!api) return;
    
    try {
      await api.approveGoal(goalId);
      
      toast({
        title: "Goal approved",
        description: "The savings goal has been approved",
      });
      
      // Refresh goals
      fetchGoals();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error approving goal",
        description: error instanceof Error ? error.message : "Could not approve the goal",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'completed':
        return <Target className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold ml-2">Savings Goals</h2>
        </div>
        {!showForm && (
          <Button 
            size="sm" 
            onClick={() => setShowForm(true)}
          >
            New Goal
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Create New Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="goalName" className="text-sm font-medium">
                  Goal Name
                </label>
                <Input
                  id="goalName"
                  type="text"
                  placeholder="New Bicycle"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="targetAmount" className="text-sm font-medium">
                  Target Amount (sats)
                </label>
                <Input
                  id="targetAmount"
                  type="number"
                  min="1000"
                  step="1000"
                  placeholder="100000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <span className="loading mr-2"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <PiggyBank className="mr-2 h-4 w-4" />
                      Create Goal
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
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
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <PiggyBank className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No savings goals yet</p>
            {!showForm && (
              <Button 
                className="mt-4" 
                onClick={() => setShowForm(true)}
              >
                Create Your First Goal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{goal.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Created on {formatDate(goal.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs">
                    {getStatusIcon(goal.status)}
                    <span>
                      {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>
                      {goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()} sats
                    </span>
                  </div>
                  <Progress 
                    value={(goal.currentAmount / goal.targetAmount) * 100} 
                    className="h-2" 
                  />
                </div>
                
                {user?.role === 'parent' && goal.status === 'pending' && (
                  <Button 
                    className="w-full mt-4" 
                    size="sm"
                    onClick={() => handleApproveGoal(goal.id)}
                  >
                    <Check className="mr-2 h-4 w-4" />
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