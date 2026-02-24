import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../services/api'

const Courses = () => {
  const [courses, setCourses] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      // Reuse public endpoint for listing via web app base if needed; admin only for mutations
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/courses/')
      const data = await res.json()
      setCourses(data)
    } catch (e) {
      setError('Failed to load courses: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const remove = async (id) => {
    await adminAPI.deleteCourse(id)
    await load()
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      alert('Please select a JSON file')
      return
    }

    setUploading(true)
    try {
      await adminAPI.uploadCourseJson(file)
      alert('Course uploaded successfully!')
      await load()
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload course: ' + (error.response?.data?.detail || error.message))
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg text-slate-300">Loading courses...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-red-400 mb-4 bg-red-900/20 p-4 rounded-lg">{error}</div>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={load}
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Course Management</h1>
            <p className="text-slate-400">Create, edit, and manage your learning courses</p>
          </div>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-purple-600 rounded-lg inline-block hover:bg-purple-700 transition-colors font-medium"
              onClick={async () => {
                try {
                  const demoCourses = [
                    {
                      title: 'Intro to Python',
                      description: 'Learn Python fundamentals with hands-on modules and quizzes.',
                      xp_reward: 300,
                      modules: [
                        {
                          title: 'Getting Started',
                          order: 1,
                          topics: [
                            {
                              title: 'Basics',
                              content: 'Variables, types, and basic IO',
                              xp_reward: 50,
                              cards: [
                                { type: 'theory', content: 'What is a variable?', xp_reward: 10, explanation: '' },
                                { type: 'mcq', content: 'Select a valid variable name', xp_reward: 10, explanation: '', choices: ['1name', 'name_1', 'class', 'def'], correct_choice_index: 1 },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      title: 'Web Fundamentals',
                      description: 'HTML, CSS, and basic JavaScript for the web.',
                      xp_reward: 250,
                      modules: [
                        {
                          title: 'HTML & CSS',
                          order: 1,
                          topics: [
                            {
                              title: 'HTML Basics',
                              content: 'Tags, elements, attributes',
                              xp_reward: 50,
                              cards: [
                                { type: 'theory', content: 'What is an HTML element?', xp_reward: 10, explanation: '' },
                                { type: 'fill-in-blank', content: 'Fill the missing tag', xp_reward: 10, explanation: '', blanks: [''], correct_answers: ['</div>'] },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ]

                  for (const payload of demoCourses) {
                    await adminAPI.createCourse(payload)
                  }
                  alert('Demo courses loaded')
                  await load()
                } catch (e) {
                  alert('Failed to load demo courses: ' + (e.response?.data?.detail || e.message))
                }
              }}
            >
              Load Demo Courses
            </button>
            <label className="px-4 py-2 bg-green-600 rounded-lg inline-block cursor-pointer hover:bg-green-700 transition-colors font-medium">
              {uploading ? 'Uploading...' : 'Upload JSON'}
              <input 
                type="file" 
                accept=".json" 
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <Link 
              className="px-4 py-2 bg-blue-600 rounded-lg inline-block hover:bg-blue-700 transition-colors font-medium" 
              to="/courses/create"
            >
              Create New Course
            </Link>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No courses yet</h3>
            <p className="text-slate-400 mb-6">Get started by creating your first course or uploading a JSON file</p>
            <div className="flex gap-3 justify-center">
              <Link 
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors" 
                to="/courses/create"
              >
                Create Course
              </Link>
              <label className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors cursor-pointer">
                Upload JSON
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {courses.map(c => (
              <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{c.title}</h3>
                    <p className="text-slate-300 text-sm mb-3 line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        XP: {c.xp_reward}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Modules: {c.modules?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Topics: {c.modules?.reduce((total, module) => total + (module.topics?.length || 0), 0) || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link 
                      className="flex items-center gap-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium transition-colors" 
                      to={`/courses/${c.id}/edit`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Link>
                    <button 
                      className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors" 
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${c.title}"? This action cannot be undone.`)) {
                          remove(c.id)
                        }
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* Course Modules Preview */}
                {c.modules && c.modules.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Modules:</h4>
                    <div className="flex flex-wrap gap-2">
                      {c.modules.slice(0, 3).map((module, index) => (
                        <span key={index} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                          {module.title || `Module ${index + 1}`}
                        </span>
                      ))}
                      {c.modules.length > 3 && (
                        <span className="px-2 py-1 bg-slate-600 rounded text-xs text-slate-400">
                          +{c.modules.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Courses


