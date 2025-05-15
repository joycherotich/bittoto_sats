import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import { LogIn, User, Phone, Key, UserPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Constants
const API_URL = 'http://localhost:3000/api';

interface LoginFormProps {
  onRegister?: () => void;
  onChildLogin?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onRegister, onChildLogin }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!phoneNumber || !pin) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please fill in all fields',
        });
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

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // phoneNumber: formattedPhone,
          phoneNumber,
          pin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const result = await response.json();
      // Use the auth context to log in
      login(result.token, result.user);

      // Show welcome message with child's name if available
      if (result.user.role === 'parent' && result.user.childProfile?.name) {
        toast({
          title: 'Login Successful',
          description: `Welcome back! ${result.user.childProfile.name}'s account is ready.`,
        });
      } else {
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${result.user.name || 'Parent'}!`,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'Invalid phone number or PIN',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='w-full max-w-md mx-auto shadow-lg'>
      <CardHeader className='bg-gradient-to-r from-amber-500 to-orange-500 text-white'>
        <CardTitle className='text-xl flex items-center'>
          <User className='mr-2 h-5 w-5' />
          Parent Login
        </CardTitle>
      </CardHeader>
      <CardContent className='p-6'>
        <form onSubmit={handleLogin} className='space-y-4'>
          <div className='space-y-2'>
            <label
              htmlFor='phone'
              className='text-sm font-medium flex items-center'
            >
              <Phone className='h-4 w-4 mr-2 text-amber-600' />
              Phone Number
            </label>
            <Input
              id='phone'
              type='text'
              placeholder='+254712345678'
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className='border-amber-200 focus:border-amber-500'
            />
            <p className='text-xs text-muted-foreground'>
              Enter the phone number registered with your account
            </p>
          </div>

          <div className='space-y-2'>
            <label
              htmlFor='pin'
              className='text-sm font-medium flex items-center'
            >
              <Key className='h-4 w-4 mr-2 text-amber-600' />
              PIN
            </label>
            <Input
              id='pin'
              type='password'
              placeholder='Enter your PIN'
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              className='border-amber-200 focus:border-amber-500'
            />
          </div>

          <div className='pt-4'>
            <Button
              type='submit'
              className='w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className='loading mr-2'></span>
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className='mr-2 h-4 w-4' />
                  Login as Parent
                </>
              )}
            </Button>
          </div>

          <div className='flex flex-col space-y-2 mt-4 pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={onChildLogin}
              className='w-full border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all'
            >
              <div className='flex items-center justify-center w-full'>
                <div className='bg-blue-500 text-white p-1 rounded-full mr-2'>
                  <User className='h-4 w-4' />
                </div>
                <span>Child Login</span>
                <span className='ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full'>
                  For Kids
                </span>
              </div>
            </Button>

            <Button
              type='button'
              variant='link'
              onClick={onRegister}
              className='w-full text-green-600 hover:text-green-700'
            >
              <UserPlus className='mr-2 h-4 w-4' />
              Register New Account
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
