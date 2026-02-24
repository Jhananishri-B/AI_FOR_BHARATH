import React, { useState, useEffect } from 'react'
import { adminAPI } from '../services/api'
import { Plus, Edit, Trash2, Eye, Code, Filter, Search } from 'lucide-react'
import ProblemEditor from '../components/ProblemEditor'

const PracticeZone = () => {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    difficulty: '',
    tag: '',
    search: ''
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProblem, setEditingProblem] = useState(null)

  useEffect(() => {
    fetchProblems()
  }, [filters])

  const fetchProblems = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getProblems(filters)
      setProblems(response.data)
    } catch (err) {
      setError('Failed to fetch problems')
      console.error('Error fetching problems:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (problemId, currentStatus) => {
    try {
      await adminAPI.toggleProblemStatus(problemId, !currentStatus)
      fetchProblems() // Refresh the list
    } catch (err) {
      setError('Failed to toggle problem status')
      console.error('Error toggling status:', err)
    }
  }

  const handleDelete = async (problemId) => {
    if (window.confirm('Are you sure you want to delete this problem?')) {
      try {
        await adminAPI.deleteProblem(problemId)
        fetchProblems() // Refresh the list
      } catch (err) {
        setError('Failed to delete problem')
        console.error('Error deleting problem:', err)
      }
    }
  }

  const handleSaveProblem = async (problemData) => {
    try {
      if (editingProblem) {
        await adminAPI.updateProblem(editingProblem.problem_id, problemData)
      } else {
        await adminAPI.createProblem(problemData)
      }
      setShowCreateModal(false)
      setEditingProblem(null)
      fetchProblems() // Refresh the list
    } catch (err) {
      setError('Failed to save problem')
      console.error('Error saving problem:', err)
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredProblems = problems.filter(problem => {
    if (filters.search) {
      return problem.title.toLowerCase().includes(filters.search.toLowerCase())
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Practice Zone Management</h1>
          <p className="text-slate-400 mt-2">Manage coding problems and challenges</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Problem
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search problems..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.difficulty}
            onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            value={filters.tag}
            onChange={(e) => setFilters({...filters, tag: e.target.value})}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Tags</option>
            <option value="arrays">Arrays</option>
            <option value="strings">Strings</option>
            <option value="stack">Stack</option>
            <option value="tree">Tree</option>
            <option value="dynamic-programming">Dynamic Programming</option>
          </select>
          <button
            onClick={() => setFilters({difficulty: '', tag: '', search: ''})}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Problems List */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-400 mt-2">Loading problems...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchProblems}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="p-8 text-center">
            <Code className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No problems found</p>
            <p className="text-slate-500 text-sm mt-1">Create your first coding problem to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Problem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    XP Reward
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredProblems.map((problem) => (
                  <tr key={problem.problem_id} className="hover:bg-slate-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Code className="w-5 h-5 text-blue-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-slate-100">
                            {problem.title}
                          </div>
                          <div className="text-xs text-slate-400">
                            ID: {problem.problem_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {problem.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs bg-slate-600 text-slate-300 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {problem.tags.length > 3 && (
                          <span className="text-xs text-slate-400">
                            +{problem.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {problem.xp_reward} XP
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(problem.problem_id, problem.is_practice_problem)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                          problem.is_practice_problem
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {problem.is_practice_problem ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingProblem(problem)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit Problem"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.open(`/practice/${problem.problem_id}`, '_blank')}
                          className="text-green-400 hover:text-green-300 transition-colors"
                          title="Preview Problem"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(problem.problem_id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Problem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-slate-100">{problems.length}</div>
          <div className="text-sm text-slate-400">Total Problems</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">
            {problems.filter(p => p.is_practice_problem).length}
          </div>
          <div className="text-sm text-slate-400">Active Problems</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">
            {problems.filter(p => p.difficulty === 'easy').length}
          </div>
          <div className="text-sm text-slate-400">Easy Problems</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-400">
            {problems.filter(p => p.difficulty === 'hard').length}
          </div>
          <div className="text-sm text-slate-400">Hard Problems</div>
        </div>
      </div>

      {/* Problem Editor Modal */}
      <ProblemEditor
        problem={editingProblem}
        onSave={handleSaveProblem}
        onClose={() => {
          setShowCreateModal(false)
          setEditingProblem(null)
        }}
        isOpen={showCreateModal || !!editingProblem}
      />
    </div>
  )
}

export default PracticeZone
