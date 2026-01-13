import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { investigations } from '../services/api';

function History() {
  const navigate = useNavigate();
  const [investigationsList, setInvestigationsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, processing, failed
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, confidence

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const fetchInvestigations = async () => {
    try {
      const response = await investigations.list(0, 100);
      setInvestigationsList(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch investigations:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await investigations.delete(id);
      setInvestigationsList(prev => prev.filter(inv => inv.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete investigation:', error);
    }
  };

  // Filter and sort investigations
  const filteredInvestigations = investigationsList
    .filter(inv => {
      // Status filter
      if (filter !== 'all' && inv.status !== filter) return false;
      // Search filter
      if (searchQuery && !inv.repo_url.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'confidence':
          return (b.confidence || 0) - (a.confidence || 0);
        case 'newest':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  // Get stats
  const stats = {
    total: investigationsList.length,
    completed: investigationsList.filter(i => i.status === 'completed').length,
    processing: investigationsList.filter(i => i.status === 'processing' || i.status === 'pending').length,
    failed: investigationsList.filter(i => i.status === 'failed').length,
  };

  // Extract repo name from URL
  const getRepoName = (url) => {
    const parts = url.replace(/\.git$/, '').split('/');
    return parts.slice(-2).join('/');
  };

  // Format relative time
  const getRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get status badge styles
  const getStatusStyle = (status) => ({
    completed: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', icon: '✓' },
    processing: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', icon: '⛏️' },
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: '⏳' },
    failed: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', icon: '✕' },
  }[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', icon: '?' });

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-6xl"
        >
          🗄️
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950" />
        <motion.div
          className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/40 backdrop-blur-xl border-b border-white/5 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-400 hover:text-white transition">
                ← Home
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>🏛️</span>
                  Excavation Archives
                </h1>
                <p className="text-sm text-gray-400">
                  Your investigation history
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition"
            >
              + New Investigation
            </motion.button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Total Excavations', value: stats.total, icon: '📦', color: 'text-purple-400' },
            { label: 'Completed', value: stats.completed, icon: '✅', color: 'text-green-400' },
            { label: 'In Progress', value: stats.processing, icon: '⛏️', color: 'text-blue-400' },
            { label: 'Failed', value: stats.failed, icon: '❌', color: 'text-red-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/5 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span>{stat.icon}</span>
                <span className="text-gray-400 text-sm">{stat.label}</span>
              </div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'completed', label: 'Completed' },
              { value: 'processing', label: 'In Progress' },
              { value: 'failed', label: 'Failed' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-lg font-medium transition ${filter === f.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500/50"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="confidence">Highest Confidence</option>
          </select>
        </motion.div>

        {/* Investigation List */}
        {filteredInvestigations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🏺</div>
            <h3 className="text-xl text-white mb-2">No Excavations Found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start your first archaeological investigation!'
              }
            </p>
            {!searchQuery && filter === 'all' && (
              <Link
                to="/"
                className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition"
              >
                Start First Investigation
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredInvestigations.map((inv, index) => {
                const statusStyle = getStatusStyle(inv.status);

                return (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/5 p-5 group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Status indicator */}
                      <div className={`w-12 h-12 rounded-xl ${statusStyle.bg} border ${statusStyle.border} flex items-center justify-center text-2xl`}>
                        {inv.status === 'processing' || inv.status === 'pending' ? (
                          <motion.span
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            {statusStyle.icon}
                          </motion.span>
                        ) : statusStyle.icon}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {getRepoName(inv.repo_url)}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                            {inv.status === 'processing' ? 'DIGGING' : inv.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-mono truncate mt-1">
                          {inv.repo_url}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-gray-500">
                            🕐 {getRelativeTime(inv.created_at)}
                          </span>
                          {inv.confidence !== null && inv.confidence !== undefined && (
                            <span className={getConfidenceColor(inv.confidence)}>
                              📊 {inv.confidence}% confidence
                            </span>
                          )}
                          {inv.completed_at && (
                            <span className="text-gray-500">
                              Completed {getRelativeTime(inv.completed_at)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                        {inv.status === 'completed' ? (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => navigate(`/report/${inv.id}`)}
                              className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg"
                              title="View Report"
                            >
                              📜
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => navigate(`/dashboard/${inv.id}`)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg"
                              title="View Dashboard"
                            >
                              📊
                            </motion.button>
                          </>
                        ) : inv.status === 'processing' || inv.status === 'pending' ? (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate(`/dashboard/${inv.id}`)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg"
                            title="View Dashboard"
                          >
                            📊
                          </motion.button>
                        ) : null}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setDeleteConfirm(inv.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"
                          title="Delete"
                        >
                          🗑️
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Results count */}
        {filteredInvestigations.length > 0 && (
          <p className="text-center text-gray-500 mt-6">
            Showing {filteredInvestigations.length} of {investigationsList.length} excavations
          </p>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-2xl border border-white/10 p-6 max-w-md mx-4"
            >
              <div className="text-center">
                <div className="text-5xl mb-4">🗑️</div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Investigation?</h3>
                <p className="text-gray-400 mb-6">
                  This will permanently remove this excavation and all its data. This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default History;