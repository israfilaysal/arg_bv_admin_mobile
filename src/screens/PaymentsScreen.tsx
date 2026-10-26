import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { AppColors } from '../constants/theme';
import { serviceAdmin } from '../services/serviceAdmin';
import { PaymentItem, SubscriptionItem, PaymentStatus, SubscriptionStatus } from '../types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export const PaymentsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payments' | 'subscriptions'>('payments');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');
  const [subFilter, setSubFilter] = useState<'all' | 'active' | 'other'>('all');

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Detay Modal State
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resPay, resSub] = await Promise.all([
        serviceAdmin.getPaymentList(),
        serviceAdmin.getSubscriptionList(),
      ]);

      const listPay = resPay.value || resPay.data || (resPay as any).Data || (resPay as any).Value;
      if (resPay.resulttype == 1 && Array.isArray(listPay)) {
        setPayments(listPay);
      } else {
        setPayments([]);
      }

      const listSub = resSub.value || resSub.data || (resSub as any).Data || (resSub as any).Value;
      if (resSub.resulttype == 1 && Array.isArray(listSub)) {
        setSubscriptions(listSub);
      } else {
        setSubscriptions([]);
      }
    } catch {
      Alert.alert('Hata', 'Ödeme ve abonelik verileri alınamadı.');
      setPayments([]);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Toplam Gelir: status === PaymentStatus.Success (2) olan ödemelerin tutarı
  const totalRevenue = useMemo(() => {
    return payments
      .filter((p) => p.status == PaymentStatus.Success)
      .reduce((acc, curr) => {
        const val = Number(curr.amount ?? curr.paidamount ?? curr.price ?? 0);
        return acc + val;
      }, 0);
  }, [payments]);

  // Sayılar
  const payCounts = useMemo(() => {
    const success = payments.filter((p) => p.status == PaymentStatus.Success).length;
    const pending = payments.filter((p) => p.status == PaymentStatus.Pending).length;
    const failed = payments.filter((p) => p.status != PaymentStatus.Success && p.status != PaymentStatus.Pending).length;
    return { all: payments.length, success, pending, failed };
  }, [payments]);

  const subCounts = useMemo(() => {
    const active = subscriptions.filter((s) => s.status == SubscriptionStatus.Active).length;
    const other = subscriptions.filter((s) => s.status != SubscriptionStatus.Active).length;
    return { all: subscriptions.length, active, other };
  }, [subscriptions]);

  // Filtrelenmiş Listeler
  const filteredPayments = useMemo(() => {
    if (paymentFilter === 'success') {
      return payments.filter((p) => p.status == PaymentStatus.Success);
    }
    if (paymentFilter === 'pending') {
      return payments.filter((p) => p.status == PaymentStatus.Pending);
    }
    if (paymentFilter === 'failed') {
      return payments.filter((p) => p.status != PaymentStatus.Success && p.status != PaymentStatus.Pending);
    }
    return payments;
  }, [payments, paymentFilter]);

  const filteredSubscriptions = useMemo(() => {
    if (subFilter === 'active') {
      return subscriptions.filter((s) => s.status == SubscriptionStatus.Active);
    }
    if (subFilter === 'other') {
      return subscriptions.filter((s) => s.status != SubscriptionStatus.Active);
    }
    return subscriptions;
  }, [subscriptions, subFilter]);

  const formatDate = (date?: any) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(date);
    }
  };

  const formatOnlyDate = (date?: any) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('tr-TR');
    } catch {
      return String(date);
    }
  };

  // Ödeme Durum Rozeti Hesaplama
  const getPaymentStatusConfig = (status: number | string) => {
    const st = Number(status);
    if (st == PaymentStatus.Success) {
      return {
        title: 'Başarılı',
        icon: 'checkmark-circle' as const,
        bg: '#dcfce7',
        color: '#166534',
        border: '#86efac',
      };
    }
    if (st == PaymentStatus.Pending) {
      return {
        title: 'Ödeme Bekliyor',
        icon: 'time-outline' as const,
        bg: '#fef3c7',
        color: '#92400e',
        border: '#fde68a',
      };
    }
    if (st == PaymentStatus.Cancelled) {
      return {
        title: 'Zaman Aşımı / İptal',
        icon: 'close-circle-outline' as const,
        bg: '#fee2e2',
        color: '#991b1b',
        border: '#fecaca',
      };
    }
    if (st == PaymentStatus.Refunded || st == PaymentStatus.PartiallyRefunded) {
      return {
        title: st == PaymentStatus.Refunded ? 'İade Edildi' : 'Kısmi İade',
        icon: 'return-up-back-outline' as const,
        bg: '#ede9fe',
        color: '#6d28d9',
        border: '#ddd6fe',
      };
    }
    return {
      title: 'Başarısız',
      icon: 'alert-circle' as const,
      bg: '#fee2e2',
      color: '#991b1b',
      border: '#fecaca',
    };
  };

  // Abonelik Durum Rozeti Hesaplama
  const getSubscriptionStatusConfig = (status: number | string) => {
    const st = Number(status);
    if (st == SubscriptionStatus.Active) {
      return {
        title: 'Aktif Abonelik',
        bg: '#dcfce7',
        color: '#166534',
        border: '#86efac',
      };
    }
    if (st == SubscriptionStatus.PendingPayment) {
      return {
        title: 'Ödeme Bekliyor',
        bg: '#fef3c7',
        color: '#92400e',
        border: '#fde68a',
      };
    }
    if (st == SubscriptionStatus.Expired) {
      return {
        title: 'Süresi Doldu',
        bg: '#fee2e2',
        color: '#991b1b',
        border: '#fecaca',
      };
    }
    if (st == SubscriptionStatus.Cancelled) {
      return {
        title: 'İptal Edildi',
        bg: '#f1f5f9',
        color: '#475569',
        border: '#cbd5e1',
      };
    }
    if (st == SubscriptionStatus.Replaced) {
      return {
        title: 'Yükseltildi',
        bg: '#e0e7ff',
        color: '#3730a3',
        border: '#c7d2fe',
      };
    }
    return {
      title: 'Pasif',
      bg: '#f1f5f9',
      color: '#64748b',
      border: '#e2e8f0',
    };
  };

  const getProviderName = (provider?: string) => {
    if (!provider) return 'iyzico Sanal POS';
    if (provider.toLowerCase() === 'free') return 'Ücretsiz (Hoşgeldin Paketi)';
    if (provider.toLowerCase() === 'iyzico') return 'iyzico Sanal POS';
    return provider;
  };

  const renderPaymentItem = ({ item }: { item: PaymentItem }) => {
    const statusCfg = getPaymentStatusConfig(item.status);
    const amountVal = Number(item.amount ?? item.paidamount ?? item.price ?? 0);
    const isFree = amountVal === 0 || item.paymentprovider?.toLowerCase() === 'free';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => setSelectedPayment(item)}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.payIconWrap,
              { backgroundColor: isFree ? '#ecfdf5' : AppColors.secondaryBg },
            ]}
          >
            <Ionicons
              name={isFree ? 'gift-outline' : 'card-outline'}
              size={20}
              color={isFree ? '#059669' : AppColors.secondary}
            />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.companyTitle} numberOfLines={1}>
              {item.companyname || `Firma #${item.companyid || item.id}`}
            </Text>
            <Text style={styles.planSub} numberOfLines={1}>
              {item.planname || 'Abonelik Paketi'}
            </Text>
          </View>

          <View style={styles.priceWrap}>
            <Text style={styles.priceText}>
              {isFree ? '0 ₺ (Ücretsiz)' : `₺${amountVal.toLocaleString('tr-TR')}`}
            </Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: statusCfg.bg, borderColor: statusCfg.border, borderWidth: 1 },
              ]}
            >
              <Ionicons
                name={statusCfg.icon}
                size={11}
                color={statusCfg.color}
                style={{ marginRight: 3 }}
              />
              <Text style={[styles.badgeText, { color: statusCfg.color }]}>
                {statusCfg.title}
              </Text>
            </View>
          </View>
        </View>

        {/* Hata Mesajı Varsa Banner */}
        {!!item.errormessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={14} color="#991b1b" style={{ marginRight: 6 }} />
            <Text style={styles.errorBannerText} numberOfLines={2}>
              {item.errormessage}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            <Ionicons name="time-outline" size={13} color={AppColors.textMuted} /> {formatDate(item.createtime)}
          </Text>
          <View style={styles.providerBadge}>
            <Text style={styles.gatewayText}>{getProviderName(item.paymentprovider)}</Text>
            <Ionicons name="chevron-forward" size={12} color={AppColors.textMuted} style={{ marginLeft: 4 }} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSubscriptionItem = ({ item }: { item: SubscriptionItem }) => {
    const statusCfg = getSubscriptionStatusConfig(item.status);
    const amountVal = Number(item.paidamount ?? 0);
    const isFree = amountVal === 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.payIconWrap, { backgroundColor: AppColors.primaryLight }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={AppColors.primary} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.companyTitle} numberOfLines={1}>
              {item.companyname || `Firma #${item.companyid || item.id}`}
            </Text>
            <Text style={styles.planSub} numberOfLines={1}>
              {item.planname || 'Abonelik Paketi'}
            </Text>
          </View>
          <View style={styles.priceWrap}>
            <Text style={styles.priceText}>
              {isFree ? '0 ₺ (Ücretsiz)' : `₺${amountVal.toLocaleString('tr-TR')}`}
            </Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: statusCfg.bg, borderColor: statusCfg.border, borderWidth: 1 },
              ]}
            >
              <Text style={[styles.badgeText, { color: statusCfg.color }]}>
                {statusCfg.title}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.subDatesRow}>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Başlangıç</Text>
            <Text style={styles.dateVal}>{formatOnlyDate(item.startdate)}</Text>
          </View>
          <View style={styles.dateDivider} />
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Bitiş Tarihi</Text>
            <Text style={styles.dateVal}>{formatOnlyDate(item.enddate)}</Text>
          </View>
          <View style={styles.dateDivider} />
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Yenileme</Text>
            <Text
              style={[
                styles.dateVal,
                { color: Number(item.autorenew) === 1 ? '#166534' : AppColors.textSecondary },
              ]}
            >
              {Number(item.autorenew) === 1 ? 'Açık' : 'Kapalı'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Gelir ve İstatistik KPI Kartı */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <View>
            <Text style={styles.kpiLabel}>Toplam Başarılı Tahsilat</Text>
            <Text style={styles.kpiValue}>₺{totalRevenue.toLocaleString('tr-TR')}</Text>
          </View>
          <View style={styles.kpiIconWrap}>
            <Ionicons name="trending-up" size={24} color={AppColors.secondary} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.miniStatCard}>
            <Text style={styles.miniStatNum}>{payCounts.success}</Text>
            <Text style={styles.miniStatLabel}>Başarılı Ödeme</Text>
          </View>
          <View style={styles.miniStatCard}>
            <Text style={styles.miniStatNum}>{subCounts.active}</Text>
            <Text style={styles.miniStatLabel}>Aktif Abonelik</Text>
          </View>
          <View style={styles.miniStatCard}>
            <Text style={[styles.miniStatNum, { color: payCounts.failed > 0 ? '#dc2626' : AppColors.textPrimary }]}>
              {payCounts.failed}
            </Text>
            <Text style={styles.miniStatLabel}>Hata / İptal</Text>
          </View>
        </View>
      </View>

      {/* Ana Sekmeler */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'payments' && styles.tabBtnActive]}
          onPress={() => setActiveTab('payments')}
        >
          <Ionicons
            name="receipt-outline"
            size={16}
            color={activeTab === 'payments' ? AppColors.white : AppColors.textSecondary}
          />
          <Text style={[styles.tabBtnText, activeTab === 'payments' && styles.tabBtnTextActive]}>
            Ödemeler ({payments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'subscriptions' && styles.tabBtnActive]}
          onPress={() => setActiveTab('subscriptions')}
        >
          <Ionicons
            name="ribbon-outline"
            size={16}
            color={activeTab === 'subscriptions' ? AppColors.white : AppColors.textSecondary}
          />
          <Text style={[styles.tabBtnText, activeTab === 'subscriptions' && styles.tabBtnTextActive]}>
            Abonelikler ({subscriptions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Alt Filtre Butonları */}
      {activeTab === 'payments' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, paymentFilter === 'all' && styles.filterChipActive]}
            onPress={() => setPaymentFilter('all')}
          >
            <Text style={[styles.filterChipText, paymentFilter === 'all' && styles.filterChipTextActive]}>
              Tümü ({payCounts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, paymentFilter === 'success' && styles.filterChipActive]}
            onPress={() => setPaymentFilter('success')}
          >
            <View style={[styles.chipDot, { backgroundColor: '#16a34a' }]} />
            <Text style={[styles.filterChipText, paymentFilter === 'success' && styles.filterChipTextActive]}>
              Başarılı ({payCounts.success})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, paymentFilter === 'pending' && styles.filterChipActive]}
            onPress={() => setPaymentFilter('pending')}
          >
            <View style={[styles.chipDot, { backgroundColor: '#d97706' }]} />
            <Text style={[styles.filterChipText, paymentFilter === 'pending' && styles.filterChipTextActive]}>
              Ödeme Bekliyor ({payCounts.pending})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, paymentFilter === 'failed' && styles.filterChipActive]}
            onPress={() => setPaymentFilter('failed')}
          >
            <View style={[styles.chipDot, { backgroundColor: '#dc2626' }]} />
            <Text style={[styles.filterChipText, paymentFilter === 'failed' && styles.filterChipTextActive]}>
              Hatalı / İptal ({payCounts.failed})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, subFilter === 'all' && styles.filterChipActive]}
            onPress={() => setSubFilter('all')}
          >
            <Text style={[styles.filterChipText, subFilter === 'all' && styles.filterChipTextActive]}>
              Tümü ({subCounts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, subFilter === 'active' && styles.filterChipActive]}
            onPress={() => setSubFilter('active')}
          >
            <View style={[styles.chipDot, { backgroundColor: '#16a34a' }]} />
            <Text style={[styles.filterChipText, subFilter === 'active' && styles.filterChipTextActive]}>
              Aktif ({subCounts.active})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, subFilter === 'other' && styles.filterChipActive]}
            onPress={() => setSubFilter('other')}
          >
            <View style={[styles.chipDot, { backgroundColor: '#64748b' }]} />
            <Text style={[styles.filterChipText, subFilter === 'other' && styles.filterChipTextActive]}>
              Süresi Dolan / Diğer ({subCounts.other})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Liste */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color="#D71920" size="small" />
        </View>
      ) : activeTab === 'payments' ? (
        <FlatList
          data={filteredPayments}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPaymentItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadData}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={AppColors.textMuted} />
              <Text style={styles.emptyText}>Bu filtreye uygun ödeme kaydı bulunmuyor.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredSubscriptions}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSubscriptionItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadData}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="ribbon-outline" size={48} color={AppColors.textMuted} />
              <Text style={styles.emptyText}>Bu filtreye uygun abonelik kaydı bulunmuyor.</Text>
            </View>
          }
        />
      )}

      {/* ÖDEME DETAY VE RAW LOG MODALI (Modal Header Standard) */}
      <Modal
        visible={!!selectedPayment}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPayment(null)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.modalContainer}>
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                İşlem Detayı #{selectedPayment?.id}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedPayment(null)}
              >
                <MaterialIcons name="close" size={22} color={AppColors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            {selectedPayment && (
              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
                {/* Durum Özeti Kutusu */}
                <View style={styles.detailSummaryBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailCompany}>{selectedPayment.companyname || 'Bilinmeyen Firma'}</Text>
                    <Text style={styles.detailPlan}>{selectedPayment.planname || 'Abonelik Paketi'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.detailPrice}>
                      {Number(selectedPayment.amount ?? selectedPayment.price ?? 0) === 0
                        ? '0 ₺ (Ücretsiz)'
                        : `₺${Number(selectedPayment.amount ?? selectedPayment.price ?? 0).toLocaleString('tr-TR')}`}
                    </Text>
                    {(() => {
                      const cfg = getPaymentStatusConfig(selectedPayment.status);
                      return (
                        <View style={[styles.badge, { backgroundColor: cfg.bg, marginTop: 4 }]}>
                          <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.title}</Text>
                        </View>
                      );
                    })()}
                  </View>
                </View>

                {/* Hata Mesajı Varsa Göster */}
                {!!selectedPayment.errormessage && (
                  <View style={styles.errorMessageBox}>
                    <Ionicons name="alert-circle" size={18} color="#991b1b" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.errorMessageTitle}>Sağlayıcı Hata Mesajı:</Text>
                      <Text style={styles.errorMessageText}>
                        {selectedPayment.errormessage}
                        {selectedPayment.errorcode ? ` (Kod: ${selectedPayment.errorcode})` : ''}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Detay Bilgi Tablosu */}
                <View style={styles.infoTable}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Sağlayıcı</Text>
                    <Text style={styles.infoVal}>{getProviderName(selectedPayment.paymentprovider)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>İşlem No / Kod</Text>
                    <Text style={styles.infoVal}>
                      {selectedPayment.providerpaymentid || selectedPayment.conversationid || '-'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>İşlem Tarihi</Text>
                    <Text style={styles.infoVal}>{formatDate(selectedPayment.createtime)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Para Birimi</Text>
                    <Text style={styles.infoVal}>{selectedPayment.currency || 'TRY'}</Text>
                  </View>
                </View>

                {/* Ham Log / Raw Response Gösterimi */}
                {!!selectedPayment.rawresponse && (
                  <View style={styles.logSection}>
                    <Text style={styles.logTitle}>Sağlayıcı Yanıtı (Raw Response)</Text>
                    <View style={styles.logBox}>
                      <Text style={styles.logText}>
                        {(() => {
                          try {
                            return JSON.stringify(JSON.parse(selectedPayment.rawresponse), null, 2);
                          } catch {
                            return selectedPayment.rawresponse;
                          }
                        })()}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Ham İstek / Raw Request Gösterimi */}
                {!!selectedPayment.rawrequest && (
                  <View style={styles.logSection}>
                    <Text style={styles.logTitle}>Sağlayıcı İsteği (Raw Request)</Text>
                    <View style={styles.logBox}>
                      <Text style={[styles.logText, { color: '#38bdf8' }]}>
                        {(() => {
                          try {
                            return JSON.stringify(JSON.parse(selectedPayment.rawrequest), null, 2);
                          } catch {
                            return selectedPayment.rawrequest;
                          }
                        })()}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
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
  kpiContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  kpiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginTop: 2,
  },
  kpiIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.secondaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: AppColors.surface,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
  },
  miniStatNum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  miniStatLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#E2E8F0',
    padding: 4,
    borderRadius: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: AppColors.secondary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  tabBtnTextActive: {
    color: AppColors.white,
  },
  filterScroll: {
    maxHeight: 38,
    marginBottom: 8,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  filterChipActive: {
    backgroundColor: AppColors.secondaryBg,
    borderColor: AppColors.secondary,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: AppColors.secondary,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  companyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  planSub: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorBannerText: {
    fontSize: 11,
    color: '#991b1b',
    flex: 1,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    color: AppColors.textMuted,
  },
  gatewayText: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  subDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
  },
  dateCol: {
    flex: 1,
    alignItems: 'center',
  },
  dateDivider: {
    width: 1,
    height: 24,
    backgroundColor: AppColors.border,
  },
  dateLabel: {
    fontSize: 10,
    color: AppColors.textMuted,
    marginBottom: 2,
  },
  dateVal: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textPrimary,
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
    fontSize: 13,
    color: AppColors.textMuted,
    marginTop: 10,
  },

  // MODAL HEADER STANDARD
  modalSafeArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
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
    flexGrow: 1,
  },
  modalContent: {
    padding: 16,
    paddingBottom: 32,
  },
  detailSummaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AppColors.background,
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  detailCompany: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  detailPlan: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  detailPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  errorMessageBox: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorMessageTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#991b1b',
  },
  errorMessageText: {
    fontSize: 12,
    color: '#991b1b',
    marginTop: 2,
    lineHeight: 16,
  },
  infoTable: {
    backgroundColor: AppColors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
  },
  infoLabel: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  logSection: {
    marginTop: 8,
  },
  logTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 6,
  },
  logBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    maxHeight: 200,
  },
  logText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#4ade80',
    lineHeight: 16,
  },
});
