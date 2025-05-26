import React, { useContext } from 'react';
import { UserAuthContext } from '@/contexts/UserAuthContext';
import ChildList from '@/components/ChildList';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import MainNav from '@/components/MainNav';

const ChildrenPage: React.FC = () => {
  const { token, user } = useContext(UserAuthContext);

  if (!token || !user) {
    return (
      <div className='container mx-auto p-4'>
        {/* <h1 className='text-2xl font-bold mb-4'>
          Please log in to view your children
        </h1> */}
        <Button asChild>
          {/* <Link to='/login'>Login</Link> */}
        </Button>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-4'>
      <MainNav />
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>My Children</h1>
        <Button asChild>
          {/* <Link to='/add-child'>
            <PlusCircle className='mr-2 h-4 w-4' />
            Add Child
          </Link> */}
        </Button>
      </div>

      <ChildList token={token} />
    </div>
  );
};

export default ChildrenPage;
