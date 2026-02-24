import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { 
  Zap, 
  Trophy, 
  BookOpen, 
  Star, 
  TrendingUp, 
  Target, 
  Award, 
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Flame,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Brain,
  Code,
  PlayCircle,
  Bookmark,
  Settings,
  Bell,
  ChevronRight,
  Plus,
  Minus,
  Edit3
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await usersAPI.getDashboard();
        setDashboardData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        // Use minimal fallback data if API fails
        setDashboardData({
          user: {
            name: user?.name || 'User',
            email: user?.email || '',
            xp: user?.xp || 0,
            level: user?.level || 1,
            badges: user?.badges || []
          },
          stats: {
            total_xp: user?.xp || 0,
            total_quizzes: 0,
            average_score: 0,
            best_score: 0,
            streak_count: 0,
            lessons_completed: 0,
            courses_started: 0,
            courses_completed: 0,
            total_study_time: 0,
            weekly_xp: 0,
            monthly_xp: 0
          },
          recent_activity: [],
          weekly_progress: [],
          skill_distribution: {},
          goals: [],
          achievements: [],
          enrolled_courses: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
            <p className="text-slate-400">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const stats = dashboardData?.stats || {};
  const recentActivity = dashboardData?.recent_activity || [];
  const weeklyProgress = dashboardData?.weekly_progress || [];
  const skillDistribution = dashboardData?.skill_distribution || {};
  const goals = dashboardData?.goals || [];
  const achievements = dashboardData?.achievements || [];

  const currentXP = user?.xp || stats.total_xp;
  const nextLevelXP = Math.ceil(currentXP / 1000) * 1000;
  const progressPercentage = ((currentXP % 1000) / 1000) * 100;

  // Chart data
  const weeklyChartData = {
    labels: weeklyProgress.length > 0 ? weeklyProgress.map(item => item.day) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'XP Earned',
        data: weeklyProgress.length > 0 ? weeklyProgress.map(item => item.xp) : [0, 0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Lessons Completed',
        data: weeklyProgress.length > 0 ? weeklyProgress.map(item => item.lessons) : [0, 0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const skillChartData = {
    labels: Object.keys(skillDistribution).length > 0 ? Object.keys(skillDistribution) : ['General'],
    datasets: [
      {
        data: Object.keys(skillDistribution).length > 0 ? Object.values(skillDistribution) : [1],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e2e8f0'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8'
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#94a3b8'
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e2e8f0',
          padding: 20
        }
      }
    }
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      // In a real app, this would make an API call
      console.log('Adding goal:', newGoal);
      setNewGoal('');
      setShowGoalModal(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
          <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-slate-400 text-lg">
            Ready to continue your learning journey?
          </p>
        </div>
            <div className="flex items-center gap-4">
              <Link
                to="/coach"
                className="relative p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors group"
              >
                <Bell className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Link>
              <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors">
                <Settings className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            {['overview', 'progress', 'achievements'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total XP</p>
                <p className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  {stats.total_xp.toLocaleString()}
                </p>
                <p className="text-xs text-green-400 mt-1">+{stats.weekly_xp} this week</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 hover:border-green-500/50 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Streak</p>
                <p className="text-3xl font-bold text-white group-hover:text-green-400 transition-colors">
                  {stats.streak_count} days
                </p>
                <p className="text-xs text-orange-400 mt-1">Keep it up!</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 hover:border-yellow-500/50 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Lessons</p>
                <p className="text-3xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                  {stats.lessons_completed}
                </p>
                <p className="text-xs text-blue-400 mt-1">{stats.courses_completed} courses done</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Avg Score</p>
                <p className="text-3xl font-bold text-white group-hover:text-purple-400 transition-colors">
                  {stats.average_score}%
                </p>
                <p className="text-xs text-green-400 mt-1">Best: {stats.best_score}%</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'overview' && (
              <>
            {/* Level Progress */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      Level Progress
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Level</span>
                      <span className="text-2xl font-bold text-blue-400">{user?.level || Math.floor(currentXP / 1000) + 1}</span>
                    </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                      <span>{currentXP.toLocaleString()} XP</span>
                      <span>{nextLevelXP.toLocaleString()} XP</span>
                </div>
                    <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                      <motion.div 
                        className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
                  <div className="flex items-center justify-between">
              <p className="text-slate-400 text-sm">
                {nextLevelXP - currentXP} XP until next level
              </p>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-4 h-4" />
                      <span className="text-sm font-medium">+{stats.weekly_xp} this week</span>
                    </div>
                  </div>
                </motion.div>

                {/* Weekly Progress Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-400" />
                      Weekly Progress
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>XP Earned</span>
                      <div className="w-3 h-3 bg-green-500 rounded-full ml-4"></div>
                      <span>Lessons</span>
                    </div>
                  </div>
                  <div className="h-64">
                    <Line data={weeklyChartData} options={chartOptions} />
            </div>
                </motion.div>

            {/* Recent Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-400" />
                      Recent Activity
                    </h2>
                    <Link
                      to="/courses"
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                    >
                      View All
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.slice(0, 5).map((activity, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                              <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-medium text-white">Quiz Completed</h3>
                              <p className="text-sm text-slate-400">
                                {new Date(activity.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-semibold ${
                              activity.score >= 90 ? 'text-green-400' : 
                              activity.score >= 80 ? 'text-blue-400' : 
                              activity.score >= 70 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {activity.score}%
                            </div>
                            <div className="text-sm text-slate-400">Score</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-400 mb-4">No recent activity</p>
                  <Link
                    to="/courses"
                    className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                  >
                        Start your first lesson!
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              )}
                </motion.div>
              </>
            )}

            {activeTab === 'progress' && (
              <>
                {/* Progress Overview Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                >
                  <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <BookOpen className="w-8 h-8 text-blue-400" />
                      <span className="text-3xl font-bold text-white">{stats.lessons_completed}</span>
                    </div>
                    <h3 className="text-blue-300 font-semibold mb-1">Lessons Learned</h3>
                    <p className="text-slate-400 text-sm">Topics completed</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Brain className="w-8 h-8 text-purple-400" />
                      <span className="text-3xl font-bold text-white">{stats.total_quizzes}</span>
                    </div>
                    <h3 className="text-purple-300 font-semibold mb-1">Quizzes Attended</h3>
                    <p className="text-slate-400 text-sm">Average: {stats.average_score}%</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-700/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Award className="w-8 h-8 text-green-400" />
                      <span className="text-3xl font-bold text-white">{stats.cert_tests_completed || 0}</span>
                    </div>
                    <h3 className="text-green-300 font-semibold mb-1">Certification Tests</h3>
                    <p className="text-slate-400 text-sm">Passed: {stats.cert_tests_passed || 0}</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 border border-orange-700/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Trophy className="w-8 h-8 text-orange-400" />
                      <span className="text-3xl font-bold text-white">{stats.courses_completed}</span>
                    </div>
                    <h3 className="text-orange-300 font-semibold mb-1">Courses Completed</h3>
                    <p className="text-slate-400 text-sm">Started: {stats.courses_started}</p>
                  </div>
                </motion.div>

                {/* Skill Distribution */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700"
                >
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-orange-400" />
                    Skill Distribution
                  </h2>
                  <div className="h-64">
                    <Doughnut data={skillChartData} options={doughnutOptions} />
                  </div>
                </motion.div>

                {/* Learning Goals */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-red-400" />
                      Learning Goals
                    </h2>
                    <button
                      onClick={() => setShowGoalModal(true)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {goals.map((goal) => (
                      <div key={goal.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-white">{goal.title}</h3>
                          <span className="text-sm text-slate-400">{goal.current}/{goal.target}</span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{goal.progress}% complete</span>
                          <span>{goal.target - goal.current} remaining</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}

            {activeTab === 'achievements' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700"
              >
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Achievements
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border transition-all duration-300 ${
                        achievement.earned
                          ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/50'
                          : 'bg-slate-700/50 border-slate-600 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h3 className={`font-medium ${
                            achievement.earned ? 'text-white' : 'text-slate-400'
                          }`}>
                            {achievement.title}
                          </h3>
                          <p className={`text-sm ${
                            achievement.earned ? 'text-slate-300' : 'text-slate-500'
                          }`}>
                            {achievement.description}
                          </p>
                        </div>
                        {achievement.earned && (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                      </div>
                    </div>
                  ))}
            </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Profile */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700"
            >
              <h3 className="text-lg font-bold text-white mb-4">Profile</h3>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <h4 className="font-medium text-white text-lg">{user?.name}</h4>
                <p className="text-slate-400 text-sm">{user?.email}</p>
                <div className="mt-4 p-3 bg-slate-700 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">Level {user?.level || Math.floor(currentXP / 1000) + 1}</div>
                  <div className="text-sm text-slate-400">Current Level</div>
                </div>
              </div>
            </motion.div>

            {/* Study Time */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Study Time
              </h3>
                <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Time</span>
                  <span className="text-white font-semibold">{Math.floor(stats.total_study_time / 60)}h {stats.total_study_time % 60}m</span>
                    </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">This Week</span>
                  <span className="text-white font-semibold">{Math.floor(stats.weekly_xp / 10)}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Avg/Day</span>
                  <span className="text-white font-semibold">{Math.floor(stats.total_study_time / 30)}m</span>
                </div>
            </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700"
            >
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/courses"
                  className="flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Courses
                </Link>
                <Link
                  to="/practice"
                  className="flex items-center justify-center w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium"
                >
                  <Code className="w-4 h-4 mr-2" />
                  Practice Problems
                </Link>
                <Link
                  to="/leaderboard"
                  className="flex items-center justify-center w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-3 px-4 rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 font-medium"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  View Leaderboard
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Goal Modal */}
        {showGoalModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800 rounded-2xl p-6 border border-slate-700 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-bold text-white mb-4">Add New Goal</h3>
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Enter your learning goal..."
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={addGoal}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Add Goal
                </button>
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;