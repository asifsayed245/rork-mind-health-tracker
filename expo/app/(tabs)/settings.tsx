import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Settings as SettingsIcon,
  X,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useCheckInStore } from '@/stores/checkInStore';
import Card from '@/components/Card';
import { normalizeWeights, ScoringWeights } from '@/lib/scoring';

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
  const { signOut } = useAuth();
  const { profile, updateProfile } = useUserStore();
  const { userSettings, updateUserSettings } = useCheckInStore();
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [tempWeights, setTempWeights] = useState<ScoringWeights>({
    moodWeight: 0.50,
    energyWeight: 0.30,
    stressWeight: 0.20,
  });
  const [tempUseCompletion, setTempUseCompletion] = useState(true);
  const [tempExcludeEmpty, setTempExcludeEmpty] = useState(true);

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
      'If you are experiencing a mental health crisis, please contact:\n\n• National Suicide Prevention Lifeline: 988\n• Crisis Text Line: Text HOME to 741741\n• Emergency Services: 911',
      [{ text: 'OK' }]
    );
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => signOut()
        }
      ]
    );
  }, [signOut]);

  const handleScoringSettings = useCallback(() => {
    if (userSettings) {
      setTempWeights(userSettings.scoring.weights);
      setTempUseCompletion(userSettings.scoring.useCompletionMultiplier);
      setTempExcludeEmpty(userSettings.scoring.excludeEmptyDays);
      setShowScoringModal(true);
    }
  }, [userSettings]);

  const handleSaveScoringSettings = useCallback(async () => {
    if (userSettings) {
      const normalizedWeights = normalizeWeights(tempWeights);
      await updateUserSettings({
        scoring: {
          weights: normalizedWeights,
          useCompletionMultiplier: tempUseCompletion,
          excludeEmptyDays: tempExcludeEmpty,
        }
      });
      setShowScoringModal(false);
      Alert.alert('Settings Saved', 'Your scoring preferences have been updated.');
    }
  }, [userSettings, tempWeights, tempUseCompletion, tempExcludeEmpty, updateUserSettings]);

  const settingSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Profile',
          subtitle: profile?.name || 'User',
          icon: <User color="#FFD700" size={20} />,
          type: 'navigation' as const,
          onPress: () => router.push('/profile'),
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
      title: 'Scoring',
      items: [
        {
          id: 'scoring',
          title: 'Scoring Settings',
          subtitle: 'Customize wellbeing score calculation',
          icon: <SettingsIcon color="#8b5cf6" size={20} />,
          type: 'navigation' as const,
          onPress: handleScoringSettings,
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
      title: 'Account Actions',
      items: [
        {
          id: 'signout',
          title: 'Sign Out',
          subtitle: 'Sign out of your account',
          icon: <LogOut color="#f87171" size={20} />,
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
        {settingSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <View key={item.id}>
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

      {/* Scoring Settings Modal */}
      <Modal
        visible={showScoringModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowScoringModal(false)}
      >
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Scoring Settings</Text>
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={() => setShowScoringModal(false)}
            >
              <X color="#999" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={modalStyles.content}>
            <Text style={modalStyles.sectionTitle}>Metric Weights</Text>
            <Text style={modalStyles.sectionSubtitle}>
              Adjust how much each metric contributes to your wellbeing score
            </Text>

            <View style={modalStyles.weightContainer}>
              <Text style={modalStyles.weightLabel}>Mood Weight</Text>
              <TextInput
                style={modalStyles.weightInput}
                value={tempWeights.moodWeight.toFixed(2)}
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  setTempWeights(prev => ({ ...prev, moodWeight: Math.max(0, Math.min(1, value)) }));
                }}
                keyboardType="numeric"
                placeholder="0.50"
                placeholderTextColor="#666"
              />
            </View>

            <View style={modalStyles.weightContainer}>
              <Text style={modalStyles.weightLabel}>Energy Weight</Text>
              <TextInput
                style={modalStyles.weightInput}
                value={tempWeights.energyWeight.toFixed(2)}
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  setTempWeights(prev => ({ ...prev, energyWeight: Math.max(0, Math.min(1, value)) }));
                }}
                keyboardType="numeric"
                placeholder="0.30"
                placeholderTextColor="#666"
              />
            </View>

            <View style={modalStyles.weightContainer}>
              <Text style={modalStyles.weightLabel}>Stress Weight</Text>
              <TextInput
                style={modalStyles.weightInput}
                value={tempWeights.stressWeight.toFixed(2)}
                onChangeText={(text) => {
                  const value = parseFloat(text) || 0;
                  setTempWeights(prev => ({ ...prev, stressWeight: Math.max(0, Math.min(1, value)) }));
                }}
                keyboardType="numeric"
                placeholder="0.20"
                placeholderTextColor="#666"
              />
            </View>

            <Text style={modalStyles.sectionTitle}>Calculation Options</Text>

            <View style={modalStyles.toggleContainer}>
              <View style={modalStyles.toggleContent}>
                <Text style={modalStyles.toggleTitle}>Use Completion Multiplier</Text>
                <Text style={modalStyles.toggleSubtitle}>
                  Multiply score by completion percentage (slots filled / 4)
                </Text>
              </View>
              <Switch
                value={tempUseCompletion}
                onValueChange={setTempUseCompletion}
                trackColor={{ false: '#333', true: '#FFD700' }}
                thumbColor={tempUseCompletion ? '#1a1a1a' : '#666'}
              />
            </View>

            <View style={modalStyles.toggleContainer}>
              <View style={modalStyles.toggleContent}>
                <Text style={modalStyles.toggleTitle}>Exclude Empty Days</Text>
                <Text style={modalStyles.toggleSubtitle}>
                  Don&apos;t include days with 0 check-ins in period averages
                </Text>
              </View>
              <Switch
                value={tempExcludeEmpty}
                onValueChange={setTempExcludeEmpty}
                trackColor={{ false: '#333', true: '#FFD700' }}
                thumbColor={tempExcludeEmpty ? '#1a1a1a' : '#666'}
              />
            </View>

            <TouchableOpacity
              style={modalStyles.saveButton}
              onPress={handleSaveScoringSettings}
            >
              <Text style={modalStyles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#999',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  weightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  weightLabel: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  weightInput: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: 80,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  toggleSubtitle: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
});