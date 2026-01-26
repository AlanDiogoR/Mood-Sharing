export type WorkoutExercise = {
  name: string;
  series: string;
  carga?: string;
  intervalo?: string;
  instrucoes?: string;
};

export type WorkoutDay = {
  title: string;
  exercises: WorkoutExercise[];
};

export type WorkoutPlan = Record<string, WorkoutDay>;

const upperLowerOddMonday: WorkoutExercise[] = [
  { name: 'Supino inclinado com halter', series: '12-10-8-6' },
  { name: 'Voador', series: '12-10-8-6' },
  { name: 'Crossover', series: '12-10-8-6' },
  { name: 'Elevacao com halteres', series: '12-10-8-6' },
  { name: 'Triceps na polia', series: '12-10-8-6' },
  { name: 'Triceps testa com barra', series: '12-10-8-6' },
];

const lowerOddTuesday: WorkoutExercise[] = [
  { name: 'Bulgaro', series: '12-10-8-6' },
  { name: 'Hack', series: '12-10-8-6' },
  { name: 'Leg press', series: '12-10-8-6' },
  { name: 'Cadeira extensora', series: '15-12-10' },
  { name: 'Cadeira flexora', series: '15-12-10' },
  { name: 'Panturrilha (bi-set)', series: '12-10-8-6' },
  { name: 'Abdominal', series: '4x15-20' },
];

const pullOddWednesday: WorkoutExercise[] = [
  { name: 'Puxada alta', series: '12-10-8-6', carga: '0kg', intervalo: '90s' },
  { name: 'Pulldown', series: '12-10-8-6', carga: '0kg', intervalo: '90s' },
  { name: 'Remada pronada com barra', series: '12-10-8-6', carga: '0kg', intervalo: '90s' },
  { name: 'Crucifixo inverso no cabo', series: '12-10-8-6', carga: '0kg', intervalo: '90s' },
  { name: 'Rosca no banco inclinado', series: '12-10-8-6', carga: '0kg', intervalo: '90s' },
  { name: 'Rosca martelo com halteres', series: '12-10-8-6', carga: '0kg', intervalo: '90s' },
];

const lowerOddThursday: WorkoutExercise[] = [
  { name: 'Bulgaros', series: '12-10-8-6', carga: '0kg', intervalo: '120s' },
  { name: 'Levantamento sumo', series: '12-10-8-6', carga: '0kg', intervalo: '120s' },
  { name: 'Elevacao pelvica', series: '12-10-8-6', carga: '30kg', intervalo: '120s' },
  { name: 'Cadeira flexora', series: '15-12-10', carga: '60kg', intervalo: '90s' },
  { name: 'Cadeira abdutora', series: '15-12-10', carga: '55kg', intervalo: '90s' },
  { name: 'Gemeos em pe', series: '15-12-10', carga: '0kg', intervalo: '90s' },
  { name: 'Abdominal supra solo', series: '4x15-20', carga: '0kg', intervalo: '30s' },
  { name: 'Abdominal infra pernas estendidas', series: '4x15-20', carga: '0kg', intervalo: '30s' },
];

const oddPlan: WorkoutPlan = {
  monday: { title: 'Peito e triceps', exercises: upperLowerOddMonday },
  tuesday: { title: 'Inferiores', exercises: lowerOddTuesday },
  wednesday: { title: 'Costas e biceps', exercises: pullOddWednesday },
  thursday: { title: 'Inferiores', exercises: lowerOddThursday },
  friday: { title: 'Peito enfase', exercises: lowerOddThursday },
};

const evenMonday: WorkoutExercise[] = [
  { name: 'Bulgaros', series: '12-10-8-6', carga: '0kg', intervalo: '120s' },
  { name: 'Levantamento sumo', series: '12-10-8-6', carga: '0kg', intervalo: '120s' },
  { name: 'Elevacao pelvica', series: '12-10-8-6', carga: '30kg', intervalo: '120s' },
  { name: 'Cadeira flexora', series: '15-12-10', carga: '60kg', intervalo: '90s' },
  { name: 'Cadeira abdutora', series: '15-12-10', carga: '55kg', intervalo: '90s' },
  { name: 'Gemeos em pe', series: '15-12-10', carga: '0kg', intervalo: '90s' },
  { name: 'Abdominal supra solo', series: '4x15-20', carga: '0kg', intervalo: '30s' },
  { name: 'Abdominal infra pernas estendidas', series: '4x15-20', carga: '0kg', intervalo: '30s' },
];

const evenTuesday: WorkoutExercise[] = [...evenMonday];
const evenWednesday: WorkoutExercise[] = [...evenMonday];

const evenThursday: WorkoutExercise[] = [
  {
    name: 'Stiff',
    series: '1x15 / 2x10-12 / 1x8-10',
    carga: '00kg',
    intervalo: '120s',
    instrucoes: 'Series de aquecimentos, trabalhos e top series',
  },
  {
    name: 'Mesa flexora',
    series: '2x10-12 / 1x8-10',
    carga: '00kg',
    intervalo: '120s',
    instrucoes: 'Series de trabalhos e top series',
  },
  {
    name: 'Hack',
    series: '1x15 / 2x10-12 / 1x8-10',
    carga: '20kg',
    intervalo: '120s',
    instrucoes: 'Series de aquecimentos, trabalhos e top series',
  },
  {
    name: 'Cadeira extensora',
    series: '1x15 / 2x10-12 / 1x8-10',
    carga: '85kg',
    intervalo: '120s',
    instrucoes: 'Series de aquecimentos, trabalhos e top series',
  },
  {
    name: 'Gemeos em pe',
    series: '1x15 / 2x10-12 / 1x8-10',
    carga: '00kg',
    intervalo: '90s',
    instrucoes: 'Series de aquecimentos, trabalhos e top series',
  },
  {
    name: 'Panturrilha no leg press 45',
    series: '3x10-12 / 1x8-10',
    carga: '00kg',
    intervalo: '90s',
    instrucoes: 'Series de trabalhos e top series',
  },
  { name: 'Abdominal supra solo', series: '3x12-20', carga: '0kg', intervalo: '30s' },
  { name: 'Prancha isometrica', series: '4x45-90s', carga: '0kg', intervalo: '30s' },
];

const evenFriday: WorkoutExercise[] = [
  {
    name: 'Desenvolvimento com halteres',
    series: '1x15 / 2x10-12 / 1x8-10',
    carga: '14kg / 16kg / 18kg',
  },
  {
    name: 'Elevacao lateral com halteres',
    series: '3x10-12 / 2x8-10',
    carga: '10kg / 14kg',
  },
  {
    name: 'Crucifixo inclinado no cabo',
    series: '1x15 / 2x10-12 / 1x8-10',
    carga: '10kg / 15kg / 00kg',
  },
  {
    name: 'Supino reto com halteres',
    series: '1x15 / 2x10-12 / 1x8-10',
    carga: '16kg / 18kg / 22kg',
  },
  {
    name: 'Puxada alta triangulo',
    series: '1x15 / 2x10-12 / 1x8-10',
    carga: '30kg / 45kg / 60kg',
  },
  {
    name: 'Remada articulada',
    series: '1x15 / 2x10-12 / 1x8-10',
    carga: '5kg / 15kg / 20kg',
  },
];

const evenPlan: WorkoutPlan = {
  monday: { title: 'Peito', exercises: evenMonday },
  tuesday: { title: 'Inferiores', exercises: evenTuesday },
  wednesday: { title: 'Costas', exercises: evenWednesday },
  thursday: { title: 'Inferior (stiff)', exercises: evenThursday },
  friday: { title: 'Superior completo', exercises: evenFriday },
};

export const getWorkoutPlan = (date = new Date()): WorkoutPlan => {
  const month = date.getMonth() + 1;
  return month % 2 === 1 ? oddPlan : evenPlan;
};
