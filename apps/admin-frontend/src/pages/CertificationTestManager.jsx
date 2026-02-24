import React, { useEffect, useState } from 'react'
import { Upload, FileText, Settings, Save, Layers, Clock, Shield, Shuffle, ListChecks, Copy, Download, Code, Eye, AlertCircle } from 'lucide-react'
import { adminCertTestsAPI } from '../services/api'

const CertificationTestManager = () => {
  const [banks, setBanks] = useState([])
  const [specs, setSpecs] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    cert_id: '',
    difficulty: 'Easy',
    bank_ids: [],
    question_count: 10,
    total_questions: 10,
    mcq_count: 5,
    code_count: 5,
    duration_minutes: 30,
    pass_percentage: 70,
    randomize: true,
    restrict_copy_paste: true,
    restrict_tab_switching: true,
    restrict_right_click: true,
    enable_fullscreen: true,
    enable_proctoring: true,
    prerequisite_course_id: '',
    allowed_languages: ['python', 'javascript', 'cpp', 'c', 'java'],
    lock_language: false,
  })

  useEffect(() => {
    loadInitial()
  }, [])

  useEffect(() => {
    // If query params specify cert_id and difficulty, load that spec to prefill the form
    const params = new URLSearchParams(window.location.search)
    const certId = params.get('cert_id')
    const diff = params.get('difficulty')
    if (certId && diff) {
      adminCertTestsAPI.getSpecForCertDifficulty(certId, diff)
        .then((res) => {
          const s = res.data || {}
          setForm({
            cert_id: s.cert_id || certId,
            difficulty: s.difficulty || diff,
            bank_ids: s.bank_ids || [],
            question_count: s.question_count ?? 10,
            total_questions: s.total_questions ?? s.question_count ?? 10,
            mcq_count: s.mcq_count ?? 5,
            code_count: s.code_count ?? 5,
            duration_minutes: s.duration_minutes ?? 30,
            pass_percentage: s.pass_percentage ?? 70,
            randomize: s.randomize ?? true,
            restrict_copy_paste: s.restrict_copy_paste ?? true,
            restrict_tab_switching: s.restrict_tab_switching ?? true,
            restrict_right_click: s.restrict_right_click ?? true,
            enable_fullscreen: s.enable_fullscreen ?? true,
            enable_proctoring: s.enable_proctoring ?? true,
            prerequisite_course_id: s.prerequisite_course_id || '',
            allowed_languages: s.allowed_languages || ['python', 'javascript', 'cpp', 'c', 'java'],
            lock_language: s.lock_language ?? false,
          })
        })
        .catch(() => {
          // no-op if not found
        })
    }
  }, [])

  async function loadInitial() {
    try {
      const [banksRes, specsRes, coursesRes] = await Promise.all([
        adminCertTestsAPI.listBanks(),
        adminCertTestsAPI.listSpecs(),
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/courses/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
        })
      ])
      setBanks(banksRes.data || [])
      setSpecs(specsRes.data || [])
      const coursesData = await coursesRes.json().catch(() => [])
      setCourses(Array.isArray(coursesData) ? coursesData : [])
    } catch (e) {
      // no-op
    }
  }

  async function onUpload() {
    if (!selectedFiles.length) return
    try {
      setUploading(true)
      await adminCertTestsAPI.uploadBanks(Array.from(selectedFiles))
      setSelectedFiles([])
      await loadInitial()
      alert('Uploaded question banks successfully')
    } catch (e) {
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function onCreateSpec(e) {
    e.preventDefault()
    try {
      await adminCertTestsAPI.createSpec(form)
      await loadInitial()
      alert('Test spec saved')
    } catch (e) {
      alert('Failed to save spec')
    }
  }

  const toggleBank = (bankId) => {
    setForm((prev) => ({
      ...prev,
      bank_ids: prev.bank_ids.includes(bankId)
        ? prev.bank_ids.filter((id) => id !== bankId)
        : [...prev.bank_ids, bankId],
    }))
  }

  const sampleJson = `[
  {
    "title": "What is Python?",
    "options": ["A programming language", "A snake", "A database", "An OS"],
    "correct_answer": 0,
    "difficulty": "Easy",
    "topic_name": "Python Basics",
    "tags": ["python", "basics"],
    "explanation": "Python is a high-level, interpreted programming language known for its simplicity and readability."
  },
  {
    "title": "Which HTTP method is idempotent?",
    "options": ["POST", "PUT", "PATCH", "CONNECT"],
    "correct_answer": 1,
    "difficulty": "Medium",
    "topic_name": "Web Development",
    "tags": ["http", "web"],
    "explanation": "PUT is idempotent - calling it multiple times with the same data produces the same result."
  },
  {
    "title": "What is the time complexity of binary search?",
    "options": ["O(n)", "O(log n)", "O(n^2)", "O(1)"],
    "correct_answer": 1,
    "difficulty": "Medium",
    "topic_name": "Data Structures",
    "tags": ["algorithms", "complexity"],
    "explanation": "Binary search has O(log n) time complexity."
  },
  {
    "type": "code",
    "title": "Sum of Two Numbers",
    "prompt": "Write a program that reads two integers from input (one per line) and prints their sum.",
    "test_cases": [
      { "input": "5\\n3", "expected_output": "8", "is_hidden": false },
      { "input": "10\\n20", "expected_output": "30", "is_hidden": false },
      { "input": "-5\\n5", "expected_output": "0", "is_hidden": true }
    ],
    "difficulty": "Easy",
    "topic_name": "Basics",
    "tags": ["code", "math", "input-output"],
    "starter_code": {
      "python": "# Read two integers and print their sum\\na = int(input())\\nb = int(input())\\nprint(a + b)"
    }
  },
  {
    "type": "code",
    "title": "Reverse a String",
    "prompt": "Write a program that takes a string as input and prints the reversed string.",
    "test_cases": [
      { "input": "hello", "expected_output": "olleh", "is_hidden": false },
      { "input": "world", "expected_output": "dlrow", "is_hidden": false },
      { "input": "a", "expected_output": "a", "is_hidden": true }
    ],
    "difficulty": "Easy",
    "topic_name": "Strings",
    "tags": ["strings", "manipulation"],
    "starter_code": {
      "python": "# Read string and print reversed\\ns = input()\\nprint(s[::-1])"
    }
  },
  {
    "title": "Which data structure uses LIFO?",
    "options": ["Queue", "Stack", "Array", "Tree"],
    "correct_answer": 1,
    "difficulty": "Easy",
    "topic_name": "Data Structures",
    "tags": ["stack", "data-structures"]
  },
  {
    "type": "code",
    "title": "Check Even or Odd",
    "prompt": "Write a program that reads an integer and prints 'Even' if it's even, 'Odd' if it's odd.",
    "test_cases": [
      { "input": "4", "expected_output": "Even", "is_hidden": false },
      { "input": "7", "expected_output": "Odd", "is_hidden": false },
      { "input": "0", "expected_output": "Even", "is_hidden": true }
    ],
    "difficulty": "Easy",
    "topic_name": "Conditionals",
    "tags": ["conditionals", "math"],
    "starter_code": {
      "python": "# Check even or odd\\nn = int(input())\\nif n % 2 == 0:\\n    print('Even')\\nelse:\\n    print('Odd')"
    }
  },
  {
    "title": "What does CSS stand for?",
    "options": ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style System", "Colorful Style Sheets"],
    "correct_answer": 1,
    "difficulty": "Easy",
    "topic_name": "Web Development",
    "tags": ["css", "frontend"]
  }
]`;

  const downloadTemplate = () => {
    const blob = new Blob([sampleJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_bank_template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
      <div className="space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-400" />
              Certification Test Manager
            </h1>
            <p className="text-slate-400 mt-2">Create and configure proctored coding tests with restrictions</p>
          </div>
          <button
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center gap-2"
            onClick={async () => {
              try {
                // Create a demo bank from the sample JSON
                const file = new File([sampleJson], 'demo_bank.json', { type: 'application/json' })
                const res = await adminCertTestsAPI.uploadBanks([file])
                const uploaded = res.data?.uploaded || []
                if (!uploaded.length) throw new Error('Upload did not return a bank id')
                const bankId = uploaded[0].id

                // Create a demo spec referencing the uploaded bank
                await adminCertTestsAPI.createSpec({
                  cert_id: 'DEMO-PYTHON',
                  difficulty: 'Easy',
                  bank_ids: [bankId],
                  question_count: 5,
                  duration_minutes: 10,
                  pass_percentage: 60,
                  randomize: true,
                  restrict_copy_paste: true,
                  prerequisite_course_id: '',
                })
                await loadInitial()
                alert('Demo test loaded')
              } catch (e) {
                alert('Failed to load demo test: ' + (e.response?.data?.detail || e.message))
              }
            }}
          >
            Load Demo Test
          </button>
        </div>

        {/* Upload Question Banks Section */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" /> Upload Question Banks (JSON)
          </h2>
          
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-blue-300 font-semibold mb-1">How to Create Tests</h3>
                <p className="text-slate-300 text-sm">
                  1. Upload MCQ question banks using JSON format below<br />
                  2. View and edit your question banks in the <strong>Question Banks</strong> page<br />
                  3. Select question banks and configure below:<br />
                  &nbsp;&nbsp;&nbsp;• <strong>Questions/Test</strong>: How many questions each student gets per test<br />
                  &nbsp;&nbsp;&nbsp;• <strong>Total Pool</strong>: Total questions available (for randomization)<br />
                  4. Save test specification to make it available for students
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <input
              type="file"
              multiple
              accept=".json"
              onChange={(e) => setSelectedFiles(e.target.files)}
              className="text-slate-300"
            />
            <button
              onClick={onUpload}
              disabled={uploading || !selectedFiles.length}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={downloadTemplate}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> JSON Template
            </button>
            <a 
              href="/question-banks" 
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded flex items-center gap-2 no-underline"
            >
              <FileText className="w-4 h-4" /> View All Banks
            </a>
          </div>

          <div className="mt-4">
            <h3 className="text-slate-300 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Uploaded Question Banks
            </h3>
            {banks.length === 0 ? (
              <div className="text-center py-8 bg-slate-700/30 rounded-lg border border-slate-600">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400">No question banks uploaded yet</p>
                <p className="text-slate-500 text-sm mt-1">Upload JSON files to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {banks.map((b) => (
                  <div key={b.id || b.file_name} className="p-3 bg-slate-700 rounded border border-slate-600 hover:border-blue-500 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-white font-medium">
                        {b.display_name || b.file_name}
                      </div>
                      <FileText className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-slate-400 text-sm">
                      {b.question_count || 0} questions
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4">
            <details className="bg-slate-900 border border-slate-700 rounded-lg">
              <summary className="px-4 py-3 cursor-pointer text-slate-300 hover:text-white font-medium">
                📋 View JSON Format Example
              </summary>
              <pre className="p-4 text-xs text-slate-200 overflow-auto border-t border-slate-700">
{sampleJson}
              </pre>
            </details>
          </div>
        </div>

        {/* Create Test From Bank */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" /> Create Test from Question Bank
          </h2>

          <form onSubmit={onCreateSpec} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Certification ID</label>
                <input
                  type="text"
                  value={form.cert_id}
                  onChange={(e) => setForm({ ...form, cert_id: e.target.value })}
                  placeholder="e.g., 66ff0b..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              
              {/* Question Distribution */}
              <div className="md:col-span-2 bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Shuffle className="w-4 h-4" /> Question Distribution
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">MCQ Questions</label>
                    <input
                      type="number"
                      min={0}
                      value={form.mcq_count}
                      onChange={(e) => {
                        const mcq = parseInt(e.target.value) || 0
                        setForm({ 
                          ...form, 
                          mcq_count: mcq,
                          question_count: mcq + form.code_count
                        })
                      }}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">Multiple choice questions</p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Coding Questions</label>
                    <input
                      type="number"
                      min={0}
                      value={form.code_count}
                      onChange={(e) => {
                        const code = parseInt(e.target.value) || 0
                        setForm({ 
                          ...form, 
                          code_count: code,
                          question_count: form.mcq_count + code
                        })
                      }}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">Programming problems</p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Total Per Test</label>
                    <input
                      type="number"
                      value={form.question_count}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400 mt-1">Auto-calculated total</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> Duration (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2 flex items-center gap-2"><Shield className="w-4 h-4" /> Passing Score (%)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.pass_percentage}
                  onChange={(e) => setForm({ ...form, pass_percentage: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                />
              </div>
            </div>

            {/* Test Settings */}
            <div>
              <h3 className="text-slate-300 mb-3 flex items-center gap-2 font-semibold">
                <Settings className="w-4 h-4" /> Test Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white transition">
                  <input
                    type="checkbox"
                    checked={form.randomize}
                    onChange={(e) => setForm({ ...form, randomize: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Shuffle className="w-4 h-4" /> Randomize Questions
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white transition">
                  <input
                    type="checkbox"
                    checked={form.enable_proctoring}
                    onChange={(e) => setForm({ ...form, enable_proctoring: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Shield className="w-4 h-4" /> Enable Proctoring
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white transition">
                  <input
                    type="checkbox"
                    checked={form.enable_fullscreen}
                    onChange={(e) => setForm({ ...form, enable_fullscreen: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Settings className="w-4 h-4" /> Force Fullscreen
                </label>
              </div>
            </div>

            {/* Programming Language Settings */}
            <div>
              <h3 className="text-slate-300 mb-3 flex items-center gap-2 font-semibold">
                <Code className="w-4 h-4" /> Programming Language Options
              </h3>
              <div className="space-y-4 bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white transition">
                  <input
                    type="checkbox"
                    checked={form.lock_language}
                    onChange={(e) => setForm({ ...form, lock_language: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Code className="w-4 h-4" /> Lock Programming Language
                  <span className="text-xs text-slate-400">(Students cannot change language during test)</span>
                </label>
                
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Allowed Programming Languages</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {['python', 'javascript', 'cpp', 'c', 'java', 'csharp', 'ruby', 'go', 'rust', 'php'].map(lang => (
                      <label key={lang} className="flex items-center gap-2 text-slate-300 cursor-pointer hover:text-white transition bg-slate-800/50 p-2 rounded border border-slate-600 hover:border-slate-500">
                        <input
                          type="checkbox"
                          checked={form.allowed_languages.includes(lang)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, allowed_languages: [...form.allowed_languages, lang] })
                            } else {
                              setForm({ ...form, allowed_languages: form.allowed_languages.filter(l => l !== lang) })
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm capitalize">{lang === 'cpp' ? 'C++' : lang === 'csharp' ? 'C#' : lang}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Select which programming languages students can use for coding questions</p>
                </div>
              </div>
            </div>

            {/* Restrictions */}
            <div>
              <h3 className="text-slate-300 mb-3 flex items-center gap-2 font-semibold">
                <Shield className="w-4 h-4" /> Strict Test Restrictions (Platform Security)
              </h3>
              <p className="text-sm text-slate-400 mb-4">Enable restrictions to create a secure, proctored test environment. Violations are tracked and auto-fail after 3 attempts.</p>
              <div className="space-y-4">
                <div className="bg-red-900/10 p-4 rounded-lg border border-red-800/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-start gap-3 text-slate-300 cursor-pointer hover:text-white transition">
                      <input
                        type="checkbox"
                        checked={form.restrict_copy_paste}
                        onChange={(e) => setForm({ ...form, restrict_copy_paste: e.target.checked })}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <Copy className="w-4 h-4" /> Block Copy/Paste
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Prevents Ctrl+C, Ctrl+V, Ctrl+X</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 text-slate-300 cursor-pointer hover:text-white transition">
                      <input
                        type="checkbox"
                        checked={form.restrict_tab_switching}
                        onChange={(e) => setForm({ ...form, restrict_tab_switching: e.target.checked })}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <Shield className="w-4 h-4" /> Block Tab Switching
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Tracks when student leaves browser tab</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 text-slate-300 cursor-pointer hover:text-white transition">
                      <input
                        type="checkbox"
                        checked={form.restrict_right_click}
                        onChange={(e) => setForm({ ...form, restrict_right_click: e.target.checked })}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <Shield className="w-4 h-4" /> Block Right-Click
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Disables context menu and inspect</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 text-slate-300 cursor-pointer hover:text-white transition">
                      <input
                        type="checkbox"
                        checked={form.enable_proctoring}
                        onChange={(e) => setForm({ ...form, enable_proctoring: e.target.checked })}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <Eye className="w-4 h-4" /> Enable Webcam Monitoring
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Shows live webcam feed during test</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 text-slate-300 cursor-pointer hover:text-white transition">
                      <input
                        type="checkbox"
                        checked={form.enable_fullscreen}
                        onChange={(e) => setForm({ ...form, enable_fullscreen: e.target.checked })}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <Settings className="w-4 h-4" /> Force Fullscreen Mode
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Automatically enters fullscreen on start</div>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="bg-yellow-900/10 p-3 rounded border border-yellow-800/50">
                  <div className="flex items-start gap-2 text-yellow-400 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Violation Policy:</strong> Students receive warnings for violations. After 3 violations, the test is automatically submitted and marked for review.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prerequisite Course */}
            <div>
              <label className="block text-sm text-slate-300 mb-2 font-semibold">Prerequisite Course (Optional)</label>
              <select
                value={form.prerequisite_course_id}
                onChange={(e) => setForm({ ...form, prerequisite_course_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                <option value="">None</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Select Question Banks */}
            <div>
              <h3 className="text-slate-300 mb-2 flex items-center gap-2 font-semibold">
                <ListChecks className="w-4 h-4" /> Select Question Banks
              </h3>
              <p className="text-sm text-slate-400 mb-3">
                Select one or more question banks to create your certification test. Questions will be randomly selected from the chosen banks.
              </p>
              {banks.length === 0 ? (
                <div className="text-center py-8 bg-slate-700/30 rounded-lg border border-slate-600">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400">No question banks available</p>
                  <p className="text-slate-500 text-sm mt-1">Upload question banks above to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {banks.map((b) => (
                    <label 
                      key={b.id || b.file_name} 
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        form.bank_ids.includes(b.id || b.file_name) 
                          ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20' 
                          : 'border-slate-600 bg-slate-700 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={form.bank_ids.includes(b.id || b.file_name)}
                          onChange={() => toggleBank(b.id || b.file_name)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <span className="text-white font-medium">{b.display_name || b.file_name}</span>
                          </div>
                          <div className="text-slate-400 text-sm">
                            {b.question_count || 0} questions
                          </div>
                          {b.topic_name && (
                            <div className="mt-1 text-xs text-slate-500">
                              Topic: {b.topic_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {form.bank_ids.length > 0 && (
                <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/50 rounded text-sm text-blue-300">
                  ✓ {form.bank_ids.length} question bank(s) selected • Total questions available: {
                    banks
                      .filter(b => form.bank_ids.includes(b.id || b.file_name))
                      .reduce((sum, b) => sum + (b.question_count || 0), 0)
                  }
                </div>
              )}
            </div>

            {/* Test Configuration Summary */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-700/50 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" /> Test Configuration Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm mb-4">
                <div className="bg-slate-800/50 p-3 rounded">
                  <div className="text-slate-400 mb-1">MCQ</div>
                  <div className="text-white font-semibold">{form.mcq_count}</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded">
                  <div className="text-slate-400 mb-1">Coding</div>
                  <div className="text-white font-semibold">{form.code_count}</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded">
                  <div className="text-slate-400 mb-1">Duration</div>
                  <div className="text-white font-semibold">{form.duration_minutes} min</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded">
                  <div className="text-slate-400 mb-1">Pass Mark</div>
                  <div className="text-white font-semibold">{form.pass_percentage}%</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded">
                  <div className="text-slate-400 mb-1">Total Pool</div>
                  <div className="text-white font-semibold">{form.total_questions}</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded">
                  <div className="text-slate-400 mb-1">Question Banks</div>
                  <div className="text-white font-semibold">{form.bank_ids.length}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.restrict_copy_paste && (
                  <span className="px-2 py-1 bg-red-900/30 border border-red-700 text-red-300 text-xs rounded">🚫 Copy/Paste Blocked</span>
                )}
                {form.restrict_tab_switching && (
                  <span className="px-2 py-1 bg-red-900/30 border border-red-700 text-red-300 text-xs rounded">🚫 Tab Switch Blocked</span>
                )}
                {form.restrict_right_click && (
                  <span className="px-2 py-1 bg-red-900/30 border border-red-700 text-red-300 text-xs rounded">🚫 Right-Click Blocked</span>
                )}
                {form.enable_proctoring && (
                  <span className="px-2 py-1 bg-green-900/30 border border-green-700 text-green-300 text-xs rounded">📹 Proctoring Enabled</span>
                )}
                {form.enable_fullscreen && (
                  <span className="px-2 py-1 bg-blue-900/30 border border-blue-700 text-blue-300 text-xs rounded">⛶ Fullscreen Required</span>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg flex items-center gap-2 shadow-lg font-semibold text-lg">
                <Save className="w-5 h-5" /> Save Test Specification
              </button>
            </div>
          </form>
        </div>

        {/* Existing Specs */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Existing Test Specs</h2>
          <div className="space-y-2">
            {specs.map((s) => (
              <div key={s._id || `${s.cert_id}-${s.difficulty}`} className="p-3 bg-slate-700 rounded border border-slate-600">
                <div className="text-white font-medium">{s.cert_id} - {s.difficulty}</div>
                <div className="text-slate-400 text-sm">
                  {s.question_count} Q/Test • Pool: {s.total_questions || s.question_count} • {s.duration_minutes} min • Pass {s.pass_percentage}% • Randomize: {s.randomize ? 'Yes' : 'No'} • Restrict: {s.restrict_copy_paste ? 'Yes' : 'No'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  )
}

export default CertificationTestManager
