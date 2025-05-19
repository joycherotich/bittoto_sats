// New file: backend/controllers/educationController.js

const admin = require('firebase-admin');
const db = admin.firestore();
const { createAchievement } = require('./achievementController');

/**
 * Get educational content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEducationalContent = async (req, res) => {
  try {
    const { category, level } = req.query;

    // Start with base query
    let query = firestore.collection('educational_content');

    // Apply filters if provided
    if (category) {
      query = query.where('category', '==', category);
    }

    if (level) {
      query = query.where('level', '==', parseInt(level));
    }

    // Execute query
    const snapshot = await query.get();

    // Transform data
    const modules = [];
    snapshot.forEach((doc) => {
      modules.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(content);
  } catch (error) {
    logger.error('Get educational content error:', error);
    res.status(500).json({ error: 'Failed to fetch educational content' });
  }
};

/**
 * Submit quiz answers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitQuizAnswers = async (req, res) => {
  try {
    const { userId } = req.user;
    const { moduleId, lessonId, answers } = req.body;

    if (!moduleId || !lessonId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Get the quiz
    const quizDoc = await db.collection('quizzes').doc(quizId).get();

    if (!quizDoc.exists) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const quizData = quizDoc.data();
    const correctAnswers = quizData.questions.map((q) => q.correctAnswer);

    // Calculate score
    let score = 0;
    for (let i = 0; i < Math.min(answers.length, correctAnswers.length); i++) {
      if (answers[i] === correctAnswers[i]) {
        score++;
      }
    }

    const totalQuestions = correctAnswers.length;
    const percentageScore = (score / totalQuestions) * 100;

    // Record quiz attempt
    const attemptRef = db.collection('quiz_attempts').doc();
    await attemptRef.set({
      childId: userId,
      quizId,
      score,
      totalQuestions,
      percentageScore,
      answers,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Award satoshis based on score
    const satoshisEarned = Math.floor(percentageScore / 10) * 5; // 5 sats per 10% correct

    if (satoshisEarned > 0) {
      await db
        .collection('children')
        .doc(userId)
        .update({
          balance: admin.firestore.FieldValue.increment(satoshisEarned),
        });

      // Record transaction
      await db.collection('transactions').doc().set({
        type: 'quiz_reward',
        amount: satoshisEarned,
        childId: userId,
        quizId,
        quizName: quizData.title,
        score: percentageScore,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Award achievement if perfect score
    if (percentageScore === 100) {
      await createAchievement(userId, 'quiz_perfect', {
        quizId,
        quizName: quizData.title,
      });
    }

    res.json({
      score,
      totalQuestions,
      percentageScore,
      satoshisEarned,
      message: `Quiz completed! You earned ${satoshisEarned} satoshis.`,
    });
  } catch (error) {
    logger.error('Submit quiz answers error:', error);
    res.status(500).json({ error: 'Failed to submit quiz answers' });
  }
};

/**
 * Get learning modules with progress for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getLearningModules = async (req, res) => {
  try {
    const userId = req.user.id;
    const childId = req.query.childId || userId;

    // If parent is requesting child's progress, verify relationship
    if (req.user.role === 'parent' && childId !== userId) {
      const childDoc = await db.collection('children').doc(childId).get();
      if (!childDoc.exists || childDoc.data().parentId !== userId) {
        return res.status(403).json({
          error:
            'You do not have permission to view learning progress for this child',
        });
      }
    }

    // Get all modules
    const modulesSnapshot = await db.collection('educational_content').get();

    // Get user's progress
    const progressSnapshot = await db
      .collection('learning_progress')
      .where('userId', '==', childId)
      .get();

    // Create a map of completed lessons
    const completedLessons = {};
    progressSnapshot.forEach((doc) => {
      const progress = doc.data();
      if (progress.completed) {
        completedLessons[progress.lessonId] = true;
      }
    });

    // Transform modules data with progress information
    const modules = [];
    modulesSnapshot.forEach((doc) => {
      const module = doc.data();
      const lessons = module.lessons || [];

      // Count completed lessons
      let completedCount = 0;
      const updatedLessons = lessons.map((lesson) => {
        const completed = !!completedLessons[lesson.id];
        if (completed) completedCount++;
        return {
          ...lesson,
          completed,
        };
      });

      modules.push({
        id: doc.id,
        ...module,
        lessons: updatedLessons,
        completedLessons: completedCount,
        totalLessons: lessons.length,
      });
    });

    res.json(modules);
  } catch (error) {
    console.error('Get learning modules error:', error);
    res.status(500).json({ error: 'Failed to fetch learning modules' });
  }
};

/**
 * Get learning progress for a specific child (for parent users)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getChildLearningProgress = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId } = req.params;

    // Verify parent-child relationship
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== parentId) {
      return res.status(403).json({
        error:
          'You do not have permission to view learning progress for this child',
      });
    }

    // Reuse the getLearningModules logic but with the child's ID
    req.query.childId = childId;
    return getLearningModules(req, res);
  } catch (error) {
    console.error('Get child learning progress error:', error);
    res.status(500).json({ error: 'Failed to fetch child learning progress' });
  }
};

/**
 * Mark a lesson as completed
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const completeLesson = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.params;

    // Get the lesson details
    const lessonsSnapshot = await db
      .collection('educational_content')
      .where('lessons', 'array-contains', { id: lessonId })
      .get();

    if (lessonsSnapshot.empty) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Check if already completed
    const progressSnapshot = await db
      .collection('learning_progress')
      .where('userId', '==', userId)
      .where('lessonId', '==', lessonId)
      .get();

    if (!progressSnapshot.empty && progressSnapshot.docs[0].data().completed) {
      return res.json({
        message: 'Lesson already completed',
        alreadyCompleted: true,
      });
    }

    // Get lesson details for reward calculation
    let moduleId = null;
    let lessonData = null;

    lessonsSnapshot.forEach((doc) => {
      const module = doc.data();
      moduleId = doc.id;

      const lesson = module.lessons.find((l) => l.id === lessonId);
      if (lesson) {
        lessonData = lesson;
      }
    });

    // Default reward if not specified
    const rewardAmount = lessonData?.rewardAmount || 10;

    // Record progress
    const progressRef = progressSnapshot.empty
      ? db.collection('learning_progress').doc()
      : db.collection('learning_progress').doc(progressSnapshot.docs[0].id);

    await progressRef.set(
      {
        userId,
        lessonId,
        moduleId,
        completed: true,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Award satoshis
    await db
      .collection('children')
      .doc(userId)
      .update({
        balance: admin.firestore.FieldValue.increment(rewardAmount),
      });

    // Record transaction
    await db
      .collection('transactions')
      .doc()
      .set({
        type: 'lesson_reward',
        amount: rewardAmount,
        childId: userId,
        lessonId,
        moduleId,
        lessonTitle: lessonData?.title || 'Lesson',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Check if this completes a module
    const allModuleLessonsSnapshot = await db
      .collection('learning_progress')
      .where('userId', '==', userId)
      .where('moduleId', '==', moduleId)
      .where('completed', '==', true)
      .get();

    const moduleDoc = await db
      .collection('educational_content')
      .doc(moduleId)
      .get();
    const module = moduleDoc.data();

    if (
      module &&
      module.lessons &&
      allModuleLessonsSnapshot.size === module.lessons.length
    ) {
      // Module completed achievement
      await createAchievement(userId, 'module_completed', {
        moduleId,
        moduleName: module.title,
      });
    }

    // Check for first lesson achievement
    const allCompletedLessonsSnapshot = await db
      .collection('learning_progress')
      .where('userId', '==', userId)
      .where('completed', '==', true)
      .get();

    if (allCompletedLessonsSnapshot.size === 1) {
      await createAchievement(userId, 'first_lesson', {
        lessonId,
        lessonName: lessonData?.title,
      });
    }

    res.json({
      success: true,
      message: `Lesson completed! You earned ${rewardAmount} sats.`,
      rewardAmount,
    });
  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({ error: 'Failed to complete lesson' });
  }
};

module.exports = {
  getEducationalContent,
  submitQuizAnswers,
  getLearningModules,
  getChildLearningProgress,
  completeLesson,
};
