import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { DIET_MEALS, DietItem, getMealByTime } from '../data/diet';

interface DietScreenProps {
  onBackToResumo: () => void;
}

export const DietScreen: React.FC<DietScreenProps> = ({ onBackToResumo }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const meal = useMemo(() => getMealByTime(), []);

  const toggleItem = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dieta</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{meal.title}</Text>
        <Text style={styles.cardHint}>{meal.timeLabel}</Text>
      </View>

      {meal.items.map((item: DietItem, index: number) => {
        const key = `${meal.id}-${index}`;
        return (
          <View key={key} style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardHint}>
              Quantidade: {item.grams} ({item.portionHint})
            </Text>
            <TouchableOpacity style={styles.linkButton} onPress={() => toggleItem(key)}>
              <Text style={styles.linkButtonText}>Ver opcao de substituicao</Text>
            </TouchableOpacity>
            {expanded[key] && (
              <View style={styles.substitutions}>
                {item.substitutions.map((sub, idx) => (
                  <Text key={`${key}-${idx}`} style={styles.substitutionText}>
                    - {sub.name} ({sub.portion})
                  </Text>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Outras refeicoes</Text>
        {DIET_MEALS.filter(other => other.id !== meal.id).map(other => (
          <Text key={other.id} style={styles.cardHint}>
            {other.title} - {other.timeLabel}
          </Text>
        ))}
      </View>

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
    marginBottom: 6,
  },
  linkButton: {
    marginTop: 6,
  },
  linkButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  substitutions: {
    marginTop: 8,
  },
  substitutionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
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
