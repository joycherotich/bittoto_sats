import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/UserAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  History,
  PiggyBank,
  Book,
  Award,
  Star,
  Settings,
  Zap,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  approved: boolean;
}

interface ChildDashboardViewProps {
  childId: string;
  childName: string;
  jarId?: string; // Make jarId optional
  balance: number;
  kesAmount: number;
  goals: Goal[];
  onShowGoals: () => void;
  onShowHistory: () => void;
  onShowMpesa: () => void;
  onShowLightning: () => void;
  onBackToFamily: () => void;
  isParent: boolean;
  handleApproveGoal: (goalId: string) => void;
  isLoadingBalance: boolean;
  onShowLearning: (childId?: string) => void;
  onShowAchievements: (childId?: string) => void;
}

const ChildDashboardView: React.FC<ChildDashboardViewProps> = ({
  childId,
  childName,
  jarId,
  balance,
  kesAmount,
  goals,
  onShowGoals,
  onShowHistory,
  onShowMpesa,
  onShowLightning,
  onBackToFamily,
  isParent,
  handleApproveGoal,
  isLoadingBalance,
  onShowLearning,
  onShowAchievements,
}) => {
  // Add state for collapsible sections
  const [showGoals, setShowGoals] = React.useState(true);
  const [showActivity, setShowActivity] = React.useState(true);

  // Add state for goals and loading
  const [localGoals, setLocalGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const { api } = useAuth(); // Make sure we get api from useAuth

  // Update local goals when props change
  useEffect(() => {
    console.log('ChildDashboardView: Received goals:', goals);
    if (Array.isArray(goals)) {
      setLocalGoals(goals);
    }
  }, [goals]);

  // Fetch goals directly if none provided
  useEffect(() => {
    const fetchGoalsDirectly = async () => {
      if (!api || !childId || (Array.isArray(goals) && goals.length > 0)) {
        return; // Skip if no API, no childId, or if goals were provided
      }

      setIsLoadingGoals(true);
      console.log(
        'ChildDashboardView: Fetching goals directly for child:',
        childId
      );

      try {
        let fetchedGoals;

        if (isParent) {
          // Parent viewing child dashboard
          fetchedGoals = await api.getGoals(childId);
        } else {
          // Child viewing own dashboard
          fetchedGoals = await api.getGoals();
        }

        console.log(
          'ChildDashboardView: Directly fetched goals:',
          fetchedGoals
        );

        if (Array.isArray(fetchedGoals)) {
          setLocalGoals(fetchedGoals);
        } else {
          console.log('ChildDashboardView: No goals found or invalid format');
          setLocalGoals([]);
        }
      } catch (error) {
        console.error(
          'ChildDashboardView: Error fetching goals directly:',
          error
        );
        setLocalGoals([]);
      } finally {
        setIsLoadingGoals(false);
      }
    };

    fetchGoalsDirectly();
  }, [api, childId, goals, isParent]);

  return (
    <>
      {/* Balance and primary goal section */}
      <div className='mt-6'>
        {/* Display Child's Jar Name */}
        <div className='flex justify-between items-center'>
          <h2 className='text-xl font-bold text-white'>{childName}'s Jar</h2>
        </div>

        <p className='text-sm font-medium text-white/70 mt-4'>
          Available Balance
        </p>
        <div className='flex items-baseline mt-1'>
          {isLoadingBalance ? (
            <div className='flex items-center gap-2'>
              <span className='loading'></span>
              <span className='text-white/90 text-lg'>Updating...</span>
            </div>
          ) : (
            <>
              <h1 className='text-3xl sm:text-4xl font-bold text-white'>
                {balance.toLocaleString()}
              </h1>
              <span className='text-lg ml-2 text-white/90'>sats</span>
            </>
          )}
        </div>
        <div className='mt-1 text-white/80 text-sm'>
          ≈ KES{' '}
          {kesAmount.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}
        </div>

        {/* Display Child ID for parents */}
        {isParent && jarId && (
          <div className='mt-2 p-2 bg-white/10 rounded-md'>
            <p className='text-sm font-medium text-white/90'>
              <span>{childName}s Jar :</span>{' '}
              <span className='font-mono'>{jarId}</span>
            </p>
          </div>
        )}

        {/* Goal progress indicator for primary goal */}
        {goals && goals.length > 0 && (
          <div className='mt-4'>
            <div className='flex justify-between text-xs text-white/80 mb-1'>
              <span>Primary Goal: {goals[0].name}</span>
              <span>
                {goals[0].current} / {goals[0].target} sats
              </span>
            </div>
            <Progress
              value={(goals[0].current / goals[0].target) * 100}
              className='h-2 bg-white/20'
            />
          </div>
        )}

        {/* Back to family dashboard button when viewing a child */}
        {isParent && (
          <Button
            variant='ghost'
            size='sm'
            className='mt-4 text-white bg-white/10 hover:bg-white/20'
            onClick={onBackToFamily}
          >
            ← Back to Family Dashboard
          </Button>
        )}
      </div>

      {/* Action buttons */}
      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 mt-4'>
        <Button
          className='bg-amber-500 hover:bg-amber-600 text-white'
          onClick={onShowGoals}
        >
          <Star className='mr-2 h-4 w-4' />
          {isParent ? 'Manage Goals' : 'Set Goals'}
        </Button>
        <Button
          className='bg-blue-500 hover:bg-blue-600 text-white'
          onClick={onShowHistory}
        >
          <History className='mr-2 h-4 w-4' />
          Transaction History
        </Button>
        <Button
          className='bg-mpesa hover:bg-mpesa/90 text-white'
          onClick={onShowMpesa}
        >
          <PiggyBank className='mr-2 h-4 w-4' />
          Add Funds (M-Pesa)
        </Button>
        <Button
          className='bg-lightning hover:bg-lightning/90 text-white'
          onClick={onShowLightning}
        >
          <Zap className='mr-2 h-4 w-4' />
          Bitcoin Payment
        </Button>
        <Button
          variant='outline'
          className='border-blue-500 text-blue-600 hover:bg-blue-50'
          onClick={() => onShowLearning(childId)}
        >
          <Book className='mr-2 h-4 w-4' />
          Learning Progress
        </Button>
        <Button
          variant='outline'
          className='border-purple-500 text-purple-600 hover:bg-purple-50'
          onClick={() => onShowAchievements(childId)}
        >
          <Award className='mr-2 h-4 w-4' />
          Achievements
        </Button>
      </div>

      {/* Goals section with collapsible header */}
      <Card className='mt-6'>
        <CardHeader
          className='flex flex-row items-center justify-between cursor-pointer'
          onClick={() => setShowGoals(!showGoals)}
        >
          <CardTitle>Savings Goals</CardTitle>
          <Button variant='ghost' size='sm'>
            {showGoals ? '▼' : '►'}
          </Button>
        </CardHeader>
        {showGoals && (
          <CardContent className='space-y-4'>
            {!goals || goals.length === 0 ? (
              <div className='text-center py-4'>
                <p className='text-muted-foreground'>No savings goals found</p>
                <Button
                  variant='outline'
                  className='mt-2'
                  onClick={onShowGoals}
                >
                  <Star className='mr-2 h-4 w-4' />
                  {isParent
                    ? 'Create Goal for Child'
                    : 'Create Your First Goal'}
                </Button>
              </div>
            ) : (
              goals.map((goal) => (
                <div key={goal.id} className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <div>
                      <h4 className='font-medium'>{goal.name}</h4>
                      <div className='text-sm text-muted-foreground'>
                        {goal.current} / {goal.target} sats
                      </div>
                    </div>
                    {isParent && !goal.approved && (
                      <Button
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveGoal(goal.id);
                        }}
                        className='bg-green-500 hover:bg-green-600 text-white'
                      >
                        Approve
                      </Button>
                    )}
                  </div>
                  <Progress
                    value={(goal.current / goal.target) * 100}
                    className='h-2'
                  />
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>

      {/* Recent activity section with collapsible header */}
      <Card className='mt-6'>
        <CardHeader
          className='flex flex-row items-center justify-between cursor-pointer'
          onClick={() => setShowActivity(!showActivity)}
        >
          <CardTitle className='text-lg'>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className='p-4'>
          <ul className='space-y-2'>
            <li className='p-2 bg-gray-50 rounded-md flex justify-between items-center'>
              <div>
                <p className='font-medium'>Deposit</p>
                <p className='text-xs text-muted-foreground'>10 May 2025</p>
              </div>
              <span className='text-emerald-600 font-semibold'>+50 sats</span>
            </li>
            <li className='p-2 bg-gray-50 rounded-md flex justify-between items-center'>
              <div>
                <p className='font-medium'>Quiz Completed</p>
                <p className='text-xs text-muted-foreground'>8 May 2025</p>
              </div>
              <span className='text-emerald-600 font-semibold'>+10 sats</span>
            </li>
            <li className='p-2 bg-gray-50 rounded-md flex justify-between items-center'>
              <div>
                <p className='font-medium'>Goal Created</p>
                <p className='text-xs text-muted-foreground'>5 May 2025</p>
              </div>
              <span className='text-blue-600 font-semibold'>
                New Toy (1000 sats)
              </span>
            </li>
          </ul>
          <div className='flex justify-end mt-4'>
            <Button variant='outline' size='sm' onClick={onShowHistory}>
              <History className='mr-2 h-4 w-4' />
              View All Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ChildDashboardView;
