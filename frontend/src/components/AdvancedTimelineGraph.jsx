import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ComposedChart,
    Area,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Scatter,
    Legend,
} from 'recharts';

// Custom gradient definitions component
const GradientDefs = () => (
    <defs>
        {/* Primary area gradient */}
        <linearGradient id="commitGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.6} />
            <stop offset="50%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
        </linearGradient>

        {/* Line glow gradient */}
        <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>

        {/* Contributor gradient */}
        <linearGradient id="contributorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#0891b2" stopOpacity={0.1} />
        </linearGradient>

        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>

        {/* Drop shadow */}
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#a855f7" floodOpacity="0.3" />
        </filter>
    </defs>
);

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 shadow-2xl"
        >
            <p className="text-purple-300 font-semibold mb-2">{label}</p>
            <div className="space-y-1">
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-gray-400 text-sm">{entry.name}:</span>
                        <span className="text-white font-medium">{entry.value}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

// Milestone marker component
const MilestoneMarker = ({ cx, cy, type, label }) => {
    const getMarkerStyle = () => ({
        birth: { color: '#22c55e', icon: '🌱' },
        peak: { color: '#f59e0b', icon: '🚀' },
        decline: { color: '#ef4444', icon: '📉' },
        present: { color: '#a855f7', icon: '🔬' },
    }[type] || { color: '#6b7280', icon: '📌' });

    const style = getMarkerStyle();

    return (
        <g>
            {/* Outer glow ring */}
            <circle
                cx={cx}
                cy={cy}
                r={16}
                fill="none"
                stroke={style.color}
                strokeWidth={2}
                opacity={0.3}
            />
            {/* Inner circle */}
            <circle
                cx={cx}
                cy={cy}
                r={10}
                fill={style.color}
                filter="url(#glow)"
            />
            {/* Pulse animation */}
            <circle cx={cx} cy={cy} r={10} fill={style.color} opacity={0.5}>
                <animate
                    attributeName="r"
                    values="10;18;10"
                    dur="2s"
                    repeatCount="indefinite"
                />
                <animate
                    attributeName="opacity"
                    values="0.5;0;0.5"
                    dur="2s"
                    repeatCount="indefinite"
                />
            </circle>
        </g>
    );
};

const AdvancedTimelineGraph = ({ scoutData, timeline, milestones }) => {
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [selectedPhase, setSelectedPhase] = useState(null);

    // Process commits_by_month data for the chart
    const chartData = useMemo(() => {
        const commitsByMonth = scoutData?.commits_by_month || {};
        const sortedMonths = Object.entries(commitsByMonth).sort((a, b) => a[0].localeCompare(b[0]));

        if (sortedMonths.length === 0) return [];

        // Calculate cumulative contributors and activity score
        let cumulativeContributors = new Set();
        const topContributors = scoutData?.top_contributors || [];

        // Get all unique contributors from top contributors
        topContributors.forEach(c => cumulativeContributors.add(c.name));
        const totalContributors = scoutData?.contributors_count || cumulativeContributors.size;

        // Calculate average for activity score
        const avgCommits = sortedMonths.reduce((sum, [_, v]) => sum + v, 0) / sortedMonths.length;

        return sortedMonths.map(([month, commits], index) => {
            // Estimate contributors growth over time (linear interpolation)
            const contributorEstimate = Math.ceil((index + 1) / sortedMonths.length * totalContributors);

            // Activity score (normalized 0-100)
            const activityScore = Math.min(100, Math.round((commits / avgCommits) * 50));

            // Determine phase
            const progress = index / (sortedMonths.length - 1);
            let phase = 'growth';
            if (progress < 0.2) phase = 'birth';
            else if (progress < 0.5) phase = 'golden';
            else if (progress < 0.8) phase = 'mature';
            else phase = 'decline';

            // Find if this month has a milestone
            const milestoneEvent = timeline?.find(t => t.date?.startsWith(month));

            return {
                month,
                monthLabel: new Date(month + '-01').toLocaleDateString('en-US', {
                    year: '2-digit',
                    month: 'short'
                }),
                commits,
                contributors: contributorEstimate,
                activityScore,
                phase,
                milestone: milestoneEvent ? milestoneEvent.type : null,
                milestoneEvent,
            };
        });
    }, [scoutData, timeline]);

    // Calculate phase regions for vertical reference lines
    const phaseMarkers = useMemo(() => {
        if (chartData.length === 0) return [];

        const birthEnd = Math.floor(chartData.length * 0.2);
        const goldenEnd = Math.floor(chartData.length * 0.5);
        const matureEnd = Math.floor(chartData.length * 0.8);

        return [
            { index: birthEnd, label: 'Growth Phase', color: '#22c55e' },
            { index: goldenEnd, label: 'Golden Age', color: '#f59e0b' },
            { index: matureEnd, label: 'Maturity', color: '#6366f1' },
        ];
    }, [chartData]);

    // Get max values for scaling
    const maxCommits = Math.max(...chartData.map(d => d.commits), 1);
    const maxContributors = Math.max(...chartData.map(d => d.contributors), 1);

    if (chartData.length === 0) {
        return (
            <div className="text-center text-gray-400 py-12">
                <div className="text-4xl mb-4">📊</div>
                <p>No timeline data available for visualization.</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Graph container with glassmorphism */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 relative overflow-hidden">
                {/* Background circuit pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `
              linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px)
            `,
                        backgroundSize: '20px 20px',
                    }}
                />

                {/* Header */}
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>📈</span>
                            Excavation Timeline
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                            Multi-axis activity visualization
                        </p>
                    </div>

                    {/* Legend badges */}
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1.5 rounded-full">
                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                            <span className="text-xs text-purple-300">Commits</span>
                        </div>
                        <div className="flex items-center gap-2 bg-cyan-500/20 px-3 py-1.5 rounded-full">
                            <div className="w-3 h-3 rounded-full bg-cyan-500" />
                            <span className="text-xs text-cyan-300">Contributors</span>
                        </div>
                    </div>
                </div>

                {/* Main Chart */}
                <div className="h-[400px] relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={chartData}
                            margin={{ top: 20, right: 60, left: 20, bottom: 20 }}
                            onMouseMove={(e) => {
                                if (e?.activePayload?.[0]) {
                                    setHoveredPoint(e.activePayload[0].payload);
                                }
                            }}
                            onMouseLeave={() => setHoveredPoint(null)}
                        >
                            <GradientDefs />

                            {/* Animated grid */}
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(168, 85, 247, 0.1)"
                                vertical={false}
                            />

                            {/* X-Axis - Time */}
                            <XAxis
                                dataKey="monthLabel"
                                stroke="#6b7280"
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                tickLine={false}
                                axisLine={{ stroke: 'rgba(168, 85, 247, 0.3)' }}
                                interval="preserveStartEnd"
                            />

                            {/* Y-Axis Left - Commits */}
                            <YAxis
                                yAxisId="commits"
                                stroke="#a855f7"
                                tick={{ fill: '#a855f7', fontSize: 11 }}
                                tickLine={false}
                                axisLine={{ stroke: 'rgba(168, 85, 247, 0.3)' }}
                                label={{
                                    value: 'Commits',
                                    angle: -90,
                                    position: 'insideLeft',
                                    fill: '#a855f7',
                                    fontSize: 12
                                }}
                            />

                            {/* Y-Axis Right - Contributors */}
                            <YAxis
                                yAxisId="contributors"
                                orientation="right"
                                stroke="#06b6d4"
                                tick={{ fill: '#06b6d4', fontSize: 11 }}
                                tickLine={false}
                                axisLine={{ stroke: 'rgba(6, 182, 212, 0.3)' }}
                                label={{
                                    value: 'Team Size',
                                    angle: 90,
                                    position: 'insideRight',
                                    fill: '#06b6d4',
                                    fontSize: 12
                                }}
                            />

                            {/* Phase divider lines */}
                            {phaseMarkers.map((marker, i) => (
                                chartData[marker.index] && (
                                    <ReferenceLine
                                        key={i}
                                        x={chartData[marker.index].monthLabel}
                                        stroke={marker.color}
                                        strokeDasharray="5 5"
                                        strokeOpacity={0.5}
                                        yAxisId="commits"
                                    />
                                )
                            ))}

                            {/* Background area - Commit volume */}
                            <Area
                                yAxisId="commits"
                                type="monotone"
                                dataKey="commits"
                                fill="url(#commitGradient)"
                                stroke="none"
                                animationDuration={2000}
                                animationBegin={0}
                            />

                            {/* Contributors area */}
                            <Area
                                yAxisId="contributors"
                                type="monotone"
                                dataKey="contributors"
                                fill="url(#contributorGradient)"
                                stroke="none"
                                animationDuration={2000}
                                animationBegin={500}
                            />

                            {/* Main activity line with glow */}
                            <Line
                                yAxisId="commits"
                                type="monotone"
                                dataKey="commits"
                                stroke="url(#lineGlow)"
                                strokeWidth={3}
                                dot={false}
                                activeDot={{
                                    r: 8,
                                    fill: '#a855f7',
                                    stroke: '#fff',
                                    strokeWidth: 2,
                                    filter: 'url(#glow)'
                                }}
                                animationDuration={2000}
                                animationBegin={0}
                            />

                            {/* Contributors line */}
                            <Line
                                yAxisId="contributors"
                                type="monotone"
                                dataKey="contributors"
                                stroke="#06b6d4"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                animationDuration={2000}
                                animationBegin={800}
                            />

                            {/* Custom tooltip */}
                            <Tooltip content={<CustomTooltip />} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* Phase labels */}
                <div className="flex justify-between mt-4 px-4 relative z-10">
                    {[
                        { label: 'Birth', color: 'text-green-400', icon: '🌱' },
                        { label: 'Golden Age', color: 'text-yellow-400', icon: '🚀' },
                        { label: 'Maturity', color: 'text-blue-400', icon: '⚙️' },
                        { label: 'Decline', color: 'text-red-400', icon: '📉' },
                    ].map((phase, i) => (
                        <div key={i} className={`text-center ${phase.color}`}>
                            <span className="text-lg">{phase.icon}</span>
                            <p className="text-xs mt-1">{phase.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Milestone Events Below Graph */}
            {timeline && timeline.length > 0 && (
                <div className="mt-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span>⭐</span>
                        Key Milestones
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {timeline.map((event, index) => {
                            const typeStyles = {
                                birth: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', icon: '🌱' },
                                peak: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: '🚀' },
                                decline: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', icon: '📉' },
                                present: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', icon: '🔬' },
                            };
                            const style = typeStyles[event.type] || typeStyles.present;

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    className={`${style.bg} ${style.border} border rounded-xl p-4 cursor-pointer`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">{style.icon}</span>
                                        <span className={`font-semibold ${style.text}`}>{event.event}</span>
                                    </div>
                                    <p className="text-gray-400 text-sm">{event.description}</p>
                                    <p className="text-gray-500 text-xs mt-2">
                                        {new Date(event.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Activity stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Peak Activity',
                        value: `${maxCommits} commits/mo`,
                        icon: '🔥',
                        color: 'text-orange-400'
                    },
                    {
                        label: 'Total Months',
                        value: chartData.length,
                        icon: '📅',
                        color: 'text-blue-400'
                    },
                    {
                        label: 'Avg Commits',
                        value: Math.round(chartData.reduce((s, d) => s + d.commits, 0) / chartData.length),
                        icon: '📊',
                        color: 'text-purple-400'
                    },
                    {
                        label: 'Team Growth',
                        value: `${maxContributors} devs`,
                        icon: '👥',
                        color: 'text-cyan-400'
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="bg-white/5 rounded-xl p-4 border border-white/5"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span>{stat.icon}</span>
                            <span className="text-gray-400 text-sm">{stat.label}</span>
                        </div>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default AdvancedTimelineGraph;
