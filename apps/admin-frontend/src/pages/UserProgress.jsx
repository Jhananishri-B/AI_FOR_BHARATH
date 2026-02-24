import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminAPI, adminCertTestsAPI } from '../services/api'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
} from 'chart.js'
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2'
import { 
  ArrowLeft, 
  TrendingUp, 
  Award, 
  BookOpen, 
  Brain, 
  Target, 
  Clock, 
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  User as UserIcon
} from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
)

const UserProgress = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  
  const [user, setUser] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUserData()
  }, [userId])

  const loadUserData = async () => {
    try {
      setLoading(true)
      // Load user details
      const userRes = await adminAPI.getUser(userId)
      setUser(userRes.data)

      // Load all attempts
      const attemptsRes = await adminCertTestsAPI.getAllAttempts()
      const userAttempts = attemptsRes.data.filter(a => a.user_id === userId)
      console.log('User attempts:', userAttempts) // Debug log
      setAttempts(userAttempts)
    } catch (e) {
      setError('Failed to load user data')
      console.error('Error loading user data:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading user data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-400 text-lg mb-4">{error}</div>
        <button
          onClick={() => navigate('/users')}
          className="px-4 py-2 bg-blue-600 rounded flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </button>
      </div>
    )
  }

  if (!user) {
    return <div>User not found</div>
  }

  // Calculate statistics
  const completedAttempts = attempts.filter(a => a.status === 'completed' || a.completed_at)
  const passedAttempts = completedAttempts.filter(a => a.score >= 70)
  const failedAttempts = completedAttempts.filter(a => a.score < 70)
  const averageScore = completedAttempts.length > 0
    ? Math.round(completedAttempts.reduce((sum, a) => sum + a.score, 0) / completedAttempts.length)
    : 0
  
  // Get recent attempts (last 10)
  const recentAttempts = [...completedAttempts]
    .sort((a, b) => {
      const dateA = new Date(a.completed_at || a.created_at)
      const dateB = new Date(b.completed_at || b.created_at)
      return dateB - dateA
    })
    .slice(0, 10)

  // Score trend over time (last 15 attempts)
  const scoreTrendData = {
    labels: recentAttempts.reverse().map((_, i) => `Test ${i + 1}`),
    datasets: [
      {
        label: 'Score %',
        data: recentAttempts.map(a => a.score),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Pass Threshold',
        data: recentAttempts.map(() => 70),
        borderColor: 'rgb(34, 197, 94)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      }
    ]
  }

  // Performance breakdown by difficulty
  const difficultyBreakdown = {
    easy: completedAttempts.filter(a => a.difficulty === 'easy'),
    medium: completedAttempts.filter(a => a.difficulty === 'medium'),
    hard: completedAttempts.filter(a => a.difficulty === 'hard'),
  }

  const difficultyData = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [
      {
        label: 'Average Score',
        data: [
          difficultyBreakdown.easy.length > 0 
            ? Math.round(difficultyBreakdown.easy.reduce((s, a) => s + a.score, 0) / difficultyBreakdown.easy.length)
            : 0,
          difficultyBreakdown.medium.length > 0
            ? Math.round(difficultyBreakdown.medium.reduce((s, a) => s + a.score, 0) / difficultyBreakdown.medium.length)
            : 0,
          difficultyBreakdown.hard.length > 0
            ? Math.round(difficultyBreakdown.hard.reduce((s, a) => s + a.score, 0) / difficultyBreakdown.hard.length)
            : 0,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',
          'rgba(251, 191, 36, 0.6)',
          'rgba(239, 68, 68, 0.6)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      }
    ]
  }

  // Pass/Fail distribution
  const passFailData = {
    labels: ['Passed', 'Failed'],
    datasets: [
      {
        data: [passedAttempts.length, failedAttempts.length],
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',
          'rgba(239, 68, 68, 0.6)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      }
    ]
  }

  // Question type performance (MCQ vs Coding)
  const mcqStats = completedAttempts.map(a => {
    const result = a.result || {}
    const total = (result.mcq_total || 0)
    const correct = (result.mcq_correct || 0)
    return total > 0 ? (correct / total) * 100 : 0
  })

  const codeStats = completedAttempts.map(a => {
    const result = a.result || {}
    const total = (result.code_total || 0)
    const correct = (result.code_correct || 0)
    return total > 0 ? (correct / total) * 100 : 0
  })

  const avgMcqScore = mcqStats.length > 0
    ? Math.round(mcqStats.reduce((s, v) => s + v, 0) / mcqStats.length)
    : 0

  const avgCodeScore = codeStats.length > 0
    ? Math.round(codeStats.reduce((s, v) => s + v, 0) / codeStats.length)
    : 0

  const questionTypeData = {
    labels: ['MCQ Performance', 'Coding Performance'],
    datasets: [
      {
        label: 'Average Score %',
        data: [avgMcqScore, avgCodeScore],
        backgroundColor: [
          'rgba(139, 92, 246, 0.6)',
          'rgba(236, 72, 153, 0.6)',
        ],
        borderColor: [
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
        ],
        borderWidth: 1,
      }
    ]
  }

  // Skill radar chart
  const radarData = {
    labels: ['MCQ', 'Coding', 'Easy Tests', 'Medium Tests', 'Hard Tests', 'Consistency'],
    datasets: [
      {
        label: 'Performance Profile',
        data: [
          avgMcqScore,
          avgCodeScore,
          difficultyBreakdown.easy.length > 0 
            ? Math.round(difficultyBreakdown.easy.reduce((s, a) => s + a.score, 0) / difficultyBreakdown.easy.length)
            : 0,
          difficultyBreakdown.medium.length > 0
            ? Math.round(difficultyBreakdown.medium.reduce((s, a) => s + a.score, 0) / difficultyBreakdown.medium.length)
            : 0,
          difficultyBreakdown.hard.length > 0
            ? Math.round(difficultyBreakdown.hard.reduce((s, a) => s + a.score, 0) / difficultyBreakdown.hard.length)
            : 0,
          user.streak_count ? Math.min(user.streak_count * 10, 100) : 0,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e2e8f0',
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { size: 10 } },
        grid: { color: 'rgba(51, 65, 85, 0.3)' }
      },
      y: {
        ticks: { color: '#94a3b8', font: { size: 10 } },
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        min: 0,
        max: 100,
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart'
    }
  }

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e2e8f0',
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
      }
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(51, 65, 85, 0.3)' },
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        pointLabels: { color: '#94a3b8', font: { size: 11 } },
        ticks: { 
          color: '#94a3b8',
          backdropColor: 'transparent',
          min: 0,
          max: 100,
          stepSize: 20,
        }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart'
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e2e8f0',
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#e2e8f0',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2000,
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/users')}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserIcon className="w-6 h-6" />
          User Progress Analytics
        </h1>
        <button
          onClick={() => navigate('/users/compare')}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded flex items-center gap-2 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          Compare with Others
        </button>
      </div>

      {/* User Info Card */}
      <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{user.name}</h2>
            <p className="text-slate-300 mb-1">{user.email}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="px-3 py-1 bg-blue-600/30 rounded-full border border-blue-500/50">
                {user.role || 'student'}
              </span>
              <span className="text-slate-400">
                Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-400 mb-1">Level {user.level || 1}</div>
            <div className="text-slate-400">{user.xp || 0} XP</div>
            <div className="flex items-center gap-2 mt-2 text-orange-400">
              <Activity className="w-4 h-4" />
              <span>{user.streak_count || 0} day streak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Total Tests</span>
            <BookOpen className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{completedAttempts.length}</div>
          <div className="text-xs text-slate-500 mt-1">
            {attempts.filter(a => a.status !== 'completed' && !a.completed_at).length} in progress
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Average Score</span>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">{averageScore}%</div>
          <div className="text-xs text-slate-500 mt-1">
            Across all tests
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Pass Rate</span>
            <Target className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {completedAttempts.length > 0
              ? Math.round((passedAttempts.length / completedAttempts.length) * 100)
              : 0}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {passedAttempts.length} passed / {completedAttempts.length} total
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Recent Activity</span>
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {user.last_active_date 
              ? Math.floor((new Date() - new Date(user.last_active_date)) / (1000 * 60 * 60 * 24))
              : 'N/A'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {user.last_active_date ? 'days ago' : 'No activity'}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Trend Chart */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold">Score Trend</h3>
          </div>
          <div className="h-64">
            {recentAttempts.length > 0 ? (
              <Line data={scoreTrendData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No test data available
              </div>
            )}
          </div>
        </div>

        {/* Performance by Difficulty */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold">Performance by Difficulty</h3>
          </div>
          <div className="h-64">
            {completedAttempts.length > 0 ? (
              <Bar data={difficultyData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No test data available
              </div>
            )}
          </div>
        </div>

        {/* Pass/Fail Distribution */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold">Pass/Fail Distribution</h3>
          </div>
          <div className="h-64">
            {completedAttempts.length > 0 ? (
              <Doughnut data={passFailData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No test data available
              </div>
            )}
          </div>
        </div>

        {/* Question Type Performance */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold">Question Type Performance</h3>
          </div>
          <div className="h-64">
            {completedAttempts.length > 0 ? (
              <Bar data={questionTypeData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No test data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skill Radar Chart */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold">Skill Profile</h3>
        </div>
        <div className="h-96">
          {completedAttempts.length > 0 ? (
            <Radar data={radarData} options={radarOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              No test data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Test History */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Recent Test History
        </h3>
        <div className="overflow-x-auto">
          {recentAttempts.length > 0 ? (
            <table className="min-w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Certification</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Difficulty</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Score</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">MCQ</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Coding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {recentAttempts.map((attempt, idx) => {
                  const result = attempt.result || {}
                  const mcqCorrect = result.mcq_correct || 0
                  const mcqTotal = result.mcq_total || 0
                  const codeCorrect = result.code_correct || 0
                  const codeTotal = result.code_total || 0

                  return (
                    <tr key={idx} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {new Date(attempt.completed_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {attempt.cert_id || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          attempt.difficulty === 'easy' ? 'bg-green-600/30 text-green-300' :
                          attempt.difficulty === 'medium' ? 'bg-yellow-600/30 text-yellow-300' :
                          'bg-red-600/30 text-red-300'
                        }`}>
                          {attempt.difficulty || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-bold ${
                          attempt.score >= 70 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {attempt.score}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {attempt.score >= 70 ? (
                          <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            Passed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400">
                            <XCircle className="w-4 h-4" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {mcqTotal > 0 ? `${mcqCorrect}/${mcqTotal}` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {codeTotal > 0 ? `${codeCorrect}/${codeTotal}` : 'N/A'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No test history available
            </div>
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-400" />
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Strongest Area</div>
            <div className="text-lg font-bold text-green-400">
              {avgMcqScore > avgCodeScore ? 'MCQ Questions' : 'Coding Problems'}
            </div>
            <div className="text-sm text-slate-500">
              {Math.max(avgMcqScore, avgCodeScore)}% average
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Needs Improvement</div>
            <div className="text-lg font-bold text-yellow-400">
              {avgMcqScore < avgCodeScore ? 'MCQ Questions' : 'Coding Problems'}
            </div>
            <div className="text-sm text-slate-500">
              {Math.min(avgMcqScore, avgCodeScore)}% average
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Recommended Level</div>
            <div className="text-lg font-bold text-blue-400">
              {averageScore >= 80 ? 'Hard' : averageScore >= 60 ? 'Medium' : 'Easy'}
            </div>
            <div className="text-sm text-slate-500">
              Based on performance
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProgress
