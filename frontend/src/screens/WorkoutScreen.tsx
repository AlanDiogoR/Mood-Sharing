import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { getWorkoutPlan, WorkoutExercise } from '../data/workouts';
import { storage } from '../utils/storage';
import { useTheme } from '../store/themeContext';
import { workoutService } from '../services/workoutService';

interface WorkoutScreenProps {
  onBackToResumo: () => void;
}

const getDateKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekdayKey = (date = new Date()): string => {
  const weekday = date.getDay();
  if (weekday === 0 || weekday === 6) {
    return 'friday';
  }
  const map = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return map[weekday];
};

export const WorkoutScreen: React.FC<WorkoutScreenProps> = ({ onBackToResumo }) => {
  const { colors } = useTheme();
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const dateKey = useMemo(() => getDateKey(), []);

  const plan = useMemo(() => {
    const planData = getWorkoutPlan();
    const weekdayKey = getWeekdayKey();
    return planData[weekdayKey];
  }, []);

  useEffect(() => {
    const loadState = async () => {
      const summary = await storage.getWorkoutSummary(dateKey);
      if (summary) {
        setSummaryText(
          `Treino concluido: ${summary.durationMinutes} min, ${summary.calories} kcal estimadas.`
        );
      }
      const session = await storage.getWorkoutSession(dateKey);
      setSessionStart(session);
    };
    loadState();
  }, [dateKey]);

  const handleStart = async () => {
    const startTime = Date.now();
    await storage.setWorkoutSession(dateKey, startTime);
    setSessionStart(startTime);
  };

  const handleFinish = async () => {
    const startTime = sessionStart ?? Date.now();
    const durationMinutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));
    const calories = durationMinutes * 7;
    const summary = {
      dateKey,
      durationMinutes,
      calories,
      completedAt: Date.now(),
    };
    await storage.setWorkoutSummary(dateKey, summary);
    try {
      await workoutService.saveSummary(summary);
    } catch (error) {
      console.error('Erro ao salvar treino no servidor:', error);
    }
    await storage.clearWorkoutSession(dateKey);
    await storage.addWorkoutDay(new Date().getFullYear(), dateKey);
    setSessionStart(null);
    setSummaryText(`Treino concluido: ${durationMinutes} min, ${calories} kcal estimadas.`);
  };

  if (summaryText) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Treino do dia</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo</Text>
          <Text style={styles.cardHint}>{summaryText}</Text>
        </View>
        <TouchableOpacity style={styles.secondaryButton} onPress={onBackToResumo}>
          <Text style={styles.secondaryButtonText}>Voltar ao resumo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{plan?.title || 'Treino do dia'}</Text>

      {plan?.exercises?.map((exercise: WorkoutExercise, index: number) => (
        <View key={`${exercise.name}-${index}`} style={styles.card}>
          <Text style={styles.cardTitle}>{exercise.name}</Text>
          <Text style={styles.cardHint}>Series: {exercise.series}</Text>
          {exercise.carga && <Text style={styles.cardHint}>Carga: {exercise.carga}</Text>}
          {exercise.intervalo && <Text style={styles.cardHint}>Intervalo: {exercise.intervalo}</Text>}
          {exercise.instrucoes && <Text style={styles.cardHint}>{exercise.instrucoes}</Text>}
        </View>
      ))}

      {!sessionStart ? (
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleStart}>
          <Text style={styles.primaryButtonText}>Iniciar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleFinish}>
          <Text style={styles.primaryButtonText}>Finalizar</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.secondaryButton} onPress={onBackToResumo}>
        <Text style={styles.secondaryButtonText}>Voltar ao resumo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.backgroundCard,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  cardHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: COLORS.background,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
