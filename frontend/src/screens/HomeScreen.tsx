import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {useAuth} from '../store/authContext';
import {useMood} from '../store/moodContext';
import {MoodSelector} from '../components/mood-selector/MoodSelector';
import {Button} from '../components/common/Button';
import {Input} from '../components/common/Input';
import {COLORS} from '../constants/colors';
import {MoodType} from '../types';
import {LockScreen} from './LockScreen';
import {Avatar} from '../components/common/Avatar';
import {userService} from '../services/userService';
import {getAbsoluteUrl} from '../utils/url';
import {storage} from '../utils/storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../store/themeContext';

export const HomeScreen: React.FC = () => {
  const {user, logout, refreshUser} = useAuth();
  const {colors} = useTheme();
  const {currentMood, partnerMood, updateMood, refreshMoods, isLoading, isNearby, distance} =
    useMood();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>(currentMood?.type);
  const [message, setMessage] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);

  const getMoodLabel = (type: MoodType): string => {
    switch (type) {
      case MoodType.HAPPY:
        return 'Feliz';
      case MoodType.SAD:
        return 'Triste';
      case MoodType.ANXIOUS:
        return 'Ansioso';
      case MoodType.PARANOICA:
        return 'Paranoica';
      case MoodType.CALM:
        return 'Calmo';
      case MoodType.EXCITED:
        return 'Empolgado';
      case MoodType.TIRED:
        return 'Cansado';
      case MoodType.ANGRY:
        return 'Irritado';
      case MoodType.LOVE:
        return 'Apaixonado';
      default:
        return 'Humor';
    }
  };

  const getMoodEmoji = (type: MoodType): string => {
    switch (type) {
      case MoodType.HAPPY:
        return '😊';
      case MoodType.SAD:
        return '😢';
      case MoodType.ANXIOUS:
        return '😰';
      case MoodType.PARANOICA:
        return '😵‍💫';
      case MoodType.CALM:
        return '😌';
      case MoodType.EXCITED:
        return '🤩';
      case MoodType.TIRED:
        return '😴';
      case MoodType.ANGRY:
        return '😠';
      case MoodType.LOVE:
        return '❤️';
      default:
        return '🙂';
    }
  };

  useEffect(() => {
    const loadLocalPhoto = async () => {
      const storedUri = await storage.getLastUploadedPhotoUri();
      setLocalPhotoUri(storedUri);
    };
    loadLocalPhoto();
  }, []);

  useEffect(() => {
    if (currentMood) {
      setSelectedMood(currentMood.type);
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

  const handlePhotoUpload = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Autorize o acesso à galeria para enviar uma foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri || !asset.mimeType) {
        Alert.alert('Erro', 'Não foi possível ler a imagem selecionada');
        return;
      }

      setIsUploadingPhoto(true);
      const filename = asset.fileName || `photo-${Date.now()}.jpg`;
      const response = await userService.uploadMyPhoto(asset.uri, asset.mimeType, filename);

      if (response.success) {
        await storage.setLastUploadedPhotoUri(asset.uri);
        setLocalPhotoUri(asset.uri);
        await refreshUser();
      } else {
        Alert.alert('Erro', response.error || 'Falha ao enviar foto');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar foto');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (isLocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshMoods} />}>
      <View style={[styles.header, {paddingTop: 20 + insets.top}]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => {
              if (user?.email?.toLowerCase() === 'alandiogor@gmail.com') {
                navigation.navigate('SpecialArea' as never);
              }
            }}
            activeOpacity={user?.email?.toLowerCase() === 'alandiogor@gmail.com' ? 0.7 : 1}>
            <Avatar uri={localPhotoUri || getAbsoluteUrl(user?.photoUrl)} size={56} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Olá, {user?.name}!</Text>
            <TouchableOpacity onPress={handlePhotoUpload} disabled={isUploadingPhoto}>
              <Text style={[styles.photoLink, {color: colors.primary}]}>
                {isUploadingPhoto ? 'Enviando...' : 'Atualizar foto'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile' as never)}>
              <Text style={[styles.photoLink, {color: colors.primary}]}>Editar perfil</Text>
            </TouchableOpacity>
          </View>
        </View>
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
            <Text style={styles.currentMoodEmoji}>{getMoodEmoji(currentMood.type)}</Text>
            <Text style={styles.currentMoodType}>{getMoodLabel(currentMood.type)}</Text>
            {currentMood.message && (
              <Text style={styles.currentMoodMessage}>{currentMood.message}</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado do Parceiro</Text>
        {partnerMood ? (
          <View style={[styles.partnerMoodCard, {borderColor: colors.primary}]}>
            <Text style={styles.partnerMoodEmoji}>{getMoodEmoji(partnerMood.type)}</Text>
            <Text style={styles.partnerMoodType}>{getMoodLabel(partnerMood.type)}</Text>
            {partnerMood.message && (
              <Text style={styles.partnerMoodMessage}>{partnerMood.message}</Text>
            )}
            {distance !== null && (
              <Text style={styles.distanceText}>Distância: {distance.toFixed(2)} km</Text>
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
  content: {
    paddingBottom: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  photoLink: {
    color: COLORS.primary,
    fontSize: 14,
    marginTop: 4,
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
  distanceText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
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
