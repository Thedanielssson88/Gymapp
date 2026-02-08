
import { MovementPattern, Equipment, Exercise, Zone, GoalTarget } from './types';

export const INITIAL_GOAL_TARGETS: GoalTarget[] = [
  { id: 'target-push', name: 'PUSH-MUSKLER', targetSets: 50, muscleGroups: ['Bröst', 'Axlar', 'Triceps'] },
  { id: 'target-pull', name: 'PULL-MUSKLER', targetSets: 27, muscleGroups: ['Rygg', 'Biceps', 'Underarmar', 'Trapezius'] },
  { id: 'target-legs', name: 'BEN-MUSKLER', targetSets: 45, muscleGroups: ['Framsida lår', 'Baksida lår', 'Säte', 'Vader'] }
];

export const EXERCISE_DATABASE: Exercise[] = [
  // ==========================================
  // DEL 1: SATS / KOMMERSIELLT GYM
  // ==========================================

  // --- BRÖST (Horizontal Push) ---
  {
    id: 'g-br-1',
    name: 'Bänkpress (Skivstång)',
    pattern: MovementPattern.HORIZONTAL_PUSH,
    primaryMuscles: ['Bröst'],
    secondaryMuscles: ['Triceps', 'Axlar'],
    muscleGroups: ['Bröst', 'Triceps', 'Axlar'],
    equipment: [Equipment.BARBELL],
    difficultyMultiplier: 1.0,
    bodyweightCoefficient: 0.0,
    description: 'Ligg på bänken, håll stången med ett grepp bredare än axlarna. Sänk stången till bröstet och pressa upp.',
    alternativeExIds: ['g-br-3', 'g-br-13', 'h-br-1']
  },
  {
    id: 'g-br-2',
    name: 'Lutande Bänkpress (Skivstång)',
    pattern: MovementPattern.HORIZONTAL_PUSH,
    primaryMuscles: ['Bröst'],
    secondaryMuscles: ['Axlar', 'Triceps'],
    muscleGroups: ['Bröst', 'Axlar', 'Triceps'],
    equipment: [Equipment.BARBELL],
    difficultyMultiplier: 1.05,
    bodyweightCoefficient: 0.0,
    description: 'Bänkpress på en bänk med 30-45 graders lutning för att fokusera på övre bröstmuskulaturen.',
    alternativeExIds: ['g-br-5', 'h-br-4']
  },
  {
    id: 'g-br-9',
    name: 'Nedåtlutande Bänkpress (Skivstång)',
    pattern: MovementPattern.HORIZONTAL_PUSH,
    primaryMuscles: ['Bröst'],
    secondaryMuscles: ['Triceps'],
    muscleGroups: ['Bröst', 'Triceps'],
    equipment: [Equipment.BARBELL],
    difficultyMultiplier: 1.0,
    bodyweightCoefficient: 0.0,
    description: 'Bänkpress på en bänk som lutar nedåt för att fokusera på nedre delen av bröstet.',
    alternativeExIds: ['g-br-1']
  },
  {
    id: 'g-br-3',
    name: 'Hantelpress (Plan bänk)',
    pattern: MovementPattern.HORIZONTAL_PUSH,
    primaryMuscles: ['Bröst'],
    secondaryMuscles: ['Axlar', 'Triceps'],
    muscleGroups: ['Bröst', 'Axlar', 'Triceps'],
    equipment: [Equipment.DUMBBELL],
    difficultyMultiplier: 0.95,
    bodyweightCoefficient: 0.0,
    description: 'Pressa hantlar från bröstet upp till raka armar. Ger större rörelseomfång än skivstång.',
    alternativeExIds: ['g-br-1', 'h-br-1']
  },
  {
    id: 'g-br-10',
    name: 'Lutande Hantelpress',
    pattern: MovementPattern.HORIZONTAL_PUSH,
    primaryMuscles: ['Bröst'],
    secondaryMuscles: ['Axlar', 'Triceps'],
    muscleGroups: ['Bröst', 'Axlar', 'Triceps'],
    equipment: [Equipment.DUMBBELL],
    difficultyMultiplier: 1.0,
    bodyweightCoefficient: 0.0,
    description: 'Lutande hantelpress fokuserar på övre bröstmusklerna.',
    alternativeExIds: ['g-br-2', 'h-br-4']
  },
  {
    id: 'g-br-12',
    name: 'Bröstpress (Maskin)',
    pattern: MovementPattern.HORIZONTAL_PUSH,
    primaryMuscles: ['Bröst'],
    secondaryMuscles: ['Triceps'],
    muscleGroups: ['Bröst', 'Triceps'],
    equipment: [Equipment.MACHINES],
    difficultyMultiplier: 0.85,
    bodyweightCoefficient: 0.0,
    description: 'Sittande bröstpress i maskin. Stabilt och bra för att isolera bröstmusklerna.',
    alternativeExIds: ['g-br-1', 'h-br-1']
  },
  {
    id: 'g-br-14',
    name: 'Kryssdrag uppifrån (Cables)',
    pattern: MovementPattern.ISOLATION,
    primaryMuscles: ['Bröst'],
    secondaryMuscles: ['Axlar'],
    muscleGroups: ['Bröst'],
    equipment: [Equipment.CABLES],
    difficultyMultiplier: 0.7,
    bodyweightCoefficient: 0.0,
    description: 'Dra kablar från övre läget ner framför kroppen för att träffa nedre bröstet.',
    alternativeExIds: ['g-br-17', 'h-br-1']
  },
  {
    id: 'g-br-17',
    name: 'Pec Deck (Flys maskin)',
    pattern: MovementPattern.ISOLATION,
    primaryMuscles: ['Bröst'],
    secondaryMuscles: [],
    muscleGroups: ['Bröst'],
    equipment: [Equipment.MACHINES],
    difficultyMultiplier: 0.65,
    bodyweightCoefficient: 0.0,
    description: 'Bröstflys i maskin för att isolera och stretcha bröstmuskulaturen.',
    alternativeExIds: ['g-br-14']
  },
  {
    id: 'g-br-8',
    name: 'Dips (Bröstfokus)',
    pattern: MovementPattern.HORIZONTAL_PUSH,
    primaryMuscles: ['Bröst', 'Triceps'],
    secondaryMuscles: ['Axlar'],
    muscleGroups: ['Bröst', 'Triceps', 'Axlar'],
    equipment: [Equipment.BODYWEIGHT],
    difficultyMultiplier: 0.9,
    bodyweightCoefficient: 0.9,
    description: 'Luta dig framåt under utförandet för att lägga mer belastning på bröstet.',
    alternativeExIds: ['h-br-1', 'g-br-1']
  },

  // --- RYGG (Pull) ---
  {
    id: 'g-ry-1',
    name: 'Marklyft (Konventionell)',
    pattern: MovementPattern.HINGE,
    primaryMuscles: ['Ryggslut', 'Säte', 'Baksida lår'],
    secondaryMuscles: ['Trapezius', 'Rygg', 'Underarmar'],
    muscleGroups: ['Ryggslut', 'Säte', 'Baksida lår', 'Trapezius', 'Rygg'],
    equipment: [Equipment.BARBELL],
    difficultyMultiplier: 1.25,
    bodyweightCoefficient: 0.0,
    description: 'Dra stången från marken till stående position. Håll ryggen neutral.',
    alternativeExIds: ['g-ry-8', 'h-ry-3']
  },
  {
    id: 'g-ry-2',
    name: 'Pull-Ups (Brett grepp)',
    pattern: MovementPattern.VERTICAL_PULL,
    primaryMuscles: ['Rygg'],
    secondaryMuscles: ['Biceps', 'Underarmar'],
    muscleGroups: ['Rygg', 'Biceps'],
    equipment: [Equipment.BODYWEIGHT, Equipment.PULLUP_BAR],
    difficultyMultiplier: 1.0,
    bodyweightCoefficient: 1.0,
    description: 'Häv dig upp med överhandsgrepp tills hakan är över stången.',
    alternativeExIds: ['g-ry-3', 'h-ry-2']
  },
  {
    id: 'g-ry-3',
    name: 'Latsdrag (Brett grepp)',
    pattern: MovementPattern.VERTICAL_PULL,
    primaryMuscles: ['Rygg'],
    secondaryMuscles: ['Biceps', 'Axlar'],
    muscleGroups: ['Rygg', 'Biceps'],
    equipment: [Equipment.CABLES, Equipment.MACHINES],
    difficultyMultiplier: 0.85,
    bodyweightCoefficient: 0.0,
    description: 'Sittande drag i maskin. Dra stången ner mot övre delen av bröstet.',
    alternativeExIds: ['g-ry-2', 'h-ry-2']
  },
  {
    id: 'g-ry-5',
    name: 'Skivstångsrodd',
    pattern: MovementPattern.HORIZONTAL_PULL,
    primaryMuscles: ['Rygg'],
    secondaryMuscles: ['Biceps', 'Trapezius', 'Ryggslut'],
    muscleGroups: ['Rygg', 'Biceps', 'Ryggslut'],
    equipment: [Equipment.BARBELL],
    difficultyMultiplier: 1.1,
    bodyweightCoefficient: 0.0,
    description: 'Stå framåtlutad och dra stången mot naveln.',
    alternativeExIds: ['g-ry-15', 'h-ry-4']
  },
  {
    id: 'g-ry-14',
    name: 'Hantelrodd (Enarms)',
    pattern: MovementPattern.HORIZONTAL_PULL,
    primaryMuscles: ['Rygg'],
    secondaryMuscles: ['Biceps', 'Underarmar'],
    muscleGroups: ['Rygg', 'Biceps'],
    equipment: [Equipment.DUMBBELL],
    difficultyMultiplier: 0.9,
    bodyweightCoefficient: 0.0,
    description: 'Stöd ena handen mot en bänk och dra hanteln med den andra armen.',
    alternativeExIds: ['g-ry-5', 'h-ry-4']
  },
  {
    id: 'g-ry-15',
    name: 'Sittande Kabelrodd',
    pattern: MovementPattern.HORIZONTAL_PULL,
    primaryMuscles: ['Rygg'],
    secondaryMuscles: ['Biceps'],
    muscleGroups: ['Rygg', 'Biceps'],
    equipment: [Equipment.CABLES],
    difficultyMultiplier: 0.8,
    bodyweightCoefficient: 0.0,
    description: 'Sittande rodd i kabelmaskin med smalt eller brett handtag.',
    alternativeExIds: ['g-ry-5', 'h-ry-4']
  },
  {
    id: 'g-ry-17',
    name: 'Face Pulls',
    pattern: MovementPattern.ISOLATION,
    primaryMuscles: ['Axlar', 'Trapezius'],
    secondaryMuscles: ['Rygg'],
    muscleGroups: ['Axlar', 'Trapezius', 'Rygg'],
    equipment: [Equipment.CABLES],
    difficultyMultiplier: 0.6,
    bodyweightCoefficient: 0.0,
    description: 'Dra repet i kabelmaskinen mot ansiktet för att stärka baksida axlar.',
    alternativeExIds: ['g-ax-9']
  },

  // --- BEN FRAMSIDA (Squat) ---
  {
    id: 'g-be-1',
    name: 'Knäböj (Skivstång)',
    pattern: MovementPattern.SQUAT,
    primaryMuscles: ['Framsida lår', 'Säte'],
    secondaryMuscles: ['Ryggslut', 'Mage', 'Vader'],
    muscleGroups: ['Framsida lår', 'Säte', 'Ryggslut'],
    equipment: [Equipment.BARBELL],
    difficultyMultiplier: 1.2,
    bodyweightCoefficient: 0.0,
    description: 'Ha stången på nacken, böj benen tills låren är parallella med golvet.',
    alternativeExIds: ['g-be-2', 'h-be-1', 'g-be-6']
  },
  {
    id: 'g-be-5',
    name: 'Frontböj',
    pattern: MovementPattern.SQUAT,
    primaryMuscles: ['Framsida lår'],
    secondaryMuscles: ['Mage', 'Säte', 'Ryggslut'],
    muscleGroups: ['Framsida lår', 'Mage', 'Säte'],
    equipment: [Equipment.BARBELL],
    difficultyMultiplier: 1.25,
    bodyweightCoefficient: 0.0,
    description: 'Knäböj med stången på framsidan av axlarna.',
    alternativeExIds: ['g-be-1', 'h-be-1']
  },
  {
    id: 'g-be-2',
    name: 'Benpress',
    pattern: MovementPattern.SQUAT,
    primaryMuscles: ['Framsida lår', 'Säte'],
    secondaryMuscles: ['Vader'],
    muscleGroups: ['Framsida lår', 'Säte'],
    equipment: [Equipment.MACHINES],
    difficultyMultiplier: 0.8,
    bodyweightCoefficient: 0.0,
    description: 'Pressa plattan i benpressmaskinen med benen.',
    alternativeExIds: ['g-be-1', 'h-be-1']
  },
  {
    id: 'g-be-7',
    name: 'Benspark (Leg Extension)',
    pattern: MovementPattern.ISOLATION,
    primaryMuscles: ['Framsida lår'],
    secondaryMuscles: [],
    muscleGroups: ['Framsida lår'],
    equipment: [Equipment.MACHINES],
    difficultyMultiplier: 0.6,
    bodyweightCoefficient: 0.0,
    description: 'Isolationsövning för framsida lår i maskin.',
    alternativeExIds: ['h-be-1']
  },
  {
    id: 'g-be-3',
    name: 'Bulgarian Split Squat',
    pattern: MovementPattern.LUNGE,
    primaryMuscles: ['Framsida lår', 'Säte'],
    secondaryMuscles: ['Mage'],
    muscleGroups: ['Framsida lår', 'Säte'],
    equipment: [Equipment.DUMBBELL],
    difficultyMultiplier: 1.1,
    bodyweightCoefficient: 0.0,
    description: 'Enbensknäböj med bakre foten på en bänk. Extremt effektiv för ben och säte.',
    alternativeExIds: ['h-be-2', 'h-be-3']
  },

  // --- BEN BAKSIDA & SÄTE (Hinge) ---
  {
    id: 'g-bb-1',
    name: 'Rumänska Marklyft (RDL)',
    pattern: MovementPattern.HINGE,
    primaryMuscles: ['Baksida lår', 'Säte'],
    secondaryMuscles: ['Ryggslut', 'Underarmar'],
    muscleGroups: ['Baksida lår', 'Säte', 'Ryggslut'],
    equipment: [Equipment.BARBELL],
    difficultyMultiplier: 1.1,
    bodyweightCoefficient: 0.0,
    description: 'Fäll i höften med nästan raka ben för att träffa baksidan.',
    alternativeExIds: ['g-bb-2', 'h-be-5']
  },
  {
    id: 'g-be-4',
    name: 'Hip Thrust (Skivstång)',
    pattern: MovementPattern.HINGE,
    primaryMuscles: ['Säte'],
    secondaryMuscles: ['Baksida lår'],
    muscleGroups: ['Säte', 'Baksida lår'],
    equipment: [Equipment.BARBELL],
    difficultyMultiplier: 0.95,
    bodyweightCoefficient: 0.0,
    description: 'Ha övre ryggen mot en bänk och pressa upp stången med höften.',
    alternativeExIds: ['h-be-10', 'g-bb-1']
  },
  {
    id: 'g-be-8',
    name: 'Liggande Lårcurl',
    pattern: MovementPattern.ISOLATION,
    primaryMuscles: ['Baksida lår'],
    secondaryMuscles: [],
    muscleGroups: ['Baksida lår'],
    equipment: [Equipment.MACHINES],
    difficultyMultiplier: 0.65,
    bodyweightCoefficient: 0.0,
    description: 'Curl-maskin för baksida lår.',
    alternativeExIds: ['g-bb-1']
  },

  // --- AXLAR ---
  {
    id: 'g-ax-1',
    name: 'Militärpress (Stående)',
    pattern: MovementPattern.VERTICAL_PUSH,
    primaryMuscles: ['Axlar'],
    secondaryMuscles: ['Triceps', 'Mage', 'Trapezius'],
    muscleGroups: ['Axlar', 'Triceps', 'Trapezius'],
    equipment: [Equipment.BARBELL],
    difficultyMultiplier: 1.1,
    bodyweightCoefficient: 0.0,
    description: 'Stående press med skivstång från bröst till raka armar.',
    alternativeExIds: ['g-ax-2', 'h-ax-1']
  },
  {
    id: 'g-ax-2',
    name: 'Hantelpress (Sittande)',
    pattern: MovementPattern.VERTICAL_PUSH,
    primaryMuscles: ['Axlar'],
    secondaryMuscles: ['Triceps'],
    muscleGroups: ['Axlar', 'Triceps'],
    equipment: [Equipment.DUMBBELL],
    difficultyMultiplier: 1.0,
    bodyweightCoefficient: 0.0,
    description: 'Sittande press med hantlar för att bygga axelstyrka.',
    alternativeExIds: ['g-ax-1', 'h-ax-1']
  },
  {
    id: 'g-ax-4',
    name: 'Sidolyft (Hantlar)',
    pattern: MovementPattern.ISOLATION,
    primaryMuscles: ['Axlar'],
    secondaryMuscles: [],
    muscleGroups: ['Axlar'],
    equipment: [Equipment.DUMBBELL],
    difficultyMultiplier: 0.7,
    bodyweightCoefficient: 0.0,
    description: 'Lyft hantlarna utåt sidorna för att bredda axlarna.',
    alternativeExIds: ['g-ax-1']
  },

  // --- ARMAR ---
  {
    id: 'g-ar-1',
    name: 'Skivstångscurl',
    pattern: MovementPattern.ISOLATION,
    primaryMuscles: ['Biceps'],
    secondaryMuscles: ['Underarmar'],
    muscleGroups: ['Biceps', 'Underarmar'],
    equipment: [Equipment.BARBELL],
    difficultyMultiplier: 0.8,
    bodyweightCoefficient: 0.0,
    description: 'Stående curl med rak eller EZ-stång.',
    alternativeExIds: ['g-ar-2', 'h-ry-2']
  },
  {
    id: 'g-ar-2',
    name: 'Hantelcurl',
    pattern: MovementPattern.ISOLATION,
    primaryMuscles: ['Biceps'],
    secondaryMuscles: ['Underarmar'],
    muscleGroups: ['Biceps', 'Underarmar'],
    equipment: [Equipment.DUMBBELL],
    difficultyMultiplier: 0.75,
    bodyweightCoefficient: 0.0,
    description: 'Alternerande eller dubbla hantelcurlar.',
    alternativeExIds: ['g-ar-1', 'h-ry-2']
  },
  {
    id: 'g-ar-3',
    name: 'Triceps Pushdown (Kabel)',
    pattern: MovementPattern.ISOLATION,
    primaryMuscles: ['Triceps'],
    secondaryMuscles: [],
    muscleGroups: ['Triceps'],
    equipment: [Equipment.CABLES],
    difficultyMultiplier: 0.65,
    bodyweightCoefficient: 0.0,
    description: 'Pressa ner repet eller stången i kabelmaskinen.',
    alternativeExIds: ['h-br-2', 'g-br-8']
  },

  // --- MAGE & VADER ---
  {
    id: 'g-ma-1',
    name: 'Cable Crunch (Muslimen)',
    pattern: MovementPattern.CORE,
    primaryMuscles: ['Mage'],
    secondaryMuscles: [],
    muscleGroups: ['Mage'],
    equipment: [Equipment.CABLES],
    difficultyMultiplier: 0.75,
    bodyweightCoefficient: 0.0,
    description: 'Knästående magcrunch med rep i kabelmaskin.',
    alternativeExIds: ['h-ma-3']
  },
  {
    id: 'g-va-1',
    name: 'Vadpress (Stående)',
    pattern: MovementPattern.ISOLATION,
    primaryMuscles: ['Vader'],
    secondaryMuscles: [],
    muscleGroups: ['Vader'],
    equipment: [Equipment.MACHINES, Equipment.BARBELL],
    difficultyMultiplier: 0.7,
    bodyweightCoefficient: 0.0,
    description: 'Lyft hälarna kontrollerat.',
    alternativeExIds: ['h-be-13']
  },

  // ==========================================
  // DEL 2: KROPPSVIKT (HEMMA)
  // ==========================================

  // --- PRESS (Bröst/Axlar/Triceps) ---
  {
    id: 'h-br-1',
    name: 'Armhävningar',
    pattern: MovementPattern.HORIZONTAL_PUSH,
    primaryMuscles: ['Bröst'],
    secondaryMuscles: ['Triceps', 'Axlar', 'Mage'],
    muscleGroups: ['Bröst', 'Triceps', 'Axlar'],
    equipment: [Equipment.BODYWEIGHT],
    difficultyMultiplier: 0.5,
    bodyweightCoefficient: 0.65,
    description: 'Håll kroppen rak, sänk bröstet mot golvet och pressa upp.',
    alternativeExIds: ['g-br-1', 'h-br-2']
  },
  {
    id: 'h-br-2',
    name: 'Diamantarmhävningar',
    pattern: MovementPattern.HORIZONTAL_PUSH,
    primaryMuscles: ['Triceps'],
    secondaryMuscles: ['Bröst', 'Axlar'],
    muscleGroups: ['Triceps', 'Bröst'],
    equipment: [Equipment.BODYWEIGHT],
    difficultyMultiplier: 0.65,
    bodyweightCoefficient: 0.65,
    description: 'Händerna ihopformade som en diamant under bröstet för fokus på triceps.',
    alternativeExIds: ['g-ar-3', 'h-br-1']
  },
  {
    id: 'h-ax-1',
    name: 'Pike Push-Ups',
    pattern: MovementPattern.VERTICAL_PUSH,
    primaryMuscles: ['Axlar'],
    secondaryMuscles: ['Triceps'],
    muscleGroups: ['Axlar', 'Triceps'],
    equipment: [Equipment.BODYWEIGHT],
    difficultyMultiplier: 0.7,
    bodyweightCoefficient: 0.5,
    description: 'V-formad kropp, sänk huvudet mot golvet och pressa upp.',
    alternativeExIds: ['g-ax-1', 'h-ax-2']
  },
  {
    id: 'h-ax-2',
    name: 'Handstand Push-Ups (Mot vägg)',
    pattern: MovementPattern.VERTICAL_PUSH,
    primaryMuscles: ['Axlar'],
    secondaryMuscles: ['Triceps'],
    muscleGroups: ['Axlar', 'Triceps'],
    equipment: [Equipment.BODYWEIGHT],
    difficultyMultiplier: 1.2,
    bodyweightCoefficient: 1.0,
    description: 'Stå på händer mot en vägg, sänk dig och pressa upp.',
    alternativeExIds: ['g-ax-1', 'h-ax-1']
  },

  // --- DRAG (Rygg/Biceps) ---
  {
    id: 'h-ry-2',
    name: 'Chin-Ups (Underhandsgrepp)',
    pattern: MovementPattern.VERTICAL_PULL,
    primaryMuscles: ['Rygg', 'Biceps'],
    secondaryMuscles: ['Underarmar'],
    muscleGroups: ['Rygg', 'Biceps'],
    equipment: [Equipment.BODYWEIGHT, Equipment.PULLUP_BAR],
    difficultyMultiplier: 0.95,
    bodyweightCoefficient: 1.0,
    description: 'Underhandsgrepp i stången, dra dig upp tills hakan är över.',
    alternativeExIds: ['g-ry-2', 'g-ar-1']
  },
  {
    id: 'h-ry-4',
    name: 'Bordsrodd (Inverted Row)',
    pattern: MovementPattern.HORIZONTAL_PULL,
    primaryMuscles: ['Rygg'],
    secondaryMuscles: ['Biceps', 'Mage'],
    muscleGroups: ['Rygg', 'Biceps'],
    equipment: [Equipment.BODYWEIGHT],
    difficultyMultiplier: 0.6,
    bodyweightCoefficient: 0.5,
    description: 'Ligg under ett stadigt bord, håll i kanten och dra bröstet mot bordsskivan.',
    alternativeExIds: ['g-ry-5', 'g-ry-15']
  },

  // --- BEN (Quads/Glutes/Hams) ---
  {
    id: 'h-be-1',
    name: 'Knäböj (Air Squat)',
    pattern: MovementPattern.SQUAT,
    primaryMuscles: ['Framsida lår'],
    secondaryMuscles: ['Säte', 'Vader'],
    muscleGroups: ['Framsida lår', 'Säte'],
    equipment: [Equipment.BODYWEIGHT],
    difficultyMultiplier: 0.4,
    bodyweightCoefficient: 0.75,
    description: 'Grundläggande knäböj utan vikt.',
    alternativeExIds: ['g-be-1', 'h-be-2']
  },
  {
    id: 'h-be-3',
    name: 'Pistol Squat',
    pattern: MovementPattern.SQUAT,
    primaryMuscles: ['Framsida lår', 'Säte'],
    secondaryMuscles: ['Mage'],
    muscleGroups: ['Framsida lår', 'Säte'],
    equipment: [Equipment.BODYWEIGHT],
    difficultyMultiplier: 1.1,
    bodyweightCoefficient: 0.85,
    description: 'Enbensknäböj. Kräver styrka och balans.',
    alternativeExIds: ['g-be-1', 'h-be-1']
  },
  {
    id: 'h-be-10',
    name: 'Glute Bridge',
    pattern: MovementPattern.HINGE,
    primaryMuscles: ['Säte'],
    secondaryMuscles: ['Baksida lår'],
    muscleGroups: ['Säte', 'Baksida lår'],
    equipment: [Equipment.BODYWEIGHT],
    difficultyMultiplier: 0.4,
    bodyweightCoefficient: 0.3,
    description: 'Ligg på rygg och lyft höften mot taket.',
    alternativeExIds: ['g-be-4', 'h-be-11']
  },

  // --- MAGE / CORE ---
  {
    id: 'h-ma-1',
    name: 'Plankan',
    pattern: MovementPattern.CORE,
    primaryMuscles: ['Mage'],
    secondaryMuscles: ['Ryggslut', 'Axlar'],
    muscleGroups: ['Mage'],
    equipment: [Equipment.BODYWEIGHT],
    difficultyMultiplier: 0.4,
    bodyweightCoefficient: 0.0,
    description: 'Håll kroppen rak som en planka, stöd dig på underarmarna.',
    alternativeExIds: ['h-ma-2']
  },
  {
    id: 'h-ma-3',
    name: 'Bicycle Crunch',
    pattern: MovementPattern.CORE,
    primaryMuscles: ['Mage'],
    secondaryMuscles: [],
    muscleGroups: ['Mage'],
    equipment: [Equipment.BODYWEIGHT],
    difficultyMultiplier: 0.5,
    bodyweightCoefficient: 0.0,
    description: 'Ligg på rygg, cykla med benen och rör motsatt armbåge mot knä.',
    alternativeExIds: ['h-ma-1', 'g-ma-1']
  }
];

export const INITIAL_ZONES: Zone[] = [
  { id: 'zone-a', name: 'Hemma', inventory: [Equipment.DUMBBELL, Equipment.BANDS, Equipment.BODYWEIGHT, Equipment.PULLUP_BAR], icon: 'home' },
  { id: 'zone-b', name: 'Gymmet', inventory: [Equipment.BARBELL, Equipment.DUMBBELL, Equipment.KETTLEBELL, Equipment.CABLES, Equipment.MACHINES, Equipment.BODYWEIGHT, Equipment.PULLUP_BAR], icon: 'building' },
  { id: 'zone-c', name: 'Resa', inventory: [Equipment.BODYWEIGHT], icon: 'briefcase' }
];
