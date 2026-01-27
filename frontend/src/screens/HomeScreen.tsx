import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Modal,
  useWindowDimensions,
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
import {photoService} from '../services/photoService';
import {meetingService} from '../services/meetingService';
import {SharedPhoto, WeeklyMeetingSummary} from '../types';

export const HomeScreen: React.FC = () => {
  const EXTRA_EMOTIONS = [
    {emoji: '😍', label: 'Animado'},
    {emoji: '🥰', label: 'Carinhoso'},
    {emoji: '😤', label: 'Determinado'},
    {emoji: '😵‍💫', label: 'Confuso'},
    {emoji: '🤯', label: 'Sobrecarregado'},
    {emoji: '😌', label: 'Grato'},
  ];
  const {user, logout, refreshUser} = useAuth();
  const {colors} = useTheme();
  const {currentMood, partnerMood, updateMood, refreshMoods, isLoading, isNearby, distance} =
    useMood();
  const {width} = useWindowDimensions();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>(currentMood?.type);
  const [message, setMessage] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [partnerSharedPhoto, setPartnerSharedPhoto] = useState<SharedPhoto | null>(null);
  const [isLoadingPartnerPhoto, setIsLoadingPartnerPhoto] = useState(false);
  const [isUploadingPartnerPhoto, setIsUploadingPartnerPhoto] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [extraEmotion, setExtraEmotion] = useState<{emoji: string; label: string} | null>(null);
  const [isExtraModalVisible, setIsExtraModalVisible] = useState(false);
  const [meetingSummary, setMeetingSummary] = useState<WeeklyMeetingSummary | null>(null);
  const [meetingLoading, setMeetingLoading] = useState(false);

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

  useEffect(() => {
    if (!user?.partnerId) {
      setPartnerSharedPhoto(null);
      setMeetingSummary(null);
      return;
    }
    loadPartnerPhoto();
    loadMeetingSummary();
  }, [user?.partnerId]);

  const loadPartnerPhoto = async () => {
    setIsLoadingPartnerPhoto(true);
    try {
      const response = await photoService.getLatestFromPartner();
      if (response.success) {
        setPartnerSharedPhoto(response.data ?? null);
      }
    } catch (error) {
      console.error('Error loading partner photo:', error);
    } finally {
      setIsLoadingPartnerPhoto(false);
    }
  };

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

  const formatWeekday = (dateKey: string): string => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', {weekday: 'short'});
  };

  const loadMeetingSummary = async () => {
    setMeetingLoading(true);
    try {
      const startKey = getDateKey(getWeekStart());
      const response = await meetingService.getWeeklySummary(startKey);
      if (response.success && response.data) {
        setMeetingSummary(response.data);
      } else {
        setMeetingSummary(null);
      }
    } catch (error) {
      console.error('Error loading meeting summary:', error);
      setMeetingSummary(null);
    } finally {
      setMeetingLoading(false);
    }
  };

  const handleUpdateMood = async () => {
    if (!selectedMood) {
      return;
    }

    try {
      await updateMood(
        selectedMood,
        message || undefined,
        extraEmotion?.emoji ?? null,
        extraEmotion?.label ?? null
      );
      setMessage('');
      setExtraEmotion(null);
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

  const handlePartnerPhotoUpload = async () => {
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

      setIsUploadingPartnerPhoto(true);
      const filename = asset.fileName || `shared-photo-${Date.now()}.jpg`;
      const response = await photoService.sendToPartner(asset.uri, asset.mimeType, filename);

      if (!response.success) {
        Alert.alert('Erro', response.error || 'Falha ao enviar foto');
      } else {
        Alert.alert('Sucesso', 'Foto enviada para o parceiro.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar foto');
    } finally {
      setIsUploadingPartnerPhoto(false);
    }
  };

  if (isLocked) {
    return <LockScreen onUnlock={handleUnlock} />;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshMoods(), loadPartnerPhoto(), loadMeetingSummary()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const partnerPhotoUrl = partnerSharedPhoto?.photoUrl
    ? getAbsoluteUrl(partnerSharedPhoto.photoUrl)
    : null;
  const partnerPhotoUpdatedAt = partnerSharedPhoto?.createdAt;
  const partnerPhotoWithCache =
    partnerPhotoUrl && partnerPhotoUpdatedAt
      ? `${partnerPhotoUrl}${partnerPhotoUrl.includes('?') ? '&' : '?'}t=${encodeURIComponent(
          partnerPhotoUpdatedAt
        )}`
      : partnerPhotoUrl;
  const partnerPhotoHeight = Math.min(240, Math.max(180, width - 120));

  const meetingStats = useMemo(() => {
    const entries = meetingSummary?.entries || [];
    const daysSeen = entries.filter(item => item.totalMinutesTogether > 0);
    const maxMinutes = daysSeen.reduce(
      (max, item) => Math.max(max, item.totalMinutesTogether),
      0
    );
    const topDays = daysSeen.filter(item => item.totalMinutesTogether === maxMinutes);
    return {
      daysSeen,
      maxMinutes,
      topDays,
      totals: meetingSummary?.totals,
    };
  }, [meetingSummary]);

  const activeMinutes = meetingStats.totals?.activeMinutesTogether || 0;
  const totalMinutes = meetingStats.totals?.totalMinutesTogether || 0;
  const inactiveMinutes = Math.max(totalMinutes - activeMinutes, 0);
  const activeRatio = totalMinutes > 0 ? activeMinutes / totalMinutes : 0;
  const activePercent = Math.round(activeRatio * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading || isRefreshing || isLoadingPartnerPhoto}
          onRefresh={handleRefresh}
        />
      }>
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
            {currentMood.extraEmoji && currentMood.extraLabel && (
              <Text style={styles.extraEmotionDisplay}>
                {currentMood.extraEmoji} {currentMood.extraLabel}
              </Text>
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
            {partnerMood.extraEmoji && partnerMood.extraLabel && (
              <Text style={styles.extraEmotionDisplay}>
                {partnerMood.extraEmoji} {partnerMood.extraLabel}
              </Text>
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
        {user?.partnerId && (
          <View style={styles.partnerPhotoSection}>
            <Text style={styles.partnerPhotoTitle}>Foto enviada pelo parceiro</Text>
            {partnerPhotoWithCache ? (
              <Image
                source={{uri: partnerPhotoWithCache}}
                style={[styles.partnerPhoto, {height: partnerPhotoHeight}]}
              />
            ) : (
              <Text style={styles.partnerPhotoEmpty}>
                {isLoadingPartnerPhoto ? 'Carregando foto...' : 'Nenhuma foto recebida ainda.'}
              </Text>
            )}
            <Button
              title={isUploadingPartnerPhoto ? 'Enviando...' : 'Enviar foto ao parceiro'}
              onPress={handlePartnerPhotoUpload}
              disabled={isUploadingPartnerPhoto}
              style={styles.partnerPhotoButton}
            />
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

        <View style={styles.extraEmotionRow}>
          <Text style={styles.extraEmotionLabel}>Emoção extra</Text>
          <TouchableOpacity
            onPress={() => setIsExtraModalVisible(true)}
            style={[styles.extraEmotionButton, {borderColor: colors.primary}]}>
            <Text style={[styles.extraEmotionButtonText, {color: colors.primary}]}>+</Text>
          </TouchableOpacity>
        </View>
        {extraEmotion && (
          <Text style={styles.extraEmotionSelected}>
            {extraEmotion.emoji} {extraEmotion.label}
          </Text>
        )}

        <Button
          title="Atualizar Estado"
          onPress={handleUpdateMood}
          disabled={!selectedMood}
          loading={isLoading}
          style={styles.updateButton}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Encontros da semana</Text>
        {meetingLoading && <Text style={styles.meetingHint}>Carregando dados...</Text>}
        {!meetingLoading && !meetingSummary && (
          <Text style={styles.meetingHint}>Nenhum dado de encontro disponível.</Text>
        )}
        {!meetingLoading && meetingSummary && (
          <View style={styles.meetingCard}>
            <View style={styles.meetingRow}>
              <Text style={styles.meetingLabel}>Dias que se viram</Text>
              <Text style={styles.meetingValue}>{meetingStats.daysSeen.length}</Text>
            </View>
            {meetingStats.daysSeen.length ? (
              <Text style={styles.meetingHint}>
                {meetingStats.daysSeen
                  .map(item => `${formatWeekday(item.dateKey)} ${formatShortDate(item.dateKey)}`)
                  .join(' · ')}
              </Text>
            ) : (
              <Text style={styles.meetingHint}>Ainda não há encontros registrados.</Text>
            )}
            <View style={styles.meetingRow}>
              <Text style={styles.meetingLabel}>Dia com mais horas juntos</Text>
              <Text style={styles.meetingValue}>
                {meetingStats.maxMinutes ? `${Math.round(meetingStats.maxMinutes / 60)}h` : '0h'}
              </Text>
            </View>
            {meetingStats.topDays.length ? (
              <Text style={styles.meetingHint}>
                {meetingStats.topDays
                  .map(item => `${formatWeekday(item.dateKey)} ${formatShortDate(item.dateKey)}`)
                  .join(' · ')}
              </Text>
            ) : null}
            <View style={styles.meetingPieRow}>
              <View style={styles.pieChart}>
                <View style={styles.pieHalfLeft}>
                  <View
                    style={[
                      styles.pieCircle,
                      {
                        backgroundColor:
                          activePercent > 50 ? COLORS.primary : COLORS.success,
                        transform: [
                          {rotateZ: `${activePercent > 50 ? (activePercent - 50) * 3.6 : 0}deg`},
                        ],
                      },
                    ]}
                  />
                </View>
                <View style={styles.pieHalfRight}>
                  <View
                    style={[
                      styles.pieCircle,
                      {
                        backgroundColor: activePercent === 0 ? COLORS.success : COLORS.primary,
                        transform: [
                          {rotateZ: `${activePercent <= 50 ? activePercent * 3.6 : 180}deg`},
                        ],
                      },
                    ]}
                  />
                </View>
                <View style={styles.pieInner} />
              </View>
              <View style={styles.meetingLegend}>
                <Text style={styles.meetingLegendItem}>
                  <Text style={[styles.meetingLegendDot, {color: COLORS.primary}]}>● </Text>
                  Tempo ativo: {Math.round(activeMinutes)} min
                </Text>
                <Text style={styles.meetingLegendItem}>
                  <Text style={[styles.meetingLegendDot, {color: COLORS.success}]}>● </Text>
                  Tempo juntos (descanso): {Math.round(inactiveMinutes)} min
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
      <Modal
        visible={isExtraModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsExtraModalVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsExtraModalVisible(false)}
          style={styles.modalOverlay}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione uma emoção</Text>
            {EXTRA_EMOTIONS.map(option => (
              <TouchableOpacity
                key={`${option.label}-${option.emoji}`}
                style={styles.modalItem}
                onPress={() => {
                  setExtraEmotion(option);
                  setIsExtraModalVisible(false);
                }}>
                <Text style={styles.modalItemText}>
                  {option.emoji} {option.label}
                </Text>
              </TouchableOpacity>
            ))}
            <Button
              title="Remover emoção"
              onPress={() => {
                setExtraEmotion(null);
                setIsExtraModalVisible(false);
              }}
              style={styles.modalRemoveButton}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  extraEmotionDisplay: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.textSecondary,
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
  partnerPhotoSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  partnerPhotoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  partnerPhoto: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    marginBottom: 12,
  },
  partnerPhotoEmpty: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  partnerPhotoButton: {
    marginTop: 4,
  },
  extraEmotionRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  extraEmotionLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  extraEmotionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraEmotionButtonText: {
    fontSize: 24,
    fontWeight: '700',
  },
  extraEmotionSelected: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 10,
  },
  modalItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  modalRemoveButton: {
    marginTop: 12,
  },
  messageInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  updateButton: {
    marginTop: 16,
  },
  meetingCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  meetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  meetingLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  meetingValue: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },
  meetingHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  meetingPieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  pieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.success,
  },
  pieHalfLeft: {
    position: 'absolute',
    left: 0,
    width: 60,
    height: 120,
    overflow: 'hidden',
  },
  pieHalfRight: {
    position: 'absolute',
    right: 0,
    width: 60,
    height: 120,
    overflow: 'hidden',
  },
  pieCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  pieInner: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: COLORS.backgroundCard,
  },
  meetingLegend: {
    flex: 1,
    marginLeft: 12,
    marginTop: 8,
  },
  meetingLegendItem: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  meetingLegendDot: {
    fontSize: 14,
  },
});
