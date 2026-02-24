import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Code, TestTube } from 'lucide-react'

const ProblemEditor = ({ problem, onSave, onClose, isOpen }) => {
  const [formData, setFormData] = useState({
    prompt: '',
    code_starter: '',
    difficulty: 'easy',
    tags: [],
    xp_reward: 10,
    explanation: '',
    test_cases: []
  })
  const [newTag, setNewTag] = useState('')
  const [newTestCase, setNewTestCase] = useState({
    input: '',
    expected_output: '',
    is_hidden: false
  })

  useEffect(() => {
    if (problem) {
      setFormData({
        prompt: problem.prompt || '',
        code_starter: problem.code_starter || '',
        difficulty: problem.difficulty || 'easy',
        tags: problem.tags || [],
        xp_reward: problem.xp_reward || 10,
        explanation: problem.explanation || '',
        test_cases: problem.test_cases || []
      })
    } else {
      setFormData({
        prompt: '',
        code_starter: '',
        difficulty: 'easy',
        tags: [],
        xp_reward: 10,
        explanation: '',
        test_cases: []
      })
    }
  }, [problem])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleAddTestCase = () => {
    if (newTestCase.input.trim() && newTestCase.expected_output.trim()) {
      setFormData(prev => ({
        ...prev,
        test_cases: [...prev.test_cases, { ...newTestCase }]
      }))
      setNewTestCase({
        input: '',
        expected_output: '',
        is_hidden: false
      })
    }
  }

  const handleRemoveTestCase = (index) => {
    setFormData(prev => ({
      ...prev,
      test_cases: prev.test_cases.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-100">
              {problem ? 'Edit Problem' : 'Create New Problem'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Problem Title/Prompt */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Problem Title
            </label>
            <input
              type="text"
              name="prompt"
              value={formData.prompt}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter problem title..."
              required
            />
          </div>

          {/* Difficulty and XP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Difficulty
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                XP Reward
              </label>
              <input
                type="number"
                name="xp_reward"
                value={formData.xp_reward}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-sm rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-200 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Starter Code */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Starter Code
            </label>
            <textarea
              name="code_starter"
              value={formData.code_starter}
              onChange={handleInputChange}
              rows="8"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="def solution():\n    # Your code here\n    pass"
            />
          </div>

          {/* Test Cases */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Test Cases
            </label>
            <div className="space-y-3">
              {formData.test_cases.map((testCase, index) => (
                <div key={index} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-300">Test Case {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={testCase.is_hidden}
                          onChange={(e) => {
                            const newTestCases = [...formData.test_cases]
                            newTestCases[index].is_hidden = e.target.checked
                            setFormData(prev => ({ ...prev, test_cases: newTestCases }))
                          }}
                          className="mr-1"
                        />
                        Hidden
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveTestCase(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Input</label>
                      <textarea
                        value={testCase.input}
                        onChange={(e) => {
                          const newTestCases = [...formData.test_cases]
                          newTestCases[index].input = e.target.value
                          setFormData(prev => ({ ...prev, test_cases: newTestCases }))
                        }}
                        className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 text-sm font-mono"
                        rows="2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Expected Output</label>
                      <textarea
                        value={testCase.expected_output}
                        onChange={(e) => {
                          const newTestCases = [...formData.test_cases]
                          newTestCases[index].expected_output = e.target.value
                          setFormData(prev => ({ ...prev, test_cases: newTestCases }))
                        }}
                        className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 text-sm font-mono"
                        rows="2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add New Test Case */}
            <div className="bg-slate-700 rounded-lg p-4 border-2 border-dashed border-slate-600">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-300">Add New Test Case</span>
                <button
                  type="button"
                  onClick={handleAddTestCase}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Input</label>
                  <textarea
                    value={newTestCase.input}
                    onChange={(e) => setNewTestCase(prev => ({ ...prev, input: e.target.value }))}
                    className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 text-sm font-mono"
                    rows="2"
                    placeholder="Enter test input..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Expected Output</label>
                  <textarea
                    value={newTestCase.expected_output}
                    onChange={(e) => setNewTestCase(prev => ({ ...prev, expected_output: e.target.value }))}
                    className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-slate-100 text-sm font-mono"
                    rows="2"
                    placeholder="Enter expected output..."
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="flex items-center text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={newTestCase.is_hidden}
                    onChange={(e) => setNewTestCase(prev => ({ ...prev, is_hidden: e.target.checked }))}
                    className="mr-2"
                  />
                  Hidden test case (not shown to students)
                </label>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Explanation (Optional)
            </label>
            <textarea
              name="explanation"
              value={formData.explanation}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Explain the solution approach..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {problem ? 'Update Problem' : 'Create Problem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProblemEditor
