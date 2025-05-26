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
import MainNav from './MainNav';

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
    <div className="min-bg-[#f9fafb] md:ml-56 p-4 sm:p-6 md:p-8 transition-all">
  
    {/* <MainNav />       */}
    <header className="fixed top-0 left-0 right-0 z-50 bg-yellow-600 shadow-md md:ml-56">
        <div className="max-w-full md:max-w-[calc(100%-14rem)] mx-auto flex justify-between items-center px-6 py-4">
          <div className="text-2xl font-serif font-bold text-white">Children</div>
       
        </div>
      </header>
  {/* Main Content */}
  <main className="flex-1 mt-20 px-4 sm:px-6 md:px-8 lg:px-12">
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Child</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAddChild} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="child-name">Child's Name</Label>
            <Input
              id="child-name"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Enter child name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="child-age">Age</Label>
            <Input
              id="child-age"
              type="number"
              value={childAge}
              onChange={(e) => setChildAge(e.target.value)}
              placeholder="Enter child age"
              min="1"
              max="18"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="child-pin">PIN (4-6 digits)</Label>
            <Input
              id="child-pin"
              type="password"
              value={childPin}
              onChange={(e) => setChildPin(e.target.value)}
              placeholder="Create a PIN for the child"
              minLength={4}
              maxLength={6}
              pattern="[0-9]{4,6}"
              required
            />
            <p className="text-xs text-muted-foreground">
              This PIN will be used by the child to log in
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Child Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Card Section */}
    <div className="w-full max-w-7xl mx-auto mt-6">
      <div className="flex justify-end mb-4">
        {children.length > 0 && (
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Child
          </Button>
        )}
      </div>

      <Card className="bg-white shadow rounded-lg p-4">
        <CardContent>
          {fetchingChildren ? (
            <div className="flex justify-center py-8">
              <div className="loading"></div>
            </div>
          ) : children.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No children accounts yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Add a child account to get started
              </p>
              <Button
                className="mt-4 bg-green-600 hover:bg-green-700"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Child
              </Button>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Children Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{child.name}</h3>
                          <p className="text-sm text-muted-foreground">Age: {child.age}</p>
                          <p className="text-xs text-muted-foreground">Jar ID: {child.jarId}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Selected Child Details */}
              {selectedChild && (
                <div className="pt-6 border-t bg-[#f9fafb] p-4 sm:p-6 md:p-8 transition-all">
                  <h3 className="text-lg font-medium mb-4 text-center">
                    {selectedChild.name}'s Details
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Name</p>
                        <p className="text-muted-foreground">{selectedChild.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Age</p>
                        <p className="text-muted-foreground">{selectedChild.age}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Jar ID</p>
                        <p className="text-muted-foreground">{selectedChild.jarId}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      <Button variant="outline">
                        <Key className="mr-2 h-4 w-4" />
                        Reset PIN
                      </Button>
                      <Button variant="destructive">
                        <Trash className="mr-2 h-4 w-4" />
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
  </main>
</div>





  );
};

export default ChildManagement;
