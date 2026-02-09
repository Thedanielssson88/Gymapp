import { MovementPattern, Equipment, Exercise, Zone, GoalTarget } from './types';

export const INITIAL_GOAL_TARGETS: GoalTarget[] = [
  { id: 'target-push', name: 'PUSH-MUSKLER', targetSets: 50, muscleGroups: ['Bröst', 'Axlar', 'Triceps'] },
  { id: 'target-pull', name: 'PULL-MUSKLER', targetSets: 27, muscleGroups: ['Rygg', 'Biceps', 'Underarmar', 'Trapezius'] },
  { id: 'target-legs', name: 'BEN-MUSKLER', targetSets: 45, muscleGroups: ['Framsida lår', 'Baksida lår', 'Säte', 'Vader'] }
];

export const EXERCISE_DATABASE: Exercise[] = [
  // ==========================================
  // HYROX COMPETITION
  // ==========================================
  {
    id: 'hyrox-1',
    name: 'SkiErg',
    englishName: 'Ski Ergometer',
    pattern: MovementPattern.VERTICAL_PULL,
    tier: 'tier_2',
    primaryMuscles: ['Rygg', 'Triceps'],
    secondaryMuscles: ['Mage', 'Baksida lår', 'Axlar'],
    muscleGroups: ['Rygg', 'Triceps', 'Mage', 'Axlar', 'Baksida lår'],
    equipment: [Equipment.SKI_ERG],
    difficultyMultiplier: 1.1,
    bodyweightCoefficient: 0,
    trackingType: 'time_distance',
    description: 'Hyrox Station 1. Stakmaskin. Fokusera på att använda bålen och dra explosivt nedåt.',
    alternativeExIds: ['g-ry-3', 'h-ry-2']
  },
  {
    id: 'hyrox-2',
    name: 'Sled Push',
    englishName: 'Sled Push',
    pattern: MovementPattern.SQUAT,
    tier: 'tier_1',
    primaryMuscles: ['Framsida lår', 'Säte'],
    secondaryMuscles: ['Vader', 'Axlar', 'Mage'],
    muscleGroups: ['Framsida lår', 'Säte', 'Vader', 'Axlar', 'Mage'],
    equipment: [Equipment.SLED],
    difficultyMultiplier: 1.5,
    bodyweightCoefficient: 0,
    trackingType: 'time_distance',
    description: 'Hyrox Station 2. Tryck släden framåt med raka armar eller låg position.',
    alternativeExIds: ['g-be-2', 'g-be-1']
  },
  // ==========================================
  // GYM / SATS - FREE WEIGHTS (Tier 1)
  // ==========================================
  {
    id: 'g-be-1',
    name: 'Knäböj (Back Squat)',
    englishName: 'Barbell Back Squat',
    pattern: MovementPattern.SQUAT,
    tier: 'tier_1',
    primaryMuscles: ['Framsida lår', 'Säte'],
    secondaryMuscles: ['Ryggslut', 'Mage'],
    muscleGroups: ['Framsida lår', 'Säte', 'Ryggslut'],
    equipment: [Equipment.BARBELL],
    difficultyMultiplier: 1.2,
    bodyweightCoefficient: 0,
    description: 'Klassisk knäböj med stången på ryggen.',
    alternativeExIds: ['g-be-5', 'g-be-2', 'h-be-1']
  },
  {
    id: 'g-ry-1',
    name: 'Marklyft',
    englishName: 'Deadlift',
    pattern: MovementPattern.HINGE,
    tier: 'tier_1',
    primaryMuscles: ['Ryggslut', 'Säte', 'Baksida lår'],
    secondaryMuscles: ['Trapezius', 'Underarmar'],
    muscleGroups: ['Ryggslut', 'Säte', 'Baksida lår', 'Trapezius'],
    equipment: [Equipment.BARBELL],
    difficultyMultiplier: 1.25,
    bodyweightCoefficient: 0,
    description: 'Lyft stången från marken till stående position.',
    alternativeExIds: ['g-bb-1', 'g-ry-19']
  },
  {
    id: 'g-br-1',
    name: 'Bänkpress',
    englishName: 'Bench Press',
    pattern: MovementPattern.HORIZONTAL_PUSH,
    tier: 'tier_1',
    primaryMuscles: ['Bröst'],
    secondaryMuscles: ['Triceps', 'Axlar'],
    muscleGroups: ['Bröst', 'Triceps', 'Axlar'],
    equipment: [Equipment.BARBELL, Equipment.BENCH],
    difficultyMultiplier: 1.0,
    bodyweightCoefficient: 0,
    description: 'Liggande bänkpress på plan bänk.',
    alternativeExIds: ['g-br-2', 'g-br-3', 'h-br-1']
  },
  {
    id: 'g-ax-1',
    name: 'Militärpress',
    englishName: 'Overhead Press',
    pattern: MovementPattern.VERTICAL_PUSH,
    tier: 'tier_1',
    primaryMuscles: ['Axlar'],
    secondaryMuscles: ['Triceps', 'Mage'],
    muscleGroups: ['Axlar', 'Triceps', 'Mage'],
    equipment: [Equipment.BARBELL],
    difficultyMultiplier: 1.1,
    bodyweightCoefficient: 0,
    description: 'Stående axelpress med skivstång.',
    alternativeExIds: ['g-ax-16', 'g-ax-2']
  },
  // ==========================================
  // GYM - TIER 2 (Assistance)
  // ==========================================
  {
    id: 'g-ry-3',
    name: 'Latsdrag',
    englishName: 'Lat Pulldown',
    pattern: MovementPattern.VERTICAL_PULL,
    tier: 'tier_2',
    primaryMuscles: ['Rygg'],
    secondaryMuscles: ['Biceps', 'Axlar'],
    muscleGroups: ['Rygg', 'Biceps', 'Axlar'],
    equipment: [Equipment.LAT_PULLDOWN],
    difficultyMultiplier: 0.85,
    bodyweightCoefficient: 0,
    description: 'Dra stången ner mot bröstet.',
    alternativeExIds: ['g-ry-2', 'g-ry-22', 'h-ry-2']
  },
  {
    id: 'g-be-11',
    name: 'Gående Utfall',
    englishName: 'Walking Lunges',
    pattern: MovementPattern.LUNGE,
    tier: 'tier_2',
    primaryMuscles: ['Framsida lår', 'Säte'],
    secondaryMuscles: ['Vader', 'Mage'],
    muscleGroups: ['Framsida lår', 'Säte', 'Vader'],
    equipment: [Equipment.DUMBBELL, Equipment.KETTLEBELL],
    difficultyMultiplier: 1.1,
    bodyweightCoefficient: 0,
    description: 'Gående utfall med vikter i händerna.',
    alternativeExIds: ['hyrox-7', 'h-be-2']
  },
  // ==========================================
  // GYM - TIER 3 (Isolation)
  // ==========================================
  {
    id: 'g-ar-3',
    name: 'Triceps Pushdown',
    englishName: 'Triceps Pushdown',
    pattern: MovementPattern.ISOLATION,
    tier: 'tier_3',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: [],
    muscleGroups: ['Triceps'],
    equipment: [Equipment.CABLES],
    difficultyMultiplier: 0.65,
    bodyweightCoefficient: 0,
    description: 'Pressa ner repet i kabelmaskinen.',
    alternativeExIds: ['g-ar-15', 'h-br-2']
  },
  {
    id: 'g-ax-4',
    name: 'Sidolyft (Hantlar)',
    englishName: 'Lateral Raises',
    pattern: MovementPattern.ISOLATION,
    tier: 'tier_3',
    primaryMuscles: ['Axlar'],
    secondaryMuscles: [],
    muscleGroups: ['Axlar'],
    equipment: [Equipment.DUMBBELL],
    difficultyMultiplier: 0.7,
    bodyweightCoefficient: 0,
    description: 'Lyft hantlarna åt sidan för axelbredd.',
    alternativeExIds: ['g-ax-21']
  }
  // Standard list simplified, actual DB would have tier for all.
];

export const INITIAL_ZONES: Zone[] = [
  { id: 'zone-a', name: 'Hemma', inventory: [Equipment.DUMBBELL, Equipment.BANDS, Equipment.BODYWEIGHT, Equipment.PULLUP_BAR, Equipment.BENCH], icon: 'home' },
  { id: 'zone-b', name: 'Gymmet', inventory: Object.values(Equipment), icon: 'building' },
  { id: 'zone-c', name: 'Resa', inventory: [Equipment.BODYWEIGHT, Equipment.BANDS], icon: 'briefcase' }
];