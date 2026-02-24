import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Award, 
  BookOpen, 
  BarChart3, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Target,
  Activity,
  PieChart
} from 'lucide-react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
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
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCertifications: 0,
    totalCourses: 0,
    totalQuestions: 0,
    recentAttempts: 0,
    passRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeUsers, setActiveUsers] = useState([])
  const [attemptsData, setAttemptsData] = useState([])
  const [usersData, setUsersData] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch multiple endpoints in parallel
      const [usersRes, certsRes, coursesRes, questionsRes, attemptsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/users/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${API_BASE_URL}/api/admin/certifications/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${API_BASE_URL}/api/admin/courses/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${API_BASE_URL}/api/admin/problems/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${API_BASE_URL}/api/admin/attempts/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ])

      const [users, certs, courses, questions, attempts] = await Promise.all([
        usersRes.ok ? usersRes.json() : [],
        certsRes.ok ? certsRes.json() : [],
        coursesRes.ok ? coursesRes.json() : [],
        questionsRes.ok ? questionsRes.json() : [],
        attemptsRes.ok ? attemptsRes.json() : []
      ])

      const passRate = attempts.length > 0 
        ? Math.round((attempts.filter(a => a.passed).length / attempts.length) * 100)
        : 0

      setStats({
        totalUsers: users.length,
        totalCertifications: certs.length,
        totalCourses: courses.length,
        totalQuestions: questions.length,
        recentAttempts: attempts.filter(a => {
          const attemptDate = new Date(a.created_at)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return attemptDate > weekAgo
        }).length,
        passRate
      })

      // Get active users (online in last 15 minutes)
      const now = new Date()
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)
      const activeUsersList = users.filter(user => {
        if (user.last_active_date) {
          const lastActive = new Date(user.last_active_date)
          return lastActive > fifteenMinutesAgo
        }
        return false
      }).sort((a, b) => {
        const dateA = new Date(a.last_active_date)
        const dateB = new Date(b.last_active_date)
        return dateB - dateA
      }).slice(0, 10)
      
      setActiveUsers(activeUsersList)
      
      // Store attempts for charts
      setAttemptsData(attempts)
      setUsersData(users)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'Certifications',
      value: stats.totalCertifications,
      icon: Award,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      title: 'Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      title: 'Questions',
      value: stats.totalQuestions,
      icon: Target,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    },
    {
      title: 'Recent Attempts',
      value: stats.recentAttempts,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    },
    {
      title: 'Pass Rate',
      value: `${stats.passRate}%`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    }
  ]

  // Prepare chart data
  // User growth over last 7 days
  const last7Days = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }

  const userGrowthData = {
    labels: last7Days,
    datasets: [{
      label: 'New Users',
      data: last7Days.map((_, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() - (6 - i))
        return usersData.filter(u => {
          const created = new Date(u.created_at)
          return created.toDateString() === date.toDateString()
        }).length
      }),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      tension: 0.4,
      fill: true,
    }]
  }

  // Test attempts distribution by day
  const attemptsPerDay = {
    labels: last7Days,
    datasets: [{
      label: 'Tests Completed',
      data: last7Days.map((_, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() - (6 - i))
        return attemptsData.filter(a => {
          const created = new Date(a.created_at)
          return created.toDateString() === date.toDateString()
        }).length
      }),
      backgroundColor: 'rgba(34, 197, 94, 0.6)',
      borderColor: 'rgb(34, 197, 94)',
      borderWidth: 2,
    }]
  }

  // Pass vs Fail distribution
  const passedCount = attemptsData.filter(a => a.passed || a.score >= 85).length
  const failedCount = attemptsData.length - passedCount

  const passFailData = {
    labels: ['Passed', 'Failed'],
    datasets: [{
      data: [passedCount, failedCount],
      backgroundColor: [
        'rgba(34, 197, 94, 0.6)',
        'rgba(239, 68, 68, 0.6)',
      ],
      borderColor: [
        'rgb(34, 197, 94)',
        'rgb(239, 68, 68)',
      ],
      borderWidth: 2,
    }]
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: 'rgb(203, 213, 225)' }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'rgb(226, 232, 240)',
        bodyColor: 'rgb(203, 213, 225)',
        borderColor: 'rgb(51, 65, 85)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          color: 'rgb(148, 163, 184)',
          stepSize: 1
        },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      },
      x: {
        ticks: { color: 'rgb(148, 163, 184)' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart'
    }
  }

  const barChartOptions = {
    ...lineChartOptions,
    animation: {
      duration: 1500,
      easing: 'easeOutBounce'
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { 
          color: 'rgb(203, 213, 225)',
          padding: 15,
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'rgb(226, 232, 240)',
        bodyColor: 'rgb(203, 213, 225)',
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2000
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400">Overview of your LearnQuest platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className={`p-6 rounded-xl border ${stat.borderColor} ${stat.bgColor} hover:scale-105 transition-transform`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">{stat.title}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth Chart */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            User Growth (Last 7 Days)
          </h3>
          <div className="h-64">
            <Line data={userGrowthData} options={lineChartOptions} />
          </div>
        </div>

        {/* Test Activity Chart */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-400" />
            Test Activity (Last 7 Days)
          </h3>
          <div className="h-64">
            <Bar data={attemptsPerDay} options={barChartOptions} />
          </div>
        </div>

        {/* Pass/Fail Distribution */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-400" />
            Pass/Fail Distribution
          </h3>
          <div className="h-64">
            <Doughnut data={passFailData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-400" />
          Real-time Platform Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-700/50 rounded-lg">
            <div className="text-slate-400 text-sm mb-2">Active Users</div>
            <div className="text-2xl font-bold text-green-400">{activeUsers.length}</div>
            <div className="text-xs text-slate-500 mt-1">Online now</div>
          </div>
          <div className="p-4 bg-slate-700/50 rounded-lg">
            <div className="text-slate-400 text-sm mb-2">Today's Tests</div>
            <div className="text-2xl font-bold text-blue-400">
              {attemptsData.filter(a => {
                const created = new Date(a.created_at)
                return created.toDateString() === today.toDateString()
              }).length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Completed today</div>
          </div>
          <div className="p-4 bg-slate-700/50 rounded-lg">
            <div className="text-slate-400 text-sm mb-2">Avg. Score</div>
            <div className="text-2xl font-bold text-yellow-400">
              {attemptsData.length > 0 ? 
                Math.round(attemptsData.reduce((sum, a) => sum + (a.score || 0), 0) / attemptsData.length) : 0}%
            </div>
            <div className="text-xs text-slate-500 mt-1">All time</div>
          </div>
          <div className="p-4 bg-slate-700/50 rounded-lg">
            <div className="text-slate-400 text-sm mb-2">Success Rate</div>
            <div className="text-2xl font-bold text-purple-400">{stats.passRate}%</div>
            <div className="text-xs text-slate-500 mt-1">Pass threshold: 85%</div>
          </div>
        </div>
      </div>

      {/* Active Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-400" />
            Active Users
            <span className="ml-auto text-sm text-slate-400">
              {activeUsers.length} online
            </span>
          </h3>
          <div className="space-y-3">
            {activeUsers.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No users currently active</p>
            ) : (
              activeUsers.map((user, index) => {
                const lastActive = new Date(user.last_active_date)
                const minutesAgo = Math.floor((new Date() - lastActive) / 1000 / 60)
                const timeAgo = minutesAgo < 1 ? 'Just now' : 
                               minutesAgo === 1 ? '1 min ago' : 
                               `${minutesAgo} mins ago`
                
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{user.name}</p>
                      <p className="text-slate-400 text-xs">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 text-xs font-medium">Online</p>
                      <p className="text-slate-500 text-xs">{timeAgo}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white font-medium">Create New Certification</p>
                  <p className="text-slate-400 text-sm">Add a new certification track</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">Manage Questions</p>
                  <p className="text-slate-400 text-sm">Add or edit questions</p>
                </div>
              </div>
            </button>
            <button className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-white font-medium">View Users</p>
                  <p className="text-slate-400 text-sm">Manage user accounts</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard