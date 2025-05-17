import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ArrowLeft, Zap, Trophy, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/UserAuthContext';

interface TotoGameProps {
  onBack: () => void;
}

// Bitcoin-related questions for the game
const questions = [
  {
    question: 'What is Bitcoin?',
    options: [
      'A digital currency that uses cryptography',
      'A physical coin made of gold',
      'A type of credit card',
      'A bank account',
    ],
    correctAnswer: 0,
    explanation:
      'Bitcoin is a digital currency that uses cryptography for security and operates without a central authority.',
  },
  {
    question: 'What is a satoshi?',
    options: [
      'A Japanese game',
      'The smallest unit of Bitcoin',
      'A Bitcoin wallet',
      'A type of computer',
    ],
    correctAnswer: 1,
    explanation:
      "A satoshi is the smallest unit of Bitcoin, named after Bitcoin's creator Satoshi Nakamoto. 1 Bitcoin = 100,000,000 satoshis.",
  },
  {
    question: 'What happens when you save money?',
    options: [
      'It disappears forever',
      'It stays the same amount forever',
      'It can grow over time',
      'It turns into candy',
    ],
    correctAnswer: 2,
    explanation:
      'When you save money, it can grow over time through interest or investments, helping you buy bigger things later.',
  },
  {
    question: 'Why is it important to save money?',
    options: [
      'So you can buy things you need later',
      'Because adults say so',
      "It's not important",
      'To make your piggy bank heavy',
    ],
    correctAnswer: 0,
    explanation:
      'Saving money is important so you can buy things you need in the future, like education, a home, or for emergencies.',
  },
  {
    question: 'How many satoshis make up 1 Bitcoin?',
    options: ['100', '1,000', '1,000,000', '100,000,000'],
    correctAnswer: 3,
    explanation:
      'There are 100,000,000 (one hundred million) satoshis in 1 Bitcoin.',
  },
  {
    question: 'What is a Bitcoin wallet?',
    options: [
      'A leather wallet that holds Bitcoin coins',
      'A digital tool that stores your Bitcoin keys',
      'A bank account for Bitcoin',
      'A website that sells Bitcoin',
    ],
    correctAnswer: 1,
    explanation:
      'A Bitcoin wallet is a digital tool that stores the private keys needed to access and manage your Bitcoin.',
  },
  {
    question: 'What is the Lightning Network?',
    options: [
      'A weather forecasting system',
      'A fast payment system built on top of Bitcoin',
      'A type of electricity',
      'A Bitcoin mining company',
    ],
    correctAnswer: 1,
    explanation:
      'The Lightning Network is a second layer built on top of Bitcoin that allows for faster and cheaper transactions.',
  },
  {
    question: 'What happens if you spend all your money right away?',
    options: [
      "You'll have more money tomorrow",
      "You won't have money for important things later",
      'Your parents will always give you more',
      'Nothing happens',
    ],
    correctAnswer: 1,
    explanation:
      "If you spend all your money right away, you won't have any left for important things you might need or want later.",
  },
];

const TotoGame: React.FC<TotoGameProps> = ({ onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [earnedSats, setEarnedSats] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15); // 15 seconds per question
  const [timerActive, setTimerActive] = useState(true);

  const { toast } = useToast();
  const { api } = useAuth();

  // Reset timer when moving to a new question
  useEffect(() => {
    setTimeLeft(15);
    setTimerActive(true);
  }, [currentQuestionIndex]);

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (timerActive && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isAnswered) {
      handleAnswer(null);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timeLeft, timerActive, isAnswered]);

  const handleAnswer = (optionIndex: number | null) => {
    setTimerActive(false);
    setIsAnswered(true);
    setSelectedOption(optionIndex);

    const currentQuestion = questions[currentQuestionIndex];

    if (optionIndex === currentQuestion.correctAnswer) {
      // Calculate bonus based on time left (faster answers get more bonus)
      const timeBonus = Math.max(0, timeLeft);
      const questionPoints = 10 + timeBonus;

      setScore(score + questionPoints);
      setEarnedSats(earnedSats + questionPoints);

      toast({
        title: 'Correct! 🎉',
        description: `You earned ${questionPoints} sats!`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Not quite right',
        description: currentQuestion.explanation,
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setGameOver(true);

      // In a real app, we would save the earned sats to the user's account
      if (api) {
        // This is where you would call the API to add the earned sats
        // api.addSatsToBalance(earnedSats);

        toast({
          title: 'Game Complete! 🏆',
          description: `You earned ${earnedSats} sats! They've been added to your jar.`,
        });
      }
    }
  };

  const restartGame = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setEarnedSats(0);
    setGameOver(false);
    setTimeLeft(15);
    setTimerActive(true);
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className='space-y-4 p-4 animate-fade-in'>
      <div className='flex items-center justify-between mb-4'>
        <Button variant='ghost' onClick={onBack}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back
        </Button>
        <div className='flex items-center'>
          <Badge variant='outline' className='mr-2'>
            <Zap className='mr-1 h-3 w-3 text-amber-500' />
            {earnedSats} sats
          </Badge>
          <Badge variant='outline'>
            Question {currentQuestionIndex + 1}/{questions.length}
          </Badge>
        </div>
      </div>

      {!gameOver ? (
        <Card className='shadow-lg border-2 border-amber-200'>
          <CardHeader className='bg-gradient-to-r from-amber-400 to-amber-500 text-white'>
            <div className='flex justify-between items-center'>
              <CardTitle className='text-xl'>Bitcoin Toto</CardTitle>
              <Badge
                className={`${timeLeft <= 5 ? 'bg-red-500' : 'bg-green-500'}`}
              >
                {timeLeft}s
              </Badge>
            </div>
            <Progress value={(timeLeft / 15) * 100} className='h-2 mt-2' />
          </CardHeader>
          <CardContent className='p-6'>
            <div className='mb-6'>
              <h3 className='text-lg font-bold mb-4'>
                {currentQuestion.question}
              </h3>
              <div className='space-y-3'>
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={
                      isAnswered
                        ? index === currentQuestion.correctAnswer
                          ? 'default'
                          : index === selectedOption
                          ? 'destructive'
                          : 'outline'
                        : 'outline'
                    }
                    className={`w-full justify-start text-left h-auto py-4 px-6 ${
                      isAnswered && index === currentQuestion.correctAnswer
                        ? 'bg-green-500 hover:bg-green-600'
                        : isAnswered && index === selectedOption
                        ? 'bg-red-500 hover:bg-red-600'
                        : ''
                    }`}
                    onClick={() => !isAnswered && handleAnswer(index)}
                    disabled={isAnswered}
                  >
                    <div className='flex items-center w-full'>
                      <span className='flex-1'>{option}</span>
                      {isAnswered &&
                        index === currentQuestion.correctAnswer && (
                          <Check className='h-5 w-5 ml-2' />
                        )}
                      {isAnswered &&
                        index === selectedOption &&
                        index !== currentQuestion.correctAnswer && (
                          <X className='h-5 w-5 ml-2' />
                        )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {isAnswered && (
              <div className='mt-4'>
                <p className='text-sm bg-blue-50 p-3 rounded-md border border-blue-100'>
                  <strong>Explanation:</strong> {currentQuestion.explanation}
                </p>
                <Button
                  className='w-full mt-4 bg-amber-500 hover:bg-amber-600'
                  onClick={handleNextQuestion}
                >
                  {currentQuestionIndex < questions.length - 1
                    ? 'Next Question'
                    : 'See Results'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className='bg-gradient-to-r from-amber-400 to-amber-500 text-white'>
            <CardTitle className='text-xl flex items-center'>
              <Trophy className='mr-2 h-5 w-5' />
              Game Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className='p-6 text-center'>
            <div className='mb-6'>
              <h3 className='text-2xl font-bold mb-2'>Your Score: {score}</h3>
              <p className='text-lg mb-4'>
                You earned{' '}
                <span className='font-bold text-amber-500'>
                  {earnedSats} sats
                </span>
                !
              </p>

              {score >= questions.length * 15 ? (
                <div className='bg-green-50 p-4 rounded-lg border border-green-100 mb-4'>
                  <h4 className='font-bold text-green-700'>Amazing job! 🎉</h4>
                  <p>You're a Bitcoin expert! Keep learning and saving!</p>
                </div>
              ) : score >= questions.length * 10 ? (
                <div className='bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4'>
                  <h4 className='font-bold text-blue-700'>Great job! 🌟</h4>
                  <p>You know a lot about Bitcoin and saving. Keep it up!</p>
                </div>
              ) : (
                <div className='bg-amber-50 p-4 rounded-lg border border-amber-100 mb-4'>
                  <h4 className='font-bold text-amber-700'>Good effort! 👍</h4>
                  <p>
                    You're learning about Bitcoin. Play again to improve your
                    score!
                  </p>
                </div>
              )}
            </div>

            <div className='flex gap-3'>
              <Button
                className='flex-1 bg-amber-500 hover:bg-amber-600'
                onClick={restartGame}
              >
                Play Again
              </Button>
              <Button variant='outline' className='flex-1' onClick={onBack}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TotoGame;
