import { useState, useEffect } from 'react';
import { Clock, Users, TrendingUp, Calendar, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const TeamActivityReport = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Check if user has permission
  const hasPermission = user && ['admin', 'hr', 'community_admin'].includes(user.role);

  useEffect(() => {
    if (!hasPermission) return;
    
    // Set default dates based on range
    const today = new Date();
    let start = new Date();
    
    if (dateRange === 'today') {
      start = today;
    } else if (dateRange === 'week') {
      start.setDate(today.getDate() - 7);
    } else if (dateRange === 'month') {
      start.setMonth(today.getMonth() - 1);
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, [dateRange, hasPermission]);

  useEffect(() => {
    if (!hasPermission || !startDate || !endDate) return;
    fetchReport();
  }, [startDate, endDate, hasPermission]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.get('/activity/workspace-report', {
        params: { startDate, endDate }
      });
      setReport(response.data.report || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch activity report:', error);
      setLoading(false);
    }
  };

  if (!hasPermission) {
    return (
      <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
        <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
          You don't have permission to view team activity reports.
        </p>
      </div>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} rounded-lg border p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-blue-500" size={24} />
          <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Team Activity Report
          </h3>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex gap-2">
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
        
        <div className="flex gap-2 ml-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`px-3 py-1.5 rounded text-sm ${
              theme === 'dark'
                ? 'bg-[#282f39] border-[#363d4a] text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } border`}
          />
          <span className={`flex items-center ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`px-3 py-1.5 rounded text-sm ${
              theme === 'dark'
                ? 'bg-[#282f39] border-[#363d4a] text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } border`}
          />
        </div>
      </div>

      {/* Report Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-16 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-100'} rounded animate-pulse`} />
          ))}
        </div>
      ) : report.length === 0 ? (
        <div className={`text-center py-8 ${theme === 'dark' ? 'text-[#6b7280]' : 'text-gray-500'}`}>
          <Clock className="mx-auto mb-2 opacity-50" size={48} />
          <p>No activity data for this period</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}>
                <th className={`text-left py-3 px-2 text-sm font-semibold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                  User
                </th>
                <th className={`text-right py-3 px-2 text-sm font-semibold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                  Total Time
                </th>
                <th className={`text-right py-3 px-2 text-sm font-semibold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                  Days Active
                </th>
                <th className={`text-right py-3 px-2 text-sm font-semibold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                  Avg/Day
                </th>
              </tr>
            </thead>
            <tbody>
              {report.map((userReport, index) => (
                <tr 
                  key={userReport.user.id}
                  className={`border-b ${theme === 'dark' ? 'border-[#282f39] hover:bg-[#282f39]' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-semibold text-sm">
                        {index + 1}
                      </div>
                      {userReport.user.profile_picture ? (
                        <img 
                          src={userReport.user.profile_picture} 
                          alt={userReport.user.full_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                          {userReport.user.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {userReport.user.full_name}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-[#6b7280]' : 'text-gray-500'}`}>
                          {userReport.user.role}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={`py-3 px-2 text-right font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {userReport.formattedDuration}
                  </td>
                  <td className={`py-3 px-2 text-right ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                    {userReport.daysActive}
                  </td>
                  <td className={`py-3 px-2 text-right ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                    {userReport.averagePerDay.toFixed(1)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={`mt-4 p-3 ${theme === 'dark' ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'} border rounded-lg`}>
        <p className={`text-xs ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
          📊 <strong>Note:</strong> Activity time reflects actual engagement (mouse, keyboard, clicks) while logged in.
        </p>
      </div>
    </div>
  );
};

export default TeamActivityReport;
