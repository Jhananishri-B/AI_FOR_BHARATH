import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const CertificationQuestions = () => {
  const { certId } = useParams()
  const navigate = useNavigate()
  const [certification, setCertification] = useState(null)
  const [allQuestions, setAllQuestions] = useState([])
  const [certQuestions, setCertQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchData()
  }, [certId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch certification details
      const certResponse = await fetch(`${API_BASE_URL}/api/admin/certifications/${certId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!certResponse.ok) {
        throw new Error('Failed to fetch certification')
      }
      
      const certData = await certResponse.json()
      setCertification(certData)
      
      // Fetch all questions
      const questionsResponse = await fetch(`${API_BASE_URL}/api/admin/problems`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!questionsResponse.ok) {
        throw new Error('Failed to fetch questions')
      }
      
      const questionsData = await questionsResponse.json()
      setAllQuestions(questionsData)
      
      // Filter questions that are already in the certification
      const certQuestionIds = new Set(certData.question_ids)
      const certQuestionsList = questionsData.filter(q => certQuestionIds.has(q._id))
      setCertQuestions(certQuestionsList)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = (question) => {
    if (!certQuestions.find(q => q._id === question._id)) {
      setCertQuestions([...certQuestions, question])
    }
  }

  const removeQuestion = (questionId) => {
    setCertQuestions(certQuestions.filter(q => q._id !== questionId))
  }

  const saveQuestions = async () => {
    try {
      setSaving(true)
      
      const questionIds = certQuestions.map(q => q._id)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/certifications/${certId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ question_ids: questionIds })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to save questions')
      }

      // Update certification state
      setCertification({
        ...certification,
        question_ids: questionIds
      })

      alert('Questions saved successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Tough': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/certifications')}
              className="text-blue-600 hover:text-blue-800 mb-2"
            >
              ← Back to Certifications
            </button>
            <h1 className="text-3xl font-bold">Manage Questions</h1>
            <div className="mt-2">
              <h2 className="text-xl text-gray-700">{certification.title}</h2>
              <div className="flex items-center space-x-4 mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(certification.difficulty)}`}>
                  {certification.difficulty}
                </span>
                <span className="text-sm text-gray-500">
                  {certification.duration_minutes} minutes
                </span>
                <span className="text-sm text-gray-500">
                  {certification.pass_percentage}% to pass
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={saveQuestions}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md"
          >
            {saving ? 'Saving...' : 'Save Questions'}
          </button>
        </div>

        {/* Current Questions Count */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Selected Questions: {certQuestions.length}
              </h3>
              <p className="text-blue-700">
                These questions will be included in the certification test
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Questions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Available Questions</h3>
            <div className="bg-white rounded-lg shadow max-h-96 overflow-y-auto">
              {allQuestions.filter(q => !certQuestions.find(cq => cq._id === q._id)).map((question) => (
                <div key={question._id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {question.title || question.problem_statement?.substring(0, 100) + '...'}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Topic: {question.topic_name || 'Unknown'}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(question.difficulty || 'Easy')}`}>
                          {question.difficulty || 'Easy'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Type: {question.type || 'Multiple Choice'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => addQuestion(question)}
                      className="ml-4 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Questions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Selected Questions</h3>
            <div className="bg-white rounded-lg shadow max-h-96 overflow-y-auto">
              {certQuestions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No questions selected yet
                </div>
              ) : (
                certQuestions.map((question, index) => (
                  <div key={question._id} className="border-b border-gray-200 p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">
                            #{index + 1}
                          </span>
                          <div className="text-sm font-medium text-gray-900">
                            {question.title || question.problem_statement?.substring(0, 80) + '...'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          Topic: {question.topic_name || 'Unknown'}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(question.difficulty || 'Easy')}`}>
                            {question.difficulty || 'Easy'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Type: {question.type || 'Multiple Choice'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeQuestion(question._id)}
                        className="ml-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">Instructions:</h4>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Click "Add" to include a question in the certification</li>
            <li>• Click "Remove" to exclude a question from the certification</li>
            <li>• Questions are ordered as they appear in the selected list</li>
            <li>• Click "Save Questions" to update the certification</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}

export default CertificationQuestions
