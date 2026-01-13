import { motion, AnimatePresence } from 'framer-motion';

// Animated hypothesis component with fade/slide transitions - Dark theme (Compact)
const AnimatedHypothesis = ({ hypothesis }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 p-4 overflow-hidden"
        >
            <h3 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                <span>🔮</span>
                Hypothesis
            </h3>
            <div className="relative min-h-[40px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={hypothesis || 'placeholder'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="text-white text-sm leading-relaxed line-clamp-3"
                    >
                        {hypothesis || (
                            <span className="flex items-center gap-1 text-gray-500 text-xs">
                                <motion.span
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    ⏳
                                </motion.span>
                                Analyzing artifacts...
                            </span>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default AnimatedHypothesis;
