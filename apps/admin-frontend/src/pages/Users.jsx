import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../services/api'
import CreateUserModal from '../components/CreateUserModal'
import { Search, BarChart3 } from 'lucide-react'

const Users = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'student', level: 1, xp: 0 })
  const [creating, setCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const load = async () => {
    try {
      const res = await adminAPI.listUsers()
      setUsers(res.data)
    } catch (e) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const startEdit = (u) => {
    setEditing(u.id)
    setForm({ name: u.name, email: u.email, role: u.role || 'student', level: u.level || 1, xp: u.xp || 0 })
  }

  const save = async () => {
    await adminAPI.updateUser(editing, form)
    setEditing(null)
    await load()
  }

  const remove = async (id) => {
    await adminAPI.deleteUser(id)
    await load()
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-400">{error}</div>

  // Filter users based on search query
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role || 'student').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex gap-2">
          <button 
            className="px-3 py-2 bg-purple-600 rounded hover:bg-purple-700 transition-colors inline-flex items-center gap-2" 
            onClick={() => navigate('/users/compare')}
          >
            <BarChart3 className="w-4 h-4" />
            Compare Users
          </button>
          <button className="px-3 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors" onClick={() => setCreating(true)}>Create New User</button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search users by name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-slate-800">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-left">Level</th>
              <th className="px-3 py-2 text-left">XP</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(u => (
                <tr key={u.id} className="border-t border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      u.role === 'admin' ? 'bg-purple-600/30 text-purple-300' : 'bg-blue-600/30 text-blue-300'
                    }`}>
                      {u.role || 'student'}
                    </span>
                  </td>
                  <td className="px-3 py-2">{u.level || 1}</td>
                  <td className="px-3 py-2">{u.xp || 0}</td>
                  <td className="px-3 py-2 text-right">
                    <button 
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded mr-2 inline-flex items-center gap-1 transition-colors" 
                      onClick={() => navigate(`/users/${u.id}/progress`)}
                      title="View Progress"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Progress
                    </button>
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded mr-2 transition-colors" onClick={() => startEdit(u)}>Edit</button>
                    <button className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors" onClick={() => remove(u.id)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-3 py-8 text-center text-slate-500">
                  {searchQuery ? 'No users found matching your search' : 'No users available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-slate-800 border border-slate-700 rounded p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <div className="space-y-3">
              <input className="w-full bg-slate-700 rounded px-3 py-2" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="w-full bg-slate-700 rounded px-3 py-2" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <select className="w-full bg-slate-700 rounded px-3 py-2" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="student">student</option>
                <option value="admin">admin</option>
              </select>
              <div className="flex gap-3">
                <input type="number" className="w-1/2 bg-slate-700 rounded px-3 py-2" placeholder="Level" value={form.level} onChange={e => setForm({ ...form, level: Number(e.target.value) })} />
                <input type="number" className="w-1/2 bg-slate-700 rounded px-3 py-2" placeholder="XP" value={form.xp} onChange={e => setForm({ ...form, xp: Number(e.target.value) })} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 bg-slate-600 rounded" onClick={() => setEditing(null)}>Cancel</button>
              <button className="px-3 py-2 bg-blue-600 rounded" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}

      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onCreate={async (data) => {
            await adminAPI.createUser(data)
            await load()
          }}
        />
      )}
    </div>
  )
}

export default Users


