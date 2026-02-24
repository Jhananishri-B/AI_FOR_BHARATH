import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, FileText, Trash2, Plus, Save, X, Download, FileJson } from 'lucide-react'
import Layout from '../components/Layout'

const CertificationQuestionsEnhanced = () => {
  const { certId } = useParams()
  const navigate = useNavigate()
  const [certification, setCertification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadedQuestionBanks, setUploadedQuestionBanks] = useState([])
  const [randomizedQuestions, setRandomizedQuestions] = useState([])
  const [questionCount, setQuestionCount] = useState(20)
  const [saving, setSaving] = useState(false)

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetchCertification()
    fetchQuestionBanks()
  }, [certId])

  const fetchCertification = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/certifications/${certId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch certification')
      
      const data = await response.json()
      setCertification(data)
      
      // Load existing question banks if any
      if (data.question_banks) {
        setUploadedQuestionBanks(data.question_banks)
      }
      
      if (data.randomized_questions) {
        setRandomizedQuestions(data.randomized_questions)
        setQuestionCount(data.randomized_questions.length)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestionBanks = async () => {
    try {
      // Fetch uploaded question banks
      const response = await fetch(`${API_BASE_URL}/api/admin/certifications/${certId}/question-banks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUploadedQuestionBanks(data)
      }
    } catch (err) {
      console.error('Error fetching question banks:', err)
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(files)
  }

  const uploadQuestions = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one JSON file')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      
      selectedFiles.forEach((file, index) => {
        formData.append(`files`, file)
      })

      const response = await fetch(`${API_BASE_URL}/api/admin/certifications/${certId}/upload-questions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload questions')
      }

      const data = await response.json()
      setUploadedQuestionBanks(data.question_banks || [])
      alert('Questions uploaded successfully!')
      setSelectedFiles([])
      
      // Reset file input
      const fileInput = document.getElementById('file-upload')
      if (fileInput) fileInput.value = ''
      
      fetchCertification()
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const randomizeQuestions = async () => {
    if (uploadedQuestionBanks.length === 0) {
      alert('Please upload question files first')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/certifications/${certId}/randomize-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          question_count: questionCount,
          question_bank_ids: uploadedQuestionBanks.map(bank => bank.file_name)
        })
      })

      if (!response.ok) throw new Error('Failed to randomize questions')

      const data = await response.json()
      setRandomizedQuestions(data.questions)
      alert('Questions randomized successfully!')
    } catch (err) {
      alert('Randomization failed: ' + err.message)
    }
  }

  const saveQuestions = async () => {
    if (randomizedQuestions.length === 0) {
      alert('Please randomize questions first')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`${API_BASE_URL}/api/admin/certifications/${certId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          question_ids: randomizedQuestions.map(q => q._id)
        })
      })

      if (!response.ok) throw new Error('Failed to save questions')

      alert('Questions saved successfully!')
    } catch (err) {
      alert('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const removeQuestionBank = async (fileName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/certifications/${certId}/question-banks/${fileName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setUploadedQuestionBanks(uploadedQuestionBanks.filter(bank => bank.file_name !== fileName))
        alert('Question bank removed successfully!')
      }
    } catch (err) {
      alert('Failed to remove question bank: ' + err.message)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
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
        <div>
          <button
            onClick={() => navigate('/certifications')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Certifications
          </button>
          <h1 className="text-3xl font-bold">Manage Certification Questions</h1>
          <div className="mt-2">
            <h2 className="text-xl text-gray-700">{certification.title}</h2>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-2">
              {certification.difficulty}
            </span>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Question Files
          </h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <FileJson className="h-12 w-12 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600 mb-1">
                {selectedFiles.length > 0 
                  ? `${selectedFiles.length} file(s) selected`
                  : 'Click to select or drag and drop JSON files'
                }
              </span>
              <span className="text-xs text-gray-500">
                Support for multiple JSON files (e.g., python_easy.json, dsa_easy.json)
              </span>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </span>
                </div>
              ))}
              <button
                onClick={uploadQuestions}
                disabled={uploading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
              >
                {uploading ? 'Uploading...' : 'Upload Questions'}
              </button>
            </div>
          )}
        </div>

        {/* Question Banks Section */}
        {uploadedQuestionBanks.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded Question Banks ({uploadedQuestionBanks.length})
            </h3>
            
            <div className="space-y-2">
              {uploadedQuestionBanks.map((bank, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{bank.file_name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({bank.question_count} questions)
                    </span>
                  </div>
                  <button
                    onClick={() => removeQuestionBank(bank.file_name)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Randomization Section */}
        {uploadedQuestionBanks.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Randomize Questions</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min="1"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Questions will be randomly selected from all uploaded files
                </p>
              </div>

              {randomizedQuestions.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-green-800">
                      {randomizedQuestions.length} questions randomized
                    </span>
                    <button
                      onClick={randomizeQuestions}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                      Re-randomize
                    </button>
                  </div>
                </div>
              )}

              {randomizedQuestions.length === 0 && (
                <button
                  onClick={randomizeQuestions}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Generate Randomized Questions
                </button>
              )}
            </div>
          </div>
        )}

        {/* Randomized Questions Preview */}
        {randomizedQuestions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Preview: Randomized Questions ({randomizedQuestions.length})
            </h3>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {randomizedQuestions.map((question, index) => (
                <div key={index} className="border-b border-gray-200 p-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        Q{index + 1}: {question.title || question.problem_statement?.substring(0, 80) + '...'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Difficulty: {question.difficulty || 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={saveQuestions}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md flex items-center gap-2"
              >
                {saving ? 'Saving...' : 'Save to Certification'}
                {!saving && <Save className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h4 className="font-semibold text-yellow-800 mb-3">How to Use:</h4>
          <ol className="text-yellow-700 text-sm space-y-2 list-decimal list-inside">
            <li>Upload multiple JSON files (e.g., <code>python_easy.json</code>, <code>dsa_medium.json</code>)</li>
            <li>Each file should contain MCQ questions in JSON format with fields: <code>title, options, correct_answer, difficulty, topic_name</code></li>
            <li>Questions will be randomized from all uploaded files</li>
            <li>Set the number of questions you want to include in the test</li>
            <li>Click "Generate Randomized Questions" to create the question set</li>
            <li>Preview and save the questions to the certification</li>
          </ol>
        </div>

        {/* Sample JSON Format */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-800 mb-3">Sample JSON Format:</h4>
          <pre className="text-xs bg-gray-800 text-green-400 p-4 rounded overflow-x-auto">
{`[
  {
    "title": "What is Python?",
    "options": [
      "A programming language",
      "A snake species", 
      "A database system",
      "A web framework"
    ],
    "correct_answer": 0,
    "difficulty": "Easy",
    "topic_name": "Python Fundamentals"
  }
]`}
          </pre>
        </div>
      </div>
    </Layout>
  )
}

export default CertificationQuestionsEnhanced

