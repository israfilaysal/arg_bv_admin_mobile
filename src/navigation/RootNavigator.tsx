import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AppColors } from '../constants/theme';
import { serviceStorage } from '../services/serviceStorage';
import { serviceAdmin } from '../services/serviceAdmin';

import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CompaniesScreen } from '../screens/CompaniesScreen';
import { DemandsScreen } from '../screens/DemandsScreen';
import { UsersScreen } from '../screens/UsersScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { PricePlansScreen } from '../screens/PricePlansScreen';
import { AnnouncementsScreen } from '../screens/AnnouncementsScreen';
import { SiteSettingsScreen } from '../screens/SiteSettingsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { DailySalesAnalysisScreen } from '../screens/DailySalesAnalysisScreen';
import { LiveDemandsScreen } from '../screens/LiveDemandsScreen';

import { AppLogo } from '../components/AppLogo';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const insets = useSafeAreaInsets();
  // Android'de yön tuşları (3-button navigation bar / back, home, recents) altında kalmaması için
  // dinamik inset ve güvenli taban mesafesi hesaplanır:
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 22 : 12);
  const tabHeight = 56 + safeBottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: AppColors.surface },
        headerTitleStyle: { color: AppColors.textPrimary, fontWeight: 'bold' },
        headerLeft: () => (
          <View style={{ marginLeft: 16 }}>
            <AppLogo size={30} />
          </View>
        ),
        tabBarActiveTintColor: AppColors.primary,
        tabBarInactiveTintColor: AppColors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarStyle: {
          backgroundColor: AppColors.surface,
          borderTopColor: AppColors.border,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: safeBottom,
          paddingTop: 6,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'home';
          if (route.name === 'Dashboard') {
            iconName = 'grid-outline';
          } else if (route.name === 'Companies') {
            iconName = 'business-outline';
          } else if (route.name === 'Demands') {
            iconName = 'search-outline';
          } else if (route.name === 'Users') {
            iconName = 'people-outline';
          } else if (route.name === 'Settings') {
            iconName = 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >

      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Özet' }}
      />
      <Tab.Screen
        name="Companies"
        component={CompaniesScreen}
        options={{ title: 'Firmalar' }}
      />
      <Tab.Screen
        name="Demands"
        component={DemandsScreen}
        options={{ title: 'Talepler' }}
      />
      <Tab.Screen
        name="Users"
        component={UsersScreen}
        options={{ title: 'Kullanıcılar' }}
      />
      <Tab.Screen
        name="Settings"
        options={{ title: 'Ayarlar' }}
      >
        {() => <SettingsScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await serviceStorage.getToken();
      if (token) {
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      // Token bulunamazsa ama kayıtlı kimlik bilgileri varsa sessizce arka planda oturum aç
      const creds = await serviceStorage.getSavedCredentials();
      if (creds && creds.username && creds.password) {
        try {
          const res = await serviceAdmin.loginWithPassword(
            creds.username,
            creds.password,
            creds.organization || 'arg'
          );
          const val = res.value || res.data || (res as any).Data || (res as any).Value;
          const newToken =
            val?.token ||
            val?.Token ||
            val?.accesstoken ||
            val?.AccessToken ||
            val?.jwt;

          if (res.resulttype == 1 && newToken) {
            await serviceStorage.setToken(newToken);
            const userData = val?.userInfoEntity || val?.user || val;
            if (userData) {
              await serviceStorage.setUserData(userData);
            }
            setIsAuthenticated(true);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('[Auto-login on launch failed]:', e);
        }
      }

      setIsAuthenticated(false);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="small" color="#D71920" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: AppColors.surface },
          headerTitleStyle: { color: AppColors.textPrimary, fontWeight: 'bold' },
          headerTintColor: AppColors.primary,
          headerRight: () => (
            <View style={{ marginRight: 8 }}>
              <AppLogo size={26} />
            </View>
          ),
        }}
      >
        <Stack.Screen
          name="MainTabs"
          options={{ headerShown: false }}
        >
          {() => <MainTabs onLogout={() => setIsAuthenticated(false)} />}
        </Stack.Screen>
        <Stack.Screen
          name="Reports"
          component={ReportsScreen}
          options={{ title: 'Şikayetler & Moderasyon' }}
        />
        <Stack.Screen
          name="Payments"
          component={PaymentsScreen}
          options={{ title: 'Ödemeler & Abonelikler' }}
        />
        <Stack.Screen
          name="Categories"
          component={CategoriesScreen}
          options={{ title: 'Sektör & Kategori Yönetimi' }}
        />
        <Stack.Screen
          name="PricePlans"
          component={PricePlansScreen}
          options={{ title: 'Fiyat Planları & Paketler' }}
        />
        <Stack.Screen
          name="Announcements"
          component={AnnouncementsScreen}
          options={{ title: 'Sistem Duyuruları' }}
        />
        <Stack.Screen
          name="SiteSettings"
          component={SiteSettingsScreen}
          options={{ title: 'Sistem & Site Ayarları' }}
        />
        <Stack.Screen
          name="DailySalesAnalysis"
          component={DailySalesAnalysisScreen}
          options={{ title: 'Günlük Satış & Talep Analizi' }}
        />
        <Stack.Screen
          name="LiveDemands"
          component={LiveDemandsScreen}
          options={{ title: 'Canlı Talep Akışı (Borsa)' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.background,
  },
});
