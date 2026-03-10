import React from 'react'
import { NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const SidebarLink = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `block px-4 py-2 rounded-md text-sm ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`
    }
  >
    {children}
  </NavLink>
)

const Layout = ({ children }) => {
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      <aside className="w-64 border-r border-slate-800 p-4 sticky top-0 h-screen flex flex-col">
        <div className="mb-6">
          <div className="text-xl font-bold">LearnQuest Admin</div>
          <div className="text-xs text-slate-400">Control Panel</div>
          <Link to="/dashboard" className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block">
            ← Back to Student View
          </Link>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto">
          <SidebarLink to="/admin/dashboard">Dashboard</SidebarLink>
          <SidebarLink to="/admin/users">Users</SidebarLink>
          <SidebarLink to="/admin/courses">Courses</SidebarLink>
          <SidebarLink to="/admin/problems">Problems</SidebarLink>
          <SidebarLink to="/admin/practice-zone">Practice Zone</SidebarLink>
          <SidebarLink to="/admin/tests">Tests Dashboard</SidebarLink>
          <SidebarLink to="/admin/certification-tests">Certification Test Manager</SidebarLink>
          <SidebarLink to="/admin/question-banks">Question Banks</SidebarLink>
          <SidebarLink to="/admin/proctoring-review">Proctoring Review</SidebarLink>
          <SidebarLink to="/admin/exam-violations">Exam Violations</SidebarLink>
          <SidebarLink to="/admin/test-review">Test Review</SidebarLink>
          <SidebarLink to="/admin/results-analytics">Results &amp; Analytics</SidebarLink>
          <SidebarLink to="/admin/certificate-management">Certificate Management</SidebarLink>
        </nav>
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-4 w-full flex items-center gap-2 px-4 py-2 rounded-md text-sm text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

export default Layout
