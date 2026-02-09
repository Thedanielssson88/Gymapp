import { GoogleGenAI } from "@google/genai";
import { UserProfile, WorkoutSession } from "../types";

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
    // Initialisera Gemini klienten med API-nyckel från miljövariabler enligt riktlinjer.
    // Vi skapar en ny instans vid varje anrop för att säkerställa att vi har den senaste konfigurationen.
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    
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

    // Returnera genererad text genom att hämta .text egenskapen direkt från GenerateContentResponse.
    return response.text || "Fokusera på kontakten i varje repetition idag för maximal muskelaktivering.";
  } catch (error) {
    console.error("Kunde inte hämta insikter från Gemini API:", error);
    
    // Slumpmässiga reservtips om API-anropet misslyckas för att behålla UI-upplevelsen.
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