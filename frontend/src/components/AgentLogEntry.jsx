// Agent log entry component
const AgentLogEntry = ({ log, getAgentIcon, getAgentColor, getAgentTextColor }) => (
    <div className={`p-3 rounded-lg border-l-4 ${getAgentColor(log.agent)} animate-fadeIn`}>
        <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">{getAgentIcon(log.agent)}</span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className={`font-semibold capitalize ${getAgentTextColor(log.agent)}`}>
                        {log.agent}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                </div>
                <p className="text-sm text-gray-700 mt-1 break-words">{log.message}</p>
            </div>
        </div>
    </div>
);

export default AgentLogEntry;
