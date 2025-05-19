
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Award, Star, Trophy, Download, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
  target?: number;
  category: 'savings' | 'learning' | 'streaks';
}

interface EnhancedAchievementsProps {
  childId?: string;
  onBack?: () => void;
}

const EnhancedAchievements: React.FC<EnhancedAchievementsProps> = ({ 
  childId, 
  onBack 
}) => {
  return (
    <div className="space-y-4 p-4 animate-fade-in">
      <Button 
        variant="ghost" 
        onClick={onBack} 
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      {!selectedAchievement ? (
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5" />
                My Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {earnedAchievements}/{totalAchievements} achievements unlocked
                </span>
              </div>
              <Progress 
                value={(earnedAchievements / totalAchievements) * 100} 
                className="h-2 mb-6" 
              />
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-amber-500">{earnedAchievements}</div>
                  <div className="text-sm text-muted-foreground">Badges Earned</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-500">2</div>
                  <div className="text-sm text-muted-foreground">Level Reached</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg col-span-2 sm:col-span-1">
                  <div className="text-3xl font-bold text-green-500">95</div>
                  <div className="text-sm text-muted-foreground">Bonus Sats Earned</div>
                </div>
              </div>
              
              <Tabs defaultValue="all">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="savings">Savings</TabsTrigger>
                  <TabsTrigger value="learning">Learning</TabsTrigger>
                  <TabsTrigger value="streaks">Streaks</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer p-4 ${
                          achievement.earned ? 'bg-white' : 'bg-gray-50'
                        }`}
                        onClick={() => setSelectedAchievement(achievement)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 flex items-center justify-center rounded-full ${
                            achievement.earned ? 'bg-gradient-to-br from-yellow-300 to-amber-500' : 'bg-gray-200'
                          }`}>
                            {achievement.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold">{achievement.name}</h3>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                            
                            {achievement.earned ? (
                              <Badge className="mt-2 bg-green-500">Unlocked</Badge>
                            ) : achievement.progress !== undefined && achievement.target !== undefined ? (
                              <div className="mt-2">
                                <div className="text-xs text-muted-foreground mb-1">
                                  {achievement.progress}/{achievement.target} Complete
                                </div>
                                <Progress 
                                  value={(achievement.progress / achievement.target) * 100} 
                                  className="h-1" 
                                />
                              </div>
                            ) : (
                              <Badge className="mt-2 bg-gray-400">Locked</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="savings">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements
                      .filter(achievement => achievement.category === 'savings')
                      .map((achievement) => (
                        <div
                          key={achievement.id}
                          className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer p-4 ${
                            achievement.earned ? 'bg-white' : 'bg-gray-50'
                          }`}
                          onClick={() => setSelectedAchievement(achievement)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 flex items-center justify-center rounded-full ${
                              achievement.earned ? 'bg-gradient-to-br from-yellow-300 to-amber-500' : 'bg-gray-200'
                            }`}>
                              {achievement.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold">{achievement.name}</h3>
                              <p className="text-sm text-gray-600">{achievement.description}</p>
                              
                              {achievement.earned ? (
                                <Badge className="mt-2 bg-green-500">Unlocked</Badge>
                              ) : achievement.progress !== undefined && achievement.target !== undefined ? (
                                <div className="mt-2">
                                  <div className="text-xs text-muted-foreground mb-1">
                                    {achievement.progress}/{achievement.target} Complete
                                  </div>
                                  <Progress 
                                    value={(achievement.progress / achievement.target) * 100} 
                                    className="h-1" 
                                  />
                                </div>
                              ) : (
                                <Badge className="mt-2 bg-gray-400">Locked</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="learning">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements
                      .filter(achievement => achievement.category === 'learning')
                      .map((achievement) => (
                        <div
                          key={achievement.id}
                          className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer p-4 ${
                            achievement.earned ? 'bg-white' : 'bg-gray-50'
                          }`}
                          onClick={() => setSelectedAchievement(achievement)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 flex items-center justify-center rounded-full ${
                              achievement.earned ? 'bg-gradient-to-br from-purple-300 to-blue-500' : 'bg-gray-200'
                            }`}>
                              {achievement.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold">{achievement.name}</h3>
                              <p className="text-sm text-gray-600">{achievement.description}</p>
                              
                              {achievement.earned ? (
                                <Badge className="mt-2 bg-green-500">Unlocked</Badge>
                              ) : achievement.progress !== undefined && achievement.target !== undefined ? (
                                <div className="mt-2">
                                  <div className="text-xs text-muted-foreground mb-1">
                                    {achievement.progress}/{achievement.target} Complete
                                  </div>
                                  <Progress 
                                    value={(achievement.progress / achievement.target) * 100} 
                                    className="h-1" 
                                  />
                                </div>
                              ) : (
                                <Badge className="mt-2 bg-gray-400">Locked</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="streaks">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements
                      .filter(achievement => achievement.category === 'streaks')
                      .map((achievement) => (
                        <div
                          key={achievement.id}
                          className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer p-4 ${
                            achievement.earned ? 'bg-white' : 'bg-gray-50'
                          }`}
                          onClick={() => setSelectedAchievement(achievement)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 flex items-center justify-center rounded-full ${
                              achievement.earned ? 'bg-gradient-to-br from-red-300 to-orange-500' : 'bg-gray-200'
                            }`}>
                              {achievement.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold">{achievement.name}</h3>
                              <p className="text-sm text-gray-600">{achievement.description}</p>
                              
                              {achievement.earned ? (
                                <Badge className="mt-2 bg-green-500">Unlocked</Badge>
                              ) : achievement.progress !== undefined && achievement.target !== undefined ? (
                                <div className="mt-2">
                                  <div className="text-xs text-muted-foreground mb-1">
                                    {achievement.progress}/{achievement.target} Complete
                                  </div>
                                  <Progress 
                                    value={(achievement.progress / achievement.target) * 100} 
                                    className="h-1" 
                                  />
                                </div>
                              ) : (
                                <Badge className="mt-2 bg-gray-400">Locked</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader className="bg-gradient-to-r from-amber-400 to-amber-600 text-white">
            <CardTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5" />
              {selectedAchievement.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedAchievement(null)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to achievements
            </Button>
            
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <div className={`w-24 h-24 mx-auto flex items-center justify-center rounded-full ${
                selectedAchievement.earned ? 'bg-gradient-to-br from-yellow-300 to-amber-500' : 'bg-gray-200'
              }`}>
                {selectedAchievement.icon}
              </div>
              
              <h2 className="text-2xl font-bold mt-4">{selectedAchievement.name}</h2>
              <p className="text-gray-600 mt-2">{selectedAchievement.description}</p>
              
              {selectedAchievement.earned ? (
                <div className="mt-4">
                  <p className="text-green-600 font-medium">
                    Achievement Unlocked!
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Earned on {new Date(selectedAchievement.earnedDate!).toLocaleDateString()}
                  </p>
                </div>
              ) : selectedAchievement.progress !== undefined && selectedAchievement.target !== undefined ? (
                <div className="mt-4">
                  <p className="text-gray-600 font-medium">
                    Progress: {selectedAchievement.progress}/{selectedAchievement.target}
                  </p>
                  <Progress 
                    value={(selectedAchievement.progress / selectedAchievement.target) * 100} 
                    className="h-2 mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {Math.round((selectedAchievement.progress / selectedAchievement.target) * 100)}% complete
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 mt-4">
                  This achievement is still locked. Keep saving and learning to unlock it!
                </p>
              )}
            </div>
            
            {selectedAchievement.earned && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
                  onClick={() => handlePrintCertificate(selectedAchievement)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Print Certificate
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleShareAchievement(selectedAchievement)}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Share with Parent
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedAchievements;
