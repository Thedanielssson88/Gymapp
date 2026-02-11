


export enum MovementPattern {
  SQUAT = 'Knäböj',
  HINGE = 'Höftfällning',
  HORIZONTAL_PUSH = 'Horisontell Press',
  VERTICAL_PUSH = 'Vertikal Press',
  HORIZONTAL_PULL = 'Horisontell Drag',
  VERTICAL_PULL = 'Vertikal Drag',
  LUNGE = 'Utfall',
  CORE = 'Bål',
  ISOLATION = 'Isolering',
  MOBILITY = 'Rörlighet / Stretch',
  REHAB = 'Rehab / Prehab',
  CARDIO = 'Kondition',
  EXPLOSIVE = 'Explosiv / Olympisk'
}

export type TrackingType = 'reps_weight' | 'time_distance' | 'time_only' | 'reps_only';

export type ExerciseTier = 'tier_1' | 'tier_2' | 'tier_3';

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
  | 'Nacke'
  | 'Höftböjare'
  | 'Tibialis'
  | 'Rotatorcuff'
  | 'Hela kroppen'
  | 'Rörlighet'
  | 'Balans'
  | 'Hamstrings'
  | 'Bröstrygg'
  | 'Greppstyrka';

export enum Equipment {
  BARBELL = 'Skivstång',
  EZ_BAR = 'EZ-stång',
  TRAP_BAR = 'Trap-bar / Hex-bar',
  DUMBBELL = 'Hantlar',
  KETTLEBELL = 'Kettlebell',
  PLATE = 'Viktskiva',
  LEG_PRESS = 'Benpress',
  HACK_SQUAT = 'Hack Squat',
  LEG_EXTENSION = 'Benspark',
  LEG_CURL = 'Lårcurl',
  CALF_RAISE = 'Vadpress',
  SMITH_MACHINE = 'Smith-maskin',
  CABLES = 'Kabelmaskin',
  LAT_PULLDOWN = 'Latsdrag',
  SEATED_ROW = 'Sittande Rodd',
  CHEST_PRESS = 'Bröstpress',
  SHOULDER_PRESS = 'Axelpress',
  PEC_DECK = 'Pec Deck / Flyes',
  ASSISTED_MACHINE = 'Assisterad Chins/Dips',
  BODYWEIGHT = 'Kroppsvikt',
  PULLUP_BAR = 'Räckhävsstång',
  DIP_STATION = 'Dipsställning',
  TRX = 'TRX / Ringar',
  BANDS = 'Gummiband',
  MEDICINE_BALL = 'Medicinboll',
  SANDBAG = 'Sandbag',
  BOX = 'Box / Låda',
  BENCH = 'Träningsbänk',
  SKI_ERG = 'SkiErg',
  ROWER = 'Roddmaskin',
  SLED = 'Släde',
  TREADMILL = 'Löpband',
  ASSAULT_BIKE = 'Assault Bike / Echo Bike',
  BIKE_ERG = 'BikeErg',
  TECHNOGYM_SKILLMILL = 'Kurvband / Skillmill',
  BOSU_BALL = 'Bosuboll / Balansplatta',
  FOAM_ROLLER = 'Foam Roller',
  ROPE = 'Klätterrep',
  JUMP_ROPE = 'Hopprep',
  LANDMINE = 'Landmine / Skivstångshörna',
  MACHINES = 'Maskiner (Övriga)',
  HARNESS = 'Sele',
  AB_WHEEL = 'Maghjul',
  WALL = 'Vägg',
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
  englishName?: string;
  pattern: MovementPattern;
  tier: ExerciseTier;
  muscleGroups: MuscleGroup[]; 
  primaryMuscles: MuscleGroup[]; 
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment[];
  difficultyMultiplier: number;
  bodyweightCoefficient: number;
  trackingType?: TrackingType;
  imageUrl?: string;
  imageId?: string;
  description?: string;
  instructions?: string[];
  alternativeExIds?: string[];
  userModified?: boolean;
  score?: number; // Ett värde mellan 1-10, standard 5
  userRating?: 'up' | 'down' | null; // Nytt fält för användarens betyg
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
  thighR?: number; // Fixed typo: 'thihR' to 'thighR'
  calves?: number;
  bodyFat?: number;
}

export interface UserSettings {
  includeWarmupInStats: boolean;
  restTimer?: number;
  keepAwake?: boolean;
  bodyViewMode?: 'list' | 'map';
  barbellWeight?: number; // t.ex. 20
  dumbbellBaseWeight?: number; // t.ex. 2 (vikten på själva hantelgreppet)
  geminiApiKey?: string; // Nytt fält för AI-nyckeln
  vibrateOnRestEnd?: boolean; // Ny inställning för vibration vid vilans slut
}

export interface UserProfile {
  id?: string;
  name: string;
  weight: number;
  height: number;
  level: 'Nybörjare' | 'Medel' | 'Avancerad' | 'Elit';
  goal: Goal;
  injuries: MuscleGroup[];
  measurements: BodyMeasurements;
  settings?: UserSettings;
}

export interface Zone {
  id: string;
  name: string;
  inventory: Equipment[];
  icon: string;
  availablePlates?: number[];
}

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export interface WorkoutSet {
  reps: number;
  weight: number;
  distance?: number;
  duration?: number;
  completed: boolean;
  rpe?: number;
  type?: SetType;
  fatigue?: number; // Added fatigue for per-set logging
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
  locationName?: string; // Add locationName
  exercises: PlannedExercise[];
  isCompleted: boolean;
  duration?: number;
  rpe?: number;
  feeling?: string;
}

export interface BiometricLog {
  id: string;
  date: string;
  weight: number;
  measurements: BodyMeasurements;
}

export type ActivityType = 'gym' | 'cardio' | 'rehab' | 'mobility' | 'rest';

// --- ScheduledActivity: Represents a single, concrete planned activity ---
export interface ScheduledActivity {
  id: string;
  date: string; // YYYY-MM-DD
  type: ActivityType;
  title: string;
  isCompleted: boolean;
  linkedSessionId?: string;
  exercises?: PlannedExercise[];
  recurrenceId?: string; // If this activity was generated from a RecurringPlan, this is the ID of that plan.
}

// --- RecurringPlan: Represents a template for recurring activities ---
export interface RecurringPlan {
  id: string;
  type: ActivityType;
  title: string;
  daysOfWeek: number[]; // 0=Sunday, 1=Monday...
  startDate: string; // The date from which recurrence starts
  endDate?: string; // Optional end date
  exercises?: PlannedExercise[];
}

// --- Type for WorkoutLog to display both ScheduledActivity and RecurringPlan templates ---
export interface RecurringPlanForDisplay extends RecurringPlan {
  isTemplate: true; // Custom flag for the UI to identify templates
  // `daysOfWeek` already exists on RecurringPlan, no need to redefine as `recurringDays`
  // No `date` field here, as `WorkoutLog` will use `startDate` and `daysOfWeek` for display
  // No `isCompleted` as templates are never "completed"
}

export type PlannedActivityForLogDisplay = ScheduledActivity | RecurringPlanForDisplay;

// --- NEW: Gamified User Missions ---
export interface UserMission {
  id: string;
  name: string; // E.g., "Bänka 100 kg", "Träna 3 ggr/vecka", "Nå 75 cm i midjan"
  type: 'weight' | 'frequency' | 'measurement'; // Typ av mål
  startValue: number; // NEW: The value of the metric when the mission was created
  targetValue: number; // Målvärdet (t.ex. 100 kg, 3 ggr, 75 cm)
  exerciseId?: string; // Om målet är viktspecifikt för en övning
  muscleGroup?: MuscleGroup; // Om målet är kopplat till en muskelgrupp (kan användas med 'weight' eller 'frequency' för att spåra volym i specifik muskelgrupp t.ex.)
  measurementKey?: keyof BodyMeasurements | 'weight'; // Om målet är kopplat till ett kroppsmått (t.ex. 'waist', 'bicepsL') ELLER 'weight'
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
}

// --- NEW: Type for Plate Display ---
export interface Plate {
  weight: number;
  count: number;
  color: string;
}