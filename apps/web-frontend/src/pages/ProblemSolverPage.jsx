import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Code, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  ArrowLeft, 
  Loader2,
  AlertCircle,
  Trophy,
  Star
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { problemsAPI } from '../services/api';

const ProblemSolverPage = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Language options with their Judge0 IDs
  const languageOptions = [
    { id: 71, name: 'Python 3', value: 'python' },
    { id: 63, name: 'JavaScript (Node.js)', value: 'javascript' },
    { id: 54, name: 'C++', value: 'cpp' },
    { id: 50, name: 'C', value: 'c' },
    { id: 62, name: 'Java', value: 'java' },
  ];

  useEffect(() => {
    fetchProblem();
  }, [problemId]);

  const fetchProblem = async () => {
    try {
      const response = await problemsAPI.getProblem(problemId);
      const problemData = response.data;
      // Normalize backend shape to the frontend's expected fields for backward compatibility
      const normalized = {
        ...problemData,
        // some endpoints use `content` while older frontends expect `description`
        description: problemData.content || problemData.description || problemData.prompt || '',
        // public test cases may be returned under `public_test_cases`
        test_cases: problemData.public_test_cases || problemData.test_cases || [],
        // starter code may be named differently
        starter_code: problemData.starter_code || problemData.starterCode || problemData.starter || ''
      };
      setProblem(normalized);
      setCode(normalized.starter_code || '');
    } catch (err) {
      setError('Failed to load problem');
      console.error('Error fetching problem:', err);
    } finally {
      setLoading(false);
    }
  };

  const normalizeResult = (data) => {
    return {
      overall_passed: data?.overall_passed ?? data?.all_tests_passed ?? false,
      results: data?.results ?? data?.test_results ?? [],
      xp_reward: data?.xp_reward ?? 0,
      compile_output: data?.compile_output ?? null,
      runtime_error: data?.runtime_error ?? null,
    };
  };

  const handleRunCode = async () => {
    if (!code.trim()) return;
    
    setIsRunning(true);
    setRunResult(null);
    
    try {
      const selectedLang = languageOptions.find(lang => lang.value === selectedLanguage);
      const response = await problemsAPI.runCode(problemId, {
        code: code,
        language_id: selectedLang.id
      });
      
      const result = normalizeResult(response.data);
      setRunResult(result);
    } catch (err) {
      console.error('Error running code:', err);
      setRunResult({
        overall_passed: false,
        results: [{
          test_case_number: 1,
          passed: false,
          input: '',
          output: '',
          expected_output: '',
          error: 'Failed to run code'
        }]
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!code.trim()) return;
    
    setIsSubmitting(true);
    setSubmissionResult(null);
    
    try {
      const selectedLang = languageOptions.find(lang => lang.value === selectedLanguage);
      const response = await problemsAPI.submitSolution(problemId, {
        code: code,
        language_id: selectedLang.id
      });
      
      const result = normalizeResult(response.data);
      setSubmissionResult(result);
    } catch (err) {
      console.error('Error submitting solution:', err);
      setSubmissionResult({
        overall_passed: false,
        results: [{
          test_case_number: 1,
          passed: false,
          input: '',
          output: '',
          expected_output: '',
          error: 'Failed to submit solution'
        }]
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-400 bg-green-900/20 border-green-500/50';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/50';
      case 'hard':
        return 'text-red-400 bg-red-900/20 border-red-500/50';
      default:
        return 'text-slate-400 bg-slate-900/20 border-slate-500/50';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'hard':
        return '🔴';
      default:
        return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading problem...</p>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-red-400 text-xl mb-6">{error || 'Problem not found'}</p>
          <button
            onClick={() => navigate('/practice')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
          >
            Back to Practice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/practice')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Practice
            </button>
            <div className="h-6 w-px bg-slate-600"></div>
            <h1 className="text-xl font-semibold text-white">{problem.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(problem.difficulty)}`}>
              {getDifficultyIcon(problem.difficulty)} {problem.difficulty}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleRunCode}
              disabled={isRunning || !code.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white flex items-center gap-2 transition-colors"
            >
              {isRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run Code
            </button>
            <button
              onClick={handleSubmitSolution}
              disabled={isSubmitting || !code.trim()}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Submit Solution
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex h-[calc(100vh-80px)]">
        {/* Problem Description */}
        <div className="w-1/2 border-r border-slate-700 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">Problem Description</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {problem.description}
                </p>
              </div>
            </div>

            {/* Test Cases */}
            {problem.test_cases && problem.test_cases.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Test Cases</h3>
                <div className="space-y-4">
                  {problem.test_cases.map((testCase, index) => (
                    <div key={index} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <div className="text-sm text-slate-400 mb-2">Test Case {index + 1}</div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-slate-300 font-medium">Input:</span>
                          <div className="bg-slate-900 rounded-lg p-2 mt-1 font-mono text-sm text-white">
                            {testCase.input}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-300 font-medium">Expected Output:</span>
                          <div className="bg-slate-900 rounded-lg p-2 mt-1 font-mono text-sm text-green-400">
                            {testCase.expected_output}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {problem.tags && problem.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {problem.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code Editor */}
        <div className="w-1/2 flex flex-col">
          {/* Language Selection */}
          <div className="p-4 border-b border-slate-700 bg-slate-800">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-slate-300">Language:</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languageOptions.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="">
            <div className="border-b border-slate-700">
              <Editor
                height="500px"
                language={selectedLanguage}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  fontSize: 16,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  folding: true,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 0,
                  renderLineHighlight: 'line',
                  cursorStyle: 'line',
                  selectOnLineNumbers: true,
                  roundedSelection: false,
                  readOnly: false,
                  contextmenu: true,
                  mouseWheelZoom: true,
                  smoothScrolling: true,
                  cursorBlinking: 'blink',
                  cursorSmoothCaretAnimation: true,
                }}
              />
            </div>
          </div>

          {/* Results Panel */}
          {(
            isRunning || isSubmitting || runResult || submissionResult
          ) && (
            <div className="h-80 border-t border-slate-700 overflow-y-auto">
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  {submissionResult || isSubmitting ? (
                    <>
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <h3 className="text-lg font-semibold text-white">Submission Results</h3>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-semibold text-white">Run Results</h3>
                    </>
                  )}
                </div>

                {/* Loading state */}
                {(isSubmitting || isRunning) && !(submissionResult || runResult) && (
                  <div className="mb-4 p-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    <span className="text-slate-200">Running tests...</span>
                  </div>
                )}

                {/* Accepted / Wrong Answer banner */}
                {(submissionResult || runResult) && (
                  <div
                    className={`mb-4 p-4 rounded-lg border flex items-center justify-between ${
                      (submissionResult || runResult)?.overall_passed
                        ? 'bg-green-900/30 border-green-500/50'
                        : 'bg-red-900/30 border-red-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {(submissionResult || runResult)?.overall_passed ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span
                        className={`font-semibold ${
                          (submissionResult || runResult)?.overall_passed ? 'text-green-300' : 'text-red-300'
                        }`}
                      >
                        {(submissionResult || runResult)?.overall_passed ? 'Accepted' : 'Wrong Answer'}
                      </span>
                    </div>
                    <div className="text-slate-200 text-sm">
                      {(submissionResult || runResult)?.results?.filter(r => r.passed).length || 0}
                      {' / '}
                      {(submissionResult || runResult)?.results?.length || 0} tests passed
                      {submissionResult?.xp_reward > 0 && (
                        <span className="text-yellow-400 ml-3">+{submissionResult.xp_reward} XP</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Compile / Runtime errors */}
                {(submissionResult?.compile_output || submissionResult?.runtime_error || runResult?.compile_output || runResult?.runtime_error) && (
                  <div className="mb-4 p-4 rounded-lg bg-slate-800 border border-slate-700">
                    {submissionResult?.compile_output || runResult?.compile_output ? (
                      <div className="mb-3">
                        <div className="text-slate-300 font-medium mb-1">Compilation Output</div>
                        <pre className="bg-slate-900 rounded p-3 text-sm text-red-300 whitespace-pre-wrap">{submissionResult?.compile_output || runResult?.compile_output}</pre>
                      </div>
                    ) : null}
                    {submissionResult?.runtime_error || runResult?.runtime_error ? (
                      <div>
                        <div className="text-slate-300 font-medium mb-1">Runtime Error</div>
                        <pre className="bg-slate-900 rounded p-3 text-sm text-red-300 whitespace-pre-wrap">{submissionResult?.runtime_error || runResult?.runtime_error}</pre>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Per-test case details */}
                <div className="space-y-3">
                  {(submissionResult || runResult)?.results?.map((test, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        test.passed
                          ? 'bg-green-900/20 border-green-500/50'
                          : 'bg-red-900/20 border-red-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {test.passed ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className="font-medium text-white">
                          Test {test.test_case_number ?? index + 1}
                        </span>
                        <span className={`text-sm ${
                          test.passed ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {test.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        {!test.passed && (
                          <div>
                            <span className="text-slate-400">Input:</span>
                            <div className="bg-slate-900 rounded p-2 mt-1 font-mono text-white">
                              {test.input ?? '—'}
                            </div>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-400">Expected Output:</span>
                          <div className="bg-slate-900 rounded p-2 mt-1 font-mono text-green-400">
                            {test.expected_output || 'No expected output'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">Your Output:</span>
                          <div className="bg-slate-900 rounded p-2 mt-1 font-mono text-white">
                            {test.output || 'No output'}
                          </div>
                        </div>
                        {test.error && (
                          <div>
                            <span className="text-slate-400">Error:</span>
                            <div className="bg-slate-900 rounded p-2 mt-1 font-mono text-red-400">
                              {test.error}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemSolverPage;
