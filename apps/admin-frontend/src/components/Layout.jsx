import React from 'react'
import { NavLink } from 'react-router-dom'

const SidebarLink = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `block px-4 py-2 rounded-md text-sm ${
        isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`
    }
  >
    {children}
  </NavLink>
)

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      <aside className="w-64 border-r border-slate-800 p-4 sticky top-0 h-screen">
        <div className="mb-6">
          <div className="text-xl font-bold">LearnQuest Admin</div>
          <div className="text-xs text-slate-400">Control Panel</div>
        </div>
        <nav className="space-y-1">
          <SidebarLink to="/">Dashboard</SidebarLink>
          <SidebarLink to="/users">Users</SidebarLink>
          <SidebarLink to="/courses">Courses</SidebarLink>
          <SidebarLink to="/problems">Problems</SidebarLink>
          <SidebarLink to="/practice-zone">Practice Zone</SidebarLink>
          <SidebarLink to="/tests">Tests Dashboard</SidebarLink>
          <SidebarLink to="/certification-tests">Certification Test Manager</SidebarLink>
          <SidebarLink to="/question-banks">Question Banks</SidebarLink>
          <SidebarLink to="/proctoring-review">Proctoring Review</SidebarLink>
          <SidebarLink to="/exam-violations">Exam Violations</SidebarLink>
          <SidebarLink to="/test-review">Test Review</SidebarLink>
          <SidebarLink to="/results-analytics">Results & Analytics</SidebarLink>
          <SidebarLink to="/certificate-management">Certificate Management</SidebarLink>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}

export default Layout


