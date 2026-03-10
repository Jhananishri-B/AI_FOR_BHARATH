import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Copy, Upload, Download, Settings, FileText, Clock } from 'lucide-react'

const TestManagement = () => {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTest, setEditingTest] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    questionCount: 10,
    difficulty: 'Medium',
    startDate: '',
    endDate: '',
    attemptLimit: 3,
    tabSwitchingRestriction: true,
    copyPasteRestriction: true,
    fullscreenEnforcement: true
  })

  useEffect(() => {
    fetchTests()
  }, [])

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const fetchTests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/certifications/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await response.json()
      setTests(data)
    } catch (error) {
      console.error('Error fetching tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTest = async (e) => {
    e.preventDefault()
    // Implementation for creating test
    await fetchTests()
    setShowModal(false)
    setFormData({
      title: '', description: '', duration: 60, questionCount: 10,
      difficulty: 'Medium', startDate: '', endDate: '', attemptLimit: 3,
      tabSwitchingRestriction: true, copyPasteRestriction: true, fullscreenEnforcement: true
    })
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      try {
        await fetch(`${API_BASE_URL}/api/admin/certifications/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        await fetchTests()
      } catch (error) {
        console.error('Error deleting test:', error)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Test/Exam Management</h1>
          <p className="text-slate-400">Create and manage tests and question banks</p>
        </div>
        <button
          onClick={() => {
            setEditingTest(null)
            setShowModal(true)
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create New Test
        </button>
      </div>

      {/* Tests Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Questions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Attempt Limit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {tests.map((test) => (
              <tr key={test._id} className="hover:bg-slate-700/30">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{test.title}</div>
                  <div className="text-sm text-slate-400">{test.difficulty}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {test.duration_minutes} min
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {test.question_ids?.length || 0} questions
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {test.max_attempts || 3}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button className="text-blue-400 hover:text-blue-300">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button className="text-green-400 hover:text-green-300">
                    <Copy className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(test._id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingTest ? 'Edit Test' : 'Create New Test'}
            </h2>
            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Test Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Question Count</label>
                  <input
                    type="number"
                    value={formData.questionCount}
                    onChange={(e) => setFormData({ ...formData, questionCount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.tabSwitchingRestriction}
                    onChange={(e) => setFormData({ ...formData, tabSwitchingRestriction: e.target.checked })}
                    className="rounded"
                  />
                  Tab Switching Restriction
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.copyPasteRestriction}
                    onChange={(e) => setFormData({ ...formData, copyPasteRestriction: e.target.checked })}
                    className="rounded"
                  />
                  Copy-Paste Restriction
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingTest ? 'Update' : 'Create'} Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestManagement

