import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Award,
  Clock,
  Users,
  BarChart3,
  Settings,
  Copy,
  Archive,
  Star
} from 'lucide-react'

const Certification = () => {
  const [certifications, setCertifications] = useState([])
  const [filteredCertifications, setFilteredCertifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCert, setEditingCert] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedCerts, setSelectedCerts] = useState([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    duration_minutes: 30,
    pass_percentage: 70,
    max_attempts: 3,
    is_active: true,
    tags: [],
    prerequisites: [],
    learning_objectives: [],
    skills_covered: [],
    certificate_template: 'default',
    proctoring_enabled: true,
    time_limit: 120,
    question_count: 10,
    randomize_questions: true,
    show_feedback: true,
    allow_review: false
  })

  useEffect(() => {
    fetchCertifications()
  }, [])

  useEffect(() => {
    filterAndSortCertifications()
  }, [certifications, searchTerm, filterDifficulty, filterStatus, sortBy, sortOrder])

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const fetchCertifications = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/admin/certifications/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch certifications')
      }
      
      const data = await response.json()
      setCertifications(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortCertifications = () => {
    let filtered = [...certifications]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(cert => 
        cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cert.tags && cert.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      )
    }

    // Difficulty filter
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(cert => cert.difficulty === filterDifficulty)
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(cert => 
        filterStatus === 'active' ? cert.is_active : !cert.is_active
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]

      if (sortBy === 'created_at') {
        aVal = new Date(aVal)
        bVal = new Date(bVal)
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    setFilteredCertifications(filtered)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/certifications/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create certification')
      }

      await fetchCertifications()
      setShowCreateModal(false)
      resetForm()
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/certifications/${editingCert._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update certification')
      }

      await fetchCertifications()
      setShowCreateModal(false)
      setEditingCert(null)
      resetForm()
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (certId) => {
    if (!window.confirm('Are you sure you want to delete this certification?')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/certifications/${certId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to delete certification')
      }

      await fetchCertifications()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleBulkAction = async (action) => {
    if (selectedCerts.length === 0) return

    try {
      const promises = selectedCerts.map(certId => {
        switch (action) {
          case 'delete':
            return fetch(`${API_BASE_URL}/api/admin/certifications/${certId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
          case 'activate':
            return fetch(`${API_BASE_URL}/api/admin/certifications/${certId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ is_active: true })
            })
          case 'deactivate':
            return fetch(`${API_BASE_URL}/api/admin/certifications/${certId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ is_active: false })
            })
          default:
            return Promise.resolve()
        }
      })

      await Promise.all(promises)
      await fetchCertifications()
      setSelectedCerts([])
      setShowBulkActions(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      difficulty: 'Easy',
      duration_minutes: 30,
      pass_percentage: 70,
      max_attempts: 3,
      is_active: true,
      tags: [],
      prerequisites: [],
      learning_objectives: [],
      skills_covered: [],
      certificate_template: 'default',
      proctoring_enabled: true,
      time_limit: 120,
      question_count: 10,
      randomize_questions: true,
      show_feedback: true,
      allow_review: false
    })
  }

  const handleEdit = (cert) => {
    setEditingCert(cert)
    setFormData({
      title: cert.title || '',
      description: cert.description || '',
      difficulty: cert.difficulty || 'Easy',
      duration_minutes: cert.duration_minutes || 30,
      pass_percentage: cert.pass_percentage || 70,
      max_attempts: cert.max_attempts || 3,
      is_active: cert.is_active !== undefined ? cert.is_active : true,
      tags: cert.tags || [],
      prerequisites: cert.prerequisites || [],
      learning_objectives: cert.learning_objectives || [],
      skills_covered: cert.skills_covered || [],
      certificate_template: cert.certificate_template || 'default',
      proctoring_enabled: cert.proctoring_enabled !== undefined ? cert.proctoring_enabled : true,
      time_limit: cert.time_limit || 120,
      question_count: cert.question_count || 10,
      randomize_questions: cert.randomize_questions !== undefined ? cert.randomize_questions : true,
      show_feedback: cert.show_feedback !== undefined ? cert.show_feedback : true,
      allow_review: cert.allow_review !== undefined ? cert.allow_review : false
    })
    setShowCreateModal(true)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading certifications...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Certification Management</h1>
          <p className="text-slate-400">Manage and configure certification tracks</p>
        </div>
        <button
          onClick={() => {
            setEditingCert(null)
            resetForm()
            setShowCreateModal(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Certification
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search certifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order)
              }}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="difficulty-asc">Difficulty Low-High</option>
              <option value="difficulty-desc">Difficulty High-Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCerts.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-300">
              {selectedCerts.length} certification(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedCerts([])}
                className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Certifications Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCerts.length === filteredCertifications.length && filteredCertifications.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCerts(filteredCertifications.map(cert => cert._id))
                      } else {
                        setSelectedCerts([])
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Questions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredCertifications.map((cert) => (
                <tr key={cert._id} className="hover:bg-slate-750">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCerts.includes(cert._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCerts([...selectedCerts, cert._id])
                        } else {
                          setSelectedCerts(selectedCerts.filter(id => id !== cert._id))
                        }
                      }}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-white">{cert.title}</div>
                      <div className="text-sm text-slate-400 truncate max-w-xs">
                        {cert.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(cert.difficulty)}`}>
                      {cert.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    {cert.duration_minutes} min
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(cert.is_active)}`}>
                      {cert.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    {cert.question_ids ? cert.question_ids.length : 0}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(cert)}
                        className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-500/20 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cert._id)}
                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <a
                        href={`/certifications/${cert._id}/questions`}
                        className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-green-500/20 transition-colors"
                        title="Manage Questions"
                      >
                        <Settings className="w-5 h-5" />
                      </a>
                      <button className="text-purple-400 hover:text-purple-300 p-1 rounded hover:bg-purple-500/20 transition-colors" title="View">
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCertifications.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <div className="text-slate-500 text-lg">No certifications found</div>
          <div className="text-slate-400 text-sm">Create your first certification to get started</div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">
                {editingCert ? 'Edit Certification' : 'Create New Certification'}
              </h2>
            </div>
            
            <form onSubmit={editingCert ? handleUpdate : handleCreate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Difficulty *
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Pass Percentage *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={formData.pass_percentage}
                    onChange={(e) => setFormData({...formData, pass_percentage: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_attempts}
                    onChange={(e) => setFormData({...formData, max_attempts: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Question Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.question_count}
                    onChange={(e) => setFormData({...formData, question_count: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm text-slate-300">
                      Active
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="proctoring_enabled"
                      checked={formData.proctoring_enabled}
                      onChange={(e) => setFormData({...formData, proctoring_enabled: e.target.checked})}
                      className="rounded"
                    />
                    <label htmlFor="proctoring_enabled" className="ml-2 text-sm text-slate-300">
                      Enable Proctoring
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="randomize_questions"
                      checked={formData.randomize_questions}
                      onChange={(e) => setFormData({...formData, randomize_questions: e.target.checked})}
                      className="rounded"
                    />
                    <label htmlFor="randomize_questions" className="ml-2 text-sm text-slate-300">
                      Randomize Questions
                    </label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="show_feedback"
                      checked={formData.show_feedback}
                      onChange={(e) => setFormData({...formData, show_feedback: e.target.checked})}
                      className="rounded"
                    />
                    <label htmlFor="show_feedback" className="ml-2 text-sm text-slate-300">
                      Show Feedback
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allow_review"
                      checked={formData.allow_review}
                      onChange={(e) => setFormData({...formData, allow_review: e.target.checked})}
                      className="rounded"
                    />
                    <label htmlFor="allow_review" className="ml-2 text-sm text-slate-300">
                      Allow Review
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingCert(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  {editingCert ? 'Update' : 'Create'} Certification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Certification
