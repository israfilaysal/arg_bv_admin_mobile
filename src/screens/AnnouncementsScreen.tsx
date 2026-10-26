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
import { AnnouncementItem, AnnouncementPopupType } from '../types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { AppLogo } from '../components/AppLogo';

export const AnnouncementsScreen: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Ekleme Modalı
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState<'all' | 'customer' | 'company'>('all');
  const [actionLoading, setActionLoading] = useState(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await serviceAdmin.getAnnouncementList();
      const list = res.value || res.data || (res as any).Data || (res as any).Value;
      if (res.resulttype == 1 && Array.isArray(list)) {
        setAnnouncements(list);
      } else {
        setAnnouncements([]);
      }
    } catch {
      Alert.alert('Hata', 'Duyurular yüklenemedi.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Uyarı', 'Lütfen başlık ve duyuru içeriğini giriniz.');
      return;
    }

    setActionLoading(true);
    try {
      const payload: Partial<AnnouncementItem> = {
        title: title.trim(),
        content: content.trim(),
        status: 1,
        popuptype: AnnouncementPopupType.Announcement,
        targetrole: targetRole,
      };

      const res = await serviceAdmin.saveAnnouncement(payload);
      if (res.resulttype == 1) {
        Alert.alert('Başarılı', 'Duyuru yayınlandı.');
        setTitle('');
        setContent('');
        setModalVisible(false);
        loadAnnouncements();
      } else {
        const msg = res.description || res.Description || res.message || 'Duyuru yayınlandı.';
        Alert.alert('Bilgi', msg);
        setModalVisible(false);
        loadAnnouncements();
      }
    } catch {
      Alert.alert('Hata', 'Duyuru kaydedilirken problem oluştu.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (item: AnnouncementItem) => {
    Alert.alert('Silme Onayı', `"${item.title}" duyurusunu silmek istediğinize emin misiniz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const res = await serviceAdmin.deleteAnnouncement(item.id);
          if (res.resulttype == 1) {
            Alert.alert('Başarılı', 'Duyuru silindi.');
            setAnnouncements((prev) => prev.filter((a) => a.id !== item.id));
          } else {
            const msg = res.description || res.Description || res.message || 'Duyuru silinemedi.';
            Alert.alert('Hata', msg);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: AnnouncementItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.tagWrap}>
          <Ionicons name="megaphone-outline" size={15} color={AppColors.accent} />
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <TouchableOpacity style={styles.deleteIconBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={16} color={AppColors.danger} />
        </TouchableOpacity>
      </View>

      <Text style={styles.cardContent}>{item.content}</Text>

      <View style={styles.footer}>
        <View style={styles.targetBadge}>
          <Text style={styles.targetBadgeText}>
            Hedef: {item.targetrole === 'company' ? 'Firmalar' : item.targetrole === 'customer' ? 'Müşteriler' : 'Tüm Kullanıcılar'}
          </Text>
        </View>
        {item.createtime ? (
          <Text style={styles.dateText}>
            {new Date(item.createtime).toLocaleDateString('tr-TR')}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Standart Info Kutusu */}
      <View style={styles.infoBox}>
        <MaterialIcons name="info-outline" size={20} color={AppColors.accent} style={styles.infoIcon} />
        <Text style={styles.infoText}>
          Kullanıcı ve esnafların uygulama açılışında göreceği sistem duyurularını ve bildirim mesajlarını buradan yönetebilirsiniz.
        </Text>
      </View>

      <View style={styles.topRow}>
        <Text style={styles.pageTitle}>Yayınlanan Duyurular ({announcements.length})</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={18} color={AppColors.white} />
          <Text style={styles.addBtnText}>Yeni Duyuru</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color="#D71920" size="small" />
        </View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadAnnouncements}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppLogo size={56} style={{ opacity: 0.35, marginBottom: 8 }} />
              <Text style={styles.emptyText}>Henüz yayınlanmış sistem duyurusu yok.</Text>
            </View>
          }
        />
      )}

      {/* Modal Header Standardı ile Yeni Duyuru Modalı */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>

              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>Yeni Sistem Duyurusu</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <MaterialIcons name="close" size={22} color={AppColors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                <Text style={styles.inputLabel}>Duyuru Başlığı *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Örn: Yeni Kampanya & Sürüm Güncellemesi"
                  placeholderTextColor={AppColors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.inputLabel}>Hedef Kitle</Text>
                <View style={styles.roleBtnRow}>
                  {[
                    { id: 'all', label: 'Tüm Kullanıcılar' },
                    { id: 'company', label: 'Yalnızca Firmalar' },
                    { id: 'customer', label: 'Yalnızca Müşteriler' },
                  ].map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.roleBtn, targetRole === r.id && styles.roleBtnActive]}
                      onPress={() => setTargetRole(r.id as any)}
                    >
                      <Text style={[styles.roleBtnText, targetRole === r.id && styles.roleBtnTextActive]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Duyuru İçeriği *</Text>
                <TextInput
                  style={[styles.modalInput, styles.multilineInput]}
                  placeholder="Kullanıcılara ve esnafa gösterilecek bildirim mesajı..."
                  placeholderTextColor={AppColors.textMuted}
                  value={content}
                  onChangeText={setContent}
                  multiline
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
                      <Text style={styles.modalBtnSaveText}>Yayınla</Text>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  pageTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.accent,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: AppColors.white,
    fontSize: 13,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    flex: 1,
  },
  deleteIconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  cardContent: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 19,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
  },
  targetBadge: {
    backgroundColor: AppColors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  targetBadgeText: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11.5,
    color: AppColors.textMuted,
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
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.background,
  },
  multilineInput: {
    minHeight: 90,
    maxHeight: 160,
    lineHeight: 20,
  },
  roleBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  roleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  roleBtnActive: {
    backgroundColor: AppColors.primaryLight,
    borderColor: AppColors.accent,
  },
  roleBtnText: {
    fontSize: 11.5,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  roleBtnTextActive: {
    color: AppColors.accent,
    fontWeight: 'bold',
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
