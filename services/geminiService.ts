
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, WorkoutSession, Exercise, MovementPattern, MuscleGroup, AIProgram, AIPlanResponse } from "../types";
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

    const text = response.text;
    return text || "Fokusera på kontakten i varje repetition idag för maximal muskelaktivering.";
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
    
    TIDSPERSPEKTIV:
    - Längd: ${preferences.durationWeeks} veckor.
    - Frekvens: ${preferences.daysPerWeek} pass per vecka.
    - Tid/pass: Ca ${preferences.durationMinutes} min.
    
    ANVÄNDARENS STYRKA (PPL):
    PUSH: ${pplStats.push.level} (${pplStats.push.max1RM}kg), PULL: ${pplStats.pull.level} (${pplStats.pull.max1RM}kg), LEGS: ${pplStats.legs.level} (${pplStats.legs.max1RM}kg).
    Profil: ${JSON.stringify(currentProfile)}

    UPPGIFT:
    Skapa UNIKA rutiner för varje vecka (1 till ${preferences.durationWeeks}).
    Du ska applicera "Progressive Overload" (gradvis ökning) mellan veckorna. 
    Exempel: Vecka 1 är introduktion, Vecka 2 ökar volym/vikt, Vecka 3 är tyngst.
    
    REGLER:
    1. Använd ENDAST övnings-ID från: ${exerciseBankString}
    2. Estimera vikter (estimatedWeight) baserat på PPL.
    3. Returnera JSON med ALLA pass för hela perioden (${preferences.daysPerWeek * preferences.durationWeeks} st totalt).
    4. Sätt ett unikt namn för varje pass, t.ex. "Vecka 1: Tung Press".
    5. Inkludera weekNumber för varje pass.
    6. Returnera ett enda JSON-objekt, utan markdown.
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
                  strategy: { type: Type.STRING, enum: ['linear', 'undulating', 'peaking']}
                }
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
                      },
                      required: ["id", "targetSets", "targetReps", "estimatedWeight"]
                    }
                  }
                },
                required: ["name", "description", "weekNumber", "scheduledDay", "exercises"]
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

export const generateNextPhase = async (
  currentProgram: AIProgram,
  programHistory: WorkoutSession[],
  availableExercises: Exercise[],
  pplStats: any
): Promise<AIPlanResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const exerciseList = availableExercises.map((e: any) => `${e.id} (${e.name})`).join(', ');

  const performanceSummary = programHistory.map(h => 
    `Pass: ${h.name}, Datum: ${h.date}, Antal övningar: ${h.exercises.length}`
  ).join('\n');

  const contents = `
    Du är en expertcoach. Användaren har just avslutat en fas i sitt program: "${currentProgram.name}".
    
    MÅL MED PROGRAMMET: "${currentProgram.motivation}"
    
    UTFÖRDA PASS (HISTORIK):
    ${performanceSummary || "Ingen historik för detta program ännu."}
    
    NUVARANDE STYRKEPROFIL (PPL):
    PUSH: ${pplStats.push.level}, PULL: ${pplStats.pull.level}, LEGS: ${pplStats.legs.level}

    UPPGIFT:
    Skapa NÄSTA fas (4 veckor) av programmet. 
    Princip: Progressive Overload. Öka svårighetsgraden något (fler set, tyngre vikter eller svårare övningar) jämfört med förra fasen. Behåll strukturen om den fungerat bra.

    REGLER:
    1. Använd ENDAST övnings-ID från: ${exerciseList}
    2. Estimera vikter (estimatedWeight) baserat på PPL-profilen och historiken.
    3. Returnera JSON (samma struktur som AIPlanResponse). Skapa inga smartGoals.
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

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("AI plan generation returned an empty response for the next phase.");
    }
    return JSON.parse(jsonText.trim()) as AIPlanResponse;
  } catch (error) {
    console.error("Gemini Error (generateNextPhase):", error);
    throw new Error("AI-assistenten kunde inte generera nästa fas. Försök igen.");
  }
};
