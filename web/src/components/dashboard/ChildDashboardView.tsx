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
{/* Balance and Primary Goal Section */}
<div className="mt-6 bg-[#4B0082] p-6 rounded-xl shadow-lg">
  {/* Child's Jar Title */}
  <div className="flex justify-between items-center">
    <h2 className="text-2xl font-bold text-white">{childName}'s Jar</h2>
  </div>

  {/* Available Balance */}
  <p className="text-sm font-medium text-white/70 mt-4">Available Balance</p>
  <div className="flex items-baseline mt-1">
    {isLoadingBalance ? (
      <div className="flex items-center gap-2">
        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
        <span className="text-white/90 text-lg">Updating...</span>
      </div>
    ) : (
      <>
        <h1 className="text-4xl font-bold text-white">
          {balance.toLocaleString()}
        </h1>
        <span className="text-lg ml-2 text-white/90">sats</span>
      </>
    )}
  </div>

  <div className="mt-1 text-white/80 text-sm">
    ≈ KES{' '}
    {kesAmount.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}
  </div>

  {/* Jar ID */}
  {isParent && jarId && (
    <div className="mt-4 p-3 bg-white/10 rounded-md">
      <p className="text-sm text-white">
        {childName}'s Jar ID: <span className="font-mono">{jarId}</span>
      </p>
    </div>
  )}

  {/* Primary Goal */}
  {goals && goals.length > 0 && (
    <div className="mt-6">
      <div className="flex justify-between text-xs text-white/80 mb-1">
        <span>Primary Goal: {goals[0].name}</span>
        <span>
          {goals[0].current.toLocaleString()} / {goals[0].target.toLocaleString()} sats
        </span>
      </div>
      <Progress
        value={(goals[0].current / goals[0].target) * 100}
        className="h-2 bg-white/20"
      />
    </div>
  )}

  {/* Back Button */}
  {isParent && (
    <Button
      variant="ghost"
      size="sm"
      className="mt-6 text-white bg-white/10 hover:bg-white/20"
      onClick={onBackToFamily}
    >
      ← Back to Family Dashboard
    </Button>
  )}
</div>

{/* Action Buttons */}
<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
  <Button
    className="bg-amber-500 hover:bg-amber-600 text-white w-full justify-center"
    onClick={onShowGoals}
  >
    <Star className="mr-2 h-4 w-4" />
    {isParent ? 'Manage Goals' : 'Set Goals'}
  </Button>

  <Button
    className="bg-blue-500 hover:bg-blue-600 text-white w-full justify-center"
    onClick={onShowHistory}
  >
    <History className="mr-2 h-4 w-4" />
    Transaction History
  </Button>

  <Button
    className="bg-[#3bc266] hover:bg-[#2fa75a] text-white w-full justify-center"
    onClick={onShowMpesa}
  >
    <PiggyBank className="mr-2 h-4 w-4" />
    Add Funds (M-Pesa)
  </Button>

  <Button
    className="bg-yellow-400 hover:bg-yellow-500 text-white w-full justify-center"
    onClick={onShowLightning}
  >
    <Zap className="mr-2 h-4 w-4" />
    Bitcoin Payment
  </Button>

  <Button
    variant="outline"
    className="border-blue-500 text-blue-600 hover:bg-blue-50 w-full justify-center"
    onClick={() => onShowLearning(childId)}
  >
    <Book className="mr-2 h-4 w-4" />
    Learning Progress
  </Button>

  <Button
    variant="outline"
    className="border-purple-500 text-purple-600 hover:bg-purple-50 w-full justify-center"
    onClick={() => onShowAchievements(childId)}
  >
    <Award className="mr-2 h-4 w-4" />
    Achievements
  </Button>
</div>


      {/* Goals section with collapsible header */}
      <Card className='mt-6 max-w-full '>
  <CardHeader
    className='flex flex-row items-center justify-between cursor-pointer px-4 py-2 sm:px-6 sm:py-3'
    onClick={() => setShowGoals(!showGoals)}
  >
    <CardTitle className='text-base sm:text-lg'>Savings Goals</CardTitle>
    <Button variant='ghost' size='sm' aria-label='Toggle Savings Goals'>
      {showGoals ? '▼' : '►'}
    </Button>
  </CardHeader>

  {showGoals && (
    <CardContent className='space-y-4 px-4 py-3 sm:px-6 sm:py-4'>
      {!goals || goals.length === 0 ? (
        <div className='text-center py-6'>
          <p className='text-muted-foreground'>No savings goals found</p>
          <Button
            variant='outline'
            className='mt-2 inline-flex items-center justify-center'
            onClick={onShowGoals}
          >
            <Star className='mr-2 h-4 w-4' />
            {isParent ? 'Create Goal for Child' : 'Create Your First Goal'}
          </Button>
        </div>
      ) : (
        goals.map((goal) => (
          <div key={goal.id} className='space-y-2'>
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center'>
              <div>
                <h4 className='font-medium text-sm sm:text-base'>{goal.name}</h4>
                <div className='text-xs sm:text-sm text-muted-foreground'>
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
                  className='mt-2 sm:mt-0 bg-green-500 hover:bg-green-600 text-white'
                >
                  Approve
                </Button>
              )}
            </div>
            <Progress
              value={(goal.current / goal.target) * 100}
              className='h-2 rounded'
            />
          </div>
        ))
      )}
    </CardContent>
  )}
</Card>

{/* Recent activity section with collapsible header */}
<Card className='mt-6 max-w-full w-11/12'>
  <CardHeader
    className='flex flex-row items-center justify-between cursor-pointer px-4 py-2 sm:px-6 sm:py-3'
    onClick={() => setShowActivity(!showActivity)}
  >
    <CardTitle className='text-base sm:text-lg'>Recent Activity</CardTitle>
  </CardHeader>
  <CardContent className='p-4 sm:p-6'>
    <ul className='space-y-2'>
      {[
        { title: 'Deposit', date: '10 May 2025', amount: '+50 sats', color: 'text-emerald-600' },
        { title: 'Quiz Completed', date: '8 May 2025', amount: '+10 sats', color: 'text-emerald-600' },
        { title: 'Goal Created', date: '5 May 2025', amount: 'New Toy (1000 sats)', color: 'text-blue-600' },
      ].map((activity, idx) => (
        <li
          key={idx}
          className='p-2 bg-gray-50 rounded-md flex flex-col sm:flex-row sm:justify-between sm:items-center'
        >
          <div>
            <p className='font-medium text-sm sm:text-base'>{activity.title}</p>
            <p className='text-xs sm:text-sm text-muted-foreground'>{activity.date}</p>
          </div>
          <span className={`font-semibold mt-1 sm:mt-0 ${activity.color} text-sm sm:text-base`}>
            {activity.amount}
          </span>
        </li>
      ))}
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
