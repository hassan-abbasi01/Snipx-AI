import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Video,
  Activity,
  TrendingUp,
  CalendarDays,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

type Period = 'week' | 'month' | 'year';

interface ChartApiResponse {
  success: boolean;
  labels: string[];
  data: number[];
  message?: string;
}

interface SupportStats {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  total: number;
}

interface DataPoint {
  date: string;
  value: number;
}

interface TimelinePoint {
  date: string;
  users: number;
  videos: number;
  activity: number;
}

const PERIOD_OPTIONS: Period[] = ['week', 'month', 'year'];
const SUPPORT_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#64748b'];

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

const formatPercentage = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const getTrendPercent = (values: number[]) => {
  if (values.length < 2) return 0;
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  if (first === 0) return last > 0 ? 100 : 0;
  return ((last - first) / first) * 100;
};

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('week');
  const [usersData, setUsersData] = useState<DataPoint[]>([]);
  const [videosData, setVideosData] = useState<DataPoint[]>([]);
  const [activityData, setActivityData] = useState<DataPoint[]>([]);
  const [supportStats, setSupportStats] = useState<SupportStats>({
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchChart = async (endpoint: string, token: string): Promise<ChartApiResponse> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        navigate('/admin/login');
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(`Failed to load analytics (${response.status})`);
    }

    const payload = (await response.json()) as ChartApiResponse;
    if (!payload.success) {
      throw new Error(payload.message || 'Analytics endpoint returned unsuccessful response');
    }

    return payload;
  };

  const fetchSupportStats = async (token: string): Promise<SupportStats> => {
    const response = await fetch(`${API_URL}/admin/support/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        navigate('/admin/login');
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(`Failed to load support stats (${response.status})`);
    }

    const payload = await response.json();
    if (!payload.success) {
      throw new Error(payload.message || 'Support stats endpoint returned unsuccessful response');
    }

    return payload.stats as SupportStats;
  };

  const toPoints = (payload: ChartApiResponse): DataPoint[] =>
    payload.labels.map((label, index) => ({
      date: label,
      value: payload.data[index] ?? 0,
    }));

  const fetchAnalyticsData = async (isManualRefresh = false) => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [users, videos, activity, support] = await Promise.all([
        fetchChart(`/admin/analytics/chart/users?period=${period}`, token),
        fetchChart(`/admin/analytics/chart/videos?period=${period}`, token),
        fetchChart(`/admin/analytics/chart/activity?period=${period}`, token),
        fetchSupportStats(token),
      ]);

      setUsersData(toPoints(users));
      setVideosData(toPoints(videos));
      setActivityData(toPoints(activity));
      setSupportStats(support);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching analytics:', err);
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const timelineData = useMemo<TimelinePoint[]>(() => {
    const maxLength = Math.max(usersData.length, videosData.length, activityData.length);
    const merged: TimelinePoint[] = [];

    for (let i = 0; i < maxLength; i++) {
      merged.push({
        date: usersData[i]?.date || videosData[i]?.date || activityData[i]?.date || `P${i + 1}`,
        users: usersData[i]?.value ?? 0,
        videos: videosData[i]?.value ?? 0,
        activity: activityData[i]?.value ?? 0,
      });
    }

    return merged;
  }, [usersData, videosData, activityData]);

  const stats = useMemo(() => {
    const userValues = usersData.map((item) => item.value);
    const videoValues = videosData.map((item) => item.value);
    const activityValues = activityData.map((item) => item.value);

    const totalUsers = userValues.reduce((sum, value) => sum + value, 0);
    const totalVideos = videoValues.reduce((sum, value) => sum + value, 0);
    const avgActivity =
      activityValues.length > 0
        ? activityValues.reduce((sum, value) => sum + value, 0) / activityValues.length
        : 0;
    const peakActivity = activityValues.length > 0 ? Math.max(...activityValues) : 0;

    const peakActivityPoint =
      timelineData.find((point) => point.activity === peakActivity) || timelineData[timelineData.length - 1];

    return {
      totalUsers,
      totalVideos,
      avgActivity,
      peakActivity,
      usersTrend: getTrendPercent(userValues),
      videosTrend: getTrendPercent(videoValues),
      activityTrend: getTrendPercent(activityValues),
      peakActivityDate: peakActivityPoint?.date || '-',
    };
  }, [usersData, videosData, activityData, timelineData]);

  const supportChartData = useMemo(
    () => [
      { name: 'Open', value: supportStats.open },
      { name: 'In Progress', value: supportStats.in_progress },
      { name: 'Resolved', value: supportStats.resolved },
      { name: 'Closed', value: supportStats.closed },
    ],
    [supportStats]
  );

  if (loading && timelineData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Analytics Intelligence</h1>
                <p className="text-sm text-slate-500">
                  Performance trends for users, uploads, and platform engagement.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                {PERIOD_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                      period === p
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => fetchAnalyticsData(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>

              {lastUpdated && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm">
                  <CalendarDays className="w-4 h-4" />
                  Updated {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-800">Analytics data could not be loaded</p>
              <p className="text-sm text-rose-700">{error}</p>
            </div>
            <button
              onClick={() => fetchAnalyticsData(true)}
              className="px-3 py-1.5 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-50">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className={`text-xs font-semibold ${stats.usersTrend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatPercentage(stats.usersTrend)}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCompactNumber(stats.totalUsers)}</p>
            <p className="text-sm text-slate-500 mt-1">Users Added ({period})</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-violet-50">
                <Video className="w-5 h-5 text-violet-600" />
              </div>
              <span className={`text-xs font-semibold ${stats.videosTrend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatPercentage(stats.videosTrend)}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{formatCompactNumber(stats.totalVideos)}</p>
            <p className="text-sm text-slate-500 mt-1">Video Uploads ({period})</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-50">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <span className={`text-xs font-semibold ${stats.activityTrend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatPercentage(stats.activityTrend)}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.avgActivity.toFixed(1)}</p>
            <p className="text-sm text-slate-500 mt-1">Average Activity Score</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-50">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-amber-700">Peak Window</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.peakActivity.toFixed(0)}</p>
            <p className="text-sm text-slate-500 mt-1">Peak Activity on {stats.peakActivityDate}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Platform Performance Overview</h2>
              <p className="text-sm text-slate-500">Users, uploads, and engagement in one unified view</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={timelineData}>
              <defs>
                <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  boxShadow: '0 10px 25px -10px rgba(2, 6, 23, 0.2)',
                }}
              />
              <Legend />
              <Area yAxisId="right" type="monotone" dataKey="activity" stroke="#10b981" fill="url(#activityFill)" strokeWidth={2} />
              <Bar yAxisId="left" dataKey="videos" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Line yAxisId="left" type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={3} dot={{ r: 3, fill: '#2563eb' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-5">User Growth Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usersData.map((item) => ({ date: item.date, users: item.value }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', background: '#ffffff' }}
                />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-5">Analytics Highlights</h3>
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Most Active Period</p>
                <p className="text-lg font-bold text-slate-900">{stats.peakActivityDate}</p>
                <p className="text-sm text-slate-600">Activity score reached {stats.peakActivity.toFixed(0)}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Engagement Direction</p>
                <p className={`text-lg font-bold ${stats.activityTrend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatPercentage(stats.activityTrend)}
                </p>
                <p className="text-sm text-slate-600">Compared to the start of selected {period}</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Upload Velocity</p>
                <p className="text-lg font-bold text-slate-900">
                  {(stats.totalVideos / Math.max(1, timelineData.length)).toFixed(1)} / point
                </p>
                <p className="text-sm text-slate-600">Average videos per reporting point</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-5">Video Upload Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={videosData.map((item) => ({ date: item.date, videos: item.value }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', background: '#ffffff' }} />
              <Bar dataKey="videos" fill="#a855f7" radius={[8, 8, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-5">Platform Activity Pulse</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activityData.map((item) => ({ date: item.date, activity: item.value }))}>
              <defs>
                <linearGradient id="pulseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', background: '#ffffff' }} />
              <Area type="monotone" dataKey="activity" stroke="#10b981" strokeWidth={3} fill="url(#pulseFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-5">Support Ticket Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={supportChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                >
                  {supportChartData.map((_, index) => (
                    <Cell key={`support-cell-${index}`} fill={SUPPORT_COLORS[index % SUPPORT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-5">Support Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                <p className="text-xs uppercase tracking-wide text-blue-600 mb-1">Open</p>
                <p className="text-2xl font-bold text-blue-700">{supportStats.open}</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-4 border border-amber-100">
                <p className="text-xs uppercase tracking-wide text-amber-600 mb-1">In Progress</p>
                <p className="text-2xl font-bold text-amber-700">{supportStats.in_progress}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
                <p className="text-xs uppercase tracking-wide text-emerald-600 mb-1">Resolved</p>
                <p className="text-2xl font-bold text-emerald-700">{supportStats.resolved}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Closed</p>
                <p className="text-2xl font-bold text-slate-700">{supportStats.closed}</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-200">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Total Tickets</p>
              <p className="text-3xl font-bold text-slate-900">{supportStats.total}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
