import React, { useState, useEffect } from 'react';
// Removed: import { toast } from 'sonner';
import { Eye, AlertTriangle, Shield, TrendingDown, Clock, User } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ProctoringReview = () => {
  const [attempts, setAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [violations, setViolations] = useState({});

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/proctoring/attempts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setAttempts(data.attempts || []);
    } catch (error) {
      console.error('Error fetching attempts:', error);
      console.error('Failed to load proctoring attempts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttemptDetails = async (attemptId) => {
    try {
      const [logsRes, violationsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/proctoring/attempts/${attemptId}/proctoring-logs`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${API_BASE_URL}/api/admin/proctoring/attempts/${attemptId}/violations`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const logsData = await logsRes.json();
      const violationsData = await violationsRes.json();

      setLogs(logsData.proctoring_logs || []);
      setViolations(violationsData);
      setSelectedAttempt({ ...logsData, ...violationsData });
    } catch (error) {
      console.error('Error fetching attempt details:', error);
      console.error('Failed to load attempt details');
    }
  };

  const updateBehaviorScore = async (attemptId, newScore, notes) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/proctoring/attempts/${attemptId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          behavior_score_override: newScore,
          admin_notes: notes,
          reviewed_by: 'admin'
        })
      });

      if (response.ok) {
        console.log('Score updated successfully');
        fetchAttempts();
        setSelectedAttempt(null);
      }
    } catch (error) {
      console.error('Failed to update score');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'started': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Proctoring Review</h1>
        <p className="text-gray-600">Review and manage certification test attempts</p>
      </div>

      {/* Attempts List */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Test Attempts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Behavior Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Violations</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No attempts found
                  </td>
                </tr>
              ) : (
                attempts.map((attempt) => (
                  <tr key={attempt.attempt_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="ml-2 text-sm text-gray-900">{attempt.user_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{attempt.certification_title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(attempt.status)}`}>
                        {attempt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getScoreColor(attempt.behavior_score)}`}>
                        {attempt.behavior_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getScoreColor(attempt.final_score || 0)}`}>
                        {attempt.final_score ?? 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm">
                        <AlertTriangle className="w-4 h-4 text-red-500 mr-1" />
                        <span className="text-gray-900">{attempt.violation_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => fetchAttemptDetails(attempt.attempt_id)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
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

      {/* Selected Attempt Details Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Attempt Details</h2>
                <button
                  onClick={() => setSelectedAttempt(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">User</div>
                  <div className="font-semibold text-gray-900">{selectedAttempt.user_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Certification</div>
                  <div className="font-semibold text-gray-900">{selectedAttempt.certification_title}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Behavior Score</div>
                  <div className={`font-semibold ${getScoreColor(selectedAttempt.behavior_score)}`}>
                    {selectedAttempt.behavior_score}/100
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Test Score</div>
                  <div className={`font-semibold ${getScoreColor(selectedAttempt.test_score || 0)}`}>
                    {selectedAttempt.test_score || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Violations Summary */}
              {selectedAttempt.violation_counts && Object.keys(selectedAttempt.violation_counts).length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-900 mb-3">Violations Detected</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedAttempt.violation_counts).map(([violation, count]) => (
                      <div key={violation} className="flex justify-between">
                        <span className="text-sm text-red-800">{violation.replace('_', ' ')}</span>
                        <span className="text-sm font-semibold text-red-900">{count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proctoring Logs */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Proctoring Timeline</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.type}</div>
                          <div className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</div>
                          {log.violations && (
                            <div className="mt-2">
                              <span className="text-xs text-red-600">Violations: {log.violations.join(', ')}</span>
                            </div>
                          )}
                        </div>
                        {log.penalty && (
                          <div className="text-sm font-semibold text-red-600">
                            {log.penalty < 0 ? log.penalty : `-${log.penalty}`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Override Score */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Score Override</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Behavior Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={selectedAttempt.behavior_score}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      id="newScore"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes
                    </label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Add review notes..."
                      id="adminNotes"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const newScore = document.getElementById('newScore').value;
                      const notes = document.getElementById('adminNotes').value;
                      updateBehaviorScore(selectedAttempt.attempt_id, parseInt(newScore), notes);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Update Score
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProctoringReview;
