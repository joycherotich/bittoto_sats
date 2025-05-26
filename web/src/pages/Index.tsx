import React, { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import HomePage from '@/components/HomePage';
import EnhancedDashboard from '@/components/EnhancedDashboard';
import PaymentHandler from '@/components/PaymentHandler';
import TransactionHistory from '@/components/TransactionHistory';
import GoalSetting from '@/components/GoalSetting';
import WithdrawDeposit from '@/components/WithdrawDeposit';
import ChildManagement from '@/components/ChildManagement';
import MainNav from '@/components/MainNav';
import { Toaster } from '@/components/ui/toaster';
import { UserAuthProvider, useAuth } from '@/contexts/UserAuthContext';
import { useNavigate } from 'react-router-dom';

type Section =
  | 'login'
  | 'dashboard'
  | 'lightning'
  | 'mpesa'
  | 'history'
  | 'goals'
  | 'achievements'
  | 'learning'
  | 'withdraw-deposit'
  | 'manage-children'
  | 'savings';

const MainApp = () => {
  const [currentSection, setCurrentSection] = useState<Section>('login');
  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const { user, isAuthenticated, logout, api, isParent, isChild } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated, show dashboard
    if (isAuthenticated) {
      setCurrentSection('dashboard');
      updateBalance();
    } else {
      setCurrentSection('login');
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    setCurrentSection('login');
  };

  const updateBalance = async () => {
    setIsLoadingBalance(true);

    try {
      // Default balance to 0
      let balanceValue = 0;

      if (api) {
        try {
          if (isParent && selectedChildId) {
            try {
              // First try the direct balance endpoint
              const result = await api
                .getChildBalance(selectedChildId)
                .catch(() => ({ balance: 0 }));
              balanceValue = result.balance || 0;
              console.log('Child balance fetched:', balanceValue);
            } catch (error) {
              console.warn(
                'Error fetching child balance, trying alternative method'
              );

              // If that fails, try to get the child's data
              try {
                const childData = await api
                  .getChild(selectedChildId)
                  .catch(() => ({ balance: 0 }));
                balanceValue = childData.balance || 0;
                console.log('Child balance from child data:', balanceValue);
              } catch (childError) {
                console.error('Error fetching child data:', childError);
                // Keep default balance of 0
              }
            }
          } else {
            // For parent's own balance or child's own balance
            try {
              const result = await api
                .getBalance()
                .catch(() => ({ balance: 0 }));
              balanceValue = result.balance || 0;
              console.log('User balance fetched:', balanceValue);
            } catch (error) {
              console.error('Error fetching balance:', error);
              // Keep default balance of 0
            }
          }
        } catch (error) {
          console.error('General error in balance fetching:', error);
          // Keep default balance of 0
        }
      }

      // Set the balance value (either from API or default 0)
      setBalance(balanceValue);
    } catch (error) {
      console.error('Error in balance update:', error);
      // Set balance to 0 on error
      setBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleViewChildDashboard = (childId: string) => {
    setSelectedChildId(childId);
    setCurrentSection('dashboard'); // Keep using the same dashboard component
    // Update balance to show the selected child's balance
    updateBalance();
  };

  const handleManageChildren = () => {
    navigate('/children');
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'login':
        return <HomePage />;
      case 'dashboard':
        return (
          <EnhancedDashboard
            balance={balance}
            onRefreshBalance={updateBalance}
            onShowLightning={() => setCurrentSection('lightning')}
            onShowMpesa={() => setCurrentSection('withdraw-deposit')}
            onShowHistory={() => setCurrentSection('history')}
            onShowGoals={() => setCurrentSection('goals')}
            onShowAchievements={
              isChild || selectedChildId
                ? () => setCurrentSection('achievements')
                : undefined
            }
            onShowLearning={
              isChild || selectedChildId
                ? () => setCurrentSection('learning')
                : undefined
            }
            onManageChildren={
              isParent
                ? () => {
                    setSelectedChildId(null);
                    setCurrentSection('manage-children');
                  }
                : undefined
            }
            onViewChildDashboard={
              isParent ? handleViewChildDashboard : undefined
            }
            onLogout={handleLogout}
            isLoadingBalance={isLoadingBalance}
          />
        );
      case 'lightning':
        return (
          <PaymentHandler
            onBack={() => setCurrentSection('dashboard')}
            type='lightning'
          />
        );
      case 'withdraw-deposit':
        return (
          <WithdrawDeposit onBack={() => setCurrentSection('dashboard')} />
        );
      case 'history':
        return (
          <TransactionHistory onBack={() => setCurrentSection('dashboard')} />
        );
      case 'goals':
        return <GoalSetting onBack={() => setCurrentSection('dashboard')} />;
      case 'achievements':
        return (
          <EnhancedAchievements
            onBack={() => setCurrentSection('dashboard')}
            childId={location.state?.childId}
          />
        );
      case 'learning':
        return (
          <EnhancedLearningHub
            onBack={() => setCurrentSection('dashboard')}
            childId={location.state?.childId}
          />
        );
      case 'manage-children':
        return (
          <ChildManagement onBack={() => setCurrentSection('dashboard')} />
        );
      default:
        return <HomePage />;
    }
  };

  // Add handleApproveGoal function
  const handleApproveGoal = async (goalId: string) => {
    if (!api) {
      console.error('API not available');
      return;
    }

    try {
      console.log('Approving goal:', goalId);
      await api.approveGoal(goalId);

      // Update the goals list after approval
      setChildGoals((prevGoals) =>
        prevGoals.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                approved: true,
                status: 'approved',
              }
            : goal
        )
      );

      // Refresh goals after approval
      if (selectedChildId && api) {
        try {
          const goals = await api.getGoals(selectedChildId);
          console.log('Refreshed goals after approval:', goals);
          setChildGoals(Array.isArray(goals) ? goals : []);
        } catch (error) {
          console.error('Error refreshing goals after approval:', error);
        }
      }
    } catch (error) {
      console.error('Failed to approve goal:', error);
    }
  };

  return (
    <div className=''>
      <div className=''>
       
        {renderSection()}

        {isAuthenticated && <MainNav />}
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <UserAuthProvider>
      <MainApp />
      <Toaster />
    </UserAuthProvider>
  );
};

export default Index;

