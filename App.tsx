
import React, { useState, useEffect } from 'react';
import { WorkoutSession, Exercise, WorkoutSet } from './types';
import WorkoutTracker from './components/WorkoutTracker';
import WorkoutHistory from './components/WorkoutHistory';
import AiInsightsView from './components/AiInsightsView';
import WeeklyProgress from './components/WeeklyProgress';

const App: React.FC = () => {
  const [view, setView] = useState<'track' | 'history' | 'ai' | 'progress'>('track');
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('flexflow_workouts');
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse workouts", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('flexflow_workouts', JSON.stringify(sessions));
  }, [sessions]);

  const startNewWorkout = () => {
    const now = new Date().toISOString();
    const newSession: WorkoutSession = {
      id: Date.now().toString(),
      date: now,
      startTime: now,
      name: `Workout ${sessions.length + 1}`,
      exercises: []
    };
    setCurrentSession(newSession);
    setView('track');
  };

  const saveWorkout = (session: WorkoutSession) => {
    const sessionWithEndTime = {
      ...session,
      endTime: new Date().toISOString()
    };
    setSessions(prev => [sessionWithEndTime, ...prev]);
    setCurrentSession(null);
    setView('history');
  };

  const deleteWorkout = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#fcfaff] flex flex-col max-w-2xl mx-auto shadow-xl">
      <header className="bg-gradient-to-r from-purple-700 to-violet-600 text-white p-4 sticky top-0 z-50 material-shadow flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <span className="material-icons">fitness_center</span>
          Techrooted Gym
        </h1>
        {view !== 'track' && !currentSession && (
          <button 
            onClick={startNewWorkout}
            className="bg-white text-purple-700 px-4 py-1 rounded-full text-sm font-medium hover:bg-purple-50 transition-colors material-shadow font-bold"
          >
            START
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {view === 'track' && (
          <WorkoutTracker 
            session={currentSession} 
            onSave={saveWorkout} 
            onCancel={() => { setCurrentSession(null); setView('history'); }}
            onStartNew={startNewWorkout}
          />
        )}
        {view === 'history' && (
          <WorkoutHistory 
            sessions={sessions} 
            onDelete={deleteWorkout} 
          />
        )}
        {view === 'ai' && (
          <AiInsightsView sessions={sessions} />
        )}
        {view === 'progress' && (
          <WeeklyProgress sessions={sessions} />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 max-w-2xl mx-auto z-50">
        <button 
          onClick={() => setView('track')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'track' ? 'text-purple-600' : 'text-slate-400'}`}
        >
          <span className="material-icons">play_circle</span>
          <span className="text-xs">Track</span>
        </button>
        <button 
          onClick={() => setView('history')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'history' ? 'text-purple-600' : 'text-slate-400'}`}
        >
          <span className="material-icons">history</span>
          <span className="text-xs">History</span>
        </button>
        <button 
          onClick={() => setView('progress')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'progress' ? 'text-purple-600' : 'text-slate-400'}`}
        >
          <span className="material-icons">trending_up</span>
          <span className="text-xs">Progress</span>
        </button>
        <button 
          onClick={() => setView('ai')}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors ${view === 'ai' ? 'text-purple-600' : 'text-slate-400'}`}
        >
          <span className="material-icons">psychology</span>
          <span className="text-xs">Insights</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
