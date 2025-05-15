import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw, LogOut } from 'lucide-react';
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
}

interface EnhancedDashboardProps {
  balance: number;
  onRefreshBalance: () => void;
  onShowHistory: () => void;
  onLogout: () => void;
  onShowGoals?: () => void;
  onShowAchievements?: () => void;
  onShowLearning?: () => void;
  onManageChildren?: () => void;
  isLoadingBalance: boolean;
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
  isLoadingBalance,
  onViewChildDashboard,
}) => {
  const { toast } = useToast();
  const { user, isParent, isChild, api } = useAuth();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [pendingGoals, setPendingGoals] = useState<Goal[]>([]);
  const navigate = useNavigate();

  const [exchangeRate, setExchangeRate] = useState(0.03);
  const kesAmount = balance * exchangeRate;

  useEffect(() => {
    if (isParent && api) {
      const fetchChildren = async () => {
        setIsLoadingChildren(true);
        try {
          const childrenData = await api.getChildren();
          console.log('Children data loaded:', childrenData);
          if (Array.isArray(childrenData) && childrenData.length > 0) {
            setChildren(childrenData);
          } else {
            console.warn('No children data returned or invalid format');
            setChildren([]);
          }
        } catch (error) {
          console.error('Failed to fetch children:', error);
          setChildren([]);
        } finally {
          setIsLoadingChildren(false);
        }
      };

      const fetchGoals = async () => {
        try {
          const allGoals = await api.getGoals();
          console.log('Goals data loaded:', allGoals);
          const unapprovedGoals = Array.isArray(allGoals)
            ? allGoals.filter((goal) => !goal.approved)
            : [];
          setPendingGoals(unapprovedGoals);
        } catch (error) {
          console.error('Failed to fetch goals:', error);
          setPendingGoals([]);
        }
      };

      fetchChildren();
      fetchGoals();
    }
  }, [isParent, api, toast]);

  const [childGoals, setChildGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (api && selectedChildId) {
      const fetchChildGoals = async () => {
        try {
          const allGoals = await api.getGoals();
          console.log('All goals:', allGoals);
          const filteredGoals = Array.isArray(allGoals)
            ? allGoals.filter(
                (goal) =>
                  goal.childId === selectedChildId ||
                  goal.userId === selectedChildId
              )
            : [];
          setChildGoals(filteredGoals);
        } catch (error) {
          console.error('Failed to fetch child goals:', error);
          setChildGoals([]);
        }
      };
      fetchChildGoals();
    } else if (isChild && api) {
      const fetchOwnGoals = async () => {
        try {
          const goals = await api.getGoals();
          setChildGoals(Array.isArray(goals) ? goals : []);
        } catch (error) {
          console.error('Failed to fetch goals:', error);
          setChildGoals([]);
        }
      };
      fetchOwnGoals();
    }
  }, [api, selectedChildId, isChild]);

  const handleRefreshClick = () => {
    onRefreshBalance();
    toast({
      title: 'Refreshing balance',
      description: 'Your balance is being updated...',
    });
  };

  const handleViewChildDashboard = (childId: string) => {
    if (onViewChildDashboard) {
      console.log('Viewing child dashboard:', childId);
      setSelectedChildId(childId);
      onViewChildDashboard(childId);
    }
  };

  const handleBackToFamily = () => {
    console.log('Returning to family dashboard');
    setSelectedChildId(null);
  };

  const handleApproveGoal = async (goalId: string) => {
    if (!api) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'API not available',
      });
      return;
    }
    try {
      await api.approveGoal(goalId);
      setPendingGoals(pendingGoals.filter((goal) => goal.id !== goalId));
      setChildGoals((prevGoals) =>
        prevGoals.map((goal) =>
          goal.id === goalId ? { ...goal, approved: true } : goal
        )
      );
      toast({
        title: 'Goal Approved',
        description: 'The savings goal has been approved.',
      });
    } catch (error) {
      console.error('Failed to approve goal:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve goal. Please try again.',
      });
    }
  };

  const handleShowLightning = (childId: string) => {
    if (!childId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a child to fund their jar',
      });
      return;
    }
    console.log('Navigating to Lightning payment:', {
      childId,
      isParent,
      isChild,
    });
    navigate(`/payment/lightning/${childId}`);
  };

  const handleShowMpesa = (childId: string) => {
    if (!childId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a child to fund their jar',
      });
      return;
    }
    console.log('Navigating to M-Pesa payment:', {
      childId,
      isParent,
      isChild,
    });
    navigate(`/payment/mpesa/${childId}`);
  };

  const selectedChildName = selectedChildId
    ? children.find((c) => c.id === selectedChildId)?.name || 'Child'
    : '';

  return (
    <div className='space-y-6 p-6'>
      <Card className='overflow-hidden'>
        <div className='bg-gradient-to-br from-yellow-400 to-amber-500 p-6'>
          <div className='flex justify-between items-center'>
            <h2 className='text-xl font-bold text-white'>
              {isParent
                ? selectedChildId
                  ? `${selectedChildName}'s Dashboard`
                  : 'Family Dashboard'
                : 'My Savings Jar'}
            </h2>
            <Button
              variant='outline'
              size='sm'
              className='bg-white text-primary hover:bg-white/90'
              onClick={handleRefreshClick}
              disabled={isLoadingBalance}
            >
              <RefreshCcw className='mr-2 h-4 w-4' />
              Refresh
            </Button>
          </div>

          {isChild || selectedChildId ? (
            <ChildDashboardView
              childId={selectedChildId || user?.id || ''}
              childName={selectedChildName || user?.name || ''}
              balance={balance}
              kesAmount={kesAmount}
              goals={childGoals}
              onShowGoals={onShowGoals || (() => {})}
              onShowHistory={onShowHistory}
              onShowMpesa={() =>
                handleShowMpesa(selectedChildId || user?.id || '')
              }
              onShowLightning={() =>
                handleShowLightning(selectedChildId || user?.id || '')
              }
              onBackToFamily={handleBackToFamily}
              isParent={isParent}
              handleApproveGoal={handleApproveGoal}
              isLoadingBalance={isLoadingBalance}
            />
          ) : (
            <ParentDashboardView
              children={children}
              pendingGoals={pendingGoals}
              isLoadingChildren={isLoadingChildren}
              onManageChildren={onManageChildren}
              onShowLightning={handleShowLightning}
              onShowMpesa={handleShowMpesa}
              onShowHistory={onShowHistory}
              onShowGoals={onShowGoals || (() => {})}
              onViewChildDashboard={handleViewChildDashboard}
              handleApproveGoal={handleApproveGoal}
            />
          )}
        </div>
      </Card>

      <div className='flex justify-end'>
        <Button
          variant='outline'
          className='text-destructive hover:text-destructive'
          onClick={onLogout}
        >
          <LogOut className='mr-2 h-4 w-4' />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
