import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { AppColors } from '../constants/theme';
import { serviceAdmin } from '../services/serviceAdmin';
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
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [organization, setOrganization] = useState('arg');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123qqqQ');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>(LIVE_PORTAL_URL);
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [editUrl, setEditUrl] = useState('');

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    const url = await serviceStorage.getBaseUrl();
    if (url) {
      setCurrentUrl(url);
    }
    const creds = await serviceStorage.getSavedCredentials();
    if (creds) {
      if (creds.username) setUsername(creds.username);
      if (creds.password) setPassword(creds.password);
      if (creds.organization) setOrganization(creds.organization);
    }
  };

  const openServerModal = () => {
    setEditUrl(currentUrl);
    setServerModalVisible(true);
  };

  const handleSaveServer = async () => {
    if (!editUrl.trim()) return;
    const normalized = normalizePortalUrl(editUrl.trim());
    await serviceStorage.setBaseUrl(normalized);
    const updated = await serviceStorage.getBaseUrl();
    setCurrentUrl(updated);
    setServerModalVisible(false);
    Alert.alert('Sunucu Güncellendi', `Bağlanılacak portal adresi:\n${updated}`);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Uyarı', 'Lütfen kullanıcı adı ve şifre giriniz.');
      return;
    }

    setLoading(true);
    try {
      // 1. Aktif sunucu adresini kaydet
      await serviceStorage.setBaseUrl(currentUrl);

      // 2. Giriş isteği gönder
      const res = await serviceAdmin.loginWithPassword(
        username.trim(),
        password,
        organization.trim() || 'arg'
      );
      const data = res.value || res.data || (res as any).Data || (res as any).Value;
      const token =
        data?.token ||
        data?.Token ||
        data?.accesstoken ||
        data?.AccessToken ||
        data?.jwt ||
        data?.Jwt;

      if (res.resulttype == 1 && token) {
        // 3. Oturumu kalıcı olarak kaydet
        await serviceStorage.setToken(token);
        const userData = data?.userInfoEntity || data?.user || data;
        await serviceStorage.setUserData(userData);
        await serviceStorage.setSavedCredentials({
          username: username.trim(),
          password,
          organization: organization.trim() || 'arg',
        });
        onLoginSuccess();
      } else {
        const errorMsg =
          res.description ||
          res.Description ||
          res.message ||
          'Organizasyon, kullanıcı adı veya şifre hatalı.';
        Alert.alert('Giriş Başarısız', `${errorMsg}\n\n(Sunucu: ${currentUrl})`);
      }
    } catch (e: any) {
      Alert.alert('Bağlantı Hatası', e?.message || 'Sunucuya bağlanırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <AppLogo size={80} withBadge />
            </View>
            <Text style={styles.brandTitle}>BUNDAN VAR MI?</Text>
            <Text style={styles.subTitle}>Yönetici Paneli (Admin Portal)</Text>
          </View>

          {/* Aktif Sunucu Çubuğu */}
          <TouchableOpacity style={styles.serverBar} onPress={openServerModal}>

            <Ionicons
              name={currentUrl.includes('admin.bundanvarmi.com') ? 'cloud-done' : 'server'}
              size={14}
              color={currentUrl.includes('admin.bundanvarmi.com') ? AppColors.primary : AppColors.secondary}
            />
            <Text style={styles.serverBarText} numberOfLines={1}>
              {currentUrl.includes('admin.bundanvarmi.com') ? 'Canlı Portal' : 'Lokal IIS'}: {currentUrl}
            </Text>
            <Text style={styles.serverBarAction}>Değiştir</Text>
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Organizasyon Kodu</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: arg"
              placeholderTextColor={AppColors.textMuted}
              value={organization}
              onChangeText={setOrganization}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kullanıcı Adı</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: admin"
              placeholderTextColor={AppColors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                placeholder="••••••••"
                placeholderTextColor={AppColors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={AppColors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={AppColors.white} size="small" />
            ) : (
              <Text style={styles.loginBtnText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sunucu Seçim Modalı */}
      <Modal visible={serverModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Portal Bağlantısı Seçin</Text>
              <TouchableOpacity onPress={() => setServerModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={22} color={AppColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.presetRow}>
              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  editUrl.includes('admin.bundanvarmi.com') && styles.presetBtnActive,
                ]}
                onPress={() => setEditUrl(LIVE_PORTAL_URL)}
              >
                <Ionicons
                  name="cloud-outline"
                  size={15}
                  color={editUrl.includes('admin.bundanvarmi.com') ? AppColors.white : AppColors.primary}
                />
                <Text
                  style={[
                    styles.presetBtnText,
                    editUrl.includes('admin.bundanvarmi.com') && styles.presetBtnTextActive,
                  ]}
                >
                  Canlı
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
                  editUrl.includes('local.argteknoloji.com') && styles.presetBtnActive,
                ]}
                onPress={() => setEditUrl(LOCAL_PORTAL_URL)}
              >
                <Ionicons
                  name="server-outline"
                  size={15}
                  color={editUrl.includes('local.argteknoloji.com') ? AppColors.white : AppColors.secondary}
                />
                <Text
                  style={[
                    styles.presetBtnText,
                    editUrl.includes('local.argteknoloji.com') && styles.presetBtnTextActive,
                  ]}
                >
                  Lokal IIS
                </Text>
              </TouchableOpacity>
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

            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Aktif Portal Kökü:</Text>
              <Text style={styles.previewValue}>{normalizePortalUrl(editUrl)}</Text>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setServerModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Vazgeç</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleSaveServer}
              >
                <Text style={styles.modalBtnSaveText}>Kaydet ve Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: AppColors.surface,
    padding: 26,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.primary,
    letterSpacing: 0.5,
  },
  subTitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: AppColors.textPrimary,
    backgroundColor: '#FAFAFA',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeBtn: {
    height: 48,
    width: 48,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: AppColors.border,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtn: {
    backgroundColor: AppColors.primary,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginBtnText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  serverBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 16,
    gap: 6,
  },
  serverBarText: {
    flex: 1,
    fontSize: 11,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  serverBarAction: {
    fontSize: 11,
    color: AppColors.primary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
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
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 16,
    backgroundColor: AppColors.background,
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 6,
    marginTop: 6,
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
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: AppColors.borderLight,
  },
  modalBtnCancelText: {
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

