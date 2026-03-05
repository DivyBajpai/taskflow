import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  // Total active time in seconds for the day
  totalActiveSeconds: {
    type: Number,
    default: 0
  },
  // Activity sessions throughout the day
  sessions: [{
    startTime: Date,
    endTime: Date,
    durationSeconds: Number,
    pageVisits: [{
      page: String,
      timestamp: Date,
      duration: Number
    }]
  }],
  // Activity metadata
  metadata: {
    mouseClicks: { type: Number, default: 0 },
    keystrokes: { type: Number, default: 0 },
    pageViews: { type: Number, default: 0 },
    tasksCreated: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    commentsAdded: { type: Number, default: 0 }
  },
  // Last activity timestamp
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for efficient queries
userActivitySchema.index({ userId: 1, date: 1 }, { unique: true });
userActivitySchema.index({ workspaceId: 1, date: 1 });
userActivitySchema.index({ userId: 1, workspaceId: 1, date: 1 });

// Pre-save hook to update timestamp
userActivitySchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Static method to get or create today's activity record
userActivitySchema.statics.getTodayActivity = async function(userId, workspaceId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let activity = await this.findOne({
    userId,
    workspaceId,
    date: today
  });
  
  if (!activity) {
    activity = await this.create({
      userId,
      workspaceId,
      date: today,
      totalActiveSeconds: 0,
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
  
  return activity;
};

// Method to add activity time
userActivitySchema.methods.addActivityTime = function(seconds) {
  this.totalActiveSeconds += seconds;
  this.lastActivityAt = Date.now();
};

// Method to format total time as human-readable
userActivitySchema.methods.getFormattedDuration = function() {
  const hours = Math.floor(this.totalActiveSeconds / 3600);
  const minutes = Math.floor((this.totalActiveSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

export default UserActivity;
