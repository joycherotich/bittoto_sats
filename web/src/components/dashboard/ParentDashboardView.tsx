import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  History,
  Star,
  Settings,
  Users,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  onShowHistory: () => void;
  onShowGoals: () => void;
  onViewChildDashboard: (childId: string) => void;
  handleApproveGoal: (goalId: string) => void;
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
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [childrenWithDetails, setChildrenWithDetails] = useState<ChildData[]>(
    []
  );

  useEffect(() => {
    console.log('ParentDashboardView received children:', children);
    if (Array.isArray(children) && children.length > 0) {
      setChildrenWithDetails(children);
    }
  }, [children]);

  const handleSelectPayment = (childId: string) => {
    console.log('Navigating to payment selection for child:', childId);
    navigate(`/payment/select/${childId}`);
  };

  return (
    <div className='space-y-6 p-4 sm:p-6 max-w-7xl mx-auto'>
      <div className='mt-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Family Dashboard</h1>
        <p className='text-gray-600 text-sm mt-1'>
          Manage your children's savings jars and approve their goals
        </p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
        {onManageChildren && (
          <Button
            variant='outline'
            className='w-full bg-white text-purple-600 border-purple-500 hover:bg-purple-50'
            onClick={onManageChildren}
          >
            <Users className='mr-2 h-4 w-4' />
            Manage Children
          </Button>
        )}
        <Link to='/parental-controls' className='w-full'>
          <Button
            variant='outline'
            className='w-full bg-white text-purple-600 border-purple-500 hover:bg-purple-50'
          >
            <Settings className='mr-2 h-4 w-4' />
            Parental Controls
          </Button>
        </Link>
      </div>

      <Card className='shadow-sm border-gray-200'>
        <CardHeader>
          <CardTitle className='text-xl font-semibold text-gray-800'>
            Children's Savings Jars
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingChildren ? (
            <div className='flex justify-center py-6'>
              <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-amber-500'></div>
            </div>
          ) : !Array.isArray(childrenWithDetails) ||
            childrenWithDetails.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-gray-500 text-sm'>
                No savings jars found for your children.
              </p>
              {onManageChildren && (
                <Button
                  variant='outline'
                  className='mt-4 text-amber-600 border-amber-600 hover:bg-amber-50'
                  onClick={onManageChildren}
                >
                  <Users className='mr-2 h-4 w-4' />
                  Add Child Account
                </Button>
              )}
            </div>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {childrenWithDetails.map((child) => (
                <Card
                  key={child.id}
                  className='bg-white hover:bg-gray-50 transition-colors border-gray-100'
                >
                  <CardContent className='p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                    <div className='flex items-center space-x-4'>
                      <div className='bg-amber-100 p-2 rounded-full flex-shrink-0'>
                        <img
                          src='/favicon.png'
                          alt='Savings Jar'
                          className='h-8 w-8 object-contain'
                        />
                      </div>
                      <div>
                        {/* <h3 className='font-medium text-gray-900'>
                          {child.name || 'Unknown'}
                        </h3> */}
                        <p className='text-sm text-gray-500'>
                          Jar ID: {child.jarId || 'N/A'}
                          {/* Age: {child.age || 'Unknown'} | */}
                        </p>
                        {/* <p className='text-sm font-semibold text-gray-700 mt-1'>
                          Balance: KES {child.balance?.toFixed(2) || '0.00'}
                        </p> */}
                      </div>
                    </div>
                    <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-amber-600 hover:text-amber-700 hover:bg-amber-50 w-full sm:w-auto'
                        onClick={() => {
                          console.log('Viewing child dashboard:', child.id);
                          onViewChildDashboard(child.id);
                        }}
                      >
                        View Dashboard
                        <ArrowRight className='ml-2 h-4 w-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        className='text-blue-600 border-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full sm:w-auto'
                        onClick={() => handleSelectPayment(child.id)}
                      >
                        Add Funds
                        <Wallet className='ml-2 h-4 w-4' />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className='mt-6 shadow-sm border-gray-200'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='text-xl font-semibold text-gray-800'>
            Pending Goals for Approval
          </CardTitle>
          <Button
            variant='outline'
            size='sm'
            className='text-amber-600 border-amber-600 hover:bg-amber-50'
            onClick={onShowGoals}
          >
            <Star className='mr-2 h-4 w-4' />
            Manage All Goals
          </Button>
        </CardHeader>
        <CardContent>
          {pendingGoals.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-gray-500 text-sm'>
                No pending goals require approval
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {pendingGoals.map((goal) => (
                <div
                  key={goal.id}
                  className='bg-amber-50 p-4 rounded-lg border border-amber-100'
                >
                  <div className='flex justify-between items-start'>
                    <div className='flex items-center space-x-3'>
                      <div className='bg-amber-100 p-1 rounded-full flex-shrink-0'>
                        <img
                          src='/favicon.png'
                          alt='Goal Jar'
                          className='h-6 w-6 object-contain'
                        />
                      </div>
                      <div>
                        <h3 className='font-medium text-gray-900'>
                          {goal.name}
                          {goal.childName && (
                            <span className='ml-2 text-sm text-gray-500'>
                              ({goal.childName})
                            </span>
                          )}
                        </h3>
                        <p className='text-sm text-gray-500'>
                          Jar ID: {goal.jarId || 'N/A'}
                        </p>
                        <p className='text-sm text-gray-500 mt-1'>
                          Target: {goal.target} sats
                        </p>
                      </div>
                    </div>
                    <Button
                      size='sm'
                      onClick={() => handleApproveGoal(goal.id)}
                      className='bg-green-500 hover:bg-green-600 text-white'
                    >
                      Approve
                    </Button>
                  </div>
                  <div className='mt-3'>
                    <div className='flex justify-between text-xs text-gray-500 mb-1'>
                      <span>Progress</span>
                      <span>
                        {Math.round((goal.current / goal.target) * 100)}%
                      </span>
                    </div>
                    <div className='bg-gray-200 h-2 rounded-full overflow-hidden'>
                      <div
                        className='bg-amber-500 h-full'
                        style={{
                          width: `${Math.round(
                            (goal.current / goal.target) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className='mt-6 shadow-sm border-gray-200'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle className='text-xl font-semibold text-gray-800'>
            Recent Activity
          </CardTitle>
          <Button
            variant='outline'
            size='sm'
            className='text-amber-600 border-amber-600 hover:bg-amber-50'
            onClick={onShowHistory}
          >
            <History className='mr-2 h-4 w-4' />
            View All
          </Button>
        </CardHeader>
        <CardContent className='p-4'>
          {childrenWithDetails.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-gray-500 text-sm'>No recent activity</p>
            </div>
          ) : (
            <ul className='space-y-3'>
              {childrenWithDetails.map((child) => (
                <li
                  key={`activity-${child.id}`}
                  className='p-3 bg-gray-50 rounded-md flex justify-between items-center'
                >
                  <div className='flex items-center space-x-3'>
                    <div className='bg-amber-100 p-1 rounded-full flex-shrink-0'>
                      <img
                        src='/favicon.png'
                        alt='Activity Jar'
                        className='h-6 w-6 object-contain'
                      />
                    </div>
                    <div>
                      <p className='font-medium text-gray-900'>
                        {child.name || 'Unknown'}’s Jar
                      </p>
                      <p className='text-xs text-gray-500'>
                        Jar ID: {child.jarId || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {/* <span className='text-emerald-600 font-semibold text-sm'>
                    KES {child.balance?.toFixed(2) || '0.00'}
                  </span> */}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentDashboardView;
