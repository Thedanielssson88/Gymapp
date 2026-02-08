
export enum MovementPattern {
  SQUAT = 'Knäböj',
  HINGE = 'Höftfällning',
  HORIZONTAL_PUSH = 'Horisontell Press',
  VERTICAL_PUSH = 'Vertikal Press',
  HORIZONTAL_PULL = 'Horisontell Drag',
  VERTICAL_PULL = 'Vertikal Drag',
  LUNGE = 'Utfall',
  CORE = 'Bål',
  ISOLATION = 'Isolering'
}

export type MuscleGroup = 
  | 'Mage' 
  | 'Rygg' 
  | 'Biceps' 
  | 'Bröst' 
  | 'Säte' 
  | 'Baksida lår' 
  | 'Framsida lår' 
  | 'Axlar' 
  | 'Triceps' 
  | 'Ryggslut'
  | 'Vader' 
  | 'Trapezius' 
  | 'Abduktorer' 
  | 'Adduktorer' 
  | 'Underarmar' 
  | 'Nacke';

export enum Equipment {
  BARBELL = 'Skivstång',
  DUMBBELL = 'Hantlar',
  KETTLEBELL = 'Kettlebell',
  CABLES = 'Kabelmaskin',
  BANDS = 'Gummiband',
  BODYWEIGHT = 'Kroppsvikt',
  MACHINES = 'Maskiner',
  PULLUP_BAR = 'Räckhävsstång'
}

export enum Goal {
  HYPERTROPHY = 'Muskelbygge',
  STRENGTH = 'Styrka (1RM Fokus)',
  ENDURANCE = 'Uthållighet',
  REHAB = 'Rehab'
}

export interface GoalTarget {
  id: string;
  name: string;
  targetSets: number;
  muscleGroups: MuscleGroup[];
}

export interface Exercise {
  id: string;
  name: string;
  pattern: MovementPattern;
  muscleGroups: MuscleGroup[]; 
  primaryMuscles?: MuscleGroup[]; 
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment[];
  difficultyMultiplier: number;
  bodyweightCoefficient: number;
  imageUrl?: string;
  description?: string;
  instructions?: string[];
  alternativeExIds?: string[];
}

export interface BodyMeasurements {
  neck?: number;
  shoulders?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  bicepsL?: number;
  bicepsR?: number;
  thighL?: number;
  thighR?: number;
  calves?: number;
  bodyFat?: number;
}

export interface UserProfile {
  name: string;
  weight: number;
  height: number;
  level: 'Nybörjare' | 'Medel' | 'Avancerad' | 'Elit';
  goal: Goal;
  injuries: string[];
  measurements: BodyMeasurements;
}

export interface Zone {
  id: string;
  name: string;
  inventory: Equipment[];
  icon: string;
}

export interface WorkoutSet {
  reps: number;
  weight: number;
  completed: boolean;
  rpe?: number;
}

export interface PlannedExercise {
  exerciseId: string;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  exercises: PlannedExercise[];
  category?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  name: string;
  zoneId: string;
  exercises: PlannedExercise[];
  isCompleted: boolean;
  duration?: number;
}

export interface BiometricLog {
  date: string;
  weight: number;
  measurements: BodyMeasurements;
}
