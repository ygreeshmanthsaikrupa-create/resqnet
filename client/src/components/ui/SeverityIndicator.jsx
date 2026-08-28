import React from 'react';

export default function SeverityIndicator({ level, score }) {
  let colorClass = 'bg-gray-500';
  let label = level || 'Low';
  let pulse = false;

  const numericScore = typeof score === 'number' ? score : null;
  
  if (numericScore !== null) {
    if (numericScore < 30) { colorClass = 'bg-green-500'; label = 'Low'; }
    else if (numericScore < 60) { colorClass = 'bg-yellow-500'; label = 'Medium'; }
    else if (numericScore < 85) { colorClass = 'bg-orange-500'; label = 'High'; }
    else { colorClass = 'bg-red-500'; label = 'Critical'; pulse = true; }
  } else if (level) {
    const lowerLevel = level.toLowerCase();
    if (lowerLevel === 'low') colorClass = 'bg-green-500';
    if (lowerLevel === 'medium') colorClass = 'bg-yellow-500';
    if (lowerLevel === 'high') colorClass = 'bg-orange-500';
    if (lowerLevel === 'critical') { colorClass = 'bg-red-500'; pulse = true; }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-3 w-3">
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorClass}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-3 w-3 ${colorClass}`}></span>
      </div>
      <span className="text-sm font-medium text-gray-300">
        {label} {numericScore !== null && <span className="text-gray-500 font-mono ml-1">({numericScore})</span>}
      </span>
    </div>
  );
}
