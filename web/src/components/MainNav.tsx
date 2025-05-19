import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserAuthContext } from '@/contexts/UserAuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Home, Users, Settings, LogOut, PiggyBank } from 'lucide-react';

const MainNav: React.FC = () => {
  const { isAuthenticated, logout, isParent } = useContext(UserAuthContext);
  const location = useLocation();

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    {
      title: 'Home',
      href: '/',
      icon: <Home className='h-4 w-4 mr-2' />,
      show: true,
    },
    {
      title: 'Children',
      href: '/children',
      icon: <Users className='h-4 w-4 mr-2' />,
      show: isParent,
    },
    {
      title: 'Savings',
      href: '/savings',
      icon: <PiggyBank className='h-4 w-4 mr-2' />,
      show: true,
    },
    {
      title: 'Settings',
      href: '/parental-controls',
      icon: <Settings className='h-4 w-4 mr-2' />,
      show: isParent,
    },
  ];

  return (
    <nav className='fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2 flex justify-around items-center z-10'>
      {navItems
        .filter((item) => item.show)
        .map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex flex-col items-center justify-center p-2 rounded-md transition-colors',
              location.pathname === item.href
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
            )}
          >
            {item.icon}
            <span className='text-xs'>{item.title}</span>
          </Link>
        ))}
      <Button
        variant='ghost'
        size='sm'
        onClick={handleLogout}
        className='flex flex-col items-center justify-center p-2 rounded-md transition-colors text-muted-foreground hover:text-destructive hover:bg-destructive/5'
      >
        <LogOut className='h-4 w-4 mb-1' />
        <span className='text-xs'>Logout</span>
      </Button>
    </nav>
  );
};

export default MainNav;
