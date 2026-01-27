export const getTimeGradientColors = (date: Date = new Date()): string[] => {
  const hour = date.getHours();

  if (hour >= 16 && hour <= 19) {
    return ['#FF8A3D', '#1A4FBF'];
  }
  if (hour >= 20 && hour <= 23) {
    return ['#0B1B3A', '#000000'];
  }
  if (hour >= 0 && hour <= 4) {
    return ['#000000', '#05070D'];
  }
  if (hour >= 5 && hour <= 8) {
    return ['#05070D', '#F7D96A'];
  }
  return ['#FF8A3D', '#1A4FBF'];
};
