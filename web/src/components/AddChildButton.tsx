import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChildManagement } from '@/utils/childManagement';
import { useAuth } from '@/contexts/UserAuthContext';

interface AddChildButtonProps {
  onSuccess?: (childId: string) => void;
  buttonText?: string;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const AddChildButton: React.FC<AddChildButtonProps> = ({
  onSuccess,
  buttonText = 'Add Child',
  variant = 'default',
  size = 'default',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childPin, setChildPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createChildAccount, isParent } = useChildManagement();
  const { user } = useAuth();

  // Don't render the button if user is not a parent
  if (!user || user.role !== 'parent') {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createChildAccount({
        childName,
        childAge: parseInt(childAge),
        childPin,
      });

      if (result.success) {
        // Reset form
        setChildName('');
        setChildAge('');
        setChildPin('');

        // Close dialog
        setIsOpen(false);

        // Call onSuccess callback if provided
        if (onSuccess && result.childId) {
          onSuccess(result.childId);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <UserPlus className='mr-2 h-4 w-4' />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Child</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4 mt-4'>
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
            <Label htmlFor='child-pin'>PIN (6 digits)</Label>
            <Input
              id='child-pin'
              type='password'
              value={childPin}
              onChange={(e) => setChildPin(e.target.value)}
              placeholder='Create a PIN for the child'
              minLength={6}
              maxLength={6}
              pattern='\d{6}'
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
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Child Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddChildButton;
