import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import {MoodType, MoodOption} from '../../types';
import {COLORS} from '../../constants/colors';

const MOOD_OPTIONS: MoodOption[] = [
  {type: MoodType.HAPPY, emoji: '😊', label: 'Feliz', color: COLORS.happy},
  {type: MoodType.SAD, emoji: '😢', label: 'Triste', color: COLORS.sad},
  {type: MoodType.ANXIOUS, emoji: '😰', label: 'Ansioso', color: COLORS.anxious},
  {type: MoodType.PARANOICA, emoji: '😵‍💫', label: 'Paranoica', color: COLORS.paranoica},
  {type: MoodType.CALM, emoji: '😌', label: 'Calmo', color: COLORS.calm},
  {type: MoodType.EXCITED, emoji: '🤩', label: 'Empolgado', color: COLORS.excited},
  {type: MoodType.TIRED, emoji: '😴', label: 'Cansado', color: COLORS.tired},
  {type: MoodType.ANGRY, emoji: '😠', label: 'Irritado', color: COLORS.angry},
  {type: MoodType.LOVE, emoji: '❤️', label: 'Apaixonado', color: COLORS.love},
];

interface MoodSelectorProps {
  selectedMood?: MoodType;
  onSelect: (mood: MoodType) => void;
}

export const MoodSelector: React.FC<MoodSelectorProps> = ({selectedMood, onSelect}) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {MOOD_OPTIONS.map(mood => (
        <TouchableOpacity
          key={mood.type}
          style={[
            styles.moodItem,
            selectedMood === mood.type && styles.moodItemSelected,
            selectedMood === mood.type && {borderColor: mood.color},
          ]}
          onPress={() => onSelect(mood.type)}
          activeOpacity={0.7}>
          <Text style={styles.emoji}>{mood.emoji}</Text>
          <Text style={styles.label}>{mood.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  moodItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 2,
    borderColor: COLORS.border,
    minWidth: 80,
  },
  moodItemSelected: {
    backgroundColor: COLORS.backgroundLight,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
