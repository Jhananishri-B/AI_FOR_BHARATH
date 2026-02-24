import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminAPI } from '../services/api'
import { Plus, Trash2, GripVertical, BookOpen, HelpCircle, Code, Edit3, Save, ArrowLeft } from 'lucide-react'

const EditCoursePage = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [initialLoaded, setInitialLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [course, setCourse] = useState({ 
    title: '', 
    description: '', 
    xp_reward: 0, 
    modules: [] 
  })
  const [draggedCard, setDraggedCard] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminAPI.getCourse(courseId)
        const data = res.data
        // Map DB document to builder state shape
        const mapped = {
          title: data.title || '',
          description: data.description || '',
          xp_reward: data.xp_reward || 0,
          modules: (data.modules || []).map((m) => ({
            id: m.module_id,
            title: m.title || '',
            order: m.order || 0,
            topics: (m.topics || []).map((t) => ({
              id: t.topic_id,
              title: t.title || '',
              content: t.content || '',
              xp_reward: t.xp_reward || 50,
              cards: (t.cards || []).map((c) => ({
                card_id: c.card_id,
                type: c.type,
                content: c.content || '',
                xp_reward: c.xp_reward || 10,
                explanation: c.explanation || '',
                choices: c.choices || undefined,
                correct_choice_index: c.correct_choice_index ?? undefined,
                starter_code: c.starter_code || undefined,
                test_cases: c.test_cases || undefined,
                blanks: c.blanks || undefined,
                correct_answers: c.correct_answers || undefined,
                is_practice_problem: c.is_practice_problem || false,
                difficulty: c.difficulty || 'Medium',
                tags: c.tags || []
              })),
            })),
          })),
        }
        setCourse(mapped)
        setInitialLoaded(true)
      } catch (e) {
        setError('Failed to load course: ' + e.message)
      }
    }
    load()
  }, [courseId])

  const addModule = () => {
    setCourse(prev => ({
      ...prev,
      modules: [...prev.modules, { 
        id: crypto.randomUUID(), 
        title: '', 
        order: prev.modules.length,
        topics: [] 
      }]
    }))
  }

  const removeModule = (id) => {
    setCourse(prev => ({ ...prev, modules: prev.modules.filter(m => m.id !== id) }))
  }

  const updateModuleTitle = (id, title) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === id ? { ...m, title } : m)
    }))
  }

  const addTopic = (moduleId) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.map(m => 
        m.id === moduleId 
          ? { 
              ...m, 
              topics: [...m.topics, { 
                id: crypto.randomUUID(), 
                title: '', 
                content: '',
                xp_reward: 50,
                cards: [] 
              }] 
            } 
          : m
      )
    }))
  }

  const removeTopic = (moduleId, topicId) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.map(m => 
        m.id === moduleId 
          ? { ...m, topics: m.topics.filter(t => t.id !== topicId) } 
          : m
      )
    }))
  }

  const updateTopic = (moduleId, topicId, field, value) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.map(m =>
        m.id === moduleId
          ? {
              ...m,
              topics: m.topics.map(t => t.id === topicId ? { ...t, [field]: value } : t)
            }
          : m
      )
    }))
  }

  const addCard = (moduleId, topicId, cardType) => {
    const newCard = {
      card_id: crypto.randomUUID(),
      type: cardType,
      content: '',
      xp_reward: 10,
      explanation: ''
    }

    // Add card type specific fields
    if (cardType === 'mcq') {
      newCard.choices = ['', '', '', '']
      newCard.correct_choice_index = 0
    } else if (cardType === 'code') {
      newCard.starter_code = '# Your code here'
      newCard.test_cases = [{ input: '', expected_output: '', is_hidden: false }]
      newCard.is_practice_problem = false
      newCard.difficulty = 'Medium'
      newCard.tags = []
    } else if (cardType === 'fill-in-blank') {
      newCard.blanks = ['']
      newCard.correct_answers = ['']
    }

    setCourse(prev => ({
      ...prev,
      modules: prev.modules.map(m =>
        m.id === moduleId
          ? {
              ...m,
              topics: m.topics.map(t =>
                t.id === topicId
                  ? { ...t, cards: [...t.cards, newCard] }
                  : t
              )
            }
          : m
      )
    }))
  }

  const removeCard = (moduleId, topicId, cardId) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.map(m =>
        m.id === moduleId
          ? {
              ...m,
              topics: m.topics.map(t =>
                t.id === topicId
                  ? { ...t, cards: t.cards.filter(c => c.card_id !== cardId) }
                  : t
              )
            }
          : m
      )
    }))
  }

  const updateCard = (moduleId, topicId, cardId, field, value) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.map(m =>
        m.id === moduleId
          ? {
              ...m,
              topics: m.topics.map(t =>
                t.id === topicId
                  ? {
                      ...t,
                      cards: t.cards.map(c =>
                        c.card_id === cardId ? { ...c, [field]: value } : c
                      )
                    }
                  : t
              )
            }
          : m
      )
    }))
  }

  const addTestCase = (moduleId, topicId, cardId) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.map(m =>
        m.id === moduleId
          ? {
              ...m,
              topics: m.topics.map(t =>
                t.id === topicId
                  ? {
                      ...t,
                      cards: t.cards.map(c =>
                        c.card_id === cardId
                          ? { ...c, test_cases: [...(c.test_cases || []), { input: '', expected_output: '', is_hidden: false }] }
                          : c
                      )
                    }
                  : t
              )
            }
          : m
      )
    }))
  }

  const removeTestCase = (moduleId, topicId, cardId, testCaseIndex) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.map(m =>
        m.id === moduleId
          ? {
              ...m,
              topics: m.topics.map(t =>
                t.id === topicId
                  ? {
                      ...t,
                      cards: t.cards.map(c =>
                        c.card_id === cardId
                          ? { ...c, test_cases: c.test_cases.filter((_, i) => i !== testCaseIndex) }
                          : c
                      )
                    }
                  : t
              )
            }
          : m
      )
    }))
  }

  const updateTestCase = (moduleId, topicId, cardId, testCaseIndex, field, value) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.map(m =>
        m.id === moduleId
          ? {
              ...m,
              topics: m.topics.map(t =>
                t.id === topicId
                  ? {
                      ...t,
                      cards: t.cards.map(c =>
                        c.card_id === cardId
                          ? {
                              ...c,
                              test_cases: c.test_cases.map((tc, i) =>
                                i === testCaseIndex ? { ...tc, [field]: value } : tc
                              )
                            }
                          : c
                      )
                    }
                  : t
              )
            }
          : m
      )
    }))
  }

  const save = async () => {
    if (!course) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        title: course.title,
        description: course.description,
        xp_reward: Number(course.xp_reward) || 0,
        modules: course.modules.map((m) => ({
          title: m.title,
          order: Number(m.order) || 0,
          topics: m.topics.map((t) => ({
            title: t.title,
            content: t.content || '',
            xp_reward: Number(t.xp_reward) || 50,
            cards: t.cards.map((c) => ({
              type: c.type,
              content: c.content,
              xp_reward: Number(c.xp_reward) || 10,
              explanation: c.explanation,
              ...(c.type === 'mcq' && { choices: c.choices, correct_choice_index: Number(c.correct_choice_index) || 0 }),
              ...(c.type === 'code' && { 
                starter_code: c.starter_code, 
                test_cases: c.test_cases || [],
                is_practice_problem: c.is_practice_problem || false,
                difficulty: c.difficulty || 'Medium',
                tags: c.tags || []
              }),
              ...(c.type === 'fill-in-blank' && { blanks: c.blanks || [], correct_answers: c.correct_answers || [] }),
            })),
          })),
        })),
      }
      await adminAPI.updateCourse(courseId, payload)
      navigate('/courses')
    } catch (e) {
      setError('Update failed: ' + (e.response?.data?.detail || e.message))
    } finally {
      setSaving(false)
    }
  }

  if (!initialLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading course...</div>
      </div>
    )
  }

  if (error && !initialLoaded) {
  return (
    <div className="max-w-4xl mx-auto p-6">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => navigate('/courses')}
        >
          Back to Courses
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/courses')}
                className="flex items-center gap-2 text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Courses
              </button>
              <h1 className="text-2xl font-bold">Edit Course</h1>
            </div>
            <div className="flex items-center gap-3">
              {error && (
                <div className="text-red-400 text-sm bg-red-900/20 px-3 py-1 rounded">
                  {error}
                </div>
              )}
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Course Basic Info */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Course Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Course Title</label>
              <input
                type="text"
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter course title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">XP Reward</label>
              <input
                type="number"
                value={course.xp_reward}
                onChange={(e) => setCourse({ ...course, xp_reward: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter XP reward"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={course.description}
              onChange={(e) => setCourse({ ...course, description: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter course description"
            />
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-6">
          {course.modules.map((module, moduleIndex) => (
            <div key={module.id} className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-slate-400" />
                  <h3 className="text-lg font-semibold">Module {moduleIndex + 1}</h3>
                </div>
                <button
                  onClick={() => removeModule(module.id)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Module Title</label>
                <input
                  type="text"
                  value={module.title}
                  onChange={(e) => updateModuleTitle(module.id, e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter module title"
                />
              </div>

              {/* Topics */}
              <div className="space-y-4">
                {module.topics.map((topic, topicIndex) => (
                  <div key={topic.id} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <h4 className="font-medium">Topic {topicIndex + 1}</h4>
                      </div>
                      <button
                        onClick={() => removeTopic(module.id, topic.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Topic Title</label>
                        <input
                          type="text"
                          value={topic.title}
                          onChange={(e) => updateTopic(module.id, topic.id, 'title', e.target.value)}
                          className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter topic title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">XP Reward</label>
                        <input
                          type="number"
                          value={topic.xp_reward}
                          onChange={(e) => updateTopic(module.id, topic.id, 'xp_reward', e.target.value)}
                          className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter XP reward"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Topic Content</label>
                      <textarea
                        value={topic.content}
                        onChange={(e) => updateTopic(module.id, topic.id, 'content', e.target.value)}
                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 h-20 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter topic content"
                      />
                    </div>

                    {/* Cards */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Learning Cards</h5>
                        <div className="flex gap-2">
                          <button
                            onClick={() => addCard(module.id, topic.id, 'theory')}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                          >
                            <BookOpen className="w-3 h-3" />
                            Theory
                          </button>
                          <button
                            onClick={() => addCard(module.id, topic.id, 'mcq')}
                            className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                          >
                            <HelpCircle className="w-3 h-3" />
                            MCQ
                          </button>
                          <button
                            onClick={() => addCard(module.id, topic.id, 'code')}
                            className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                          >
                            <Code className="w-3 h-3" />
                            Code
                          </button>
                          <button
                            onClick={() => addCard(module.id, topic.id, 'fill-in-blank')}
                            className="flex items-center gap-1 px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm"
                          >
                            <Edit3 className="w-3 h-3" />
                            Fill-in-Blank
                          </button>
                        </div>
                      </div>

                      {topic.cards.map((card, cardIndex) => (
                        <div key={card.card_id} className="bg-slate-600 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-slate-500 rounded text-xs font-medium">
                                {card.type}
                              </span>
                              <span className="text-sm text-slate-300">Card {cardIndex + 1}</span>
                            </div>
                            <button
                              onClick={() => removeCard(module.id, topic.id, card.card_id)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">Content</label>
                              <textarea
                                value={card.content}
                                onChange={(e) => updateCard(module.id, topic.id, card.card_id, 'content', e.target.value)}
                                className="w-full bg-slate-500 border border-slate-400 rounded px-3 py-2 h-16 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter card content"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium mb-1">XP Reward</label>
                                <input
                                  type="number"
                                  value={card.xp_reward}
                                  onChange={(e) => updateCard(module.id, topic.id, card.card_id, 'xp_reward', e.target.value)}
                                  className="w-full bg-slate-500 border border-slate-400 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Explanation</label>
                                <input
                                  type="text"
                                  value={card.explanation}
                                  onChange={(e) => updateCard(module.id, topic.id, card.card_id, 'explanation', e.target.value)}
                                  className="w-full bg-slate-500 border border-slate-400 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Enter explanation"
                                />
                              </div>
                            </div>

                            {/* Card Type Specific Fields */}
                            {card.type === 'mcq' && (
                              <div>
                                <label className="block text-sm font-medium mb-2">Choices</label>
                                {card.choices?.map((choice, choiceIndex) => (
                                  <div key={choiceIndex} className="flex items-center gap-2 mb-2">
                                    <input
                                      type="radio"
                                      name={`correct-${card.card_id}`}
                                      checked={card.correct_choice_index === choiceIndex}
                                      onChange={() => updateCard(module.id, topic.id, card.card_id, 'correct_choice_index', choiceIndex)}
                                      className="text-blue-500"
                                    />
                                    <input
                                      type="text"
                                      value={choice}
                                      onChange={(e) => {
                                        const newChoices = [...card.choices]
                                        newChoices[choiceIndex] = e.target.value
                                        updateCard(module.id, topic.id, card.card_id, 'choices', newChoices)
                                      }}
                                      className="flex-1 bg-slate-500 border border-slate-400 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder={`Choice ${choiceIndex + 1}`}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            {card.type === 'code' && (
      <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Starter Code</label>
                                  <textarea
                                    value={card.starter_code}
                                    onChange={(e) => updateCard(module.id, topic.id, card.card_id, 'starter_code', e.target.value)}
                                    className="w-full bg-slate-500 border border-slate-400 rounded px-3 py-2 h-24 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter starter code"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium mb-1">Difficulty</label>
                                    <select
                                      value={card.difficulty}
                                      onChange={(e) => updateCard(module.id, topic.id, card.card_id, 'difficulty', e.target.value)}
                                      className="w-full bg-slate-500 border border-slate-400 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                      <option value="Easy">Easy</option>
                                      <option value="Medium">Medium</option>
                                      <option value="Hard">Hard</option>
                                    </select>
                                  </div>
                                  <div className="flex items-center">
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={card.is_practice_problem}
                                        onChange={(e) => updateCard(module.id, topic.id, card.card_id, 'is_practice_problem', e.target.checked)}
                                        className="text-blue-500"
                                      />
                                      <span className="text-sm">Practice Problem</span>
                                    </label>
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium">Test Cases</label>
                                    <button
                                      onClick={() => addTestCase(module.id, topic.id, card.card_id)}
                                      className="text-blue-400 hover:text-blue-300 text-sm"
                                    >
                                      + Add Test Case
                                    </button>
                                  </div>
                                  {card.test_cases?.map((testCase, testCaseIndex) => (
                                    <div key={testCaseIndex} className="bg-slate-500 rounded p-3 mb-2">
                                      <div className="grid grid-cols-2 gap-2 mb-2">
                                        <div>
                                          <label className="block text-xs font-medium mb-1">Input</label>
                                          <textarea
                                            value={testCase.input}
                                            onChange={(e) => updateTestCase(module.id, topic.id, card.card_id, testCaseIndex, 'input', e.target.value)}
                                            className="w-full bg-slate-400 border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            rows="2"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium mb-1">Expected Output</label>
                                          <textarea
                                            value={testCase.expected_output}
                                            onChange={(e) => updateTestCase(module.id, topic.id, card.card_id, testCaseIndex, 'expected_output', e.target.value)}
                                            className="w-full bg-slate-400 border border-slate-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            rows="2"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={testCase.is_hidden}
                                            onChange={(e) => updateTestCase(module.id, topic.id, card.card_id, testCaseIndex, 'is_hidden', e.target.checked)}
                                            className="text-blue-500"
                                          />
                                          <span className="text-xs">Hidden</span>
                                        </label>
                                        <button
                                          onClick={() => removeTestCase(module.id, topic.id, card.card_id, testCaseIndex)}
                                          className="text-red-400 hover:text-red-300 text-xs"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {card.type === 'fill-in-blank' && (
                              <div>
                                <label className="block text-sm font-medium mb-2">Blanks & Answers</label>
                                {card.blanks?.map((blank, blankIndex) => (
                                  <div key={blankIndex} className="flex items-center gap-2 mb-2">
                                    <input
                                      type="text"
                                      value={blank}
                                      onChange={(e) => {
                                        const newBlanks = [...card.blanks]
                                        newBlanks[blankIndex] = e.target.value
                                        updateCard(module.id, topic.id, card.card_id, 'blanks', newBlanks)
                                      }}
                                      className="flex-1 bg-slate-500 border border-slate-400 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="Blank text"
                                    />
                                    <span className="text-slate-300">→</span>
                                    <input
                                      type="text"
                                      value={card.correct_answers?.[blankIndex] || ''}
                                      onChange={(e) => {
                                        const newAnswers = [...(card.correct_answers || [])]
                                        newAnswers[blankIndex] = e.target.value
                                        updateCard(module.id, topic.id, card.card_id, 'correct_answers', newAnswers)
                                      }}
                                      className="flex-1 bg-slate-500 border border-slate-400 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="Correct answer"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => addTopic(module.id)}
                  className="w-full border-2 border-dashed border-slate-500 rounded-lg p-4 text-slate-400 hover:text-slate-300 hover:border-slate-400 transition-colors"
                >
                  <Plus className="w-5 h-5 mx-auto mb-2" />
                  Add Topic
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addModule}
            className="w-full border-2 border-dashed border-slate-600 rounded-lg p-6 text-slate-400 hover:text-slate-300 hover:border-slate-500 transition-colors"
          >
            <Plus className="w-6 h-6 mx-auto mb-2" />
            Add Module
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditCoursePage


