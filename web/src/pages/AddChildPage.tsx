import React from 'react';
import { useNavigate } from 'react-router-dom';
import AddChildForm from '@/components/AddChildForm';
import { useAuth } from '@/contexts/UserAuthContext';

const AddChildPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to login if not authenticated or not a parent
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'parent') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSuccess = () => {
    navigate('/children');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <AddChildForm 
        onSuccess={handleSuccess}
        onCancel={() => navigate('/children')}
      />
    </div>
  );
};

export default AddChildPage;