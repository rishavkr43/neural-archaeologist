import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { investigations } from '../services/api';
import socketService from '../services/socket';

// Import components
import ConfidenceScore from '../components/ConfidenceScore';
import ProgressMetrics from '../components/ProgressMetrics';
import AgentStatusPanel from '../components/AgentStatusPanel';
import AnimatedHypothesis from '../components/AnimatedHypothesis';
import AnimatedLogFeed from '../components/AnimatedLogFeed';

function Dashboard() {
    const { id } = useParams();
    const navigate = useNavigate();

    // State
    const [investigation, setInvestigation] = useState(null);
    const [logs, setLogs] = useState([]);
    const [confidence, setConfidence] = useState(0);
    const [status, setStatus] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [hypothesis, setHypothesis] = useState('');
    const [metrics, setMetrics] = useState({ commitsAnalyzed: 0, sourcesFound: 0, roundsCompleted: 0 });
    const [agentStatus, setAgentStatus] = useState({
        coordinator: 'idle',
        scout: 'idle',
        analyst: 'idle',
        narrator: 'idle'
    });

    // Helper functions - Dark theme colors
    const getAgentIcon = (agent) => ({
        coordinator: '🎯',
        scout: '🔍',
        analyst: '🧠',
        narrator: '📝'
    }[agent] || '📋');

    const getAgentColor = (agent) => ({
        coordinator: 'border-l-blue-400 bg-blue-500/10',
        scout: 'border-l-green-400 bg-green-500/10',
        analyst: 'border-l-amber-400 bg-amber-500/10',
        narrator: 'border-l-purple-400 bg-purple-500/10'
    }[agent] || 'border-l-gray-400 bg-gray-500/10');

    const getAgentTextColor = (agent) => ({
        coordinator: 'text-blue-300',
        scout: 'text-green-300',
        analyst: 'text-amber-300',
        narrator: 'text-purple-300'
    }[agent] || 'text-gray-300');

    // Initial fetch and WebSocket setup
    useEffect(() => {
        const fetchInvestigation = async () => {
            try {
                const response = await investigations.get(id);
                setInvestigation(response.data);
                setStatus(response.data.status);
                setConfidence(response.data.confidence || 0);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch investigation:', error);
                setLoading(false);
            }
        };

        fetchInvestigation();
        socketService.connect();
        socketService.subscribe(id);

        socketService.on('agent_message', (data) => {
            if (data.investigation_id === id) {
                setLogs((prev) => [...prev, {
                    agent: data.agent_name,
                    message: data.message,
                    data: data.data,
                    timestamp: new Date().toISOString(),
                }]);
                setAgentStatus(prev => ({ ...prev, [data.agent_name]: 'active' }));
            }
        });

        socketService.on('confidence_update', (data) => {
            if (data.investigation_id === id) setConfidence(data.confidence);
        });

        socketService.on('investigation_complete', (data) => {
            if (data.investigation_id === id) setStatus('completed');
        });

        socketService.on('investigation_error', (data) => {
            if (data.investigation_id === id) setStatus('failed');
        });

        return () => {
            socketService.unsubscribe(id);
            socketService.off('agent_message');
            socketService.off('confidence_update');
            socketService.off('investigation_complete');
            socketService.off('investigation_error');
        };
    }, [id, navigate]);

    // Polling for logs and status
    useEffect(() => {
        const pollData = async () => {
            try {
                const logsResponse = await investigations.getLogs(id);
                const logsData = logsResponse.data.map(log => ({
                    agent: log.agent_name,
                    message: log.message,
                    data: log.data,
                    timestamp: log.timestamp
                }));
                setLogs(logsData);

                let commitsCount = 0;
                let sourcesCount = 0;
                let currentHypothesis = '';
                const activeAgents = new Set();

                logsData.forEach(log => {
                    activeAgents.add(log.agent);
                    // Extract confidence from log data
                    if (log.data?.confidence !== undefined) {
                        setConfidence(log.data.confidence);
                    }
                    // Also extract confidence from log messages (e.g., "Confidence score: 65%")
                    const confMatch = log.message.match(/[Cc]onfidence[:\s]+(\d+)%?/);
                    if (confMatch) {
                        setConfidence(parseInt(confMatch[1]));
                    }
                    if (log.agent === 'analyst' && log.message.includes('Analysis complete:')) {
                        currentHypothesis = log.message.replace('Analysis complete: ', '');
                    }
                    if (log.message.includes('commits')) {
                        const match = log.message.match(/(\d+)\s*commits/);
                        if (match) commitsCount = parseInt(match[1]);
                    }
                    if (log.message.includes('Scraping') || log.message.includes('sources')) {
                        sourcesCount++;
                    }
                });

                if (currentHypothesis) setHypothesis(currentHypothesis);

                const scoutLogs = logsData.filter(l => l.agent === 'scout' && l.message.includes('activated'));
                setMetrics({
                    commitsAnalyzed: commitsCount,
                    sourcesFound: Math.min(sourcesCount, 10),
                    roundsCompleted: Math.min(scoutLogs.length, 3)
                });

                // Update agent statuses based on investigation status
                const invResponse = await investigations.get(id);
                const currentStatus = invResponse.data.status;
                setStatus(currentStatus);

                // Only update confidence from backend if it's non-zero, 
                // effectively preventing flickering if backend state lags behind logs
                if (invResponse.data.confidence && invResponse.data.confidence > 0) {
                    setConfidence(invResponse.data.confidence);
                } else if (invResponse.data.confidence === 0 && currentStatus === 'completed') {
                    // Only set to 0 if completed and actually 0
                    setConfidence(0);
                }

                // If completed or failed, set all agents to idle/completed
                if (currentStatus === 'completed' || currentStatus === 'failed') {
                    setAgentStatus({
                        coordinator: 'completed',
                        scout: 'completed',
                        analyst: 'completed',
                        narrator: 'completed'
                    });
                } else {
                    // Active investigation - calculate from recent logs
                    const recentAgents = logsData.slice(-5).map(l => l.agent);
                    setAgentStatus({
                        coordinator: recentAgents.includes('coordinator') ? 'active' : (activeAgents.has('coordinator') ? 'waiting' : 'idle'),
                        scout: recentAgents.includes('scout') ? 'active' : (activeAgents.has('scout') ? 'waiting' : 'idle'),
                        analyst: recentAgents.includes('analyst') ? 'active' : (activeAgents.has('analyst') ? 'waiting' : 'idle'),
                        narrator: recentAgents.includes('narrator') ? 'active' : (activeAgents.has('narrator') ? 'waiting' : 'idle')
                    });
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        };

        const interval = setInterval(() => {
            if (status === 'processing' || status === 'pending') pollData();
        }, 2000);

        pollData();
        return () => clearInterval(interval);
    }, [id, status, navigate]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0">
                    <motion.div
                        className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute bottom-1/4 -right-32 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl"
                        animate={{ scale: [1.2, 1, 1.2] }}
                        transition={{ duration: 5, repeat: Infinity }}
                    />
                </div>
                <div className="text-center relative z-10">
                    <motion.div
                        className="text-6xl mb-6"
                        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        ⛏️
                    </motion.div>
                    <p className="text-purple-300 text-lg">Preparing excavation site...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 overflow-hidden relative">
            {/* Animated background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950" />
                <motion.div
                    className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl"
                    animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-3xl"
                    animate={{ x: [0, -30, 0], y: [0, -50, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
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
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 bg-black/40 backdrop-blur-xl border-b border-white/5 sticky top-0"
            >
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                                <span className="text-3xl">🏛️</span>
                                Excavation in Progress
                                <motion.span
                                    animate={{ opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className={`text-xs px-3 py-1 rounded-full font-medium ${status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                        status === 'processing' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                            status === 'failed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                        }`}
                                >
                                    {status === 'processing' ? '⛏️ DIGGING' : status.toUpperCase()}
                                </motion.span>
                            </h1>
                            <p className="text-sm text-gray-400 mt-1 font-mono truncate max-w-lg">
                                {investigation?.repo_url}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {status === 'completed' && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate(`/report/${id}`)}
                                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all"
                                >
                                    📜 View Report
                                </motion.button>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/history')}
                                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-all border border-white/10"
                            >
                                ← Archives
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: 'calc(100vh - 140px)' }}>

                    {/* LEFT PANEL - Investigation Log */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 flex flex-col overflow-hidden"
                    >
                        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3 flex-shrink-0">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50"
                            />
                            <h2 className="text-lg font-semibold text-white">Live Excavation Feed</h2>
                            {/* Animated pickaxe when processing */}
                            {(status === 'pending' || status === 'processing') && (
                                <motion.span
                                    animate={{ rotate: [0, -30, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                                    className="text-lg origin-bottom-right inline-block"
                                >
                                    ⛏️
                                </motion.span>
                            )}
                            <span className="text-xs text-purple-400 ml-auto bg-purple-500/10 px-3 py-1 rounded-full">
                                {logs.length} discoveries
                            </span>
                        </div>

                        <AnimatedLogFeed
                            logs={logs}
                            getAgentIcon={getAgentIcon}
                            getAgentColor={getAgentColor}
                            getAgentTextColor={getAgentTextColor}
                        />
                    </motion.div>

                    {/* RIGHT PANEL - Metrics */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-3 overflow-y-auto scrollbar-hide"
                    >
                        {/* Agent Status at top for visibility */}
                        <AgentStatusPanel agentStatus={agentStatus} status={status} />
                        <ConfidenceScore confidence={confidence} status={status} />
                        <AnimatedHypothesis hypothesis={hypothesis} />
                        <ProgressMetrics metrics={metrics} />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;