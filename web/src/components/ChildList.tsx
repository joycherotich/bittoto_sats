import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useChildManagement } from '@/utils/childManagement';
import AddChildButton from './AddChildButton';
import MainNav from './MainNav';

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
    <div className="min-h-screen bg-[#f9fafb] md:ml-56 p-4 sm:p-6 md:p-8 transition-all">
       <header className="fixed top-0 left-0 right-0 z-50 bg-yellow-600 shadow-md md:ml-56">
    <div className="max-w-full md:max-w-[calc(100%-14rem)] mx-auto flex justify-between items-center px-6 py-4">
      <div className="text-2xl font-serif font-bold text-white">Children</div>
   
    </div>
  </header>
    {/* Top Action Bar */}
    <div className="flex justify-end mb-6">
      <AddChildButton
        onSuccess={handleChildAdded}
        className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-semibold px-5 py-2 rounded-xl shadow transition-all duration-300"
      />
    </div>
  
    {/* Empty State */}
    {children.length === 0 ? (
      <div className="text-center bg-white p-10 rounded-2xl shadow-md">
        <p className="text-xl font-semibold text-gray-700 mb-6">
          No Child Accounts Yet
        </p>
        <AddChildButton
          buttonText="Create Your First Child Account"
          onSuccess={handleChildAdded}
          size="lg"
          className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-semibold px-6 py-3 rounded-xl shadow transition duration-300"
        />
      </div>
    ) : (
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {children.map((child) => (
          <div
            key={child.id}
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-xl font-serif font-bold text-gray-800">{child.name}</h3>
              <p className="text-m font-serif text-gray-600 mt-1">Age: {child.age}</p>
              <p className="text-sm font-serif text-gray-400 mt-1">Jar ID: {child.jarId}</p>
            </div>
            <div className="mt-6">
              <Button
                onClick={() => handleViewDashboard(child.id)}
                className="w-full text-xl font-serif bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg transition duration-300"
              >
                View Dashboard
              </Button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
  
  
  
  
  
  );
};

export default ChildList;
