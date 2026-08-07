export const MUSCLE_GROUPS = [
  "Abdomen", "Pecho", "Espalda", "Hombros", "Bíceps",
  "Tríceps", "Cuádriceps", "Femorales", "Glúteos", "Pantorrillas", "Otro"
];

export const ACCESSORIES = [
  "Barra Olímpica", "Cuerda", "Mancuernas", "Máquina", "Polea"
];

const stripAccents = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const enumToDb = (value: string) =>
  stripAccents(value).toUpperCase().replace(/\s+/g, '_');

const buildDisplayMap = (values: string[]) => {
  const map: Record<string, string> = {};
  for (const v of values) {
    map[enumToDb(v)] = v;
  }
  return map;
};

const muscleToDisplay = buildDisplayMap(MUSCLE_GROUPS);
const accessoryToDisplay = buildDisplayMap(ACCESSORIES);

export const dbToDisplay = (value: string) => {
  const key = stripAccents(value).toUpperCase().replace(/\s+/g, '_');
  return muscleToDisplay[key] || accessoryToDisplay[key] ||
    value.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
};
