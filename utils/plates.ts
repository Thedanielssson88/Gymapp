export interface Plate {
  weight: number;
  count: number;
  color: string;
}

/**
 * Beräknar antal skivor per sida för en given totalvikt.
 */
export const calculatePlates = (totalWeight: number, barWeight = 20): Plate[] => {
  const weightToCalculate = (totalWeight - barWeight) / 2;
  if (weightToCalculate <= 0) return [];

  const plates = [25, 20, 15, 10, 5, 2.5, 1.25];
  const colors: Record<number, string> = {
    25: '#ff2d55', // Röd
    20: '#3b82f6', // Blå
    15: '#ffcc00', // Gul
    10: '#2ed573', // Grön
    5: '#ffffff',  // Vit
    2.5: '#8e8c95', // Grå
    1.25: '#8e8c95' // Grå
  };

  const result: Plate[] = [];
  let remaining = weightToCalculate;

  for (const plate of plates) {
    const count = Math.floor(remaining / plate);
    if (count > 0) {
      result.push({ weight: plate, count, color: colors[plate] });
      remaining = Math.round((remaining - count * plate) * 100) / 100;
    }
  }

  return result;
};