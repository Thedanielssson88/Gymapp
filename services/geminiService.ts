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
