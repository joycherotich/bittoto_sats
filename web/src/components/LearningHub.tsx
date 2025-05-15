
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Book, Zap, CircleCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  reward: number;
  completed: boolean;
  thumbnail: string;
}

interface LearningHubProps {
  onBack: () => void;
}

const LearningHub: React.FC<LearningHubProps> = ({ onBack }) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Mock lessons data
  const lessons: Lesson[] = [
    {
      id: '1',
      title: 'What is Money?',
      description: 'Learn about the basics of money and why we use it.',
      duration: '2 min',
      reward: 10,
      completed: true,
      thumbnail: 'https://placehold.co/200x120/FEF9C3/1e293b?text=Money+Basics'
    },
    {
      id: '2',
      title: 'Why Save Money?',
      description: 'Discover the importance of saving money for the future.',
      duration: '3 min',
      reward: 15,
      completed: true,
      thumbnail: 'https://placehold.co/200x120/DBEAFE/1e293b?text=Saving+Tips'
    },
    {
      id: '3',
      title: 'What is Bitcoin?',
      description: 'Learn about Bitcoin and how it works.',
      duration: '4 min',
      reward: 20,
      completed: false,
      thumbnail: 'https://placehold.co/200x120/FEE2E2/1e293b?text=Bitcoin+101'
    },
    {
      id: '4',
      title: 'Setting Goals',
      description: 'Learn how to set and achieve your savings goals.',
      duration: '2 min',
      reward: 10,
      completed: false,
      thumbnail: 'https://placehold.co/200x120/D1FAE5/1e293b?text=Goal+Setting'
    }
  ];
  
  const handleCompleteLesson = async (lessonId: string) => {
    setLoading(true);
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Lesson completed!",
        description: `You earned ${selectedLesson?.reward} sats for completing this lesson.`,
      });
      
      setSelectedLesson(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to complete lesson",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };
  
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
      
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          <CardTitle className="flex items-center">
            <Book className="mr-2 h-5 w-5" />
            Learning Hub
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {selectedLesson ? (
            <div className="space-y-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedLesson(null)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to lessons
              </Button>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-center mb-4">
                  <img 
                    src={selectedLesson.thumbnail} 
                    alt={selectedLesson.title} 
                    className="rounded-lg w-full max-w-md"
                  />
                </div>
                
                <h2 className="text-xl font-bold mb-2">{selectedLesson.title}</h2>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">{selectedLesson.duration}</span>
                  <Badge className="bg-amber-500">+{selectedLesson.reward} sats</Badge>
                </div>
                
                <p className="mb-4">{selectedLesson.description}</p>
                
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <p className="text-center italic">
                    This is where the lesson content would be displayed. 
                    In a real app, this would include videos, interactive elements, or text content.
                  </p>
                </div>
                
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  disabled={loading || selectedLesson.completed}
                  onClick={() => handleCompleteLesson(selectedLesson.id)}
                >
                  {selectedLesson.completed ? (
                    <>
                      <CircleCheck className="mr-2 h-4 w-4" />
                      Already Completed
                    </>
                  ) : loading ? (
                    <>
                      <span className="loading mr-2"></span>
                      Completing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Complete & Earn {selectedLesson.reward} sats
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedLesson(lesson)}
                >
                  <div className="relative">
                    <img 
                      src={lesson.thumbnail} 
                      alt={lesson.title} 
                      className="w-full h-32 object-cover"
                    />
                    {lesson.completed && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500">
                          <CircleCheck className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{lesson.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 h-10">{lesson.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{lesson.duration}</span>
                      <Badge variant="outline" className="border-amber-500 text-amber-600">
                        +{lesson.reward} sats
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LearningHub;
