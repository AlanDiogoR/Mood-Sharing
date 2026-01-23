import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl} from 'react-native';
import {useAuth} from '../store/authContext';
import {useMood} from '../store/moodContext';
import {MoodSelector} from '../components/mood-selector/MoodSelector';
import {Button} from '../components/common/Button';
import {Input} from '../components/common/Input';
import {COLORS} from '../constants/colors';
import {MoodType} from '../types';
import {LockScreen} from './LockScreen';

export const HomeScreen: React.FC = () => {
  const {user, logout} = useAuth();
  const {currentMood, partnerMood, updateMood, refreshMoods, isLoading, isNearby, distance} =
    useMood();
  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>(currentMood?.type);
  const [message, setMessage] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (currentMood) {
      setSelectedMood(currentMood.type);
      setMessage(currentMood.message || '');
    }
  }, [currentMood]);

  const handleUpdateMood = async () => {
    if (!selectedMood) {
      return;
    }

    try {
      await updateMood(selectedMood, message || undefined);
      setMessage('');
    } catch (error) {
      console.error('Error updating mood:', error);
    }
  };

  const handleUnlock = () => {
    setIsLocked(false);
  };

  if (isLocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshMoods} />}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {user?.name}!</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {isNearby && (
        <View style={styles.proximityBanner}>
          <Text style={styles.proximityText}>
            🎉 Você está próximo! {distance !== null && `(${distance.toFixed(2)} km)`}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seu Estado Atual</Text>
        {currentMood && (
          <View style={styles.currentMoodCard}>
            <Text style={styles.currentMoodEmoji}>
              {currentMood.type === MoodType.HAPPY && '😊'}
              {currentMood.type === MoodType.SAD && '😢'}
              {currentMood.type === MoodType.ANXIOUS && '😰'}
              {currentMood.type === MoodType.CALM && '😌'}
              {currentMood.type === MoodType.EXCITED && '🤩'}
              {currentMood.type === MoodType.TIRED && '😴'}
              {currentMood.type === MoodType.ANGRY && '😠'}
              {currentMood.type === MoodType.LOVE && '❤️'}
            </Text>
            <Text style={styles.currentMoodType}>{currentMood.type}</Text>
            {currentMood.message && (
              <Text style={styles.currentMoodMessage}>{currentMood.message}</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado do Parceiro</Text>
        {partnerMood ? (
          <View style={styles.partnerMoodCard}>
            <Text style={styles.partnerMoodEmoji}>
              {partnerMood.type === MoodType.HAPPY && '😊'}
              {partnerMood.type === MoodType.SAD && '😢'}
              {partnerMood.type === MoodType.ANXIOUS && '😰'}
              {partnerMood.type === MoodType.CALM && '😌'}
              {partnerMood.type === MoodType.EXCITED && '🤩'}
              {partnerMood.type === MoodType.TIRED && '😴'}
              {partnerMood.type === MoodType.ANGRY && '😠'}
              {partnerMood.type === MoodType.LOVE && '❤️'}
            </Text>
            <Text style={styles.partnerMoodType}>{partnerMood.type}</Text>
            {partnerMood.message && (
              <Text style={styles.partnerMoodMessage}>{partnerMood.message}</Text>
            )}
          </View>
        ) : (
          <View style={styles.noPartnerCard}>
            <Text style={styles.noPartnerText}>Nenhum parceiro vinculado</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Atualizar Estado</Text>
        <MoodSelector selectedMood={selectedMood} onSelect={setSelectedMood} />

        <Input
          label="Mensagem (opcional)"
          value={message}
          onChangeText={setMessage}
          placeholder="Como você está se sentindo?"
          multiline
          numberOfLines={3}
          style={styles.messageInput}
        />

        <Button
          title="Atualizar Estado"
          onPress={handleUpdateMood}
          disabled={!selectedMood}
          loading={isLoading}
          style={styles.updateButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
  proximityBanner: {
    backgroundColor: COLORS.success,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
  },
  proximityText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  currentMoodCard: {
    backgroundColor: COLORS.backgroundCard,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currentMoodEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  currentMoodType: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  currentMoodMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  partnerMoodCard: {
    backgroundColor: COLORS.backgroundCard,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  partnerMoodEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  partnerMoodType: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  partnerMoodMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  noPartnerCard: {
    backgroundColor: COLORS.backgroundCard,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noPartnerText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  messageInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  updateButton: {
    marginTop: 16,
  },
});
