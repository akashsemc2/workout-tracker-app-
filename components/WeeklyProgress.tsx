
import React, { useState, useEffect } from 'react';
import { WorkoutSession, WeeklyProgressData } from '../types';
import { getWeeklyOverloadAdvice } from '../services/geminiService';

interface Props {
  sessions: WorkoutSession[];
}

const WeeklyProgress: React.FC<Props> = ({ sessions }) => {
  const [overloadData, setOverloadData] = useState<WeeklyProgressData | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate volume for last 7 days vs previous 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const getSessionVolume = (s: WorkoutSession) => 
    s.exercises.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, set) => sAcc + (set.weight * set.reps), 0), 0);

  const thisWeekSessions = sessions.filter(s => new Date(s.date) >= sevenDaysAgo);
  const lastWeekSessions = sessions.filter(s => {
    const d = new Date(s.date);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  });

  const thisWeekVol = thisWeekSessions.reduce((acc, s) => acc + getSessionVolume(s), 0);
  const lastWeekVol = lastWeekSessions.reduce((acc, s) => acc + getSessionVolume(s), 0);

  const volDiff = thisWeekVol - lastWeekVol;
  const volPercent = lastWeekVol === 0 ? 100 : Math.round((volDiff / lastWeekVol) * 100);

  useEffect(() => {
    if (sessions.length > 0 && !overloadData) {
      fetchAdvice();
    }
  }, [sessions]);

  const fetchAdvice = async () => {
    setLoading(true);
    const data = await getWeeklyOverloadAdvice(sessions);
    if (data) setOverloadData(data);
    setLoading(false);
  };

  if (sessions.length === 0) {
    return (
      <div className="p-8 text-center mt-20">
        <span className="material-icons text-6xl text-slate-300 mb-4">analytics</span>
        <h2 className="text-xl font-bold text-slate-800">Tracking Progress...</h2>
        <p className="text-slate-500 mt-2">Log your first workout to start generating progress reports and overload targets.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-slate-800 px-1 flex items-center gap-2">
        <span className="material-icons text-purple-600">trending_up</span>
        Weekly Performance
      </h2>

      {/* Volume Summary Card */}
      <div className="bg-white rounded-3xl material-shadow p-6 border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <span className="material-icons text-8xl">bar_chart</span>
        </div>
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weekly Volume</p>
            <p className="text-3xl font-bold text-slate-800">{thisWeekVol.toLocaleString()} kg</p>
          </div>
          <div className={`flex items-center gap-1 text-sm font-bold ${volDiff >= 0 ? 'text-green-500' : 'text-amber-500'}`}>
            <span className="material-icons text-sm">{volDiff >= 0 ? 'north_east' : 'south_east'}</span>
            {volPercent}% vs last week
          </div>
        </div>

        <div className="flex items-end gap-1 h-20 px-2">
           {/* Simple Bar Chart for last 7 days */}
           {[...Array(7)].map((_, i) => {
             const dayDate = new Date();
             dayDate.setDate(dayDate.getDate() - (6 - i));
             const dayVol = sessions
               .filter(s => new Date(s.date).toDateString() === dayDate.toDateString())
               .reduce((acc, s) => acc + getSessionVolume(s), 0);
             
             const maxVol = Math.max(...[...Array(7)].map((_, j) => {
               const d = new Date(); d.setDate(d.getDate() - (6 - j));
               return sessions.filter(s => new Date(s.date).toDateString() === d.toDateString())
                 .reduce((acc, s) => acc + getSessionVolume(s), 0);
             }), 100);

             const height = (dayVol / maxVol) * 100;
             return (
               <div key={i} className="flex-1 flex flex-col items-center gap-1">
                 <div 
                   style={{ height: `${Math.max(5, height)}%` }} 
                   className={`w-full rounded-t-lg transition-all duration-500 ${dayVol > 0 ? 'bg-purple-500' : 'bg-slate-100'}`}
                 ></div>
                 <span className="text-[8px] font-bold text-slate-400">
                   {dayDate.toLocaleDateString(undefined, { weekday: 'narrow' })}
                 </span>
               </div>
             );
           })}
        </div>
      </div>

      {/* Progressive Overload Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="material-icons text-amber-500">flash_on</span>
            Overload Targets
          </h3>
          <button onClick={fetchAdvice} className={`p-2 ${loading ? 'animate-spin' : ''}`}>
            <span className="material-icons text-slate-400">refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl"></div>)}
          </div>
        ) : overloadData ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 italic px-1">Based on your recent form, here is how to push your limits in the next session:</p>
            {overloadData.advice.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl material-shadow p-5 border-l-4 border-amber-400 group hover:translate-x-1 transition-transform">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800">{item.exerciseName}</h4>
                  <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
                    Next Target
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Last Performance</p>
                    <p className="text-sm font-medium text-slate-600">{item.currentStats}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">The Goal</p>
                    <p className="text-sm font-bold text-purple-600 text-right">{item.targetStats}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs text-slate-400 bg-slate-50 p-2 rounded-lg">
                  <span className="material-icons text-[14px] text-purple-300">psychology</span>
                  {item.reason}
                </div>
              </div>
            ))}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 rounded-2xl p-6 text-white text-center material-shadow-lg">
              <p className="text-xs uppercase tracking-widest font-bold opacity-70 mb-2">Coach's Summary</p>
              <p className="text-lg font-medium leading-relaxed">
                {overloadData.summary}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
             <p className="text-slate-400 text-sm">Tap refresh to get overload targets from your coach.</p>
          </div>
        )}
      </div>

      {/* Weekly Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-2xl text-center material-shadow border border-slate-50">
           <p className="text-xl font-bold text-slate-800">{thisWeekSessions.length}</p>
           <p className="text-[9px] font-bold text-slate-400 uppercase">Workouts</p>
        </div>
        <div className="bg-white p-3 rounded-2xl text-center material-shadow border border-slate-50">
           <p className="text-xl font-bold text-slate-800">
             {thisWeekSessions.reduce((acc, s) => acc + s.exercises.length, 0)}
           </p>
           <p className="text-[9px] font-bold text-slate-400 uppercase">Ex's Done</p>
        </div>
        <div className="bg-white p-3 rounded-2xl text-center material-shadow border border-slate-50">
           <p className="text-xl font-bold text-slate-800">
             {thisWeekSessions.reduce((acc, s) => acc + s.exercises.reduce((a, e) => a + e.sets.length, 0), 0)}
           </p>
           <p className="text-[9px] font-bold text-slate-400 uppercase">Total Sets</p>
        </div>
      </div>
    </div>
  );
};

export default WeeklyProgress;
