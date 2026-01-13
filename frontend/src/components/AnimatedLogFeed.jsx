import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Animated log feed with staggered opacity fading
const AnimatedLogFeed = ({ logs, getAgentIcon, getAgentColor, getAgentTextColor }) => {
    const containerRef = useRef(null);
    const bottomRef = useRef(null);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [logs.length]);

    // Calculate opacity based on message position (newest = 100%, older fades)
    const getOpacity = (index, total) => {
        const reverseIndex = total - 1 - index; // 0 = newest
        if (reverseIndex === 0) return 1;
        if (reverseIndex === 1) return 0.95;
        if (reverseIndex === 2) return 0.85;
        if (reverseIndex === 3) return 0.7;
        if (reverseIndex === 4) return 0.55;
        if (reverseIndex === 5) return 0.4;
        return 0.25;
    };

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide"
        >
            {logs.length === 0 ? (
                <div className="text-center text-purple-300 py-12">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-4xl mb-4"
                    >
                        ⏳
                    </motion.div>
                    <p>Waiting for agents to start...</p>
                </div>
            ) : (
                <>
                    <AnimatePresence initial={false}>
                        {logs.map((log, index) => (
                            <motion.div
                                key={`${log.timestamp}-${index}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{
                                    opacity: getOpacity(index, logs.length),
                                    x: 0,
                                }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{
                                    duration: 0.3,
                                    ease: 'easeOut',
                                    opacity: { duration: 0.5 }
                                }}
                                className={`p-3 rounded-lg border-l-4 ${getAgentColor(log.agent)}`}
                            >
                                <div className="flex items-start gap-3">
                                    <motion.span
                                        className="text-xl flex-shrink-0"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                    >
                                        {getAgentIcon(log.agent)}
                                    </motion.span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`font-semibold capitalize ${getAgentTextColor(log.agent)}`}>
                                                {log.agent}
                                            </span>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {new Date(log.timestamp + (log.timestamp.endsWith('Z') ? '' : 'Z')).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300 mt-1 break-words">{log.message}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {/* Scroll anchor */}
                    <div ref={bottomRef} className="h-1" />
                </>
            )}
        </div>
    );
};

export default AnimatedLogFeed;
