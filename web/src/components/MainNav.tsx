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
      icon: <Home className='h-5 w-8' />,
      show: true,
    },
    {
      title: 'Children',
      href: '/children',
      icon: <Users className='h-5 w-8' />,
      show: isParent,
    },
    {
      title: 'Savings',
      href: '/savings',
      icon: <PiggyBank className='h-5 w-8' />,
      show: true,
    },
    {
      title: 'Settings',
      href: '/parental-controls',
      icon: <Settings className='h-5 w-8' />,
      show: isParent,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
{/* Desktop Sidebar */}
<nav className="hidden md:fixed md:top-0 md:left-0 md:h-full md:w-56 md:flex md:flex-col bg-black md:border-r md:border-border md:py-6 z-10">
  <div className="flex-1 space-y-8 px-2">
    {navItems
      .filter((item) => item.show)
      .map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            'flex items-center gap-3 px-4 py-3 mt-2 rounded-md transition-colors',
            location.pathname === item.href
              ? 'text-white bg-yellow-600'
              : 'text-blue-100 hover:text-white hover:bg-yellow-600'
          )}
        >
          <span className="h-5 w-5">{item.icon}</span>
          <span className="text-base text-xl font-serif font-semibold">{item.title}</span>
        </Link>
      ))}
  </div>

  {/* Logout button at the bottom */}
  <div className="mt-auto px-4">
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLogout}
      className="w-full text-blue-100 hover:text-red-100 hover:bg-red-600/20 flex items-center gap-2"
    >
      <LogOut className="h-5 w-5" />
      <span>Logout</span>
    </Button>
  </div>
</nav>


      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t border-border p-2 flex justify-around items-center z-10">
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
    </>
  );
};

export default MainNav;
