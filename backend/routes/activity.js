import express from 'express';
import UserActivity from '../models/UserActivity.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Record user activity heartbeat
router.post('/heartbeat', authenticate, async (req, res) => {
  try {
    const { activeSeconds, metadata } = req.body;
    const userId = req.user._id;
    const workspaceId = req.context.workspaceId;

    // Get or create today's activity record
    const activity = await UserActivity.getTodayActivity(userId, workspaceId);

    // Add active time
    if (activeSeconds && activeSeconds > 0) {
      activity.addActivityTime(activeSeconds);
    }

    // Update metadata if provided
    if (metadata) {
      if (metadata.mouseClicks) activity.metadata.mouseClicks += metadata.mouseClicks;
      if (metadata.keystrokes) activity.metadata.keystrokes += metadata.keystrokes;
      if (metadata.pageViews) activity.metadata.pageViews += metadata.pageViews;
      if (metadata.tasksCreated) activity.metadata.tasksCreated += metadata.tasksCreated;
      if (metadata.tasksCompleted) activity.metadata.tasksCompleted += metadata.tasksCompleted;
      if (metadata.commentsAdded) activity.metadata.commentsAdded += metadata.commentsAdded;
    }

    await activity.save();

    res.json({ 
      success: true, 
      totalActiveSeconds: activity.totalActiveSeconds,
      formattedDuration: activity.getFormattedDuration()
    });
  } catch (error) {
    console.error('Activity heartbeat error:', error);
    res.status(500).json({ message: 'Failed to record activity', error: error.message });
  }
});

// Get current user's activity for a specific date or date range
router.get('/my-activity', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, date } = req.query;
    const userId = req.user._id;
    const workspaceId = req.context.workspaceId;

    let query = { userId, workspaceId };

    if (date) {
      // Single date
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      query.date = targetDate;
      
      const activity = await UserActivity.findOne(query);
      return res.json({ activity });
    } else if (startDate && endDate) {
      // Date range
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = { $gte: start, $lte: end };
      
      const activities = await UserActivity.find(query).sort({ date: -1 });
      
      // Calculate totals
      const totalSeconds = activities.reduce((sum, act) => sum + act.totalActiveSeconds, 0);
      const totalHours = Math.floor(totalSeconds / 3600);
      const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
      
      return res.json({ 
        activities,
        summary: {
          totalSeconds,
          totalHours,
          totalMinutes,
          formattedDuration: `${totalHours}h ${totalMinutes}m`,
          daysTracked: activities.length
        }
      });
    } else {
      // Today's activity
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = today;
      
      const activity = await UserActivity.getTodayActivity(userId, workspaceId);
      return res.json({ activity });
    }
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: 'Failed to fetch activity', error: error.message });
  }
});

// Get team/workspace activity report (Admin/HR only)
router.get('/workspace-report', authenticate, async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin', 'hr', 'community_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { startDate, endDate, userId } = req.query;
    const workspaceId = req.context.workspaceId;

    const start = new Date(startDate || new Date());
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate || new Date());
    end.setHours(23, 59, 59, 999);

    let query = {
      workspaceId,
      date: { $gte: start, $lte: end }
    };

    if (userId) {
      query.userId = userId;
    }

    const activities = await UserActivity.find(query)
      .populate('userId', 'full_name email role profile_picture')
      .sort({ date: -1, userId: 1 });

    // Group by user
    const userActivityMap = new Map();
    
    activities.forEach(activity => {
      const userId = activity.userId._id.toString();
      if (!userActivityMap.has(userId)) {
        userActivityMap.set(userId, {
          user: {
            id: activity.userId._id,
            full_name: activity.userId.full_name,
            email: activity.userId.email,
            role: activity.userId.role,
            profile_picture: activity.userId.profile_picture
          },
          totalSeconds: 0,
          activities: []
        });
      }
      
      const userData = userActivityMap.get(userId);
      userData.totalSeconds += activity.totalActiveSeconds;
      userData.activities.push({
        date: activity.date,
        totalActiveSeconds: activity.totalActiveSeconds,
        formattedDuration: activity.getFormattedDuration(),
        metadata: activity.metadata
      });
    });

    // Convert to array and format
    const report = Array.from(userActivityMap.values()).map(data => ({
      ...data,
      totalHours: Math.floor(data.totalSeconds / 3600),
      totalMinutes: Math.floor((data.totalSeconds % 3600) / 60),
      formattedDuration: `${Math.floor(data.totalSeconds / 3600)}h ${Math.floor((data.totalSeconds % 3600) / 60)}m`,
      averagePerDay: data.activities.length > 0 
        ? Math.floor(data.totalSeconds / data.activities.length / 3600 * 10) / 10
        : 0,
      daysActive: data.activities.length
    }));

    // Sort by total time descending
    report.sort((a, b) => b.totalSeconds - a.totalSeconds);

    res.json({ 
      report,
      dateRange: {
        startDate: start,
        endDate: end
      }
    });
  } catch (error) {
    console.error('Workspace activity report error:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
});

// Get user's activity summary for dashboard
router.get('/summary', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const workspaceId = req.context.workspaceId;

    // Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayActivity = await UserActivity.findOne({ userId, workspaceId, date: today });

    // This week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekActivities = await UserActivity.find({
      userId,
      workspaceId,
      date: { $gte: weekStart }
    });

    const weekTotal = weekActivities.reduce((sum, act) => sum + act.totalActiveSeconds, 0);

    // This month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthActivities = await UserActivity.find({
      userId,
      workspaceId,
      date: { $gte: monthStart }
    });

    const monthTotal = monthActivities.reduce((sum, act) => sum + act.totalActiveSeconds, 0);

    res.json({
      today: {
        seconds: todayActivity?.totalActiveSeconds || 0,
        formatted: todayActivity?.getFormattedDuration() || '0h 0m'
      },
      thisWeek: {
        seconds: weekTotal,
        formatted: `${Math.floor(weekTotal / 3600)}h ${Math.floor((weekTotal % 3600) / 60)}m`,
        daysActive: weekActivities.length
      },
      thisMonth: {
        seconds: monthTotal,
        formatted: `${Math.floor(monthTotal / 3600)}h ${Math.floor((monthTotal % 3600) / 60)}m`,
        daysActive: monthActivities.length
      }
    });
  } catch (error) {
    console.error('Activity summary error:', error);
    res.status(500).json({ message: 'Failed to fetch summary', error: error.message });
  }
});

export default router;
