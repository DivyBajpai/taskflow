import { useState, useEffect } from 'react';
import { Clock, TrendingUp, Calendar, Activity } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

const ActivitySummary = () => {
  const { theme } = useTheme();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivitySummary();
    
    // Refresh every minute
    const interval = setInterval(fetchActivitySummary, 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchActivitySummary = async () => {
    try {
      const response = await api.get('/activity/summary');
      setSummary(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch activity summary:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
        <div className="animate-pulse">
          <div className={`h-6 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-200'} rounded w-32 mb-4`}></div>
          <div className={`h-16 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-200'} rounded mb-2`}></div>
          <div className={`h-16 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-200'} rounded mb-2`}></div>
          <div className={`h-16 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-200'} rounded`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
      <div className="flex items-center gap-3 mb-6">
        <Activity className="text-blue-500" size={24} />
        <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          My Activity Time
        </h3>
      </div>

      <div className="space-y-4">
        {/* Today */}
        <div className={`${theme === 'dark' ? 'bg-[#111418] border-[#282f39]' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`} size={18} />
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                Today
              </span>
            </div>
            <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {summary?.today?.formatted || '0h 0m'}
            </span>
          </div>
          <div className={`w-full h-2 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-200'} rounded-full overflow-hidden`}>
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${Math.min((summary?.today?.seconds || 0) / (8 * 3600) * 100, 100)}%` }}
            />
          </div>
          <p className={`text-xs ${theme === 'dark' ? 'text-[#6b7280]' : 'text-gray-500'} mt-1`}>
            Target: 8 hours
          </p>
        </div>

        {/* This Week */}
        <div className={`${theme === 'dark' ? 'bg-[#111418] border-[#282f39]' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`} size={18} />
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                This Week
              </span>
            </div>
            <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {summary?.thisWeek?.formatted || '0h 0m'}
            </span>
          </div>
          <p className={`text-xs ${theme === 'dark' ? 'text-[#6b7280]' : 'text-gray-500'}`}>
            {summary?.thisWeek?.daysActive || 0} days active
          </p>
        </div>

        {/* This Month */}
        <div className={`${theme === 'dark' ? 'bg-[#111418] border-[#282f39]' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`} size={18} />
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                This Month
              </span>
            </div>
            <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {summary?.thisMonth?.formatted || '0h 0m'}
            </span>
          </div>
          <p className={`text-xs ${theme === 'dark' ? 'text-[#6b7280]' : 'text-gray-500'}`}>
            {summary?.thisMonth?.daysActive || 0} days active
          </p>
        </div>
      </div>

      <div className={`mt-4 p-3 ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} border rounded-lg`}>
        <p className={`text-xs ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
          💡 <strong>Tip:</strong> Your activity time is automatically tracked while you work. Stay focused!
        </p>
      </div>
    </div>
  );
};

export default ActivitySummary;
