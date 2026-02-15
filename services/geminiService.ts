
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, WorkoutSession, Exercise, MovementPattern, MuscleGroup, AIProgram, AIPlanResponse } from "../types";
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';

export interface ExerciseRecommendation {
  existingId?: string;
  isNew: boolean;
  reason: string;
  data: Exercise;
}

/**
 * Genererar personliga träningsinsikter med Gemini API.
 */
export const getWorkoutInsights = async (
  profile: UserProfile, 
  session: WorkoutSession,
  exerciseHistory: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analysera följande atletprofil och ge ett kort, motiverande tips:
Namn: ${profile.name}
Vikt: ${profile.weight} kg
Mål: ${profile.goal}
Nuvarande pass: ${session.name || 'Uppvärmning'}
Historik: ${exerciseHistory}`,
      config: {
        systemInstruction: "Du är en expertcoach inom styrketräning och biomekanik. Svara på svenska. Ditt tips ska vara professionellt, kortfattat (max 20 ord) och direkt applicerbart på användarens mål och profil.",
        temperature: 0.7,
      },
    });

    const text = response.text;
    return text || "Fokusera på kontakten i varje repetition idag för maximal muskelaktivering.";
  } catch (error) {
    console.error("Kunde inte hämta insikter från Gemini API:", error);
    return "Fokusera på kontrollerade excentriska faser idag för att maximera muskelkontakten.";
  }
};

/**
 * Rekommenderar övningar baserat på användarens önskemål och befintliga bibliotek.
 */
export const recommendExercises = async (
  userRequest: string,
  existingExercises: Exercise[]
): Promise<ExerciseRecommendation[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const exerciseIndex = existingExercises.map(e => `${e.id}: ${e.name}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Användaren vill ha övningsförslag för: "${userRequest}".
      
      NUVARANDE BIBLIOTEK (ID: Namn):
      ${exerciseIndex}`,
      config: {
        systemInstruction: "Du är en expertcoach. Identifiera de 5-10 bästa övningarna för användarens önskemål. Sök först i biblioteket. Om en övning saknas, skapa den som en ny övning med all teknisk data.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              isNew: { type: Type.BOOLEAN },
              existingId: { type: Type.STRING },
              reason: { type: Type.STRING },
              data: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  englishName: { type: Type.STRING },
                  pattern: { type: Type.STRING, enum: Object.values(MovementPattern) },
                  primaryMuscles: { type: Type.ARRAY, items: { type: Type.STRING, enum: ALL_MUSCLE_GROUPS } },
                  secondaryMuscles: { type: Type.ARRAY, items: { type: Type.STRING, enum: ALL_MUSCLE_GROUPS } },
                  muscleGroups: { type: Type.ARRAY, items: { type: Type.STRING, enum: ALL_MUSCLE_GROUPS } },
                  equipment: { type: Type.ARRAY, items: { type: Type.STRING } },
                  equipmentRequirements: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING } 
                    } 
                  },
                  description: { type: Type.STRING },
                  tier: { type: Type.STRING, enum: ['tier_1', 'tier_2', 'tier_3'] },
                  trackingType: { type: Type.STRING, enum: ['reps_weight', 'time_distance', 'reps_only', 'time_only'] },
                  difficultyMultiplier: { type: Type.NUMBER },
                  bodyweightCoefficient: { type: Type.NUMBER }
                },
                required: ["id", "name", "pattern", "primaryMuscles", "muscleGroups", "equipment", "tier", "trackingType", "difficultyMultiplier", "bodyweightCoefficient"]
              }
            },
            required: ["isNew", "reason", "data"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    return JSON.parse(jsonText.trim());
  } catch (error) {
    console.error("Gemini Exercise Error:", error);
    throw new Error("Kunde inte hämta förslag från AI.");
  }
};

/**
 * Genererar detaljerad övningsdata från ett namn.
 */
export const generateExerciseDetailsFromGemini = async (
  exerciseName: string
): Promise<Partial<Exercise>> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analysera övningen "${exerciseName}" och generera JSON-data.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            englishName: { type: Type.STRING },
            description: { type: Type.STRING },
            primaryMuscles: { type: Type.ARRAY, items: { type: Type.STRING, enum: ALL_MUSCLE_GROUPS } },
            secondaryMuscles: { type: Type.ARRAY, items: { type: Type.STRING, enum: ALL_MUSCLE_GROUPS } },
            pattern: { type: Type.STRING, enum: Object.values(MovementPattern) },
            tier: { type: Type.STRING, enum: ['tier_1', 'tier_2', 'tier_3'] },
            trackingType: { type: Type.STRING, enum: ['reps_weight', 'time_distance', 'reps_only', 'time_only'] },
            difficultyMultiplier: { type: Type.NUMBER },
            bodyweightCoefficient: { type: Type.NUMBER }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    throw new Error("AI-genereringen misslyckades.");
  }
};

export const generateProfessionalPlan = async (
  userRequest: string,
  userHistory: WorkoutSession[],
  availableExercises: Exercise[],
  currentProfile: UserProfile,
  pplStats: any,
  preferences: { daysPerWeek: number; durationMinutes: number; durationWeeks: number }
): Promise<AIPlanResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const exerciseBankString = availableExercises.map(e => `id: "${e.id}", name: "${e.name}", primaryMuscles: [${e.primaryMuscles.join(', ')}], pattern: "${e.pattern}"`).join('\n');

  const contents = `
    Du är en expertcoach. Skapa ett detaljerat träningsprogram.
    MÅL: "${userRequest}"
    TIDSPERSPEKTIV: ${preferences.durationWeeks} veckor, ${preferences.daysPerWeek} pass/vecka, ${preferences.durationMinutes} min/pass.
    STRENGTH: ${JSON.stringify(pplStats)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            motivation: { type: Type.STRING },
            smartGoals: { type: Type.ARRAY, items: { type: Type.OBJECT } },
            routines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  weekNumber: { type: Type.NUMBER },
                  scheduledDay: { type: Type.NUMBER },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        targetSets: { type: Type.NUMBER },
                        targetReps: { type: Type.STRING },
                        estimatedWeight: { type: Type.NUMBER }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    throw new Error("AI-assistenten kunde inte skapa en plan.");
  }
};

export const generateNextPhase = async (
  currentProgram: AIProgram,
  programHistory: WorkoutSession[],
  availableExercises: Exercise[],
  pplStats: any
): Promise<AIPlanResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const contents = `Skapa nästa fas för programmet "${currentProgram.name}".`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            motivation: { type: Type.STRING },
            routines: { type: Type.ARRAY, items: { type: Type.OBJECT } }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    throw new Error("Kunde inte generera nästa fas.");
  }
};
