import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, FastForward, Activity, RefreshCw, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { startSimulation, stopSimulation, resetSimulation } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { SIMULATION_STEPS } from '../data/constants';

export default function SimulationBar() {
  const { isAdmin } = useAuth();
  const { socket } = useSocket();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!socket || !isAdmin) return;

    const handleStep = (data) => {
      setActive(true);
      setStep(data.step || 1);
    };

    const handleComplete = () => {
      setActive(false);
      setStep(10);
    };

    socket.on('simulation_step', handleStep);
    socket.on('simulation_complete', handleComplete);

    return () => {
      socket.off('simulation_step', handleStep);
      socket.off('simulation_complete', handleComplete);
    };
  }, [socket, isAdmin]);

  const handleStart = async () => {
    setError('');
    try {
      await startSimulation(speed);
      setActive(true);
    } catch (e) {
      console.error('Simulation start error:', e);
      setError(e.message || 'Failed to start simulation');
    }
  };

  const handleStop = async () => {
    try {
      await stopSimulation();
      setActive(false);
    } catch (e) {
      console.error('Simulation stop error:', e);
    }
  };

  const handleReset = async () => {
    setError('');
    try {
      await resetSimulation();
      setActive(false);
      setStep(0);
    } catch (e) {
      console.error('Simulation reset error:', e);
      setError(e.message || 'Failed to reset simulation');
    }
  };

  if (!isAdmin) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-4xl bg-dark-900/95 backdrop-blur-xl border border-red-500/40 rounded-2xl p-4 shadow-2xl"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-2 bg-red-600/20 text-red-500 rounded-xl border border-red-500/30 flex-shrink-0 animate-pulse">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-red-400 tracking-wider">COMMAND SIMULATION</span>
                {active && (
                  <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-300 font-medium truncate max-w-xs md:max-w-sm">
                {step > 0 && SIMULATION_STEPS[step - 1] ? SIMULATION_STEPS[step - 1] : 'Idle — Trigger emergency event flow'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex bg-dark-800 p-1 rounded-xl border border-gray-700">
              {[1, 2, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    speed === s ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {!active ? (
              <button
                onClick={handleStart}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-red-600/30"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Scenario</span>
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="px-3 py-2 bg-dark-800 hover:bg-dark-700 border border-gray-700 text-gray-300 hover:text-white text-xs font-bold rounded-xl transition"
              title="Reset Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 w-full bg-dark-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-600 transition-all duration-300 rounded-full"
            style={{ width: `${(step / 10) * 100}%` }}
          />
        </div>

        {error && (
          <p className="text-[11px] text-red-400 font-semibold mt-2 text-center">{error}</p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
