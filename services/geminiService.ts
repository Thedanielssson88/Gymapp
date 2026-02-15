import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, WorkoutSession, Exercise, MovementPattern, MuscleGroup, AIProgram, AIPlanResponse, Equipment, PlannedExercise, Zone, ProgressionRate } from "../types";
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';
import { storage } from './storage';

export interface ExerciseRecommendation {
  existingId?: string;
  isNew: boolean;
  reason: string;
  data: Exercise;
}

export interface ExerciseSearchResponse {
  motivation: string;
  recommendations: ExerciseRecommendation[];
}

// Hjälpfunktion för att hämta nyckel
const getApiKey = async (): Promise<string> => {
  // 1. Kolla inställningar först
  const profile = await storage.getUserProfile();
  if (profile.settings?.geminiApiKey) {
    return profile.settings.geminiApiKey;
  }
  
  // 2. Fallback till .env
  const envKey = process.env.API_KEY;
  if (envKey) return envKey;

  throw new Error("Ingen API-nyckel hittad. Gå till Inställningar och lägg in din Gemini API Key.");
};


/**
 * Genererar personliga träningsinsikter med Gemini API.
 */
export const getWorkoutInsights = async (
  profile: UserProfile, 
  session: WorkoutSession,
  exerciseHistory: string
): Promise<string> => {
  try {
    const apiKey = await getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
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
    if (error instanceof Error && error.message.includes("Ingen API-nyckel hittad")) {
        console.error("Gemini API-nyckel saknas:", error);
        return "Ange API-nyckel i Inställningar för AI-tips.";
    }
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
): Promise<ExerciseSearchResponse> => {
  try {
    const apiKey = await getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const exerciseIndex = existingExercises.map(e => `${e.id}: ${e.name}`).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Användaren vill ha övningsförslag för: "${userRequest}".
      
      NUVARANDE BIBLIOTEK (ID: Namn):
      ${exerciseIndex}`,
      config: {
        systemInstruction: `Du är en expertcoach. 
        UPPGIFT:
        1. Skriv en kort motivation (max 2 meningar) till varför övningarna valts.
        2. Identifiera de 5-8 bästa övningarna för användarens önskemål.
        3. Sök först i biblioteket. Om en övning finns, använd dess exakta ID.
        4. Om en viktig övning SAKNAS, skapa den som en ny övning med ALL teknisk data.
        
        VIKTIGT FÖR NYA ÖVNINGAR:
        - id: Skapa ett unikt slug-id (t.ex. 'hyrox-sled-push').
        - description: MÅSTE vara steg-för-steg instruktioner (1. Gör så, 2. Gör så).
        - muscleGroups: Breda kategorier (t.ex. 'Rygg', 'Ben').
        - equipmentRequirements: Array av arrayer. Ex: för Skivstång och Bänk: [["Skivstång"], ["Träningsbänk"]].
        - tier: 'tier_1' (Tung bas), 'tier_2' (Komplement), 'tier_3' (Isolering/Mobilitet).`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            motivation: { type: Type.STRING },
            recommendations: {
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
                      equipment: { type: Type.ARRAY, items: { type: Type.STRING, enum: Object.values(Equipment) } },
                      equipmentRequirements: { 
                        type: Type.ARRAY, 
                        items: { 
                          type: Type.ARRAY, 
                          items: { type: Type.STRING, enum: Object.values(Equipment) } 
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
          },
          required: ["motivation", "recommendations"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    return JSON.parse(jsonText.trim());
  } catch (error) {
    console.error("Gemini Exercise Error:", error);
    if (error instanceof Error && error.message.includes("Ingen API-nyckel hittad")) {
        throw error;
    }
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
    const apiKey = await getApiKey();
    const ai = new GoogleGenAI({ apiKey });
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
    if (error instanceof Error && error.message.includes("Ingen API-nyckel hittad")) {
        throw error;
    }
    throw new Error("AI-genereringen misslyckades.");
  }
};

export const generateProfessionalPlan = async (
  userRequest: string,
  userHistory: WorkoutSession[],
  availableExercises: Exercise[],
  currentProfile: UserProfile,
  pplStats: any,
  preferences: { daysPerWeek: number; durationMinutes: number; durationWeeks: number; progressionRate: ProgressionRate; }
): Promise<AIPlanResponse> => {
  try {
    const apiKey = await getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const { daysPerWeek, durationMinutes, durationWeeks, progressionRate } = preferences;
    const contents = `
      Du är en expert-PT och träningsfysiolog. Skapa ett detaljerat träningsprogram.
      
      MÅL: "${userRequest}"
      TIDSPERSPEKTIV: ${durationWeeks} veckor, ${daysPerWeek} pass/vecka, ${durationMinutes} min/pass.
      NUVARANDE STYRKA (Uppskattat 1RM): ${JSON.stringify(pplStats)}
      ÖKNINGSTAKT VALD AV ANVÄNDAREN: ${progressionRate.toUpperCase()}.

      INSTRUKTIONER FÖR VIKTER OCH PROGRESSION:
      Basera progressionen på den valda ökningstakten:
      - conservative: Minimal ökning. Fokus på teknik/rehab. (+0.5-1kg/vecka).
      - normal: Standard linjär progression. (+2.5kg/vecka för överkropp, +5kg/vecka för ben).
      - aggressive: Utmana användaren. Utnyttja "newbie gains" eller tuff periodisering. Öka snabbare om det är fysiologiskt möjligt (t.ex. +2.5kg per pass istället för per vecka för en nybörjare).
      
      VIKTIGT - REALISM:
      1. Bedöm om målet är fysiologiskt nåbart på ${durationWeeks} veckor med vald takt.
      2. Även vid 'aggressive', om målet är orealistiskt (t.ex. +60kg på 4v), designa programmet som "Fas 1" av en längre plan.
      3. Maximera då ökningen under denna fas (t.ex. gå från 40kg -> 55kg istället för 43kg) och skriv i 'motivation' att detta är en ambitiös start på en längre resa.
      4. Sätt målet (smartGoals) för sista veckan i detta program till en realistisk delvinst.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            motivation: { type: Type.STRING },
            smartGoals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  targetValue: { type: Type.NUMBER },
                  targetType: { type: Type.STRING, enum: ['exercise', 'body_weight', 'body_measurement'] },
                  exerciseId: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  strategy: { type: Type.STRING, enum: ['linear', 'undulating', 'peaking'] }
                },
                required: ['title', 'targetValue', 'targetType', 'deadline', 'strategy']
              }
            },
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
    if (error instanceof Error && error.message.includes("Ingen API-nyckel hittad")) {
        throw error;
    }
    throw new Error("AI-assistenten kunde inte skapa en plan.");
  }
};

export const generateNextPhase = async (
  currentProgram: AIProgram,
  programHistory: WorkoutSession[],
  availableExercises: Exercise[],
  pplStats: any
): Promise<AIPlanResponse> => {
  try {
    const apiKey = await getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const contents = `
      Skapa nästa fas (Fas ${ (currentProgram.phaseNumber || 1) + 1}) för programmet "${currentProgram.name}".
      
      LÅNGSIKTIGT MÅL: "${currentProgram.longTermGoalDescription}"
      SENASTE FASENS RESULTAT (Nuvarande 1RM): ${JSON.stringify(pplStats)}
      
      UPPGIFT:
      1. Basera progressionen på de nya styrkevärdena.
      2. Fortsätt arbeta mot det långsiktiga målet med realistiska ökningar (1-2% per vecka för överkropp, 2-3% för underkropp).
      3. Variera gärna övningsval för att undvika platåer.
      4. Skriv en motiverande text för nästa fas.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            motivation: { type: Type.STRING },
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
    if (error instanceof Error && error.message.includes("Ingen API-nyckel hittad")) {
        throw error;
    }
    throw new Error("Kunde inte generera nästa fas.");
  }
};

export async function generateWorkoutFromPrompt(
  prompt: string,
  allExercises: Exercise[],
  activeZone: Zone,
  history: WorkoutSession[]
): Promise<PlannedExercise[]> {
  const equipmentList = activeZone.inventory.join(", ");
  const exerciseList = JSON.stringify(allExercises.map(e => ({id: e.id, name: e.name, equipment: e.equipment})));

  const systemInstruction = `Du är en expert-PT. Skapa ett träningspass med 4-7 övningar baserat på användarens önskemål och tillgänglig utrustning. Använd ENDAST övningar från den angivna listan. Svara ENDAST med ett JSON-objekt enligt det specificerade formatet.`;
  const contents = `
    Önskemål: "${prompt}"
    Tillgänglig utrustning: ${equipmentList}
    Tillgängliga övningar: ${exerciseList}
  `;

  try {
    const apiKey = await getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            workout: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  exerciseId: { type: Type.STRING },
                  sets: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        reps: { type: Type.NUMBER },
                        weight: { type: Type.NUMBER },
                        targetRpe: { type: Type.NUMBER },
                      },
                      required: ["reps", "weight"]
                    }
                  }
                },
                required: ["exerciseId", "sets"]
              }
            }
          },
          required: ["workout"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Tomt svar från AI");

    const data = JSON.parse(jsonText.trim());
    return data.workout as PlannedExercise[];
  } catch (error) {
    console.error("AI Workout Generation failed", error);
    if (error instanceof Error && error.message.includes("Ingen API-nyckel hittad")) {
        throw error;
    }
    throw new Error("Kunde inte generera ett AI-pass.");
  }
}