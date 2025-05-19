import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Eye, Plus, Coins, Calendar, Key } from 'lucide-react';

interface JarCardProps {
  id: string;
  name: string;
  age?: number;
  jarId: string;
  balance?: number;
  onView?: (id: string) => void;
  onAddFunds?: (id: string) => void;
  className?: string;
  compact?: boolean;
}

const JarCard: React.FC<JarCardProps> = ({
  id,
  name,
  age,
  jarId,
  balance = 0,
  onView,
  onAddFunds,
  className,
  compact = false,
}) => {
  return (
    <div
      className={cn(
        "bg-background rounded-lg border border-border p-4 transition-all duration-200 hover:shadow-md hover:border-amber-200 dark:hover:border-amber-800",
        className
      )}
    >
      <div className={cn(
        "flex items-start gap-4",
        compact ? "flex-row" : "flex-col sm:flex-row"
      )}>
        <div className="flex-shrink-0">
          <div className="bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 p-3 rounded-full">
            <img
              src="/favicon.png"
              alt="Savings Jar"
              className={cn(
                "object-contain",
                compact ? "h-8 w-8" : "h-10 w-10"
              )}
            />
          </div>
        </div>
        
        <div className="flex-grow space-y-1">
          <h3 className={cn(
            "font-medium text-foreground",
            compact ? "text-base" : "text-lg"
          )}>
            {name || 'Unknown'}
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {age !== undefined && (
              <span className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1 opacity-70" />
                Age: {age || 'Unknown'}
              </span>
            )}
            <span className="flex items-center">
              <Key className="h-3.5 w-3.5 mr-1 opacity-70" />
              Jar ID: <span className="font-mono ml-1">{jarId?.substring(0, 8) || 'N/A'}</span>
            </span>
          </div>
          <div className="flex items-center text-sm font-medium text-foreground mt-1">
            <Coins className="h-4 w-4 mr-1.5 text-amber-500" />
            <span>{balance?.toLocaleString() || '0'} sats</span>
          </div>
        </div>
        
        <div className={cn(
          "flex gap-2",
          compact ? "flex-row ml-auto" : "flex-col sm:flex-row w-full sm:w-auto mt-3 sm:mt-0"
        )}>
          {onView && (
            <Button
              size={compact ? "sm" : "default"}
              className="bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700 transition-colors"
              onClick={() => onView(id)}
            >
              <Eye className={cn(
                compact ? "mr-0" : "mr-1.5",
                "h-4 w-4"
              )} />
              {!compact && <span>View Jar</span>}
            </Button>
          )}
          {onAddFunds && (
            <Button
              size={compact ? "sm" : "default"}
              variant="outline"
              className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-500 dark:hover:bg-amber-950/20"
              onClick={() => onAddFunds(id)}
            >
              <Plus className={cn(
                compact ? "mr-0" : "mr-1.5",
                "h-4 w-4"
              )} />
              {!compact && <span>Add Funds</span>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JarCard;