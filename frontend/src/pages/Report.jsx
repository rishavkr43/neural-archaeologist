import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { investigations } from '../services/api';
import AdvancedTimelineGraph from '../components/AdvancedTimelineGraph';

function Report() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [investigation, setInvestigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('story');
  const [expandedTimelineItem, setExpandedTimelineItem] = useState(null);

  useEffect(() => {
    const fetchInvestigation = async () => {
      try {
        const response = await investigations.get(id);
        setInvestigation(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch investigation:', error);
        setLoading(false);
      }
    };
    fetchInvestigation();
  }, [id]);

  // Extract report data
  const reportData = investigation?.findings?.report_data || {};
  const scoutData = investigation?.findings?.scout_data || {};
  const analysis = investigation?.findings?.analysis || {};
  const executiveSummary = reportData.executive_summary || {};
  const timeline = reportData.timeline || [];
  const citations = reportData.citations || [];
  const narrative = investigation?.report || '';

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get timeline event icon and color
  const getTimelineStyle = (type) => ({
    birth: { icon: '🌱', color: 'bg-green-500', borderColor: 'border-green-500' },
    peak: { icon: '🚀', color: 'bg-blue-500', borderColor: 'border-blue-500' },
    decline: { icon: '📉', color: 'bg-orange-500', borderColor: 'border-orange-500' },
    present: { icon: '🔬', color: 'bg-purple-500', borderColor: 'border-purple-500' },
  }[type] || { icon: '📌', color: 'bg-gray-500', borderColor: 'border-gray-500' });

  // Handle PDF export
  const handleExportPDF = () => {
    window.print();
  };

  // Handle share
  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: `Neural Archaeologist Report: ${executiveSummary.repo_name}`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-6xl"
        >
          📜
        </motion.div>
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl text-white mb-4">Investigation Not Found</h2>
          <Link to="/history" className="text-purple-400 hover:text-purple-300">
            ← Back to History
          </Link>
        </div>
      </div>
    );
  }

  if (investigation.status !== 'completed') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            ⛏️
          </motion.div>
          <h2 className="text-2xl text-white mb-4">Investigation In Progress</h2>
          <p className="text-gray-400 mb-6">The report will be available once the excavation is complete.</p>
          <Link
            to={`/dashboard/${id}`}
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg"
          >
            View Live Dashboard →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 print:bg-white">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none print:hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950" />
        <motion.div
          className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/40 backdrop-blur-xl border-b border-white/5 sticky top-0 print:static print:bg-white print:border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/history')}
                className="text-gray-400 hover:text-white transition print:hidden"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-white print:text-black flex items-center gap-2">
                  <span>📜</span>
                  Archaeological Report
                </h1>
                <p className="text-sm text-gray-400 print:text-gray-600 font-mono">
                  {investigation.repo_url}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 print:hidden">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10"
              >
                🔗 Share
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportPDF}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
              >
                📄 Export PDF
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Executive Summary Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl border border-white/10 p-6 print:bg-gray-100 print:border-gray-300">
            <h2 className="text-lg font-semibold text-white print:text-black mb-4 flex items-center gap-2">
              <span>📊</span>
              Executive Summary
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-black/30 rounded-xl p-4 print:bg-white print:border print:border-gray-200">
                <div className="text-3xl font-bold text-white print:text-purple-600">
                  {scoutData.total_commits?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-400 print:text-gray-600">Total Commits</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 print:bg-white print:border print:border-gray-200">
                <div className="text-3xl font-bold text-white print:text-purple-600">
                  {scoutData.contributors_count || 0}
                </div>
                <div className="text-sm text-gray-400 print:text-gray-600">Contributors</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 print:bg-white print:border print:border-gray-200">
                <div className="text-3xl font-bold text-white print:text-purple-600">
                  {scoutData.active_period_months?.toFixed(0) || 0}
                </div>
                <div className="text-sm text-gray-400 print:text-gray-600">Active Months</div>
              </div>
              <div className="bg-black/30 rounded-xl p-4 print:bg-white print:border print:border-gray-200">
                <div className={`text-3xl font-bold ${investigation.confidence >= 80 ? 'text-green-400' :
                  investigation.confidence >= 60 ? 'text-yellow-400' : 'text-red-400'
                  } print:text-purple-600`}>
                  {investigation.confidence}%
                </div>
                <div className="text-sm text-gray-400 print:text-gray-600">Confidence</div>
              </div>
            </div>

            <div className="bg-black/20 rounded-xl p-4 print:bg-white print:border print:border-gray-200">
              <h3 className="text-sm font-medium text-purple-300 print:text-purple-600 mb-2">Hypothesis</h3>
              <p className="text-white print:text-black">{analysis.hypothesis || 'No hypothesis generated'}</p>
            </div>
          </div>
        </motion.section>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 print:hidden overflow-x-auto pb-2">
          {[
            { id: 'story', label: '📖 Story', icon: '📖' },
            { id: 'timeline', label: '⏰ Timeline', icon: '⏰' },
            { id: 'contributors', label: '👥 Contributors', icon: '👥' },
            { id: 'github', label: '🐙 GitHub Insights', icon: '🐙' },
            { id: 'sources', label: '📚 Sources', icon: '📚' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Story Tab */}
          {activeTab === 'story' && (
            <motion.section
              key="story"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 md:p-8 print:bg-white print:border-gray-200"
            >
              <div className="prose prose-invert max-w-none print:prose">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold text-white print:text-black mb-6 border-b border-white/10 print:border-gray-300 pb-4">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-bold text-purple-300 print:text-purple-700 mt-8 mb-4">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-semibold text-white print:text-black mt-6 mb-3">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-gray-300 print:text-gray-700 mb-4 leading-relaxed">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-2 text-gray-300 print:text-gray-700 mb-4">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-gray-300 print:text-gray-700">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-white print:text-black font-semibold">{children}</strong>
                    ),
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {narrative}
                </ReactMarkdown>
              </div>
            </motion.section>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <motion.section
              key="timeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AdvancedTimelineGraph
                scoutData={scoutData}
                timeline={timeline}
              />
            </motion.section>
          )}

          {/* Contributors Tab */}
          {activeTab === 'contributors' && (
            <motion.section
              key="contributors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 md:p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <span>👥</span>
                Contributor Profiles
              </h2>

              {scoutData.top_contributors?.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {scoutData.top_contributors.slice(0, 6).map((contributor, index) => {
                    // Handle different data formats (Git Analytics vs GitHub API)
                    const name = contributor.name || contributor.username || 'Unknown';
                    const commits = contributor.commit_count || contributor.contributions || 0;

                    // Calculate percentage if missing
                    let percentage = contributor.percentage;
                    if (percentage === undefined || percentage === null) {
                      const total = scoutData.total_commits || 1;
                      percentage = (commits / total) * 100;
                    }

                    const impactLevel = percentage > 30 ? 'Lead Developer' :
                      percentage > 15 ? 'Core Contributor' : 'Contributor';
                    const impactColor = percentage > 30 ? 'text-purple-400' :
                      percentage > 15 ? 'text-blue-400' : 'text-gray-400';

                    return (
                      <motion.div
                        key={name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/5 rounded-xl p-5 border border-white/5"
                      >
                        <div className="flex items-center gap-4">
                          {contributor.avatar_url ? (
                            <img
                              src={contributor.avatar_url}
                              alt={name}
                              className="w-14 h-14 rounded-full border-2 border-purple-500/30"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white">
                              {name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-lg">{name}</h3>
                            <a
                              href={contributor.profile_url || `https://github.com/${name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-sm ${impactColor} hover:underline`}
                            >
                              {impactLevel}
                            </a>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Contributions</span>
                            <span className="text-white">{commits} commits</span>
                          </div>
                          <div className="bg-slate-800 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(percentage, 100)}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            />
                          </div>
                          <div className="text-right text-xs text-gray-500 mt-1">
                            {percentage.toFixed(1)}% of total
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <div className="text-4xl mb-4">👤</div>
                  <p>No contributor data available.</p>
                </div>
              )}
            </motion.section>
          )}

          {/* GitHub Insights Tab */}
          {activeTab === 'github' && (
            <motion.section
              key="github"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {scoutData.github_data?.available ? (
                <>
                  {/* Repository Stats */}
                  <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <span>📊</span>
                      Repository Statistics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Stars', value: scoutData.github_data.repo_info?.stars?.toLocaleString() || 0, icon: '⭐' },
                        { label: 'Forks', value: scoutData.github_data.repo_info?.forks?.toLocaleString() || 0, icon: '🍴' },
                        { label: 'Watchers', value: scoutData.github_data.repo_info?.watchers?.toLocaleString() || 0, icon: '👁️' },
                        { label: 'Open Issues', value: scoutData.github_data.repo_info?.open_issues?.toLocaleString() || 0, icon: '🐛' },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-white/5 rounded-xl p-4 text-center">
                          <div className="text-2xl mb-1">{stat.icon}</div>
                          <div className="text-2xl font-bold text-white">{stat.value}</div>
                          <div className="text-sm text-gray-400">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Languages */}
                  {scoutData.github_data.languages && (
                    <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span>💻</span>
                        Languages
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(scoutData.github_data.languages.breakdown || {})
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 8)
                          .map(([lang, percentage], i) => (
                            <div key={lang}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-white">{lang}</span>
                                <span className="text-gray-400">{percentage}%</span>
                              </div>
                              <div className="bg-slate-800 rounded-full h-2 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.1 }}
                                  className={`h-full ${i === 0 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                    i === 1 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                                      i === 2 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                        'bg-gradient-to-r from-gray-500 to-gray-400'
                                    }`}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Releases */}
                  {scoutData.github_data.releases && scoutData.github_data.releases.length > 0 && (
                    <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span>🚀</span>
                        Recent Releases
                      </h3>
                      <div className="space-y-3">
                        {scoutData.github_data.releases.slice(0, 5).map((release, i) => (
                          <motion.div
                            key={release.tag}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{release.is_prerelease ? '🔬' : '📦'}</span>
                              <div>
                                <div className="text-white font-medium">{release.tag}</div>
                                {release.name && <div className="text-sm text-gray-400">{release.name}</div>}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-400">
                                {formatDate(release.published_at)}
                              </div>
                              {release.download_count > 0 && (
                                <div className="text-xs text-gray-500">
                                  {release.download_count.toLocaleString()} downloads
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Community Health */}
                  {scoutData.github_data.community_health && (
                    <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span>🏥</span>
                        Community Health
                      </h3>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Health Score</span>
                          <span className="text-white font-bold">
                            {scoutData.github_data.community_health.health_percentage}%
                          </span>
                        </div>
                        <div className="bg-slate-800 rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${scoutData.github_data.community_health.health_percentage}%` }}
                            className={`h-full ${scoutData.github_data.community_health.health_percentage >= 80
                              ? 'bg-green-500'
                              : scoutData.github_data.community_health.health_percentage >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                              }`}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { label: 'README', has: scoutData.github_data.community_health.has_readme },
                          { label: 'License', has: scoutData.github_data.community_health.has_license },
                          { label: 'Contributing', has: scoutData.github_data.community_health.has_contributing },
                          { label: 'Code of Conduct', has: scoutData.github_data.community_health.has_code_of_conduct },
                          { label: 'Issue Template', has: scoutData.github_data.community_health.has_issue_template },
                          { label: 'PR Template', has: scoutData.github_data.community_health.has_pull_request_template },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${item.has ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                              }`}
                          >
                            <span>{item.has ? '✓' : '✕'}</span>
                            <span className="text-sm">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Repo Info */}
                  {scoutData.github_data.repo_info && (
                    <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span>ℹ️</span>
                        Repository Info
                      </h3>
                      <div className="space-y-3">
                        {scoutData.github_data.repo_info.description && (
                          <div>
                            <span className="text-gray-400 text-sm">Description</span>
                            <p className="text-white mt-1">{scoutData.github_data.repo_info.description}</p>
                          </div>
                        )}
                        {scoutData.github_data.repo_info.topics?.length > 0 && (
                          <div>
                            <span className="text-gray-400 text-sm">Topics</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {scoutData.github_data.repo_info.topics.map((topic) => (
                                <span
                                  key={topic}
                                  className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          {scoutData.github_data.repo_info.license && (
                            <div className="bg-white/5 rounded-lg p-3">
                              <span className="text-gray-400 text-xs">License</span>
                              <div className="text-white mt-1">{scoutData.github_data.repo_info.license}</div>
                            </div>
                          )}
                          <div className="bg-white/5 rounded-lg p-3">
                            <span className="text-gray-400 text-xs">Size</span>
                            <div className="text-white mt-1">
                              {(scoutData.github_data.repo_info.size_kb / 1024).toFixed(1)} MB
                            </div>
                          </div>
                        </div>
                        {scoutData.github_data.repo_info.is_archived && (
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-3">
                            <span className="text-yellow-400">⚠️ This repository is archived</span>
                          </div>
                        )}
                        {scoutData.github_data.repo_info.is_fork && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                            <span className="text-blue-400">
                              🍴 Fork of {scoutData.github_data.repo_info.parent_repo}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-400 py-12 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5">
                  <div className="text-4xl mb-4">🐙</div>
                  <p>GitHub API data not available.</p>
                  <p className="text-sm mt-2">Add GITHUB_TOKEN to your .env file for enriched insights.</p>
                </div>
              )}
            </motion.section>
          )}

          {/* Sources Tab */}
          {activeTab === 'sources' && (
            <motion.section
              key="sources"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 md:p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <span>📚</span>
                External Sources & Citations
              </h2>

              {citations.length > 0 ? (
                <div className="space-y-4">
                  {citations.map((citation, index) => (
                    <motion.a
                      key={index}
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.01, x: 5 }}
                      className="block bg-white/5 rounded-xl p-5 border border-white/5 hover:border-purple-500/30 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold flex-shrink-0">
                          [{citation.number}]
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white mb-1 truncate">{citation.title}</h3>
                          <p className="text-sm text-gray-400 mb-2 line-clamp-2">{citation.snippet}</p>
                          <div className="flex items-center gap-2 text-xs text-purple-400">
                            <span>🔗</span>
                            <span className="truncate">{citation.url}</span>
                          </div>
                        </div>
                        <span className="text-gray-400 text-xl">→</span>
                      </div>
                    </motion.a>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <div className="text-4xl mb-4">📭</div>
                  <p>No external sources were cited in this investigation.</p>
                  <p className="text-sm mt-2">This report was generated using git history analysis only.</p>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-center gap-4 print:hidden">
          <Link
            to={`/dashboard/${id}`}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition"
          >
            📊 View Dashboard
          </Link>
          <Link
            to="/"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition"
          >
            🏛️ New Investigation
          </Link>
        </div>
      </main>

      {/* Print Footer */}
      <footer className="hidden print:block text-center py-8 border-t border-gray-200 mt-8">
        <p className="text-gray-500">Generated by Neural Archaeologist • {new Date().toLocaleDateString()}</p>
      </footer>
    </div>
  );
}

export default Report;