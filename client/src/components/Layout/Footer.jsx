import React from 'react';
import { Shield, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0b1120] border-t border-gray-800 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Shield className="w-4 h-4 text-red-500" />
            <span>ResQNet Disaster Response System</span>
          </div>
          <span className="hidden sm:inline text-gray-600">&bull;</span>
          <p className="text-xs text-gray-400 flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-blue-400" />
            <span>National Emergency: <strong>112</strong> | Police: <strong>100</strong> | Fire: <strong>101</strong> | Medical: <strong>108</strong></span>
          </p>
        </div>
        <div className="text-xs text-gray-500">
          &copy; {new Date().getFullYear()} ResQNet Emergency Operations Network. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
