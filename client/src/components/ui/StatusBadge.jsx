import React from 'react';

const STATUS_CONFIG = {
  submitted: { label: 'Submitted', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  under_verification: { label: 'Verifying', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  verified: { label: 'Verified', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  resolved: { label: 'Resolved', color: 'bg-green-500/10 text-green-400 border-green-500/20' }
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}
