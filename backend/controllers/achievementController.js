const admin = require('firebase-admin');
const db = admin.firestore();

// Achievement definitions
const ACHIEVEMENTS = {
  first_deposit: {
    title: 'First Deposit',
    description: 'Made your first deposit',
    points: 10,
    icon: '💰',
  },
  goal_created: {
    title: 'Goal Setter',
    description: 'Created your first savings goal',
    points: 5,
    icon: '🎯',
  },
  goal_completed: {
    title: 'Goal Achieved',
    description: 'Reached a savings goal',
    points: 20,
    icon: '🏆',
  },
  streak_week: {
    title: 'Weekly Saver',
    description: 'Saved money for 7 days in a row',
    points: 15,
    icon: '📅',
  },
  big_saver: {
    title: 'Big Saver',
    description: 'Saved over 1000 sats',
    points: 25,
    icon: '🌟',
  },
};

const createAchievement = async (childId, type, data = {}) => {
  try {
    const existingSnapshot = await db
      .collection('achievements')
      .where('childId', '==', childId)
      .where('type', '==', type)
      .get();

    if (!existingSnapshot.empty && !ACHIEVEMENTS[type]?.repeatable) {
      return null;
    }

    const achievementInfo = ACHIEVEMENTS[type] || {
      title: 'Achievement',
      description: 'You earned an achievement',
      points: 5,
      icon: '🎉',
    };

    const achievementRef = db.collection('achievements').doc();
    await achievementRef.set({
      childId,
      type,
      title: achievementInfo.title,
      description: achievementInfo.description,
      points: achievementInfo.points,
      icon: achievementInfo.icon,
      data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db
      .collection('children')
      .doc(childId)
      .update({
        achievementPoints: admin.firestore.FieldValue.increment(
          achievementInfo.points
        ),
      });

    return achievementRef.id;
  } catch (error) {
    console.error('Create achievement error:', error);
    return null;
  }
};

// Get achievements for a child
const getAchievements = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Determine which child's achievements to fetch
    let childId;
    if (userRole === 'child') {
      childId = userId;
    } else if (userRole === 'parent' && req.query.childId) {
      childId = req.query.childId;

      // Verify this child belongs to the parent
      const childDoc = await db.collection('children').doc(childId).get();
      if (!childDoc.exists || childDoc.data().parentId !== userId) {
        return res.status(403).json({
          error:
            'You do not have permission to view achievements for this child',
        });
      }
    } else {
      return res
        .status(400)
        .json({ error: 'Child ID is required for parent users' });
    }

    const achievementsSnapshot = await db
      .collection('achievements')
      .where('childId', '==', childId)
      .orderBy('createdAt', 'desc')
      .get();

    const achievements = [];
    achievementsSnapshot.forEach((doc) => {
      achievements.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt
          ? doc.data().createdAt.toDate().toISOString()
          : null,
      });
    });

    res.json(achievements);
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to retrieve achievements' });
  }
};

module.exports = {
  createAchievement,
  getAchievements,
  ACHIEVEMENTS,
};
