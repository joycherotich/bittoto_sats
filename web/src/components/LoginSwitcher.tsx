import React, { useState } from 'react';
// import ChildLogin from './ChildLogin';
// import ParentLogin from './ParentLogin'; // You'll need to create this
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const LoginSwitcher: React.FC = () => {
  const [mode, setMode] = useState<'child' | 'parent'>('child');

  return (
    <div className="p-4 max-w-md mx-auto animate-fade-in">
      <Card className="shadow-lg border-2 border-blue-300 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-400 to-purple-500 text-white flex justify-between items-center">
          <CardTitle className="text-xl">
            {mode === 'child' ? "Kid's Login Zone" : "Parent Login Zone"}
          </CardTitle>

          <div className="space-x-2">
            <Button
              variant={mode === 'parent' ? 'secondary' : 'ghost'}
              onClick={() => setMode('parent')}
              size="sm"
            >
              I'm a Parent
            </Button>
            <Button
              variant={mode === 'child' ? 'secondary' : 'ghost'}
              onClick={() => setMode('child')}
              size="sm"
            >
              I'm a Kid
            </Button>
          </div>
        </CardHeader>

        <CardContent className="bg-gradient-to-b from-blue-50 to-white p-4">
          {mode === 'child' ? (
            <ChildLogin onBack={() => setMode('parent')} />
          ) : (
            <ParentLogin onBack={() => setMode('child')} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginSwitcher;
