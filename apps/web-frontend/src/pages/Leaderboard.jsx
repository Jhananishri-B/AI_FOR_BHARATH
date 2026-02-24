import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star, 
  Flame, 
  Zap, 
  Users, 
  TrendingUp,
  Award,
  Target,
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  GraduationCap,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import { Link } from 'react-router-dom';
import certificationService from '../services/certificationService';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // all, week, month
  const [expandedUser, setExpandedUser] = useState(null);

  // Real data from API - no more mock data needed

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [leaderboardResponse, certificationsResponse] = await Promise.all([
          usersAPI.getLeaderboard(timeFilter),
          certificationService.getCertifications()
        ]);
        
        setLeaderboard(leaderboardResponse.data);
        setCertifications(certificationsResponse);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Show empty state if API fails
        setLeaderboard([]);
        setCertifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFilter]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-2xl font-bold text-slate-400">#{rank}</span>;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return "from-yellow-400 to-yellow-600";
      case 2:
        return "from-gray-300 to-gray-500";
      case 3:
        return "from-amber-500 to-amber-700";
      default:
        return "from-slate-600 to-slate-800";
    }
  };

  const toggleUserExpansion = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
          </div>
          <p className="text-slate-400 text-lg">See how you stack up against other learners</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-blue-400" />
              <span className="text-slate-400">Total Users</span>
            </div>
            <p className="text-3xl font-bold text-white">{leaderboard.length}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-yellow-400" />
              <span className="text-slate-400">Your Rank</span>
            </div>
            <p className="text-3xl font-bold text-white">#{user?.rank || 'N/A'}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6 text-purple-400" />
              <span className="text-slate-400">Your XP</span>
            </div>
            <p className="text-3xl font-bold text-white">{user?.xp || 0}</p>
          </div>
          
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-6 h-6 text-orange-400" />
              <span className="text-slate-400">Your Streak</span>
            </div>
            <p className="text-3xl font-bold text-white">{user?.streak_count || 0}</p>
          </div>
        </motion.div>

        {/* Time Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-slate-800 rounded-lg p-1 border border-slate-700">
            {['all', 'week', 'month'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter === 'all' ? 'All Time' : filter === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-400" />
              Top Performers
            </h2>
          </div>

          <div className="divide-y divide-slate-700">
            {leaderboard.map((userData, index) => (
              <motion.div
                key={userData.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`p-6 hover:bg-slate-750 transition-colors ${
                  userData.id === user?.id ? 'bg-blue-900/20 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex items-center justify-center w-12 h-12">
                      {getRankIcon(userData.rank)}
                    </div>

                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${getRankColor(userData.rank)}`}>
                      {userData.avatar}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">{userData.name}</h3>
                        {userData.id === user?.id && (
                          <span className="px-2 py-1 bg-blue-600 text-xs text-white rounded-full">You</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          {userData.xp.toLocaleString()} XP
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          Level {userData.level}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-4 h-4" />
                          {userData.streak} day streak
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {userData.completed_lessons} lessons
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expand Button */}
                  <button
                    onClick={() => toggleUserExpansion(userData.id)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    {expandedUser === userData.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Expanded Details */}
                {expandedUser === userData.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t border-slate-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Stats */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-3">Statistics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Completed Lessons</span>
                            <span className="text-white">{userData.completed_lessons}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Total Quizzes</span>
                            <span className="text-white">{userData.total_quizzes}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Average Score</span>
                            <span className="text-white">{userData.average_score}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Join Date</span>
                            <span className="text-white">{userData.join_date}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Last Active</span>
                            <span className="text-white">{userData.last_active}</span>
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-3">Badges</h4>
                        <div className="flex flex-wrap gap-2">
                          {userData.badges.map((badge, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Progress */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-3">Progress</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>XP Progress</span>
                              <span>{userData.xp} / {(userData.level + 1) * 1000}</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                style={{ width: `${(userData.xp % 1000) / 10}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>Streak Progress</span>
                              <span>{userData.streak} / 30</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                                style={{ width: `${Math.min((userData.streak / 30) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Certification Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
              <GraduationCap className="w-8 h-8 text-blue-400" />
              Earn Your Certifications
            </h2>
            <p className="text-slate-400 text-lg">
              Validate your skills with industry-recognized certifications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <div className="text-slate-500 text-lg">No certifications available</div>
                <div className="text-slate-400 text-sm">Check back later for new certification tracks</div>
              </div>
            ) : (
              certifications.slice(0, 3).map((cert, index) => {
                const colors = [
                  'from-blue-500 to-purple-600',
                  'from-green-500 to-blue-600',
                  'from-purple-500 to-pink-600'
                ];
                const borderColors = [
                  'hover:border-blue-500/50',
                  'hover:border-green-500/50',
                  'hover:border-purple-500/50'
                ];
                const buttonColors = [
                  'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
                  'from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700',
                  'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                ];

                return (
                  <div
                    key={cert.id || index}
                    className={`bg-slate-800 rounded-xl p-6 border border-slate-700 ${borderColors[index]} transition-all duration-200`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${colors[index]} rounded-lg flex items-center justify-center`}>
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{cert.title}</h3>
                        <p className="text-slate-400 text-sm">{cert.difficulty} Level</p>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm mb-4">
                      {cert.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{Math.round(cert.duration_minutes / 60)} hours</span>
                      </div>
                      <Link
                        to="/certification"
                        className={`flex items-center gap-2 bg-gradient-to-r ${buttonColors[index]} text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200`}
                      >
                        Start Now
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* View All Certifications */}
          <div className="text-center mt-8">
            <Link
              to="/certification"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 border border-slate-600 hover:border-slate-500"
            >
              <Award className="w-5 h-5" />
              View All Certifications
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Leaderboard;
