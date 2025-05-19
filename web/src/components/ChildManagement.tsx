import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import {
  ArrowLeft,
  Plus,
  User,
  Key,
  UserPlus,
  Edit,
  Trash,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

// Constants
const API_URL = 'http://localhost:3000/api';

interface ChildManagementProps {
  onBack: () => void;
}

interface Child {
  id: string;
  name: string;
  age: number;
  jarId: string;
}

const ChildManagement: React.FC<ChildManagementProps> = ({ onBack }) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingChildren, setFetchingChildren] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form states for adding a child
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childPin, setChildPin] = useState('');

  const { toast } = useToast();
  const { token, user } = useAuth();

  // Fetch children on component mount
  useEffect(() => {
    fetchChildren();
  }, []);

  // Fetch all children for the current parent
  const fetchChildren = async () => {
    if (!token) return;

    setFetchingChildren(true);

    try {
      const response = await fetch(`${API_URL}/parent/children`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch children');
      }

      const data = await response.json();
      setChildren(data.children || []);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch children accounts',
      });
    } finally {
      setFetchingChildren(false);
    }
  };

  // Handle adding a new child
  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!childName || !childAge || !childPin) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please fill in all fields',
        });
        return;
      }

      const ageValue = parseInt(childAge);
      if (isNaN(ageValue) || ageValue <= 0 || ageValue > 18) {
        toast({
          variant: 'destructive',
          title: 'Invalid Age',
          description: 'Please enter a valid age between 1 and 18',
        });
        return;
      }

      const response = await fetch(`${API_URL}/auth/create-child`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          childName,
          childAge: ageValue,
          childPin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create child account');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: `Child account created for ${childName}`,
      });

      // Reset form
      setChildName('');
      setChildAge('');
      setChildPin('');
      setIsAddDialogOpen(false);

      // Refresh children list
      fetchChildren();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create child account',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle selecting a child
  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
  };

  return (
    <div className='space-y-4 p-4 animate-fade-in'>
      <div className='flex items-center justify-between mb-4'>
        <Button variant='ghost' onClick={onBack}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Dashboard
        </Button>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className='bg-green-600 hover:bg-green-700'>
              <UserPlus className='mr-2 h-4 w-4' />
              Add Child
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Add a New Child</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddChild} className='space-y-4 mt-4'>
              <div className='space-y-2'>
                <Label htmlFor='child-name'>Child's Name</Label>
                <Input
                  id='child-name'
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder='Enter child name'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='child-age'>Age</Label>
                <Input
                  id='child-age'
                  type='number'
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  placeholder='Enter child age'
                  min='1'
                  max='18'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='child-pin'>PIN (4-6 digits)</Label>
                <Input
                  id='child-pin'
                  type='password'
                  value={childPin}
                  onChange={(e) => setChildPin(e.target.value)}
                  placeholder='Create a PIN for the child'
                  minLength={4}
                  maxLength={6}
                  pattern='[0-9]{4,6}'
                  required
                />
                <p className='text-xs text-muted-foreground'>
                  This PIN will be used by the child to log in
                </p>
              </div>

              <div className='flex justify-end space-x-2 pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={loading}>
                  {loading ? 'Creating...' : 'Create Child Account'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-xl'>Manage Children</CardTitle>
        </CardHeader>
        <CardContent>
          {fetchingChildren ? (
            <div className='flex justify-center py-8'>
              <div className='loading'></div>
            </div>
          ) : children.length === 0 ? (
            <div className='text-center py-8'>
              <User className='h-12 w-12 mx-auto text-muted-foreground opacity-50' />
              <h3 className='mt-4 text-lg font-medium'>
                No children accounts yet
              </h3>
              <p className='text-sm text-muted-foreground mt-2'>
                Add a child account to get started
              </p>
              <Button
                className='mt-4 bg-green-600 hover:bg-green-700'
                onClick={() => setIsAddDialogOpen(true)}
              >
                <UserPlus className='mr-2 h-4 w-4' />
                Add Child
              </Button>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {children.map((child) => (
                  <Card
                    key={child.id}
                    className={`cursor-pointer transition-all ${
                      selectedChild?.id === child.id
                        ? 'border-green-500 shadow-md'
                        : 'hover:border-green-200'
                    }`}
                    onClick={() => handleSelectChild(child)}
                  >
                    <CardContent className='p-4'>
                      <div className='flex justify-between items-center'>
                        <div>
                          <h3 className='font-medium'>{child.name}</h3>
                          <p className='text-sm text-muted-foreground'>
                            Age: {child.age}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            Jar ID: {child.jarId}
                          </p>
                        </div>
                        <div className='flex space-x-2'>
                          <Button size='sm' variant='outline'>
                            <Edit className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedChild && (
                <div className='mt-6 pt-6 border-t'>
                  <h3 className='text-lg font-medium mb-4'>
                    {selectedChild.name}'s Details
                  </h3>

                  <div className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <p className='text-sm font-medium'>Name</p>
                        <p className='text-muted-foreground'>
                          {selectedChild.name}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm font-medium'>Age</p>
                        <p className='text-muted-foreground'>
                          {selectedChild.age}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm font-medium'>Jar ID</p>
                        <p className='text-muted-foreground'>
                          {selectedChild.jarId}
                        </p>
                      </div>
                    </div>

                    <div className='flex space-x-2 mt-4'>
                      <Button variant='outline'>
                        <Key className='mr-2 h-4 w-4' />
                        Reset PIN
                      </Button>
                      <Button variant='destructive'>
                        <Trash className='mr-2 h-4 w-4' />
                        Remove Child
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChildManagement;
