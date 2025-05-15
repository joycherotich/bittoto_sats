import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import { ArrowLeft, UserPlus, Phone, Key, User, Hash } from 'lucide-react';

// Constants
const API_URL = 'http://localhost:3000/api';

interface RegisterFormProps {
  onBack: () => void;
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onBack, onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [jarId, setJarId] = useState('');
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (
        !phoneNumber ||
        !pin ||
        !confirmPin ||
        !childName ||
        !childAge ||
        !jarId
      ) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please fill in all fields',
        });
        setLoading(false);
        return;
      }

      if (pin !== confirmPin) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'PINs do not match',
        });
        setLoading(false);
        return;
      }

      // Format phone number
      // let formattedPhone = phoneNumber.replace(/\+/g, '');
      // if (formattedPhone.startsWith('0')) {
      //   formattedPhone = '254' + formattedPhone.substring(1);
      // }
      // if (!formattedPhone.startsWith('254')) {
      //   formattedPhone = '254' + formattedPhone;
      // }

      const ageValue = parseInt(childAge);
      if (isNaN(ageValue) || ageValue <= 0 || ageValue > 18) {
        toast({
          variant: 'destructive',
          title: 'Invalid Age',
          description: 'Please enter a valid age between 1 and 18',
        });
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // phoneNumber: formattedPhone,
          phoneNumber,
          pin,
          childName,
          childAge: ageValue,
          jarId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const result = await response.json();

      // Use the auth context to log in
      login(result.token, result.user);

      toast({
        title: 'Registration Successful',
        description: 'Your account has been created successfully!',
      });

      // Call the success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.message || 'Could not create account',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-4 p-4 animate-fade-in'>
      <Button variant='ghost' onClick={onBack} className='mb-4'>
        <ArrowLeft className='mr-2 h-4 w-4' />
        Back to Login
      </Button>

      <Card>
        <CardHeader className='bg-gradient-to-r from-green-500 to-emerald-500 text-white'>
          <CardTitle className='text-xl flex items-center'>
            <UserPlus className='mr-2 h-5 w-5' />
            Register New Account
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6'>
          <form onSubmit={handleRegister} className='space-y-4'>
            <div className='space-y-2'>
              <h3 className='font-medium'>Parent Information</h3>

              <div className='space-y-2'>
                <label
                  htmlFor='phone'
                  className='text-sm font-medium flex items-center'
                >
                  <Phone className='h-4 w-4 mr-2 text-green-600' />
                  Phone Number
                </label>
                <Input
                  id='phone'
                  type='text'
                  placeholder='+254712345678'
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <p className='text-xs text-muted-foreground'>
                  Enter your M-Pesa registered phone number
                </p>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <label
                    htmlFor='pin'
                    className='text-sm font-medium flex items-center'
                  >
                    <Key className='h-4 w-4 mr-2 text-green-600' />
                    PIN
                  </label>
                  <Input
                    id='pin'
                    type='password'
                    placeholder='Create PIN'
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    minLength={4}
                    maxLength={6}
                  />
                </div>

                <div className='space-y-2'>
                  <label
                    htmlFor='confirm-pin'
                    className='text-sm font-medium flex items-center'
                  >
                    <Key className='h-4 w-4 mr-2 text-green-600' />
                    Confirm PIN
                  </label>
                  <Input
                    id='confirm-pin'
                    type='password'
                    placeholder='Confirm PIN'
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    required
                    minLength={4}
                    maxLength={6}
                  />
                </div>
              </div>
            </div>

            <div className='border-t pt-4 mt-4'>
              <h3 className='font-medium mb-2'>First Child Information</h3>

              <div className='space-y-2'>
                <label
                  htmlFor='child-name'
                  className='text-sm font-medium flex items-center'
                >
                  <User className='h-4 w-4 mr-2 text-green-600' />
                  Child's Name
                </label>
                <Input
                  id='child-name'
                  type='text'
                  placeholder='Enter child name'
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  required
                />
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='child-age'
                  className='text-sm font-medium flex items-center'
                >
                  <User className='h-4 w-4 mr-2 text-green-600' />
                  Child's Age
                </label>
                <Input
                  id='child-age'
                  type='number'
                  placeholder='Enter child age'
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  required
                  min='1'
                  max='18'
                />
              </div>

              <div className='space-y-2'>
                <label
                  htmlFor='jar-id'
                  className='text-sm font-medium flex items-center'
                >
                  <Hash className='h-4 w-4 mr-2 text-green-600' />
                  Jar ID
                </label>
                <Input
                  id='jar-id'
                  type='text'
                  placeholder='Enter jar ID'
                  value={jarId}
                  onChange={(e) => setJarId(e.target.value)}
                  required
                />
                <p className='text-xs text-muted-foreground'>
                  Enter the unique ID of your child's savings jar
                </p>
              </div>
            </div>

            <div className='pt-4'>
              <Button
                type='submit'
                className='w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className='loading mr-2'></span>
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className='mr-2 h-4 w-4' />
                    Register Account
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterForm;
