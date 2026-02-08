
import { Exercise, MuscleGroup, Equipment } from '../types';

// Typer för Wger API-svar
interface WgerResult {
  id: number;
  name: string;
  category: number;
  equipment: number[];
  description?: string;
}

const WGER_BASE_URL = 'https://wger.de/api/v2';

// Mappning: Wger ID -> Dina MuscleGroups
const CATEGORY_MAP: Record<number, MuscleGroup[]> = {
  10: ['Mage'],       // Abs
  11: ['Bröst'],      // Chest
  12: ['Rygg'],       // Back
  13: ['Axlar'],      // Shoulders
  14: ['Vader'],      // Calves
  9:  ['Framsida lår', 'Baksida lår'], // Legs
  8:  ['Biceps', 'Triceps'], // Arms
  15: ['Baksida lår'] // Back of legs specifically
};

// Mappning: Wger ID -> Dina Equipment
const EQUIPMENT_MAP: Record<number, Equipment> = {
  1: Equipment.BARBELL,
  2: Equipment.EZ_BAR,
  3: Equipment.DUMBBELL,
  4: Equipment.BODYWEIGHT, // Gym mat
  6: Equipment.KETTLEBELL,
  7: Equipment.BODYWEIGHT,
  8: Equipment.BENCH,
  9: Equipment.PULLUP_BAR,
  10: Equipment.MACHINES, // Swiss ball etc.
  13: Equipment.CABLES
};

export const searchWger = async (query: string): Promise<any[]> => {
  try {
    // Sök på engelska (language=2)
    const response = await fetch(`${WGER_BASE_URL}/exercise/search/?term=${encodeURIComponent(query)}&language=2`, {
        headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error('Search request failed');
    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error("Wger API Error:", error);
    return [];
  }
};

export const fetchWgerDetails = async (wgerId: string | number, fallbackName?: string): Promise<Partial<Exercise>> => {
  const cleanId = String(wgerId).replace('wger-', '');
  
  try {
    // 1. Försök hämta detaljerad info (Bilder, Beskrivning etc.)
    let response = await fetch(`${WGER_BASE_URL}/exerciseinfo/${cleanId}/`, {
        headers: { 'Accept': 'application/json' }
    });

    // 2. Om detaljer saknas (t.ex. 404), försök hämta bas-övningen istället
    if (!response.ok) {
        console.warn(`ExerciseInfo saknas för ${cleanId} (Status: ${response.status}), försöker med fallback...`);
        response = await fetch(`${WGER_BASE_URL}/exercise/${cleanId}/`, {
             headers: { 'Accept': 'application/json' }
        });
        
        // Om även fallbacken misslyckas, kasta ett fel
        if (!response.ok) {
            throw new Error(`Wger API Error: ${response.status} ${response.statusText}`);
        }
    }

    const data = await response.json();

    // 3. Normalisera data (eftersom strukturen skiljer sig mellan endpoints)
    // Kategori: Ibland ett objekt {id: 11}, ibland bara ett nummer 11
    const categoryId = data.category?.id || data.category;
    
    // Utrustning: Ibland en lista med objekt, ibland en lista med IDn
    const equipmentIds: number[] = Array.isArray(data.equipment) 
        ? data.equipment.map((eq: any) => (typeof eq === 'object' ? eq.id : eq))
        : [];

    const muscles: MuscleGroup[] = categoryId ? (CATEGORY_MAP[categoryId] || []) : [];
    
    const mappedEquipment: Equipment[] = [];
    equipmentIds.forEach((id) => {
      if (EQUIPMENT_MAP[id]) mappedEquipment.push(EQUIPMENT_MAP[id]);
    });

    // Rensa HTML-taggar från beskrivningen (om den finns)
    const desc = data?.description || '';
    const cleanDesc = desc.replace(/<[^>]*>?/gm, '').trim();

    // Hämta bild (finns oftast bara på exerciseinfo-endpointen)
    let imageUrl = '';
    if (Array.isArray(data.images) && data.images.length > 0) {
        imageUrl = data.images[0].image;
    }

    return {
      name: data?.name || fallbackName || "Namnlös övning",
      primaryMuscles: muscles,
      muscleGroups: muscles,
      equipment: mappedEquipment.length > 0 ? Array.from(new Set(mappedEquipment)) : [Equipment.BODYWEIGHT],
      description: cleanDesc,
      imageUrl: imageUrl,
      // Vi sätter defaults för värden API:t inte har
      difficultyMultiplier: 1.0, 
      bodyweightCoefficient: 0
    };

  } catch (error) {
    // 4. Nöd-return: Returnera ett skal med fallback-namnet så att editorn ändå kan öppnas
    // Vi använder warn istället för error för att inte skrämma användaren om det bara är en 404
    console.warn(`Kunde inte hämta detaljer för ID: ${cleanId}. Använder fallback-data.`);
    
    return { 
      name: fallbackName || "Importerad Övning", 
      description: "Automatisk hämtning av detaljer misslyckades. Vänligen fyll i övningens detaljer manuellt.",
      primaryMuscles: [],
      muscleGroups: [],
      equipment: [Equipment.BODYWEIGHT],
      difficultyMultiplier: 1.0,
      bodyweightCoefficient: 0
    };
  }
};
