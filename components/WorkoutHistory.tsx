
import React from 'react';
import { WorkoutSession } from '../types';

interface Props {
  sessions: WorkoutSession[];
  onDelete: (id: string) => void;
}

const WorkoutHistory: React.FC<Props> = ({ sessions, onDelete }) => {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[60vh]">
        <span className="material-icons text-6xl text-slate-300 mb-4">history</span>
        <h2 className="text-xl font-bold text-slate-800">Empty Gym</h2>
        <p className="text-slate-500 mt-2">Finish your first workout to see your history and progression data here.</p>
      </div>
    );
  }

  const formatDuration = (start: string, end?: string, pausedMs: number = 0) => {
    if (!end) return "N/A";
    const diffMs = new Date(end).getTime() - new Date(start).getTime() - pausedMs;
    const diff = Math.floor(Math.max(0, diffMs) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}m ${secs}s`;
  };

  const getSessionVolume = (session: WorkoutSession) => {
    return session.exercises.reduce((acc, ex) => 
      acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0
    );
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-slate-800 px-1">Workout History</h2>
      
      {sessions.map(session => {
        const volume = getSessionVolume(session);
        return (
          <div key={session.id} className="bg-white rounded-2xl material-shadow p-5 relative group border-t-4 border-purple-600">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg leading-tight">{session.name}</h3>
                <div className="flex items-center gap-2 text-slate-400 text-xs mt-1">
                  <span className="material-icons text-[14px]">calendar_today</span>
                  {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  <span className="mx-1">•</span>
                  <span className="material-icons text-[14px]">timer</span>
                  {formatDuration(session.startTime, session.endTime, session.pausedMs)}
                </div>
              </div>
              <button onClick={() => confirm("Delete this log?") && onDelete(session.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                <span className="material-icons text-lg">delete_outline</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Volume</p>
                <p className="text-lg font-bold text-purple-600">{volume.toLocaleString()} kg</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exercises</p>
                <p className="text-lg font-bold text-slate-700">{session.exercises.length}</p>
              </div>
            </div>

            <div className="space-y-1">
              {session.exercises.slice(0, 3).map(ex => (
                <div key={ex.id} className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">{ex.name}</span>
                  <span className="text-slate-400">{ex.sets.length} sets • {ex.sets.reduce((a, s) => a + (s.weight * s.reps), 0).toLocaleString()} kg</span>
                </div>
              ))}
              {session.exercises.length > 3 && (
                <p className="text-[10px] text-slate-400 italic mt-1">+ {session.exercises.length - 3} more exercises</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WorkoutHistory;
