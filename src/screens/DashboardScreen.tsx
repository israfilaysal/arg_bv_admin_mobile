import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AppColors } from '../constants/theme';
import { serviceAdmin } from '../services/serviceAdmin';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { AppLogo } from '../components/AppLogo';

interface Props {
  navigation: any;
}

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    pendingCompanies: 0,
    activeCompanies: 0,
    totalDemands: 0,
    activeDemands: 0,
    urgentDemands: 0,
    totalCategories: 0,
    totalReports: 0,
    pendingReports: 0,
    totalSuccessRevenue: 0,
  });

  const loadData = async () => {
    setErrorMessage(null);
    try {
      const res = await serviceAdmin.getDashboardSummary();
      const val = res.data || res.Data || res.value || res.Value;
      if (res.resulttype == 1 && val) {
        setStats({
          totalUsers: val.totalusers ?? val.totalUsers ?? 0,
          totalCompanies: val.totalcompanies ?? val.totalCompanies ?? 0,
          pendingCompanies: val.pendingcompanies ?? val.pendingCompanies ?? 0,
          activeCompanies: val.activecompanies ?? val.activeCompanies ?? 0,
          totalDemands: val.totaldemands ?? val.totalDemands ?? 0,
          activeDemands: val.activedemands ?? val.activeDemands ?? 0,
          urgentDemands: val.urgentdemands ?? val.urgentDemands ?? 0,
          totalCategories: val.totalcategories ?? val.totalCategories ?? 0,
          totalReports: val.totalreports ?? val.totalReports ?? 0,
          pendingReports: val.pendingreports ?? val.pendingReports ?? 0,
          totalSuccessRevenue: Number(val.totalsuccessrevenue ?? val.totalSuccessRevenue ?? 0),
        });
      } else {
        const msg = res.description || res.Description || res.message || 'Veriler alınamadı.';
        setErrorMessage(msg);
      }
    } catch (e: any) {
      console.warn('Dashboard fetch error', e);
      setErrorMessage(e?.message || 'Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={AppColors.primary}
        />
      }
    >
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <AppLogo size={42} withBadge />
          <View>
            <Text style={styles.headerTitle}>Yönetici Paneli</Text>
            <Text style={styles.headerSub}>Bundan Var Mı? Platform Durumu</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={18} color={AppColors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#D71920" />
        </View>
      ) : (
        <View style={styles.content}>
          {/* Hata veya Yetki Uyarısı */}
          {errorMessage && (
            <View style={styles.infoBox}>
              <MaterialIcons name="info-outline" size={20} color={AppColors.accent} style={styles.infoIcon} />
              <Text style={styles.infoText}>{errorMessage}</Text>
            </View>
          )}

          {/* Onay Bekleyen Uyarısı */}
          {stats.pendingCompanies > 0 && (
            <TouchableOpacity
              style={styles.alertCard}
              onPress={() => navigation.navigate('Companies')}
            >
              <Ionicons name="alert-circle" size={24} color={AppColors.warning} />
              <View style={styles.alertTextWrap}>
                <Text style={styles.alertTitle}>Onay Bekleyen Firmalar</Text>
                <Text style={styles.alertDesc}>
                  {stats.pendingCompanies} adet firma evrak ve onay incelemesi bekliyor.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={AppColors.textMuted} />
            </TouchableOpacity>
          )}

          {/* Gelir Özeti Kartı */}
          <View style={styles.revenueCard}>
            <View>
              <Text style={styles.revLabel}>Tahsil Edilen Toplam Ciro</Text>
              <Text style={styles.revAmount}>
                ₺{Number(stats.totalSuccessRevenue || 0).toLocaleString('tr-TR')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.revBtn}
              onPress={() => navigation.navigate('Payments')}
            >
              <Text style={styles.revBtnText}>Detaylar</Text>
              <Ionicons name="arrow-forward" size={14} color={AppColors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Canlı Borsa & Talep Akışı Banner Kartı */}
          <TouchableOpacity
            style={styles.liveDemandsBanner}
            onPress={() => navigation.navigate('LiveDemands')}
          >
            <View style={styles.analyticsBannerLeft}>
              <View style={[styles.analyticsIconWrap, { backgroundColor: '#10B981' }]}>
                <Ionicons name="pulse" size={22} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Text style={styles.analyticsTitle}>Canlı Talep Akışı & Borsa</Text>
                  <View style={[styles.newBadge, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.newBadgeText}>CANLI PİYASA</Text>
                  </View>
                </View>
                <Text style={styles.analyticsSub}>
                  Türkiye geneli anlık talepler, esnaf yanıtları ve borsa terminali
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFF" />
          </TouchableOpacity>

          {/* Günlük Satış & Talep Analizi Banner Kartı */}
          <TouchableOpacity
            style={styles.analyticsBanner}
            onPress={() => navigation.navigate('DailySalesAnalysis')}
          >
            <View style={styles.analyticsBannerLeft}>
              <View style={styles.analyticsIconWrap}>
                <Ionicons name="trending-up" size={22} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Text style={styles.analyticsTitle}>Günlük Satış & Talep Analizi</Text>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>CANLI</Text>
                  </View>
                </View>
                <Text style={styles.analyticsSub}>
                  Talepler, esnaf teklifleri ve satış dönüşümlerinin detaylı analizi
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFF" />
          </TouchableOpacity>

          {/* İstatistik Grid */}
          <View style={styles.grid}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('Demands')}
            >
              <View style={[styles.iconWrap, { backgroundColor: AppColors.primaryLight }]}>
                <Ionicons name="chatbubbles-outline" size={22} color={AppColors.primary} />
              </View>
              <Text style={styles.cardNumber}>{stats.totalDemands}</Text>
              <Text style={styles.cardLabel}>Toplam Talep</Text>
              <Text style={styles.cardSub}>
                {stats.activeDemands} Aktif / Yayında
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('Companies')}
            >
              <View style={[styles.iconWrap, { backgroundColor: AppColors.secondaryBg }]}>
                <Ionicons name="business-outline" size={22} color={AppColors.secondary} />
              </View>
              <Text style={styles.cardNumber}>{stats.totalCompanies}</Text>
              <Text style={styles.cardLabel}>Kayıtlı Esnaf</Text>
              <Text style={styles.cardSub}>
                {stats.pendingCompanies > 0 ? `${stats.pendingCompanies} Bekliyor` : 'Aktif'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('Users')}
            >
              <View style={[styles.iconWrap, { backgroundColor: AppColors.successLight }]}>
                <Ionicons name="people-outline" size={22} color={AppColors.success} />
              </View>
              <Text style={styles.cardNumber}>{stats.totalUsers}</Text>
              <Text style={styles.cardLabel}>Toplam Kullanıcı</Text>
              <Text style={[styles.cardSub, { color: AppColors.success }]}>Aktif Üyeler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('Reports')}
            >
              <View style={[styles.iconWrap, { backgroundColor: AppColors.dangerLight }]}>
                <Ionicons name="flag-outline" size={22} color={AppColors.danger} />
              </View>
              <Text style={styles.cardNumber}>{stats.pendingReports || stats.totalReports}</Text>
              <Text style={styles.cardLabel}>Açık Şikayetler</Text>
              <Text style={[styles.cardSub, { color: AppColors.danger }]}>
                {stats.pendingReports > 0 ? `${stats.pendingReports} İnceleniyor` : 'Sorunsuz'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tüm Yönetim Modülleri */}
          <Text style={styles.sectionTitle}>Tüm Yönetim Modülleri</Text>
          <View style={styles.actionList}>
            <TouchableOpacity
              style={[styles.actionItem, { backgroundColor: 'rgba(215, 25, 32, 0.04)' }]}
              onPress={() => navigation.navigate('DailySalesAnalysis')}
            >
              <View style={styles.actionItemLeft}>
                <Ionicons name="analytics" size={20} color={AppColors.primary} />
                <Text style={[styles.actionText, { fontWeight: 'bold', color: AppColors.primary }]}>
                  Günlük Satış & Talep Analizi (Yeni)
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Companies')}
            >
              <View style={styles.actionItemLeft}>
                <Ionicons name="business" size={20} color={AppColors.primary} />
                <Text style={styles.actionText}>Firma Başvuruları & Yönetim</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Demands')}
            >
              <View style={styles.actionItemLeft}>
                <Ionicons name="search" size={20} color={AppColors.primary} />
                <Text style={styles.actionText}>Canlı Talep Akışı & Denetim</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Users')}
            >
              <View style={styles.actionItemLeft}>
                <Ionicons name="people" size={20} color={AppColors.primary} />
                <Text style={styles.actionText}>Kullanıcı Yönetimi & Ceza/Ban</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Reports')}
            >
              <View style={styles.actionItemLeft}>
                <Ionicons name="warning" size={20} color={AppColors.secondary} />
                <Text style={styles.actionText}>Şikayetler & Moderasyon</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Payments')}
            >
              <View style={styles.actionItemLeft}>
                <Ionicons name="card" size={20} color={AppColors.secondary} />
                <Text style={styles.actionText}>Ödemeler & Abonelik Takibi</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('PricePlans')}
            >
              <View style={styles.actionItemLeft}>
                <Ionicons name="pricetags" size={20} color={AppColors.secondary} />
                <Text style={styles.actionText}>Abonelik Paketleri & Kotalar</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Categories')}
            >
              <View style={styles.actionItemLeft}>
                <Ionicons name="grid" size={20} color={AppColors.primary} />
                <Text style={styles.actionText}>Sektör & Kategori Yönetimi</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('Announcements')}
            >
              <View style={styles.actionItemLeft}>
                <Ionicons name="megaphone" size={20} color={AppColors.secondary} />
                <Text style={styles.actionText}>Sistem & Kullanıcı Duyuruları</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('SiteSettings')}
            >
              <View style={styles.actionItemLeft}>
                <Ionicons name="settings" size={20} color={AppColors.textSecondary} />
                <Text style={styles.actionText}>Sistem & Site Ayarları</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AppColors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  headerSub: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: AppColors.primaryLight,
  },
  content: {
    padding: 16,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  alertTextWrap: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
  },
  alertDesc: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  revenueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 16,
  },
  revLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  revAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginTop: 2,
  },
  revBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.secondaryBg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  revBtnText: {
    fontSize: 12,
    color: AppColors.secondary,
    fontWeight: 'bold',
  },
  liveDemandsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A', // Deep Navy / Cockpit
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  analyticsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B', // Modern dark slate
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  analyticsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: AppColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  analyticsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  analyticsSub: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
  },
  newBadge: {
    backgroundColor: '#D71920',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: '48%',
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  cardLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  cardSub: {
    fontSize: 11,
    color: AppColors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(215, 25, 32, 0.08)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(215, 25, 32, 0.15)',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  actionList: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
    marginBottom: 24,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
  },
  actionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.textPrimary,
    marginLeft: 10,
    flex: 1,
  },
});
