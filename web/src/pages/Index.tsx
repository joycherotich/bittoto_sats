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
            // Try to get child balance using a more resilient approach
            try {
              // First try the direct balance endpoint
              const result = await api.getChildBalance(selectedChildId).catch(() => ({ balance: 0 }));
              balanceValue = result.balance || 0;
              console.log("Child balance fetched:", balanceValue);
            } catch (error) {
              console.warn("Error fetching child balance, trying alternative method");
              
              // If that fails, try to get the child's data
              try {
                const childData = await api.getChild(selectedChildId).catch(() => ({ balance: 0 }));
                balanceValue = childData.balance || 0;
                console.log("Child balance from child data:", balanceValue);
              } catch (childError) {
                console.error("Error fetching child data:", childError);
                // Keep default balance of 0
              }
            }
          } else {
            // For parent's own balance or child's own balance
            try {
              const result = await api.getBalance().catch(() => ({ balance: 0 }));
              balanceValue = result.balance || 0;
              console.log("User balance fetched:", balanceValue);
            } catch (error) {
              console.error("Error fetching balance:", error);
              // Keep default balance of 0
            }
          }
        } catch (error) {
          console.error("General error in balance fetching:", error);
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
            onViewChildDashboard={isParent ? handleViewChildDashboard : undefined}
            onLogout={handleLogout}
            isLoadingBalance={isLoadingBalance}
          />
        );
      case 'lightning':
        return (
          <PaymentHandler onBack={() => setCurrentSection('dashboard')} type="lightning" />
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
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Achievements</h2>
              <button 
                onClick={() => setCurrentSection('dashboard')}
                className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Back to Dashboard
              </button>
            </div>
            <p className="text-center py-12">Achievements will be displayed here.</p>
          </div>
        );
      case 'learning':
        return (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Learning Hub</h2>
              <button 
                onClick={() => setCurrentSection('dashboard')}
                className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Back to Dashboard
              </button>
            </div>
            <p className="text-center py-12">Learning content will be displayed here.</p>
          </div>
        );
      case 'manage-children':
        return (
          <ChildManagement onBack={() => setCurrentSection('dashboard')} />
        );
      default:
        return <HomePage />;
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-background to-gray-50 dark:from-background dark:to-gray-900 transition-colors duration-300'>
      <div className='max-w-md mx-auto pb-16'>
        <header className='p-4 text-center relative'>
          <div className='absolute top-4 right-4'>
            <ThemeToggle />
          </div>
          <h1 className='text-2xl font-bold'>
            BIT Toto <span className='text-muted-foreground'></span>
          </h1>
          <p className='text-muted-foreground text-sm'>
            Learn to save with Bitcoin
          </p>
          {user && (
            <div className='mt-2'>
              <span className='bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 text-xs font-medium px-2.5 py-0.5 rounded-full'>
                {isParent ? (
                  selectedChildId ? 
                  'Child View' : 'Parent Account'
                ) : 'Child Account'}
              </span>
              <span className='text-xs text-gray-500 dark:text-gray-400 ml-2'>
                {user.name}
              </span>
              {isParent && selectedChildId && (
                <button 
                  onClick={() => {
                    setSelectedChildId(null);
                    setCurrentSection('dashboard');
                    updateBalance(); // Refresh balance when returning to parent dashboard
                  }}
                  className='ml-2 text-xs text-blue-500 hover:text-blue-700'
                >
                  (Back to Family Dashboard)
                </button>
              )}
            </div>
          )}
        </header>

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