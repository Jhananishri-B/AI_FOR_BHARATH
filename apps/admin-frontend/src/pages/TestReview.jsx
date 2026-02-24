import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, CheckCircle, XCircle, AlertTriangle, 
  TrendingUp, Users, FileText, Clock, Edit, Save, X
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const TestReview = () => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingScore, setEditingScore] = useState(false);
  const [newScore, setNewScore] = useState(0);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [searchTerm, statusFilter, reviews]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/test-reviews`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReviews = () => {
    let filtered = [...reviews];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.cert_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.review_status === statusFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.review_requested_at) - new Date(a.review_requested_at));

    setFilteredReviews(filtered);
  };

  const viewReviewDetails = async (review) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cert-tests/attempts/${review.attempt_id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const attemptDetails = await response.json();

      setSelectedReview({
        ...review,
        ...attemptDetails,
        questions: attemptDetails.questions || [],
        answers: attemptDetails.answers || []
      });
      setNewScore(review.score);
      setAdminNotes(review.admin_notes || '');
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching review details:', error);
    }
  };

  const handleReviewDecision = async (decision) => {
    if (decision === 'approve' && editingScore && newScore === selectedReview.score) {
      alert('Please change the score or cancel editing');
      return;
    }

    if (!adminNotes.trim()) {
      alert('Please add admin notes explaining your decision');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        decision,
        admin_notes: adminNotes,
        reviewed_by: 'admin'
      };

      if (decision === 'approve' && editingScore) {
        body.new_score = parseInt(newScore);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/test-reviews/${selectedReview.attempt_id}/review`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(body)
        }
      );

      if (response.ok) {
        alert('Review decision saved successfully!');
        setShowModal(false);
        setEditingScore(false);
        fetchReviews();
      } else {
        alert('Failed to save decision');
      }
    } catch (error) {
      console.error('Error saving decision:', error);
      alert('Failed to save decision');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.review_status === 'pending').length,
    approved: reviews.filter(r => r.review_status === 'approved').length,
    rejected: reviews.filter(r => r.review_status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-white text-xl">Loading test reviews...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-400" />
          Test Review Dashboard
        </h1>
        <p className="text-slate-400 mt-1">Review and adjust test scores for students near the pass threshold</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, ID, certification..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Reviews"
          value={stats.total}
          icon={Users}
          color="blue"
          onClick={() => setStatusFilter('all')}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          color="yellow"
          onClick={() => setStatusFilter('pending')}
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={CheckCircle}
          color="green"
          onClick={() => setStatusFilter('approved')}
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
          color="red"
          onClick={() => setStatusFilter('rejected')}
        />
      </div>

      {/* Reviews Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Certification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Pass %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Gap</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                    No reviews found matching your filters
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => {
                  const gap = (review.pass_percentage || 70) - review.score;
                  return (
                    <tr key={review.attempt_id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white font-medium">{review.user_name}</div>
                        <div className="text-slate-400 text-xs">{review.user_id}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {review.cert_id} - {review.difficulty}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-semibold">{review.score}%</span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{review.pass_percentage || 70}%</td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${
                          gap <= 2 ? 'text-yellow-400' :
                          gap <= 5 ? 'text-orange-400' :
                          'text-red-400'
                        }`}>
                          -{gap.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={review.review_status} />
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        {new Date(review.review_requested_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => viewReviewDetails(review)}
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {showModal && selectedReview && (
        <ReviewModal
          review={selectedReview}
          onClose={() => {
            setShowModal(false);
            setEditingScore(false);
            setNewScore(selectedReview.score);
          }}
          editingScore={editingScore}
          setEditingScore={setEditingScore}
          newScore={newScore}
          setNewScore={setNewScore}
          adminNotes={adminNotes}
          setAdminNotes={setAdminNotes}
          onDecision={handleReviewDecision}
          submitting={submitting}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, onClick }) => {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20'
  };

  return (
    <div
      onClick={onClick}
      className={`${colors[color]} border rounded-xl p-4 transition-all cursor-pointer hover:scale-105`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-6 h-6" />
        <div className="text-2xl font-bold text-white">{value}</div>
      </div>
      <div className="text-xs font-medium opacity-90">{title}</div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400'
  };

  const labels = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

// Review Modal Component
const ReviewModal = ({ 
  review, 
  onClose, 
  editingScore, 
  setEditingScore, 
  newScore, 
  setNewScore, 
  adminNotes, 
  setAdminNotes, 
  onDecision, 
  submitting 
}) => {
  const passPercentage = review.pass_percentage || review.settings?.pass_percentage || 70;
  const currentScore = review.score;
  const gap = passPercentage - currentScore;
  const wouldPass = newScore >= passPercentage;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">{review.user_name}</h2>
            <div className="text-slate-400 mt-1">
              {review.cert_id} - {review.difficulty}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Current Score</div>
              <div className="text-white font-bold text-2xl">{currentScore}%</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Pass Threshold</div>
              <div className="text-blue-400 font-bold text-2xl">{passPercentage}%</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Gap to Pass</div>
              <div className="text-yellow-400 font-bold text-2xl">-{gap.toFixed(1)}%</div>
            </div>
          </div>

          {/* Student Request */}
          {review.review_reason && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="text-blue-400 font-semibold mb-2">Student's Request:</div>
              <div className="text-slate-300 text-sm">{review.review_reason}</div>
            </div>
          )}

          {/* Score Adjustment */}
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Score Adjustment</h3>
              {!editingScore && review.review_status === 'pending' && (
                <button
                  onClick={() => setEditingScore(true)}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                >
                  <Edit className="w-4 h-4" />
                  Edit Score
                </button>
              )}
            </div>

            {editingScore ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 text-sm mb-2">New Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newScore}
                    onChange={(e) => setNewScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-400">Change:</span>
                  <span className={`font-semibold ${newScore > currentScore ? 'text-green-400' : newScore < currentScore ? 'text-red-400' : 'text-slate-400'}`}>
                    {newScore > currentScore ? '+' : ''}{(newScore - currentScore).toFixed(1)}%
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className={`font-semibold ${wouldPass ? 'text-green-400' : 'text-red-400'}`}>
                    {wouldPass ? '✓ Would Pass' : '✗ Would Fail'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-sm">
                Click "Edit Score" to adjust the student's score
              </div>
            )}
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              Admin Review Notes *
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Explain your decision and reasoning for the score adjustment..."
              rows="4"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={review.review_status !== 'pending'}
            />
          </div>

          {/* Decision Buttons */}
          {review.review_status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={() => onDecision('approve')}
                disabled={submitting}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {editingScore ? 'Approve with New Score' : 'Approve Current Score'}
              </button>
              <button
                onClick={() => onDecision('reject')}
                disabled={submitting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Reject Review
              </button>
            </div>
          )}

          {/* Review Status (if already reviewed) */}
          {review.review_status !== 'pending' && (
            <div className={`p-4 rounded-lg ${
              review.review_status === 'approved' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
            }`}>
              <div className={`font-semibold mb-2 ${
                review.review_status === 'approved' ? 'text-green-400' : 'text-red-400'
              }`}>
                {review.review_status === 'approved' ? 'Approved' : 'Rejected'} by {review.reviewed_by}
              </div>
              {review.reviewed_at && (
                <div className="text-slate-400 text-sm">
                  Reviewed on {new Date(review.reviewed_at).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestReview;
