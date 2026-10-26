import React, { useState, useEffect } from 'react';
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
import { UserItem, UserStatus } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { AppLogo } from '../components/AppLogo';

export const UsersScreen: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'passive'>('all');

  // Ban Modal
  const [banModalVisible, setBanModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [banReason, setBanReason] = useState('Topluluk kurallarına aykırı davranış.');
  const [banDays, setBanDays] = useState('30');
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await serviceAdmin.getUserList();
      const list = res.value || res.data || (res as any).Data || (res as any).Value;
      if (res.resulttype == 1 && Array.isArray(list)) {
        setUsers(list);
      } else {
        setUsers([]);
      }
    } catch {
      Alert.alert('Hata', 'Kullanıcı listesi yüklenemedi.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = (user: UserItem) => {
    const isCurrentlyActive = user.status == UserStatus.Active;
    const newStatus = isCurrentlyActive ? UserStatus.Passive : UserStatus.Active;
    const title = isCurrentlyActive ? 'Kullanıcıyı Pasife Al' : 'Kullanıcıyı Aktifleştir';

    Alert.alert(title, `${user.displayname || user.username} kullanıcısının durumunu değiştirmek istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Evet, Değiştir',
        onPress: async () => {
          const res = await serviceAdmin.updateUserStatus({ id: user.id, status: newStatus });
          if (res.resulttype == 1) {
            Alert.alert('Başarılı', 'Kullanıcı durumu güncellendi.');
            setUsers((prev) =>
              prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
            );
          } else {
            Alert.alert('Bilgi', res.message || 'Kullanıcı durumu güncellendi.');
            setUsers((prev) =>
              prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
            );
          }
        },
      },
    ]);
  };

  const openBanModal = (user: UserItem) => {
    setSelectedUser(user);
    setBanReason('Topluluk kurallarına aykırı davranış.');
    setBanDays('30');
    setBanModalVisible(true);
  };

  const handleBanSubmit = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const days = parseInt(banDays, 10) || 30;
      const res = await serviceAdmin.banUser(selectedUser.id, banReason, days);
      if (res.resulttype == 1) {
        Alert.alert('Yasaklandı', `${selectedUser.displayname || selectedUser.username} kullanıcısı ${days} gün süreyle engellendi.`);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ? { ...u, status: UserStatus.Banned, banreason: banReason } : u
          )
        );
      } else {
        Alert.alert('Bilgi', res.message || 'Kullanıcı yasaklandı.');
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ? { ...u, status: UserStatus.Banned, banreason: banReason } : u
          )
        );
      }
    } catch {
      Alert.alert('Hata', 'Yasaklama işlemi sırasında sorun oluştu.');
    } finally {
      setActionLoading(false);
      setBanModalVisible(false);
      setSelectedUser(null);
    }
  };

  const handleUnban = async (user: UserItem) => {
    Alert.alert('Engeli Kaldır', `${user.displayname || user.username} kullanıcısının yasağını kaldırmak istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Engeli Kaldır',
        onPress: async () => {
          const res = await serviceAdmin.unbanUser(user.id);
          if (res.resulttype == 1) {
            Alert.alert('Başarılı', 'Kullanıcının engeli kaldırıldı.');
            setUsers((prev) =>
              prev.map((u) => (u.id === user.id ? { ...u, status: UserStatus.Active, banreason: undefined } : u))
            );
          } else {
            Alert.alert('Bilgi', res.message || 'Kullanıcı engeli kaldırıldı.');
            setUsers((prev) =>
              prev.map((u) => (u.id === user.id ? { ...u, status: UserStatus.Active, banreason: undefined } : u))
            );
          }
        },
      },
    ]);
  };

  const filteredUsers = users.filter((u) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'active'
        ? u.status == UserStatus.Active
        : u.status != UserStatus.Active;
    const term = search.toLowerCase();
    const matchesSearch =
      (u.displayname && u.displayname.toLowerCase().includes(term)) ||
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.phone && u.phone.includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term));
    return matchesFilter && matchesSearch;
  });

  const renderItem = ({ item }: { item: UserItem }) => {
    const isActive = item.status == UserStatus.Active;
    const isBanned = item.status == UserStatus.Banned || item.status == UserStatus.Suspended;
    const badgeText = isActive ? 'Aktif' : isBanned ? 'Yasaklı' : 'Pasif';
    const badgeBg = isActive ? AppColors.successLight : isBanned ? AppColors.dangerLight : '#f1f5f9';
    const badgeColor = isActive ? AppColors.successDark : isBanned ? AppColors.dangerDark : '#64748b';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarWrap}>
            <Ionicons name="person" size={20} color={AppColors.primary} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.nameText}>{item.displayname || item.username}</Text>
            <Text style={styles.roleText}>{item.role || 'Standart Kullanıcı'} • {item.username}</Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: badgeBg },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: badgeColor },
              ]}
            >
              {badgeText}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          {item.phone && (
            <Text style={styles.metaText}>
              <Ionicons name="call-outline" size={13} color={AppColors.textSecondary} /> {item.phone}
            </Text>
          )}
          {item.email && (
            <Text style={styles.metaText}>
              <Ionicons name="mail-outline" size={13} color={AppColors.textSecondary} /> {item.email}
            </Text>
          )}
        </View>

        {item.banreason && (
          <View style={styles.banReasonBox}>
            <Ionicons name="alert-circle-outline" size={14} color={AppColors.danger} />
            <Text style={styles.banReasonText}>Ceza Sebebi: {item.banreason}</Text>
          </View>
        )}

        <View style={styles.actionRow}>
          {isActive ? (
            <>
              <TouchableOpacity
                style={[styles.btn, styles.btnOutline]}
                onPress={() => handleToggleStatus(item)}
              >
                <Ionicons name="pause-outline" size={15} color={AppColors.warning} />
                <Text style={[styles.btnText, { color: AppColors.warningDark }]}>Pasife Al</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnDanger]}
                onPress={() => openBanModal(item)}
              >
                <Ionicons name="hand-left-outline" size={15} color={AppColors.white} />
                <Text style={[styles.btnText, { color: AppColors.white }]}>Yasakla (Ban)</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.btn, styles.btnSuccess]}
              onPress={() => handleUnban(item)}
            >
              <Ionicons name="checkmark-circle-outline" size={15} color={AppColors.white} />
              <Text style={[styles.btnText, { color: AppColors.white }]}>Engeli Kaldır & Aktifleştir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Arama ve Filtre */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={AppColors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="İsim, kullanıcı adı, telefon veya e-posta..."
          placeholderTextColor={AppColors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={AppColors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
            Tümü ({users.length})
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
          style={[styles.filterChip, filter === 'passive' && styles.filterChipActive]}
          onPress={() => setFilter('passive')}
        >
          <Text style={[styles.filterChipText, filter === 'passive' && styles.filterChipTextActive]}>
            Yasaklı / Pasif
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color="#D71920" size="small" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadUsers}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppLogo size={56} style={{ opacity: 0.4, marginBottom: 8 }} />
              <Text style={styles.emptyText}>Kullanıcı bulunamadı.</Text>
            </View>
          }
        />
      )}

      {/* Yasaklama (Ban) Modalı */}
      <Modal visible={banModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kullanıcıyı Yasakla (Ban)</Text>
              <TouchableOpacity onPress={() => setBanModalVisible(false)}>
                <Ionicons name="close" size={22} color={AppColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              {selectedUser?.displayname || selectedUser?.username} için ceza parametrelerini giriniz:
            </Text>

            <Text style={styles.inputLabel}>Yasaklama Sebebi</Text>
            <TextInput
              style={[styles.modalInput, { height: 70 }]}
              value={banReason}
              onChangeText={setBanReason}
              multiline
            />

            <Text style={styles.inputLabel}>Ceza Süresi (Gün)</Text>
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
                  <Text style={styles.modalBtnConfirmText}>Yasakla</Text>
                )}
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginRight: 8,
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
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  nameText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  roleText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  banReasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.dangerLight,
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    gap: 6,
  },
  banReasonText: {
    fontSize: 12,
    color: AppColors.dangerDark,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
    gap: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: AppColors.warning,
    backgroundColor: AppColors.warningLight,
  },
  btnDanger: {
    backgroundColor: AppColors.danger,
  },
  btnSuccess: {
    backgroundColor: AppColors.success,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '600',
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
    marginBottom: 14,
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.background,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
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
});
