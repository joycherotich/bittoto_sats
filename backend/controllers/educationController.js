// New file: backend/controllers/educationController.js

const admin = require('firebase-admin');
const db = admin.firestore();
const { createAchievement } = require('./achievementController');

// Get educational content
const getEducationalContent = async (req, res) => {
  try {
    const { category, level } = req.query;

    let query = db.collection('educational_content');

    if (category) {
      query = query.where('category', '==', category);
    }

    if (level) {
      query = query.where('level', '==', parseInt(level));
    }

    const contentSnapshot = await query.orderBy('order').get();

    const content = [];
    contentSnapshot.forEach((doc) => {
      content.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(content);
  } catch (error) {
    console.error('Get educational content error:', error);
    res.status(500).json({ error: 'Failed to retrieve educational content' });
  }
};

// Submit quiz answers
const submitQuizAnswers = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'child') {
      return res
        .status(403)
        .json({ error: 'Only children can submit quizzes' });
    }

    const { quizId, answers } = req.body;

    if (!quizId || !answers || !Array.isArray(answers)) {
      return res
        .status(400)
        .json({ error: 'Quiz ID and answers array are required' });
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
    console.error('Submit quiz answers error:', error);
    res.status(500).json({ error: 'Failed to submit quiz answers' });
  }
};

module.exports = {
  getEducationalContent,
  submitQuizAnswers,
};
