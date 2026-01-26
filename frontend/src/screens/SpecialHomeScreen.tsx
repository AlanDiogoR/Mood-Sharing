import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';
import { storage } from '../utils/storage';

interface SpecialHomeScreenProps {
  onGoToTreino: () => void;
}

const MOTIVATIONAL_MESSAGES = [
  'Hoje e um bom dia para evoluir.',
  'Disciplina vence a motivacao.',
  'Pequenos passos geram grandes resultados.',
  'Foco no processo, resultado vem.',
  'Treino feito, mente forte.',
  'Consistencia acima de intensidade.',
  'Voce e capaz de mais do que imagina.',
];

const getDateKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const SpecialHomeScreen: React.FC<SpecialHomeScreenProps> = ({ onGoToTreino }) => {
  const [yearCount, setYearCount] = useState(0);
  const [summaryText, setSummaryText] = useState('Ainda nao ha treino registrado hoje.');

  const dailyMessage = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return MOTIVATIONAL_MESSAGES[dayOfYear % MOTIVATIONAL_MESSAGES.length];
  }, []);

  useEffect(() => {
    const loadSummary = async () => {
      const dateKey = getDateKey();
      const summary = await storage.getWorkoutSummary(dateKey);
      if (summary) {
        setSummaryText(
          `Treino concluido: ${summary.durationMinutes} min, ${summary.calories} kcal estimadas.`
        );
      } else {
        setSummaryText('Ainda nao ha treino registrado hoje.');
      }

      const count = await storage.getWorkoutYearCount(new Date().getFullYear());
      setYearCount(count);
    };
    loadSummary();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resumo do dia</Text>
      <Text style={styles.message}>{dailyMessage}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Treinos no ano</Text>
        <Text style={styles.cardValue}>{yearCount} dias</Text>
        <Text style={styles.cardHint}>
          {yearCount > 0 ? 'Voce esta mantendo o ritmo.' : 'Vamos treinar hoje?'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hoje</Text>
        <Text style={styles.cardHint}>{summaryText}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onGoToTreino}>
          <Text style={styles.primaryButtonText}>Ir para treino</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
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
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  cardHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.background,
    fontWeight: '700',
  },
});
