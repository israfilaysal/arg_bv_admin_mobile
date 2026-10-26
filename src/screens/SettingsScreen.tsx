import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { AppColors } from '../constants/theme';
import { serviceStorage } from '../services/serviceStorage';
import {
  LOCAL_PORTAL_URL,
  LOCAL_WIFI_URL,
  LIVE_PORTAL_URL,
  normalizePortalUrl,
} from '../config/appConfig';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { AppLogo } from '../components/AppLogo';

interface Props {
  onLogout: () => void;
}

export const SettingsScreen: React.FC<Props> = ({ onLogout }) => {
  const [userData, setUserData] = useState<any>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(LOCAL_PORTAL_URL);
  const [modalVisible, setModalVisible] = useState(false);
  const [editUrl, setEditUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    serviceStorage.getUserData().then(setUserData);
    loadBaseUrl();
  }, []);

  const loadBaseUrl = async () => {
    const url = await serviceStorage.getBaseUrl();
    setCurrentUrl(url);
  };

  const openEditModal = () => {
    setEditUrl(currentUrl);
    setModalVisible(true);
  };

  const handleSaveUrl = async () => {
    if (!editUrl.trim()) {
      Alert.alert('Uyarı', 'Lütfen geçerli bir Portal adresi giriniz.');
      return;
    }

    setSaving(true);
    try {
      const normalized = normalizePortalUrl(editUrl.trim());
      await serviceStorage.setBaseUrl(normalized);
      const updated = await serviceStorage.getBaseUrl();
      setCurrentUrl(updated);
      setModalVisible(false);
      Alert.alert(
        'Başarılı',
        `Portal adresi güncellendi:\n${updated}`
      );
    } catch {
      Alert.alert('Hata', 'Portal adresi kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetUrl = async () => {
    setSaving(true);
    try {
      await serviceStorage.resetBaseUrl();
      const updated = await serviceStorage.getBaseUrl();
      setCurrentUrl(updated);
      setEditUrl(updated);
      setModalVisible(false);
      Alert.alert('Sıfırlandı', `Portal adresi varsayılan adrese döndürüldü:\n${updated}`);
    } catch {
      Alert.alert('Hata', 'Sıfırlama işlemi başarısız oldu.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Çıkış', 'Yönetici oturumunu kapatmak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await serviceStorage.clearAll();
          onLogout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Profil Kartı */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <AppLogo size={46} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{userData?.name || userData?.displayName || userData?.username || 'Sistem Yöneticisi'}</Text>
          <Text style={styles.userRole}>{userData?.role || 'Süper Admin'}</Text>
        </View>
      </View>

      {/* Sistem & Bağlantı Ayarları */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Sistem & Bağlantı</Text>

        <TouchableOpacity style={styles.itemClickable} onPress={openEditModal}>
          <View style={{ flex: 1 }}>
            <View style={styles.itemLabelRow}>
              <Text style={styles.itemLabel}>Aktif Portal Adresi</Text>
              <View style={styles.badgeEdit}>
                <Ionicons name="pencil" size={11} color={AppColors.primary} />
                <Text style={styles.badgeEditText}>Düzenle</Text>
              </View>
            </View>
            <Text style={styles.itemValue} numberOfLines={2}>{currentUrl}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={AppColors.textMuted} style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <View style={styles.item}>
          <Text style={styles.itemLabel}>Mobil Versiyon</Text>
          <Text style={styles.itemValue}>v1.0.0 (Admin Expo)</Text>
        </View>
      </View>

      {/* Oturum Kapat Butonu */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={AppColors.danger} />
        <Text style={styles.logoutBtnText}>Oturumu Kapat</Text>
      </TouchableOpacity>

      {/* Portal Düzenleme Modalı */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Portal Adresini Düzenle</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={22} color={AppColors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Hızlı Seçim Butonları */}
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  editUrl.toLowerCase().includes('admin.bundanvarmi.com') && styles.presetBtnActive,
                ]}
                onPress={() => setEditUrl(LIVE_PORTAL_URL)}
              >
                <Ionicons
                  name="cloud-outline"
                  size={15}
                  color={
                    editUrl.toLowerCase().includes('admin.bundanvarmi.com')
                      ? AppColors.white
                      : AppColors.primary
                  }
                />
                <Text
                  style={[
                    styles.presetBtnText,
                    editUrl.toLowerCase().includes('admin.bundanvarmi.com') &&
                      styles.presetBtnTextActive,
                  ]}
                >
                  Canlı Portal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  editUrl.includes('192.168.') && styles.presetBtnActive,
                ]}
                onPress={() => setEditUrl(LOCAL_WIFI_URL)}
              >
                <Ionicons
                  name="wifi-outline"
                  size={15}
                  color={editUrl.includes('192.168.') ? AppColors.white : AppColors.accent}
                />
                <Text
                  style={[
                    styles.presetBtnText,
                    editUrl.includes('192.168.') && styles.presetBtnTextActive,
                  ]}
                >
                  Wi-Fi (PC)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  editUrl.toLowerCase().includes('local.argteknoloji.com') && styles.presetBtnActive,
                ]}
                onPress={() => setEditUrl(LOCAL_PORTAL_URL)}
              >
                <Ionicons
                  name="server-outline"
                  size={15}
                  color={
                    editUrl.toLowerCase().includes('local.argteknoloji.com')
                      ? AppColors.white
                      : AppColors.secondary
                  }
                />
                <Text
                  style={[
                    styles.presetBtnText,
                    editUrl.toLowerCase().includes('local.argteknoloji.com') &&
                      styles.presetBtnTextActive,
                  ]}
                >
                  Lokal IIS
                </Text>
              </TouchableOpacity>
            </View>

            {/* Info Kutusu Standardı */}
            <View style={styles.infoBox}>
              <MaterialIcons name="info-outline" size={18} color={AppColors.accent} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Girdiğiniz portal kök adresi (örn: https://admin.bundanvarmi.com/portal veya http://local.argteknoloji.com/portal) üzerinden hem oturum (SessionService) hem de Bundan Var Mı (bvService) servisleri otomatik olarak çağrılır.
              </Text>
            </View>

            <Text style={styles.inputLabel}>Portal URL Adresi</Text>
            <TextInput
              style={styles.modalInput}
              value={editUrl}
              onChangeText={setEditUrl}
              placeholder="https://admin.bundanvarmi.com/portal"
              placeholderTextColor={AppColors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Canlı Önizleme */}
            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Aktif Kullanılacak Portal Kökü:</Text>
              <Text style={styles.previewValue}>{normalizePortalUrl(editUrl)}</Text>
            </View>


            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnReset]}
                onPress={handleResetUrl}
                disabled={saving}
              >
                <Text style={styles.modalBtnResetText}>Varsayılana Sıfırla</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleSaveUrl}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#D71920" size="small" />
                ) : (
                  <Text style={styles.modalBtnSaveText}>Kaydet ve Uygula</Text>
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
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    marginLeft: 14,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  userRole: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: AppColors.textMuted,
    textTransform: 'uppercase',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
  },
  itemClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
  },
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
  },
  itemLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  badgeEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: AppColors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeEditText: {
    fontSize: 11,
    color: AppColors.primary,
    fontWeight: 'bold',
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.textPrimary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.dangerLight,
    height: 48,
    borderRadius: 10,
    marginTop: 'auto',
    marginBottom: 20,
  },
  logoutBtnText: {
    color: AppColors.danger,
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
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
    marginBottom: 12,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 16,
    backgroundColor: AppColors.background,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.background,
  },
  presetBtnActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  presetBtnTextActive: {
    color: AppColors.white,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(215, 25, 32, 0.08)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(215, 25, 32, 0.15)',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.background,
  },
  previewBox: {
    backgroundColor: AppColors.background,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginTop: 10,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  previewValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginTop: 2,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnReset: {
    backgroundColor: AppColors.borderLight,
  },
  modalBtnResetText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  modalBtnSave: {
    backgroundColor: AppColors.primary,
    flex: 1,
  },
  modalBtnSaveText: {
    fontSize: 13,
    color: AppColors.white,
    fontWeight: 'bold',
  },
});
