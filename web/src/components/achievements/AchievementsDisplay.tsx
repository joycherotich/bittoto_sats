import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import { ArrowLeft, Award, Lock, CheckCircle, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Achievement {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  reward: number;
  category: string;
  dateUnlocked?: string;
}

interface AchievementsDisplayProps {
  childId?: string;
  onBack: () => void;
}

const AchievementsDisplay: React.FC<AchievementsDisplayProps> = ({ childId, onBack }) => {
  const { toast } = useToast();
  const { api, isParent, user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch achievements
  useEffect(() => {
    const fetchAchievements = async () => {
      setIsLoading(true);
      try {
        let achievementsData;
        
        if (isParent && childId) {
          // If parent is viewing a child's achievements
          achievementsData = await api?.getChildAchievements(childId);
        } else {
          // For child viewing their own achievements
          achievementsData = await api?.getAchievements();
        }
        
        console.log("Achievements data:", achievementsData);
        
        if (Array.isArray(achievementsData)) {
          setAchievements(achievementsData);
        } else {
          // If API fails or returns invalid data, use mock data
          setAchievements(getMockAchievements());
          toast({
            variant: 'warning',
            title: 'Using demo data',
            description: 'Could not connect to achievements API',
          });
        }
      } catch (error) {
        console.error('Failed to fetch achievements:', error);
        setAchievements(getMockAchievements());
        toast({
          variant: 'warning',
          title: 'Using demo data',
          description: 'Could not connect to achievements API',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
  }, [api, childId, isParent, toast]);

  const getMockAchievements = (): Achievement[] => {
    return [
      {
        id: '1',
        title: 'First Savings',
        description: 'Save your first 100 sats',
        imageUrl: 'https://via.placeholder.com/100',
        unlocked: true,
        progress: 100,
        maxProgress: 100,
        reward: 50,
        category: 'savings',
        dateUnlocked: '2023-05-15T12:00:00Z'
      },
      {
        id: '2',
        title: 'Bitcoin Beginner',
        description: 'Complete your first Bitcoin learning module',
        imageUrl: 'https://via.placeholder.com/100',
        unlocked: true,
        progress: 1,
        maxProgress: 1,
        reward: 100,
        category: 'learning',
        dateUnlocked: '2023-05-20T14:30:00Z'
      },
      {
        id: '3',
        title: 'Savings Goal Champion',
        description: 'Complete your first savings goal',
        imageUrl: 'https://via.placeholder.com/100',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        reward: 200,
        category: 'goals'
      },
      {
        id: '4',
        title: 'Learning Streak',
        description: 'Complete lessons for 5 days in a row',
        imageUrl: 'https://via.placeholder.com/100',
        unlocked: false,
        progress: 2,
        maxProgress: 5,
        reward: 150,
        category: 'learning'
      },
      {
        id: '5',
        title: 'Savings Master',
        description: 'Save 1000 sats total',
        imageUrl: 'https://via.placeholder.com/100',
        unlocked: false,
        progress: 450,
        maxProgress: 1000,
        reward: 250,
        category: 'savings'
      }
    ];
  };

  // Get unique categories
  const categories = ['all', ...new Set(achievements.map(a => a.category))];

  // Filter achievements by category
  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  // Calculate stats
  const totalAchievements = achievements.length;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const totalRewardsEarned = achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.reward, 0);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {isParent && childId ? "Child's Achievements" : "My Achievements"}
        </h2>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Award className="h-8 w-8 text-amber-500 mb-2" />
            <p className="text-sm text-muted-foreground">Achievements Unlocked</p>
            <p className="text-2xl font-bold">{unlockedAchievements}/{totalAchievements}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Star className="h-8 w-8 text-amber-500 mb-2" />
            <p className="text-sm text-muted-foreground">Completion Rate</p>
            <p className="text-2xl font-bold">
              {totalAchievements > 0 
                ? Math.round((unlockedAchievements / totalAchievements) * 100) 
                : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">Total Rewards Earned</p>
            <p className="text-2xl font-bold">{totalRewardsEarned} sats</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="capitalize"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Achievements Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No achievements found in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAchievements.map((achievement) => (
            <Card 
              key={achievement.id} 
              className={`${achievement.unlocked ? 'border-amber-500' : 'opacity-80'}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className={`rounded-full p-3 mr-4 ${
                    achievement.unlocked ? 'bg-amber-100' : 'bg-gray-100'
                  }`}>
                    {achievement.unlocked ? (
                      <Award className="h-6 w-6 text-amber-500" />
                    ) : (
                      <Lock className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{achievement.title}</h3>
                    <p className="text-muted-foreground text-sm mb-3">{achievement.description}</p>
                    
                    {achievement.unlocked ? (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span>Unlocked on {new Date(achievement.dateUnlocked!).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <Progress 
                          value={(achievement.progress / achievement.maxProgress) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                    
                    <div className="mt-3 flex items-center text-sm">
                      <Star className="h-4 w-4 text-amber-500 mr-1" />
                      <span>Reward: {achievement.reward} sats</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AchievementsDisplay;