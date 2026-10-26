import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AppColors } from '../constants/theme';
import { serviceAdmin } from '../services/serviceAdmin';
import { ReportItem, ReportStatus } from '../types';
import { Ionicons } from '@expo/vector-icons';

export const ReportsScreen: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await serviceAdmin.getReportList();
      const list = res.value || res.data || (res as any).Data || (res as any).Value;
      if (res.resulttype == 1 && Array.isArray(list)) {
        setReports(list);
      } else {
        setReports([]);
      }
    } catch {
      Alert.alert('Hata', 'Şikayet listesi yüklenemedi.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolve = (id: number | string, status: ReportStatus | number) => {
    const actionLabel = status === ReportStatus.Resolved ? 'Çözüldü' : 'Reddedildi';
    Alert.alert('Onay', `Bu şikayeti "${actionLabel}" olarak işaretlemek istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Evet',
        onPress: async () => {
          await serviceAdmin.resolveReport(id, status);
          Alert.alert('Tamamlandı', `Şikayet "${actionLabel}" olarak güncellendi.`);
          setReports((prev) => prev.filter((r) => r.id !== id));
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: ReportItem }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{item.title || 'Şikayet Bildirimi'}</Text>
        <Text style={styles.timeText}>{item.createtime || ''}</Text>
      </View>

      <Text style={styles.content}>{item.content}</Text>

      <View style={styles.footerRow}>
        <Text style={styles.reporterText}>
          <Ionicons name="person-circle-outline" size={14} color={AppColors.textMuted} />{' '}
          {item.reporterfullname || 'Bilinmeyen Kullanıcı'}
        </Text>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => handleResolve(item.id, ReportStatus.Dismissed)}
          >
            <Ionicons name="close" size={14} color={AppColors.danger} />
            <Text style={styles.rejectBtnText}>Kapat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.resolveBtn]}
            onPress={() => handleResolve(item.id, ReportStatus.Resolved)}
          >
            <Ionicons name="checkmark" size={14} color={AppColors.success} />
            <Text style={styles.resolveBtnText}>Çözüldü</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Şikayet ve Moderasyon</Text>
        <Text style={styles.headerSub}>İnceleme bekleyen kullanıcı ve firma bildirimleri</Text>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color="#D71920" size="small" />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="checkmark-circle-outline" size={48} color={AppColors.success} />
              <Text style={styles.emptyText}>Bekleyen açık şikayet bulunmuyor.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    padding: 16,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: AppColors.danger,
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: AppColors.textMuted,
  },
  content: {
    fontSize: 14,
    color: AppColors.textPrimary,
    lineHeight: 20,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
    paddingTop: 10,
  },
  reporterText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  btnRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 8,
  },
  rejectBtn: {
    backgroundColor: AppColors.dangerLight,
  },
  rejectBtnText: {
    color: AppColors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  resolveBtn: {
    backgroundColor: AppColors.successLight,
  },
  resolveBtnText: {
    color: AppColors.success,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: AppColors.textSecondary,
    fontSize: 14,
  },
});
