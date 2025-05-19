import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/UserAuthContext';
import confetti from 'canvas-confetti';

interface LessonStep {
  type: 'text' | 'video' | 'quiz' | 'activity';
  content: string;
  question?: string;
  options?: string[];
  correctAnswer?: number;
}

interface LessonProps {
  id: string;
  title: string;
  description: string;
  steps: LessonStep[];
  onComplete: () => void;
}

const InteractiveLesson: React.FC<LessonProps> = ({
  id,
  title,
  description,
  steps,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { api } = useAuth();

  useEffect(() => {
    setProgress((currentStep / steps.length) * 100);
  }, [currentStep, steps.length]);

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      // Lesson complete
      try {
        await api.completeLesson(id);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast({
          title: 'Lesson Complete!',
          description: 'You earned 50 satoshis for completing this lesson!',
        });
        onComplete();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to mark lesson as complete',
        });
      }
    }
  };

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
    const currentQuiz = steps[currentStep];
    if (currentQuiz.type === 'quiz' && currentQuiz.correctAnswer !== undefined) {
      setIsCorrect(index === currentQuiz.correctAnswer);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    
    switch (step.type) {
      case 'text':
        return <div className="prose dark:prose-invert">{step.content}</div>;
        
      case 'video':
        return (
          <div className="aspect-video">
            <iframe
              className="w-full h-full rounded-md"
              src={step.content}
              title="Lesson video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        );
        
      case 'quiz':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{step.question}</h3>
            <div className="space-y-2">
              {step.options?.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedAnswer === index ? 'default' : 'outline'}
                  className={`w-full justify-start ${
                    isCorrect !== null && index === step.correctAnswer
                      ? 'border-green-500 bg-green-100 dark:bg-green-900/20'
                      : isCorrect === false && index === selectedAnswer
                      ? 'border-red-500 bg-red-100 dark:bg-red-900/20'
                      : ''
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                >
                  {option}
                </Button>
              ))}
            </div>
            {isCorrect !== null && (
              <div className={`p-3 rounded-md ${isCorrect ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'}`}>
                {isCorrect ? 'Correct! Well done!' : 'Not quite right. Try again!'}
              </div>
            )}
          </div>
        );
        
      case 'activity':
        return (
          <div className="prose dark:prose-invert">
            <h3 className="text-lg font-medium">Activity</h3>
            <div>{step.content}</div>
          </div>
        );
        
      default:
        return <div>Unknown step type</div>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStepContent()}
        
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={
              steps[currentStep].type === 'quiz' &&
              isCorrect === null &&
              selectedAnswer !== null
            }
          >
            {currentStep < steps.length - 1 ? 'Next' : 'Complete Lesson'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveLesson;