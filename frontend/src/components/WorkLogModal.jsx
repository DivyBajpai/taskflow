import { useState, useEffect } from 'react';
import { X, Clock, Calendar, Tag } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

const WorkLogModal = ({ isOpen, onClose, onSuccess, existingLog = null }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hoursSpent: '',
    logDate: new Date().toISOString().split('T')[0],
    logTime: '',
    category: 'other'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'development', label: '💻 Development', color: 'blue' },
    { value: 'design', label: '🎨 Design', color: 'purple' },
    { value: 'testing', label: '🧪 Testing', color: 'green' },
    { value: 'meeting', label: '👥 Meeting', color: 'yellow' },
    { value: 'documentation', label: '📝 Documentation', color: 'indigo' },
    { value: 'review', label: '👁️ Review', color: 'pink' },
    { value: 'planning', label: '📋 Planning', color: 'orange' },
    { value: 'other', label: '📌 Other', color: 'gray' }
  ];

  useEffect(() => {
    if (existingLog) {
      setFormData({
        title: existingLog.title || '',
        description: existingLog.description || '',
        hoursSpent: existingLog.hoursSpent || '',
        logDate: existingLog.logDate ? new Date(existingLog.logDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        logTime: existingLog.logTime || '',
        category: existingLog.category || 'other'
      });
    } else {
      // Reset form for new log
      setFormData({
        title: '',
        description: '',
        hoursSpent: '',
        logDate: new Date().toISOString().split('T')[0],
        logTime: '',
        category: 'other'
      });
    }
    setError('');
  }, [existingLog, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.hoursSpent || parseFloat(formData.hoursSpent) <= 0) {
      setError('Please enter valid hours (greater than 0)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (existingLog) {
        // Update existing log
        await api.patch(`/activity/work-log/${existingLog.activityId}/${existingLog._id}`, {
          ...formData,
          hoursSpent: parseFloat(formData.hoursSpent)
        });
      } else {
        // Create new log
        await api.post('/activity/work-log', {
          ...formData,
          hoursSpent: parseFloat(formData.hoursSpent)
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save work log');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className={`w-full max-w-2xl rounded-lg shadow-2xl ${
          theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'
        } border max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {existingLog ? 'Edit Work Log' : 'Log Your Work'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-[#282f39] text-[#9da8b9]' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              What did you work on? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Fixed login bug, Designed homepage mockup"
              className={`w-full px-4 py-2.5 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-[#111418] border-[#282f39] text-white placeholder-[#6b7280]'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add more details about what you accomplished..."
              rows={3}
              className={`w-full px-4 py-2.5 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-[#111418] border-[#282f39] text-white placeholder-[#6b7280]'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
              maxLength={500}
            />
          </div>

          {/* Hours, Date, Time in a grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Hours Spent */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Hours <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  theme === 'dark' ? 'text-[#6b7280]' : 'text-gray-400'
                }`} size={18} />
                <input
                  type="number"
                  name="hoursSpent"
                  value={formData.hoursSpent}
                  onChange={handleChange}
                  placeholder="2.5"
                  step="0.25"
                  min="0.25"
                  max="24"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-[#111418] border-[#282f39] text-white placeholder-[#6b7280]'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Date
              </label>
              <div className="relative">
                <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  theme === 'dark' ? 'text-[#6b7280]' : 'text-gray-400'
                }`} size={18} />
                <input
                  type="date"
                  name="logDate"
                  value={formData.logDate}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-[#111418] border-[#282f39] text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            {/* Time (Optional) */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Time
              </label>
              <input
                type="time"
                name="logTime"
                value={formData.logTime}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-[#111418] border-[#282f39] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Category
            </label>
            <div className="relative">
              <Tag className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                theme === 'dark' ? 'text-[#6b7280]' : 'text-gray-400'
              }`} size={18} />
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-[#111418] border-[#282f39] text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-[#282f39] text-white hover:bg-[#363d4a]'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {loading ? 'Saving...' : existingLog ? 'Update Log' : 'Add Work Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkLogModal;
