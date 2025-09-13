import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/stores/authStore';
import { router } from 'expo-router';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    color: '#888',
    fontSize: 14,
  },
  switchButton: {
    marginLeft: 4,
  },
  switchButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  demoButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const { signInWithEmail, signUpWithEmail, loading, isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated]);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    const result = isSignUp 
      ? await signUpWithEmail(email.trim(), password)
      : await signInWithEmail(email.trim(), password);

    if (result.error) {
      if (result.error.includes('Invalid login credentials')) {
        Alert.alert(
          'Account Not Found', 
          'No account found with these credentials. Would you like to create a new account?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Up', onPress: () => setIsSignUp(true) }
          ]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } else if (isSignUp) {
      Alert.alert('Success', 'Account created successfully! You can now sign in.');
      setIsSignUp(false);
    }
  };

  const handleDemoLogin = async () => {
    const demoEmail = 'demo@mindfulcheckin.com';
    const demoPassword = 'demo123456';
    
    // Try to sign in first
    let result = await signInWithEmail(demoEmail, demoPassword);
    
    // If login fails, create the demo account
    if (result.error) {
      console.log('Demo account not found, creating...');
      result = await signUpWithEmail(demoEmail, demoPassword);
      
      if (!result.error) {
        // Now try to sign in with the demo account
        setTimeout(async () => {
          const loginResult = await signInWithEmail(demoEmail, demoPassword);
          if (loginResult.error) {
            Alert.alert('Demo Account', 'Demo account created! Please try signing in again.');
          }
        }, 1000);
      } else {
        Alert.alert('Error', 'Failed to create demo account: ' + result.error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Mindful Check-In</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#666"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.demoButton, loading && styles.buttonDisabled]}
            onPress={handleDemoLogin}
            disabled={loading}
          >
            <Text style={styles.demoButtonText}>
              Try Demo Account
            </Text>
          </TouchableOpacity>

          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.switchButtonText}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}