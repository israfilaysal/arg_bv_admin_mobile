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
import { PricePlanItem, BillingPeriod } from '../types';
import { Ionicons } from '@expo/vector-icons';

export const PricePlansScreen: React.FC = () => {
  const [plans, setPlans] = useState<PricePlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricePlanItem | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [period, setPeriod] = useState<BillingPeriod>(BillingPeriod.Monthly);
  const [status, setStatus] = useState<number>(1); // 1: Satışta, 0: Pasif
  const [actionLoading, setActionLoading] = useState(false);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await serviceAdmin.getPricePlanList();
      const list = res.value || res.data || (res as any).Data || (res as any).Value;
      if (res.resulttype == 1 && Array.isArray(list)) {
        setPlans(list);
      } else {
        setPlans([]);
      }
    } catch {
      Alert.alert('Hata', 'Fiyat planları yüklenemedi.');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openAddModal = () => {
    setEditingPlan(null);
    setName('');
    setCode('');
    setPrice('');
    setOriginalPrice('');
    setPeriod(BillingPeriod.Monthly);
    setStatus(1);
    setModalVisible(true);
  };

  const openEditModal = (item: PricePlanItem) => {
    setEditingPlan(item);
    setName(item.name || '');
    setCode(item.code || '');
    setPrice(item.price !== undefined && item.price !== null ? String(item.price) : '');
    setOriginalPrice(item.originalprice !== undefined && item.originalprice !== null ? String(item.originalprice) : '');
    setPeriod(item.billingperiod == BillingPeriod.Yearly ? BillingPeriod.Yearly : BillingPeriod.Monthly);
    setStatus(item.status == 0 ? 0 : 1);
    setModalVisible(true);
  };

  const handleToggleStatus = (item: PricePlanItem) => {
    const isCurrentlyActive = item.status == 1;
    const newStatus = isCurrentlyActive ? 0 : 1;
    const actionText = isCurrentlyActive ? 'satıştan kaldırıp pasife almak' : 'tekrar satışa açmak';

    Alert.alert(
      isCurrentlyActive ? 'Paketi Pasife Al' : 'Paketi Satışa Aç',
      `"${item.name}" paketini ${actionText} istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: isCurrentlyActive ? 'Pasife Al' : 'Satışa Aç',
          style: isCurrentlyActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const payload: Partial<PricePlanItem> = {
                ...item,
                status: newStatus,
              };
              const res = await serviceAdmin.savePricePlan(payload);
              if (res.resulttype == 1) {
                Alert.alert('Başarılı', `Paket ${isCurrentlyActive ? 'pasife alındı' : 'satışa açıldı'}.`);
                setPlans((prev) =>
                  prev.map((p) => (p.id === item.id ? { ...p, status: newStatus } : p))
                );
              } else {
                Alert.alert('Bilgi', res.message || 'Durum güncellendi.');
                loadPlans();
              }
            } catch {
              Alert.alert('Hata', 'Durum güncellenirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !code.trim() || !price.trim()) {
      Alert.alert('Uyarı', 'Lütfen paket adı, kodu ve fiyatını giriniz.');
      return;
    }

    setActionLoading(true);
    try {
      const payload: Partial<PricePlanItem> = {
        ...(editingPlan || {}),
        name: name.trim(),
        code: code.trim(),
        price: parseFloat(price) || 0,
        originalprice: originalPrice ? parseFloat(originalPrice) : 0,
        billingperiod: period,
        currency: 'TRY',
        status: status,
      };

      const res = await serviceAdmin.savePricePlan(payload);
      if (res.resulttype == 1) {
        Alert.alert('Başarılı', editingPlan ? 'Paket güncellendi.' : 'Yeni paket kaydedildi.');
        setModalVisible(false);
        loadPlans();
      } else {
        Alert.alert('Bilgi', res.message || 'İşlem tamamlandı.');
        setModalVisible(false);
        loadPlans();
      }
    } catch {
      Alert.alert('Hata', 'Paket kaydedilirken hata oluştu.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (item: PricePlanItem) => {
    Alert.alert('Silme Onayı', `"${item.name}" paketini tamamen silmek istediğinize emin misiniz? (Tavsiye: Paketi silmek yerine pasife de alabilirsiniz)`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const res = await serviceAdmin.deletePricePlan(item.id);
          if (res.resulttype == 1) {
            Alert.alert('Başarılı', 'Paket silindi.');
            setPlans((prev) => prev.filter((p) => p.id !== item.id));
          } else {
            Alert.alert('Bilgi', res.message || 'Paket silindi.');
            setPlans((prev) => prev.filter((p) => p.id !== item.id));
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: PricePlanItem }) => {
    const isYearly = item.billingperiod == BillingPeriod.Yearly;
    const isActive = item.status == 1;

    return (
      <View style={[styles.card, !isActive && styles.cardPassive]}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: !isActive
                  ? '#f1f5f9'
                  : isYearly
                  ? AppColors.secondaryBg
                  : AppColors.primaryLight,
              },
            ]}
          >
            <Ionicons
              name={!isActive ? 'pause' : isYearly ? 'ribbon' : 'calendar'}
              size={20}
              color={!isActive ? '#64748b' : isYearly ? AppColors.secondary : AppColors.primary}
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.planName, !isActive && { color: AppColors.textSecondary }]}>
              {item.name}
            </Text>
            <Text style={styles.planCode}>
              {item.code} • {isYearly ? 'Yıllık Periyot' : 'Aylık Periyot'}
            </Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: AppColors.primaryLight }]}
              onPress={() => openEditModal(item)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="pencil" size={15} color={AppColors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: isActive ? '#fef3c7' : '#dcfce7' },
              ]}
              onPress={() => handleToggleStatus(item)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name={isActive ? 'pause-circle' : 'play-circle'}
                size={17}
                color={isActive ? '#d97706' : AppColors.successDark}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: AppColors.dangerLight }]}
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="trash-outline" size={15} color={AppColors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>Fiyat</Text>
            <View style={styles.priceValRow}>
              <Text style={[styles.priceText, !isActive && { color: AppColors.textSecondary }]}>
                ₺{Number(item.price).toLocaleString('tr-TR')}
              </Text>
              {item.originalprice && item.originalprice > item.price ? (
                <Text style={styles.originalPriceText}>
                  ₺{Number(item.originalprice).toLocaleString('tr-TR')}
                </Text>
              ) : null}
            </View>
          </View>

          {isActive ? (
            <View style={styles.badgeActive}>
              <Ionicons name="checkmark-circle" size={12} color={AppColors.successDark} style={{ marginRight: 3 }} />
              <Text style={styles.badgeActiveText}>Satışta</Text>
            </View>
          ) : (
            <View style={styles.badgePassive}>
              <Ionicons name="pause-circle" size={12} color="#991b1b" style={{ marginRight: 3 }} />
              <Text style={styles.badgePassiveText}>Pasif (Satış Dışı)</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.pageTitle}>Abonelik & Fiyat Planları</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add" size={20} color={AppColors.white} />
          <Text style={styles.addBtnText}>Yeni Paket</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color="#D71920" size="small" />
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadPlans}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="pricetags-outline" size={48} color={AppColors.textMuted} />
              <Text style={styles.emptyText}>Kayıtlı fiyat planı bulunamadı.</Text>
            </View>
          }
        />
      )}

      {/* Paket Ekle / Düzenle Modalı */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPlan ? 'Paketi Düzenle' : 'Yeni Abonelik Paketi'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={AppColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Paket Adı *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Örn: Esnaf Pro Paketi"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Paket Kodu *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Örn: PLAN_PRO_MONTHLY"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />

            <View style={styles.inputSplitRow}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <Text style={styles.inputLabel}>Fiyat (₺) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="399"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.inputLabel}>Liste / Eski Fiyat (₺)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="499"
                  value={originalPrice}
                  onChangeText={setOriginalPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Faturalama Periyodu</Text>
            <View style={styles.periodRow}>
              <TouchableOpacity
                style={[styles.periodBtn, period === BillingPeriod.Monthly && styles.periodBtnActive]}
                onPress={() => setPeriod(BillingPeriod.Monthly)}
              >
                <Text style={[styles.periodBtnText, period === BillingPeriod.Monthly && styles.periodBtnTextActive]}>
                  Aylık
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodBtn, period === BillingPeriod.Yearly && styles.periodBtnActive]}
                onPress={() => setPeriod(BillingPeriod.Yearly)}
              >
                <Text style={[styles.periodBtnText, period === BillingPeriod.Yearly && styles.periodBtnTextActive]}>
                  Yıllık
                </Text>
              </TouchableOpacity>
            </View>

            {/* Durum Seçimi: Satışta (1) / Pasif (0) */}
            <Text style={styles.inputLabel}>Paket Satış Durumu</Text>
            <View style={styles.statusRow}>
              <TouchableOpacity
                style={[styles.statusOptionBtn, status === 1 && styles.statusOptionActive]}
                onPress={() => setStatus(1)}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={status === 1 ? AppColors.successDark : AppColors.textMuted}
                />
                <Text style={[styles.statusOptionText, status === 1 && styles.statusOptionTextActive]}>
                  Satışta (Aktif)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusOptionBtn, status === 0 && styles.statusOptionPassive]}
                onPress={() => setStatus(0)}
              >
                <Ionicons
                  name="pause-circle"
                  size={16}
                  color={status === 0 ? '#991b1b' : AppColors.textMuted}
                />
                <Text style={[styles.statusOptionText, status === 0 && styles.statusOptionTextPassive]}>
                  Pasif (Satış Dışı)
                </Text>
              </TouchableOpacity>
            </View>

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
                  <Text style={styles.modalBtnSaveText}>
                    {editingPlan ? 'Güncelle' : 'Kaydet'}
                  </Text>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  cardPassive: {
    backgroundColor: '#fafafa',
    borderColor: '#e5e7eb',
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  planName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  planCode: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
  },
  priceLabel: {
    fontSize: 11,
    color: AppColors.textMuted,
  },
  priceValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  originalPriceText: {
    fontSize: 13,
    color: AppColors.textMuted,
    textDecorationLine: 'line-through',
  },
  badgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeActiveText: {
    fontSize: 11,
    color: AppColors.successDark,
    fontWeight: 'bold',
  },
  badgePassive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePassiveText: {
    fontSize: 11,
    color: '#991b1b',
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statusOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.background,
    gap: 6,
  },
  statusOptionActive: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  statusOptionPassive: {
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  statusOptionText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  statusOptionTextActive: {
    color: '#166534',
    fontWeight: 'bold',
  },
  statusOptionTextPassive: {
    color: '#991b1b',
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
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 4,
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.background,
  },
  inputSplitRow: {
    flexDirection: 'row',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.background,
  },
  periodBtnActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primaryLight,
  },
  periodBtnText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  periodBtnTextActive: {
    color: AppColors.primary,
    fontWeight: 'bold',
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
  modalBtnSave: {
    backgroundColor: AppColors.primary,
  },
  modalBtnSaveText: {
    fontSize: 13,
    color: AppColors.white,
    fontWeight: 'bold',
  },
});
