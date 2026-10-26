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
  Switch,
} from 'react-native';
import { AppColors } from '../constants/theme';
import { serviceAdmin } from '../services/serviceAdmin';
import { CategoryItem } from '../types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { AppLogo } from '../components/AppLogo';

export const CategoriesScreen: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'passive'>('all');

  // Ekleme / Düzenleme Modalı
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [catName, setCatName] = useState('');
  const [catOrder, setCatOrder] = useState('1');
  const [catParentId, setCatParentId] = useState<string | null>(null);
  const [catIsActive, setCatIsActive] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await serviceAdmin.getCategoryList();
      const list = res.value || res.data || (res as any).Data || (res as any).Value;
      if (res.resulttype == 1 && Array.isArray(list)) {
        setCategories(list);
      } else {
        setCategories([]);
      }
    } catch {
      Alert.alert('Hata', 'Kategori listesi alınamadı.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatOrder(String((categories.length + 1) * 1));
    setCatParentId(null);
    setCatIsActive(true);
    setModalVisible(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCatName(cat.categoryname || cat.name || '');
    setCatOrder(String(cat.orderby ?? cat.displayorder ?? 1));
    setCatParentId(cat.parentid ? String(cat.parentid) : null);
    setCatIsActive(cat.isactive === 1 || cat.status === 1 || cat.isactive === undefined);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!catName.trim()) {
      Alert.alert('Uyarı', 'Lütfen kategori adını giriniz.');
      return;
    }

    setActionLoading(true);
    try {
      const payload: any = {
        id: editingCategory?.id ? String(editingCategory.id) : undefined,
        categoryname: catName.trim(),
        parentid: catParentId && catParentId !== '0' ? catParentId : null,
        orderby: parseInt(catOrder, 10) || 1,
        isactive: catIsActive ? 1 : 0,
      };

      const res = await serviceAdmin.saveCategory(payload);
      if (res.resulttype == 1) {
        Alert.alert('Başarılı', editingCategory ? 'Kategori güncellendi.' : 'Yeni kategori eklendi.');
        loadCategories();
        setModalVisible(false);
      } else {
        const msg = res.description || res.Description || res.message || 'Kategori kaydedilemedi.';
        Alert.alert('Hata', msg);
      }
    } catch (e: any) {
      Alert.alert('Hata', e?.message || 'Kategori kaydedilirken sorun oluştu.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (cat: CategoryItem) => {
    const cName = cat.categoryname || cat.name || 'Kategori';
    Alert.alert('Silme Onayı', `"${cName}" kategorisini silmek istediğinize emin misiniz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const res = await serviceAdmin.deleteCategory(cat.id);
          if (res.resulttype == 1) {
            Alert.alert('Başarılı', 'Kategori silindi.');
            loadCategories();
          } else {
            const msg = res.description || res.Description || res.message || 'Kategori silinemedi.';
            Alert.alert('Hata', msg);
          }
        },
      },
    ]);
  };

  // Üst kategorinin adını bul
  const getParentName = (parentId?: number | string | null) => {
    if (!parentId || parentId === '0') return null;
    const parent = categories.find((c) => String(c.id) === String(parentId));
    return parent ? parent.categoryname || parent.name : null;
  };

  const filtered = categories.filter((c) => {
    const name = (c.categoryname || c.name || '').toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase());
    const isAct = c.isactive === 1 || c.status === 1 || c.isactive === undefined;
    const matchesFilter =
      filterActive === 'all'
        ? true
        : filterActive === 'active'
        ? isAct
        : !isAct;
    return matchesSearch && matchesFilter;
  });

  const renderItem = ({ item }: { item: CategoryItem }) => {
    const isAct = item.isactive === 1 || item.status === 1 || item.isactive === undefined;
    const parentName = getParentName(item.parentid);

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.iconBox}>
            <Ionicons name="grid-outline" size={20} color={AppColors.accent} />
          </View>
          <View style={styles.infoWrap}>
            <View style={styles.nameRow}>
              <Text style={styles.catName}>{item.categoryname || item.name}</Text>
              <View
                style={[
                  styles.activeBadge,
                  { backgroundColor: isAct ? '#dcfce7' : '#fee2e2' },
                ]}
              >
                <Ionicons
                  name={isAct ? 'checkmark-circle' : 'close-circle'}
                  size={12}
                  color={isAct ? '#166534' : '#991b1b'}
                />
                <Text style={[styles.activeBadgeText, { color: isAct ? '#166534' : '#991b1b' }]}>
                  {isAct ? 'Aktif' : 'Pasif'}
                </Text>
              </View>
            </View>

            {parentName && (
              <View style={styles.parentRow}>
                <Ionicons name="return-down-forward-outline" size={13} color={AppColors.textMuted} />
                <Text style={styles.parentText}>Üst Kategori: {parentName}</Text>
              </View>
            )}

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Sıra No: {item.orderby ?? item.displayorder ?? 1}</Text>
              {item.companycount !== undefined && (
                <Text style={styles.metaText}>• {item.companycount} Firma</Text>
              )}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionIconBtn} onPress={() => openEditModal(item)}>
              <Ionicons name="pencil" size={16} color={AppColors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleDelete(item)}>
              <Ionicons name="trash-outline" size={16} color={AppColors.danger} />
            </TouchableOpacity>
          </View>
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
          Sistemdeki sektör ve ürün kategorilerini bu ekrandan yönetebilir, sıra numarası ve üst kategori hiyerarşisi tanımlayabilirsiniz.
        </Text>
      </View>

      {/* Üst Arama ve Yeni Kategori Ekle Butonu */}
      <View style={styles.topRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={AppColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Kategori adı ara..."
            placeholderTextColor={AppColors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add" size={18} color={AppColors.white} />
          <Text style={styles.addBtnText}>Yeni Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Filtre Butonları */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterActive === 'all' && styles.filterChipActive]}
          onPress={() => setFilterActive('all')}
        >
          <Text style={[styles.filterChipText, filterActive === 'all' && styles.filterChipTextActive]}>
            Tümü ({categories.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterActive === 'active' && styles.filterChipActive]}
          onPress={() => setFilterActive('active')}
        >
          <Text style={[styles.filterChipText, filterActive === 'active' && styles.filterChipTextActive]}>
            Aktifler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterActive === 'passive' && styles.filterChipActive]}
          onPress={() => setFilterActive('passive')}
        >
          <Text style={[styles.filterChipText, filterActive === 'passive' && styles.filterChipTextActive]}>
            Pasifler
          </Text>
        </TouchableOpacity>
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
          onRefresh={loadCategories}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppLogo size={56} style={{ opacity: 0.35, marginBottom: 8 }} />
              <Text style={styles.emptyText}>Kategori kaydı bulunamadı.</Text>
            </View>
          }
        />
      )}

      {/* Modal Header Standardı ile Düzenleme/Ekleme Modalı */}
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
                <Text style={styles.modalHeaderTitle}>
                  {editingCategory ? `Kategori Düzenle` : 'Yeni Kategori Ekle'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <MaterialIcons name="close" size={22} color={AppColors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
                <Text style={styles.inputLabel}>Kategori Adı *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={catName}
                  onChangeText={setCatName}
                  placeholder="Örn: Otomotiv, Hırdavat..."
                  placeholderTextColor={AppColors.textMuted}
                />

                <Text style={styles.inputLabel}>Sıralama (Sıra No)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={catOrder}
                  onChangeText={setCatOrder}
                  placeholder="Örn: 1"
                  placeholderTextColor={AppColors.textMuted}
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>Üst Kategori (İsteğe Bağlı)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.parentScroll}>
                  <TouchableOpacity
                    style={[
                      styles.parentChip,
                      (!catParentId || catParentId === '0') && styles.parentChipActive,
                    ]}
                    onPress={() => setCatParentId(null)}
                  >
                    <Text
                      style={[
                        styles.parentChipText,
                        (!catParentId || catParentId === '0') && styles.parentChipTextActive,
                      ]}
                    >
                      Yok (Ana Kategori)
                    </Text>
                  </TouchableOpacity>
                  {categories
                    .filter((c) => !editingCategory || String(c.id) !== String(editingCategory.id))
                    .map((c) => {
                      const isSelected = String(catParentId) === String(c.id);
                      return (
                        <TouchableOpacity
                          key={String(c.id)}
                          style={[styles.parentChip, isSelected && styles.parentChipActive]}
                          onPress={() => setCatParentId(String(c.id))}
                        >
                          <Text style={[styles.parentChipText, isSelected && styles.parentChipTextActive]}>
                            {c.categoryname || c.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>

                <View style={styles.switchRow}>
                  <View>
                    <Text style={styles.switchTitle}>Kategori Durumu</Text>
                    <Text style={styles.switchSub}>
                      {catIsActive ? 'Aktif (Kullanıcılar ve firmalar seçebilir)' : 'Pasif (Gizli)'}
                    </Text>
                  </View>
                  <Switch
                    value={catIsActive}
                    onValueChange={setCatIsActive}
                    trackColor={{ false: '#cbd5e1', true: AppColors.primaryLight }}
                    thumbColor={catIsActive ? AppColors.accent : '#f4f3f4'}
                  />
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
                        {editingCategory ? 'Değişiklikleri Kaydet' : 'Kategoriyi Kaydet'}
                      </Text>
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
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.accent,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addBtnText: {
    color: AppColors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(215, 25, 32, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoWrap: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  catName: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  parentText: {
    fontSize: 12,
    color: AppColors.primary,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  metaText: {
    fontSize: 11.5,
    color: AppColors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  actionIconBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: AppColors.background,
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
  parentScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  parentChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.background,
    marginRight: 8,
  },
  parentChipActive: {
    backgroundColor: AppColors.primaryLight,
    borderColor: AppColors.accent,
  },
  parentChipText: {
    fontSize: 12,
    color: AppColors.textPrimary,
    fontWeight: '500',
  },
  parentChipTextActive: {
    color: AppColors.accent,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AppColors.background,
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  switchSub: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 2,
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
