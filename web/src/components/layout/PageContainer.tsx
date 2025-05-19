import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  withGradient?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  fullWidth = false,
  withGradient = false,
}) => {
  return (
    <div 
      className={cn(
        'min-h-screen w-full pb-16',
        withGradient && 'bg-gradient-to-br from-background to-accent/20 dark:from-background dark:to-accent/5',
        className
      )}
    >
      <div 
        className={cn(
          'mx-auto px-4 sm:px-6 transition-all duration-300',
          fullWidth ? 'w-full' : 'max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl'
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default PageContainer;