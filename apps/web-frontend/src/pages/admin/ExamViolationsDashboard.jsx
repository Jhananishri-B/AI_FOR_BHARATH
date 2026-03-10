import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Eye, AlertTriangle, Shield, 
  Users, CheckCircle, AlertCircle, XCircle, Volume2, Camera,
  Clock, Calendar, TrendingUp, FileText, Flag, CheckSquare,
  XSquare, Edit3, ChevronDown, ChevronUp, X
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ExamViolationsDashboard = () => {
  // State Management
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [examFilter, setExamFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [adminAction, setAdminAction] = useState({ decision: '', notes: '' });
  const [exams, setExams] = useState([]);

  // Fetch Data
  useEffect(() => {
    fetchCandidates();
    fetchExams();
  }, []);

  // Filter candidates when search/filter changes
  useEffect(() => {
    filterCandidates();
  }, [searchTerm, statusFilter, examFilter, dateRange, candidates]);

  const fetchCandidates = async () => {
    try {
      // Fetch all test attempts
      const response = await fetch(`${API_BASE_URL}/api/cert-tests/attempts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const attempts = await response.json();
      
      // Process attempts into candidate format with violation scoring
      const processed = (attempts || []).map((attempt) => {
        // Calculate violations from the attempt data
        const violations = attempt.violations || {};
        const totalViolations = Object.values(violations).reduce((sum, count) => sum + (count || 0), 0);
        const violationScore = calculateViolationScore(violations);
        const behaviorScore = 100 - (totalViolations * 2); // Simple behavior score calculation
        
        // Get pass percentage from test settings (default to 70 if not specified)
        const settings = attempt.settings || {};
        const passPercentage = settings.pass_percentage || 70;
        const testScore = attempt.score || 0;
        const passed = testScore >= passPercentage;
        
        return {
          attempt_id: attempt.attempt_id,
          user_name: attempt.user_name || 'Unknown User',
          user_id: attempt.user_id,
          certification_title: `${attempt.topic_id} - ${attempt.difficulty}`,
          status: attempt.status,
          behavior_score: Math.max(0, behaviorScore),
          final_score: attempt.score,
          test_score: testScore,
          pass_percentage: passPercentage,
          passed: passed,
          violation_count: totalViolations,
          start_time: attempt.started_at || attempt.created_at,
          end_time: attempt.finished_at || attempt.completed_at,
          violations: violations,
          totalViolations: totalViolations,
          violationScore: violationScore,
          category: categorizeCandidate(totalViolations, behaviorScore),
          duration: calculateDuration(attempt.started_at || attempt.created_at, attempt.finished_at || attempt.completed_at),
          proctoring_events: attempt.proctoring_events || [],
          settings: settings
        };
      });
      
      setCandidates(processed);
      setFilteredCandidates(processed);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/certifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setExams(data.certifications || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const calculateViolationScore = (violations) => {
    const weights = {
      'looking_away': 1,
      'multiple_faces': 3,
      'no_face': 2,
      'phone_detected': 4,
      'noise_detected': 2,
      'tab_switch': 3,
      'copy_paste': 2
    };
    
    let score = 0;
    Object.entries(violations).forEach(([type, count]) => {
      score += (weights[type] || 1) * count;
    });
    
    return score;
  };

  const categorizeCandidate = (violations, behaviorScore) => {
    const score = 100 - behaviorScore;
    if (score < 5) return { label: 'Safe', color: 'green', icon: CheckCircle };
    if (score < 10) return { label: 'Warning', color: 'yellow', icon: AlertCircle };
    return { label: 'Violation', color: 'red', icon: XCircle };
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const diff = new Date(end) - new Date(start);
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min`;
  };

  const filterCandidates = () => {
    let filtered = [...candidates];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.attempt_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.category.label.toLowerCase() === statusFilter);
    }

    // Exam filter
    if (examFilter !== 'all') {
      filtered = filtered.filter(c => c.certification_title === examFilter);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(c => new Date(c.start_time) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(c => new Date(c.start_time) <= new Date(dateRange.end));
    }

    setFilteredCandidates(filtered);
  };

  const getSummaryStats = () => {
    const total = filteredCandidates.length;
    const safe = filteredCandidates.filter(c => c.category.label === 'Safe').length;
    const warnings = filteredCandidates.filter(c => c.category.label === 'Warning').length;
    const violations = filteredCandidates.filter(c => c.category.label === 'Violation').length;
    const noiseEvents = filteredCandidates.reduce((sum, c) => sum + (c.violations.noise_detected || 0), 0);
    const cameraEvents = filteredCandidates.reduce((sum, c) => 
      sum + (c.violations.looking_away || 0) + (c.violations.multiple_faces || 0) + (c.violations.no_face || 0), 0
    );

    return { total, safe, warnings, violations, noiseEvents, cameraEvents };
  };

  const viewCandidateDetails = async (candidate) => {
    try {
      // Fetch full attempt details including questions and answers
      const response = await fetch(`${API_BASE_URL}/api/cert-tests/attempts/${candidate.attempt_id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const attemptDetails = await response.json();

      setSelectedCandidate({
        ...candidate,
        ...attemptDetails,
        detailedLogs: attemptDetails.proctoring_events || [],
        violations: attemptDetails.violations || candidate.violations || {},
        questions: attemptDetails.questions || [],
        answers: attemptDetails.answers || []
      });
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching candidate details:', error);
      // Fallback to candidate data if fetch fails
      setSelectedCandidate({
        ...candidate,
        detailedLogs: candidate.proctoring_events || [],
        violations: candidate.violations || {}
      });
      setShowModal(true);
    }
  };

  const handleAdminDecision = async () => {
    if (!adminAction.decision) {
      alert('Please select a decision');
      return;
    }

    try {
      const scoreMap = {
        'safe': 100,
        'warning': 90,
        'violation': 70
      };

      await fetch(`${API_BASE_URL}/api/admin/proctoring/attempts/${selectedCandidate.attempt_id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          behavior_score_override: scoreMap[adminAction.decision],
          admin_notes: adminAction.notes,
          reviewed_by: 'admin'
        })
      });

      alert('Decision saved successfully!');
      setShowModal(false);
      setAdminAction({ decision: '', notes: '' });
      fetchCandidates();
    } catch (error) {
      console.error('Error saving decision:', error);
      alert('Failed to save decision');
    }
  };

  const exportReport = () => {
    const csv = [
      ['Candidate', 'Exam', 'Duration', 'Violations', 'Test Score (%)', 'Category', 'Date'].join(','),
      ...filteredCandidates.map(c => [
        c.user_name,
        c.certification_title,
        c.duration,
        c.totalViolations,
        c.test_score !== undefined ? `${c.test_score}%` : 'N/A',
        c.category.label,
        new Date(c.start_time).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-violations-${new Date().toISOString()}.csv`;
    a.click();
  };

  const stats = getSummaryStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-white text-xl">Loading violations dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-400" />
            Exam Violations Dashboard
          </h1>
          <p className="text-slate-400 mt-1">Monitor and review test proctoring violations</p>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, test ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Exam Filter */}
          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Exams</option>
            {exams.map(exam => (
              <option key={exam._id} value={exam.title}>{exam.title}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="safe">Safe</option>
            <option value="warning">Warning</option>
            <option value="violation">Violation</option>
          </select>

          {/* Date Range */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <SummaryCard
          title="Total Candidates"
          value={stats.total}
          icon={Users}
          color="blue"
          onClick={() => setStatusFilter('all')}
        />
        <SummaryCard
          title="Safe Users"
          value={stats.safe}
          icon={CheckCircle}
          color="green"
          onClick={() => setStatusFilter('safe')}
        />
        <SummaryCard
          title="Warnings"
          value={stats.warnings}
          icon={AlertCircle}
          color="yellow"
          onClick={() => setStatusFilter('warning')}
        />
        <SummaryCard
          title="Violations"
          value={stats.violations}
          icon={XCircle}
          color="red"
          onClick={() => setStatusFilter('violation')}
        />
        <SummaryCard
          title="Noise Events"
          value={stats.noiseEvents}
          icon={Volume2}
          color="orange"
        />
        <SummaryCard
          title="Camera Events"
          value={stats.cameraEvents}
          icon={Camera}
          color="purple"
        />
      </div>

      {/* Candidates Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Exam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Violations</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase" title="Exam Performance Score (% correct)">
                  Test Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    No candidates found matching your filters
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr key={candidate.attempt_id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white font-medium">{candidate.user_name}</div>
                      <div className="text-slate-400 text-xs">{candidate.user_id}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{candidate.certification_title}</td>
                    <td className="px-6 py-4 text-slate-300">{candidate.duration}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        candidate.totalViolations > 5 ? 'bg-red-500/20 text-red-400' :
                        candidate.totalViolations > 2 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {candidate.totalViolations}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${
                          candidate.passed ? 'text-green-400' :
                          (candidate.test_score || 0) >= (candidate.pass_percentage * 0.8) ? 'text-yellow-400' :
                          'text-red-400'
                        }`} title={`Exam Performance Score (Pass: ${candidate.pass_percentage}%)`}>
                          {candidate.test_score !== undefined ? `${candidate.test_score}%` : 'N/A'}
                        </span>
                        <span className="text-xs text-slate-400" title={`Required: ${candidate.pass_percentage}% • ${candidate.passed ? 'PASSED ✓' : 'FAILED ✗'}`}>
                          📝
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <CategoryBadge category={candidate.category} />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => viewCandidateDetails(candidate)}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Details Modal */}
      {showModal && selectedCandidate && (
        <CandidateDetailsModal
          candidate={selectedCandidate}
          onClose={() => {
            setShowModal(false);
            setAdminAction({ decision: '', notes: '' });
          }}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          adminAction={adminAction}
          setAdminAction={setAdminAction}
          onSubmitDecision={handleAdminDecision}
        />
      )}
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ title, value, icon: Icon, color, onClick }) => {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div
      onClick={onClick}
      className={`${colors[color]} border rounded-xl p-4 transition-all ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-6 h-6" />
        <div className="text-2xl font-bold text-white">{value}</div>
      </div>
      <div className="text-xs font-medium opacity-90">{title}</div>
    </div>
  );
};

// Category Badge Component
const CategoryBadge = ({ category }) => {
  const colors = {
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/20 text-red-400',
  };

  const Icon = category.icon;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${colors[category.color]}`}>
      <Icon className="w-3 h-3" />
      {category.label}
    </span>
  );
};

// Candidate Details Modal Component
const CandidateDetailsModal = ({ candidate, onClose, activeTab, setActiveTab, adminAction, setAdminAction, onSubmitDecision }) => {
  const violationTypes = {
    'looking_away': { label: 'Looking Away', color: 'blue', weight: 1 },
    'multiple_faces': { label: 'Multiple Faces', color: 'purple', weight: 3 },
    'no_face': { label: 'No Face', color: 'yellow', weight: 2 },
    'phone_detected': { label: 'Phone Detected', color: 'red', weight: 4 },
    'noise_detected': { label: 'Noise Detected', color: 'orange', weight: 2 },
    'tab_switch': { label: 'Tab Switch', color: 'indigo', weight: 3 },
    'copy_paste': { label: 'Copy/Paste', color: 'pink', weight: 2 },
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              {candidate.user_name}
              <CategoryBadge category={candidate.category} />
            </h2>
            <div className="text-slate-400 mt-1 flex items-center gap-4">
              <span>{candidate.certification_title}</span>
              <span>•</span>
              <span>{candidate.duration}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="text-slate-500">Test Score:</span>
                <span className={`font-semibold ${
                  candidate.passed ? 'text-green-400' :
                  (candidate.test_score || 0) >= (candidate.pass_percentage * 0.8) ? 'text-yellow-400' :
                  'text-red-400'
                }`} title={`Pass Threshold: ${candidate.pass_percentage}%`}>
                  {candidate.test_score !== undefined ? `${candidate.test_score}%` : 'N/A'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  candidate.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {candidate.passed ? 'PASSED' : 'FAILED'}
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 px-6 overflow-x-auto">
          <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')}>
            <FileText className="w-4 h-4" />
            Test Details
          </TabButton>
          <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')}>
            <TrendingUp className="w-4 h-4" />
            Timeline View
          </TabButton>
          <TabButton active={activeTab === 'events'} onClick={() => setActiveTab('events')}>
            <FileText className="w-4 h-4" />
            Event Log
          </TabButton>
          <TabButton active={activeTab === 'action'} onClick={() => setActiveTab('action')}>
            <Flag className="w-4 h-4" />
            Admin Action
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <TestDetailsView candidate={candidate} />
          )}
          {activeTab === 'timeline' && (
            <TimelineView logs={candidate.detailedLogs} violations={candidate.violations} />
          )}
          {activeTab === 'events' && (
            <EventLogView logs={candidate.detailedLogs} violationTypes={violationTypes} />
          )}
          {activeTab === 'action' && (
            <AdminActionPanel
              adminAction={adminAction}
              setAdminAction={setAdminAction}
              onSubmit={onSubmitDecision}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Tab Button Component
const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
      active
        ? 'border-blue-500 text-blue-400'
        : 'border-transparent text-slate-400 hover:text-slate-300'
    }`}
  >
    {children}
  </button>
);

// Test Details View Component
const TestDetailsView = ({ candidate }) => {
  const startTime = candidate.start_time ? new Date(candidate.start_time) : null;
  const endTime = candidate.end_time ? new Date(candidate.end_time) : null;
  const durationMinutes = startTime && endTime ? Math.round((endTime - startTime) / 1000 / 60) : 0;
  
  const score = candidate.score || 0;
  
  // Use result object if available (for MCQ/Code breakdown), otherwise fall back to legacy fields
  const resultData = candidate.result || {};
  const totalQuestions = resultData.total_questions || candidate.total_questions || candidate.questions?.length || 0;
  const correctAnswers = resultData.passed_questions || candidate.correct_answers || 0;
  
  // Calculate wrong and unanswered from MCQ/Code breakdown if available
  const mcqCorrect = resultData.mcq_correct || 0;
  const mcqTotal = resultData.mcq_total || 0;
  const codeCorrect = resultData.code_correct || 0;
  const codeTotal = resultData.code_total || 0;
  
  const mcqWrong = mcqTotal - mcqCorrect;
  const codeWrong = codeTotal - codeCorrect;
  const wrongAnswers = mcqWrong + codeWrong;
  const unanswered = totalQuestions - correctAnswers - wrongAnswers;

  return (
    <div className="space-y-6">
      {/* Test Overview */}
      <div>
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          Test Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Test Status</div>
            <div className={`font-bold text-xl ${
              candidate.passed ? 'text-green-400' : 'text-red-400'
            }`}>
              {candidate.passed ? '✓ PASSED' : '✗ FAILED'}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1 flex items-center gap-1">
              Test Score
              <span className="text-xs" title="Exam performance - % of questions answered correctly">📝</span>
            </div>
            <div className={`font-bold text-xl ${
              candidate.passed ? 'text-green-400' :
              score >= (candidate.pass_percentage * 0.8) ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {score}%
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Pass Threshold</div>
            <div className="text-blue-400 font-bold text-xl">{candidate.pass_percentage}%</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Duration</div>
            <div className="text-white font-bold text-xl">{durationMinutes} min</div>
          </div>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div>
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Performance Breakdown
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/50 rounded-lg p-4">
            <div className="text-blue-300 text-sm mb-1">Total Questions</div>
            <div className="text-white font-bold text-2xl">{totalQuestions}</div>
          </div>
          <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-700/50 rounded-lg p-4">
            <div className="text-green-300 text-sm mb-1">Correct</div>
            <div className="text-white font-bold text-2xl">{correctAnswers}</div>
            <div className="text-green-400 text-xs mt-1">
              {totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-700/50 rounded-lg p-4">
            <div className="text-red-300 text-sm mb-1">Incorrect</div>
            <div className="text-white font-bold text-2xl">{wrongAnswers}</div>
            <div className="text-red-400 text-xs mt-1">
              {totalQuestions > 0 ? ((wrongAnswers / totalQuestions) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 border border-orange-700/50 rounded-lg p-4">
            <div className="text-orange-300 text-sm mb-1">Unanswered</div>
            <div className="text-white font-bold text-2xl">{unanswered}</div>
            <div className="text-orange-400 text-xs mt-1">
              {totalQuestions > 0 ? ((unanswered / totalQuestions) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* MCQ and Code Breakdown (if available) */}
      {(mcqTotal > 0 || codeTotal > 0) && (
        <div>
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Score Breakdown by Question Type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mcqTotal > 0 && (
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/50 rounded-lg p-4">
                <div className="text-purple-300 text-sm mb-2">Multiple Choice Questions</div>
                <div className="text-white font-bold text-3xl mb-1">{mcqCorrect}/{mcqTotal}</div>
                <div className="text-purple-400 text-sm">
                  {mcqTotal > 0 ? ((mcqCorrect / mcqTotal) * 100).toFixed(1) : 0}% correct
                </div>
              </div>
            )}
            {codeTotal > 0 && (
              <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border border-cyan-700/50 rounded-lg p-4">
                <div className="text-cyan-300 text-sm mb-2">Coding Questions</div>
                <div className="text-white font-bold text-3xl mb-1">{codeCorrect}/{codeTotal}</div>
                <div className="text-cyan-400 text-sm">
                  {codeTotal > 0 ? ((codeCorrect / codeTotal) * 100).toFixed(1) : 0}% correct
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Timeline */}
      <div>
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-400" />
          Test Timeline
        </h3>
        <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Started At:</span>
            <span className="text-white font-medium">
              {startTime ? startTime.toLocaleString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Finished At:</span>
            <span className="text-white font-medium">
              {endTime ? endTime.toLocaleString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Total Duration:</span>
            <span className="text-white font-medium">{durationMinutes} minutes</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Avg. Time per Question:</span>
            <span className="text-white font-medium">
              {totalQuestions > 0 ? Math.round(durationMinutes / totalQuestions) : 0} min
            </span>
          </div>
        </div>
      </div>

      {/* Proctoring Summary */}
      <div>
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-red-400" />
          Proctoring Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Tab Switches</span>
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-white font-bold text-xl">
              {candidate.violations?.tab_switch || 0}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Face Not Detected</span>
              <Camera className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-white font-bold text-xl">
              {candidate.violations?.no_face || 0}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Multiple Faces</span>
              <Users className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-white font-bold text-xl">
              {candidate.violations?.multiple_faces || 0}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Looking Away</span>
              <Eye className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-white font-bold text-xl">
              {candidate.violations?.looking_away || 0}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Noise Detected</span>
              <Volume2 className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-white font-bold text-xl">
              {candidate.violations?.noise_detected || 0}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Violations</span>
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-white font-bold text-xl">
              {candidate.totalViolations || 0}
            </div>
          </div>
        </div>
        
        {/* Violation Severity Score */}
        <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-700/50 rounded-lg p-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-orange-300 text-sm mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Violation Severity Score
                <span className="text-xs text-slate-400" title="Weighted penalty based on violation types and frequency">ℹ️</span>
              </div>
              <div className="text-slate-400 text-xs">
                Weighted penalty score (higher = more serious violations)
              </div>
            </div>
            <div className={`font-bold text-3xl ${
              candidate.violationScore < 5 ? 'text-green-400' :
              candidate.violationScore < 10 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {candidate.violationScore}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Review Status */}
      {candidate.admin_review && (
        <div>
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Admin Review
          </h3>
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Decision:</span>
              <span className={`font-medium px-3 py-1 rounded-full text-sm ${
                candidate.admin_review.decision === 'safe' ? 'bg-green-500/20 text-green-400' :
                candidate.admin_review.decision === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {candidate.admin_review.decision?.toUpperCase() || 'PENDING'}
              </span>
            </div>
            {candidate.admin_review.notes && (
              <div>
                <span className="text-slate-400 block mb-2">Notes:</span>
                <p className="text-white bg-slate-800 rounded p-3">{candidate.admin_review.notes}</p>
              </div>
            )}
            {candidate.admin_review.reviewed_at && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Reviewed At:</span>
                <span className="text-slate-300">
                  {new Date(candidate.admin_review.reviewed_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Timeline View Component
const TimelineView = ({ logs, violations }) => {
  const violationLogs = logs.filter(log => log.type === 'violation_detected');

  return (
    <div className="space-y-6">
      <div className="bg-slate-700/30 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">Violation Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(violations).map(([type, count]) => (
            <div key={type} className="bg-slate-800 rounded-lg p-3 border border-slate-600">
              <div className="text-slate-400 text-xs mb-1 capitalize">{type.replace('_', ' ')}</div>
              <div className="text-white text-2xl font-bold">{count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-white font-semibold">Violation Timeline</h3>
        {violationLogs.length === 0 ? (
          <div className="text-slate-400 text-center py-8">No violations recorded</div>
        ) : (
          <div className="space-y-2">
            {violationLogs.map((log, idx) => (
              <div key={idx} className="bg-slate-700/30 rounded-lg p-4 flex items-center gap-4">
                <div className="text-slate-400 text-sm">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {log.violations?.join(', ') || 'Violation'}
                  </div>
                  {log.confidence && (
                    <div className="text-slate-400 text-xs">
                      Confidence: {(log.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Event Log View Component
const EventLogView = ({ logs, violationTypes }) => {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Violations</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Confidence</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                  No events recorded
                </td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-slate-300 text-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      log.type === 'violation_detected' ? 'bg-red-500/20 text-red-400' :
                      log.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">
                    {log.violations?.join(', ') || log.message || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">
                    {log.confidence ? `${(log.confidence * 100).toFixed(0)}%` : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    {log.violations && log.violations.length > 0 ? (
                      <span className="text-yellow-400 font-semibold">
                        {log.violations.reduce((sum, v) => sum + (violationTypes[v]?.weight || 1), 0)}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Admin Action Panel Component
const AdminActionPanel = ({ adminAction, setAdminAction, onSubmit }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-700/30 rounded-lg p-6 space-y-4">
        <h3 className="text-white font-semibold text-lg mb-4">Make a Decision</h3>

        {/* Decision Buttons */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setAdminAction({ ...adminAction, decision: 'safe' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              adminAction.decision === 'safe'
                ? 'border-green-500 bg-green-500/20'
                : 'border-slate-600 hover:border-green-500/50'
            }`}
          >
            <CheckSquare className={`w-8 h-8 mx-auto mb-2 ${
              adminAction.decision === 'safe' ? 'text-green-400' : 'text-slate-400'
            }`} />
            <div className={`font-semibold ${
              adminAction.decision === 'safe' ? 'text-green-400' : 'text-slate-300'
            }`}>
              Mark as Safe
            </div>
            <div className="text-xs text-slate-400 mt-1">No violations detected</div>
          </button>

          <button
            onClick={() => setAdminAction({ ...adminAction, decision: 'warning' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              adminAction.decision === 'warning'
                ? 'border-yellow-500 bg-yellow-500/20'
                : 'border-slate-600 hover:border-yellow-500/50'
            }`}
          >
            <AlertCircle className={`w-8 h-8 mx-auto mb-2 ${
              adminAction.decision === 'warning' ? 'text-yellow-400' : 'text-slate-400'
            }`} />
            <div className={`font-semibold ${
              adminAction.decision === 'warning' ? 'text-yellow-400' : 'text-slate-300'
            }`}>
              Issue Warning
            </div>
            <div className="text-xs text-slate-400 mt-1">Minor violations</div>
          </button>

          <button
            onClick={() => setAdminAction({ ...adminAction, decision: 'violation' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              adminAction.decision === 'violation'
                ? 'border-red-500 bg-red-500/20'
                : 'border-slate-600 hover:border-red-500/50'
            }`}
          >
            <XSquare className={`w-8 h-8 mx-auto mb-2 ${
              adminAction.decision === 'violation' ? 'text-red-400' : 'text-slate-400'
            }`} />
            <div className={`font-semibold ${
              adminAction.decision === 'violation' ? 'text-red-400' : 'text-slate-300'
            }`}>
              Confirm Violation
            </div>
            <div className="text-xs text-slate-400 mt-1">Serious violations</div>
          </button>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            <Edit3 className="w-4 h-4 inline mr-2" />
            Add Notes / Remarks
          </label>
          <textarea
            value={adminAction.notes}
            onChange={(e) => setAdminAction({ ...adminAction, notes: e.target.value })}
            placeholder="Enter your observations and reasoning..."
            rows="4"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          disabled={!adminAction.decision}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          Submit Decision
        </button>
      </div>

      {/* Decision Impact Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <div className="font-semibold text-blue-400 mb-1">Decision Impact:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong className="text-slate-300">Safe:</strong> Sets behavior score to 100 (no penalty)</li>
              <li><strong className="text-slate-300">Warning:</strong> Sets behavior score to 90 (minor penalty)</li>
              <li><strong className="text-slate-300">Violation:</strong> Sets behavior score to 70 (significant penalty)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamViolationsDashboard;
