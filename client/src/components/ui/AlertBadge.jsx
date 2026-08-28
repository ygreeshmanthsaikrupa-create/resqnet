import React from 'react';
import { Shield, Brain, Users, CheckCircle } from 'lucide-react';

const BADGE_TYPES = {
  official: { icon: Shield, label: 'Official Warning', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  ai_prediction: { icon: Brain, label: 'AI Prediction', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  community: { icon: Users, label: 'Community Report', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  verified_community: { icon: CheckCircle, label: 'Verified Report', color: 'bg-green-500/10 text-green-400 border-green-500/20' }
};

export default function AlertBadge({ type }) {
  const config = BADGE_TYPES[type] || BADGE_TYPES.community;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  );
}
