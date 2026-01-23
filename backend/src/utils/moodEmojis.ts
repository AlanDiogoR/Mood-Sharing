import {MoodType} from '../models/Mood';

export const MOOD_EMOJIS: Record<MoodType, string> = {
  [MoodType.HAPPY]: '😊',
  [MoodType.SAD]: '😢',
  [MoodType.ANXIOUS]: '😰',
  [MoodType.CALM]: '😌',
  [MoodType.EXCITED]: '🤩',
  [MoodType.TIRED]: '😴',
  [MoodType.ANGRY]: '😠',
  [MoodType.LOVE]: '❤️',
};

export const getMoodEmoji = (type: MoodType): string => {
  return MOOD_EMOJIS[type] || '😊';
};
