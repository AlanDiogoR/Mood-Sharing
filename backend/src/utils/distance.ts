export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
 * Retorna a distância em quilômetros
 */
export const calculateDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371; // Raio da Terra em quilômetros
  const dLat = toRad(loc2.latitude - loc1.latitude);
  const dLon = toRad(loc2.longitude - loc1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.latitude)) *
      Math.cos(toRad(loc2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Verifica se duas localizações estão dentro do threshold de proximidade
 */
export const isWithinProximity = (
  loc1: Location,
  loc2: Location,
  thresholdKm: number
): boolean => {
  const distance = calculateDistance(loc1, loc2);
  return distance <= thresholdKm;
};
