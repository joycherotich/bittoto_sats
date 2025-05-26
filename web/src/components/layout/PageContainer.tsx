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
      
        withGradient && 
        className
      )}
    >
      <div 
        className={cn(
   
          fullWidth ? 
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default PageContainer;