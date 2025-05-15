import React, { useEffect, useState } from 'react';
import { createApiClient, ChildResponse } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ChildListProps {
  token: string;
}

const ChildList: React.FC<ChildListProps> = ({ token }) => {
  const [children, setChildren] = useState<ChildResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const api = createApiClient(token);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        const childrenData = await api.getChildren();
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

    fetchChildren();
  }, [token]);

  if (loading) {
    return <div className="flex justify-center p-4">Loading children data...</div>;
  }

  if (children.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Children Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You haven't added any children yet.</p>
          <Button className="mt-4" asChild>
            <Link to="/add-child">Add Child</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {children.map((child) => (
        <Card key={child.id} className="overflow-hidden">
          <CardHeader className="bg-primary/10">
            <CardTitle>{child.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Age:</span>
                <span>{child.age} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance:</span>
                <span>{child.balance} satoshis</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jar ID:</span>
                <span className="text-xs truncate">{child.jarId}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/child/${child.id}`}>View Details</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ChildList;