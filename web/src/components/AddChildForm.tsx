import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';

interface AddChildFormProps {
  onSuccess?: (childId: string) => void;
  onCancel?: () => void;
  redirectAfterSuccess?: boolean;
  standalone?: boolean;
}

const AddChildForm: React.FC<AddChildFormProps> = ({
  onSuccess,
  onCancel,
  redirectAfterSuccess = true,
  standalone = true,
}) => {
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childPin, setChildPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { api, token } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!api) {
        throw new Error('API client not available');
      }

      if (!childName || !childAge || !childPin) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please fill in all fields',
        });
        setIsSubmitting(false);
        return;
      }

      const ageValue = parseInt(childAge);
      if (isNaN(ageValue) || ageValue <= 0 || ageValue > 18) {
        toast({
          variant: 'destructive',
          title: 'Invalid Age',
          description: 'Please enter a valid age between 1 and 18',
        });
        setIsSubmitting(false);
        return;
      }

      // Validate PIN - must be exactly 6 digits
      if (childPin.length !== 6 || !/^\d+$/.test(childPin)) {
        toast({
          variant: 'destructive',
          title: 'Invalid PIN',
          description: 'PIN must be exactly 6 digits',
        });
        return;
      }

      const result = await api.createChildAccount(
        {
          childName,
          childAge: ageValue,
          childPin,
        },
        token || ''
      );

      toast({
        title: 'Success',
        description: `Child account created for ${childName}`,
      });

      // Reset form
      setChildName('');
      setChildAge('');
      setChildPin('');

      // Call onSuccess callback if provided
      if (onSuccess && result.childId) {
        onSuccess(result.childId);
      }

      // Redirect to children page if redirectAfterSuccess is true
      if (redirectAfterSuccess) {
        navigate('/children');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create child account',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className='space-y-4'>
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
        <Label htmlFor='child-age'>Child's Age</Label>
        <Input
          id='child-age'
          type='number'
          min='1'
          max='18'
          value={childAge}
          onChange={(e) => setChildAge(e.target.value)}
          placeholder='Enter age (1-18)'
          required
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='child-pin'>Child's PIN (6 digits)</Label>
        <Input
          id='child-pin'
          type='password'
          pattern='\d{6}'
          maxLength={6}
          value={childPin}
          onChange={(e) => setChildPin(e.target.value)}
          placeholder='Enter 6-digit PIN'
          required
        />
        <p className='text-xs text-muted-foreground'>
          This PIN will be used by your child to log in to their account.
        </p>
      </div>
      <div className='flex justify-end space-x-2 pt-4'>
        {onCancel && (
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Child Account'}
        </Button>
      </div>
    </form>
  );

  if (!standalone) {
    return formContent;
  }

  return (
    <Card className='max-w-md mx-auto'>
      <CardHeader>
        <div className='flex items-center'>
          <Button variant='ghost' onClick={() => navigate(-1)} className='mr-2'>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <CardTitle>Add a New Child</CardTitle>
        </div>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
};

export default AddChildForm;
