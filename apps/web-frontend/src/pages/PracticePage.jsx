import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Code, Clock, Star, Filter, Search, ChevronRight, Zap, Trophy, Flame } from 'lucide-react';
import { problemsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const PracticePage = () => {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    difficulty: 'all',
    search: ''
  });

  useEffect(() => {
    fetchProblems();
  }, []);

  useEffect(() => {
    filterProblems();
  }, [problems, filters]);

  const fetchProblems = async () => {
    try {
      const response = await problemsAPI.getProblems();
      setProblems(response.data);
    } catch (err) {
      setError('Failed to load practice problems');
      console.error('Error fetching problems:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterProblems = () => {
    let filtered = [...problems];

    // Filter by difficulty
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(problem => 
        problem.difficulty.toLowerCase() === filters.difficulty.toLowerCase()
      );
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(problem => {
        const title = (problem.title || '').toLowerCase();
        const tags = Array.isArray(problem.tags) ? problem.tags : [];
        const courseTitle = (problem.course_title || '').toLowerCase();
        return (
          title.includes(searchTerm) ||
          tags.some(tag => (tag || '').toLowerCase().includes(searchTerm)) ||
          courseTitle.includes(searchTerm)
        );
      });
    }

    setFilteredProblems(filtered);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-400 bg-green-900/20 border-green-500/50';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/50';
      case 'hard':
        return 'text-red-400 bg-red-900/20 border-red-500/50';
      default:
        return 'text-slate-400 bg-slate-900/20 border-slate-500/50';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'hard':
        return '🔴';
      default:
        return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading practice problems...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Code className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-red-400 text-xl mb-6">{error}</p>
          <button
            onClick={fetchProblems}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Code className="w-10 h-10 text-blue-400" />
                Practice Zone
              </h1>
              <p className="text-slate-400 text-lg">
                Sharpen your coding skills with LeetCode-style challenges
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4 text-slate-300">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold">{user?.xp || 0} XP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="font-semibold">{user?.streak_count || 0} day streak</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search problems, tags, or courses..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Difficulty Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilters({ ...filters, difficulty: 'all' })}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  filters.difficulty === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilters({ ...filters, difficulty: 'easy' })}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  filters.difficulty === 'easy'
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Easy
              </button>
              <button
                onClick={() => setFilters({ ...filters, difficulty: 'medium' })}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  filters.difficulty === 'medium'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setFilters({ ...filters, difficulty: 'hard' })}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  filters.difficulty === 'hard'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Hard
              </button>
            </div>
          </div>
        </div>

        {/* Problems List */}
        <div className="space-y-4">
          {filteredProblems.length === 0 ? (
            <div className="text-center py-12">
              <Code className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No problems found</h3>
              <p className="text-slate-500">
                {filters.search || filters.difficulty !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No practice problems available yet'}
              </p>
            </div>
          ) : (
            filteredProblems.map((problem) => (
              <div
                key={problem.problem_id}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {problem.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                        {getDifficultyIcon(problem.difficulty)} {problem.difficulty}
                      </span>
                    </div>
                    
                    {problem.course_title && (
                      <p className="text-slate-400 text-sm mb-4">
                        From: <span className="text-blue-400">{problem.course_title}</span>
                      </p>
                    )}

                    {problem.tags && problem.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {problem.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/practice/${problem.problem_id}`}
                    className="ml-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2 group-hover:shadow-lg"
                  >
                    Solve
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        {filteredProblems.length > 0 && (
          <div className="mt-8 bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Practice Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {filteredProblems.length}
                </div>
                <div className="text-slate-400">Available Problems</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {filteredProblems.filter(p => p.difficulty.toLowerCase() === 'easy').length}
                </div>
                <div className="text-slate-400">Easy Problems</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {filteredProblems.filter(p => p.difficulty.toLowerCase() === 'medium').length}
                </div>
                <div className="text-slate-400">Medium Problems</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </Layout>
  );
};

export default PracticePage;
