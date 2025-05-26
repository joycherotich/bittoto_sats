import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import { ArrowLeft, LogIn, User, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Use Vite's environment variable syntax
const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3000/api';

interface ChildLoginProps {
  onBack: () => void;
}

const ChildLogin: React.FC<ChildLoginProps> = ({ onBack }) => {
  const [jarId, setJarId] = useState('');
  const [childPin, setChildPin] = useState('');
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChildLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!jarId || !childPin) {
        toast({
          variant: 'destructive',
          title: 'Oops!',
          description: 'Please fill in both Jar ID and PIN',
        });
        return;
      }

      console.log('Attempting child login with:', { jarId, childPin });

      const response = await fetch(`${API_URL}/auth/child-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jarId, childPin }),
      });

      console.log('Child login response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Child login error:', errorData);
        throw new Error(errorData.error || 'Login failed');
      }

      const result = await response.json();
      console.log('Child login result:', result);

      if (!result.token || !result.user) {
        throw new Error('Invalid response: Missing token or user data');
      }

      login(result.token, result.user);
      console.log('Login called with:', {
        token: result.token.substring(0, 15) + '...',
        user: result.user,
      });

      // Navigate to payment page
      navigate('/payment/lightning');

      toast({
        title: "🎉 Yay! You're in!",
        description: `Welcome back, ${result.user.name}! Ready to save?`,
      });
    } catch (error: any) {
      console.error('Child login failed:', error.message);
      toast({
        variant: 'destructive',
        title: 'Oops! Something went wrong',
        description:
          error.message || 'Your Jar ID or PIN might be incorrect. Try again!',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=''>
    <div className=''>
  
      {/* Image Section */}
    
  
      {/* Login Form Section */}
      <div className='w-full '>
        <Card className='border-none shadow-none rounded-none'>
          <CardHeader className='bg-gradient-to-r from-blue-500 to-purple-500 text-white p-5'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-xl flex items-center font-bold'>
                <div className='bg-white text-blue-500 p-2 rounded-full mr-2'>
                  <User className='h-5 w-5' />
                </div>
                Kid's Login Zone
              </CardTitle>
              <div className='flex space-x-1'>
                {[1, 2, 3].map((star) => (
                  <div
                    key={star}
                    className='text-yellow-300 text-xl animate-bounce'
                    style={{ animationDelay: `${star * 0.2}s` }}
                  >
                    ★
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
  
          <CardContent className='bg-white p-6'>
            <div className='text-center mb-6'>
              <h3 className='text-blue-600 font-bold text-lg'>Hello, Saver!</h3>
              <p className='text-sm text-blue-500'>Log in to see your savings jar</p>
            </div>
  
            <form onSubmit={handleChildLogin} className='space-y-4'>
              <div className='space-y-2'>
                <label
                  htmlFor='jar-id'
                  className='text-sm font-medium text-blue-700 flex items-center'
                >
                  <User className='h-4 w-4 mr-2 text-blue-600' />
                  Jar ID
                </label>
                <Input
                  id='jar-id'
                  value={jarId}
                  onChange={(e) => setJarId(e.target.value)}
                  placeholder='Enter your Jar ID'
                  required
                  className='w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400'
                />
              </div>
  
              <div className='space-y-2'>
                <label
                  htmlFor='child-pin'
                  className='text-sm font-medium text-blue-700 flex items-center'
                >
                  <Key className='h-4 w-4 mr-2 text-blue-600' />
                  Secret PIN
                </label>
                <Input
                  id='child-pin'
                  type='password'
                  value={childPin}
                  onChange={(e) => setChildPin(e.target.value)}
                  placeholder='Enter your PIN'
                  required
                  className='w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400'
                />
              </div>
  
              <Button
                type='submit'
                className='w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition'
                disabled={loading}
              >
                {loading ? (
                  <span className='flex items-center justify-center'>
                    <span className='loader mr-2'></span> Opening your jar...
                  </span>
                ) : (
                  <span className='flex items-center justify-center'>
                    <LogIn className='mr-2 h-4 w-4' />
                    Let's Go!
                  </span>
                )}
              </Button>
            </form>
  
            <div className='flex justify-center mt-6 space-x-3'>
              {['🚀', '💰', '🎮', '🎯'].map((emoji, index) => (
                <span
                  key={index}
                  className='text-2xl animate-bounce'
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {emoji}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  
  );
};

export default ChildLogin;
