import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, WorkoutSession, Exercise, MovementPattern, MuscleGroup } from "../types";
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';

/**
 * Genererar personliga träningsinsikter med Gemini API.
 * Använder Google Gemini 3 Flash för snabba och effektiva tips baserat på atletens profil.
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

    return response.text || "Fokusera på kontakten i varje repetition idag för maximal muskelaktivering.";
  } catch (error) {
    console.error("Kunde inte hämta insikter från Gemini API:", error);
    
    const fallbacks = [
      "Fokusera på kontrollerade excentriska faser idag för att maximera muskelkontakten.",
      "Kom ihåg att andas genom hela rörelsen, särskilt under den tyngsta delen av lyftet.",
      "Dina biometriska data ser stabila ut. Idag är en bra dag för progressiv överbelastning.",
      "Vikten är sekundär till formen. Prioritera fullt rörelseomfång i varje repetition.",
      "Hydrering är nyckeln till prestation. Drick vatten regelbundet under passet."
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};

/**
 * Genererar detaljerad övningsdata från ett namn med hjälp av Gemini API.
 */
export const generateExerciseDetailsFromGemini = async (
  exerciseName: string
): Promise<Partial<Exercise>> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analysera träningsövningen "${exerciseName}" och generera ett JSON-objekt med detaljerad information baserat på schemat.
    
    Följ dessa regler för fälten difficultyMultiplier och bodyweightCoefficient:
    
    - difficultyMultiplier (float): 
        Standard är 1.0. 
        Sätt 1.1-1.3 för extremt tunga basövningar (t.ex. Marklyft, Knäböj). 
        Sätt 0.7-0.9 för lätta isolationsövningar eller rehab (t.ex. Sidolyft, Facepulls).
    
    - bodyweightCoefficient (float mellan 0.0 och 1.0):
        Detta anger hur stor del av användarens egen kroppsvikt som lyfts i övningen.
        0.0: För alla skivstångs/hantel-övningar där man bara räknar vikten på stången (t.ex. Bänkpress).
        1.0: För Pull-ups, Chins.
        0.9: För Dips.
        0.7: För Knäböj med kroppsvikt.
        0.66: För Armhävningar (Push-ups).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            englishName: { type: Type.STRING, description: "Övningens engelska namn." },
            description: { type: Type.STRING, description: "En detaljerad steg-för-steg instruktion för hur man utför övningen korrekt och säkert. Svara på svenska." },
            primaryMuscles: {
              type: Type.ARRAY,
              description: "De primära muskelgrupperna som tränas. Välj från den angivna listan.",
              items: { type: Type.STRING, enum: ALL_MUSCLE_GROUPS }
            },
            secondaryMuscles: {
              type: Type.ARRAY,
              description: "De sekundära muskelgrupperna som assisterar. Välj från den angivna listan.",
              items: { type: Type.STRING, enum: ALL_MUSCLE_GROUPS }
            },
            pattern: {
              type: Type.STRING,
              description: "Rörelsemönstret. Välj det mest passande från listan.",
              enum: Object.values(MovementPattern)
            },
            tier: {
              type: Type.STRING,
              description: "Övningens nivå. tier_1 är en tung basövning, tier_2 är ett viktigt komplement, tier_3 är isolering/prehab.",
              enum: ['tier_1', 'tier_2', 'tier_3']
            },
            trackingType: {
              type: Type.STRING,
              description: "Hur övningen typiskt loggas. 'reps_weight' för styrka, 'time_distance' för kondition/distans.",
              enum: ['reps_weight', 'time_distance', 'reps_only', 'time_only']
            },
            difficultyMultiplier: { 
              type: Type.NUMBER, 
              description: "Svårighetsgrad. Standard 1.0. Basövning: 1.1-1.3. Isolering: 0.7-0.9."
            },
            bodyweightCoefficient: { 
              type: Type.NUMBER, 
              description: "Andel kroppsvikt som lyfts (0.0-1.0)."
            }
          },
          required: ["englishName", "description", "primaryMuscles", "secondaryMuscles", "pattern", "tier", "trackingType", "difficultyMultiplier", "bodyweightCoefficient"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
        throw new Error("Gemini returnerade ett tomt svar.");
    }
    
    return JSON.parse(jsonText.trim()) as Partial<Exercise>;

  } catch (error) {
    console.error("Kunde inte generera övningsdata från Gemini API:", error);
    throw new Error("AI-genereringen misslyckades. Kontrollera din anslutning och försök igen.");
  }
};

export interface AIPlanResponse {
  motivation: string;
  smartGoals: {
    title: string;
    targetValue: number;
    targetType: 'exercise' | 'body_weight' | 'body_measurement';
    exerciseId?: string;
    deadline: string;
    strategy: 'linear' | 'undulating' | 'peaking';
  }[];
  routines: {
    name: string;
    description: string;
    exercises: { id: string; targetSets: number; targetReps: string }[];
    scheduledDay: number; // 1-7 (Måndag-Söndag)
  }[];
}

export const generateProfessionalPlan = async (
  userRequest: string,
  userHistory: WorkoutSession[],
  availableExercises: Exercise[],
  currentProfile: UserProfile
): Promise<AIPlanResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const exerciseBankString = availableExercises.map(e => `id: "${e.id}", name: "${e.name}", primaryMuscles: [${e.primaryMuscles.join(', ')}], pattern: "${e.pattern}"`).join('\n');

  const contents = `
    You are a world-leading personal trainer and rehabilitation expert. Your task is to create a weekly training plan based on the user's request: "${userRequest}".

    AVAILABLE DATA:
    - User Profile: ${JSON.stringify(currentProfile)}
    - Recent Workout History (last 10 sessions): ${JSON.stringify(userHistory.slice(-10).map(s => ({name: s.name, date: s.date, exercises: s.exercises.length})))}
    - Available Exercise Bank (use ONLY these IDs):
    ${exerciseBankString}

    RULES:
    1.  **Strictly use exercise IDs from the provided Exercise Bank.** Do not invent exercises or IDs.
    2.  If the user's goal is rehabilitation (e.g., mentions "posture", "pain", "rehab"), prioritize exercises with the 'Rehab / Prehab' or 'Mobility / Stretch' movement pattern.
    3.  If the goal is strength, use linear periodization principles (e.g., lower rep ranges for main lifts).
    4.  Create a balanced weekly plan. Distribute the routines across the week (Monday=1, Sunday=7).
    5.  The response MUST be a single, valid JSON object matching the provided schema. Do not include any markdown formatting like \`\`\`json.

    Analyze all the data and generate a professional, motivating, and effective plan.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            motivation: { type: Type.STRING, description: "A short, motivating explanation of why this program is suitable for the user's goal." },
            smartGoals: {
              type: Type.ARRAY,
              description: "A list of 1-2 suggested 'smart goals' for the user to add to their TargetsView.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Example: 'Reach 100kg Bench Press'" },
                  targetValue: { type: Type.NUMBER, description: "The target value for the goal." },
                  targetType: { type: Type.STRING, enum: ['exercise', 'body_weight', 'body_measurement'] },
                  exerciseId: { type: Type.STRING, description: "The exercise ID from the bank if targetType is 'exercise'." },
                  deadline: { type: Type.STRING, description: "Suggested deadline in YYYY-MM-DD format, usually 3 months from now." },
                  strategy: { type: Type.STRING, enum: ['linear', 'undulating', 'peaking'], description: "The progression strategy."}
                }
              }
            },
            routines: {
              type: Type.ARRAY,
              description: "A list of workout routines for the week.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of the workout, e.g., 'Push Day'." },
                  description: { type: Type.STRING, description: "Focus for the workout." },
                  scheduledDay: { type: Type.NUMBER, description: "Day of the week (1=Monday, 7=Sunday)." },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING, description: "The exact exercise ID from the provided bank." },
                        targetSets: { type: Type.NUMBER, description: "Number of sets." },
                        targetReps: { type: Type.STRING, description: "Target rep range, e.g., '8-10'." }
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

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("AI plan generation returned an empty response.");
    }
    return JSON.parse(jsonText.trim()) as AIPlanResponse;
  } catch (error) {
      console.error("AI plan generation failed:", error);
      throw new Error("AI-assistenten kunde inte skapa en plan. Kontrollera din anslutning eller försök omformulera din förfrågan.");
  }
};