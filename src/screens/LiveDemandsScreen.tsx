import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { AppColors } from '../constants/theme';
import { serviceAdmin } from '../services/serviceAdmin';
import {
  LiveTickerResponseDto,
  LiveTickerItemDto,
  LiveTickerSummaryDto,
  LiveTickerCompanyDto,
} from '../types';

const REFRESH_INTERVAL_SEC = 30;

function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffSec = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffSec < 45) return 'Az önce';
    if (diffSec < 90) return '1 dk önce';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dk önce`;
    if (diffSec < 7200) return '1 saat önce';
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} saat önce`;
    if (diffSec < 172800) return 'Dün';
    return `${Math.floor(diffSec / 86400)} gün önce`;
  } catch {
    return dateString;
  }
}

function formatResponseDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '';
  if (seconds < 60) return `${seconds} sn`;
  const mins = Math.floor(seconds / 60);
  const remainingSec = seconds % 60;
  if (mins < 60) {
    return remainingSec > 0 ? `${mins} dk ${remainingSec} sn` : `${mins} dk`;
  }
  const hours = Math.floor(mins / 60);
  return `${hours} saat ${mins % 60} dk`;
}

export const LiveDemandsScreen: React.FC = () => {
  const [data, setData] = useState<LiveTickerResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Filtre State'leri
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'matched' | 'waiting'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  // Detay Modalı State'i
  const [selectedItem, setSelectedItem] = useState<LiveTickerItemDto | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);

  // Veri Çekme
  const fetchLiveTicker = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await serviceAdmin.getLiveTicker(50);
      const resData = res.data || res.Data || (res as any).value || (res as any).Value;
      if (resData && (resData.items || resData.summary)) {
        setData(resData);
        const now = new Date();
        setLastUpdated(
          `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
        );
      }
    } catch (err) {
      console.warn('[GetLiveTicker Error]:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // İlk yükleme
  useEffect(() => {
    fetchLiveTicker(false);
  }, [fetchLiveTicker]);

  // 30 saniyede bir sessiz otomatik yenileme
  useEffect(() => {
    const timer = setInterval(() => {
      fetchLiveTicker(true);
    }, REFRESH_INTERVAL_SEC * 1000);

    return () => clearInterval(timer);
  }, [fetchLiveTicker]);

  // Dinamik Kategoriler
  const categories = useMemo(() => {
    const set = new Set<string>();
    data?.items?.forEach((item) => {
      if (item.categoryname && item.categoryname.trim() !== 'Genel') {
        set.add(item.categoryname.trim());
      }
    });
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'))];
  }, [data?.items]);

  // Dinamik Şehirler
  const cities = useMemo(() => {
    const set = new Set<string>();
    data?.items?.forEach((item) => {
      if (item.cityname && item.cityname.trim().length > 1) {
        set.add(item.cityname.trim());
      }
    });
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'))];
  }, [data?.items]);

  // Filtrelenmiş Talepler
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];

    return data.items.filter((item) => {
      // 1. Arama
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const cat = (item.categoryname || '').toLowerCase();
        const city = (item.cityname || '').toLowerCase();
        const winner = (item.winningcompanyname || '').toLowerCase();
        if (
          !desc.includes(term) &&
          !cat.includes(term) &&
          !city.includes(term) &&
          !winner.includes(term)
        ) {
          return false;
        }
      }

      // 2. Durum
      if (selectedStatus === 'matched' && item.respondedcompanies <= 0) {
        return false;
      }
      if (selectedStatus === 'waiting' && item.respondedcompanies > 0) {
        return false;
      }

      // 3. Kategori
      if (selectedCategory !== 'all' && item.categoryname !== selectedCategory) {
        return false;
      }

      // 4. Şehir
      if (selectedCity !== 'all' && item.cityname !== selectedCity) {
        return false;
      }

      return true;
    });
  }, [data?.items, searchTerm, selectedStatus, selectedCategory, selectedCity]);

  const summary = data?.summary;
  const companies = data?.companies || [];

  const handleOpenDetail = (item: LiveTickerItemDto) => {
    setSelectedItem(item);
    setDetailModalVisible(true);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Canlı Borsa Başlık & Durum Rozeti */}
      <View style={styles.liveBadgeRow}>
        <View style={styles.liveSignalWrap}>
          <View style={styles.livePulseDot} />
          <Text style={styles.liveTitle}>CANLI TALEP AKIŞI & BORSA</Text>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => fetchLiveTicker(false)}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={15} color={AppColors.accent} />
          <Text style={styles.refreshBtnText}>
            {lastUpdated ? lastUpdated : 'Yenile'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Standardı Kutusu */}
      <View style={styles.infoBox}>
        <MaterialIcons name="info-outline" size={20} color={AppColors.accent} style={styles.infoIcon} />
        <Text style={styles.infoText}>
          Tüm Türkiye'den kullanıcıların açtığı parçalar ve esnafların "Bende Var" yanıtları anlık borsa terminali akışı olarak listelenir. 30 saniyede bir otomatik güncellenir.
        </Text>
      </View>

      {/* Özet Metrik Kartları (Yatay Kaydırılabilir) */}
      {summary && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricsScroll}
        >
          <View style={[styles.metricCard, { borderTopColor: AppColors.primary }]}>
            <View style={styles.metricIconWrap}>
              <Ionicons name="file-tray-full-outline" size={18} color={AppColors.primary} />
            </View>
            <Text style={styles.metricVal}>{summary.totaldemands}</Text>
            <Text style={styles.metricLabel}>Toplam Talep</Text>
          </View>

          <View style={[styles.metricCard, { borderTopColor: AppColors.secondary }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: AppColors.secondaryBg }]}>
              <Ionicons name="flame" size={18} color={AppColors.secondary} />
            </View>
            <Text style={[styles.metricVal, { color: AppColors.secondary }]}>
              {summary.todaydemands}
            </Text>
            <Text style={styles.metricLabel}>Bugün Açılan</Text>
          </View>

          <View style={[styles.metricCard, { borderTopColor: AppColors.success }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: AppColors.successLight }]}>
              <Ionicons name="checkmark-done" size={18} color={AppColors.successDark} />
            </View>
            <Text style={[styles.metricVal, { color: AppColors.successDark }]}>
              {summary.matchedcount}
            </Text>
            <Text style={styles.metricLabel}>Eşleşen (Bende Var)</Text>
          </View>

          <View style={[styles.metricCard, { borderTopColor: AppColors.info }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: AppColors.infoLight }]}>
              <Ionicons name="time-outline" size={18} color={AppColors.info} />
            </View>
            <Text style={styles.metricVal}>
              {summary.avgresponsesec ? `${Math.round(summary.avgresponsesec / 60)} dk` : '-'}
            </Text>
            <Text style={styles.metricLabel}>Ort. Yanıt Süresi</Text>
          </View>

          <View style={[styles.metricCard, { borderTopColor: '#EC4899' }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="flash-outline" size={18} color="#DB2777" />
            </View>
            <Text style={[styles.metricVal, { color: '#DB2777' }]}>
              {summary.fastestresponsesec ? `${summary.fastestresponsesec} sn` : '-'}
            </Text>
            <Text style={styles.metricLabel}>En Hızlı Yanıt</Text>
          </View>

          <View style={[styles.metricCard, { borderTopColor: '#8B5CF6' }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="storefront-outline" size={18} color="#7C3AED" />
            </View>
            <Text style={styles.metricVal}>{summary.totalcompanies}</Text>
            <Text style={styles.metricLabel}>Kayıtlı Esnaf</Text>
          </View>

          <View style={[styles.metricCard, { borderTopColor: '#0EA5E9' }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="location-outline" size={18} color="#0284C7" />
            </View>
            <Text style={styles.metricVal}>{summary.activecitiescount}</Text>
            <Text style={styles.metricLabel}>Aktif Şehir</Text>
          </View>
        </ScrollView>
      )}

      {/* Öne Çıkan Esnaf Vitrini (Spotlight Companies) */}
      {companies.length > 0 && (
        <View style={styles.companiesSection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="ribbon-outline" size={18} color={AppColors.secondary} />
            <Text style={styles.sectionTitle}>Öne Çıkan Aktif Esnaflar</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.companiesScroll}
          >
            {companies.map((comp, idx) => (
              <View key={`${comp.name}_${idx}`} style={styles.companyCard}>
                <View style={styles.companyTopRow}>
                  <View style={styles.companyIconWrap}>
                    <Ionicons name="business" size={16} color={AppColors.primary} />
                  </View>
                  <View style={[styles.companyBadge, { backgroundColor: comp.highlightcolor || AppColors.successLight }]}>
                    <Text style={styles.companyBadgeText}>{comp.badgetext || 'Onaylı Esnaf'}</Text>
                  </View>
                </View>
                <Text style={styles.companyName} numberOfLines={1}>
                  {comp.name}
                </Text>
                <Text style={styles.companySub} numberOfLines={1}>
                  {comp.category || 'Sanayi & Ticaret'} {comp.city ? `• ${comp.city}` : ''}
                </Text>
                <View style={styles.companyStatsRow}>
                  <Ionicons name="checkmark-circle" size={14} color={AppColors.success} />
                  <Text style={styles.companyMatchCount}>
                    {comp.bendevarcount || 0} "Bende Var" Yanıtı
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Arama Kutusu */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={AppColors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Talep, parça, il veya esnaf ara..."
          placeholderTextColor={AppColors.textMuted}
          value={searchTerm}
          onChangeText={setSearchTerm}
          clearButtonMode="while-editing"
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={AppColors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Durum Filtre Butonları */}
      <View style={styles.statusFilterRow}>
        <TouchableOpacity
          style={[
            styles.statusFilterBtn,
            selectedStatus === 'all' && styles.statusFilterBtnActive,
          ]}
          onPress={() => setSelectedStatus('all')}
        >
          <Text
            style={[
              styles.statusFilterText,
              selectedStatus === 'all' && styles.statusFilterTextActive,
            ]}
          >
            Tüm Talepler ({data?.items?.length || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusFilterBtn,
            selectedStatus === 'matched' && [styles.statusFilterBtnActive, { backgroundColor: AppColors.success }],
          ]}
          onPress={() => setSelectedStatus('matched')}
        >
          <View style={styles.rowAlign}>
            <View style={[styles.miniDot, { backgroundColor: selectedStatus === 'matched' ? '#FFF' : AppColors.success }]} />
            <Text
              style={[
                styles.statusFilterText,
                selectedStatus === 'matched' && styles.statusFilterTextActive,
              ]}
            >
              Bende Var ({summary?.matchedcount || 0})
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusFilterBtn,
            selectedStatus === 'waiting' && [styles.statusFilterBtnActive, { backgroundColor: AppColors.warning }],
          ]}
          onPress={() => setSelectedStatus('waiting')}
        >
          <View style={styles.rowAlign}>
            <View style={[styles.miniDot, { backgroundColor: selectedStatus === 'waiting' ? '#FFF' : AppColors.warning }]} />
            <Text
              style={[
                styles.statusFilterText,
                selectedStatus === 'waiting' && styles.statusFilterTextActive,
              ]}
            >
              Yanıt Bekleyen
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Kategori Filtresi (Yatay Scroll) */}
      {categories.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                selectedCategory === cat && styles.chipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedCategory === cat && styles.chipTextActive,
                ]}
              >
                {cat === 'all' ? 'Tüm Sektörler' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Şehir Filtresi (Yatay Scroll) */}
      {cities.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {cities.map((city) => (
            <TouchableOpacity
              key={city}
              style={[
                styles.chip,
                selectedCity === city && styles.chipCityActive,
              ]}
              onPress={() => setSelectedCity(city)}
            >
              <Ionicons
                name="location"
                size={12}
                color={selectedCity === city ? '#FFF' : AppColors.textSecondary}
              />
              <Text
                style={[
                  styles.chipText,
                  selectedCity === city && styles.chipTextActive,
                ]}
              >
                {city === 'all' ? 'Tüm İller' : city}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Sonuç Sayacı */}
      <View style={styles.resultCounterRow}>
        <Text style={styles.resultCounterText}>
          Gösterilen Talep: <Text style={styles.resultCounterBold}>{filteredItems.length}</Text>
        </Text>
        <Text style={styles.terminalIndicator}>● CANLI AKIŞ</Text>
      </View>
    </View>
  );

  const renderDemandCard = ({ item }: { item: LiveTickerItemDto }) => {
    const isMatched = item.respondedcompanies > 0;
    const timeFormatted = formatRelativeTime(item.createtime);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isMatched ? styles.cardMatched : styles.cardWaiting,
        ]}
        onPress={() => handleOpenDetail(item)}
        activeOpacity={0.85}
      >
        {/* Sol Durum Gösterge Çizgisi */}
        <View
          style={[
            styles.statusIndicatorBar,
            { backgroundColor: isMatched ? AppColors.success : AppColors.warning },
          ]}
        />

        <View style={styles.cardContent}>
          {/* Üst Satır: Kategori, Şehir, Zaman */}
          <View style={styles.cardTopRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText} numberOfLines={1}>
                {item.categoryname || 'Genel Parça'}
              </Text>
            </View>

            {item.cityname ? (
              <View style={styles.locationBadge}>
                <Ionicons name="location-outline" size={12} color={AppColors.textSecondary} />
                <Text style={styles.locationBadgeText} numberOfLines={1}>
                  {item.cityname} {item.districtname ? `/ ${item.districtname}` : ''}
                </Text>
              </View>
            ) : null}

            <View style={styles.timeWrap}>
              <Ionicons name="time-outline" size={12} color={AppColors.textMuted} />
              <Text style={styles.timeText}>{timeFormatted}</Text>
            </View>
          </View>

          {/* Talep Açıklaması */}
          <Text style={styles.demandDesc} numberOfLines={2}>
            {item.description || 'Açıklama belirtilmemiş'}
          </Text>

          {/* Varsa Görsel / Kazanan Esnaf */}
          {item.winningcompanyname && (
            <View style={styles.winnerRow}>
              <Ionicons name="trophy" size={14} color="#D97706" />
              <Text style={styles.winnerText} numberOfLines={1}>
                Esnaf Yanıtı: <Text style={styles.winnerBold}>{item.winningcompanyname}</Text>
              </Text>
            </View>
          )}

          {/* Alt Metrikler */}
          <View style={styles.cardFooter}>
            <View style={styles.badgeRow}>
              {/* Esnaf Yanıt Durumu */}
              {isMatched ? (
                <View style={styles.matchedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={AppColors.successDark} />
                  <Text style={styles.matchedBadgeText}>
                    {item.respondedcompanies} Esnaf "Bende Var" Dedi
                  </Text>
                </View>
              ) : (
                <View style={styles.waitingBadge}>
                  <Ionicons name="hourglass-outline" size={13} color={AppColors.warningDark} />
                  <Text style={styles.waitingBadgeText}>
                    {item.reachedcompanies > 0
                      ? `${item.reachedcompanies} Esnafa İletildi`
                      : 'Esnaf Aranıyor'}
                  </Text>
                </View>
              )}

              {/* Yanıt Süresi (Varsa) */}
              {item.responsesec && item.responsesec > 0 ? (
                <View style={styles.speedBadge}>
                  <Ionicons name="flash" size={12} color="#DB2777" />
                  <Text style={styles.speedBadgeText}>
                    {formatResponseDuration(item.responsesec)}
                  </Text>
                </View>
              ) : null}

              {/* Görsel Simgesi */}
              {item.hasimage && (
                <View style={styles.hasImageBadge}>
                  <Ionicons name="image" size={13} color={AppColors.primaryDark} />
                  <Text style={styles.hasImageText}>Fotoğraflı</Text>
                </View>
              )}
            </View>

            <Ionicons name="chevron-forward" size={16} color={AppColors.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#D71920" size="large" />
          <Text style={styles.loadingText}>Canlı borsa ve talepler yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => `${item.createtime}_${index}`}
          renderItem={renderDemandCard}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchLiveTicker(false)}
              colors={['#D71920']}
              tintColor="#D71920"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={AppColors.textMuted} />
              <Text style={styles.emptyTitle}>Eşleşen Talep Bulunamadı</Text>
              <Text style={styles.emptySubtitle}>
                Arama kriterlerinizi değiştirerek veya filtreleri temizleyerek tekrar deneyebilirsiniz.
              </Text>
              {(searchTerm.length > 0 ||
                selectedStatus !== 'all' ||
                selectedCategory !== 'all' ||
                selectedCity !== 'all') && (
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  onPress={() => {
                    setSearchTerm('');
                    setSelectedStatus('all');
                    setSelectedCategory('all');
                    setSelectedCity('all');
                  }}
                >
                  <Text style={styles.resetFilterText}>Filtreleri Sıfırla</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* =================================================================== */}
      {/* TALEP DETAY MODALI (Modal Header Standardına Tam Uyumlu) */}
      {/* =================================================================== */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView
            style={styles.modalSafeArea}
            edges={['top', 'left', 'right', 'bottom']}
          >
            <View style={styles.modalContainer}>
              {/* Drag Handle */}
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>

              {/* Standart Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                  Talep Detayı
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setDetailModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="close" size={22} color={AppColors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Modal İçeriği */}
              {selectedItem && (
                <ScrollView
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Durum Rozeti Banner */}
                  <View
                    style={[
                      styles.modalStatusBanner,
                      selectedItem.respondedcompanies > 0
                        ? styles.modalStatusBannerSuccess
                        : styles.modalStatusBannerWarning,
                    ]}
                  >
                    <Ionicons
                      name={
                        selectedItem.respondedcompanies > 0
                          ? 'checkmark-circle'
                          : 'hourglass-outline'
                      }
                      size={20}
                      color={
                        selectedItem.respondedcompanies > 0
                          ? AppColors.successDark
                          : AppColors.warningDark
                      }
                    />
                    <View style={styles.modalStatusBannerTextWrap}>
                      <Text
                        style={[
                          styles.modalStatusBannerTitle,
                          {
                            color:
                              selectedItem.respondedcompanies > 0
                                ? AppColors.successDark
                                : AppColors.warningDark,
                          },
                        ]}
                      >
                        {selectedItem.respondedcompanies > 0
                          ? `Eşleşti (${selectedItem.respondedcompanies} Esnaf "Bende Var" Dedi)`
                          : 'Esnaf Yanıtı Bekleniyor'}
                      </Text>
                      <Text style={styles.modalStatusBannerDesc}>
                        {selectedItem.reachedcompanies > 0
                          ? `Bölgedeki ${selectedItem.reachedcompanies} yetkili esnafa anlık SignalR ile iletildi.`
                          : 'Bölgesel eşleştirme yapılıyor.'}
                      </Text>
                    </View>
                  </View>

                  {/* Kategori & Şehir Etiketleri */}
                  <View style={styles.modalBadgesRow}>
                    <View style={styles.modalBadge}>
                      <Ionicons name="pricetag-outline" size={14} color={AppColors.primary} />
                      <Text style={styles.modalBadgeText}>
                        {selectedItem.categoryname || 'Genel Parça'}
                      </Text>
                    </View>

                    {selectedItem.cityname && (
                      <View style={styles.modalBadge}>
                        <Ionicons name="location-outline" size={14} color={AppColors.secondary} />
                        <Text style={styles.modalBadgeText}>
                          {selectedItem.cityname}{' '}
                          {selectedItem.districtname ? `/ ${selectedItem.districtname}` : ''}
                        </Text>
                      </View>
                    )}

                    <View style={styles.modalBadge}>
                      <Ionicons name="time-outline" size={14} color={AppColors.textMuted} />
                      <Text style={styles.modalBadgeText}>
                        {formatRelativeTime(selectedItem.createtime)}
                      </Text>
                    </View>
                  </View>

                  {/* Açıklama Kartı */}
                  <View style={styles.modalSectionCard}>
                    <Text style={styles.modalSectionTitle}>Parça / Ürün Açıklaması</Text>
                    <Text style={styles.modalDescText}>
                      {selectedItem.description || 'Açıklama belirtilmemiş.'}
                    </Text>
                  </View>

                  {/* Talep Fotoğrafı (Varsa) */}
                  {selectedItem.firstimage ? (
                    <View style={styles.modalSectionCard}>
                      <Text style={styles.modalSectionTitle}>Talep Görseli</Text>
                      <Image
                        source={{ uri: selectedItem.firstimage }}
                        style={styles.modalImage}
                        resizeMode="cover"
                      />
                    </View>
                  ) : null}

                  {/* Yanıt Veren Esnaf Bilgisi */}
                  {selectedItem.winningcompanyname && (
                    <View style={[styles.modalSectionCard, { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }]}>
                      <View style={styles.rowAlign}>
                        <Ionicons name="trophy" size={20} color="#D97706" />
                        <Text style={[styles.modalSectionTitle, { color: '#B45309', marginLeft: 8 }]}>
                          Yanıt Veren Onaylı Esnaf
                        </Text>
                      </View>
                      <Text style={styles.modalWinnerText}>
                        {selectedItem.winningcompanyname}
                      </Text>
                      {selectedItem.responsesec && selectedItem.responsesec > 0 ? (
                        <Text style={styles.modalWinnerSpeed}>
                          ⚡ Yanıt Süresi: {formatResponseDuration(selectedItem.responsesec)}
                        </Text>
                      ) : null}
                    </View>
                  )}

                  {/* İstatistikler */}
                  <View style={styles.modalStatsGrid}>
                    <View style={styles.modalStatItem}>
                      <Text style={styles.modalStatNum}>{selectedItem.reachedcompanies || 0}</Text>
                      <Text style={styles.modalStatLabel}>İletilen Esnaf</Text>
                    </View>
                    <View style={styles.modalStatItem}>
                      <Text style={[styles.modalStatNum, { color: AppColors.success }]}>
                        {selectedItem.respondedcompanies || 0}
                      </Text>
                      <Text style={styles.modalStatLabel}>"Bende Var" Yanıtı</Text>
                    </View>
                    <View style={styles.modalStatItem}>
                      <Text style={[styles.modalStatNum, { color: AppColors.info }]}>
                        {selectedItem.responsesec ? formatResponseDuration(selectedItem.responsesec) : '-'}
                      </Text>
                      <Text style={styles.modalStatLabel}>İlk Yanıt Süresi</Text>
                    </View>
                  </View>
                </ScrollView>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 32,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  liveSignalWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  livePulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  liveTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: 0.5,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.2)',
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.accent,
    marginLeft: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(215, 25, 32, 0.08)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(215, 25, 32, 0.15)',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },
  metricsScroll: {
    paddingVertical: 4,
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    width: 110,
    backgroundColor: AppColors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderTopWidth: 3,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricVal: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: AppColors.textMuted,
    textAlign: 'center',
  },
  companiesSection: {
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginLeft: 6,
  },
  companiesScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  companyCard: {
    width: 170,
    backgroundColor: AppColors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  companyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  companyIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: AppColors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  companyBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065F46',
  },
  companyName: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  companySub: {
    fontSize: 11,
    color: AppColors.textMuted,
    marginBottom: 6,
  },
  companyStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyMatchCount: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.successDark,
    marginLeft: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: AppColors.textPrimary,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  statusFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  statusFilterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusFilterBtnActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  statusFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  statusFilterTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipsScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
    gap: 4,
  },
  chipActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  chipCityActive: {
    backgroundColor: AppColors.secondary,
    borderColor: AppColors.secondary,
  },
  chipText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  resultCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  resultCounterText: {
    fontSize: 12,
    color: AppColors.textMuted,
  },
  resultCounterBold: {
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  terminalIndicator: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.success,
    letterSpacing: 0.5,
  },

  // Talep Kartı Stilleri
  card: {
    flexDirection: 'row',
    backgroundColor: AppColors.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardMatched: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  cardWaiting: {
    borderColor: AppColors.border,
  },
  statusIndicatorBar: {
    width: 5,
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: AppColors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 120,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.primaryDark,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    maxWidth: 130,
  },
  locationBadgeText: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 3,
  },
  timeText: {
    fontSize: 11,
    color: AppColors.textMuted,
  },
  demandDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
  },
  winnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    gap: 4,
  },
  winnerText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
  },
  winnerBold: {
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  matchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  matchedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.successDark,
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  waitingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.warningDark,
  },
  speedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  speedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#BE185D',
  },
  hasImageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  hasImageText: {
    fontSize: 10,
    fontWeight: '600',
    color: AppColors.primaryDark,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: AppColors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetFilterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: AppColors.primary,
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },

  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSafeArea: {
    backgroundColor: AppColors.surface,
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: AppColors.surface,
    maxHeight: '90%',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: AppColors.surface,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: AppColors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    flex: 1,
    textAlign: 'left',
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: AppColors.background,
  },
  modalScroll: {
    maxHeight: 550,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  modalStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  modalStatusBannerSuccess: {
    backgroundColor: AppColors.successLight,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  modalStatusBannerWarning: {
    backgroundColor: AppColors.warningLight,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  modalStatusBannerTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  modalStatusBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalStatusBannerDesc: {
    fontSize: 11,
    color: AppColors.textSecondary,
    lineHeight: 16,
  },
  modalBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    gap: 4,
  },
  modalBadgeText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  modalSectionCard: {
    backgroundColor: AppColors.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 14,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalDescText: {
    fontSize: 14,
    color: AppColors.textPrimary,
    lineHeight: 22,
    fontWeight: '500',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 6,
  },
  modalWinnerText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    marginTop: 4,
  },
  modalWinnerSpeed: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    marginTop: 4,
  },
  modalStatsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  modalStatItem: {
    flex: 1,
    backgroundColor: AppColors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
  },
  modalStatNum: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  modalStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: AppColors.textMuted,
    textAlign: 'center',
  },
});
