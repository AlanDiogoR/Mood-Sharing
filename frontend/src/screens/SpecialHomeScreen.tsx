import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { COLORS } from '../constants/colors';
import { storage } from '../utils/storage';
import { useTheme } from '../store/themeContext';
import { workoutService } from '../services/workoutService';
import { WeeklyWorkoutSummary, WorkoutSummaryEntry, GoalItem } from '../types';
import { goalService } from '../services/goalService';

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

const DEFAULT_GOALS: GoalItem[] = [
  { id: 'fitness-250', title: '250 dias de treino', category: 'Objetivos Fisicos e de Bem-Estar', completed: false },
  { id: 'fitness-83kg', title: 'Chegar aos 83kg', category: 'Objetivos Fisicos e de Bem-Estar', completed: false },
  { id: 'fitness-checkup', title: 'Fazer 2x exames check-up', category: 'Objetivos Fisicos e de Bem-Estar', completed: false },
  { id: 'fitness-depilar', title: 'Depilar 2x a cada bimestre', category: 'Objetivos Fisicos e de Bem-Estar', completed: false },
  { id: 'fitness-dentista', title: 'Ir ao dentista', category: 'Objetivos Fisicos e de Bem-Estar', completed: false },
  { id: 'fitness-oculos', title: 'Oculos novo vida', category: 'Objetivos Fisicos e de Bem-Estar', completed: false },
  { id: 'mind-livros', title: 'Ler 6x livros', category: 'Desenvolvimento Intelectual e Espiritual', completed: false },
  { id: 'mind-prova', title: 'Estudar uma semana para prova', category: 'Desenvolvimento Intelectual e Espiritual', completed: false },
  { id: 'mind-duolingo', title: 'Manter ofensiva no Duolingo ano', category: 'Desenvolvimento Intelectual e Espiritual', completed: false },
  { id: 'mind-cv', title: 'Enviar curriculo 1x/semana', category: 'Desenvolvimento Intelectual e Espiritual', completed: false },
  { id: 'mind-biblia', title: 'Ler um capitulo da biblia', category: 'Desenvolvimento Intelectual e Espiritual', completed: false },
  { id: 'career-estagio', title: 'Estagio - emprego', category: 'Avanco de Carreira e Estabilidade Financeira', completed: false },
  { id: 'career-loja', title: 'Ativar uma das lojas', category: 'Avanco de Carreira e Estabilidade Financeira', completed: false },
  { id: 'career-invest', title: 'Nao retirar dinheiro dos investimentos', category: 'Avanco de Carreira e Estabilidade Financeira', completed: false },
];

const getDateKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekStart = (date = new Date()): Date => {
  const current = new Date(date);
  const day = current.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  current.setDate(current.getDate() + diff);
  current.setHours(0, 0, 0, 0);
  return current;
};

const formatShortDate = (dateKey: string): string => {
  const [, month, day] = dateKey.split('-');
  return `${day}/${month}`;
};

export const SpecialHomeScreen: React.FC<SpecialHomeScreenProps> = ({ onGoToTreino }) => {
  const { colors } = useTheme();
  const [yearCount, setYearCount] = useState(0);
  const [summaryText, setSummaryText] = useState('Ainda nao ha treino registrado hoje.');
  const [weeklySummary, setWeeklySummary] = useState<WeeklyWorkoutSummary | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Objetivos Fisicos e de Bem-Estar');

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

  useEffect(() => {
    const loadGoals = async () => {
      setGoalsLoading(true);
      try {
        const response = await goalService.list();
        if (response.success && response.data) {
          if (!response.data.length) {
            await goalService.update(DEFAULT_GOALS);
            setGoals(DEFAULT_GOALS);
          } else {
            setGoals(response.data);
          }
        } else {
          setGoals(DEFAULT_GOALS);
        }
      } catch (error) {
        console.error('Erro ao carregar metas:', error);
        setGoals(DEFAULT_GOALS);
      } finally {
        setGoalsLoading(false);
      }
    };

    loadGoals();
  }, []);

  const handleToggleGoal = async (goalId: string) => {
    const next = goals.map(item =>
      item.id === goalId ? { ...item, completed: !item.completed } : item
    );
    setGoals(next);
    try {
      await goalService.update(next);
    } catch (error) {
      console.error('Erro ao atualizar metas:', error);
      setGoals(goals);
    }
  };

  const handleAddGoal = async () => {
    const title = newGoalTitle.trim();
    const category = newGoalCategory.trim();
    if (!title || !category) {
      return;
    }
    const next: GoalItem[] = [
      ...goals,
      {
        id: `goal-${Date.now()}`,
        title,
        category,
        completed: false,
      },
    ];
    setGoals(next);
    setNewGoalTitle('');
    try {
      await goalService.update(next);
    } catch (error) {
      console.error('Erro ao adicionar meta:', error);
      setGoals(goals);
    }
  };

  const handleRemoveGoal = async (goalId: string) => {
    const next = goals.filter(item => item.id !== goalId);
    setGoals(next);
    try {
      await goalService.update(next);
    } catch (error) {
      console.error('Erro ao remover meta:', error);
      setGoals(goals);
    }
  };

  useEffect(() => {
    const loadWeekly = async () => {
      setWeeklyLoading(true);
      const startDate = getWeekStart();
      const startKey = getDateKey(startDate);
      try {
        const response = await workoutService.getWeeklySummary(startKey);
        if (response.success && response.data) {
          setWeeklySummary(response.data);
          setWeeklyLoading(false);
          return;
        }
      } catch (error) {
        console.error('Erro ao buscar resumo semanal:', error);
      }

      const entries: WorkoutSummaryEntry[] = [];
      for (let i = 0; i < 7; i += 1) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        const key = getDateKey(day);
        const summary = await storage.getWorkoutSummary(key);
        if (summary) {
          entries.push(summary);
        }
      }

      const totals = entries.reduce(
        (acc, item) => {
          acc.totalMinutes += item.durationMinutes;
          acc.totalCalories += item.calories;
          return acc;
        },
        { totalMinutes: 0, totalCalories: 0 }
      );

      setWeeklySummary({
        startKey,
        endKey: getDateKey(new Date(startDate.getTime() + 6 * 86400000)),
        entries,
        totals: {
          totalMinutes: totals.totalMinutes,
          totalCalories: totals.totalCalories,
          totalDays: entries.length,
        },
      });
      setWeeklyLoading(false);
    };

    loadWeekly();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Resumo do dia</Text>
      <Text style={styles.message}>{dailyMessage}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Treinos no ano</Text>
        <Text style={[styles.cardValue, { color: colors.primary }]}>{yearCount} dias</Text>
        <Text style={styles.cardHint}>
          {yearCount > 0 ? 'Voce esta mantendo o ritmo.' : 'Vamos treinar hoje?'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hoje</Text>
        <Text style={styles.cardHint}>{summaryText}</Text>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={onGoToTreino}>
          <Text style={styles.primaryButtonText}>Ir para treino</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumo semanal</Text>
        {weeklyLoading && <Text style={styles.cardHint}>Carregando resumo...</Text>}
        {!weeklyLoading && weeklySummary && (
          <>
            <Text style={styles.cardHint}>
              {weeklySummary.totals.totalDays} treinos · {weeklySummary.totals.totalMinutes} min ·{' '}
              {weeklySummary.totals.totalCalories} kcal
            </Text>
            {weeklySummary.entries.length ? (
              weeklySummary.entries.map(entry => (
                <Text key={entry.dateKey} style={styles.weeklyEntry}>
                  {formatShortDate(entry.dateKey)} · {entry.durationMinutes} min · {entry.calories} kcal
                </Text>
              ))
            ) : (
              <Text style={styles.cardHint}>Nenhum treino registrado nesta semana.</Text>
            )}
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Metas pessoais e profissionais</Text>
        {goalsLoading && <Text style={styles.cardHint}>Carregando metas...</Text>}
        {!goalsLoading && (
          <>
            {Array.from(new Set(goals.map(goal => goal.category))).map(category => (
              <View key={category} style={styles.goalGroup}>
                <Text style={styles.goalGroupTitle}>{category}</Text>
                {goals
                  .filter(goal => goal.category === category)
                  .map(goal => (
                    <View key={goal.id} style={styles.goalItem}>
                      <TouchableOpacity onPress={() => handleToggleGoal(goal.id)} style={styles.goalToggle}>
                        <Text style={[styles.goalCheckbox, goal.completed && styles.goalCheckboxChecked]}>
                          {goal.completed ? '✔' : '□'}
                        </Text>
                        <Text style={[styles.goalText, goal.completed && styles.goalTextChecked]}>{goal.title}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRemoveGoal(goal.id)}>
                        <Text style={styles.goalRemove}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>
            ))}
            <View style={styles.goalForm}>
              <TextInput
                style={styles.goalInput}
                placeholder="Nova meta"
                placeholderTextColor={COLORS.textMuted}
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
              />
              <TextInput
                style={styles.goalInput}
                placeholder="Categoria"
                placeholderTextColor={COLORS.textMuted}
                value={newGoalCategory}
                onChangeText={setNewGoalCategory}
              />
              <TouchableOpacity style={[styles.goalAddButton, { backgroundColor: colors.primary }]} onPress={handleAddGoal}>
                <Text style={styles.goalAddText}>Adicionar meta</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    paddingBottom: 40,
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
  weeklyEntry: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  goalGroup: {
    marginTop: 12,
  },
  goalGroupTitle: {
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: 8,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalCheckbox: {
    color: COLORS.textSecondary,
    width: 22,
  },
  goalCheckboxChecked: {
    color: COLORS.success,
  },
  goalText: {
    color: COLORS.textSecondary,
    flex: 1,
  },
  goalTextChecked: {
    color: COLORS.text,
    textDecorationLine: 'line-through',
  },
  goalRemove: {
    color: COLORS.error,
    fontSize: 12,
    marginLeft: 8,
  },
  goalForm: {
    marginTop: 12,
  },
  goalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  goalAddButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  goalAddText: {
    color: COLORS.background,
    fontWeight: '700',
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
