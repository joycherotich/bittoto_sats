import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useChildManagement } from '@/utils/childManagement';
import AddChildButton from './AddChildButton';

interface Child {
  id: string;
  name: string;
  age: number;
  jarId: string;
}

const ChildList: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getChildren } = useChildManagement();

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const childrenData = await getChildren();
      setChildren(childrenData);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load children data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDashboard = (childId: string) => {
    // Navigate to the main page with state indicating which child to view
    navigate('/', {
      state: {
        selectedChildId: childId,
        viewChild: true,
      },
    });
  };

  const handleChildAdded = () => {
    // Refresh the children list
    fetchChildren();
  };

  if (loading) {
    return <div className='text-center py-8'>Loading children...</div>;
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-end mb-4'>
        <AddChildButton
          onSuccess={handleChildAdded}
          className='bg-green-600 hover:bg-green-700'
        />
      </div>

      {children.length === 0 ? (
        <div className='text-center py-8'>
          <p className='text-lg mb-4'>No children accounts yet</p>
          <AddChildButton
            buttonText='Create Your First Child Account'
            onSuccess={handleChildAdded}
            size='lg'
            className='bg-green-600 hover:bg-green-700'
          />
        </div>
      ) : (
        children.map((child) => (
          <Card key={child.id} className='mb-4'>
            <CardContent className='p-6'>
              <div className='flex justify-between items-center'>
                <div>
                  <h3 className='text-lg font-semibold'>{child.name}</h3>
                  <p className='text-sm text-gray-500'>Age: {child.age}</p>
                  <p className='text-xs text-gray-400'>Jar ID: {child.jarId}</p>
                </div>
                <Button
                  onClick={() => handleViewDashboard(child.id)}
                  className='bg-amber-500 hover:bg-amber-600'
                >
                  View Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default ChildList;
