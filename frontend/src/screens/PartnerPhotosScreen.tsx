import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { photoService } from '../services/photoService';
import { getAbsoluteUrl } from '../utils/url';
import { SharedPhoto } from '../types';
import { COLORS } from '../constants/colors';
import { useTheme } from '../store/themeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMNS = 2;
const GAP = 4;
const THUMB_SIZE = (SCREEN_WIDTH - GAP * (COLUMNS + 1)) / COLUMNS;

export const PartnerPhotosScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [photos, setPhotos] = useState<SharedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<SharedPhoto | null>(null);

  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchPhotos = useCallback(async (pageNum: number, replace: boolean) => {
    if (replace) {
      setIsLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const response = await photoService.getPartnerPhotos(pageNum, 20);
      if (!isMounted.current) return;

      if (response.success && response.data) {
        const newPhotos = response.data.photos;
        setPhotos(prev => (replace ? newPhotos : [...prev, ...newPhotos]));
        setHasMore(response.data.pagination.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      // silently fail — user can pull-to-refresh
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsFetchingMore(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchPhotos(1, true);
  }, [fetchPhotos]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPhotos(1, true);
  };

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore && !isLoading) {
      fetchPhotos(page + 1, false);
    }
  };

  const getPhotoUri = (photo: SharedPhoto) => {
    const url = getAbsoluteUrl(photo.photoUrl);
    if (!url) return null;
    const timestamp = photo.createdAt;
    return `${url}${url.includes('?') ? '&' : '?'}t=${encodeURIComponent(timestamp)}`;
  };

  const renderItem = ({ item }: { item: SharedPhoto }) => {
    const uri = getPhotoUri(item);
    return (
      <TouchableOpacity
        style={styles.thumb}
        activeOpacity={0.85}
        onPress={() => setSelectedPhoto(item)}>
        {uri ? (
          <Image source={{ uri }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Ionicons name="image-outline" size={28} color={COLORS.textMuted} />
          </View>
        )}
        <View style={styles.thumbDateOverlay}>
          <Text style={styles.thumbDate}>
            {new Date(item.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isFetchingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={64} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>Nenhuma foto ainda</Text>
        <Text style={styles.emptySubtitle}>
          Quando seu parceiro enviar uma foto, ela aparecerá aqui.
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fotos do Parceiro</Text>
        <View style={styles.backBtn} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando fotos...</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={item => item.id}
          numColumns={COLUMNS}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={[
            styles.listContent,
            photos.length === 0 && styles.listContentEmpty,
          ]}
          columnWrapperStyle={styles.row}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Lightbox */}
      <Modal
        visible={selectedPhoto !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelectedPhoto(null)}>
        <View style={styles.lightbox}>
          <TouchableOpacity
            style={styles.lightboxClose}
            onPress={() => setSelectedPhoto(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>

          {selectedPhoto && getPhotoUri(selectedPhoto) ? (
            <Image
              source={{ uri: getPhotoUri(selectedPhoto)! }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          ) : null}

          {selectedPhoto && (
            <View style={styles.lightboxMeta}>
              <Text style={styles.lightboxDate}>
                {new Date(selectedPhoto.createdAt).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  listContent: {
    padding: GAP,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flex: 1,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundCard,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbDateOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  thumbDate: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  lightbox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 6,
  },
  lightboxImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
  },
  lightboxMeta: {
    position: 'absolute',
    bottom: 52,
    alignItems: 'center',
  },
  lightboxDate: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
});
