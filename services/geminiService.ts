
import { GoogleGenAI, Type } from "@google/genai";
import { WorkoutSession, AiInsight, WeeklyProgressData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getWorkoutInsights = async (history: WorkoutSession[]): Promise<AiInsight | null> => {
  try {
    const historySummary = history.length > 0 
      ? JSON.stringify(history.slice(-5).map(w => {
          const vol = w.exercises.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0);
          return {
            date: w.date,
            volume: vol,
            exerciseCount: w.exercises.length,
            exercises: w.exercises.map(e => e.name)
          };
        }))
      : "No previous workout history.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `History: ${historySummary}`,
      config: {
        systemInstruction: "You are an elite fitness coach. Analyze the volume (kg), exercise variety, and frequency from the history. If volume is increasing, congratulate them. If it's stagnant, suggest a strategy like progressive overload. Provide one actionable insight, one motivational quote, and one suggestion. Return JSON ONLY.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            suggestion: { type: Type.STRING },
            motivation: { type: Type.STRING },
          },
          required: ["title", "suggestion", "motivation"],
        },
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as AiInsight;
    }
    return null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const getWeeklyOverloadAdvice = async (history: WorkoutSession[]): Promise<WeeklyProgressData | null> => {
  try {
    if (history.length === 0) return null;

    // Get the most recent occurrences of each unique exercise
    const latestExercises: Record<string, any> = {};
    history.forEach(session => {
      session.exercises.forEach(ex => {
        if (!latestExercises[ex.name]) {
          latestExercises[ex.name] = {
            name: ex.name,
            lastSets: ex.sets.map(s => `${s.weight}kg x ${s.reps}`).join(', '),
            maxWeight: Math.max(...ex.sets.map(s => s.weight)),
            maxReps: Math.max(...ex.sets.map(s => s.reps)),
            avgReps: ex.sets.reduce((a, b) => a + b.reps, 0) / ex.sets.length
          };
        }
      });
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Latest Exercise Stats: ${JSON.stringify(Object.values(latestExercises).slice(0, 5))}`,
      config: {
        systemInstruction: "You are a Strength & Conditioning coach. For each exercise provided, suggest a specific 'Progressive Overload' target for the next session. This should typically be a small increase in weight (1.25-2.5kg) or an increase of 1-2 reps per set. Be very specific about 'how many more reps' or 'how much more weight'. Return JSON ONLY.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A summary of weekly progress" },
            advice: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  exerciseName: { type: Type.STRING },
                  currentStats: { type: Type.STRING, description: "Description of current performance" },
                  targetStats: { type: Type.STRING, description: "Specifically how many more reps/weight to add" },
                  reason: { type: Type.STRING }
                },
                required: ["exerciseName", "currentStats", "targetStats", "reason"]
              }
            }
          },
          required: ["summary", "advice"],
        },
      },
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as WeeklyProgressData;
    }
    return null;
  } catch (error) {
    console.error("Gemini Overload API Error:", error);
    return null;
  }
};
