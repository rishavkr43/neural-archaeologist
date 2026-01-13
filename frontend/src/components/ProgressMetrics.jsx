import { motion } from 'framer-motion';

// Progress metrics display component - Dark theme (Compact)
const ProgressMetrics = ({ metrics }) => {
    // Cap values to prevent overflow
    const cappedMetrics = {
        commitsAnalyzed: Math.min(metrics.commitsAnalyzed, 200),
        sourcesFound: Math.min(metrics.sourcesFound, 10),
        roundsCompleted: Math.min(metrics.roundsCompleted, 3)
    };

    const progressItems = [
        {
            label: 'Artifacts',
            value: cappedMetrics.commitsAnalyzed,
            max: 200,
            color: 'from-blue-400 to-cyan-500',
            icon: '📜'
        },
        {
            label: 'Sources',
            value: cappedMetrics.sourcesFound,
            max: 10,
            color: 'from-green-400 to-emerald-500',
            icon: '🔮'
        },
        {
            label: 'Layers',
            value: cappedMetrics.roundsCompleted,
            max: 3,
            color: 'from-purple-400 to-pink-500',
            icon: '⛏️',
            suffix: '/3'
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 p-4"
        >
            <h3 className="text-xs font-medium text-gray-400 mb-3">Progress</h3>
            <div className="space-y-3">
                {progressItems.map((item, i) => (
                    <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400 flex items-center gap-1">
                                <span className="text-sm">{item.icon}</span>
                                {item.label}
                            </span>
                            <span className="text-white font-medium">
                                {item.value}{item.suffix || ''}
                            </span>
                        </div>
                        <div className="bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                                className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default ProgressMetrics;
