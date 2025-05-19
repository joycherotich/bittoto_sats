import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AnimatedCardProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  animateIn?: 'fade' | 'slide-up' | 'slide-down' | 'scale';
  delay?: number;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  title,
  children,
  footer,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  collapsible = false,
  defaultCollapsed = false,
  animateIn = 'fade',
  delay = 0,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  
  const animationClass = {
    'fade': 'animate-in fade-in',
    'slide-up': 'animate-in slide-up',
    'slide-down': 'animate-in slide-down',
    'scale': 'animate-in scale-in',
  }[animateIn];

  return (
    <Card 
      className={cn(
        'overflow-hidden border border-border bg-card text-card-foreground shadow-sm transition-all duration-300',
        animationClass,
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {title && (
        <CardHeader 
          className={cn(
            'py-4 px-6',
            collapsible && 'flex flex-row items-center justify-between cursor-pointer bg-muted/50',
            headerClassName
          )}
          onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
        >
          <div className="font-semibold">{title}</