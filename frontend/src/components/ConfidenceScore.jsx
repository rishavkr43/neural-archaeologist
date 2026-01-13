import { motion } from 'framer-motion';

// Confidence score display component - Dark theme with dynamic updates
const ConfidenceScore = ({ confidence, status }) => {
    // Ensure confidence is a valid number
    const safeConfidence = typeof confidence === 'number' ? confidence : 0;

    const getConfidenceColor = () => {
        if (safeConfidence >= 80) return 'from-green-400 to-emerald-500';
        if (safeConfidence >= 60) return 'from-yellow-400 to-orange-500';
        if (safeConfidence >= 40) return 'from-orange-400 to-red-500';
        return 'from-red-400 to-rose-500';
    };

    const getGlowColor = () => {
        if (safeConfidence >= 80) return 'shadow-green-500/30';
        if (safeConfidence >= 60) return 'shadow-yellow-500/30';
        return 'shadow-red-500/30';
    };

    const getStatusMessage = () => {
        if (status === 'completed') {
            if (safeConfidence >= 80) return <span className="text-green-400">✓ Complete - High</span>;
            if (safeConfidence >= 60) return <span className="text-yellow-400">✓ Complete - Moderate</span>;
            return <span className="text-orange-400">✓ Complete - Low</span>;
        }

        if (status === 'failed') {
            return <span className="text-red-400">✕ Investigation failed</span>;
        }

        // Active investigation states
        if (safeConfidence === 0) {
            return (
                <span className="flex items-center gap-1 text-gray-400">
                    <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        🔍
                    </motion.span>
                    Starting...
                </span>
            );
        }

        if (safeConfidence < 40) {
            return (
                <span className="flex items-center gap-1 text-red-400">
                    <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
                        ⛏️
                    </motion.span>
                    Digging deeper...
                </span>
            );
        }

        if (safeConfidence < 70) {
            return (
                <span className="flex items-center gap-1 text-orange-400">
                    <motion.span animate={{ y: [0, -2, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
                        ⛏️
                    </motion.span>
                    Gathering evidence...
                </span>
            );
        }

        return <span className="text-green-400">✓ High confidence reached</span>;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 p-4"
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex-shrink-0">
                    <h3 className="text-xs font-medium text-gray-400 mb-1">Confidence</h3>
                    <motion.div
                        key={safeConfidence}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`text-4xl font-bold bg-gradient-to-r ${getConfidenceColor()} bg-clip-text text-transparent`}
                    >
                        {safeConfidence}%
                    </motion.div>
                </div>
                <div className="flex-1">
                    {/* Progress bar with segments showing target threshold */}
                    <div className="relative">
                        <div className={`bg-slate-800 rounded-full h-3 overflow-hidden shadow-lg ${getGlowColor()}`}>
                            {/* Background segments showing 70% threshold */}
                            <div className="absolute inset-0 flex">
                                <div className="w-[70%] border-r border-white/10"></div>
                            </div>
                            {/* Animated progress fill */}
                            <motion.div
                                key={`bar-${safeConfidence}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(safeConfidence, 100)}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className={`h-full bg-gradient-to-r ${getConfidenceColor()} relative z-10`}
                            />
                        </div>
                        {/* Threshold marker */}
                        <div className="absolute top-0 left-[70%] h-3 w-px bg-white/30" />
                    </div>

                    {/* Status and threshold labels */}
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">
                            {getStatusMessage()}
                        </p>
                        {status !== 'completed' && status !== 'failed' && (
                            <span className="text-[10px] text-gray-600">
                                Target: 70%
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ConfidenceScore;
