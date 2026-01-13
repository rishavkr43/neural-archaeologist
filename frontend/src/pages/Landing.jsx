import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { investigations } from '../services/api';
import useStore from '../store/useStore';

// Typewriter effect hook
const useTypewriter = (text, speed = 50) => {
    const [displayText, setDisplayText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        let i = 0;
        setDisplayText('');
        setIsComplete(false);
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayText(text.slice(0, i + 1));
                i++;
            } else {
                setIsComplete(true);
                clearInterval(timer);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return { displayText, isComplete };
};

// Floating particle component
const FloatingParticle = ({ delay, duration, x, y, size }) => (
    <motion.div
        className="absolute rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-sm"
        style={{ width: size, height: size, left: x, top: y }}
        animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: 'easeInOut',
        }}
    />
);

// Counter animation component
const AnimatedCounter = ({ value, suffix = '', duration = 2 }) => {
    const [count, setCount] = useState(0);
    const ref = useState(null);

    useEffect(() => {
        const numValue = parseInt(value.replace(/\D/g, ''));
        let start = 0;
        const increment = numValue / (duration * 60);
        const timer = setInterval(() => {
            start += increment;
            if (start >= numValue) {
                setCount(numValue);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 1000 / 60);
        return () => clearInterval(timer);
    }, [value, duration]);

    return <>{count.toLocaleString()}{suffix}</>;
};

function Landing() {
    const [repoUrl, setRepoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const isAuthenticated = useStore((state) => state.isAuthenticated);

    const { displayText, isComplete } = useTypewriter('Archaeological AI Digs Through Git History', 40);

    const exampleRepos = [
        {
            name: 'Uber Pyflame',
            url: 'https://github.com/uber/pyflame',
            description: 'Abandoned Python profiler from Uber',
            icon: '🔥',
        },
        {
            name: 'Docker Fig',
            url: 'https://github.com/docker/fig',
            description: 'The predecessor to Docker Compose',
            icon: '🐳',
        },
        {
            name: 'Parse Server',
            url: 'https://github.com/parse-community/parse-server',
            description: 'Resurrected backend platform',
            icon: '☁️',
        },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            navigate('/login', { state: { returnUrl: '/', repoUrl } });
            return;
        }
        startInvestigation(repoUrl);
    };

    const startInvestigation = async (url) => {
        setError('');
        setLoading(true);
        try {
            const response = await investigations.create(url);
            navigate(`/dashboard/${response.data.id}`);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to start investigation');
        } finally {
            setLoading(false);
        }
    };

    const handleExampleClick = (url) => {
        if (!isAuthenticated) {
            navigate('/login', { state: { returnUrl: '/', repoUrl: url } });
            return;
        }
        startInvestigation(url);
    };

    return (
        <div className="min-h-screen bg-slate-950 overflow-hidden">
            {/* Animated gradient background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950" />

                {/* Animated gradient orbs */}
                <motion.div
                    className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl"
                    animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-1/4 -right-32 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl"
                    animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1.1, 1, 1.1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Floating particles */}
                <FloatingParticle delay={0} duration={4} x="10%" y="20%" size={60} />
                <FloatingParticle delay={1} duration={5} x="80%" y="30%" size={40} />
                <FloatingParticle delay={2} duration={6} x="60%" y="70%" size={50} />
                <FloatingParticle delay={0.5} duration={4.5} x="20%" y="60%" size={30} />
                <FloatingParticle delay={1.5} duration={5.5} x="70%" y="15%" size={35} />

                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                        backgroundSize: '50px 50px',
                    }}
                />
            </div>

            {/* Navbar */}
            <nav className="relative z-10 bg-black/20 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <motion.div
                        className="flex items-center space-x-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="text-3xl">🏛️</span>
                        <span className="text-xl font-bold text-white">Neural Archaeologist</span>
                    </motion.div>
                    <motion.div
                        className="flex items-center space-x-4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {isAuthenticated ? (
                            <>
                                <Link to="/history" className="text-gray-300 hover:text-white transition font-medium">
                                    History
                                </Link>
                                <button
                                    onClick={() => useStore.getState().logout()}
                                    className="text-gray-300 hover:text-white transition font-medium"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-300 hover:text-white transition font-medium">
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2 rounded-lg font-medium hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </motion.div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    {/* Pre-headline */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-8"
                    >
                        <span className="animate-pulse">●</span>
                        AI-Powered Code Archaeology
                    </motion.div>

                    {/* Main headline with typewriter */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
                    >
                        Uncover the Hidden History of
                        <br />
                        <span className="relative">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-pulse">
                                Dead Code
                            </span>
                            {/* Glow effect */}
                            <span className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 blur-2xl opacity-50">
                                Dead Code
                            </span>
                        </span>
                    </motion.h1>

                    {/* Typewriter subheadline */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-xl text-gray-400 max-w-3xl mx-auto mb-4 h-8"
                    >
                        {displayText}
                        {!isComplete && <span className="animate-pulse">|</span>}
                    </motion.p>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="text-lg text-gray-500 max-w-2xl mx-auto mb-10"
                    >
                        Your senior dev quit. Their genius is still in the git history.
                        Let AI agents excavate it
                    </motion.p>

                    {/* Glassmorphism Search Bar */}
                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="relative p-1 rounded-2xl bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-purple-500/50">
                            <div className="flex gap-2 p-2 bg-slate-900/90 backdrop-blur-xl rounded-xl">
                                <input
                                    type="url"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                    placeholder="https://github.com/owner/repository"
                                    className="flex-1 px-5 py-4 text-lg bg-transparent text-white placeholder-gray-500 outline-none"
                                    required
                                />
                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-lg shadow-purple-500/25"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="animate-spin">⏳</span> Digging...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            ⛏️ Start Dig
                                        </span>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg"
                            >
                                {error}
                            </motion.div>
                        )}
                    </motion.form>
                </div>

                {/* Stats with counter animation */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-20"
                >
                    {[
                        { value: '847000', suffix: '+', label: 'Commits Analyzed', icon: '📊' },
                        { value: '90', suffix: '%+', label: 'Avg Confidence', icon: '🎯' },
                        { value: '3', suffix: ' min', label: 'Investigation Time', icon: '⚡' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative">
                                <span className="text-2xl mb-2 block">{stat.icon}</span>
                                <div className="text-3xl font-bold text-white mb-1">
                                    <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={2 + i * 0.5} />
                                </div>
                                <div className="text-gray-400">{stat.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Example Repos - Bento Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1 }}
                    className="max-w-4xl mx-auto mb-20"
                >
                    <h2 className="text-2xl font-bold text-white text-center mb-2">
                        Famous Cold Cases
                    </h2>
                    <p className="text-gray-500 text-center mb-8">Try investigating these abandoned repositories</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {exampleRepos.map((repo, i) => (
                            <motion.button
                                key={repo.url}
                                onClick={() => handleExampleClick(repo.url)}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 1.1 + i * 0.1 }}
                                whileHover={{ y: -5 }}
                                className="group relative bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all text-left overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="text-3xl mb-3 block">{repo.icon}</span>
                                <h3 className="font-bold text-lg text-white mb-2 group-hover:text-purple-300 transition">
                                    {repo.name}
                                </h3>
                                <p className="text-gray-500 text-sm mb-4">{repo.description}</p>
                                <div className="flex items-center gap-2 text-purple-400 text-sm font-medium group-hover:text-purple-300">
                                    Investigate <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* How It Works - Timeline */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.3 }}
                    className="max-w-5xl mx-auto"
                >
                    <h2 className="text-3xl font-bold text-white text-center mb-4">
                        The Excavation Process
                    </h2>
                    <p className="text-gray-500 text-center mb-12">Four AI agents working in harmony</p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                        {/* Connecting line */}
                        <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-500/50 via-purple-500/50 via-pink-500/50 to-yellow-500/50" />

                        {[
                            { icon: '🔍', name: 'Scout Agent', desc: 'Excavates git history & web sources', color: 'blue', delay: 0 },
                            { icon: '🧠', name: 'Analyst Agent', desc: 'Detects patterns & forms hypotheses', color: 'purple', delay: 0.1 },
                            { icon: '📝', name: 'Narrator Agent', desc: 'Crafts the archaeological report', color: 'pink', delay: 0.2 },
                            { icon: '🎯', name: 'Coordinator', desc: 'Orchestrates until confident', color: 'yellow', delay: 0.3 },
                        ].map((agent, i) => (
                            <motion.div
                                key={agent.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 1.4 + agent.delay }}
                                className="relative text-center"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-${agent.color}-500/20 border border-${agent.color}-500/30 flex items-center justify-center text-3xl shadow-lg shadow-${agent.color}-500/20`}
                                >
                                    {agent.icon}
                                </motion.div>
                                <h3 className="font-bold text-white mb-2">{agent.name}</h3>
                                <p className="text-gray-500 text-sm">{agent.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 bg-black/30 backdrop-blur-xl border-t border-white/5 py-8 mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-gray-500">
                        © 2026 Neural Archaeologist. All rights reserved.
                        <br />
                        Built with zeal🍉
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default Landing;