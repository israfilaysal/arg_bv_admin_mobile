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
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { AppColors } from '../constants/theme';
import { serviceAdmin } from '../services/serviceAdmin';
import { SiteSettingItem } from '../types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { AppLogo } from '../components/AppLogo';

export const SiteSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('all');

  // Düzenleme Modalı
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<SiteSettingItem | null>(null);
  const [settingValue, setSettingValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await serviceAdmin.getSiteSettingList();
      const list = res.value || res.data || (res as any).Data || (res as any).Value;
      if (res.resulttype == 1 && Array.isArray(list)) {
        setSettings(list);
      } else {
        setSettings([]);
      }
    } catch {
      Alert.alert('Hata', 'Sistem ayarları yüklenemedi.');
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const openEditModal = (item: SiteSettingItem) => {
    setSelectedSetting(item);
    setSettingValue(item.settingvalue || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedSetting) return;
    setActionLoading(true);
    try {
      const updatedList = settings.map((s) =>
        s.id === selectedSetting.id ? { ...s, settingvalue: settingValue } : s
      );

      const res = await serviceAdmin.saveSiteSettings(updatedList);
      if (res.resulttype == 1) {
        Alert.alert('Başarılı', 'Ayar başarıyla güncellendi.');
        setSettings(updatedList);
        setModalVisible(false);
      } else {
        const msg = res.description || res.Description || res.message || 'Ayar güncellendi.';
        Alert.alert('Bilgi', msg);
        setSettings(updatedList);
        setModalVisible(false);
      }
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Ayar kaydedilirken problem oluştu.');
    } finally {
      setActionLoading(false);
    }
  };

  // Mevcut benzersiz grupları topla
  const existingGroups = Array.from(
    new Set(
      settings
        .map((s) => s.settinggroup || s.groupname || 'general')
        .filter(Boolean)
    )
  );

  const filtered = settings.filter((s) => {
    const group = s.settinggroup || s.groupname || 'general';
    const matchesGroup = activeGroup === 'all' || group.toLowerCase() === activeGroup.toLowerCase();
    const term = search.toLowerCase();
    const matchesSearch =
      s.settingkey.toLowerCase().includes(term) ||
      (s.description && s.description.toLowerCase().includes(term)) ||
      (s.settingvalue && s.settingvalue.toLowerCase().includes(term)) ||
      group.toLowerCase().includes(term);

    return matchesGroup && matchesSearch;
  });

  const getGroupBadgeColor = (group?: string) => {
    const g = (group || '').toLowerCase();
    if (g.includes('home')) return { bg: '#e0e7ff', text: '#3730a3' };
    if (g.includes('contact') || g.includes('phone')) return { bg: '#dcfce7', text: '#166534' };
    if (g.includes('camp') || g.includes('banner')) return { bg: '#fef3c7', text: '#92400e' };
    return { bg: AppColors.primaryLight, text: AppColors.primary };
  };

  const renderItem = ({ item }: { item: SiteSettingItem }) => {
    const groupName = item.settinggroup || item.groupname || 'Genel';
    const badgeStyle = getGroupBadgeColor(groupName);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
            <Text style={[styles.badgeText, { color: badgeStyle.text }]}>{groupName}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
            <Ionicons name="pencil" size={14} color={AppColors.accent} />
            <Text style={styles.editBtnText}>Düzenle</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.keyText}>{item.settingkey}</Text>
        {item.description ? (
          <Text style={styles.descText}>{item.description}</Text>
        ) : null}

        {/* Taşmayı engelleyen dikey saran değer kutusu */}
        <View style={styles.valBox}>
          <Text style={styles.valLabel}>MEVCUT DEĞER</Text>
          <Text style={styles.valText} selectable>
            {item.settingvalue || '(Değer girilmemiş)'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Standart Info Kutusu */}
      <View style={styles.infoBox}>
        <MaterialIcons name="info-outline" size={20} color={AppColors.accent} style={styles.infoIcon} />
        <Text style={styles.infoText}>
          Uygulama ve web portalındaki dinamik metinler, iletişim bilgileri ve ana sayfa banner içeriklerini buradan güncelleyebilirsiniz.
        </Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={AppColors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Ayar anahtarı, grup, açıklama veya değer ara..."
          placeholderTextColor={AppColors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Grup Filtre Sekmeleri */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, activeGroup === 'all' && styles.filterChipActive]}
            onPress={() => setActiveGroup('all')}
          >
            <Text style={[styles.filterChipText, activeGroup === 'all' && styles.filterChipTextActive]}>
              Tümü ({settings.length})
            </Text>
          </TouchableOpacity>
          {existingGroups.map((g) => {
            const count = settings.filter(
              (s) => (s.settinggroup || s.groupname || 'general').toLowerCase() === g.toLowerCase()
            ).length;
            const isSelected = activeGroup.toLowerCase() === g.toLowerCase();
            return (
              <TouchableOpacity
                key={g}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setActiveGroup(g)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {g} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
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
          onRefresh={loadSettings}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="settings-outline" size={48} color={AppColors.textMuted} />
              <Text style={styles.emptyText}>Ayar kaydı bulunamadı.</Text>
            </View>
          }
        />
      )}

      {/* Modal Header Standardı ile Düzenleme Modalı */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              {/* Drag Handle */}
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>

              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>Ayar Değerini Düzenle</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <MaterialIcons name="close" size={22} color={AppColors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                <View style={styles.modalMetaCard}>
                  <Text style={styles.modalKey}>{selectedSetting?.settingkey}</Text>
                  {selectedSetting?.description ? (
                    <Text style={styles.modalDesc}>{selectedSetting?.description}</Text>
                  ) : null}
                  <View style={styles.modalGroupBadge}>
                    <Text style={styles.modalGroupBadgeText}>
                      Grup: {selectedSetting?.settinggroup || selectedSetting?.groupname || 'Genel'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.inputLabel}>Yeni Değer *</Text>
                <TextInput
                  style={styles.modalMultilineInput}
                  value={settingValue}
                  onChangeText={setSettingValue}
                  placeholder="Ayar değerini giriniz..."
                  placeholderTextColor={AppColors.textMuted}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalBtnCancelText}>Vazgeç</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnSave]}
                    onPress={handleSave}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.modalBtnSaveText}>Değişiklikleri Kaydet</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
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
    marginTop: 4,
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
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  editBtnText: {
    fontSize: 12,
    color: AppColors.accent,
    fontWeight: '700',
  },
  keyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.primary,
    flexShrink: 1,
  },
  descText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
    flexShrink: 1,
  },
  valBox: {
    backgroundColor: AppColors.background,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  valLabel: {
    fontSize: 10.5,
    color: AppColors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  valText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textPrimary,
    lineHeight: 19,
    flexShrink: 1,
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
    maxHeight: '90%',
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
  modalMetaCard: {
    backgroundColor: AppColors.background,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 14,
  },
  modalKey: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  modalDesc: {
    fontSize: 12.5,
    color: AppColors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  modalGroupBadge: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  modalGroupBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 6,
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
    minHeight: 100,
    maxHeight: 180,
    lineHeight: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 22,
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
  modalBtnSave: {
    backgroundColor: AppColors.accent,
    flex: 1,
    alignItems: 'center',
  },
  modalBtnSaveText: {
    fontSize: 13.5,
    color: AppColors.white,
    fontWeight: 'bold',
  },
});
