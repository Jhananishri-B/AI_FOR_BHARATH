import React, { useEffect, useState } from 'react'
import { Search, Filter, Play, Pause, Edit, Trash2, BarChart3 } from 'lucide-react'
import { adminCertTestsAPI } from '../services/api'

const TestsDashboard = () => {
  const [specs, setSpecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [difficulty, setDifficulty] = useState('all')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await adminCertTestsAPI.listSpecs()
      setSpecs(res.data || [])
    } catch (e) {
      setError('Failed to load tests')
    } finally {
      setLoading(false)
    }
  }

  const filtered = (specs || []).filter((s) => {
    const m1 = !q || (s.cert_id || '').toLowerCase().includes(q.toLowerCase())
    const m2 = difficulty === 'all' || (s.difficulty || '').toLowerCase() === difficulty.toLowerCase()
    return m1 && m2
  })

  async function onDelete(spec) {
    if (!confirm(`Delete test spec ${spec.cert_id} - ${spec.difficulty}?`)) return
    try {
      await adminCertTestsAPI.deleteSpec(spec.cert_id, spec.difficulty)
      await load()
      alert('Deleted')
    } catch (e) {
      alert('Delete failed: ' + (e.response?.data?.detail || e.message))
    }
  }

  async function onSetActive(spec, active) {
    try {
      await adminCertTestsAPI.setSpecActive(spec.cert_id, spec.difficulty, active)
      await load()
    } catch (e) {
      alert('Update failed: ' + (e.response?.data?.detail || e.message))
    }
  }

  function onEdit(spec) {
    // Navigate to Certification Test Manager to edit; pass query for potential prefill
    const params = new URLSearchParams({ cert_id: spec.cert_id, difficulty: spec.difficulty })
    window.location.href = `/certification-tests?${params.toString()}`
  }

  function onViewResults(spec) {
    const params = new URLSearchParams({ cert_id: spec.cert_id, difficulty: spec.difficulty })
    window.location.href = `/results-analytics?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tests Dashboard</h1>
          <p className="text-slate-400">Manage certification tests created from question banks</p>
        </div>
        <a href="/certification-tests" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">Create Test</a>
      </div>

      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by Certification ID"
            className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
          >
            <option value="all">All Difficulties</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded p-3 text-red-300">{error}</div>
      )}

      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase">Certification ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase">Difficulty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase">Questions</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase">Duration</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase">Pass %</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filtered.map((s, i) => (
                  <tr key={s._id || i}>
                    <td className="px-4 py-2 text-slate-200">{s.cert_id}</td>
                    <td className="px-4 py-2 text-slate-200">{s.difficulty}</td>
                    <td className="px-4 py-2 text-slate-200">{s.question_count}</td>
                    <td className="px-4 py-2 text-slate-200">{s.duration_minutes} min</td>
                    <td className="px-4 py-2 text-slate-200">{s.pass_percentage}%</td>
                    <td className="px-4 py-2 text-slate-200">
                      <div className="flex items-center gap-2">
                        <button title="Activate" onClick={() => onSetActive(s, true)} className="p-1 rounded hover:bg-green-600/20 text-green-400"><Play className="w-4 h-4"/></button>
                        <button title="Deactivate" onClick={() => onSetActive(s, false)} className="p-1 rounded hover:bg-yellow-600/20 text-yellow-400"><Pause className="w-4 h-4"/></button>
                        <button title="Edit" onClick={() => onEdit(s)} className="p-1 rounded hover:bg-blue-600/20 text-blue-400"><Edit className="w-4 h-4"/></button>
                        <button title="Delete" onClick={() => onDelete(s)} className="p-1 rounded hover:bg-red-600/20 text-red-400"><Trash2 className="w-4 h-4"/></button>
                        <button title="View Results" onClick={() => onViewResults(s)} className="p-1 rounded hover:bg-purple-600/20 text-purple-400"><BarChart3 className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">No tests found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestsDashboard


