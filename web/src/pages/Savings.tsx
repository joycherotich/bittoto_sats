import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/UserAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SavingsPlans from '@/components/savings/SavingsPlans';
import SavingsHistory from '@/components/savings/SavingsHistory';
import SavingsSummary from '@/components/savings/SavingsSummary';
import GoalSetting from '@/components/GoalSetting';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';
import MainNav from '@/components/MainNav';

interface Child {
  id: string;
  name: string;
}

const DebugInfo = ({
  user,
  isParent,
  isChild,
  selectedChildId,
  children,
  activeTab,
}) => {
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className='bg-gray-100 dark:bg-gray-800 p-2 mb-4 rounded text-xs'>
      <MainNav />
      <details>
        <summary className='cursor-pointer font-medium'>Debug Info</summary>
        <div className='mt-2 space-y-1'>
          <div>User Role: {user?.role || 'Not logged in'}</div>
          <div>Is Parent: {isParent ? 'Yes' : 'No'}</div>
          <div>Is Child: {isChild ? 'Yes' : 'No'}</div>
          <div>Selected Child ID: {selectedChildId || 'None'}</div>
          <div>Children Count: {children.length}</div>
          <div>Children IDs: {children.map((c) => c.id).join(', ')}</div>
          <div>Active Tab: {activeTab}</div>
        </div>
      </details>
    </div>
  );
};

const SavingsPage: React.FC = () => {
  const { user, api } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);

  const isParent = user?.role === 'parent';
  const isChild = user?.role === 'child';

  // Get childId from location state if available
  useEffect(() => {
    if (location.state && location.state.childId) {
      setSelectedChildId(location.state.childId);
    }
  }, [location.state]);

  // Fetch children if user is a parent
  useEffect(() => {
    const fetchChildren = async () => {
      if (!isParent || !api) return;

      setLoading(true);
      try {
        console.log('Fetching children for parent');
        let childrenData;

        // Try to get children from the API
        try {
          childrenData = await api.getChildren();
          console.log('Children data from API:', childrenData);
        } catch (apiError) {
          console.error('Error fetching children from API:', apiError);
          // Fallback to direct fetch if API method fails
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/parent/children`,
            {
              headers: {
                Authorization: `Bearer ${user?.token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch children: ${response.status}`);
          }

          const data = await response.json();
          childrenData = data.children || [];
          console.log('Children data from direct fetch:', childrenData);
        }

        // Make sure we have an array of children with required properties
        if (Array.isArray(childrenData) && childrenData.length > 0) {
          // Ensure each child has id and name properties
          const validChildren = childrenData.filter(
            (child) =>
              child && typeof child === 'object' && child.id && child.name
          );

          console.log('Valid children for dropdown:', validChildren);
          setChildren(validChildren);

          // If no child is selected and we have children, select the first one
          if (!selectedChildId && validChildren.length > 0) {
            console.log(
              'Setting selected child to first child:',
              validChildren[0].id
            );
            setSelectedChildId(validChildren[0].id);
          }
        } else {
          console.log('No valid children data found');
          setChildren([]);
        }
      } catch (error) {
        console.error('Error in fetchChildren:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load children',
          description: 'Please try again later',
        });
        setChildren([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [api, isParent, toast, user?.token]); // Removed selectedChildId from dependencies

  // Debug information
  console.log('Rendering SavingsPage', {
    user,
    isParent,
    isChild,
    activeTab,
    selectedChildId,
  });

  const handleChildChange = (childId: string) => {
    console.log('Child selected:', childId);
    if (childId && childId !== selectedChildId) {
      setSelectedChildId(childId);

      // Reset active tab when changing child
      setActiveTab('summary');

      // Log the change for debugging
      const selectedChild = children.find((child) => child.id === childId);
      console.log('Selected child:', selectedChild);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const SavingsHelpCard = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Card className='mb-6'>
        <CardHeader className='pb-3'>
          <div className='flex justify-between items-center'>
            <CardTitle>Savings Features</CardTitle>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsOpen(!isOpen)}
              className='h-8 w-8 p-0'
            >
              {isOpen ? (
                <ChevronUp className='h-4 w-4' />
              ) : (
                <ChevronDown className='h-4 w-4' />
              )}
              <span className='sr-only'>
                {isOpen ? 'Hide details' : 'Show details'}
              </span>
            </Button>
          </div>
          <CardDescription>
            <Button
              variant='link'
              className='p-0 h-auto text-sm text-muted-foreground'
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen
                ? 'Hide explanation'
                : 'Click to understand the difference between goals and plans'}
            </Button>
          </CardDescription>
        </CardHeader>

        {isOpen && (
          <CardContent>
            <div className='space-y-4'>
              <div>
                <h3 className='font-semibold'>Savings Goals</h3>
                <p className='text-sm text-muted-foreground'>
                  Goals are targets you want to save for, like a new bike or
                  game. Set a target amount and track your progress.
                </p>
              </div>
              <div>
                <h3 className='font-semibold'>Automatic Savings Plans</h3>
                <p className='text-sm text-muted-foreground'>
                  Plans are automatic transfers that happen regularly (daily,
                  weekly, or monthly) to help you save consistently. You can
                  link a plan to a goal to automatically save toward that
                  specific goal.
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className='container mx-auto py-6 space-y-4'>
      <div className='flex justify-between items-center'>
      <header className="fixed top-0 left-0 right-0 z-50 bg-yellow-600 shadow-md md:ml-56">
    <div className="max-w-full md:max-w-[calc(100%-14rem)] mx-auto flex justify-between items-center px-6 py-4">
      <div className="text-2xl font-serif font-bold text-white">Savings</div>
   
    </div>
  </header>
        <div className='w-10'></div> {/* Empty div for flex spacing */}
      </div>

      {/* Debug component - only render in development */}
      {process.env.NODE_ENV !== 'production' && (
        <DebugInfo
          user={user}
          isParent={isParent}
          isChild={isChild}
          selectedChildId={selectedChildId}
          children={children}
          activeTab={activeTab}
        />
      )}

      {/* Child selector for parents */}
      {isParent && (
    <div className="">
    <Card className="w-full max-w-2xl mx-auto mb-2">
      <CardHeader>
        <CardTitle className="text-lg">Select Child</CardTitle>
        <CardDescription>
          Choose which child's savings to manage
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-amber-500 rounded-full border-t-transparent"></div>
            <span className="text-sm text-muted-foreground">
              Loading children...
            </span>
          </div>
        ) : children.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No children found. Please add a child first.
            </p>
            <Button
              onClick={() => navigate('/children')}
              variant="outline"
              className="w-full"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Child
            </Button>
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground mb-2">
              Found {children.length} children
            </div>
  
            {/* Dropdown */}
            <div className="relative">
              <Select
                value={selectedChildId || ''}
                onValueChange={handleChildChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a child">
                    {selectedChildId
                      ? children.find((c) => c.id === selectedChildId)?.name || 'Select a child'
                      : 'Select a child'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
  
            {/* Fallback buttons */}
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">Or select directly:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant={selectedChildId === child.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChildChange(child.id)}
                    className={
                      selectedChildId === child.id
                        ? 'bg-amber-500 hover:bg-amber-600'
                        : ''
                    }
                  >
                    {child.name}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  </div>
  
      )}

      {/* Only show tabs if we have a valid child (either the logged-in child or a selected child for parents) */}
      {(isChild || (isParent && selectedChildId)) && (
       <div className="p-4 sm:p-6 md:p-8 md:ml-56 min-h-screen bg-[#f9fafb]">
       <div className="w-full max-w-5xl mx-auto">
         <SavingsHelpCard />
     
         <Tabs value={activeTab} onValueChange={setActiveTab}>
           <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 overflow-x-auto">
             {isChild && <TabsTrigger value="summary">Summary</TabsTrigger>}
             <TabsTrigger value="plans">Automatic Plans</TabsTrigger>
             <TabsTrigger value="goals">Savings Goals</TabsTrigger>
             <TabsTrigger value="history">History</TabsTrigger>
           </TabsList>
     
           {isChild && (
             <TabsContent value="summary" className="mt-6">
               <SavingsSummary />
             </TabsContent>
           )}
     
           <TabsContent value="plans" className="mt-6">
             <div className="mb-4">
               <h2 className="text-xl font-semibold">Automatic Savings Plans</h2>
               <p className="text-sm text-muted-foreground">
                 Set up recurring transfers to automatically save toward your goals
               </p>
             </div>
             <SavingsPlans
               childId={isParent ? selectedChildId || undefined : undefined}
             />
           </TabsContent>
     
           <TabsContent value="goals" className="mt-6">
             <div className="mb-4">
               <h2 className="text-xl font-semibold">Savings Goals</h2>
               <p className="text-sm text-muted-foreground">
                 Create and track progress toward your savings targets
               </p>
             </div>
             <GoalSetting
               childId={isParent ? selectedChildId || undefined : undefined}
               onBack={() => {}}
             />
           </TabsContent>
     
           <TabsContent value="history" className="mt-6">
             <SavingsHistory
               childId={isParent ? selectedChildId || undefined : undefined}
               onBack={() => setActiveTab('summary')}
             />
           </TabsContent>
         </Tabs>
       </div>
     </div>
     
      )}

      {/* Show message if parent has no children */}
      {isParent && children.length === 0 && !loading && (
        <div className="p-4 sm:p-6 md:p-8 md:ml-56 min-h-screen bg-[#f9fafb]">
  <div className="max-w-md mx-auto">
    <Card>
      <CardContent className="py-8 text-center">
        <p className="mb-4 text-sm sm:text-base text-muted-foreground">
          You need to add a child before you can manage savings plans.
        </p>
        <Button onClick={() => navigate('/children')}>Manage Children</Button>
      </CardContent>
    </Card>
  </div>
</div>

      )}
    </div>
  );
};

export default SavingsPage;
