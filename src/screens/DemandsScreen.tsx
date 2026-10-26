import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AppColors } from '../constants/theme';
import { serviceAdmin } from '../services/serviceAdmin';
import { serviceStorage } from '../services/serviceStorage';
import {
  DemandItem,
  CompanyItem,
  CategoryItem,
  DemandStatus,
  DemandTargetMode,
  DemandSearchStep,
  DemandCompanyResponseStatus,
  UserItem,
  UserStatus,
} from '../types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { AppLogo } from '../components/AppLogo';
import { CITIES, DISTRICTS } from '../constants/staticData';

type DemandGroup = 'current' | 'closed' | 'rejected';
const PAGE_SIZE = 50;
const GROUP_STATUSES: Record<DemandGroup, number[]> = {
  current: [0, 1],
  closed: [2, 3],
  rejected: [4],
};

export const DemandsScreen: React.FC = () => {
  const [demands, setDemands] = useState<DemandItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'closed' | 'rejected'>('all');
  const [baseUrl, setBaseUrl] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadedGroups, setLoadedGroups] = useState<Record<DemandGroup, boolean>>({
    current: false,
    closed: false,
    rejected: false,
  });
  const [hasMore, setHasMore] = useState<Record<DemandGroup, boolean>>({
    current: false,
    closed: false,
    rejected: false,
  });

  // Detay Modalı
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<DemandItem | null>(null);

  // Müşteri Detayı Modalı
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<UserItem | null>(null);
  const [customerDemand, setCustomerDemand] = useState<DemandItem | null>(null);
  const [customerActionLoading, setCustomerActionLoading] = useState(false);

  // Yanıt Veren Firmalar Modalı
  const [companiesModalVisible, setCompaniesModalVisible] = useState(false);
  const [demandCompanies, setDemandCompanies] = useState<CompanyItem[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  // Reddetme Modalı
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('Talep içeriği uygun görülmedi');

  // Fotoğraf Büyütme Modalı
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const formatLocation = (
    city?: string,
    district?: string,
    cityid?: number | string,
    districtid?: number | string
  ): string | null => {
    let c = city && city !== '-' && city.trim() ? city.trim() : null;
    let d = district && district !== '-' && district.trim() ? district.trim() : null;

    if (!c && cityid !== undefined && cityid !== null && cityid !== '') {
      const foundCity = CITIES.find((item) => Number(item.id) === Number(cityid));
      if (foundCity) {
        c = foundCity.name;
      }
    }

    if (!d && districtid !== undefined && districtid !== null && districtid !== '') {
      const foundDistrict = DISTRICTS.find((item) => Number(item.id) === Number(districtid));
      if (foundDistrict) {
        d = foundDistrict.name;
        if (!c && foundDistrict.cityid) {
          const foundCity = CITIES.find((item) => Number(item.id) === Number(foundDistrict.cityid));
          if (foundCity) {
            c = foundCity.name;
          }
        }
      }
    }

    if (c && d) return `${c} / ${d}`;
    if (c) return c;
    if (d) return d;
    return null;
  };


  const formatDateTime = (dateStr?: string | number) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateStr);
    }
  };

  const getGroupOf = (status?: number | string): DemandGroup | null => {
    const s = Number(status);
    if (s === 0 || s === 1) return 'current';
    if (s === 2 || s === 3) return 'closed';
    if (s === 4) return 'rejected';
    return null;
  };

  const currentGroup: DemandGroup =
    filter === 'closed' ? 'closed' : filter === 'rejected' ? 'rejected' : 'current';

  // Sekmeye ait talepleri sunucudan (durum filtreli, 50'şerli) çeker. Firma sayısı liste sorgusuyla birlikte gelir.
  const loadGroup = async (group: DemandGroup, refresh: boolean = false, more: boolean = false) => {
    if (more) setLoadingMore(true);
    else setLoading(true);
    try {
      const offset = more ? demands.filter((d) => getGroupOf(d.status) === group).length : 0;
      const res = await serviceAdmin.getDemandList([], false, {
        statuses: GROUP_STATUSES[group],
        limit: PAGE_SIZE,
        offset,
      });
      const list = res.value || res.data || (res as any).Data || (res as any).Value;
      if (res.resulttype == 1 && Array.isArray(list)) {
        const groupItems = (list as DemandItem[]).filter((d) => getGroupOf(d.status) === group);
        let addedCount = groupItems.length;
        setDemands((prev) => {
          const base = refresh ? prev.filter((d) => getGroupOf(d.status) !== group) : prev;
          const existing = new Set(base.map((d) => String(d.id)));
          const fresh = groupItems.filter((d) => !existing.has(String(d.id)));
          if (more) addedCount = fresh.length;
          return [...base, ...fresh];
        });
        setHasMore((prev) => ({ ...prev, [group]: list.length >= PAGE_SIZE && addedCount > 0 }));
        setLoadedGroups((prev) => ({ ...prev, [group]: true }));
      }
    } catch {
      Alert.alert('Hata', 'Talepler listesi alınamadı.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const selectFilter = (f: 'all' | 'active' | 'pending' | 'closed' | 'rejected') => {
    setFilter(f);
    const group: DemandGroup = f === 'closed' ? 'closed' : f === 'rejected' ? 'rejected' : 'current';
    if (!loadedGroups[group]) {
      loadGroup(group);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const bUrl = await serviceStorage.getBaseUrl();
      setBaseUrl(bUrl);

      const catsRes = await serviceAdmin.getCategoryList();
      const cList = catsRes.value || catsRes.data || (catsRes as any).Data || (catsRes as any).Value;
      if (catsRes.resulttype == 1 && Array.isArray(cList)) {
        setCategories(cList);
      }
    } catch {
      // ignore
    }
    await loadGroup('current', true);
  };

  const openCustomerDetail = async (demand: DemandItem) => {
    setCustomerDemand(demand);
    let found = users.find(
      (u) =>
        (demand.userid && String(u.id) === String(demand.userid)) ||
        (demand.username && String(u.username).toLowerCase() === String(demand.username).toLowerCase())
    );

    if (!found) {
      try {
        const res = await serviceAdmin.getUserList();
        const list = res.value || res.data || (res as any).Data || (res as any).Value;
        if (res.resulttype == 1 && Array.isArray(list)) {
          setUsers(list);
          found = list.find(
            (u) =>
              (demand.userid && String(u.id) === String(demand.userid)) ||
              (demand.username && String(u.username).toLowerCase() === String(demand.username).toLowerCase())
          );
        }
      } catch {
        // ignore
      }
    }

    const effectiveUser: UserItem = found || {
      id: demand.userid || 0,
      username: demand.username || (demand.userid ? `user_${demand.userid}` : 'kullanici'),
      displayname: demand.userdisplayname || demand.userfullname || demand.username,
      phone: demand.userphone,
      status: UserStatus.Active,
    };

    setSelectedCustomer(effectiveUser);
    setCustomerModalVisible(true);
  };

  const handleToggleCustomerStatus = async () => {
    if (!selectedCustomer) return;
    const isCurrentlyActive = selectedCustomer.status == UserStatus.Active;
    const newStatus = isCurrentlyActive ? UserStatus.Passive : UserStatus.Active;
    const title = isCurrentlyActive ? 'Müşteriyi Pasife Al' : 'Müşteriyi Aktifleştir';

    Alert.alert(
      title,
      `"${selectedCustomer.displayname || selectedCustomer.username}" müşterisinin durumunu değiştirmek istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Evet, Değiştir',
          onPress: async () => {
            setCustomerActionLoading(true);
            try {
              const res = await serviceAdmin.updateUserStatus({
                id: selectedCustomer.id,
                status: newStatus,
              });
              if (res.resulttype == 1) {
                Alert.alert('Başarılı', 'Müşteri durumu güncellendi.');
              } else {
                Alert.alert('Bilgi', res.message || 'Müşteri durumu güncellendi.');
              }
              setSelectedCustomer((prev) => (prev ? { ...prev, status: newStatus } : null));
              setUsers((prev) =>
                prev.map((u) => (u.id === selectedCustomer.id ? { ...u, status: newStatus } : u))
              );
            } catch {
              Alert.alert('Hata', 'Müşteri durumu güncellenirken sorun oluştu.');
            } finally {
              setCustomerActionLoading(false);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  const parseImageUrls = (imagesStr?: string): string[] => {
    if (!imagesStr) return [];
    let urls: string[] = [];
    try {
      const parsed = JSON.parse(imagesStr);
      if (Array.isArray(parsed)) {
        urls = parsed.map((x) => String(x).trim()).filter(Boolean);
      }
    } catch {
      urls = imagesStr.split(',').map((x) => x.trim()).filter(Boolean);
    }

    return urls.map((u) => {
      if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')) {
        return u;
      }
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const cleanPath = u.startsWith('/') ? u : `/${u}`;
      return `${cleanBase}${cleanPath}`;
    });
  };

  const getCategoryName = (item: DemandItem) => {
    if (item.categoryname) return item.categoryname;
    if (item.categoryids && categories.length > 0) {
      const ids = String(item.categoryids).split(',');
      const found = categories.find((c) => ids.includes(String(c.id)));
      if (found) return found.categoryname || found.name;
    }
    if (item.categoryid && categories.length > 0) {
      const found = categories.find((c) => String(c.id) === String(item.categoryid));
      if (found) return found.categoryname || found.name;
    }
    return 'Genel Kategori';
  };

  const getTargetModeLabel = (mode?: number | string, locText?: string | null) => {
    const m = Number(mode);
    if (m === DemandTargetMode.SmartRadius) return 'Akıllı Çap';
    if (m === DemandTargetMode.FixedRadius) return 'Sabit Çap';
    if (m === DemandTargetMode.CityDistrict) {
      return locText ? `İl / İlçe (${locText})` : 'İl / İlçe';
    }
    if (m === DemandTargetMode.Favorites) return 'Favori Firmalar';
    return null;
  };

  const getSearchStepLabel = (step?: number | string) => {
    const s = Number(step);
    if (s === DemandSearchStep.RadiusKm) return '1. Adım (Çap Taraması)';
    if (s === DemandSearchStep.District) return '2. Adım (İlçe Taraması)';
    if (s === DemandSearchStep.City) return '3. Adım (İl Taraması)';
    if (s === DemandSearchStep.AllCategory) return '4. Adım (Tüm Kategori)';
    if (s === DemandSearchStep.Stopped) return 'Arama Durduruldu';
    if (s === DemandSearchStep.Completed) return 'Tamamlandı';
    return null;
  };

  const handleApprove = async (id: number | string) => {
    Alert.alert('Onay', 'Bu talebi onaylayıp yayına almak istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Onayla',
        onPress: async () => {
          const res = await serviceAdmin.approveDemand(id);
          if (res.resulttype == 1) {
            Alert.alert('Başarılı', 'Talep onaylandı ve esnaflara dağıtıldı.');
            setDemands((prev) =>
              prev.map((d) => (d.id === id ? { ...d, status: DemandStatus.Active } : d))
            );
            if (selectedDemand?.id === id) {
              setSelectedDemand((prev) => (prev ? { ...prev, status: DemandStatus.Active } : null));
            }
          } else {
            const msg = res.description || res.Description || res.message || 'Talep onaylanamadı.';
            Alert.alert('Hata', msg);
          }
        },
      },
    ]);
  };

  const openRejectModal = (d: DemandItem) => {
    setSelectedDemand(d);
    setRejectReason('Talep içeriği uygun görülmedi');
    setRejectModalVisible(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedDemand) return;
    try {
      const res = await serviceAdmin.rejectDemand(selectedDemand.id, rejectReason.trim());
      if (res.resulttype == 1) {
        Alert.alert('Başarılı', 'Talep reddedildi.');
        setDemands((prev) =>
          prev.map((d) =>
            d.id === selectedDemand.id
              ? { ...d, status: DemandStatus.Rejected, rejectdescription: rejectReason.trim() }
              : d
          )
        );
        if (selectedDemand) {
          setSelectedDemand({
            ...selectedDemand,
            status: DemandStatus.Rejected,
            rejectdescription: rejectReason.trim(),
          });
        }
        setRejectModalVisible(false);
      } else {
        const msg = res.description || res.Description || res.message || 'Talep reddedilemedi.';
        Alert.alert('Hata', msg);
      }
    } catch {
      Alert.alert('Hata', 'Talep reddedilirken hata oluştu.');
    }
  };

  const handleDelete = (d: DemandItem) => {
    Alert.alert('Silme Onayı', 'Bu talebi kalıcı olarak silmek istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const res = await serviceAdmin.deleteDemand(d.id);
          if (res.resulttype == 1) {
            Alert.alert('Başarılı', 'Talep silindi.');
            setDemands((prev) => prev.filter((item) => item.id !== d.id));
            if (detailModalVisible && selectedDemand?.id === d.id) {
              setDetailModalVisible(false);
            }
          } else {
            const msg = res.description || res.Description || res.message || 'Talep silinemedi.';
            Alert.alert('Hata', msg);
          }
        },
      },
    ]);
  };

  const openCompaniesModal = async (d: DemandItem) => {
    setSelectedDemand(d);
    setCompaniesModalVisible(true);
    setCompaniesLoading(true);
    try {
      const res = await serviceAdmin.getDemandCompanies(d.id);
      const list = res.value || res.data || (res as any).Data || (res as any).Value;
      if (res.resulttype == 1 && Array.isArray(list)) {
        setDemandCompanies(list);
        const varCount = list.filter(
          (c: any) => Number(c.responsestatus) === DemandCompanyResponseStatus.Accepted
        ).length;
        const yokCount = list.filter(
          (c: any) => Number(c.responsestatus) === DemandCompanyResponseStatus.Rejected
        ).length;
        setDemands((prev) =>
          prev.map((item) =>
            String(item.id) === String(d.id)
              ? { ...item, respondedcount: list.length, bendevarcount: varCount, bendeyokcount: yokCount }
              : item
          )
        );
        setSelectedDemand((prev) =>
          prev && String(prev.id) === String(d.id)
            ? { ...prev, respondedcount: list.length, bendevarcount: varCount, bendeyokcount: yokCount }
            : prev
        );
      } else {
        setDemandCompanies([]);
      }
    } catch {
      Alert.alert('Hata', 'Yanıt veren firmalar yüklenemedi.');
      setDemandCompanies([]);
    } finally {
      setCompaniesLoading(false);
    }
  };

  const openDetailModal = (d: DemandItem) => {
    setSelectedDemand(d);
    setDetailModalVisible(true);
  };

  const openPhotoViewer = (url: string) => {
    setActivePhotoUrl(url);
    setPhotoViewerVisible(true);
  };

  // Sayım istatistikleri
  const countAll = demands.length;
  const countActive = demands.filter((d) => d.status == DemandStatus.Active).length;
  const countPending = demands.filter((d) => d.status == DemandStatus.Pending).length;
  const countClosed = demands.filter((d) => d.status == DemandStatus.Closed || d.status == DemandStatus.Expired).length;
  const countRejected = demands.filter((d) => d.status == DemandStatus.Rejected || d.status == 3).length;

  const filtered = demands.filter((d) => {
    let matchesFilter = true;
    if (filter === 'active') matchesFilter = d.status == DemandStatus.Active;
    else if (filter === 'pending') matchesFilter = d.status == DemandStatus.Pending;
    else if (filter === 'closed') matchesFilter = d.status == DemandStatus.Closed || d.status == DemandStatus.Expired;
    else if (filter === 'rejected') matchesFilter = d.status == DemandStatus.Rejected || d.status == 3;

    const term = search.toLowerCase();
    const desc = (d.description || '').toLowerCase();
    const cat = (getCategoryName(d) || '').toLowerCase();
    const user = (d.userfullname || d.userdisplayname || d.username || '').toLowerCase();
    const city = (d.city || '').toLowerCase();
    const district = (d.district || '').toLowerCase();
    const loc = (formatLocation(d.city, d.district, d.cityid, d.districtid) || '').toLowerCase();
    const matchesSearch =
      desc.includes(term) ||
      cat.includes(term) ||
      user.includes(term) ||
      city.includes(term) ||
      district.includes(term) ||
      loc.includes(term);

    return matchesFilter && matchesSearch;
  });

  const renderItem = ({ item }: { item: DemandItem }) => {
    const isPending = item.status == DemandStatus.Pending;
    const isActive = item.status == DemandStatus.Active;
    const isClosed = item.status == DemandStatus.Closed || item.status == DemandStatus.Expired;
    const isRejected = item.status == DemandStatus.Rejected || item.status == 3;

    const catName = getCategoryName(item);
    const images = parseImageUrls(item.images);
    const locationText = formatLocation(item.city, item.district, item.cityid, item.districtid);
    const isCityDistrictMode = Number(item.targetmode) === DemandTargetMode.CityDistrict;
    const targetModeText = getTargetModeLabel(item.targetmode, locationText);
    const searchStepText = getSearchStepLabel(item.searchstep);

    return (
      <View style={styles.card}>
        {/* Üst Rozetler Satırı */}
        <View style={styles.headerRow}>
          <View style={styles.categoryBadge}>
            <Ionicons name="pricetag-outline" size={12} color={AppColors.accent} />
            <Text style={styles.categoryBadgeText} numberOfLines={1}>{catName}</Text>
          </View>

          <View style={styles.badgeGroup}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isPending
                    ? '#fef3c7'
                    : isActive
                    ? '#dcfce7'
                    : isClosed
                    ? '#f1f5f9'
                    : '#fee2e2',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color: isPending
                      ? '#92400e'
                      : isActive
                      ? '#166534'
                      : isClosed
                      ? '#475569'
                      : '#991b1b',
                  },
                ]}
              >
                {isPending
                  ? 'Onay Bekliyor'
                  : isActive
                  ? 'Aktif (Yayında)'
                  : isClosed
                  ? 'Kapandı / Bulundu'
                  : 'Reddedildi'}
              </Text>
            </View>
          </View>
        </View>

        {/* Talep Açıklaması */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => openDetailModal(item)}>
          <Text style={styles.description} numberOfLines={3}>
            {item.description}
          </Text>
        </TouchableOpacity>

        {/* Fotoğraf Önizlemeleri */}
        {images.length > 0 && (
          <View style={styles.imageThumbRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((imgUrl, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => openPhotoViewer(imgUrl)}
                  style={styles.thumbWrapper}
                >
                  <Image source={{ uri: imgUrl }} style={styles.thumbImage} />
                  <View style={styles.thumbZoomIcon}>
                    <Ionicons name="search" size={10} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.imageCountBadge}>
              <Ionicons name="images-outline" size={11} color={AppColors.textSecondary} />
              <Text style={styles.imageCountText}>{images.length} Fotoğraf</Text>
            </View>
          </View>
        )}

        {/* Reddedilme Gerekçesi (Varsa) */}
        {isRejected && !!item.rejectdescription?.trim() && (
          <View style={styles.rejectNoteBox}>
            <Ionicons name="alert-circle" size={14} color="#991b1b" />
            <Text style={styles.rejectNoteText} numberOfLines={2}>
              Gerekçe: {item.rejectdescription}
            </Text>
          </View>
        )}

        {/* Hedefleme ve Arama Adımı Rozetleri */}
        {(targetModeText || searchStepText) && (
          <View style={styles.stepRow}>
            {targetModeText && (
              <View
                style={[
                  styles.stepBadge,
                  isCityDistrictMode && { backgroundColor: '#fef3c7', borderColor: '#fde68a', borderWidth: 1 },
                ]}
              >
                <Ionicons
                  name={isCityDistrictMode ? 'business' : 'locate-outline'}
                  size={11}
                  color={isCityDistrictMode ? '#92400e' : '#475569'}
                />
                <Text
                  style={[
                    styles.stepBadgeText,
                    isCityDistrictMode && { color: '#92400e', fontWeight: 'bold' },
                  ]}
                >
                  {targetModeText}
                </Text>
              </View>
            )}
            {searchStepText && (
              <View style={[styles.stepBadge, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="git-network-outline" size={11} color="#1d4ed8" />
                <Text style={[styles.stepBadgeText, { color: '#1d4ed8' }]}>{searchStepText}</Text>
              </View>
            )}
          </View>
        )}

        {/* Konum, Müşteri ve Tarih */}
        <View style={styles.metaRow}>
          {!!locationText && (
            <Text style={[styles.metaItem, isCityDistrictMode && { color: '#b45309', fontWeight: '600' }]}>
              <Ionicons
                name="location-outline"
                size={13}
                color={isCityDistrictMode ? '#b45309' : AppColors.accent}
              />{' '}
              {locationText}
            </Text>
          )}

          {/* Müşteri Butonu (Tıklanabilir) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => openCustomerDetail(item)}
            style={styles.customerMetaTouch}
          >
            <Ionicons name="person-circle-outline" size={15} color={AppColors.accent} />
            <Text style={styles.customerMetaText} numberOfLines={1}>
              {item.userdisplayname || item.userfullname || item.username || (item.userid ? `#${item.userid}` : 'Müşteri')}
            </Text>
            <Ionicons name="chevron-forward" size={11} color={AppColors.accent} style={{ opacity: 0.6 }} />
          </TouchableOpacity>

          {item.createtime ? (
            <Text style={styles.metaItemDate}>
              <Ionicons name="time-outline" size={12} color={AppColors.textMuted} />{' '}
              {new Date(item.createtime).toLocaleDateString('tr-TR')}
            </Text>
          ) : null}
        </View>

        {/* Alt Aksiyon Butonları */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.responseCountBtn}
            onPress={() => openCompaniesModal(item)}
            activeOpacity={0.7}
          >
            <View style={styles.responsePillItem}>
              <Ionicons name="business-outline" size={12} color={AppColors.textSecondary} />
              <Text style={styles.responsePillText}>
                {item.respondedcount ?? 0}
              </Text>
            </View>
            <View style={[styles.responsePillBadge, styles.responsePillBadgeVar]}>
              <Ionicons name="checkmark" size={11} color="#166534" />
              <Text style={styles.responsePillBadgeTextVar}>
                {item.bendevarcount ?? 0}
              </Text>
            </View>
            <View style={[styles.responsePillBadge, styles.responsePillBadgeYok]}>
              <Ionicons name="close" size={11} color="#991b1b" />
              <Text style={styles.responsePillBadgeTextYok}>
                {item.bendeyokcount ?? 0}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.actionBtnGroup}>
            <TouchableOpacity
              style={[styles.smallBtn, styles.detailBtn]}
              onPress={() => openDetailModal(item)}
            >
              <Text style={styles.detailBtnText}>Detay</Text>
            </TouchableOpacity>

            {isPending && (
              <>
                <TouchableOpacity
                  style={[styles.smallBtn, styles.approveBtn]}
                  onPress={() => handleApprove(item.id)}
                >
                  <Text style={styles.smallBtnText}>Onayla</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallBtn, styles.rejectBtn]}
                  onPress={() => openRejectModal(item)}
                >
                  <Text style={styles.smallBtnText}>Reddet</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={[styles.smallBtn, styles.deleteBtn]}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash-outline" size={14} color={AppColors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Arama Çubuğu */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={AppColors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Talep açıklaması, kullanıcı, kategori veya il/ilçe ara..."
          placeholderTextColor={AppColors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filtre Sekmeleri */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => selectFilter('all')}
          >
            <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
              Tümü ({countAll})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'active' && styles.filterChipActive]}
            onPress={() => selectFilter('active')}
          >
            <Text style={[styles.filterChipText, filter === 'active' && styles.filterChipTextActive]}>
              Aktif ({countActive})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'pending' && styles.filterChipActive]}
            onPress={() => selectFilter('pending')}
          >
            <Text style={[styles.filterChipText, filter === 'pending' && styles.filterChipTextActive]}>
              Onay Bekleyen ({countPending})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'closed' && styles.filterChipActive]}
            onPress={() => selectFilter('closed')}
          >
            <Text style={[styles.filterChipText, filter === 'closed' && styles.filterChipTextActive]}>
              Kapandı{loadedGroups.closed ? ` (${countClosed}${hasMore.closed ? '+' : ''})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'rejected' && styles.filterChipActive]}
            onPress={() => selectFilter('rejected')}
          >
            <Text style={[styles.filterChipText, filter === 'rejected' && styles.filterChipTextActive]}>
              Reddedilen{loadedGroups.rejected ? ` (${countRejected}${hasMore.rejected ? '+' : ''})` : ''}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color="#D71920" size="small" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={() => loadGroup(currentGroup, true)}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppLogo size={56} style={{ opacity: 0.35, marginBottom: 8 }} />
              <Text style={styles.emptyText}>Aranan kriterlere uygun talep bulunamadı.</Text>
            </View>
          }
          ListFooterComponent={
            hasMore[currentGroup] ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => loadGroup(currentGroup, false, true)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator color="#D71920" size="small" />
                ) : (
                  <>
                    <Ionicons name="chevron-down" size={16} color={AppColors.accent} />
                    <Text style={styles.loadMoreText}>Daha Fazla Yükle</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : undefined
          }
        />
      )}

      {/* Modal Header Standardı ile Talep Detay Modalı */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>

              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>
                  Talep Detayı #{selectedDemand?.id}
                </Text>
                <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeButton}>
                  <MaterialIcons name="close" size={22} color={AppColors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                {selectedDemand && (() => {
                  const selectedLoc = formatLocation(
                    selectedDemand.city,
                    selectedDemand.district,
                    selectedDemand.cityid,
                    selectedDemand.districtid
                  );
                  const isSelectedCityDistrict = Number(selectedDemand.targetmode) === DemandTargetMode.CityDistrict;

                  return (
                    <>
                      {/* Durum ve Öncelik */}
                      <View style={styles.detailSection}>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>{getCategoryName(selectedDemand)}</Text>
                          </View>
                          {isSelectedCityDistrict && (
                            <View style={[styles.statusBadge, { backgroundColor: '#fef3c7', borderColor: '#fde68a', borderWidth: 1 }]}>
                              <Text style={[styles.statusBadgeText, { color: '#92400e', fontWeight: 'bold' }]}>
                                📍 {selectedLoc ? `Hedef: ${selectedLoc}` : 'Hedef: İl / İlçe'}
                              </Text>
                            </View>
                          )}
                          {(selectedDemand.status == DemandStatus.Rejected || selectedDemand.status == 4 || selectedDemand.status == 3) && (
                            <View style={[styles.statusBadge, { backgroundColor: '#fee2e2' }]}>
                              <Text style={[styles.statusBadgeText, { color: '#991b1b' }]}>Reddedildi</Text>
                            </View>
                          )}
                          {selectedDemand.status == DemandStatus.Active && (
                            <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
                              <Text style={[styles.statusBadgeText, { color: '#166534' }]}>Aktif (Yayında)</Text>
                            </View>
                          )}
                          {selectedDemand.status == DemandStatus.Pending && (
                            <View style={[styles.statusBadge, { backgroundColor: '#fef3c7' }]}>
                              <Text style={[styles.statusBadgeText, { color: '#92400e' }]}>Onay Bekliyor</Text>
                            </View>
                          )}
                          {(selectedDemand.status == DemandStatus.Closed || selectedDemand.status == DemandStatus.Expired) && (
                            <View style={[styles.statusBadge, { backgroundColor: '#f1f5f9' }]}>
                              <Text style={[styles.statusBadgeText, { color: '#475569' }]}>Kapandı / Süresi Doldu</Text>
                            </View>
                          )}
                        </View>

                        {/* İl / İlçe Hedefleme Bilgilendirme Kutusu */}
                        {isSelectedCityDistrict && (
                          <View style={[styles.infoBox, { backgroundColor: '#fffbeb', borderColor: '#fef08a', borderWidth: 1, marginBottom: 12, padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                            <Ionicons name="location" size={20} color="#b45309" />
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#92400e' }}>
                                İl / İlçe Hedefli Talep
                              </Text>
                              <Text style={{ fontSize: 12, color: '#b45309', marginTop: 1 }}>
                                Bu talep yalnızca <Text style={{ fontWeight: 'bold' }}>{selectedLoc || 'belirtilen il/ilçe'}</Text> bölgesindeki esnaflara iletilmektedir.
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* Reddetme Bildirimi ve Gerekçesi Banner'ı */}
                        {(selectedDemand.status == DemandStatus.Rejected || selectedDemand.status == 4 || selectedDemand.status == 3) && (
                          <View style={styles.detailRejectBanner}>
                            <View style={styles.detailRejectHeader}>
                              <Ionicons name="alert-circle" size={18} color="#991b1b" />
                              <Text style={styles.detailRejectTitle}>Bu Talep Reddedildi</Text>
                            </View>
                            <Text style={styles.detailRejectDesc}>
                              {selectedDemand.rejectdescription?.trim()
                                ? `Gerekçe: ${selectedDemand.rejectdescription.trim()}`
                                : 'Talep yönetici tarafından onaylanmayarak reddedilmiştir.'}
                            </Text>
                          </View>
                        )}

                        <Text style={styles.detailDescTitle}>TALEP AÇIKLAMASI</Text>
                        <Text style={styles.detailDesc}>{selectedDemand.description}</Text>
                      </View>

                      {/* Fotoğraflar */}
                      {parseImageUrls(selectedDemand.images).length > 0 && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>
                            TALEP FOTOĞRAFLARI ({parseImageUrls(selectedDemand.images).length})
                          </Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                            {parseImageUrls(selectedDemand.images).map((imgUrl, i) => (
                              <TouchableOpacity
                                key={i}
                                onPress={() => openPhotoViewer(imgUrl)}
                                style={styles.detailThumbWrap}
                              >
                                <Image source={{ uri: imgUrl }} style={styles.detailThumbImage} />
                                <View style={styles.thumbZoomIcon}>
                                  <Ionicons name="search" size={12} color="#fff" />
                                </View>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                      {/* Bilgi Grid */}
                      <View style={styles.detailGrid}>
                        {/* Müşteri / Kullanıcı Kartı (Tıklanabilir) */}
                        <TouchableOpacity
                          style={[styles.gridItem, styles.customerGridItem]}
                          activeOpacity={0.7}
                          onPress={() => openCustomerDetail(selectedDemand)}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Text style={[styles.gridLabel, { color: AppColors.accent, fontWeight: '700' }]}>
                              Müşteri Profil Detayı
                            </Text>
                            <Ionicons name="open-outline" size={14} color={AppColors.accent} />
                          </View>
                          <Text style={[styles.gridVal, { color: AppColors.accent, fontWeight: 'bold' }]}>
                            {selectedDemand.userdisplayname || selectedDemand.userfullname || selectedDemand.username || `#${selectedDemand.userid}`}
                          </Text>
                          <Text style={styles.gridTouchHint}>Müşteri detayını incele ➔</Text>
                        </TouchableOpacity>

                        {/* İl / İlçe Bilgisi */}
                        {!!selectedLoc && (
                          <View
                            style={[
                              styles.gridItem,
                              isSelectedCityDistrict && {
                                backgroundColor: '#fef3c7',
                                borderColor: '#fde68a',
                                borderWidth: 1,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.gridLabel,
                                isSelectedCityDistrict && { color: '#92400e', fontWeight: 'bold' },
                              ]}
                            >
                              {isSelectedCityDistrict ? '🎯 Hedef İl / İlçe' : 'Konum (İl / İlçe)'}
                            </Text>
                            <Text
                              style={[
                                styles.gridVal,
                                isSelectedCityDistrict && { color: '#92400e', fontWeight: 'bold' },
                              ]}
                            >
                              {selectedLoc}
                            </Text>
                          </View>
                        )}

                        <View
                          style={[
                            styles.gridItem,
                            isSelectedCityDistrict && {
                              backgroundColor: '#fef3c7',
                              borderColor: '#fde68a',
                              borderWidth: 1,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.gridLabel,
                              isSelectedCityDistrict && { color: '#92400e', fontWeight: 'bold' },
                            ]}
                          >
                            Hedefleme Modu
                          </Text>
                          <Text
                            style={[
                              styles.gridVal,
                              isSelectedCityDistrict && { color: '#92400e', fontWeight: 'bold' },
                            ]}
                          >
                            {getTargetModeLabel(selectedDemand.targetmode, selectedLoc) || 'Standart'}
                          </Text>
                        </View>
                      <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Arama Adımı</Text>
                        <Text style={styles.gridVal}>
                          {getSearchStepLabel(selectedDemand.searchstep) || '-'}
                        </Text>
                      </View>
                      <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Kayıt Tarihi</Text>
                        <Text style={styles.gridVal}>
                          {selectedDemand.createtime ? new Date(selectedDemand.createtime).toLocaleString('tr-TR') : '-'}
                        </Text>
                      </View>
                      <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>İletilen Firma</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setDetailModalVisible(false);
                            openCompaniesModal(selectedDemand);
                          }}
                        >
                          <Text style={[styles.gridVal, { color: AppColors.accent, fontWeight: 'bold' }]}>
                            {selectedDemand.respondedcount !== undefined
                              ? `${selectedDemand.respondedcount} Firma ›`
                              : '0 Firma'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Bende Var</Text>
                        <Text style={[styles.gridVal, { color: '#166534', fontWeight: 'bold' }]}>
                          {selectedDemand.bendevarcount !== undefined ? `${selectedDemand.bendevarcount} Firma` : '0 Firma'}
                        </Text>
                      </View>
                      <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Bende Yok</Text>
                        <Text style={[styles.gridVal, { color: '#991b1b', fontWeight: 'bold' }]}>
                          {selectedDemand.bendeyokcount !== undefined ? `${selectedDemand.bendeyokcount} Firma` : '0 Firma'}
                        </Text>
                      </View>
                    </View>

                    {/* Red Gerekçesi (varsa) */}
                    {(selectedDemand.status == DemandStatus.Rejected || selectedDemand.status == 4 || selectedDemand.status == 3) && (
                      <View style={[styles.rejectNoteBox, { marginTop: 12, paddingVertical: 10, paddingHorizontal: 12 }]}>
                        <Ionicons name="alert-circle" size={18} color="#991b1b" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, color: '#991b1b', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            Reddetme Gerekçesi
                          </Text>
                          <Text style={[styles.rejectNoteText, { marginTop: 2, fontSize: 13 }]}>
                            {selectedDemand.rejectdescription?.trim() || 'Açıklama belirtilmedi.'}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Aksiyon Butonları */}
                    <View style={styles.detailActionRow}>
                      <TouchableOpacity
                        style={styles.detailResponseBtn}
                        onPress={() => {
                          setDetailModalVisible(false);
                          openCompaniesModal(selectedDemand);
                        }}
                      >
                        <Ionicons name="business-outline" size={16} color={AppColors.accent} />
                        <Text style={styles.detailResponseBtnText}>Yanıt Veren Firmaları Gör</Text>
                      </TouchableOpacity>

                      {selectedDemand.status == 0 && (
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                          <TouchableOpacity
                            style={[styles.modalActionBtn, { backgroundColor: AppColors.success, flex: 1 }]}
                            onPress={() => handleApprove(selectedDemand.id)}
                          >
                            <Text style={styles.modalActionBtnText}>Onayla ve Yayına Al</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.modalActionBtn, { backgroundColor: AppColors.danger, flex: 1 }]}
                            onPress={() => {
                              setDetailModalVisible(false);
                              openRejectModal(selectedDemand);
                            }}
                          >
                            <Text style={styles.modalActionBtnText}>Reddet</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </>
                );
              })()}
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal Header Standardı ile Reddetme Modalı */}
      <Modal visible={rejectModalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <StatusBar barStyle="dark-content" />
          <KeyboardAvoidingView
            style={styles.modalBackdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContainer}>
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>

              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>
                  Talebi Reddet #{selectedDemand?.id}
                </Text>
                <TouchableOpacity onPress={() => setRejectModalVisible(false)} style={styles.closeButton}>
                  <MaterialIcons name="close" size={22} color={AppColors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                <Text style={styles.inputLabel}>Hızlı Gerekçe Seçimi:</Text>
                <View style={styles.presetWrap}>
                  {[
                    'Talep içeriği uygun görülmedi',
                    'Fotoğraf / Açıklama eksik',
                    'Kategori eşleşmesi hatalı',
                    'Yanıltıcı / Spam içerik',
                    'Yasaklı / Kurallara aykırı ürün',
                  ].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      style={[styles.presetChip, rejectReason === preset && styles.presetChipActive]}
                      onPress={() => setRejectReason(preset)}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          rejectReason === preset && styles.presetChipTextActive,
                        ]}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Reddetme Açıklaması *</Text>
                <TextInput
                  style={styles.modalMultilineInput}
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  placeholder="Kullanıcıya iletilecek reddetme sebebini yazınız..."
                  placeholderTextColor={AppColors.textMuted}
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setRejectModalVisible(false)}
                  >
                    <Text style={styles.modalBtnCancelText}>Vazgeç</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: AppColors.danger, flex: 1, alignItems: 'center' }]}
                    onPress={handleRejectSubmit}
                  >
                    <Text style={styles.modalBtnSaveText}>Reddet</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Yanıt Veren Firmalar Modalı */}
      <Modal visible={companiesModalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>

              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>
                  Talebe Yanıt Veren Firmalar {demandCompanies.length > 0 ? `(${demandCompanies.length})` : ''}
                </Text>
                <TouchableOpacity onPress={() => setCompaniesModalVisible(false)} style={styles.closeButton}>
                  <MaterialIcons name="close" size={22} color={AppColors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* İstatistik Özet Kartları */}
              {selectedDemand && (
                <View style={styles.modalStatsSummaryRow}>
                  <View style={styles.modalStatCard}>
                    <Text style={styles.modalStatNumber}>{selectedDemand.respondedcount ?? demandCompanies.length}</Text>
                    <Text style={styles.modalStatLabel}>İletilen</Text>
                  </View>
                  <View style={[styles.modalStatCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                    <Text style={[styles.modalStatNumber, { color: '#166534' }]}>
                      {selectedDemand.bendevarcount ??
                        demandCompanies.filter((c: any) => Number(c.responsestatus) === DemandCompanyResponseStatus.Accepted).length}
                    </Text>
                    <Text style={[styles.modalStatLabel, { color: '#166534' }]}>Bende Var</Text>
                  </View>
                  <View style={[styles.modalStatCard, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                    <Text style={[styles.modalStatNumber, { color: '#991b1b' }]}>
                      {selectedDemand.bendeyokcount ??
                        demandCompanies.filter((c: any) => Number(c.responsestatus) === DemandCompanyResponseStatus.Rejected).length}
                    </Text>
                    <Text style={[styles.modalStatLabel, { color: '#991b1b' }]}>Bende Yok</Text>
                  </View>
                  <View style={[styles.modalStatCard, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
                    <Text style={[styles.modalStatNumber, { color: '#b45309' }]}>
                      {Math.max(
                        0,
                        (selectedDemand.respondedcount ?? demandCompanies.length) -
                          ((selectedDemand.bendevarcount ?? 0) + (selectedDemand.bendeyokcount ?? 0))
                      )}
                    </Text>
                    <Text style={[styles.modalStatLabel, { color: '#b45309' }]}>Bekleyen</Text>
                  </View>
                </View>
              )}

              <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 }}>
                <Text style={{ fontSize: 13, color: AppColors.textSecondary, fontWeight: '500' }}>
                  Talep #{selectedDemand?.id} için teklif / yanıt ileten esnaflar:
                </Text>
              </View>

              {companiesLoading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator color="#D71920" size="small" />
                </View>
              ) : demandCompanies.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Ionicons name="chatbubble-outline" size={40} color={AppColors.textMuted} />
                  <Text style={{ color: AppColors.textMuted, fontSize: 13.5, marginTop: 8 }}>
                    Bu talebe henüz yanıt verilmemiştir.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={demandCompanies}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={{ padding: 16 }}
                  renderItem={({ item }) => {
                    const compLoc = formatLocation(item.city, item.district);
                    const respStatus = Number((item as any).responsestatus);
                    return (
                      <View style={styles.companyCard}>
                        <View style={styles.companyIconBox}>
                          <Ionicons name="business" size={20} color={AppColors.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.companyName} numberOfLines={1}>{item.name}</Text>
                            {respStatus === DemandCompanyResponseStatus.Accepted ? (
                              <View style={[styles.statusBadge, { backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2 }]}>
                                <Text style={{ color: '#166534', fontSize: 10, fontWeight: 'bold' }}>Bende Var</Text>
                              </View>
                            ) : respStatus === DemandCompanyResponseStatus.Rejected ? (
                              <View style={[styles.statusBadge, { backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 2 }]}>
                                <Text style={{ color: '#991b1b', fontSize: 10, fontWeight: 'bold' }}>Bende Yok</Text>
                              </View>
                            ) : (
                              <View style={[styles.statusBadge, { backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2 }]}>
                                <Text style={{ color: '#92400e', fontSize: 10, fontWeight: 'bold' }}>Bildirildi</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.companySub}>
                            {compLoc ? `${compLoc} • ` : ''}{item.phone || 'Telefon yok'}
                          </Text>
                          {!!(item as any).lastanswermessage && (
                            <Text style={{ fontSize: 12, color: AppColors.textPrimary, fontStyle: 'italic', marginTop: 4, backgroundColor: '#f8fafc', padding: 4, borderRadius: 4 }}>
                              "{ (item as any).lastanswermessage }"
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  }}
                />
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal Header Standardı ile Müşteri Detayı Modalı */}
      <Modal visible={customerModalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>

              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>Müşteri Detayı</Text>
                <TouchableOpacity onPress={() => setCustomerModalVisible(false)} style={styles.closeButton}>
                  <MaterialIcons name="close" size={22} color={AppColors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                {selectedCustomer && (() => {
                  const custPhone = selectedCustomer.phone || customerDemand?.userphone;
                  const isCustActive = selectedCustomer.status == UserStatus.Active;
                  const isCustBanned = selectedCustomer.status == UserStatus.Banned || selectedCustomer.status == UserStatus.Suspended;

                  // Bu müşterinin diğer talepleri
                  const customerDemands = demands.filter(
                    (d) =>
                      (selectedCustomer.id && String(d.userid) === String(selectedCustomer.id)) ||
                      (selectedCustomer.username && String(d.username).toLowerCase() === String(selectedCustomer.username).toLowerCase())
                  );

                  return (
                    <>
                      {/* Avatar & İsim Hero Kartı */}
                      <View style={styles.customerHeroCard}>
                        <View style={styles.customerAvatarBox}>
                          <Ionicons name="person" size={32} color={AppColors.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.customerHeroName}>
                            {selectedCustomer.displayname || selectedCustomer.username || 'Müşteri'}
                          </Text>
                          <Text style={styles.customerHeroUsername}>
                            @{selectedCustomer.username || `user_${selectedCustomer.id}`}
                          </Text>

                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                            <View
                              style={[
                                styles.statusBadge,
                                {
                                  backgroundColor: isCustActive
                                    ? '#dcfce7'
                                    : isCustBanned
                                    ? '#fee2e2'
                                    : '#fef3c7',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  {
                                    color: isCustActive
                                      ? '#166534'
                                      : isCustBanned
                                      ? '#991b1b'
                                      : '#92400e',
                                  },
                                ]}
                              >
                                {isCustActive
                                  ? '● Aktif Müşteri'
                                  : isCustBanned
                                  ? '● Yasaklı (Ban)'
                                  : '● Pasif'}
                              </Text>
                            </View>

                            <View style={[styles.statusBadge, { backgroundColor: '#f1f5f9' }]}>
                              <Text style={[styles.statusBadgeText, { color: '#475569' }]}>
                                {selectedCustomer.role || 'Bireysel Üye'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Yasak Sebebi Bilgisi (Varsa) */}
                      {isCustBanned && (
                        <View style={[styles.rejectNoteBox, { marginBottom: 12 }]}>
                          <Ionicons name="alert-circle" size={16} color="#991b1b" />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#991b1b' }}>
                              HESAP ENGELİ BULUNUYOR
                            </Text>
                            <Text style={[styles.rejectNoteText, { marginTop: 2 }]}>
                              {selectedCustomer.banreason || 'Topluluk kuralları gerekçesiyle engellenmiştir.'}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* İletişim ve Hesap Bilgileri */}
                      <Text style={styles.detailSectionTitle}>İLETİŞİM & HESAP BİLGİLERİ</Text>
                      <View style={styles.customerInfoCard}>
                        {/* Telefon */}
                        <View style={styles.customerInfoRow}>
                          <View style={styles.customerInfoIconWrap}>
                            <Ionicons name="call-outline" size={16} color={AppColors.accent} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.customerInfoLabel}>Telefon Numarası</Text>
                            <Text style={styles.customerInfoValue}>
                              {custPhone || 'Belirtilmemiş'}
                            </Text>
                          </View>
                          {!!custPhone && (
                            <TouchableOpacity
                              style={styles.customerActionIconBtn}
                              onPress={() => Linking.openURL(`tel:${custPhone}`)}
                            >
                              <Ionicons name="call" size={15} color={AppColors.white} />
                              <Text style={styles.customerActionIconText}>Ara</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* E-posta */}
                        <View style={styles.customerInfoRow}>
                          <View style={styles.customerInfoIconWrap}>
                            <Ionicons name="mail-outline" size={16} color={AppColors.accent} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.customerInfoLabel}>E-Posta Adresi</Text>
                            <Text style={styles.customerInfoValue}>
                              {selectedCustomer.email || 'Kayıtlı e-posta yok'}
                            </Text>
                          </View>
                          {!!selectedCustomer.email && (
                            <TouchableOpacity
                              style={[styles.customerActionIconBtn, { backgroundColor: '#3b82f6' }]}
                              onPress={() => Linking.openURL(`mailto:${selectedCustomer.email}`)}
                            >
                              <Ionicons name="mail" size={14} color={AppColors.white} />
                              <Text style={styles.customerActionIconText}>E-Posta</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Kullanıcı ID */}
                        <View style={styles.customerInfoRow}>
                          <View style={styles.customerInfoIconWrap}>
                            <Ionicons name="finger-print-outline" size={16} color={AppColors.accent} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.customerInfoLabel}>Sistem Kullanıcı ID</Text>
                            <Text style={styles.customerInfoValue}>#{selectedCustomer.id}</Text>
                          </View>
                        </View>

                        {/* Kayıt Tarihi */}
                        <View style={[styles.customerInfoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                          <View style={styles.customerInfoIconWrap}>
                            <Ionicons name="calendar-outline" size={16} color={AppColors.accent} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.customerInfoLabel}>Üyelik Tarihi</Text>
                            <Text style={styles.customerInfoValue}>
                              {formatDateTime(selectedCustomer.createtime) || 'Kayıt tarihi bilinmiyor'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Bu Müşterinin Talepleri */}
                      <View style={{ marginTop: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={styles.detailSectionTitle}>
                            MÜŞTERİNİN TALEPLERİ ({customerDemands.length})
                          </Text>
                          <Text style={{ fontSize: 11, color: AppColors.textMuted }}>
                            Tıklayarak talebe geçebilirsiniz
                          </Text>
                        </View>

                        {customerDemands.length === 0 ? (
                          <View style={styles.customerEmptyDemands}>
                            <Ionicons name="receipt-outline" size={28} color={AppColors.textMuted} />
                            <Text style={{ fontSize: 12, color: AppColors.textMuted, marginTop: 4 }}>
                              Bu müşteriye ait listelenen başka talep yok.
                            </Text>
                          </View>
                        ) : (
                          customerDemands.map((cd) => {
                            const isCurrentSelected = customerDemand?.id === cd.id;
                            const cdCatName = getCategoryName(cd);
                            return (
                              <TouchableOpacity
                                key={cd.id}
                                style={[
                                  styles.customerDemandMiniCard,
                                  isCurrentSelected && { borderColor: AppColors.accent, backgroundColor: '#fff5f5' },
                                ]}
                                activeOpacity={0.7}
                                onPress={() => {
                                  setCustomerModalVisible(false);
                                  setSelectedDemand(cd);
                                  setDetailModalVisible(true);
                                }}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <View style={styles.categoryBadge}>
                                    <Ionicons name="pricetag-outline" size={10} color={AppColors.accent} />
                                    <Text style={styles.categoryBadgeText} numberOfLines={1}>{cdCatName}</Text>
                                  </View>
                                  <Text style={{ fontSize: 11, color: AppColors.textMuted }}>
                                    {cd.createtime ? new Date(cd.createtime).toLocaleDateString('tr-TR') : ''}
                                  </Text>
                                </View>
                                <Text style={styles.customerDemandMiniDesc} numberOfLines={2}>
                                  {cd.description}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                  <Text style={{ fontSize: 11, color: isCurrentSelected ? AppColors.accent : AppColors.textSecondary, fontWeight: isCurrentSelected ? 'bold' : 'normal' }}>
                                    {isCurrentSelected ? '● İncelediğiniz Talep' : `Talep #${cd.id}`}
                                  </Text>
                                  <Text style={{ fontSize: 11, color: AppColors.accent, fontWeight: '600' }}>
                                    Detayı Gör ➔
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </View>

                      {/* Alt İşlemler */}
                      <View style={{ marginTop: 20, marginBottom: 24, gap: 10 }}>
                        <TouchableOpacity
                          style={[
                            styles.modalBtn,
                            {
                              backgroundColor: isCustActive ? AppColors.borderLight : AppColors.success,
                              alignItems: 'center',
                            },
                          ]}
                          onPress={handleToggleCustomerStatus}
                          disabled={customerActionLoading}
                        >
                          {customerActionLoading ? (
                            <ActivityIndicator color={AppColors.textPrimary} size="small" />
                          ) : (
                            <Text
                              style={{
                                fontSize: 13.5,
                                fontWeight: 'bold',
                                color: isCustActive ? AppColors.textPrimary : AppColors.white,
                              }}
                            >
                              {isCustActive ? 'Müşteriyi Pasife Al' : 'Müşteriyi Aktifleştir'}
                            </Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.modalBtn, { backgroundColor: AppColors.background, borderWidth: 1, borderColor: AppColors.border, alignItems: 'center' }]}
                          onPress={() => setCustomerModalVisible(false)}
                        >
                          <Text style={{ fontSize: 13, color: AppColors.textSecondary, fontWeight: '600' }}>
                            Kapat
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  );
                })()}
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Fotoğraf Tam Ekran Görüntüleme Modalı */}
      <Modal visible={photoViewerVisible} transparent animationType="fade">
        <View style={styles.photoOverlay}>
          <TouchableOpacity
            style={styles.photoCloseBtn}
            onPress={() => setPhotoViewerVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {activePhotoUrl && (
            <Image
              source={{ uri: activePhotoUrl }}
              style={styles.fullPhoto}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(215, 25, 32, 0.08)',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(215, 25, 32, 0.15)',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12.5,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13.5,
    color: AppColors.textPrimary,
  },
  filterWrap: {
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  filterChipActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  filterChipTextActive: {
    color: AppColors.white,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '55%',
  },
  categoryBadgeText: {
    fontSize: 11,
    color: AppColors.primary,
    fontWeight: 'bold',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.accent,
    backgroundColor: AppColors.surface,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.accent,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  urgentBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    fontSize: 13.5,
    color: AppColors.textPrimary,
    lineHeight: 19,
    marginBottom: 10,
    fontWeight: '500',
  },
  imageThumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.background,
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  thumbWrapper: {
    position: 'relative',
    marginRight: 8,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  thumbImage: {
    width: 52,
    height: 52,
    backgroundColor: AppColors.borderLight,
  },
  thumbZoomIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 3,
    padding: 2,
  },
  imageCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 6,
  },
  imageCountText: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  rejectNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 10,
  },
  rejectNoteText: {
    fontSize: 12,
    color: '#991b1b',
    fontWeight: '600',
    flex: 1,
  },
  detailRejectBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  detailRejectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailRejectTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#991b1b',
  },
  detailRejectDesc: {
    fontSize: 13,
    color: '#7f1d1d',
    lineHeight: 18,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  stepBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metaItem: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  metaItemDate: {
    fontSize: 11.5,
    color: AppColors.textMuted,
    marginLeft: 'auto',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
  },
  responseCountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  responsePillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingRight: 2,
  },
  responsePillText: {
    fontSize: 11.5,
    color: AppColors.textPrimary,
    fontWeight: '700',
  },
  responsePillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  responsePillBadgeVar: {
    backgroundColor: '#dcfce7',
  },
  responsePillBadgeTextVar: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '700',
  },
  responsePillBadgeYok: {
    backgroundColor: '#fee2e2',
  },
  responsePillBadgeTextYok: {
    fontSize: 11,
    color: '#991b1b',
    fontWeight: '700',
  },
  modalStatsSummaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  modalStatCard: {
    flex: 1,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  modalStatNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  modalStatLabel: {
    fontSize: 10,
    color: AppColors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBtn: {
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  detailBtnText: {
    fontSize: 12,
    color: AppColors.textPrimary,
    fontWeight: '600',
  },
  approveBtn: {
    backgroundColor: AppColors.success,
  },
  rejectBtn: {
    backgroundColor: AppColors.danger,
  },
  smallBtnText: {
    fontSize: 12,
    color: AppColors.white,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: AppColors.textMuted,
    marginTop: 8,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    overflow: 'hidden',
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
  modalBody: {
    padding: 18,
  },
  detailSection: {
    backgroundColor: AppColors.background,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 12,
  },
  detailDescTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.textMuted,
    marginBottom: 4,
  },
  detailDesc: {
    fontSize: 14,
    color: AppColors.textPrimary,
    lineHeight: 20,
    fontWeight: '500',
  },
  detailSectionTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: AppColors.textMuted,
    letterSpacing: 0.5,
  },
  detailThumbWrap: {
    position: 'relative',
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  detailThumbImage: {
    width: 80,
    height: 80,
    backgroundColor: AppColors.borderLight,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: AppColors.background,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 12,
  },
  gridItem: {
    width: '47%',
  },
  gridLabel: {
    fontSize: 11,
    color: AppColors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  gridVal: {
    fontSize: 13,
    color: AppColors.textPrimary,
    fontWeight: '600',
  },
  detailActionRow: {
    marginTop: 4,
    marginBottom: 20,
  },
  detailResponseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.primaryLight,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(215, 25, 32, 0.2)',
  },
  detailResponseBtnText: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: AppColors.accent,
  },
  modalActionBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionBtnText: {
    color: AppColors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 6,
  },
  presetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  presetChipActive: {
    backgroundColor: '#fee2e2',
    borderColor: AppColors.danger,
  },
  presetChipText: {
    fontSize: 11.5,
    color: AppColors.textPrimary,
  },
  presetChipTextActive: {
    color: AppColors.danger,
    fontWeight: 'bold',
  },
  modalMultilineInput: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.background,
    minHeight: 80,
    maxHeight: 140,
    lineHeight: 19,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    marginBottom: 16,
    gap: 10,
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalBtnCancel: {
    backgroundColor: AppColors.borderLight,
  },
  modalBtnCancelText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  modalBtnSaveText: {
    fontSize: 13.5,
    color: AppColors.white,
    fontWeight: 'bold',
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: AppColors.background,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  companyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: AppColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  companySub: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  photoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCloseBtn: {
    position: 'absolute',
    top: 44,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  fullPhoto: {
    width: '95%',
    height: '80%',
  },
  customerMetaTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(215, 25, 32, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(215, 25, 32, 0.2)',
  },
  customerMetaText: {
    fontSize: 12,
    color: AppColors.accent,
    fontWeight: '700',
    maxWidth: 130,
  },
  customerGridItem: {
    backgroundColor: 'rgba(215, 25, 32, 0.04)',
    borderColor: 'rgba(215, 25, 32, 0.3)',
    borderWidth: 1,
  },
  gridTouchHint: {
    fontSize: 11,
    color: AppColors.accent,
    fontWeight: '600',
    marginTop: 4,
  },
  customerHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AppColors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 14,
  },
  customerAvatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(215, 25, 32, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(215, 25, 32, 0.3)',
  },
  customerHeroName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  customerHeroUsername: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 1,
  },
  customerInfoCard: {
    backgroundColor: AppColors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  customerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
  },
  customerInfoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(215, 25, 32, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  customerInfoLabel: {
    fontSize: 11,
    color: AppColors.textMuted,
    fontWeight: '600',
  },
  customerInfoValue: {
    fontSize: 13.5,
    color: AppColors.textPrimary,
    fontWeight: '600',
    marginTop: 1,
  },
  customerActionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 8,
  },
  customerActionIconText: {
    color: AppColors.white,
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  customerEmptyDemands: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: AppColors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  customerDemandMiniCard: {
    backgroundColor: AppColors.background,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 8,
  },
  customerDemandMiniDesc: {
    fontSize: 12.5,
    color: AppColors.textPrimary,
    marginTop: 6,
    lineHeight: 17,
  },
});

