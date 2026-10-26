import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { AppColors } from '../constants/theme';
import { serviceAdmin } from '../services/serviceAdmin';
import {
  CompanyItem,
  CompanyUserItem,
  CompanyStatus,
  CompanyUserStatus,
  CategoryItem,
  UserItem,
} from '../types';
import { Ionicons } from '@expo/vector-icons';
import { AppLogo } from '../components/AppLogo';

export const CompaniesScreen: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'banned'>('all');
  const [search, setSearch] = useState('');

  // Ban Modal
  const [banModalVisible, setBanModalVisible] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
  const [banReason, setBanReason] = useState('Admin kararı ile askıya alındı.');
  const [banDays, setBanDays] = useState('30');
  const [actionLoading, setActionLoading] = useState(false);

  // Personel / Detay Modal
  const [usersModalVisible, setUsersModalVisible] = useState(false);
  const [companyUsers, setCompanyUsers] = useState<CompanyUserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const [compRes, catsRes, usersRes] = await Promise.all([
        serviceAdmin.getCompanyList(),
        serviceAdmin.getCategoryList(),
        serviceAdmin.getUserList(),
      ]);

      const list = compRes.value || compRes.data || (compRes as any).Data || (compRes as any).Value;
      if (compRes.resulttype == 1 && Array.isArray(list)) {
        setCompanies(list);
      } else {
        setCompanies([]);
      }

      const catList = catsRes.value || catsRes.data || (catsRes as any).Data || (catsRes as any).Value;
      if (catsRes.resulttype == 1 && Array.isArray(catList)) {
        setCategories(catList);
      } else {
        setCategories([]);
      }

      const userList = usersRes.value || usersRes.data || (usersRes as any).Data || (usersRes as any).Value;
      if (usersRes.resulttype == 1 && Array.isArray(userList)) {
        setUsers(userList);
      } else {
        setUsers([]);
      }
    } catch {
      Alert.alert('Hata', 'Firmalar ve ilgili bilgiler yüklenirken bir problem oluştu.');
      setCompanies([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: number | string) => {
    Alert.alert('Onay', 'Bu firmayı onaylamak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Onayla',
        onPress: async () => {
          const res = await serviceAdmin.approveCompany(id);
          if (res.resulttype == 1) {
            Alert.alert('Başarılı', 'Firma onaylandı.');
          } else {
            Alert.alert('Bilgi', res.message || 'Firma onaylandı.');
          }
          setCompanies((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: CompanyStatus.Active } : c))
          );
        },
      },
    ]);
  };

  const handleReject = async (id: number | string) => {
    Alert.alert('Reddetme', 'Bu başvuruyu reddetmek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Reddet',
        style: 'destructive',
        onPress: async () => {
          const res = await serviceAdmin.rejectCompany(id);
          if (res.resulttype == 1) {
            Alert.alert('Başarılı', 'Firma başvurusu reddedildi.');
          } else {
            Alert.alert('Bilgi', res.message || 'Firma başvurusu reddedildi.');
          }
          setCompanies((prev) =>
            prev.map((c) => (c.id === id ? { ...c, status: CompanyStatus.Passive } : c))
          );
        },
      },
    ]);
  };

  const openBanModal = (c: CompanyItem) => {
    setSelectedCompany(c);
    setBanReason('Admin kararı ile askıya alındı.');
    setBanDays('30');
    setBanModalVisible(true);
  };

  const handleBanSubmit = async () => {
    if (!selectedCompany) return;
    setActionLoading(true);
    try {
      const days = parseInt(banDays, 10) || 30;
      const res = await serviceAdmin.banCompany(selectedCompany.id, banReason, days);
      if (res.resulttype == 1) {
        Alert.alert('Yasaklandı', `${selectedCompany.name} firması askıya alındı.`);
      } else {
        Alert.alert('Bilgi', res.message || 'Firma askıya alındı.');
      }
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === selectedCompany.id ? { ...c, status: CompanyStatus.Banned, banreason: banReason } : c
        )
      );
      setBanModalVisible(false);
    } catch {
      Alert.alert('Hata', 'İşlem sırasında hata oluştu.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async (c: CompanyItem) => {
    Alert.alert('Yasağı Kaldır', `"${c.name}" firmasının yasağını kaldırmak istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Aktifleştir',
        onPress: async () => {
          const res = await serviceAdmin.unbanCompany(c.id);
          if (res.resulttype == 1) {
            Alert.alert('Başarılı', 'Firmanın yasağı kaldırıldı.');
          } else {
            Alert.alert('Bilgi', res.message || 'Firmanın yasağı kaldırıldı.');
          }
          setCompanies((prev) =>
            prev.map((item) => (item.id === c.id ? { ...item, status: CompanyStatus.Active, banreason: undefined } : item))
          );
        },
      },
    ]);
  };

  const openCompanyUsers = async (c: CompanyItem) => {
    setSelectedCompany(c);
    setUsersModalVisible(true);
    setUsersLoading(true);
    try {
      const res = await serviceAdmin.getCompanyUsers(c.id);
      const list = res.value || res.data || (res as any).Data || (res as any).Value;
      if (res.resulttype == 1 && Array.isArray(list)) {
        setCompanyUsers(list);
      } else {
        setCompanyUsers([]);
      }
    } catch {
      Alert.alert('Hata', 'Firma personelleri alınamadı.');
      setCompanyUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const formatDateTime = (dateStr?: string) => {
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

  const getCreatorInfo = (item: CompanyItem): string => {
    // 1. users listesinden userid veya username/creator ile eşleştir
    const foundUser = users.find(
      (u) =>
        (item.userid && String(u.id) === String(item.userid)) ||
        (item.creator && String(u.username).toLowerCase() === String(item.creator).toLowerCase())
    );

    if (foundUser) {
      if (foundUser.displayname && foundUser.username) {
        return `${foundUser.displayname} (@${foundUser.username})`;
      }
      return foundUser.displayname || `@${foundUser.username}` || `Kullanıcı #${foundUser.id}`;
    }

    // 2. Doğrudan item üzerinde gelen kullanıcı alanları
    if (item.userdisplayname && item.username) {
      return `${item.userdisplayname} (@${item.username})`;
    }
    if (item.userdisplayname) return item.userdisplayname;
    if (item.username) return `@${item.username}`;
    if (item.creator) return item.creator;
    if (item.userid) return `Kullanıcı #${item.userid}`;
    return 'Belirtilmemiş';
  };

  const getCategoryNames = (item: CompanyItem): string => {
    if (item.categorynames) return item.categorynames;

    const raw = item.categoryids;
    if (!raw) return '';

    let ids: (string | number)[] = [];
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            ids = parsed;
          } else {
            ids = trimmed.replace(/[\[\]"\\]/g, '').split(',').map((x) => x.trim()).filter(Boolean);
          }
        } catch {
          ids = trimmed.replace(/[\[\]"\\]/g, '').split(',').map((x) => x.trim()).filter(Boolean);
        }
      } else {
        ids = trimmed.replace(/[\[\]"\\]/g, '').split(',').map((x) => x.trim()).filter(Boolean);
      }
    } else if (Array.isArray(raw)) {
      ids = raw;
    } else if (typeof raw === 'number') {
      ids = [raw];
    }

    if (!Array.isArray(ids) || ids.length === 0 || categories.length === 0) {
      return '';
    }

    const matchedNames: string[] = [];
    for (const rawId of ids) {
      const cleanId = String(rawId).trim();
      if (!cleanId) continue;
      const found = categories.find((c) => String(c.id).trim() === cleanId);
      if (found) {
        const catName = found.categoryname || found.name;
        if (catName && !matchedNames.includes(catName)) {
          matchedNames.push(catName);
        }
      }
    }

    return matchedNames.join(', ');
  };

  const filteredAndSortedList = useMemo(() => {
    const list = companies.filter((c) => {
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'pending'
          ? (c.status == CompanyStatus.Pending || c.status == 0)
          : filter === 'active'
          ? c.status == CompanyStatus.Active
          : c.status == CompanyStatus.Banned;

      const searchLower = search.trim().toLowerCase();
      if (!searchLower) return matchesFilter;

      const creatorStr = getCreatorInfo(c).toLowerCase();
      const catStr = getCategoryNames(c).toLowerCase();

      const matchesSearch =
        c.name.toLowerCase().includes(searchLower) ||
        (c.city && c.city.toLowerCase().includes(searchLower)) ||
        (c.district && c.district.toLowerCase().includes(searchLower)) ||
        (c.phone && c.phone.includes(searchLower)) ||
        creatorStr.includes(searchLower) ||
        catStr.includes(searchLower);

      return matchesFilter && matchesSearch;
    });

    return [...list].sort((a, b) => {
      const timeA = a.createtime ? new Date(a.createtime).getTime() : 0;
      const timeB = b.createtime ? new Date(b.createtime).getTime() : 0;
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
        return timeB - timeA; // En yeni oluşturulma tarihi en üstte (desc)
      }
      return Number(b.id) - Number(a.id); // Fallback: ID desc
    });
  }, [companies, categories, users, filter, search]);

  const renderItem = ({ item }: { item: CompanyItem }) => {
    const isPending = item.status == CompanyStatus.Pending || item.status == 0;
    const isActive = item.status == CompanyStatus.Active;
    const isBanned = item.status == CompanyStatus.Banned;
    const isPendingPayment = item.status == CompanyStatus.PendingPayment;

    const getStatusLabel = () => {
      if (isActive) return 'Aktif';
      if (isPending) return 'Onay Bekliyor';
      if (isPendingPayment) return 'Ödeme Bekleniyor';
      if (isBanned) return 'Askıya Alındı';
      return 'Pasif';
    };

    const getStatusColors = () => {
      if (isActive) return { bg: AppColors.successLight, text: AppColors.successDark };
      if (isPending) return { bg: AppColors.warningLight, text: AppColors.warningDark };
      if (isPendingPayment) return { bg: '#fef3c7', text: '#92400e' };
      if (isBanned) return { bg: AppColors.dangerLight, text: AppColors.dangerDark };
      return { bg: '#f1f5f9', text: '#64748b' };
    };

    const statusColors = getStatusColors();
    const formattedCreatedDate = formatDateTime(item.createtime);
    const creatorName = getCreatorInfo(item);
    const categoryNames = getCategoryNames(item);

    return (
      <View style={styles.card}>
        {/* Firmanın Üstünde Açan Kullanıcı Bilgisi */}
        <View style={styles.creatorHeaderRow}>
          <View style={styles.creatorBadge}>
            <Ionicons name="person-circle-outline" size={13} color={AppColors.accent} />
            <Text style={styles.creatorLabel}>Açan:</Text>
            <Text style={styles.creatorValue} numberOfLines={1}>
              {creatorName}
            </Text>
          </View>
        </View>

        <View style={styles.cardHeader}>
          <Text style={styles.companyName}>{item.name}</Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: statusColors.bg,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: statusColors.text,
                },
              ]}
            >
              {getStatusLabel()}
            </Text>
          </View>
        </View>

        {/* Firma Kategorisi */}
        <View style={styles.categoryRow}>
          <Ionicons name="pricetag" size={13} color="#4338ca" />
          <Text style={styles.categoryLabel}>Kategori:</Text>
          <Text
            style={[
              styles.categoryValue,
              !categoryNames && { color: AppColors.textMuted, fontStyle: 'italic' },
            ]}
            numberOfLines={2}
          >
            {categoryNames || 'Genel / Belirtilmemiş'}
          </Text>
        </View>

        <Text style={styles.locationText}>
          <Ionicons name="location-outline" size={13} color={AppColors.textSecondary} />{' '}
          {item.city || 'Belirtilmemiş'} / {item.district || '-'}
        </Text>

        <Text style={styles.phoneText}>
          <Ionicons name="call-outline" size={13} color={AppColors.textSecondary} />{' '}
          {item.phone || 'Telefon yok'}
        </Text>

        {formattedCreatedDate ? (
          <Text style={styles.dateText}>
            <Ionicons name="calendar-outline" size={13} color={AppColors.textSecondary} />{' '}
            Kayıt: {formattedCreatedDate}
          </Text>
        ) : null}

        {item.banreason ? (
          <View style={styles.banBox}>
            <Ionicons name="alert-circle" size={13} color={AppColors.danger} />
            <Text style={styles.banText}>Askı Nedeni: {item.banreason}</Text>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionOutlineBtn}
            onPress={() => openCompanyUsers(item)}
          >
            <Ionicons name="people-outline" size={14} color={AppColors.primary} />
            <Text style={styles.actionOutlineBtnText}>Personeller</Text>
          </TouchableOpacity>

          {isPending && (
            <>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleReject(item.id)}
              >
                <Text style={styles.rejectBtnText}>Reddet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => handleApprove(item.id)}
              >
                <Text style={styles.approveBtnText}>Onayla</Text>
              </TouchableOpacity>
            </>
          )}

          {isActive && (
            <TouchableOpacity
              style={styles.banBtn}
              onPress={() => openBanModal(item)}
            >
              <Text style={styles.banBtnText}>Askıya Al</Text>
            </TouchableOpacity>
          )}

          {isBanned && (
            <TouchableOpacity
              style={styles.unbanBtn}
              onPress={() => handleUnban(item)}
            >
              <Text style={styles.unbanBtnText}>Yasağı Kaldır</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={AppColors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Firma adı, açan kullanıcı, kategori veya il ara..."
          placeholderTextColor={AppColors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
            Tümü ({companies.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'pending' && styles.filterChipActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterChipText, filter === 'pending' && styles.filterChipTextActive]}>
            Onay Bekleyen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'active' && styles.filterChipActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterChipText, filter === 'active' && styles.filterChipTextActive]}>
            Aktif
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'banned' && styles.filterChipActive]}
          onPress={() => setFilter('banned')}
        >
          <Text style={[styles.filterChipText, filter === 'banned' && styles.filterChipTextActive]}>
            Askıda
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color="#D71920" size="small" />
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedList}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppLogo size={56} style={{ opacity: 0.4, marginBottom: 8 }} />
              <Text style={styles.emptyText}>Firma bulunamadı.</Text>
            </View>
          }
        />
      )}

      {/* Yasaklama (Ban) Modalı */}
      <Modal visible={banModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Firmayı Askıya Al (Ban)</Text>
              <TouchableOpacity onPress={() => setBanModalVisible(false)}>
                <Ionicons name="close" size={22} color={AppColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>{selectedCompany?.name} için askı parametrelerini giriniz:</Text>

            <Text style={styles.inputLabel}>Askı Nedeni</Text>
            <TextInput
              style={[styles.modalInput, { height: 70 }]}
              value={banReason}
              onChangeText={setBanReason}
              multiline
            />

            <Text style={styles.inputLabel}>Süre (Gün)</Text>
            <TextInput
              style={styles.modalInput}
              value={banDays}
              onChangeText={setBanDays}
              keyboardType="numeric"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setBanModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleBanSubmit}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Askıya Al</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Personeller Modalı */}
      <Modal visible={usersModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '75%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Firma Personelleri</Text>
              <TouchableOpacity onPress={() => setUsersModalVisible(false)}>
                <Ionicons name="close" size={22} color={AppColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>{selectedCompany?.name} çalışanları ve yetkileri:</Text>

            {selectedCompany && (
              <View style={styles.selectedCompanyMetaBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="person-circle-outline" size={15} color={AppColors.accent} />
                  <Text style={styles.selectedCompanyMetaText}>
                    Açan Kullanıcı: <Text style={{ fontWeight: 'bold', color: AppColors.textPrimary }}>{getCreatorInfo(selectedCompany)}</Text>
                  </Text>
                </View>
                {getCategoryNames(selectedCompany) ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Ionicons name="pricetag-outline" size={13} color="#4338ca" />
                    <Text style={styles.selectedCompanyMetaText}>
                      Kategori: <Text style={{ fontWeight: 'bold', color: '#4338ca' }}>{getCategoryNames(selectedCompany)}</Text>
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {usersLoading ? (
              <ActivityIndicator color="#D71920" size="small" style={{ marginVertical: 20 }} />
            ) : (
              <FlatList
                data={companyUsers}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <View style={styles.userRow}>
                    <View style={styles.userIcon}>
                      <Ionicons name="person" size={16} color={AppColors.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.userNameText}>{item.username || 'Kullanıcı #' + item.userid}</Text>
                      <Text style={styles.userRoleText}>Rol: {String(item.role)}</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Kayıtlı personel bulunamadı.</Text>
                }
              />
            )}
          </View>
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
    fontSize: 14,
    color: AppColors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: AppColors.white,
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  creatorHeaderRow: {
    marginBottom: 6,
  },
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(215, 25, 32, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(215, 25, 32, 0.15)',
    gap: 4,
    maxWidth: '100%',
  },
  creatorLabel: {
    fontSize: 11,
    color: AppColors.accent,
    fontWeight: '600',
  },
  creatorValue: {
    fontSize: 11,
    color: AppColors.textPrimary,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ede9fe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 6,
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4338ca',
  },
  categoryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3730a3',
    flex: 1,
  },
  selectedCompanyMetaBox: {
    backgroundColor: AppColors.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  selectedCompanyMetaText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  companyName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  locationText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: AppColors.textMuted,
    marginTop: 3,
  },
  banBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.dangerLight,
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
    gap: 6,
  },
  banText: {
    fontSize: 11,
    color: AppColors.dangerDark,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
    gap: 8,
  },
  actionOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.primary,
    gap: 4,
  },
  actionOutlineBtnText: {
    color: AppColors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  approveBtn: {
    backgroundColor: AppColors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  approveBtnText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  rejectBtn: {
    backgroundColor: AppColors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rejectBtnText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  banBtn: {
    backgroundColor: AppColors.warningDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  banBtnText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  unbanBtn: {
    backgroundColor: AppColors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unbanBtnText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: 'bold',
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
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  modalSub: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.background,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 10,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  modalBtnConfirm: {
    backgroundColor: AppColors.danger,
  },
  modalBtnConfirmText: {
    fontSize: 13,
    color: AppColors.white,
    fontWeight: 'bold',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
  },
  userIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  userRoleText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
});
