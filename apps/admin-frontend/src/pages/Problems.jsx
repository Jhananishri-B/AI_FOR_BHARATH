import React, { useEffect, useState } from 'react'
import { adminAPI } from '../services/api'

const Problems = () => {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [courses, setCourses] = useState([])
  const [topics, setTopics] = useState([])
  const emptyForm = {
    // UI-level fields: title (short) and description (long). We'll compose 'prompt' when saving.
    title: '',
    description: '',
    explanation: '',
    code_starter: '',
    difficulty: 'medium',
    tags: '',
    xp_reward: 10,
    is_practice_problem: true,
    course_id: '',
    topic_id: '',
    test_cases: [{ input: '', expected_output: '', is_hidden: false }]
  }
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getProblems()
      setProblems(res.data)
    } catch (e) {
      setError('Failed to load problems')
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async () => {
    try {
      const res = await adminAPI.getCourses()
      setCourses(res.data)
    } catch (e) {
      console.error('Failed to load courses:', e)
    }
  }

  const loadTopics = async (courseId) => {
    if (!courseId) {
      setTopics([])
      return
    }
    try {
      const res = await adminAPI.getTopicsForCourse(courseId)
      setTopics(res.data)
    } catch (e) {
      console.error('Failed to load topics:', e)
      setTopics([])
    }
  }

  useEffect(() => { 
    load()
    loadCourses()
  }, [])

  const handleCourseChange = (courseId) => {
    setForm({ ...form, course_id: courseId, topic_id: '' })
    loadTopics(courseId)
  }

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const startEdit = async (id) => {
    setEditingId(id)
    try {
      const res = await adminAPI.getProblem(id)
      const p = res.data
      // The backend currently stores a single `prompt` field. If present, try to split
      // it into a short title (first line) and a longer description (rest). Also allow
      // explicit `content`/`description` fields from the API.
      const rawPrompt = p.content || p.prompt || '';
      let title = '';
      let description = '';
      if (rawPrompt) {
        // Prefer explicit description split by blank lines or newlines.
        const parts = rawPrompt.split(/\n\n|\n/);
        if (parts.length > 1) {
          title = parts.shift() || '';
          description = parts.join('\n\n') || '';
        } else {
          // If prompt is a single long line, try to split at the first sentence boundary
          const sentenceParts = rawPrompt.split(/(?<=[.!?])\s+/);
          if (sentenceParts.length > 1 && sentenceParts[0].length < 120) {
            title = sentenceParts.shift() || '';
            description = sentenceParts.join(' ') || '';
          } else {
            // Fallback: put whole prompt into title so admin can edit it
            title = rawPrompt;
            description = '';
          }
        }
      }

      setForm({
        title: title,
        description: description || (p.description || ''),
        explanation: p.explanation || '',
        code_starter: p.starter_code || '',
        difficulty: p.difficulty || 'medium',
        tags: (p.tags || []).join(','),
        xp_reward: p.xp_reward || 10,
        is_practice_problem: true,
        course_id: p.course_id || '',
        topic_id: p.topic_id || '',
        test_cases: (p.public_test_cases || []).map(tc => ({ input: tc.input || '', expected_output: tc.expected_output || '', is_hidden: !!tc.is_hidden }))
      })
      
      // Load topics if course_id exists
      if (p.course_id) {
        loadTopics(p.course_id)
      }
      
      setShowForm(true)
    } catch (e) {
      setError('Failed to load problem')
    }
  }

  const save = async () => {
    // Compose prompt from title + description so backend retains the existing 'prompt' field.
    const composedPrompt = [form.title?.trim(), form.description?.trim()].filter(Boolean).join('\n\n');
    const safeTitle = (form.title || '').toString().trim().split(/\r?\n/)[0] || '';
    const payload = {
      // include explicit title so backend can persist it separately from prompt
      title: safeTitle,
      prompt: composedPrompt,
      explanation: form.explanation,
      code_starter: form.code_starter,
      difficulty: form.difficulty,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      xp_reward: Number(form.xp_reward) || 10,
      is_practice_problem: !!form.is_practice_problem,
      course_id: form.course_id,
      topic_id: form.topic_id,
      test_cases: form.test_cases.map(tc => ({ input: tc.input, expected_output: tc.expected_output, is_hidden: !!tc.is_hidden }))
    }
    if (editingId) {
      await adminAPI.updateProblem(editingId, payload)
    } else {
      await adminAPI.createProblem(payload)
    }
    setShowForm(false)
    await load()
  }

  const remove = async (id) => {
    await adminAPI.deleteProblem(id)
    await load()
  }

  const addTestCase = () => setForm({ ...form, test_cases: [...form.test_cases, { input: '', expected_output: '', is_hidden: false }] })
  const updateTestCase = (idx, patch) => setForm({ ...form, test_cases: form.test_cases.map((tc, i) => i === idx ? { ...tc, ...patch } : tc) })
  const deleteTestCase = (idx) => setForm({ ...form, test_cases: form.test_cases.filter((_, i) => i !== idx) })

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-400">{error}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Practice Problems</h1>
        <div className="flex items-center gap-2">
          <label className="px-3 py-2 bg-green-600 rounded cursor-pointer">
            Upload JSON
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  await adminAPI.uploadProblemsJson(file)
                  alert('Problems uploaded successfully')
                  await load()
                } catch (err) {
                  alert('Failed to upload: ' + (err.response?.data?.detail || err.message))
                } finally {
                  e.target.value = ''
                }
              }}
            />
          </label>
          <button className="px-3 py-2 bg-blue-600 rounded" onClick={startCreate}>Create Problem</button>
        </div>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="min-w-full border border-slate-800">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Difficulty</th>
              <th className="px-3 py-2 text-left">Tags</th>
              <th className="px-3 py-2 text-left">XP</th>
              <th className="px-3 py-2 text-left">Practice</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {problems.map(p => (
              <tr key={p.problem_id} className="border-t border-slate-800">
                <td className="px-3 py-2">{p.title}</td>
                <td className="px-3 py-2">{p.difficulty}</td>
                <td className="px-3 py-2">{(p.tags || []).join(', ')}</td>
                <td className="px-3 py-2">{p.xp_reward || 10}</td>
                <td className="px-3 py-2">{String(p.is_practice_problem ?? true)}</td>
                <td className="px-3 py-2 text-right">
                  <button className="px-3 py-1 bg-blue-600 rounded mr-2" onClick={() => startEdit(p.problem_id)}>Edit</button>
                  <button className="px-3 py-1 bg-red-600 rounded" onClick={() => remove(p.problem_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-slate-800 border border-slate-700 rounded p-6 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Problem' : 'Create Problem'}</h2>
            <div className="space-y-3">
              <input className="w-full bg-slate-700 rounded px-3 py-2" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <textarea className="w-full bg-slate-700 rounded px-3 py-2 h-28" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <textarea className="w-full bg-slate-700 rounded px-3 py-2 h-28" placeholder="Starter Code" value={form.code_starter} onChange={e => setForm({ ...form, code_starter: e.target.value })} />
              
              {/* Course and Topic Selection */}
              <div className="grid grid-cols-2 gap-3">
                <select 
                  className="bg-slate-700 rounded px-3 py-2" 
                  value={form.course_id} 
                  onChange={e => handleCourseChange(e.target.value)}
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
                <select 
                  className="bg-slate-700 rounded px-3 py-2" 
                  value={form.topic_id} 
                  onChange={e => setForm({ ...form, topic_id: e.target.value })}
                  disabled={!form.course_id}
                >
                  <option value="">Select Topic</option>
                  {topics.map(topic => (
                    <option key={topic.topic_id} value={topic.topic_id}>
                      {topic.title} ({topic.module_title})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <select className="bg-slate-700 rounded px-3 py-2" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
                <input className="bg-slate-700 rounded px-3 py-2" placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                <input type="number" className="bg-slate-700 rounded px-3 py-2" placeholder="XP Reward" value={form.xp_reward} onChange={e => setForm({ ...form, xp_reward: Number(e.target.value) })} />
              </div>

              <div className="mt-4">
                <div className="font-semibold mb-2">Test Cases</div>
                {form.test_cases.map((tc, idx) => (
                  <div key={idx} className="border border-slate-700 rounded p-3 mb-3">
                    <div className="grid grid-cols-2 gap-3">
                      <textarea className="bg-slate-700 rounded px-3 py-2 h-20" placeholder="Input" value={tc.input} onChange={e => updateTestCase(idx, { input: e.target.value })} />
                      <textarea className="bg-slate-700 rounded px-3 py-2 h-20" placeholder="Expected Output" value={tc.expected_output} onChange={e => updateTestCase(idx, { expected_output: e.target.value })} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <label className="text-sm"><input type="checkbox" className="mr-2" checked={tc.is_hidden} onChange={e => updateTestCase(idx, { is_hidden: e.target.checked })} /> Hidden</label>
                      <button className="text-red-400" onClick={() => deleteTestCase(idx)}>Delete</button>
                    </div>
                  </div>
                ))}
                <button className="px-3 py-1 bg-slate-700 rounded" onClick={addTestCase}>Add Test Case</button>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 bg-slate-600 rounded" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="px-3 py-2 bg-blue-600 rounded" onClick={save}>{editingId ? 'Save' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Problems


