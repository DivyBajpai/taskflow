import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, Calendar, Tag } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import WorkLogModal from './WorkLogModal';

const WorkLogList = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [dateRange, setDateRange] = useState('week');
  const [totalHours, setTotalHours] = useState(0);
  const [stats, setStats] = useState({
    totalLogs: 0,
    averageHoursPerDay: 0,
    categoryBreakdown: {}
  });

  const categories = {
    development: { label: '💻 Development', color: 'blue' },
    design: { label: '🎨 Design', color: 'purple' },
    testing: { label: '🧪 Testing', color: 'green' },
    meeting: { label: '👥 Meeting', color: 'yellow' },
    documentation: { label: '📝 Documentation', color: 'indigo' },
    review: { label: '👁️ Review', color: 'pink' },
    planning: { label: '📋 Planning', color: 'orange' },
    other: { label: '📌 Other', color: 'gray' }
  };

  useEffect(() => {
    fetchWorkLogs();
  }, [dateRange]);

  const fetchWorkLogs = async () => {
    setLoading(true);
    try {
      const today = new Date();
      let startDate = new Date();

      if (dateRange === 'today') {
        startDate = today;
      } else if (dateRange === 'week') {
        startDate.setDate(today.getDate() - 7);
      } else if (dateRange === 'month') {
        startDate.setMonth(today.getMonth() - 1);
      }

      const response = await api.get('/activity/work-logs', {
        params: {
          startDate: startDate.toISOString(),
          endDate: today.toISOString()
        }
      });

      const logs = response.data.workLogs || [];
      const total = response.data.totalHours || 0;
      
      setWorkLogs(logs);
      setTotalHours(total);

      // Calculate stats
      const daysInRange = dateRange === 'today' ? 1 : 
                         dateRange === 'week' ? 7 : 30;
      
      // Category breakdown
      const categoryBreakdown = {};
      logs.forEach(log => {
        const cat = log.category || 'other';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + log.hoursSpent;
      });

      setStats({
        totalLogs: logs.length,
        averageHoursPerDay: logs.length > 0 ? (total / daysInRange) : 0,
        categoryBreakdown
      });
    } catch (error) {
      console.error('Failed to fetch work logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (activityDate, workLogId) => {
    if (!window.confirm('Are you sure you want to delete this work log?')) return;

    try {
      // Find the activity ID for this work log
      const activity = workLogs.find(log => log._id === workLogId);
      await api.delete(`/activity/work-log/${activity.activityDate}/${workLogId}`);
      fetchWorkLogs();
    } catch (error) {
      console.error('Failed to delete work log:', error);
      alert('Failed to delete work log. Please try again.');
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingLog(null);
  };

  const handleModalSuccess = () => {
    fetchWorkLogs();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      green: 'bg-green-500/10 text-green-500 border-green-500/20',
      yellow: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      pink: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
      orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      gray: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    };
    return colors[categories[category]?.color] || colors.gray;
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            My Work Logs
          </h3>
          <div className="flex gap-4 mt-2">
            <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
              <span className="font-semibold text-blue-500">{totalHours.toFixed(2)}h</span> total
            </p>
            <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
              <span className="font-semibold text-green-500">{stats.averageHoursPerDay.toFixed(1)}h</span> avg/day
            </p>
            <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
              <span className="font-semibold text-purple-500">{stats.totalLogs}</span> entries
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingLog(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus size={18} />
          Log Work
        </button>
      </div>

      {/* Stats Cards */}
      {Object.keys(stats.categoryBreakdown).length > 0 && (
        <div className={`grid grid-cols-4 gap-3 p-4 rounded-lg mb-4 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-50'}`}>
          {Object.entries(stats.categoryBreakdown).map(([category, hours]) => (
            <div key={category} className="text-center">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(category)}`}>
                {categories[category]?.label}
              </div>
              <p className={`text-lg font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {hours.toFixed(1)}h
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Date Range Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setDateRange('today')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            dateRange === 'today'
              ? 'bg-blue-500 text-white'
              : theme === 'dark'
                ? 'bg-[#282f39] text-[#9da8b9] hover:bg-[#363d4a]'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setDateRange('week')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            dateRange === 'week'
              ? 'bg-blue-500 text-white'
              : theme === 'dark'
                ? 'bg-[#282f39] text-[#9da8b9] hover:bg-[#363d4a]'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setDateRange('month')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            dateRange === 'month'
              ? 'bg-blue-500 text-white'
              : theme === 'dark'
                ? 'bg-[#282f39] text-[#9da8b9] hover:bg-[#363d4a]'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last 30 Days
        </button>
      </div>

      {/* Work Logs List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-24 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-100'} rounded animate-pulse`} />
          ))}
        </div>
      ) : workLogs.length === 0 ? (
        <div className={`text-center py-12 ${theme === 'dark' ? 'text-[#6b7280]' : 'text-gray-500'}`}>
          <Clock className="mx-auto mb-3 opacity-50" size={48} />
          <p className="font-medium mb-1">No work logs yet</p>
          <p className="text-sm">Start logging your work to track productivity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workLogs.map((log) => (
            <div
              key={log._id}
              className={`p-4 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-[#111418] border-[#282f39] hover:border-[#363d4a]'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              } transition-colors`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>
                      {log.title}
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getCategoryColor(log.category)}`}>
                      {categories[log.category]?.label.split(' ')[1] || log.category}
                    </span>
                  </div>
                  
                  {log.description && (
                    <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mb-2 line-clamp-2`}>
                      {log.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs">
                    <div className={`flex items-center gap-1 ${theme === 'dark' ? 'text-[#6b7280]' : 'text-gray-500'}`}>
                      <Clock size={14} />
                      <span className="font-semibold text-blue-500">{log.hoursSpent}h</span>
                    </div>
                    <div className={`flex items-center gap-1 ${theme === 'dark' ? 'text-[#6b7280]' : 'text-gray-500'}`}>
                      <Calendar size={14} />
                      <span>{formatDate(log.logDate)}</span>
                    </div>
                    {log.logTime && (
                      <div className={`flex items-center gap-1 ${theme === 'dark' ? 'text-[#6b7280]' : 'text-gray-500'}`}>
                        <span>🕐 {log.logTime}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(log)}
                    className={`p-2 rounded transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-[#282f39] text-[#9da8b9] hover:text-white'
                        : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                    }`}
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(log.activityDate, log._id)}
                    className={`p-2 rounded transition-colors ${
                      theme === 'dark'
                        ? 'hover:bg-red-500/10 text-[#9da8b9] hover:text-red-500'
                        : 'hover:bg-red-50 text-gray-600 hover:text-red-600'
                    }`}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Work Log Modal */}
      <WorkLogModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        existingLog={editingLog}
      />
    </div>
  );
};

export default WorkLogList;
