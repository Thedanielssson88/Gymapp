import { MovementPattern, Equipment, Exercise, Zone } from './types';

export const EXERCISE_DATABASE: Exercise[] = [
  // --- DEL 1: GYM (SATS PROFIL) ---
  
  // Bröst (Horizontal Push)
  { id: 'g-br-1', name: 'Bänkpress (Skivstång)', pattern: MovementPattern.HORIZONTAL_PUSH, muscleGroups: ['Bröst', 'Triceps', 'Axlar'], equipment: [Equipment.BARBELL], difficultyMultiplier: 1.0, bodyweightCoefficient: 0.0 },
  { id: 'g-br-2', name: 'Lutande Bänkpress (Skivstång)', pattern: MovementPattern.HORIZONTAL_PUSH, muscleGroups: ['Bröst', 'Axlar', 'Triceps'], equipment: [Equipment.BARBELL], difficultyMultiplier: 1.05, bodyweightCoefficient: 0.0 },
  { id: 'g-br-3', name: 'Hantelpress', pattern: MovementPattern.HORIZONTAL_PUSH, muscleGroups: ['Bröst', 'Axlar', 'Triceps'], equipment: [Equipment.DUMBBELL], difficultyMultiplier: 0.95, bodyweightCoefficient: 0.0 },
  { id: 'g-br-4', name: 'Lutande Hantelpress', pattern: MovementPattern.HORIZONTAL_PUSH, muscleGroups: ['Bröst', 'Axlar', 'Triceps'], equipment: [Equipment.DUMBBELL], difficultyMultiplier: 1.0, bodyweightCoefficient: 0.0 },
  { id: 'g-br-5', name: 'Kryssdrag i Kabel (Flyes)', pattern: MovementPattern.ISOLATION, muscleGroups: ['Bröst'], equipment: [Equipment.CABLES], difficultyMultiplier: 0.6, bodyweightCoefficient: 0.0 },
  { id: 'g-br-6', name: 'Pec Deck Machine', pattern: MovementPattern.ISOLATION, muscleGroups: ['Bröst'], equipment: [Equipment.MACHINES], difficultyMultiplier: 0.55, bodyweightCoefficient: 0.0 },
  { id: 'g-br-7', name: 'Bröstpress (Maskin)', pattern: MovementPattern.HORIZONTAL_PUSH, muscleGroups: ['Bröst', 'Triceps'], equipment: [Equipment.MACHINES], difficultyMultiplier: 0.8, bodyweightCoefficient: 0.0 },
  { id: 'g-br-8', name: 'Dips (Bröstfokus)', pattern: MovementPattern.HORIZONTAL_PUSH, muscleGroups: ['Bröst', 'Triceps', 'Axlar'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.85, bodyweightCoefficient: 1.0 },
  { id: 'g-br-9', name: 'Nedåtlutande Bänkpress', pattern: MovementPattern.HORIZONTAL_PUSH, muscleGroups: ['Bröst', 'Triceps'], equipment: [Equipment.BARBELL], difficultyMultiplier: 0.95, bodyweightCoefficient: 0.0 },
  { id: 'g-br-10', name: 'Bänkpress i Smith', pattern: MovementPattern.HORIZONTAL_PUSH, muscleGroups: ['Bröst', 'Triceps'], equipment: [Equipment.MACHINES], difficultyMultiplier: 0.85, bodyweightCoefficient: 0.0 },

  // Rygg (Pull)
  { id: 'g-ry-1', name: 'Marklyft', pattern: MovementPattern.HINGE, muscleGroups: ['Ryggslut', 'Säte', 'Baksida lår', 'Trapezius', 'Rygg'], equipment: [Equipment.BARBELL], difficultyMultiplier: 1.2, bodyweightCoefficient: 0.0 },
  { id: 'g-ry-2', name: 'Pull-Ups (Chins)', pattern: MovementPattern.VERTICAL_PULL, muscleGroups: ['Rygg', 'Biceps', 'Underarmar'], equipment: [Equipment.BODYWEIGHT, Equipment.PULLUP_BAR], difficultyMultiplier: 0.95, bodyweightCoefficient: 1.0 },
  { id: 'g-ry-3', name: 'Latsdrag (Brett grepp)', pattern: MovementPattern.VERTICAL_PULL, muscleGroups: ['Rygg', 'Biceps'], equipment: [Equipment.CABLES, Equipment.MACHINES], difficultyMultiplier: 0.8, bodyweightCoefficient: 0.0 },
  { id: 'g-ry-4', name: 'Sittande Kabelrodd', pattern: MovementPattern.HORIZONTAL_PULL, muscleGroups: ['Rygg', 'Biceps', 'Trapezius'], equipment: [Equipment.CABLES, Equipment.MACHINES], difficultyMultiplier: 0.75, bodyweightCoefficient: 0.0 },
  { id: 'g-ry-5', name: 'Skivstångsrodd', pattern: MovementPattern.HORIZONTAL_PULL, muscleGroups: ['Rygg', 'Biceps', 'Ryggslut'], equipment: [Equipment.BARBELL], difficultyMultiplier: 1.0, bodyweightCoefficient: 0.0 },
  { id: 'g-ry-6', name: 'Enarms Hantelrodd', pattern: MovementPattern.HORIZONTAL_PULL, muscleGroups: ['Rygg', 'Biceps'], equipment: [Equipment.DUMBBELL], difficultyMultiplier: 0.85, bodyweightCoefficient: 0.0 },
  { id: 'g-ry-7', name: 'T-Bar Rodd', pattern: MovementPattern.HORIZONTAL_PULL, muscleGroups: ['Rygg', 'Biceps', 'Trapezius'], equipment: [Equipment.BARBELL, Equipment.MACHINES], difficultyMultiplier: 0.95, bodyweightCoefficient: 0.0 },
  { id: 'g-ry-8', name: 'Face Pulls', pattern: MovementPattern.ISOLATION, muscleGroups: ['Axlar', 'Trapezius', 'Rygg'], equipment: [Equipment.CABLES], difficultyMultiplier: 0.5, bodyweightCoefficient: 0.0 },
  { id: 'g-ry-9', name: 'Raka Latsdrag (Kabel)', pattern: MovementPattern.ISOLATION, muscleGroups: ['Rygg'], equipment: [Equipment.CABLES], difficultyMultiplier: 0.55, bodyweightCoefficient: 0.0 },

  // Ben - Framsida (Squat Pattern)
  { id: 'g-be-1', name: 'Knäböj (Skivstång)', pattern: MovementPattern.SQUAT, muscleGroups: ['Framsida lår', 'Säte', 'Ryggslut'], equipment: [Equipment.BARBELL], difficultyMultiplier: 1.1, bodyweightCoefficient: 0.0 },
  { id: 'g-be-2', name: 'Frontböj', pattern: MovementPattern.SQUAT, muscleGroups: ['Framsida lår', 'Mage', 'Ryggslut'], equipment: [Equipment.BARBELL], difficultyMultiplier: 1.15, bodyweightCoefficient: 0.0 },
  { id: 'g-be-3', name: 'Benpress', pattern: MovementPattern.SQUAT, muscleGroups: ['Framsida lår', 'Säte', 'Adduktorer'], equipment: [Equipment.MACHINES], difficultyMultiplier: 0.85, bodyweightCoefficient: 0.0 },
  { id: 'g-be-4', name: 'Benspark (Leg Extension)', pattern: MovementPattern.ISOLATION, muscleGroups: ['Framsida lår'], equipment: [Equipment.MACHINES], difficultyMultiplier: 0.5, bodyweightCoefficient: 0.0 },
  { id: 'g-be-5', name: 'Goblet Squat', pattern: MovementPattern.SQUAT, muscleGroups: ['Framsida lår', 'Säte'], equipment: [Equipment.KETTLEBELL, Equipment.DUMBBELL], difficultyMultiplier: 0.8, bodyweightCoefficient: 0.0 },
  { id: 'g-be-6', name: 'Bulgarian Split Squat', pattern: MovementPattern.LUNGE, muscleGroups: ['Framsida lår', 'Säte', 'Adduktorer'], equipment: [Equipment.DUMBBELL], difficultyMultiplier: 1.0, bodyweightCoefficient: 0.8 },
  { id: 'g-be-7', name: 'Hack Squat', pattern: MovementPattern.SQUAT, muscleGroups: ['Framsida lår', 'Säte'], equipment: [Equipment.MACHINES], difficultyMultiplier: 0.95, bodyweightCoefficient: 0.0 },
  { id: 'g-be-8', name: 'Utfallsgång (Hantlar)', pattern: MovementPattern.LUNGE, muscleGroups: ['Framsida lår', 'Säte'], equipment: [Equipment.DUMBBELL], difficultyMultiplier: 0.9, bodyweightCoefficient: 0.8 },

  // Ben - Baksida (Hinge Pattern)
  { id: 'g-bb-1', name: 'Rumänska Marklyft (RDL)', pattern: MovementPattern.HINGE, muscleGroups: ['Baksida lår', 'Säte', 'Ryggslut'], equipment: [Equipment.BARBELL], difficultyMultiplier: 1.0, bodyweightCoefficient: 0.0 },
  { id: 'g-bb-2', name: 'Liggande Lårcurl', pattern: MovementPattern.ISOLATION, muscleGroups: ['Baksida lår'], equipment: [Equipment.MACHINES], difficultyMultiplier: 0.55, bodyweightCoefficient: 0.0 },
  { id: 'g-bb-3', name: 'Sittande Lårcurl', pattern: MovementPattern.ISOLATION, muscleGroups: ['Baksida lår'], equipment: [Equipment.MACHINES], difficultyMultiplier: 0.5, bodyweightCoefficient: 0.0 },
  { id: 'g-bb-4', name: 'Hip Thrust', pattern: MovementPattern.HINGE, muscleGroups: ['Säte', 'Baksida lår'], equipment: [Equipment.BARBELL, Equipment.MACHINES], difficultyMultiplier: 1.0, bodyweightCoefficient: 0.0 },
  { id: 'g-bb-5', name: 'Kettlebell Swing', pattern: MovementPattern.HINGE, muscleGroups: ['Säte', 'Ryggslut', 'Baksida lår'], equipment: [Equipment.KETTLEBELL], difficultyMultiplier: 0.85, bodyweightCoefficient: 0.0 },

  // Axlar (Vertical Push)
  { id: 'g-ax-1', name: 'Militärpress', pattern: MovementPattern.VERTICAL_PUSH, muscleGroups: ['Axlar', 'Triceps', 'Trapezius'], equipment: [Equipment.BARBELL], difficultyMultiplier: 1.0, bodyweightCoefficient: 0.0 },
  { id: 'g-ax-2', name: 'Sittande Hantelpress', pattern: MovementPattern.VERTICAL_PUSH, muscleGroups: ['Axlar', 'Triceps'], equipment: [Equipment.DUMBBELL], difficultyMultiplier: 0.9, bodyweightCoefficient: 0.0 },
  { id: 'g-ax-3', name: 'Sidolyft (Hantlar)', pattern: MovementPattern.ISOLATION, muscleGroups: ['Axlar'], equipment: [Equipment.DUMBBELL], difficultyMultiplier: 0.5, bodyweightCoefficient: 0.0 },
  { id: 'g-ax-4', name: 'Arnold Press', pattern: MovementPattern.VERTICAL_PUSH, muscleGroups: ['Axlar', 'Triceps'], equipment: [Equipment.DUMBBELL], difficultyMultiplier: 0.95, bodyweightCoefficient: 0.0 },
  { id: 'g-ax-5', name: 'Axelryck (Shrugs)', pattern: MovementPattern.ISOLATION, muscleGroups: ['Trapezius'], equipment: [Equipment.DUMBBELL, Equipment.BARBELL], difficultyMultiplier: 0.6, bodyweightCoefficient: 0.0 },

  // Armar (Isolation)
  { id: 'g-ar-1', name: 'Bicepscurls (Skivstång)', pattern: MovementPattern.ISOLATION, muscleGroups: ['Biceps', 'Underarmar'], equipment: [Equipment.BARBELL], difficultyMultiplier: 0.65, bodyweightCoefficient: 0.0 },
  { id: 'g-ar-2', name: 'Hammercurls', pattern: MovementPattern.ISOLATION, muscleGroups: ['Biceps', 'Underarmar'], equipment: [Equipment.DUMBBELL], difficultyMultiplier: 0.6, bodyweightCoefficient: 0.0 },
  { id: 'g-ar-3', name: 'Triceps Pushdowns (Rep)', pattern: MovementPattern.ISOLATION, muscleGroups: ['Triceps'], equipment: [Equipment.CABLES], difficultyMultiplier: 0.5, bodyweightCoefficient: 0.0 },
  { id: 'g-ar-4', name: 'Skullcrushers', pattern: MovementPattern.ISOLATION, muscleGroups: ['Triceps'], equipment: [Equipment.BARBELL], difficultyMultiplier: 0.7, bodyweightCoefficient: 0.0 },
  { id: 'g-ar-5', name: 'Smal Bänkpress', pattern: MovementPattern.HORIZONTAL_PUSH, muscleGroups: ['Triceps', 'Bröst'], equipment: [Equipment.BARBELL], difficultyMultiplier: 0.9, bodyweightCoefficient: 0.0 },

  // Mage
  { id: 'g-ma-1', name: 'Cable Crunch', pattern: MovementPattern.CORE, muscleGroups: ['Mage'], equipment: [Equipment.CABLES], difficultyMultiplier: 0.6, bodyweightCoefficient: 0.0 },
  { id: 'g-ma-2', name: 'Hängande Benlyft', pattern: MovementPattern.CORE, muscleGroups: ['Mage'], equipment: [Equipment.PULLUP_BAR, Equipment.BODYWEIGHT], difficultyMultiplier: 0.75, bodyweightCoefficient: 0.5 },

  // --- DEL 2: KROPPSVIKT (HEMMA / RESA) ---

  // Bröst
  { id: 'h-br-1', name: 'Armhävningar', pattern: MovementPattern.HORIZONTAL_PUSH, muscleGroups: ['Bröst', 'Triceps', 'Axlar'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.55, bodyweightCoefficient: 0.65 },
  { id: 'h-br-2', name: 'Diamantarmhävningar', pattern: MovementPattern.HORIZONTAL_PUSH, muscleGroups: ['Triceps', 'Bröst'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.65, bodyweightCoefficient: 0.65 },
  { id: 'h-br-3', name: 'Lutande Armhävningar', pattern: MovementPattern.HORIZONTAL_PUSH, muscleGroups: ['Bröst', 'Triceps'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.4, bodyweightCoefficient: 0.49 },
  { id: 'h-br-4', name: 'Nedåtlutande Armhävningar', pattern: MovementPattern.HORIZONTAL_PUSH, muscleGroups: ['Bröst', 'Axlar'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.7, bodyweightCoefficient: 0.75 },
  { id: 'h-br-5', name: 'Archer Push-Ups', pattern: MovementPattern.HORIZONTAL_PUSH, muscleGroups: ['Bröst', 'Triceps'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.9, bodyweightCoefficient: 0.8 },

  // Rygg
  { id: 'h-ry-1', name: 'Pull-Ups', pattern: MovementPattern.VERTICAL_PULL, muscleGroups: ['Rygg', 'Biceps'], equipment: [Equipment.BODYWEIGHT, Equipment.PULLUP_BAR], difficultyMultiplier: 0.95, bodyweightCoefficient: 1.0 },
  { id: 'h-ry-2', name: 'Chin-Ups', pattern: MovementPattern.VERTICAL_PULL, muscleGroups: ['Biceps', 'Rygg'], equipment: [Equipment.BODYWEIGHT, Equipment.PULLUP_BAR], difficultyMultiplier: 0.9, bodyweightCoefficient: 1.0 },
  { id: 'h-ry-3', name: 'Superman', pattern: MovementPattern.HINGE, muscleGroups: ['Ryggslut', 'Säte'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.35, bodyweightCoefficient: 0.1 },
  { id: 'h-ry-4', name: 'Bordsrodd (Inverted Row)', pattern: MovementPattern.HORIZONTAL_PULL, muscleGroups: ['Rygg', 'Biceps'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.65, bodyweightCoefficient: 0.5 },

  // Ben
  { id: 'h-be-1', name: 'Knäböj (Kroppsvikt)', pattern: MovementPattern.SQUAT, muscleGroups: ['Framsida lår', 'Säte'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.45, bodyweightCoefficient: 0.75 },
  { id: 'h-be-2', name: 'Upphopp (Jump Squat)', pattern: MovementPattern.SQUAT, muscleGroups: ['Framsida lår', 'Säte'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.7, bodyweightCoefficient: 0.75 },
  { id: 'h-be-3', name: 'Pistol Squat', pattern: MovementPattern.SQUAT, muscleGroups: ['Framsida lår', 'Säte', 'Mage'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 1.1, bodyweightCoefficient: 0.85 },
  { id: 'h-be-4', name: 'Utfallsteg', pattern: MovementPattern.LUNGE, muscleGroups: ['Framsida lår', 'Säte'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.55, bodyweightCoefficient: 0.8 },
  { id: 'h-be-5', name: 'Höftlyft (Glute Bridge)', pattern: MovementPattern.HINGE, muscleGroups: ['Säte', 'Baksida lår'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.4, bodyweightCoefficient: 0.4 },
  { id: 'h-be-6', name: 'Enbens Höftlyft', pattern: MovementPattern.HINGE, muscleGroups: ['Säte', 'Baksida lår'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.6, bodyweightCoefficient: 0.5 },
  { id: 'h-be-7', name: 'Tåhävningar', pattern: MovementPattern.ISOLATION, muscleGroups: ['Vader'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.35, bodyweightCoefficient: 1.0 },
  { id: 'h-be-8', name: 'Jägarvila (Wall Sit)', pattern: MovementPattern.SQUAT, muscleGroups: ['Framsida lår'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.5, bodyweightCoefficient: 0.0 },

  // Axlar & Armar
  { id: 'h-ax-1', name: 'Pike Push-Ups', pattern: MovementPattern.VERTICAL_PUSH, muscleGroups: ['Axlar', 'Triceps'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.75, bodyweightCoefficient: 0.6 },
  { id: 'h-ax-2', name: 'Handstående Armhävning', pattern: MovementPattern.VERTICAL_PUSH, muscleGroups: ['Axlar', 'Triceps'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 1.3, bodyweightCoefficient: 1.0 },
  { id: 'h-ar-1', name: 'Bänk-dips', pattern: MovementPattern.HORIZONTAL_PUSH, muscleGroups: ['Triceps', 'Axlar'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.5, bodyweightCoefficient: 0.5 },
  { id: 'h-ar-2', name: 'Björngång (Bear Crawl)', pattern: MovementPattern.CORE, muscleGroups: ['Axlar', 'Mage'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.65, bodyweightCoefficient: 0.4 },

  // Mage / Core
  { id: 'h-ma-1', name: 'Plankan', pattern: MovementPattern.CORE, muscleGroups: ['Mage'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.4, bodyweightCoefficient: 0.0 },
  { id: 'h-ma-2', name: 'Sidoplanka', pattern: MovementPattern.CORE, muscleGroups: ['Mage'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.45, bodyweightCoefficient: 0.0 },
  { id: 'h-ma-3', name: 'Cykel-crunches', pattern: MovementPattern.CORE, muscleGroups: ['Mage'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.4, bodyweightCoefficient: 0.1 },
  { id: 'h-ma-4', name: 'Liggande Benlyft', pattern: MovementPattern.CORE, muscleGroups: ['Mage'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.5, bodyweightCoefficient: 0.15 },
  { id: 'h-ma-5', name: 'Fällkniven (V-Ups)', pattern: MovementPattern.CORE, muscleGroups: ['Mage'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.75, bodyweightCoefficient: 0.2 },
  { id: 'h-ma-6', name: 'Mountain Climbers', pattern: MovementPattern.CORE, muscleGroups: ['Mage', 'Axlar'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.6, bodyweightCoefficient: 0.3 },
  { id: 'h-ma-7', name: 'Burpees', pattern: MovementPattern.CORE, muscleGroups: ['Framsida lår', 'Bröst', 'Axlar'], equipment: [Equipment.BODYWEIGHT], difficultyMultiplier: 0.9, bodyweightCoefficient: 0.65 }
];

export const INITIAL_ZONES: Zone[] = [
  { id: 'zone-a', name: 'Hemma', inventory: [Equipment.DUMBBELL, Equipment.BANDS, Equipment.BODYWEIGHT, Equipment.PULLUP_BAR], icon: 'home' },
  { id: 'zone-b', name: 'Gymmet', inventory: [Equipment.BARBELL, Equipment.DUMBBELL, Equipment.KETTLEBELL, Equipment.CABLES, Equipment.MACHINES, Equipment.BODYWEIGHT, Equipment.PULLUP_BAR], icon: 'building' },
  { id: 'zone-c', name: 'Resa', inventory: [Equipment.BODYWEIGHT], icon: 'briefcase' }
];