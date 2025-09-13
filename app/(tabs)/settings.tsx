import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  Shield,
  Crown,
  Palette,
  Download,
  HelpCircle,
  ChevronRight,
  User,
  LogOut,
  Database,
} from 'lucide-react-native';
import { useUserStore } from '@/stores/userStore';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import { trpc } from '@/lib/trpc';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
  isPremium?: boolean;
}

export default function SettingsScreen() {
  const { profile, updateProfile } = useUserStore();
  const { signOut, user } = useAuth();
  const router = useRouter();

  const handleNotificationToggle = useCallback((value: boolean) => {
    updateProfile({ notificationsEnabled: value });
    if (value) {
      // Schedule notifications
      Alert.alert('Notifications Enabled', 'You\'ll receive gentle reminders to check in.');
    }
  }, [updateProfile]);

  const handleBiometricToggle = useCallback((value: boolean) => {
    updateProfile({ biometricLockEnabled: value });
    if (value) {
      Alert.alert('Biometric Lock Enabled', 'Your app is now secured with biometric authentication.');
    }
  }, [updateProfile]);

  const handleBackupToggle = useCallback(() => {
    if (!profile?.isPremium) {
      // Show paywall
      return;
    }
    Alert.alert('Cloud Backup', 'Your data will be securely backed up to the cloud.');
  }, [profile?.isPremium]);

  const handleExportData = useCallback(() => {
    if (!profile?.isPremium) {
      // Show paywall
      return;
    }
    Alert.alert('Export Data', 'Your data will be exported as PDF/CSV.');
  }, [profile?.isPremium]);

  const handleSubscription = useCallback(() => {
    // Navigate to subscription screen
    Alert.alert('Subscription', 'Manage your subscription here.');
  }, []);

  const handleCrisisResources = useCallback(() => {
    Alert.alert(
      'Crisis Resources',
      'If you\'re experiencing a mental health crisis, please contact:\n\n• National Suicide Prevention Lifeline: 988\n• Crisis Text Line: Text HOME to 741741\n• Emergency Services: 911',
      [{ text: 'OK' }]
    );
  }, []);

  const dbTestQuery = trpc.health.dbTest.useQuery();

  const handleDatabaseTest = useCallback(async () => {
    try {
      console.log('Testing database connection...');
      await dbTestQuery.refetch();
      
      if (dbTestQuery.data?.status === 'ok') {
        Alert.alert('Database Test', 'Database connection successful! ✅');
      } else if (dbTestQuery.data?.status === 'warning') {
        Alert.alert('Database Warning', dbTestQuery.data.message + '\n\nPlease run the SQL schema in your Supabase dashboard.');
      } else if (dbTestQuery.error) {
        Alert.alert('Database Error', dbTestQuery.error.message || 'Unknown error occurred');
      } else {
        Alert.alert('Database Error', 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Database test failed:', error);
      Alert.alert('Database Test Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }, [dbTestQuery]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to sign out');
            } else {
              router.replace('/auth/login');
            }
          },
        },
      ]
    );
  }, [signOut, router]);

  const settingSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Profile',
          subtitle: profile?.name || user?.user_metadata?.name || 'User',
          icon: <User color="#FFD700" size={20} />,
          type: 'navigation' as const,
        },
        {
          id: 'subscription',
          title: profile?.isPremium ? 'Manage Subscription' : 'Upgrade to Premium',
          subtitle: profile?.isPremium ? 'Premium Active' : 'Unlock all features',
          icon: <Crown color="#FFD700" size={20} />,
          type: 'navigation' as const,
          onPress: handleSubscription,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications',
          title: 'Daily Reminders',
          subtitle: 'Get gentle reminders to check in',
          icon: <Bell color="#60a5fa" size={20} />,
          type: 'toggle' as const,
          value: profile?.notificationsEnabled,
          onPress: () => handleNotificationToggle(!profile?.notificationsEnabled),
        },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        {
          id: 'biometric',
          title: 'Biometric Lock',
          subtitle: 'Secure app with Face ID/Touch ID',
          icon: <Shield color="#4ade80" size={20} />,
          type: 'toggle' as const,
          value: profile?.biometricLockEnabled,
          onPress: () => handleBiometricToggle(!profile?.biometricLockEnabled),
        },
        {
          id: 'backup',
          title: 'Cloud Backup',
          subtitle: 'Encrypted backup of your data',
          icon: <Shield color="#8b5cf6" size={20} />,
          type: 'toggle' as const,
          value: false,
          onPress: handleBackupToggle,
          isPremium: true,
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          id: 'export',
          title: 'Export Data',
          subtitle: 'Download your data as PDF/CSV',
          icon: <Download color="#f59e0b" size={20} />,
          type: 'action' as const,
          onPress: handleExportData,
          isPremium: true,
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          id: 'theme',
          title: 'Theme',
          subtitle: 'Dark theme',
          icon: <Palette color="#ec4899" size={20} />,
          type: 'navigation' as const,
          isPremium: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'dbtest',
          title: 'Test Database',
          subtitle: 'Check database connection',
          icon: <Database color="#60a5fa" size={20} />,
          type: 'action' as const,
          onPress: handleDatabaseTest,
        },
        {
          id: 'crisis',
          title: 'Crisis Resources',
          subtitle: 'Emergency mental health support',
          icon: <HelpCircle color="#f87171" size={20} />,
          type: 'action' as const,
          onPress: handleCrisisResources,
        },
      ],
    },
    {
      title: 'Session',
      items: [
        {
          id: 'signout',
          title: 'Sign Out',
          subtitle: user?.email || 'Sign out of your account',
          icon: <LogOut color="#ff4444" size={20} />,
          type: 'action' as const,
          onPress: handleSignOut,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    const isLocked = item.isPremium && !profile?.isPremium;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.settingItem, isLocked && styles.lockedItem]}
        onPress={item.onPress}
        disabled={isLocked && item.type !== 'toggle'}
      >
        <View style={styles.settingIcon}>
          {item.icon}
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, isLocked && styles.lockedText]}>
            {item.title}
            {isLocked && ' 🔒'}
          </Text>
          {item.subtitle && (
            <Text style={[styles.settingSubtitle, isLocked && styles.lockedText]}>
              {item.subtitle}
            </Text>
          )}
        </View>
        <View style={styles.settingAction}>
          {item.type === 'toggle' ? (
            <Switch
              value={item.value || false}
              onValueChange={() => item.onPress?.()}
              trackColor={{ false: '#333', true: '#FFD700' }}
              thumbColor={item.value ? '#1a1a1a' : '#666'}
              disabled={isLocked}
            />
          ) : (
            <ChevronRight color="#666" size={20} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingSections.map((section, sectionIndex) => (
          <View key={`section-${sectionIndex}-${section.title}`} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <View key={`section-${sectionIndex}-item-${index}-${item.id}`}>
                  {renderSettingItem(item)}
                  {index < section.items.length - 1 && <View style={styles.separator} />}
                </View>
              ))}
            </Card>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Mind Health Tracker v1.0.0</Text>
          <Text style={styles.appInfoText}>Made with ❤️ for your wellbeing</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    padding: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  lockedItem: {
    opacity: 0.6,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    color: '#999',
    fontSize: 14,
    marginTop: 2,
  },
  lockedText: {
    color: '#666',
  },
  settingAction: {
    marginLeft: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginLeft: 68,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  appInfoText: {
    color: '#666',
    fontSize: 12,
  },
});