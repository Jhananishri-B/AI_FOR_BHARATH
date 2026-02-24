import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { Bar, Radar, Line } from 'react-chartjs-2'
import { 
  ArrowLeft, 
  Users as UsersIcon,
  Search,
  X,
  TrendingUp,
  Award,
  Target,
  Brain,
  CheckCircle,
  XCircle,
  Plus,
  Trash2
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

const UserComparison = () => {
  const navigate = useNavigate()
  
  const [allUsers, setAllUsers] = useState([])
  const [allAttempts, setAllAttempts] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showUserPicker, setShowUserPicker] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersRes, attemptsRes] = await Promise.all([
        adminAPI.listUsers(),
        adminCertTestsAPI.getAllAttempts()
      ])
      setAllUsers(usersRes.data)
      setAllAttempts(attemptsRes.data)
    } catch (e) {
      setError('Failed to load data')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const addUser = (user) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
    }
    setShowUserPicker(false)
    setSearchQuery('')
  }

  const removeUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId))
  }

  const getUserStats = (userId) => {
    const userAttempts = allAttempts.filter(a => a.user_id === userId)
    const completedAttempts = userAttempts.filter(a => a.status === 'completed' || a.completed_at)
    const passedAttempts = completedAttempts.filter(a => a.score >= 70)
    
    const averageScore = completedAttempts.length > 0
      ? Math.round(completedAttempts.reduce((sum, a) => sum + a.score, 0) / completedAttempts.length)
      : 0

    const passRate = completedAttempts.length > 0
      ? Math.round((passedAttempts.length / completedAttempts.length) * 100)
      : 0

    // MCQ vs Coding performance
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

    // Performance by difficulty
    const difficultyBreakdown = {
      easy: completedAttempts.filter(a => a.difficulty === 'easy'),
      medium: completedAttempts.filter(a => a.difficulty === 'medium'),
      hard: completedAttempts.filter(a => a.difficulty === 'hard'),
    }

    const avgEasyScore = difficultyBreakdown.easy.length > 0
      ? Math.round(difficultyBreakdown.easy.reduce((s, a) => s + a.score, 0) / difficultyBreakdown.easy.length)
      : 0

    const avgMediumScore = difficultyBreakdown.medium.length > 0
      ? Math.round(difficultyBreakdown.medium.reduce((s, a) => s + a.score, 0) / difficultyBreakdown.medium.length)
      : 0

    const avgHardScore = difficultyBreakdown.hard.length > 0
      ? Math.round(difficultyBreakdown.hard.reduce((s, a) => s + a.score, 0) / difficultyBreakdown.hard.length)
      : 0

    return {
      totalTests: completedAttempts.length,
      averageScore,
      passRate,
      passedTests: passedAttempts.length,
      failedTests: completedAttempts.length - passedAttempts.length,
      avgMcqScore,
      avgCodeScore,
      avgEasyScore,
      avgMediumScore,
      avgHardScore,
      inProgress: userAttempts.filter(a => a.status !== 'completed' && !a.completed_at).length
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading data...</div>
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

  const filteredUsers = allUsers.filter(u => 
    !selectedUsers.find(su => su.id === u.id) &&
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Generate chart colors
  const chartColors = [
    { bg: 'rgba(59, 130, 246, 0.6)', border: 'rgb(59, 130, 246)' },      // Blue
    { bg: 'rgba(34, 197, 94, 0.6)', border: 'rgb(34, 197, 94)' },       // Green
    { bg: 'rgba(251, 191, 36, 0.6)', border: 'rgb(251, 191, 36)' },     // Yellow
    { bg: 'rgba(239, 68, 68, 0.6)', border: 'rgb(239, 68, 68)' },       // Red
    { bg: 'rgba(139, 92, 246, 0.6)', border: 'rgb(139, 92, 246)' },     // Purple
    { bg: 'rgba(236, 72, 153, 0.6)', border: 'rgb(236, 72, 153)' },     // Pink
  ]

  // Overall Performance Comparison
  const overallComparisonData = {
    labels: ['Tests Completed', 'Average Score', 'Pass Rate', 'MCQ Score', 'Coding Score'],
    datasets: selectedUsers.map((user, idx) => {
      const stats = getUserStats(user.id)
      return {
        label: user.name,
        data: [
          stats.totalTests,
          stats.averageScore,
          stats.passRate,
          stats.avgMcqScore,
          stats.avgCodeScore
        ],
        backgroundColor: chartColors[idx % chartColors.length].bg,
        borderColor: chartColors[idx % chartColors.length].border,
        borderWidth: 2,
      }
    })
  }

  // Difficulty Performance Comparison
  const difficultyComparisonData = {
    labels: selectedUsers.map(u => u.name),
    datasets: [
      {
        label: 'Easy Tests',
        data: selectedUsers.map(u => getUserStats(u.id).avgEasyScore),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
      {
        label: 'Medium Tests',
        data: selectedUsers.map(u => getUserStats(u.id).avgMediumScore),
        backgroundColor: 'rgba(251, 191, 36, 0.6)',
        borderColor: 'rgb(251, 191, 36)',
        borderWidth: 1,
      },
      {
        label: 'Hard Tests',
        data: selectedUsers.map(u => getUserStats(u.id).avgHardScore),
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      }
    ]
  }

  // Skill Radar Comparison
  const radarComparisonData = {
    labels: ['MCQ', 'Coding', 'Easy Tests', 'Medium Tests', 'Hard Tests', 'Pass Rate'],
    datasets: selectedUsers.map((user, idx) => {
      const stats = getUserStats(user.id)
      return {
        label: user.name,
        data: [
          stats.avgMcqScore,
          stats.avgCodeScore,
          stats.avgEasyScore,
          stats.avgMediumScore,
          stats.avgHardScore,
          stats.passRate
        ],
        backgroundColor: chartColors[idx % chartColors.length].bg.replace('0.6', '0.2'),
        borderColor: chartColors[idx % chartColors.length].border,
        borderWidth: 2,
        pointBackgroundColor: chartColors[idx % chartColors.length].border,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: chartColors[idx % chartColors.length].border,
      }
    })
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
          <UsersIcon className="w-6 h-6" />
          Compare Users
        </h1>
      </div>

      {/* User Selection */}
      <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Selected Users ({selectedUsers.length})</h2>
          <button
            onClick={() => setShowUserPicker(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>

        {selectedUsers.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <UsersIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No users selected</p>
            <p className="text-sm">Click "Add User" to start comparing users</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedUsers.map((user, idx) => {
              const stats = getUserStats(user.id)
              return (
                <div
                  key={user.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 relative"
                >
                  <button
                    onClick={() => removeUser(user.id)}
                    className="absolute top-2 right-2 p-1 bg-red-600/20 hover:bg-red-600 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                  
                  <div 
                    className="w-12 h-12 rounded-full mb-3 flex items-center justify-center text-xl font-bold"
                    style={{ backgroundColor: chartColors[idx % chartColors.length].bg }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <h3 className="font-bold text-lg mb-1">{user.name}</h3>
                  <p className="text-sm text-slate-400 mb-3">{user.email}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-700/50 rounded p-2">
                      <div className="text-slate-400 text-xs">Tests</div>
                      <div className="font-bold text-blue-400">{stats.totalTests}</div>
                    </div>
                    <div className="bg-slate-700/50 rounded p-2">
                      <div className="text-slate-400 text-xs">Avg Score</div>
                      <div className="font-bold text-green-400">{stats.averageScore}%</div>
                    </div>
                    <div className="bg-slate-700/50 rounded p-2">
                      <div className="text-slate-400 text-xs">Pass Rate</div>
                      <div className="font-bold text-yellow-400">{stats.passRate}%</div>
                    </div>
                    <div className="bg-slate-700/50 rounded p-2">
                      <div className="text-slate-400 text-xs">Level</div>
                      <div className="font-bold text-purple-400">{user.level || 1}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Charts - Only show if users are selected */}
      {selectedUsers.length > 0 && (
        <>
          {/* Summary Stats Table */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Performance Summary
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold">User</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">Tests</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">Avg Score</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">Pass Rate</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">Passed</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">Failed</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">MCQ</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">Coding</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">XP</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {selectedUsers.map((user, idx) => {
                    const stats = getUserStats(user.id)
                    return (
                      <tr key={user.id} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                              style={{ backgroundColor: chartColors[idx % chartColors.length].bg }}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold">{user.name}</div>
                              <div className="text-xs text-slate-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">{stats.totalTests}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${
                            stats.averageScore >= 80 ? 'text-green-400' :
                            stats.averageScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {stats.averageScore}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${
                            stats.passRate >= 80 ? 'text-green-400' :
                            stats.passRate >= 60 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {stats.passRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="flex items-center justify-center gap-1 text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            {stats.passedTests}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="flex items-center justify-center gap-1 text-red-400">
                            <XCircle className="w-4 h-4" />
                            {stats.failedTests}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-purple-400">{stats.avgMcqScore}%</td>
                        <td className="px-4 py-3 text-center text-pink-400">{stats.avgCodeScore}%</td>
                        <td className="px-4 py-3 text-center text-blue-400">{user.xp || 0}</td>
                        <td className="px-4 py-3 text-center text-yellow-400">{user.level || 1}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Performance Comparison */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold">Overall Performance</h3>
              </div>
              <div className="h-80">
                <Bar data={overallComparisonData} options={chartOptions} />
              </div>
            </div>

            {/* Difficulty Performance */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold">Performance by Difficulty</h3>
              </div>
              <div className="h-80">
                <Bar data={difficultyComparisonData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Skill Radar Chart */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold">Skill Profile Comparison</h3>
            </div>
            <div className="h-96">
              <Radar data={radarComparisonData} options={radarOptions} />
            </div>
          </div>

          {/* Winner Analysis */}
          <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Top Performers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Highest Average Score */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">🏆 Highest Average Score</div>
                {(() => {
                  const topUser = selectedUsers.reduce((best, user) => {
                    const stats = getUserStats(user.id)
                    const bestStats = getUserStats(best.id)
                    return stats.averageScore > bestStats.averageScore ? user : best
                  })
                  const stats = getUserStats(topUser.id)
                  return (
                    <>
                      <div className="text-lg font-bold text-green-400">{topUser.name}</div>
                      <div className="text-2xl font-bold text-white">{stats.averageScore}%</div>
                    </>
                  )
                })()}
              </div>

              {/* Most Tests Completed */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">📚 Most Tests Completed</div>
                {(() => {
                  const topUser = selectedUsers.reduce((best, user) => {
                    const stats = getUserStats(user.id)
                    const bestStats = getUserStats(best.id)
                    return stats.totalTests > bestStats.totalTests ? user : best
                  })
                  const stats = getUserStats(topUser.id)
                  return (
                    <>
                      <div className="text-lg font-bold text-blue-400">{topUser.name}</div>
                      <div className="text-2xl font-bold text-white">{stats.totalTests} tests</div>
                    </>
                  )
                })()}
              </div>

              {/* Best Pass Rate */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">✅ Best Pass Rate</div>
                {(() => {
                  const topUser = selectedUsers.reduce((best, user) => {
                    const stats = getUserStats(user.id)
                    const bestStats = getUserStats(best.id)
                    return stats.passRate > bestStats.passRate ? user : best
                  })
                  const stats = getUserStats(topUser.id)
                  return (
                    <>
                      <div className="text-lg font-bold text-yellow-400">{topUser.name}</div>
                      <div className="text-2xl font-bold text-white">{stats.passRate}%</div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </>
      )}

      {/* User Picker Modal */}
      {showUserPicker && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold">Select User to Add</h2>
              <button
                onClick={() => {
                  setShowUserPicker(false)
                  setSearchQuery('')
                }}
                className="p-2 hover:bg-slate-700 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredUsers.length > 0 ? (
                <div className="space-y-2">
                  {filteredUsers.map(user => {
                    const stats = getUserStats(user.id)
                    return (
                      <button
                        key={user.id}
                        onClick={() => addUser(user)}
                        className="w-full bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg p-4 text-left transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-white">{user.name}</div>
                            <div className="text-sm text-slate-400">{user.email}</div>
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              <span className="text-slate-500">
                                Tests: <span className="text-blue-400 font-semibold">{stats.totalTests}</span>
                              </span>
                              <span className="text-slate-500">
                                Avg: <span className="text-green-400 font-semibold">{stats.averageScore}%</span>
                              </span>
                              <span className="text-slate-500">
                                Level: <span className="text-yellow-400 font-semibold">{user.level || 1}</span>
                              </span>
                            </div>
                          </div>
                          <Plus className="w-5 h-5 text-blue-400" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  {searchQuery ? 'No users found matching your search' : 'No more users available'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserComparison
