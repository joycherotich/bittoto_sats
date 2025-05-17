import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import { ArrowLeft, UserPlus, Phone, Key } from 'lucide-react';

// Use Vite environment variables
const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3000/api';

interface RegisterFormProps {
  onBack: () => void;
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onBack, onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      if (!phoneNumber || !pin || !confirmPin) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please fill in all fields',
        });
        return;
      }

      if (pin !== confirmPin) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'PINs do not match',
        });
        return;
      }

      // Validate PIN (6 digits)
      if (pin.length !== 6 || !/^\d+$/.test(pin)) {
        toast({
          variant: 'destructive',
          title: 'Invalid PIN',
          description: 'PIN must be exactly 6 digits',
        });
        return;
      }

      // Validate phone number
      const phoneRegex = /^\+2547\d{8}$/;
      if (!phoneRegex.test(phoneNumber)) {
        toast({
          variant: 'destructive',
          title: 'Invalid Phone Number',
          description: 'Phone number must be in the format +2547XXXXXXXX',
        });
        return;
      }

      // Register parent
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          pin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const result = await response.json();
      const { token, userId } = result;

      // Log in parent
      login(token, { id: userId, phoneNumber, role: 'parent' });

      toast({
        title: 'Registration Successful',
        description:
          'Your parent account has been created! You can now add children from your dashboard.',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Registration error:', error.message);
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
            Register Parent Account
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
                  Enter your M-Pesa registered phone number (e.g.,
                  +254712345678)
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
                    placeholder='Create 6-digit PIN'
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    minLength={6}
                    maxLength={6}
                    pattern='\d*'
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
                    placeholder='Confirm 6-digit PIN'
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    required
                    minLength={6}
                    maxLength={6}
                    pattern='\d*'
                  />
                </div>
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
