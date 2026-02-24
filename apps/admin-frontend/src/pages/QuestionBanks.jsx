import React, { useEffect, useState } from 'react'
import { Edit, Trash2, Plus, Code, FileQuestion, Search, Filter } from 'lucide-react'
import { adminCertTestsAPI } from '../services/api'

const QuestionBanks = () => {
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [selectedBank, setSelectedBank] = useState(null)
  const [questions, setQuestions] = useState([])
  const [viewingQuestions, setViewingQuestions] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [editingIndex, setEditingIndex] = useState(null)

  useEffect(() => {
    loadBanks()
  }, [])

  const loadBanks = async () => {
    try {
      setLoading(true)
      const res = await adminCertTestsAPI.listBanks()
      setBanks(res.data || [])
    } catch (e) {
      console.error('Failed to load banks:', e)
    } finally {
      setLoading(false)
    }
  }

  const viewBankQuestions = async (bank) => {
    try {
      console.log('Fetching bank with ID:', bank.id || bank._id)
      // Fetch full bank details with all questions
      const response = await adminCertTestsAPI.getBank(bank.id || bank._id)
      console.log('Bank response:', response.data)
      setSelectedBank(response.data)
      setQuestions(response.data.questions || [])
      setViewingQuestions(true)
    } catch (e) {
      console.error('Failed to load bank questions:', e)
      console.error('Error details:', e.response?.data)
      alert(`Failed to load question bank: ${e.response?.data?.detail || e.message}`)
    }
  }

  const deleteBank = async (bankId) => {
    console.log('Attempting to delete bank with ID:', bankId)
    if (!confirm('Are you sure you want to delete this question bank? This action cannot be undone.')) return
    
    try {
      const response = await adminCertTestsAPI.deleteBank(bankId)
      console.log('Delete response:', response)
      alert('Bank deleted successfully')
      await loadBanks()
    } catch (e) {
      console.error('Failed to delete bank:', e)
      console.error('Error details:', e.response?.data)
      alert(e.response?.data?.detail || 'Failed to delete bank')
    }
  }

  const deleteQuestion = async (questionIndex) => {
    if (!confirm('Are you sure you want to delete this question?')) return
    
    try {
      const updatedQuestions = questions.filter((_, idx) => idx !== questionIndex)
      await adminCertTestsAPI.updateBank(selectedBank.id, {
        questions: updatedQuestions
      })
      setQuestions(updatedQuestions)
      alert('Question deleted successfully')
      await loadBanks() // Refresh the banks list
    } catch (e) {
      console.error('Failed to delete question:', e)
      alert('Failed to delete question')
    }
  }

  const startEditQuestion = (question, index) => {
    setEditingQuestion(JSON.parse(JSON.stringify(question))) // Deep copy
    setEditingIndex(index)
  }

  const cancelEdit = () => {
    setEditingQuestion(null)
    setEditingIndex(null)
  }

  const saveEditedQuestion = async () => {
    try {
      const updatedQuestions = [...questions]
      updatedQuestions[editingIndex] = editingQuestion
      
      await adminCertTestsAPI.updateBank(selectedBank.id, {
        questions: updatedQuestions
      })
      
      setQuestions(updatedQuestions)
      setEditingQuestion(null)
      setEditingIndex(null)
      alert('Question updated successfully')
      await loadBanks()
    } catch (e) {
      console.error('Failed to update question:', e)
      alert('Failed to update question: ' + (e.response?.data?.detail || e.message))
    }
  }

  const updateEditingField = (field, value) => {
    setEditingQuestion(prev => ({ ...prev, [field]: value }))
  }

  const updateEditingOption = (index, value) => {
    const newOptions = [...editingQuestion.options]
    newOptions[index] = value
    setEditingQuestion(prev => ({ ...prev, options: newOptions }))
  }

  const addEditingOption = () => {
    setEditingQuestion(prev => ({
      ...prev,
      options: [...(prev.options || []), '']
    }))
  }

  const removeEditingOption = (index) => {
    const newOptions = editingQuestion.options.filter((_, i) => i !== index)
    let newCorrectAnswer = editingQuestion.correct_answer
    if (editingQuestion.correct_answer === index) {
      newCorrectAnswer = 0
    } else if (editingQuestion.correct_answer > index) {
      newCorrectAnswer = editingQuestion.correct_answer - 1
    }
    setEditingQuestion(prev => ({
      ...prev,
      options: newOptions,
      correct_answer: newCorrectAnswer
    }))
  }

  const updateTestCase = (index, field, value) => {
    const newTestCases = [...editingQuestion.test_cases]
    newTestCases[index] = { ...newTestCases[index], [field]: value }
    setEditingQuestion(prev => ({ ...prev, test_cases: newTestCases }))
  }

  const addTestCase = () => {
    setEditingQuestion(prev => ({
      ...prev,
      test_cases: [...(prev.test_cases || []), { input: '', expected_output: '', is_hidden: false }]
    }))
  }

  const removeTestCase = (index) => {
    setEditingQuestion(prev => ({
      ...prev,
      test_cases: prev.test_cases.filter((_, i) => i !== index)
    }))
  }

  const filteredBanks = banks.filter(bank => {
    const matchesSearch = bank.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bank.file_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDifficulty = filterDifficulty === 'all' || bank.difficulty === filterDifficulty
    return matchesSearch && matchesDifficulty
  })

  if (viewingQuestions && selectedBank) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <FileQuestion className="w-8 h-8 text-blue-400" />
              {selectedBank.display_name || selectedBank.file_name}
            </h1>
            <p className="text-slate-400 mt-2">{questions.length} questions in this bank</p>
          </div>
          <button
            onClick={() => setViewingQuestions(false)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
          >
            ← Back to Banks
          </button>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <div className="space-y-4">
            {questions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileQuestion className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No questions found in this bank</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={idx} className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-white font-semibold">Q{idx + 1}.</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          q.difficulty === 'Easy' ? 'bg-green-900/50 text-green-300' :
                          q.difficulty === 'Medium' ? 'bg-yellow-900/50 text-yellow-300' :
                          'bg-red-900/50 text-red-300'
                        }`}>
                          {q.difficulty}
                        </span>
                        {q.type === 'code' && (
                          <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs font-medium flex items-center gap-1">
                            <Code className="w-3 h-3" /> Coding
                          </span>
                        )}
                      </div>
                      <p className="text-slate-200 mb-2">{q.title}</p>
                      {q.options && (
                        <div className="mt-2 space-y-1 text-sm">
                          {q.options.map((opt, i) => (
                            <div key={i} className={`text-slate-300 ${i === q.correct_answer ? 'text-green-400 font-medium' : ''}`}>
                              {String.fromCharCode(65 + i)}. {opt} {i === q.correct_answer && '✓'}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.tags && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {q.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-600 text-slate-300 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEditQuestion(q, idx)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        title="Edit Question"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteQuestion(idx)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Edit Question Modal */}
        {editingQuestion && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Edit Question</h2>
                <button onClick={cancelEdit} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Question Type */}
                {editingQuestion.type === 'code' && (
                  <div className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded text-sm font-medium inline-flex items-center gap-2">
                    <Code className="w-4 h-4" /> Coding Question
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Question Title / Statement
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.title || ''}
                    onChange={(e) => updateEditingField('title', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  />
                </div>

                {/* Prompt for coding questions */}
                {editingQuestion.type === 'code' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Problem Description
                    </label>
                    <textarea
                      value={editingQuestion.prompt || ''}
                      onChange={(e) => updateEditingField('prompt', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                    />
                  </div>
                )}

                {/* MCQ Options */}
                {editingQuestion.options && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Options
                    </label>
                    <div className="space-y-2">
                      {editingQuestion.options.map((opt, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <span className="text-slate-400 font-medium">{String.fromCharCode(65 + i)}.</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateEditingOption(i, e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                          />
                          <input
                            type="radio"
                            name="correct"
                            checked={editingQuestion.correct_answer === i}
                            onChange={() => updateEditingField('correct_answer', i)}
                            className="w-4 h-4"
                            title="Mark as correct"
                          />
                          <button
                            onClick={() => removeEditingOption(i)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded"
                            disabled={editingQuestion.options.length <= 2}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addEditingOption}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        + Add Option
                      </button>
                    </div>
                  </div>
                )}

                {/* Test Cases for coding questions */}
                {editingQuestion.test_cases && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Test Cases
                    </label>
                    <div className="space-y-3">
                      {editingQuestion.test_cases.map((tc, i) => (
                        <div key={i} className="p-4 bg-slate-700 rounded border border-slate-600">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-300 font-medium">Test Case {i + 1}</span>
                            <button
                              onClick={() => removeTestCase(i)}
                              className="p-1 bg-red-600 hover:bg-red-700 text-white rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Input</label>
                              <textarea
                                value={tc.input || ''}
                                onChange={(e) => updateTestCase(i, 'input', e.target.value)}
                                rows={2}
                                className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Expected Output</label>
                              <textarea
                                value={tc.expected_output || ''}
                                onChange={(e) => updateTestCase(i, 'expected_output', e.target.value)}
                                rows={2}
                                className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                              />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-slate-300">
                              <input
                                type="checkbox"
                                checked={tc.is_hidden || false}
                                onChange={(e) => updateTestCase(i, 'is_hidden', e.target.checked)}
                                className="w-4 h-4"
                              />
                              Hidden Test Case
                            </label>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={addTestCase}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        + Add Test Case
                      </button>
                    </div>
                  </div>
                )}

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={editingQuestion.difficulty || 'Easy'}
                    onChange={(e) => updateEditingField('difficulty', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>

                {/* Topic */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Topic Name
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.topic_name || ''}
                    onChange={(e) => updateEditingField('topic_name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={(editingQuestion.tags || []).join(', ')}
                    onChange={(e) => updateEditingField('tags', e.target.value.split(',').map(t => t.trim()))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                    placeholder="python, basics, loops"
                  />
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Explanation (optional)
                  </label>
                  <textarea
                    value={editingQuestion.explanation || ''}
                    onChange={(e) => updateEditingField('explanation', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-6 flex gap-3 justify-end">
                <button
                  onClick={cancelEdit}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditedQuestion}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-white">Loading question banks...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <FileQuestion className="w-8 h-8 text-blue-400" />
            Question Banks
          </h1>
          <p className="text-slate-400 mt-2">View and manage your MCQ question banks</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search question banks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Banks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBanks.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
            <FileQuestion className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 text-lg">No question banks found</p>
            <p className="text-slate-500 text-sm mt-2">Upload JSON files to create question banks</p>
          </div>
        ) : (
          filteredBanks.map((bank) => (
            <div
              key={bank.id || bank.file_name}
              className="bg-slate-800 rounded-lg border border-slate-700 p-5 hover:border-blue-500 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileQuestion className="w-6 h-6 text-blue-400" />
                  <h3 className="text-white font-semibold text-lg">
                    {bank.display_name || bank.file_name}
                  </h3>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Questions:</span>
                  <span className="text-white font-medium">{bank.question_count || 0}</span>
                </div>
                {bank.difficulty && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Difficulty:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      bank.difficulty === 'Easy' ? 'bg-green-900/50 text-green-300' :
                      bank.difficulty === 'Medium' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-red-900/50 text-red-300'
                    }`}>
                      {bank.difficulty}
                    </span>
                  </div>
                )}
                {bank.topic_name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Topic:</span>
                    <span className="text-slate-300">{bank.topic_name}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => viewBankQuestions(bank)}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <FileQuestion className="w-4 h-4" />
                  View Questions
                </button>
                <button
                  onClick={() => deleteBank(bank.id)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  title="Delete Bank"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default QuestionBanks
