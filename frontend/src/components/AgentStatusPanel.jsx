import { motion } from 'framer-motion';

// Agent status indicators component - Dark theme
const AgentStatusPanel = ({ agentStatus, status }) => {
    const getStatusColor = (agentState) => ({
        active: 'bg-green-500 shadow-green-500/50',
        waiting: 'bg-yellow-500 shadow-yellow-500/50',
        completed: 'bg-purple-500 shadow-purple-500/50',
        idle: 'bg-gray-600'
    }[agentState] || 'bg-gray-600');

    const getStatusLabel = (agentState) => ({
        active: 'Active',
        waiting: 'Waiting',
        completed: 'Done',
        idle: 'Idle'
    }[agentState] || 'Idle');

    const agents = [
        { key: 'coordinator', name: 'Coordinator', icon: '🎯' },
        { key: 'scout', name: 'Scout', icon: '🔍' },
        { key: 'analyst', name: 'Analyst', icon: '🧠' },
        { key: 'narrator', name: 'Narrator', icon: '📝' },
    ];

    // Check if investigation is complete
    const isComplete = status === 'completed' || status === 'failed';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 p-5"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <span>👥</span>
                    Agent Team
                </h3>
                {isComplete && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                        ✓ All Done
                    </span>
                )}
            </div>
            <div className="grid grid-cols-2 gap-2">
                {agents.map((agent) => {
                    const agentState = agentStatus[agent.key];
                    return (
                        <motion.div
                            key={agent.key}
                            whileHover={{ scale: 1.02 }}
                            className={`flex items-center gap-2 rounded-xl px-3 py-2 border transition-all ${agentState === 'active'
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : agentState === 'completed'
                                        ? 'bg-purple-500/10 border-purple-500/20'
                                        : 'bg-white/5 border-white/5'
                                }`}
                        >
                            <span className="text-base">{agent.icon}</span>
                            <div className="flex-1 min-w-0">
                                <span className="text-white text-xs font-medium block truncate">{agent.name}</span>
                                <span className={`text-[10px] capitalize ${agentState === 'active' ? 'text-green-400' :
                                        agentState === 'completed' ? 'text-purple-400' :
                                            agentState === 'waiting' ? 'text-yellow-400' :
                                                'text-gray-500'
                                    }`}>
                                    {getStatusLabel(agentState)}
                                </span>
                            </div>
                            <motion.span
                                animate={agentState === 'active' ? { scale: [1, 1.4, 1] } : {}}
                                transition={{ duration: 1, repeat: Infinity }}
                                className={`w-2 h-2 rounded-full shadow-lg ${getStatusColor(agentState)}`}
                            />
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default AgentStatusPanel;
