import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Brain, Bell, Map as MapIcon, Users, Cross, Target, ArrowRight } from 'lucide-react';

export default function Landing() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const features = [
    { icon: Brain, title: "Predictive Intelligence", desc: "AI-powered risk scoring and trend analysis" },
    { icon: Bell, title: "Real-Time Alerts", desc: "Instant notifications for critical situations" },
    { icon: MapIcon, title: "Interactive Map", desc: "Live visualization of risks, reports, and resources" },
    { icon: Users, title: "Community Reporting", desc: "Citizens as first-level information providers" },
    { icon: Cross, title: "Emergency Resources", desc: "Find nearest shelters, hospitals, and aid" },
    { icon: Target, title: "Smart Prioritization", desc: "Intelligent incident priority scoring" }
  ];

  return (
    <div className="flex-1 w-full overflow-hidden">
      {/* Hero */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-dark-900 to-dark-900"></div>
        
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6"
        >
          Know the Risk. <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
            Report Faster.
          </span> Respond Smarter.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl text-lg md:text-xl text-gray-400 mb-10"
        >
          An intelligent disaster-response ecosystem that connects prediction, people, places, and emergency action in one real-time platform.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link to="/map" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            <MapIcon className="w-5 h-5" /> View Live Map
          </Link>
          <Link to="/report" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-gray-600 hover:border-gray-400 text-white rounded-lg font-bold text-lg transition-all hover:bg-gray-800">
            <Users className="w-5 h-5" /> Report Incident
          </Link>
        </motion.div>

        {/* Stats Ticker */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl border-y border-gray-800 py-8"
        >
          <div className="flex flex-col">
            <span className="text-4xl font-mono font-bold text-red-500">3</span>
            <span className="text-sm text-gray-400 uppercase tracking-wider mt-1">Active Alerts</span>
          </div>
          <div className="flex flex-col border-y md:border-y-0 md:border-x border-gray-800 py-4 md:py-0">
            <span className="text-4xl font-mono font-bold text-amber-500">5</span>
            <span className="text-sm text-gray-400 uppercase tracking-wider mt-1">High Risk Zones</span>
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-mono font-bold text-blue-500">47</span>
            <span className="text-sm text-gray-400 uppercase tracking-wider mt-1">Reports Today</span>
          </div>
        </motion.div>
      </section>

      {/* Workflow */}
      <section className="py-20 bg-dark-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-400">A continuous loop of intelligence and action</p>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm font-mono text-gray-400">
            {['PREDICT', 'ALERT', 'MAP', 'REPORT', 'VERIFY', 'PRIORITIZE', 'RESPOND', 'RESOLVE'].map((step, i, arr) => (
              <React.Fragment key={step}>
                <div className="px-4 py-2 bg-dark-900 border border-gray-700 rounded-lg text-blue-400">{step}</div>
                {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-gray-600 hidden md:block" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f, i) => (
            <motion.div key={i} variants={itemVariants} className="bg-dark-800 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 text-blue-500">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
