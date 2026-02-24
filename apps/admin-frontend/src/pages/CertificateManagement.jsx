import React, { useState, useEffect, useMemo } from 'react'
import { Award, Mail, CheckCircle, Eye, Send, Filter, Download, RefreshCw, Clock, XCircle, CheckCheck } from 'lucide-react'
import { adminCertTestsAPI } from '../services/api'
import { toast } from 'sonner'

const CertificateManagement = () => {
  const [allAttempts, setAllAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [sendingEmails, setSendingEmails] = useState(false)
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all') // all, sent, pending, failed
  const [searchQuery, setSearchQuery] = useState('')
  const [certFilter, setCertFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all') // all, today, week, month

  useEffect(() => {
    fetchAllAttempts()
  }, [])

  const fetchAllAttempts = async () => {
    setLoading(true)
    try {
      const response = await adminCertTestsAPI.getAllAttempts()
      // Get all completed attempts with pass/fail status
      const completed = response.data.filter(result => result.status === 'completed')
      setAllAttempts(completed)
    } catch (error) {
      console.error('Error fetching attempts:', error)
      toast.error('Failed to load certificate data')
    } finally {
      setLoading(false)
    }
  }

  // Filter and categorize attempts
  const filteredAttempts = useMemo(() => {
    let filtered = [...allAttempts]
    
    // Calculate pass/fail status for each
    filtered = filtered.map(attempt => {
      const passPercentage = attempt.settings?.pass_percentage || 70
      const passed = attempt.score >= passPercentage
      const certificateStatus = attempt.certificate_sent 
        ? 'sent' 
        : (passed ? 'pending' : 'failed')
      
      return {
        ...attempt,
        passed,
        certificateStatus
      }
    })
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.certificateStatus === statusFilter)
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a => 
        a.user_name?.toLowerCase().includes(query) ||
        a.user_email?.toLowerCase().includes(query) ||
        a.cert_id?.toLowerCase().includes(query)
      )
    }
    
    // Apply certification filter
    if (certFilter !== 'all') {
      filtered = filtered.filter(a => a.cert_id === certFilter)
    }
    
    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date()
      filtered = filtered.filter(a => {
        const testDate = new Date(a.created_at)
        
        if (dateRange === 'today') {
          return testDate.toDateString() === now.toDateString()
        } else if (dateRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return testDate >= weekAgo
        } else if (dateRange === 'month') {
          return testDate.getMonth() === now.getMonth() && 
                 testDate.getFullYear() === now.getFullYear()
        }
        return true
      })
    }
    
    return filtered
  }, [allAttempts, statusFilter, searchQuery, certFilter, dateRange])
  
  // Get unique certifications for filter
  const uniqueCertifications = useMemo(() => {
    const certs = new Set(allAttempts.map(a => a.cert_id).filter(Boolean))
    return Array.from(certs).sort()
  }, [allAttempts])

  const toggleSelectUser = (attemptId) => {
    setSelectedUsers(prev => 
      prev.includes(attemptId) 
        ? prev.filter(id => id !== attemptId)
        : [...prev, attemptId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredAttempts.length) {
      setSelectedUsers([])
    } else {
      // Only select users who can receive certificates (passed and not sent)
      const selectableUsers = filteredAttempts.filter(user => {
        const passPercentage = user.settings?.pass_percentage || 70
        const passed = user.score >= passPercentage
        return passed && !user.certificate_sent
      })
      setSelectedUsers(selectableUsers.map(user => user.attempt_id))
    }
  }

  const sendBulkCertificates = async (attemptIds = null) => {
    const idsToSend = attemptIds || selectedUsers
    
    if (idsToSend.length === 0) {
      toast.error('Please select at least one user')
      return
    }
    
    // Filter out attempts that don't meet requirements
    const validAttempts = idsToSend.map(id => {
      const attempt = allAttempts.find(a => a.attempt_id === id)
      if (!attempt) {
        console.log('Attempt not found for id:', id)
        return null
      }
      
      const passPercentage = attempt.settings?.pass_percentage || 70
      const passed = attempt.score >= passPercentage
      
      if (!passed) {
        toast.warning(`${attempt.user_name} hasn't passed (${attempt.score}% < ${passPercentage}%)`)
        return null
      }
      
      if (attempt.certificate_sent) {
        toast.info(`Certificate already sent to ${attempt.user_name}`)
        return null
      }
      
      return id
    }).filter(Boolean)
    
    if (validAttempts.length === 0) {
      toast.error('No valid attempts to send certificates')
      return
    }

    setSendingEmails(true)
    try {
      const response = await adminCertTestsAPI.sendBulkCertificates(validAttempts)
      
      if (response.data) {
        const { success, failed, total, details } = response.data
        
        if (success === total) {
          toast.success(`✅ Certificates sent to all ${success} user(s)!`)
        } else if (success > 0) {
          const failedUsers = details.filter(d => d.status === 'failed')
          
          toast.warning(
            <div>
              <div className="font-semibold">⚠️ Sent to {success} user(s), {failed} failed</div>
              <div className="text-sm mt-1 space-y-1">
                {failedUsers.map((u, i) => (
                  <div key={i} className="text-xs">
                    • {u.user_name || 'Unknown'}: {u.error}
                  </div>
                ))}
              </div>
            </div>,
            { duration: 8000 }
          )
        } else {
          const failedUsers = details.filter(d => d.status === 'failed')
          toast.error(
            <div>
              <div className="font-semibold">❌ Failed to send certificates to all {total} user(s)</div>
              <div className="text-sm mt-1 space-y-1">
                {failedUsers.map((u, i) => (
                  <div key={i} className="text-xs">
                    • {u.user_name || u.attempt_id}: {u.error}
                  </div>
                ))}
              </div>
            </div>,
            { duration: 8000 }
          )
        }
        
        // Refresh data and clear selection on any success
        if (success > 0) {
          setSelectedUsers([])
          // Small delay to ensure database update completes
          setTimeout(async () => {
            await fetchAllAttempts()
          }, 500)
        }
      }
    } catch (error) {
      console.error('Error sending certificates:', error)
      toast.error('Failed to send certificates: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSendingEmails(false)
    }
  }

  // Calculate stats
  const stats = useMemo(() => {
    const passPercentage = 70 // default
    const passed = allAttempts.filter(a => {
      const pass = a.settings?.pass_percentage || passPercentage
      return a.score >= pass
    })
    
    const sent = allAttempts.filter(a => a.certificate_sent)
    const pending = passed.filter(a => !a.certificate_sent)
    const failed = allAttempts.filter(a => {
      const pass = a.settings?.pass_percentage || passPercentage
      return a.score < pass
    })
    
    return {
      totalAttempts: allAttempts.length,
      totalPassed: passed.length,
      certificatesSent: sent.length,
      pendingReview: pending.length,
      testsFailed: failed.length
    }
  }, [allAttempts])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading certificate data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Certificate Management</h1>
          <p className="text-slate-400">Manage and send certificates to qualified users</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fetchAllAttempts()}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
          <button 
            onClick={() => sendBulkCertificates()}
            disabled={selectedUsers.length === 0 || sendingEmails}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            {sendingEmails ? 'Sending...' : `Send Certificates (${selectedUsers.length})`}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-sm mb-1">Total Attempts</div>
              <div className="text-3xl font-bold text-white">{stats.totalAttempts}</div>
            </div>
            <Award className="w-10 h-10 text-blue-400 opacity-50" />
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-sm mb-1">Passed</div>
              <div className="text-3xl font-bold text-green-400">{stats.totalPassed}</div>
            </div>
            <CheckCircle className="w-10 h-10 text-green-400 opacity-50" />
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-sm mb-1">Certificates Sent</div>
              <div className="text-3xl font-bold text-blue-400">{stats.certificatesSent}</div>
            </div>
            <CheckCheck className="w-10 h-10 text-blue-400 opacity-50" />
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-sm mb-1">Pending</div>
              <div className="text-3xl font-bold text-yellow-400">{stats.pendingReview}</div>
            </div>
            <Clock className="w-10 h-10 text-yellow-400 opacity-50" />
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-sm mb-1">Failed</div>
              <div className="text-3xl font-bold text-red-400">{stats.testsFailed}</div>
            </div>
            <XCircle className="w-10 h-10 text-red-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="text-slate-400 font-medium">Filters:</span>
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              All ({allAttempts.length})
            </button>
            <button
              onClick={() => setStatusFilter('sent')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'sent' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Sent ({stats.certificatesSent})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Pending ({stats.pendingReview})
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'failed' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Failed ({stats.testsFailed})
            </button>
          </div>
          
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, email, or certification..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {/* Certification Filter */}
          <select
            value={certFilter}
            onChange={(e) => setCertFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Certifications</option>
            {uniqueCertifications.map(cert => (
              <option key={cert} value={cert}>{cert}</option>
            ))}
          </select>
          
          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredAttempts.length && filteredAttempts.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Certification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Difficulty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                    No results found matching your filters
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((result) => {
                  const statusBadge = result.certificateStatus === 'sent' ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 w-fit bg-green-500/20 text-green-400">
                      <CheckCheck className="w-3 h-3" />
                      Sent
                    </span>
                  ) : result.certificateStatus === 'pending' ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 w-fit bg-yellow-500/20 text-yellow-400">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 w-fit bg-red-500/20 text-red-400">
                      <XCircle className="w-3 h-3" />
                      Failed
                    </span>
                  )
                  
                  const canSendCertificate = result.passed && !result.certificate_sent
                  
                  return (
                    <tr key={result.attempt_id} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(result.attempt_id)}
                          onChange={() => toggleSelectUser(result.attempt_id)}
                          disabled={!canSendCertificate}
                          className="w-4 h-4 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500 disabled:opacity-30"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div>
                          <div className="font-semibold">{result.user_name}</div>
                          <div className="text-xs text-slate-400">{result.user_email || 'No email'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{result.cert_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        <span className="capitalize">{result.difficulty}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-semibold text-white">
                          {result.score}%
                        </div>
                        <div className="text-xs text-slate-400">
                          Pass: {result.settings?.pass_percentage || 70}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {statusBadge}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        <div>{result.created_at ? new Date(result.created_at).toLocaleDateString() : 'N/A'}</div>
                        {result.certificate_sent_at && (
                          <div className="text-xs text-slate-500">
                            Sent: {new Date(result.certificate_sent_at).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button 
                            className="text-blue-400 hover:text-blue-300 disabled:opacity-30" 
                            title="View Details"
                            onClick={() => toast.info('View details coming soon')}
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            className="text-green-400 hover:text-green-300 disabled:opacity-30 disabled:cursor-not-allowed" 
                            title={canSendCertificate ? "Send Certificate" : result.certificate_sent ? "Already sent" : "User hasn't passed"}
                            disabled={!canSendCertificate || sendingEmails}
                            onClick={() => sendBulkCertificates([result.attempt_id])}
                          >
                            <Mail className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer with count */}
        <div className="px-6 py-3 bg-slate-700/30 border-t border-slate-700 text-sm text-slate-400">
          Showing {filteredAttempts.length} of {allAttempts.length} total attempts
        </div>
      </div>
    </div>
  )
}

export default CertificateManagement

