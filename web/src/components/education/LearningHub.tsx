import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import { Book, CheckCircle, ArrowLeft, Award, Play } from 'lucide-react';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  level: number;
  imageUrl?: string;
  completedLessons: number;
  totalLessons: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  completed: boolean;
  moduleId: string;
  rewardAmount: number;
}

interface LearningHubProps {
  childId?: string;
  onBack: () => void;
}

const LearningHub: React.FC<LearningHubProps> = ({ childId, onBack }) => {
  const { toast } = useToast();
  const { api, isParent, user } = useAuth();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch learning modules
  useEffect(() => {
    const fetchModules = async () => {
      setIsLoading(true);
      try {
        let modulesData;
        
        if (isParent && childId) {
          // If parent is viewing a child's learning progress
          modulesData = await api?.getChildLearningProgress(childId);
        } else {
          // For child viewing their own progress
          modulesData = await api?.getLearningModules();
        }
        
        console.log("Learning modules data:", modulesData);
        
        if (Array.isArray(modulesData)) {
          setModules(modulesData);
        } else {
          // If API fails or returns invalid data, use mock data
          setModules(getMockModules());
          toast({
            variant: 'warning',
            title: 'Using demo data',
            description: 'Could not connect to learning API',
          });
        }
      } catch (error) {
        console.error('Failed to fetch learning modules:', error);
        setModules(getMockModules());
        toast({
          variant: 'warning',
          title: 'Using demo data',
          description: 'Could not connect to learning API',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
  }, [api, childId, isParent, toast]);

  const handleCompleteLesson = async (lessonId: string) => {
    try {
      if (api) {
        await api.completeLesson(lessonId);
        
        // Update the UI to show the lesson as completed
        setModules(prevModules => 
          prevModules.map(module => ({
            ...module,
            lessons: module.lessons.map(lesson => 
              lesson.id === lessonId 
                ? { ...lesson, completed: true } 
                : lesson
            ),
            completedLessons: module.lessons.some(l => l.id === lessonId && !l.completed) 
              ? module.completedLessons + 1 
              : module.completedLessons
          }))
        );
        
        // If we have a selected module, update it too
        if (selectedModule) {
          setSelectedModule({
            ...selectedModule,
            lessons: selectedModule.lessons.map(lesson => 
              lesson.id === lessonId 
                ? { ...lesson, completed: true } 
                : lesson
            ),
            completedLessons: selectedModule.lessons.some(l => l.id === lessonId && !l.completed) 
              ? selectedModule.completedLessons + 1 
              : selectedModule.completedLessons
          });
        }
        
        // If we have a selected lesson and it's the one being completed, update it
        if (selectedLesson && selectedLesson.id === lessonId) {
          setSelectedLesson({
            ...selectedLesson,
            completed: true
          });
        }
        
        toast({
          title: 'Lesson completed!',
          description: `You earned ${selectedLesson?.rewardAmount || 10} sats!`,
        });
      }
    } catch (error) {
      console.error('Failed to complete lesson:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to complete lesson. Please try again.',
      });
    }
  };

  const getMockModules = (): LearningModule[] => {
    return [
      {
        id: '1',
        title: 'Introduction to Bitcoin',
        description: 'Learn the basics of Bitcoin and how it works',
        level: 1,
        imageUrl: 'https://via.placeholder.com/150',
        lessons: [
          {
            id: '1-1',
            title: 'What is Bitcoin?',
            description: 'An introduction to the world\'s first cryptocurrency',
            content: 'Bitcoin is a digital currency that was created in 2009 by an unknown person using the alias Satoshi Nakamoto. Unlike traditional currencies, Bitcoin operates without a central bank or single administrator.',
            completed: true,
            moduleId: '1',
            rewardAmount: 10
          },
          {
            id: '1-2',
            title: 'How Bitcoin Works',
            description: 'Understanding the blockchain technology',
            content: 'Bitcoin works on a technology called blockchain. This is a public ledger that records all transactions. It is maintained by a network of computers around the world.',
            completed: false,
            moduleId: '1',
            rewardAmount: 15
          },
          {
            id: '1-3',
            title: 'Bitcoin Wallets',
            description: 'How to store and manage your Bitcoin',
            content: 'A Bitcoin wallet is a digital wallet where you can store, send, and receive Bitcoin. There are different types of wallets including hardware wallets, software wallets, and paper wallets.',
            completed: false,
            moduleId: '1',
            rewardAmount: 20
          }
        ],
        completedLessons: 1,
        totalLessons: 3
      },
      {
        id: '2',
        title: 'Saving with Bitcoin',
        description: 'Learn how to save money using Bitcoin',
        level: 2,
        imageUrl: 'https://via.placeholder.com/150',
        lessons: [
          {
            id: '2-1',
            title: 'Why Save in Bitcoin?',
            description: 'Understanding the benefits of saving in Bitcoin',
            content: 'Bitcoin can be a good way to save money because it is not controlled by any government or bank. This means it cannot be printed like traditional money, which can cause inflation.',
            completed: false,
            moduleId: '2',
            rewardAmount: 15
          },
          {
            id: '2-2',
            title: 'Setting Savings Goals',
            description: 'How to set and achieve savings goals with Bitcoin',
            content: 'Setting savings goals is important. You should decide how much Bitcoin you want to save and by when. This will help you track your progress and stay motivated.',
            completed: false,
            moduleId: '2',
            rewardAmount: 20
          }
        ],
        completedLessons: 0,
        totalLessons: 2
      }
    ];
  };

  // Render module list
  const renderModuleList = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (modules.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No learning modules available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((module) => (
          <Card 
            key={module.id} 
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              module.completedLessons === module.totalLessons ? 'border-green-500' : ''
            }`}
            onClick={() => setSelectedModule(module)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-1">{module.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{module.description}</p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Book className="h-3 w-3 mr-1" />
                    <span>Level {module.level}</span>
                    <span className="mx-2">•</span>
                    <span>{module.completedLessons}/{module.totalLessons} lessons</span>
                  </div>
                </div>
                {module.completedLessons === module.totalLessons && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{Math.round((module.completedLessons / module.totalLessons) * 100)}%</span>
                </div>
                <Progress 
                  value={(module.completedLessons / module.totalLessons) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render module details with lessons
  const renderModuleDetails = () => {
    if (!selectedModule) return null;

    return (
      <div>
        <div className="mb-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedModule(null);
              setSelectedLesson(null);
            }}
            className="pl-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Modules
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{selectedModule.title}</CardTitle>
            <CardDescription>{selectedModule.description}</CardDescription>
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Module Progress</span>
                <span>
                  {selectedModule.completedLessons}/{selectedModule.totalLessons} lessons completed
                </span>
              </div>
              <Progress 
                value={(selectedModule.completedLessons / selectedModule.totalLessons) * 100} 
                className="h-2"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedModule.lessons.map((lesson) => (
                <Card 
                  key={lesson.id} 
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    lesson.completed ? 'border-green-500' : ''
                  }`}
                  onClick={() => setSelectedLesson(lesson)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{lesson.title}</h4>
                        <p className="text-sm text-muted-foreground">{lesson.description}</p>
                      </div>
                      <div className="flex items-center">
                        {lesson.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Play className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-xs text-muted-foreground">
                      <Award className="h-3 w-3 mr-1 text-amber-500" />
                      <span>Reward: {lesson.rewardAmount} sats</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render lesson content
  const renderLessonContent = () => {
    if (!selectedLesson) return null;

    return (
      <div>
        <div className="mb-4">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedLesson(null)}
            className="pl-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Module
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{selectedLesson.title}</CardTitle>
            <CardDescription>{selectedLesson.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p>{selectedLesson.content}</p>
              
              {/* More content would go here in a real app */}
              <p>
                This is where the full lesson content would be displayed, including
                text, images, videos, and interactive elements to help children learn
                about Bitcoin and financial literacy.
              </p>
            </div>

            <div className="mt-8 flex justify-end">
              {!selectedLesson.completed && !isParent && (
                <Button 
                  onClick={() => handleCompleteLesson(selectedLesson.id)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Lesson & Earn {selectedLesson.rewardAmount} sats
                </Button>
              )}
              {selectedLesson.completed && (
                <div className="flex items-center text-green-500">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  <span>Lesson Completed</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {isParent && childId ? "Child's Learning Progress" : "Learning Hub"}
        </h2>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {selectedLesson ? (
        renderLessonContent()
      ) : selectedModule ? (
        renderModuleDetails()
      ) : (
        renderModuleList()
      )}
    </div>
  );
};

export default LearningHub;