import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Book, Zap, CircleCheck, Star, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  reward: number;
  completed: boolean;
  thumbnail: string;
  ageRange: string;
}

interface Game {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  reward: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Quiz {
  id: string;
  title: string;
  questions: {
    question: string;
    answers: string[];
    correctAnswer: number;
  }[];
  reward: number;
  completed: boolean;
}

interface EnhancedLearningHubProps {
  onBack: () => void;
}

const EnhancedLearningHub: React.FC<EnhancedLearningHubProps> = ({
  onBack,
}) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [learningStreak, setLearningStreak] = useState(3);
  const { toast } = useToast();

  // Mock lessons data
  const lessons: Lesson[] = [
    {
      id: '1',
      title: 'What is Money?',
      description:
        'Learn about the basics of money and why we use it in our everyday lives.',
      duration: '2 min',
      reward: 10,
      completed: true,
      thumbnail: 'https://placehold.co/200x120/FEF9C3/1e293b?text=Money+Basics',
      ageRange: '5-7',
    },
    {
      id: '2',
      title: 'Why Save Money?',
      description:
        'Discover the importance of saving money for the future and how it helps you achieve your goals.',
      duration: '3 min',
      reward: 15,
      completed: true,
      thumbnail: 'https://placehold.co/200x120/DBEAFE/1e293b?text=Saving+Tips',
      ageRange: '5-8',
    },
    {
      id: '3',
      title: 'What is Bitcoin?',
      description:
        'Learn about Bitcoin and how it works as a special kind of digital money.',
      duration: '4 min',
      reward: 20,
      completed: false,
      thumbnail: 'https://placehold.co/200x120/FEE2E2/1e293b?text=Bitcoin+101',
      ageRange: '8-12',
    },
    {
      id: '4',
      title: 'Setting Goals',
      description:
        'Learn how to set and achieve your savings goals step by step.',
      duration: '2 min',
      reward: 10,
      completed: false,
      thumbnail: 'https://placehold.co/200x120/D1FAE5/1e293b?text=Goal+Setting',
      ageRange: '6-10',
    },
    {
      id: '5',
      title: 'Spending Wisely',
      description: 'Tips on making smart choices when spending your money.',
      duration: '3 min',
      reward: 15,
      completed: false,
      thumbnail:
        'https://placehold.co/200x120/FFE4E6/1e293b?text=Wise+Spending',
      ageRange: '7-12',
    },
  ];

  // Mock games data
  const games: Game[] = [
    {
      id: '1',
      title: 'Coin Collector',
      description: 'Collect coins and learn to count money values',
      thumbnail: 'https://placehold.co/200x120/FDBA74/1e293b?text=Coin+Game',
      reward: 25,
      difficulty: 'easy',
    },
    {
      id: '2',
      title: 'Budget Builder',
      description: 'Learn to make a simple budget for your savings',
      thumbnail: 'https://placehold.co/200x120/BEF264/1e293b?text=Budget+Game',
      reward: 30,
      difficulty: 'medium',
    },
    {
      id: '3',
      title: 'Savings Race',
      description: 'Race to save enough for your goal before time runs out',
      thumbnail: 'https://placehold.co/200x120/A5F3FC/1e293b?text=Race+Game',
      reward: 40,
      difficulty: 'hard',
    },
  ];

  // Mock quizzes
  const quizzes: Quiz[] = [
    {
      id: '1',
      title: 'Money Basics Quiz',
      questions: [
        {
          question: 'What is the main purpose of money?',
          answers: [
            'To make people happy',
            'To exchange for things we need',
            'To keep in a piggy bank',
            'To look at pictures of famous people',
          ],
          correctAnswer: 1,
        },
        {
          question: 'Why is saving money important?',
          answers: [
            "It's not important at all",
            'So you can buy things later',
            'To have more money than friends',
            'Because parents say so',
          ],
          correctAnswer: 1,
        },
        {
          question: 'What is a good reason to save money?',
          answers: [
            'To buy something special later',
            'To never spend it',
            'To make others jealous',
            'None of these',
          ],
          correctAnswer: 0,
        },
      ],
      reward: 20,
      completed: false,
    },
  ];

  // Learning path progress
  const learningPath = {
    totalLessons: lessons.length,
    completedLessons: lessons.filter((l) => l.completed).length,
    currentLevel: 2,
    nextLevelAt: 15,
    xp: 10,
  };

  const handleCompleteLesson = async (lessonId: string) => {
    setLoading(true);

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Lesson completed!',
        description: `You earned ${selectedLesson?.reward} sats for completing this lesson.`,
      });

      setSelectedLesson(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to complete lesson',
        description: 'Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = (game: Game) => {
    setSelectedGame(game);

    toast({
      title: 'Game starting!',
      description: 'Have fun playing and earning sats!',
    });

    // In a real app, this would load the actual game component
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setQuizScore(null);
  };

  const handleAnswerQuestion = (answerIndex: number) => {
    const newAnswers = [...userAnswers, answerIndex];
    setUserAnswers(newAnswers);

    if (currentQuiz && currentQuestion < currentQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score
      let score = 0;
      newAnswers.forEach((answer, index) => {
        if (
          currentQuiz &&
          answer === currentQuiz.questions[index].correctAnswer
        ) {
          score++;
        }
      });

      const percentScore = Math.round((score / newAnswers.length) * 100);
      setQuizScore(percentScore);

      // Award sats based on performance
      const earnedReward = currentQuiz
        ? Math.round((percentScore / 100) * currentQuiz.reward)
        : 0;

      if (earnedReward > 0) {
        toast({
          title: 'Quiz completed!',
          description: `You scored ${percentScore}% and earned ${earnedReward} sats!`,
        });
      }
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setQuizScore(null);
  };

  return (
    <div className='space-y-4 p-4 animate-fade-in'>
      <Button variant='ghost' onClick={onBack} className='mb-4'>
        <ArrowLeft className='mr-2 h-4 w-4' />
        Back to Dashboard
      </Button>

      {!selectedLesson && !selectedGame && !currentQuiz ? (
        <div className='space-y-6'>
          {/* Learning streak banner */}
          <Card className='bg-gradient-to-r from-purple-500 to-indigo-500 text-white'>
            <CardContent className='p-4'>
              <div className='flex justify-between items-center'>
                <div>
                  <h3 className='text-lg font-semibold'>
                    Learning Streak: {learningStreak} days 🔥
                  </h3>
                  <p className='text-sm text-white/80'>
                    Keep learning daily to earn bonus sats!
                  </p>
                </div>
                <Trophy className='h-8 w-8 text-yellow-300' />
              </div>
            </CardContent>
          </Card>

          {/* Learning path progress */}
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center text-lg'>
                <Star className='mr-2 h-5 w-5 text-blue-500' />
                Your Learning Journey
              </CardTitle>
              <CardDescription>
                Level {learningPath.currentLevel}: {learningPath.xp}/
                {learningPath.nextLevelAt} XP
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress
                value={(learningPath.xp / learningPath.nextLevelAt) * 100}
                className='h-2 mb-2'
              />
              <p className='text-sm text-muted-foreground'>
                {learningPath.completedLessons}/{learningPath.totalLessons}{' '}
                lessons completed
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue='lessons'>
            <TabsList className='grid grid-cols-3 mb-4'>
              <TabsTrigger value='lessons'>Lessons</TabsTrigger>
              <TabsTrigger value='games'>Games</TabsTrigger>
              <TabsTrigger value='quizzes'>Quizzes</TabsTrigger>
            </TabsList>

            <TabsContent value='lessons'>
              <Card>
                <CardHeader className='bg-gradient-to-r from-blue-500 to-cyan-500 text-white'>
                  <CardTitle className='flex items-center'>
                    <Book className='mr-2 h-5 w-5' />
                    Fun Lessons
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className='border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer hover:scale-105 transition-transform'
                        onClick={() => setSelectedLesson(lesson)}
                      >
                        <div className='relative'>
                          <img
                            src={lesson.thumbnail}
                            alt={lesson.title}
                            className='w-full h-32 object-cover'
                          />
                          {lesson.completed && (
                            <div className='absolute top-2 right-2'>
                              <Badge className='bg-green-500'>
                                <CircleCheck className='mr-1 h-3 w-3' />
                                Completed
                              </Badge>
                            </div>
                          )}
                          <Badge className='absolute top-2 left-2 bg-blue-500'>
                            Ages {lesson.ageRange}
                          </Badge>
                        </div>
                        <div className='p-4'>
                          <h3 className='font-semibold'>{lesson.title}</h3>
                          <p className='text-sm text-gray-600 line-clamp-2 h-10'>
                            {lesson.description}
                          </p>
                          <div className='flex items-center justify-between mt-2'>
                            <span className='text-xs text-gray-500'>
                              {lesson.duration}
                            </span>
                            <Badge
                              variant='outline'
                              className='border-amber-500 text-amber-600'
                            >
                              +{lesson.reward} sats
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='games'>
              <Card>
                <CardHeader className='bg-gradient-to-r from-green-500 to-emerald-500 text-white'>
                  <CardTitle className='flex items-center'>
                    <Zap className='mr-2 h-5 w-5' />
                    Fun Games
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {games.map((game) => (
                      <div
                        key={game.id}
                        className='border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer hover:scale-105 transition-transform'
                        onClick={() => handleStartGame(game)}
                      >
                        <div className='relative'>
                          <img
                            src={game.thumbnail}
                            alt={game.title}
                            className='w-full h-32 object-cover'
                          />
                          <Badge
                            className={`absolute top-2 right-2 ${
                              game.difficulty === 'easy'
                                ? 'bg-green-500'
                                : game.difficulty === 'medium'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                          >
                            {game.difficulty}
                          </Badge>
                        </div>
                        <div className='p-4'>
                          <h3 className='font-semibold'>{game.title}</h3>
                          <p className='text-sm text-gray-600 line-clamp-2 h-10'>
                            {game.description}
                          </p>
                          <div className='flex items-center justify-between mt-2'>
                            <Badge
                              variant='outline'
                              className='border-amber-500 text-amber-600'
                            >
                              Win {game.reward} sats
                            </Badge>
                            <Button size='sm' variant='secondary'>
                              Play
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='quizzes'>
              <Card>
                <CardHeader className='bg-gradient-to-r from-purple-500 to-pink-500 text-white'>
                  <CardTitle className='flex items-center'>
                    <Trophy className='mr-2 h-5 w-5' />
                    Knowledge Quizzes
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-6'>
                  <div className='grid grid-cols-1 gap-4'>
                    {quizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className='border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer p-4'
                        onClick={() => handleStartQuiz(quiz)}
                      >
                        <div className='flex justify-between items-center'>
                          <div>
                            <h3 className='font-semibold'>{quiz.title}</h3>
                            <p className='text-sm text-gray-600'>
                              {quiz.questions.length} questions • Earn up to{' '}
                              {quiz.reward} sats
                            </p>
                          </div>
                          <Button size='sm' variant='outline'>
                            Take Quiz
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : selectedLesson ? (
        <Card>
          <CardHeader className='bg-gradient-to-r from-blue-500 to-cyan-500 text-white'>
            <CardTitle>{selectedLesson.title}</CardTitle>
            <CardDescription className='text-white/80'>
              {selectedLesson.duration} • Ages {selectedLesson.ageRange}
            </CardDescription>
          </CardHeader>
          <CardContent className='p-6 space-y-4'>
            <Button variant='outline' onClick={() => setSelectedLesson(null)}>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to lessons
            </Button>

            <div className='bg-gray-50 p-6 rounded-lg'>
              <div className='flex justify-center mb-4'>
                <img
                  src={selectedLesson.thumbnail}
                  alt={selectedLesson.title}
                  className='rounded-lg w-full max-w-md'
                />
              </div>

              <p className='mb-4'>{selectedLesson.description}</p>

              <div className='bg-gray-100 p-4 rounded-lg mb-4'>
                <p className='text-center italic'>
                  This is where the lesson video would play. In a real app, this
                  would be an interactive video or animation.
                </p>

                {/* Simulated video playback UI */}
                <div className='mt-4'>
                  <div className='h-2 bg-gray-200 rounded-full'>
                    <div className='h-2 bg-blue-500 rounded-full w-3/4'></div>
                  </div>
                  <div className='flex justify-between mt-2 text-sm text-gray-500'>
                    <span>1:30</span>
                    <span>2:00</span>
                  </div>
                </div>
              </div>

              <Button
                className='w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                disabled={loading || selectedLesson.completed}
                onClick={() => handleCompleteLesson(selectedLesson.id)}
              >
                {selectedLesson.completed ? (
                  <>
                    <CircleCheck className='mr-2 h-4 w-4' />
                    Already Completed
                  </>
                ) : loading ? (
                  <>
                    <span className='loading mr-2'></span>
                    Completing...
                  </>
                ) : (
                  <>
                    <Zap className='mr-2 h-4 w-4' />
                    Complete & Earn {selectedLesson.reward} sats
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : selectedGame ? (
        <Card>
          <CardHeader className='bg-gradient-to-r from-green-500 to-emerald-500 text-white'>
            <CardTitle>{selectedGame.title}</CardTitle>
            <CardDescription className='text-white/80'>
              {selectedGame.difficulty} difficulty • Win {selectedGame.reward}{' '}
              sats
            </CardDescription>
          </CardHeader>
          <CardContent className='p-6'>
            <Button
              variant='outline'
              onClick={() => setSelectedGame(null)}
              className='mb-4'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to games
            </Button>

            <div className='bg-gray-50 p-6 rounded-lg text-center'>
              <img
                src={selectedGame.thumbnail}
                alt={selectedGame.title}
                className='w-full h-48 object-cover rounded-lg mb-4'
              />

              <p className='mb-8'>
                {selectedGame.description}. This is where the interactive game
                would be displayed. In a real app, this would be a fun and
                educational money game.
              </p>

              <Button
                className='w-full bg-gradient-to-r from-green-500 to-emerald-500'
                onClick={() => {
                  toast({
                    title: 'Game finished!',
                    description: `You won ${selectedGame.reward} sats by playing ${selectedGame.title}!`,
                  });
                  setSelectedGame(null);
                }}
              >
                <Zap className='mr-2 h-4 w-4' />
                Play and Win {selectedGame.reward} sats
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : currentQuiz ? (
        <Card>
          <CardHeader className='bg-gradient-to-r from-purple-500 to-pink-500 text-white'>
            <CardTitle>{currentQuiz.title}</CardTitle>
            {quizScore === null && (
              <CardDescription className='text-white/80'>
                Question {currentQuestion + 1} of {currentQuiz.questions.length}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className='p-6'>
            {quizScore !== null ? (
              <div className='text-center space-y-6'>
                <div
                  className={`text-2xl font-bold ${
                    quizScore >= 70
                      ? 'text-green-500'
                      : quizScore >= 40
                      ? 'text-amber-500'
                      : 'text-red-500'
                  }`}
                >
                  Your Score: {quizScore}%
                </div>

                <div className='p-4 rounded-lg bg-gray-50'>
                  <p className='mb-2'>
                    You answered{' '}
                    {
                      userAnswers.filter(
                        (answer, index) =>
                          answer === currentQuiz.questions[index].correctAnswer
                      ).length
                    }{' '}
                    out of {currentQuiz.questions.length} questions correctly.
                  </p>

                  <p className='text-lg font-medium'>
                    You earned{' '}
                    {Math.round((quizScore / 100) * currentQuiz.reward)} sats!
                  </p>
                </div>

                <Button
                  className='bg-gradient-to-r from-purple-500 to-pink-500'
                  onClick={resetQuiz}
                >
                  Back to Quizzes
                </Button>
              </div>
            ) : (
              <div className='space-y-6'>
                <div className='bg-gray-50 p-6 rounded-lg'>
                  <h3 className='text-lg font-medium mb-4'>
                    {currentQuiz.questions[currentQuestion].question}
                  </h3>

                  <div className='space-y-2'>
                    {currentQuiz.questions[currentQuestion].answers.map(
                      (answer, index) => (
                        <Button
                          key={index}
                          variant='outline'
                          className='w-full justify-start text-left h-auto py-4 px-6'
                          onClick={() => handleAnswerQuestion(index)}
                        >
                          <span className='mr-2'>
                            {String.fromCharCode(65 + index)}.
                          </span>
                          {answer}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                <div className='flex justify-between'>
                  <Button variant='outline' onClick={resetQuiz}>
                    <ArrowLeft className='mr-2 h-4 w-4' />
                    Quit Quiz
                  </Button>

                  <div className='text-sm text-muted-foreground'>
                    Question {currentQuestion + 1} of{' '}
                    {currentQuiz.questions.length}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default EnhancedLearningHub;
