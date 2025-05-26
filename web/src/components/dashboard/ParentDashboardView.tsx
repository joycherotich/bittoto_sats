import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Wallet,
  History,
  Star,
  Settings,
  Users,
  ArrowRight,
  AlertCircle,
  Book,
  Award,
  Check,
  BookOpen,
  PiggyBank,
  Target,
  Plus,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MainNav from '../MainNav';

interface ChildData {
  id: string;
  name: string;
  age: number;
  jarId: string;
  balance?: number;
}

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  approved: boolean;
  childId?: string;
  jarId?: string;
  childName?: string;
}

interface ParentDashboardViewProps {
  children: ChildData[];
  pendingGoals: Goal[];
  isLoadingChildren: boolean;
  onManageChildren?: () => void;
  onShowHistory?: () => void;
  onShowGoals?: () => void;
  onViewChildDashboard: (childId: string) => void;
  handleApproveGoal: (goalId: string) => void;
  handleSelectPayment: (childId: string) => void;
  onShowLearning?: (childId?: string) => void;
  onShowAchievements?: (childId?: string) => void;
}

const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({
  children,
  pendingGoals,
  isLoadingChildren,
  onManageChildren,
  onShowHistory,
  onShowGoals,
  onViewChildDashboard,
  handleApproveGoal,
  onShowLearning,
  onShowAchievements,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Add state for collapsible sections
  const [showChildrenSection, setShowChildrenSection] = useState(true);
  const [showPendingGoalsSection, setShowPendingGoalsSection] = useState(true);
  const [showRecentActivitySection, setShowRecentActivitySection] =
    useState(true);
  const [showResourcesSection, setShowResourcesSection] = useState(true);

  // Add toggle function
  const toggleResourcesSection = () => {
    setShowResourcesSection(!showResourcesSection);
  };

  // Add handlers for family-wide learning and achievements
  const handleShowFamilyLearning = () => {
    if (onShowLearning) {
      console.log('ParentDashboardView: Showing family learning resources');
      onShowLearning();
    } else {
      console.log('ParentDashboardView: No onShowLearning handler provided');
      toast({
        title: 'Feature not available',
        description: 'Learning resources are not available at the moment.',
        variant: 'destructive',
      });
    }
  };

  const handleShowFamilyAchievements = () => {
    if (onShowAchievements) {
      console.log('ParentDashboardView: Showing family achievements');
      onShowAchievements();
    } else {
      console.log(
        'ParentDashboardView: No onShowAchievements handler provided'
      );
      toast({
        title: 'Feature not available',
        description: 'Achievements are not available at the moment.',
        variant: 'destructive',
      });
    }
  };

  // Handle child-specific learning resources
  const handleShowChildLearning = (childId: string) => {
    if (onShowLearning) {
      console.log(
        `ParentDashboardView: Showing learning resources for child ${childId}`
      );
      onShowLearning(childId);
    } else {
      console.log('ParentDashboardView: No onShowLearning handler provided');
      toast({
        title: 'Feature not available',
        description: 'Learning resources are not available at the moment.',
        variant: 'destructive',
      });
    }
  };

  // Handle child-specific achievements
  const handleShowChildAchievements = (childId: string) => {
    if (onShowAchievements) {
      console.log(
        `ParentDashboardView: Showing achievements for child ${childId}`
      );
      onShowAchievements(childId);
    } else {
      console.log(
        'ParentDashboardView: No onShowAchievements handler provided'
      );
      toast({
        title: 'Feature not available',
        description: 'Achievements are not available at the moment.',
        variant: 'destructive',
      });
    }
  };

  // Toggle functions for section visibility
  const toggleChildrenSection = () =>
    setShowChildrenSection(!showChildrenSection);
  const togglePendingGoalsSection = () =>
    setShowPendingGoalsSection(!showPendingGoalsSection);
  const toggleRecentActivitySection = () =>
    setShowRecentActivitySection(!showRecentActivitySection);

  // Add a function to handle the manage children button click
  const handleManageChildrenClick = () => {
    if (onManageChildren) {
      console.log(
        'ParentDashboardView: Using provided onManageChildren callback'
      );
      onManageChildren();
    } else {
      // Fallback to navigation if the callback isn't provided
      console.log(
        'ParentDashboardView: Navigating to /children management page'
      );
      navigate('/children');
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('ParentDashboardView rendered with:');
    console.log('- children:', children);
    console.log('- pendingGoals:', pendingGoals);
    console.log('- isLoadingChildren:', isLoadingChildren);
  }, [children, pendingGoals, isLoadingChildren]);

  const handleSelectPayment = (childId: string) => {
    console.log('Navigating to payment selection for child:', childId);
    navigate(`/payment/select/${childId}`);
  };

  const handleViewChildDashboard = (childId: string) => {
    if (!childId) {
      console.error('No childId provided to handleViewChildDashboard');
      return;
    }

    console.log('ParentDashboardView: Viewing child dashboard:', childId);
    onViewChildDashboard(childId);
  };

  return (
<div className="">
  <MainNav />

  {/* Header */}
  <div>
    <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Family Dashboard</h1>
    <p className="text-sm font-serif text-gray-600 dark:text-gray-400 mt-1">
      Manage your family's savings jars and goals
    </p>
  </div>

  {/* Children’s Savings Jars */}
  <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-100 dark:border-gray-700 space-y-2 sm:space-y-0">
      <div className="flex items-center space-x-2">
        <PiggyBank className="h-5 w-5 text-amber-500" />
        <h2 className="text-xl font-serif font-semibold">Children's Savings Jars</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleChildrenSection}
          className="h-8 w-8 p-0"
        >
          {showChildrenSection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span className="sr-only">{showChildrenSection ? 'Hide children' : 'Show children'}</span>
        </Button>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="text-amber-600 border-amber-600 hover:bg-amber-50"
        onClick={handleManageChildrenClick}
      >
        <Users className="mr-2 font-serif h-4 w-4" />
        Manage Children
      </Button>
    </div>

    {showChildrenSection && (
      <div className="p-4">
        {isLoadingChildren ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-amber-500" />
          </div>
        ) : children.length === 0 ? (
          <div className="text-center py-6">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">No savings jars found for your children.</p>
            <Button
              variant="outline"
              className="mt-2 text-amber-600 border-amber-600 hover:bg-amber-50"
              onClick={handleManageChildrenClick}
            >
              <Users className="mr-2 font-serif h-4 w-4" />
              Add Child Account
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <div
                key={child.id}
                className="bg-gray-200 dark:bg-gray-700/50 rounded-lg p-4 flex flex-col justify-between"
              >
                <div className="flex font-serif text-xl font-extrabold items-start space-x-4">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                    <PiggyBank className="h-8 w-8 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{child.name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Jar ID: <span className="font-mono">{child.jarId || 'N/A'}</span>
                    </p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">
                      Balance: {child.balance?.toLocaleString() || '0'} sats
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap font-serif text-2xl font-semibold mt-4 gap-2">
                  <Button variant="ghost" size="sm" className="text-amber-600 text-lg  hover:text-amber-700 hover:bg-amber-50" onClick={() => onViewChildDashboard(child.id)}>
                    <ArrowRight className="mr-2 h-4 w-4" /> Dashboard
                  </Button>
                  <Button variant="ghost" size="sm" className="text-green-600 text-lg hover:text-green-700 hover:bg-green-50" onClick={() => handleSelectPayment(child.id)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Funds
                  </Button>
                  <Button variant="ghost" size="sm" className="text-blue-600 text-lg hover:text-blue-700 hover:bg-blue-50" onClick={() => handleShowChildLearning(child.id)}>
                    <Book className="mr-2 h-4 w-4" /> Learning
                  </Button>
                  <Button variant="ghost" size="sm" className="text-purple-600 text-lg hover:text-purple-700 hover:bg-purple-50" onClick={() => handleShowChildAchievements(child.id)}>
                    <Award className="mr-2 h-4 w-4" /> Achievements
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </section>

      {/* Recent Activity Section */}
      <section className='bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden'>
        <div className='flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700'>
          <div className='flex items-center'>
            <History className='h-5 w-5 text-blue-500 mr-2' />
            <h2 className='text-xl font-serif font-semibold'>Recent Activity</h2>
            <Button
              variant='ghost'
              size='sm'
              onClick={toggleRecentActivitySection}
              className='ml-2 h-8 w-8 p-0'
            >
              {showRecentActivitySection ? (
                <ChevronUp className='h-4 w-4' />
              ) : (
                <ChevronDown className='h-4 w-4' />
              )}
            </Button>
          </div>
          <Button
            variant='outline'
            size='sm'
            className='text-blue-600 text-lg font-serif border-blue-600 hover:bg-blue-50'
            onClick={onShowHistory}
          >
            <History className='mr-2 font-serif h-4 w-4' />
            View All
          </Button>
        </div>

        {showRecentActivitySection && (
          <div className='p-4'>
            <div className='text-center py-4 font-serif text-gray-500 dark:text-gray-400'>
              No recent activity to display.
            </div>
          </div>
        )}
      </section>

      {/* Pending Goals Section */}
      <section className='bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden'>
        <div className='flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700'>
          <div className='flex items-center'>
            <Target className='h-5 w-5 text-amber-500 mr-2' />
            <h2 className='text-xl font-serif font-semibold'>
              Savings Goals Pending Approval
            </h2>
            {Array.isArray(pendingGoals) && pendingGoals.length > 0 && (
              <div className='ml-2 bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium'>
                {pendingGoals.length}
              </div>
            )}
            <Button
              variant='ghost'
              size='sm'
              onClick={togglePendingGoalsSection}
              className='ml-2 h-8 w-8 p-0'
            >
              {showPendingGoalsSection ? (
                <ChevronUp className='h-4 w-4' />
              ) : (
                <ChevronDown className='h-4 w-4' />
              )}
            </Button>
          </div>
          <Button
            variant='outline'
            size='sm'
            className='text-amber-600 font-serif text-lg border-amber-600 hover:bg-amber-50'
            onClick={onShowGoals}
          >
            <Target className='mr-2 font-serif h-4 w-4' />
            Manage All Goals
          </Button>
        </div>

        {showPendingGoalsSection && (
          <div className='p-4'>
            {Array.isArray(pendingGoals) && pendingGoals.length > 0 ? (
              <div className='space-y-4'>
                {/* Show a summary instead of all details */}
                <div className='flex justify-between items-center'>
                  <div>
                    <h3 className='font-medium text-lg'>
                      {pendingGoals.length}{' '}
                      {pendingGoals.length === 1 ? 'Goal' : 'Goals'} Pending
                      Approval
                    </h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      {pendingGoals
                        .map((goal) => goal.childName || 'Unknown')
                        .join(', ')}
                    </p>
                  </div>
                  <Button
                    variant='default'
                    size='sm'
                    className='bg-amber-500  hover:bg-amber-600 text-white'
                    onClick={onShowGoals}
                  >
                    <Check className='mr-2 h-4 w-4' />
                    Review Goals
                  </Button>
                </div>

                {/* Optional: Show the first pending goal as an example */}
                {pendingGoals.length > 0 && (
                  <div className='border-t pt-3 mt-3'>
                    <div className='flex justify-between items-center'>
                      <div>
                        <h4 className='font-medium'>{pendingGoals[0].name}</h4>
                        <p className='text-sm text-gray-500'>
                          Child: {pendingGoals[0].childName || 'Unknown'}
                        </p>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        className='text-green-600 border-green-600 hover:bg-green-50'
                        onClick={() => handleApproveGoal(pendingGoals[0].id)}
                      >
                        <Check className='mr-2 h-4 w-4' />
                        Approve
                      </Button>
                    </div>
                    <div className='flex justify-between text-sm text-gray-700 dark:text-gray-300 mt-2'>
                      <span>
                        Progress:{' '}
                        {pendingGoals[0].current?.toLocaleString() || '0'} /{' '}
                        {pendingGoals[0].target?.toLocaleString() || '0'} sats
                      </span>
                      <span>
                        {Math.round(
                          (pendingGoals[0].current / pendingGoals[0].target) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (pendingGoals[0].current / pendingGoals[0].target) * 100
                      }
                      className='h-2 mt-1'
                    />
                    {pendingGoals.length > 1 && (
                      <p className='text-sm text-center mt-3 text-gray-500'>
                        + {pendingGoals.length - 1} more{' '}
                        {pendingGoals.length - 1 === 1 ? 'goal' : 'goals'}{' '}
                        pending approval
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className='text-center py-6'>
                <div className='bg-amber-100 dark:bg-amber-900/30 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4'>
                  <Target className='h-8 w-8 text-amber-500' />
                </div>
                <p className='text-gray-600 font-serif dark:text-gray-400 mb-4'>
                  No savings goals pending approval.
                </p>
                <Button
                  variant='outline'
                  className='mt-2 text-amber-600 font-serif border-amber-600 hover:bg-amber-50'
                  onClick={onShowGoals}
                >
                  <Target className='mr-2 h-4 w-4' />
                  View All Goals
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Learning and Achievements Section */}
      <section className='bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden'>
        <div className='flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700'>
          <div className='flex items-center'>
            <BookOpen className='h-5 w-5 text-indigo-500 mr-2' />
            <h2 className='text-xl font-serif font-semibold'>Family Resources</h2>
            <Button
              variant='ghost'
              size='sm'
              onClick={toggleResourcesSection}
              className='ml-2 h-8 w-8 p-0'
            >
              {showResourcesSection ? (
                <ChevronUp className='h-4 w-4' />
              ) : (
                <ChevronDown className='h-4 w-4' />
              )}
            </Button>
          </div>
        </div>

        {showResourcesSection && (
          <div className='p-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4'>
                <div className='flex items-center mb-3'>
                  <Book className='h-6 w-6 text-blue-500 mr-2' />
                  <h3 className='text-lg font-serif font-semibold'>Financial Learning</h3>
                </div>
                <p className='text-gray-600 font-serif dark:text-gray-400 mb-4 text-lg'>
                  Help your children learn about money management and savings
                  with interactive lessons.
                </p>
                    <a
                  href='https://bitcoiners.africa/learn-section/bitcoin-for-kids/'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <Button
                    variant='outline'
                    className='text-blue-600 text-lg font-serif border-blue-600 hover:bg-blue-100 w-full sm:w-auto'
                  >
                    <Book className='mr-2 h-4 w-4' />
                    Explore Learning Resources
                  </Button>
                  </a>
                  </div>

              <div className='bg-green-50 dark:bg-green-900/20 rounded-lg p-4'>
                <div className='flex items-center mb-3'>
                  <Award className='h-6 w-6 text-green-500 mr-2' />
                  <h3 className='text-lg font-serif font-semibold'>Family Achievements</h3>
                </div>
                <p className='text-gray-600 font-serif dark:text-gray-400 mb-4 text-lg'>
                  Celebrate your family's savings milestones and achievements.
                </p>
                <Button
                  variant='outline'
                  className='text-green-600 text-lg font-serif border-green-600 hover:bg-green-100'
                  onClick={handleShowFamilyAchievements}
                >
                  <Award className='mr-2 h-4 w-4' />
                  View Achievements
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ParentDashboardView;
