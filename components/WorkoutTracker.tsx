
import React, { useState, useEffect, useRef } from 'react';
import { WorkoutSession, Exercise, WorkoutSet } from '../types';

interface Props {
  session: WorkoutSession | null;
  onSave: (session: WorkoutSession) => void;
  onCancel: () => void;
  onStartNew: () => void;
}

const COMMON_EXERCISES = [
  "Bench Press", "Squat", "Deadlift", "Overhead Press", 
  "Barbell Row", "Pull Ups", "Dumbbell Curl", "Lateral Raise"
];

const WorkoutTracker: React.FC<Props> = ({ session, onSave, onCancel, onStartNew }) => {
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(session);
  const [elapsed, setElapsed] = useState<string>("00:00");
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pausedMs, setPausedMs] = useState<number>(0);
  const [lastPauseStart, setLastPauseStart] = useState<number | null>(null);
  
  // Custom Exercise UI State
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveSession(session);
    setPausedMs(0);
    setIsPaused(false);
    setLastPauseStart(null);
  }, [session]);

  useEffect(() => {
    if (!activeSession || isPaused) return;
    
    const interval = setInterval(() => {
      const start = new Date(activeSession.startTime).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((now - start - pausedMs) / 1000);
      const mins = Math.floor(diff / 60).toString().padStart(2, '0');
      const secs = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${mins}:${secs}`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeSession, isPaused, pausedMs]);

  useEffect(() => {
    if (isAddingExercise && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingExercise]);

  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[60vh]">
        <div className="bg-purple-100 p-6 rounded-full mb-6">
          <span className="material-icons text-6xl text-purple-600">fitness_center</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready to Grind?</h2>
        <p className="text-slate-500 mb-8">Start a new session to track your sets, reps, and total volume in real-time.</p>
        <button 
          onClick={onStartNew}
          className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-8 py-4 rounded-2xl font-bold material-shadow-lg hover:from-purple-700 hover:to-violet-700 transition-all active:scale-95 w-full max-w-xs"
        >
          START NEW WORKOUT
        </button>
      </div>
    );
  }

  const togglePause = () => {
    const now = Date.now();
    if (isPaused) {
      if (lastPauseStart) {
        setPausedMs(prev => prev + (now - lastPauseStart));
      }
      setLastPauseStart(null);
    } else {
      setLastPauseStart(now);
    }
    setIsPaused(!isPaused);
  };

  const handleSave = () => {
    let finalPausedMs = pausedMs;
    if (isPaused && lastPauseStart) {
      finalPausedMs += (Date.now() - lastPauseStart);
    }
    onSave({ ...activeSession, pausedMs: finalPausedMs });
  };

  const totalVolume = activeSession.exercises.reduce((acc, ex) => 
    acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0
  );

  const addNewExercise = (name: string) => {
    if (!name.trim()) return;
    const newEx: Exercise = { id: Date.now().toString(), name: name.trim(), sets: [] };
    setActiveSession({ ...activeSession, exercises: [...activeSession.exercises, newEx] });
    setIsAddingExercise(false);
    setCustomExerciseName("");
  };

  const addSet = (exId: string) => {
    setActiveSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex.id === exId) {
            const last = ex.sets[ex.sets.length - 1];
            return {
              ...ex,
              sets: [...ex.sets, { id: Math.random().toString(), reps: last?.reps || 10, weight: last?.weight || 0 }]
            };
          }
          return ex;
        })
      };
    });
  };

  const updateSet = (exId: string, setId: string, field: keyof WorkoutSet, val: number) => {
    setActiveSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex.id === exId) {
            return { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: val } : s) };
          }
          return ex;
        })
      };
    });
  };

  const removeSet = (exId: string, setId: string) => {
    setActiveSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => (ex.id === exId ? { ...ex, sets: ex.sets.filter(s => s.id !== setId) } : ex))
      };
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Session Stats Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 flex justify-between items-center material-shadow sticky top-[4.5rem] z-40">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Duration</p>
            <p className={`text-xl font-mono font-bold ${isPaused ? 'text-amber-400 animate-pulse' : 'text-purple-400'}`}>
              {elapsed}
            </p>
          </div>
          <button 
            onClick={togglePause}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPaused ? 'bg-purple-600' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            <span className="material-icons text-xl">{isPaused ? 'play_arrow' : 'pause'}</span>
          </button>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Total Volume</p>
          <p className="text-xl font-bold text-green-400">{totalVolume.toLocaleString()} kg</p>
        </div>
      </div>

      <div className="flex justify-between items-center px-1">
        <input 
          type="text" 
          value={activeSession.name}
          onChange={(e) => setActiveSession({ ...activeSession, name: e.target.value })}
          className="text-xl font-bold bg-transparent border-b border-dashed border-slate-300 focus:border-purple-500 focus:outline-none flex-1"
        />
        <button onClick={onCancel} className="ml-4 text-slate-400"><span className="material-icons">close</span></button>
      </div>

      {isPaused && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 text-amber-800 text-sm animate-in fade-in slide-in-from-top-2">
          <span className="material-icons text-amber-500">pause_circle_filled</span>
          <span>Workout is paused. Timer is stopped.</span>
        </div>
      )}

      <div className="space-y-4">
        {activeSession.exercises.map(ex => (
          <div key={ex.id} className="bg-white rounded-2xl material-shadow p-4 overflow-hidden border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{ex.name}</h3>
              <button onClick={() => addSet(ex.id)} className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <span className="material-icons text-sm">add</span> ADD SET
              </button>
            </div>
            
            <div className="space-y-2">
              {ex.sets.map((set, i) => (
                <div key={set.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl group">
                  <div className="col-span-1 text-center text-xs font-bold text-slate-400">{i+1}</div>
                  <div className="col-span-4 relative">
                    <input 
                      type="number" 
                      inputMode="decimal"
                      value={set.weight || ''} 
                      placeholder="0"
                      onChange={e => updateSet(ex.id, set.id, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2 text-center text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none" 
                    />
                    <span className="absolute bottom-1 right-1 text-[8px] text-slate-400 uppercase">kg</span>
                  </div>
                  <div className="col-span-3 relative">
                    <input 
                      type="number" 
                      inputMode="numeric"
                      value={set.reps || ''} 
                      placeholder="0"
                      onChange={e => updateSet(ex.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-2 text-center text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none" 
                    />
                    <span className="absolute bottom-1 right-1 text-[8px] text-slate-400 uppercase">reps</span>
                  </div>
                  <div className="col-span-3 text-right text-[10px] font-bold text-slate-500">
                    {(set.weight * set.reps).toLocaleString()} kg
                  </div>
                  <div className="col-span-1 text-right">
                    <button onClick={() => removeSet(ex.id, set.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <span className="material-icons text-sm">remove_circle</span>
                    </button>
                  </div>
                </div>
              ))}
              {ex.sets.length === 0 && (
                <p className="text-center py-4 text-slate-400 text-xs italic">No sets added yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modern Exercise Adder */}
      {!isAddingExercise ? (
        <button 
          onClick={() => setIsAddingExercise(true)} 
          className="w-full py-4 border-2 border-dashed border-purple-200 text-purple-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-purple-50 transition-colors"
        >
          <span className="material-icons">add_box</span> ADD NEW EXERCISE
        </button>
      ) : (
        <div className="bg-white rounded-2xl material-shadow p-5 border-2 border-purple-500 animate-in zoom-in-95 duration-200">
          <h4 className="font-bold text-slate-800 mb-4 flex justify-between items-center">
            New Exercise
            <button onClick={() => setIsAddingExercise(false)} className="text-slate-400 hover:text-slate-600">
              <span className="material-icons text-sm">close</span>
            </button>
          </h4>
          
          <input 
            ref={inputRef}
            type="text"
            placeholder="Enter exercise name..."
            value={customExerciseName}
            onChange={(e) => setCustomExerciseName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNewExercise(customExerciseName)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-lg font-medium focus:ring-2 focus:ring-purple-500 outline-none mb-4"
          />

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Select</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {COMMON_EXERCISES.map(name => (
              <button 
                key={name}
                onClick={() => addNewExercise(name)}
                className="bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-600 px-3 py-1 rounded-full text-xs font-medium transition-colors border border-transparent hover:border-purple-200"
              >
                {name}
              </button>
            ))}
          </div>

          <button 
            onClick={() => addNewExercise(customExerciseName)}
            disabled={!customExerciseName.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl font-bold material-shadow disabled:bg-slate-300 disabled:material-shadow-none"
          >
            ADD EXERCISE
          </button>
        </div>
      )}

      <div className="pt-6">
        <button 
          onClick={handleSave}
          disabled={activeSession.exercises.length === 0}
          className={`w-full py-4 rounded-2xl font-bold text-white material-shadow-lg transition-all flex items-center justify-center gap-2 ${activeSession.exercises.length > 0 ? 'bg-green-600 hover:bg-green-700 active:scale-95' : 'bg-slate-300 cursor-not-allowed'}`}
        >
          <span className="material-icons">check_circle</span> FINISH WORKOUT
        </button>
      </div>
    </div>
  );
};

export default WorkoutTracker;
