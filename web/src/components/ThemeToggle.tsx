import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={toggleTheme}
      className='w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm transition-all duration-300 hover:shadow-md'
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className='relative w-5 h-5'>
        <Sun
          className={`absolute inset-0 h-5 w-5 transition-all ${
            theme === 'dark'
              ? 'scale-100 rotate-0 opacity-100'
              : 'scale-0 -rotate-90 opacity-0'
          }`}
        />
        <Moon
          className={`absolute inset-0 h-5 w-5 transition-all ${
            theme === 'light'
              ? 'scale-100 rotate-0 opacity-100'
              : 'scale-0 rotate-90 opacity-0'
          }`}
        />
      </div>
    </Button>
  );
};

export default ThemeToggle;
