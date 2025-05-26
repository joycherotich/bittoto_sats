import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw, LogOut, PiggyBank } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import { useNavigate } from 'react-router-dom';
import ChildDashboardView from './dashboard/ChildDashboardView';
import ParentDashboardView from './dashboard/ParentDashboardView';

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

interface EnhancedDashboardProps {
  balance: number;
  onRefreshBalance?: () => void;
  onShowHistory: () => void;
  onLogout?: () => void;
  onShowGoals?: () => void;
  onShowAchievements?: (childId?: string) => void;
  onShowLearning?: (childId?: string) => void;
  onManageChildren?: () => void;
  isLoadingBalance?: boolean;
  onViewChildDashboard?: (childId: string) => void;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
  balance,
  onRefreshBalance,
  onShowHistory,
  onLogout,
  onShowGoals,
  onShowAchievements,
  onShowLearning,
  onManageChildren,
  isLoadingBalance = false,
  onViewChildDashboard,
}) => {
  const { toast } = useToast();
  const { user, isParent, isChild, api } = useAuth();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [pendingGoals, setPendingGoals] = useState<Goal[]>([]);
  const [childGoals, setChildGoals] = useState<Goal[]>([]);
  const [selectedChildName, setSelectedChildName] = useState<string>('');
  const navigate = useNavigate();

  const [exchangeRate, setExchangeRate] = useState(0.03);
  const kesAmount = balance * exchangeRate;

  // Add handlers for learning and achievements
  const handleShowLearning = (childId?: string) => {
    console.log(
      'EnhancedDashboard: Showing learning resources',
      childId ? `for child ${childId}` : 'for family'
    );

    if (childId) {
      // Navigate to child-specific learning
      navigate('/learning', { state: { childId } });
    } else {
      // Navigate to family learning
      navigate('/learning');
    }
  };

  const handleShowAchievements = (childId?: string) => {
    console.log(
      'EnhancedDashboard: Showing achievements',
      childId ? `for child ${childId}` : 'for family'
    );

    if (childId) {
      // Navigate to child-specific achievements
      navigate('/achievements', { state: { childId } });
    } else {
      // Navigate to family achievements
      navigate('/achievements');
    }
  };

  // Add the missing handleManageChildren function
  const handleManageChildren = () => {
    console.log('EnhancedDashboard: Handling manage children');
    if (onManageChildren) {
      onManageChildren();
    } else {
      // Fallback to direct navigation if the callback isn't provided
      navigate('/children');
    }
  };

  // Add this function near your other handler functions
  const handleSelectPayment = (childId: string) => {
    console.log('Navigating to payment selection for child:', childId);
    navigate(`/payment/select/${childId}`);
  };

  // Fetch children data for parent users
  useEffect(() => {
    if (isParent && api) {
      const fetchChildren = async () => {
        try {
          setIsLoadingChildren(true);
          console.log('Fetching children...');

          const fetchedChildren = await api.getChildren();
          console.log('API returned children:', fetchedChildren);

          if (Array.isArray(fetchedChildren) && fetchedChildren.length > 0) {
            setChildren(fetchedChildren);
          } else {
            console.log('No children returned or invalid format');
            setChildren([]);
          }
        } catch (error) {
          console.error('Failed to fetch children:', error);
          setChildren([]);
        } finally {
          setIsLoadingChildren(false);
        }
      };

      const fetchPendingGoals = async () => {
        if (!api || !isParent) return;

        try {
          console.log('EnhancedDashboard: Fetching pending goals');
          setPendingGoals([]); // Clear existing goals while loading

          // Try to use the API method first
          try {
            const fetchedPendingGoals = await api.getPendingGoals();

            if (
              Array.isArray(fetchedPendingGoals) &&
              fetchedPendingGoals.length > 0
            ) {
              console.log(
                'EnhancedDashboard: Received pending goals:',
                fetchedPendingGoals
              );
              setPendingGoals(fetchedPendingGoals);
              return;
            } else {
              console.log(
                'EnhancedDashboard: No pending goals returned from API method'
              );
            }
          } catch (apiMethodError) {
            console.error(
              'EnhancedDashboard: Error using api.getPendingGoals():',
              apiMethodError
            );
          }

          // Fallback: Try to get all goals and filter for pending ones
          console.log(
            'EnhancedDashboard: Trying fallback method - get all goals and filter'
          );
          if (typeof api.getGoals === 'function') {
            try {
              const allGoals = await api.getGoals();
              if (Array.isArray(allGoals)) {
                const pendingGoalsFiltered = allGoals.filter(
                  (goal) => !goal.approved
                );
                console.log(
                  'EnhancedDashboard: Filtered pending goals:',
                  pendingGoalsFiltered
                );

                // Process the goals to ensure they have all required properties
                const processedGoals = pendingGoalsFiltered.map((goal) => ({
                  id: goal.id,
                  name: goal.name || 'Unnamed Goal',
                  target: goal.targetAmount || goal.target || 0,
                  current: goal.currentAmount || goal.current || 0,
                  approved: false,
                  childId: goal.childId,
                  jarId: goal.jarId,
                  childName: goal.childName || 'Unknown Child',
                }));

                setPendingGoals(processedGoals);
                return;
              }
            } catch (getGoalsError) {
              console.error(
                'EnhancedDashboard: Error using fallback getGoals method:',
                getGoalsError
              );
            }
          }

          // Direct API call as last resort
          console.log(
            'EnhancedDashboard: Trying direct API call as last resort'
          );
          try {
            const response = await fetch(
              `${import.meta.env.VITE_API_URL}/goals?approved=false`,
              {
                headers: {
                  Authorization: `Bearer ${user?.token}`,
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              const pendingGoalsData = Array.isArray(data)
                ? data
                : data.goals && Array.isArray(data.goals)
                ? data.goals
                : [];
              console.log(
                'EnhancedDashboard: Pending goals from direct API call:',
                pendingGoalsData
              );

              // Process the goals to ensure they have all required properties
              const processedGoals = pendingGoalsData.map((goal) => ({
                id: goal.id,
                name: goal.name || 'Unnamed Goal',
                target: goal.targetAmount || goal.target || 0,
                current: goal.currentAmount || goal.current || 0,
                approved: false,
                childId: goal.childId,
                jarId: goal.jarId,
                childName: goal.childName || 'Unknown Child',
              }));

              setPendingGoals(processedGoals);
              return;
            } else {
              console.log(
                'EnhancedDashboard: Direct API call failed with status:',
                response.status
              );
            }
          } catch (directApiError) {
            console.error(
              'EnhancedDashboard: Error with direct API call:',
              directApiError
            );
          }

          console.log(
            'EnhancedDashboard: All methods to fetch pending goals failed'
          );
          setPendingGoals([]);
        } catch (error) {
          console.error(
            'EnhancedDashboard: Failed to fetch pending goals:',
            error
          );
          setPendingGoals([]);
        }
      };

      fetchChildren();
      fetchPendingGoals();
    }
  }, [api, isParent, user?.token]);

  // Fetch goals for the selected child or current child user
  useEffect(() => {
    const fetchGoals = async () => {
      if (!api) return;

      try {
        if (isParent && selectedChildId) {
          // Parent viewing a child's dashboard
          console.log(
            'EnhancedDashboard: Parent fetching goals for child:',
            selectedChildId
          );

          setChildGoals([]); // Clear existing goals while loading
          const fetchedGoals = await api.getGoals(selectedChildId);

          console.log(
            'EnhancedDashboard: Parent received child goals:',
            fetchedGoals
          );
          setChildGoals(Array.isArray(fetchedGoals) ? fetchedGoals : []);

          // Update selected child name
          const child = children.find((c) => c.id === selectedChildId);
          if (child) {
            setSelectedChildName(child.name);
          }
        } else if (isChild) {
          // Child viewing their own dashboard
          console.log('EnhancedDashboard: Child user fetching own goals');

          setChildGoals([]); // Clear existing goals while loading
          const fetchedGoals = await api.getGoals(); // No childId for child users

          console.log(
            'EnhancedDashboard: Child received own goals:',
            fetchedGoals
          );
          setChildGoals(Array.isArray(fetchedGoals) ? fetchedGoals : []);
        }
      } catch (error) {
        console.error('EnhancedDashboard: Failed to fetch goals:', error);
        setChildGoals([]);
      }
    };

    fetchGoals();
  }, [api, selectedChildId, isParent, isChild, children]);

  const handleRefreshClick = () => {
    if (onRefreshBalance) {
      onRefreshBalance();
    }
  };

  const handleViewChildDashboard = (childId: string) => {
    console.log('EnhancedDashboard: Setting selected child ID:', childId);
    setSelectedChildId(childId);

    // Find child name
    const child = children.find((c) => c.id === childId);
    if (child) {
      setSelectedChildName(child.name);
    }

    // If there's an external handler, call it too
    if (onViewChildDashboard) {
      onViewChildDashboard(childId);
    }
  };

  const handleBackToFamily = () => {
    setSelectedChildId(null);
    setSelectedChildName('');
  };

  const handleShowMpesa = (childId: string) => {
    navigate(`/mpesa/${childId}`);
  };

  const handleShowLightning = (childId: string) => {
    navigate(`/lightning/${childId}`);
  };

  const handleApproveGoal = async (goalId: string) => {
    try {
      console.log('Approving goal:', goalId);

      if (api) {
        await api.approveGoal(goalId);
      }

      toast({
        title: 'Goal approved',
        description: 'The goal has been approved successfully.',
      });

      // Update pending goals list by removing the approved goal
      setPendingGoals((prevGoals) =>
        prevGoals.filter((goal) => goal.id !== goalId)
      );

      // Refresh goals for the selected child if applicable
      if (selectedChildId) {
        const fetchedGoals = await api.getGoals(selectedChildId);
        if (Array.isArray(fetchedGoals)) {
          setChildGoals(fetchedGoals);
        }
      }

      // Refresh all pending goals
      fetchPendingGoals();
    } catch (error) {
      console.error('Error approving goal:', error);
      toast({
        variant: 'destructive',
        title: 'Error approving goal',
        description: 'Could not approve the goal. Please try again.',
      });
    }
  };

  return (
<div className="md:ml-56">
  <div className="w-full bg-yellow-600 text-black p-4  flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-start sm:items-center gap-3">
      <PiggyBank className="h-6 w-6 flex-shrink-0" />
      <div>
        <h2 className="text-base font-serif sm:text-lg font-bold">
          {isChild || selectedChildId
            ? `${selectedChildName || user?.name || 'Child'}'s Savings Jar`
            : 'Family Savings'}
        </h2>
        <p className="text-sm font-serif opacity-90">
          {isChild || selectedChildId
            ? 'Track your savings and goals'
            : 'Manage your family savings'}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2 self-end sm:self-auto">
      <Button
        variant="ghost"
        size="icon"
        className="text-white hover:bg-amber-600 hover:text-white"
        onClick={handleRefreshClick}
        disabled={isLoadingBalance}
      >
        <RefreshCcw className={`h-5 w-5 ${isLoadingBalance ? 'animate-spin' : ''}`} />
      </Button>
      {onLogout && (
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-amber-600 hover:text-white"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      )}
    </div>
  </div>

  {/* Animated page content */}
  <div className="space-y-8 sm:space-y-12 animate-fade-in px-4">
    <CardContent className="p-0">
      {/* Dashboard view */}
      {isChild || selectedChildId ? (
        <ChildDashboardView
          childId={selectedChildId || user?.id || ''}
          childName={selectedChildName || user?.name || ''}
          jarId={children.find((c) => c.id === selectedChildId)?.jarId}
          balance={balance}
          kesAmount={kesAmount}
          goals={childGoals}
          onShowGoals={onShowGoals || (() => {})}
          onShowHistory={onShowHistory}
          onShowMpesa={() => handleShowMpesa(selectedChildId || user?.id || '')}
          onShowLightning={() => handleShowLightning(selectedChildId || user?.id || '')}
          onBackToFamily={handleBackToFamily}
          isParent={isParent}
          handleApproveGoal={handleApproveGoal}
          isLoadingBalance={isLoadingBalance}
          onShowLearning={onShowLearning}
          onShowAchievements={onShowAchievements}
        />
      ) : (
        isParent && (
          <ParentDashboardView
            children={children}
            pendingGoals={pendingGoals}
            isLoadingChildren={isLoadingChildren}
            onManageChildren={handleManageChildren}
            onShowHistory={onShowHistory}
            onShowGoals={onShowGoals}
            onViewChildDashboard={handleViewChildDashboard}
            handleApproveGoal={handleApproveGoal}
            handleSelectPayment={handleSelectPayment}
            onShowLearning={handleShowLearning}
            onShowAchievements={handleShowAchievements}
          />
        )
      )}
    </CardContent>
  </div>
</div>

  );
};

export default EnhancedDashboard;
