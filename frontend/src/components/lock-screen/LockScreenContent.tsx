import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, Dimensions} from 'react-native';
import {useMood} from '../../store/moodContext';
import {useAuth} from '../../store/authContext';
import {COLORS} from '../../constants/colors';
import {MoodType} from '../../types';
import {Avatar} from '../common/Avatar';
import {getAbsoluteUrl} from '../../utils/url';

const {width} = Dimensions.get('window');

const MOOD_EMOJIS: Record<MoodType, string> = {
  [MoodType.HAPPY]: '😊',
  [MoodType.SAD]: '😢',
  [MoodType.ANXIOUS]: '😰',
  [MoodType.CALM]: '😌',
  [MoodType.EXCITED]: '🤩',
  [MoodType.TIRED]: '😴',
  [MoodType.ANGRY]: '😠',
  [MoodType.LOVE]: '❤️',
};

const MOOD_MESSAGES: Record<MoodType, string> = {
  [MoodType.HAPPY]: 'está feliz hoje',
  [MoodType.SAD]: 'está triste hoje',
  [MoodType.ANXIOUS]: 'está ansioso hoje',
  [MoodType.CALM]: 'está calmo hoje',
  [MoodType.EXCITED]: 'está empolgado hoje',
  [MoodType.TIRED]: 'está cansado hoje',
  [MoodType.ANGRY]: 'está irritado hoje',
  [MoodType.LOVE]: 'está apaixonado hoje',
};

interface LockScreenContentProps {
  onUnlock: () => void;
}

export const LockScreenContent: React.FC<LockScreenContentProps> = ({onUnlock}) => {
  const {partnerMood, currentMood} = useMood();
  const {user} = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const emojiScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Emoji pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(emojiScaleAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(emojiScaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  const partnerName = user?.partnerId || 'Seu parceiro';
  const moodType = currentMood?.type || MoodType.HAPPY;
  const emoji = MOOD_EMOJIS[moodType];
  const message = MOOD_MESSAGES[moodType];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        <Animated.Text
          style={[
            styles.emoji,
            {
              transform: [{scale: emojiScaleAnim}],
            },
          ]}>
          {emoji}
        </Animated.Text>

        <Avatar uri={getAbsoluteUrl(user?.photoUrl)} size={120} />
        <Text style={styles.name}>{user?.name || 'Você'}</Text>
        <Text style={styles.message}>Você {message}</Text>

        {currentMood?.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.customMessage}>"{currentMood.message}"</Text>
          </View>
        )}

        {partnerMood && (
          <View style={styles.partnerContainer}>
            <Text style={styles.partnerName}>{partnerName}</Text>
            <Text style={styles.partnerMessage}>Parceiro {MOOD_MESSAGES[partnerMood.type]}</Text>
          </View>
        )}

        <Text style={styles.hint}>Toque para desbloquear</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    width: width - 40,
  },
  emoji: {
    fontSize: 120,
    marginBottom: 24,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: COLORS.backgroundCard,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: width - 80,
  },
  customMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 32,
  },
  partnerContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  partnerName: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  partnerMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
