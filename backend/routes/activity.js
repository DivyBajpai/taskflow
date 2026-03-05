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

// ============ WORK LOG ROUTES (Manual Productivity Tracking) ============

// Add a work log entry
router.post('/work-log', authenticate, async (req, res) => {
  try {
    const { title, description, hoursSpent, logDate, logTime, category } = req.body;
    const userId = req.user._id;
    const workspaceId = req.context.workspaceId;

    // Validation
    if (!title || !hoursSpent) {
      return res.status(400).json({ message: 'Title and hours spent are required' });
    }

    if (hoursSpent <= 0) {
      return res.status(400).json({ message: 'Hours spent must be greater than 0' });
    }

    // Get or create activity record for the log date
    const targetDate = logDate ? new Date(logDate) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    let activity = await UserActivity.findOne({
      userId,
      workspaceId,
      date: targetDate
    });

    if (!activity) {
      activity = new UserActivity({
        userId,
        workspaceId,
        date: targetDate,
        totalActiveSeconds: 0,
        totalLoggedHours: 0,
        workLogs: [],
        sessions: [],
        metadata: {
          mouseClicks: 0,
          keystrokes: 0,
          pageViews: 0,
          tasksCreated: 0,
          tasksCompleted: 0,
          commentsAdded: 0
        }
      });
    }

    // Add work log
    const workLog = activity.addWorkLog({
      title,
      description,
      hoursSpent: parseFloat(hoursSpent),
      logDate: targetDate,
      logTime,
      category
    });

    await activity.save();

    res.status(201).json({
      message: 'Work log added successfully',
      workLog,
      totalLoggedHours: activity.totalLoggedHours
    });
  } catch (error) {
    console.error('Add work log error:', error);
    res.status(500).json({ message: 'Failed to add work log', error: error.message });
  }
});

// Get work logs for a date range
router.get('/work-logs', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;
    const workspaceId = req.context.workspaceId;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const activities = await UserActivity.find({
      userId,
      workspaceId,
      date: { $gte: start, $lte: end },
      'workLogs.0': { $exists: true } // Only get records with work logs
    }).sort({ date: -1 });

    // Flatten work logs with their dates
    const workLogs = [];
    activities.forEach(activity => {
      activity.workLogs.forEach(log => {
        workLogs.push({
          _id: log._id,
          title: log.title,
          description: log.description,
          hoursSpent: log.hoursSpent,
          logDate: log.logDate,
          logTime: log.logTime,
          category: log.category,
          createdAt: log.createdAt,
          updatedAt: log.updatedAt,
          activityDate: activity.date
        });
      });
    });

    // Calculate totals
    const totalHours = workLogs.reduce((sum, log) => sum + log.hoursSpent, 0);

    res.json({
      workLogs,
      totalHours,
      count: workLogs.length,
      dateRange: { startDate: start, endDate: end }
    });
  } catch (error) {
    console.error('Get work logs error:', error);
    res.status(500).json({ message: 'Failed to fetch work logs', error: error.message });
  }
});

// Update a work log entry
router.patch('/work-log/:activityId/:workLogId', authenticate, async (req, res) => {
  try {
    const { activityId, workLogId } = req.params;
    const { title, description, hoursSpent, logDate, logTime, category } = req.body;
    const userId = req.user._id;
    const workspaceId = req.context.workspaceId;

    const activity = await UserActivity.findOne({
      _id: activityId,
      userId,
      workspaceId
    });

    if (!activity) {
      return res.status(404).json({ message: 'Activity record not found' });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (hoursSpent !== undefined) updates.hoursSpent = parseFloat(hoursSpent);
    if (logDate !== undefined) updates.logDate = logDate;
    if (logTime !== undefined) updates.logTime = logTime;
    if (category !== undefined) updates.category = category;

    const workLog = activity.updateWorkLog(workLogId, updates);

    if (!workLog) {
      return res.status(404).json({ message: 'Work log not found' });
    }

    await activity.save();

    res.json({
      message: 'Work log updated successfully',
      workLog,
      totalLoggedHours: activity.totalLoggedHours
    });
  } catch (error) {
    console.error('Update work log error:', error);
    res.status(500).json({ message: 'Failed to update work log', error: error.message });
  }
});

// Delete a work log entry
router.delete('/work-log/:activityId/:workLogId', authenticate, async (req, res) => {
  try {
    const { activityId, workLogId } = req.params;
    const userId = req.user._id;
    const workspaceId = req.context.workspaceId;

    const activity = await UserActivity.findOne({
      _id: activityId,
      userId,
      workspaceId
    });

    if (!activity) {
      return res.status(404).json({ message: 'Activity record not found' });
    }

    const deleted = activity.deleteWorkLog(workLogId);

    if (!deleted) {
      return res.status(404).json({ message: 'Work log not found' });
    }

    await activity.save();

    res.json({
      message: 'Work log deleted successfully',
      totalLoggedHours: activity.totalLoggedHours
    });
  } catch (error) {
    console.error('Delete work log error:', error);
    res.status(500).json({ message: 'Failed to delete work log', error: error.message });
  }
});

export default router;
