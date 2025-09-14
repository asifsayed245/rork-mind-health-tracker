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
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/stores/authStore';
import { router } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface SignupData {
  email: string;
  password: string;
  fullName: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  weight: string;
  weightUnit: 'kg' | 'lbs';
  occupation: string;
}

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
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  progressStepActive: {
    backgroundColor: '#007AFF',
  },
  progressStepText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#333',
  },
  progressLineActive: {
    backgroundColor: '#007AFF',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
  },
  requiredLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: '#FF6B6B',
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
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  picker: {
    color: 'white',
    backgroundColor: 'transparent',
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightInput: {
    flex: 1,
    marginRight: 12,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  unitButtonActive: {
    backgroundColor: '#007AFF',
  },
  unitButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  unitButtonTextActive: {
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonDisabled: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  buttonTextSecondary: {
    color: '#007AFF',
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
  optionalText: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default function SignupScreen() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [signupData, setSignupData] = useState<SignupData>({
    email: '',
    password: '',
    fullName: '',
    age: '',
    gender: 'Prefer not to say',
    weight: '',
    weightUnit: 'kg',
    occupation: '',
  });
  const [errors, setErrors] = useState<Partial<SignupData>>({});
  const [loading, setLoading] = useState<boolean>(false);
  
  const { signUpWithEmail, isAuthenticated } = useAuth();
  const createProfileMutation = trpc.profile.create.useMutation();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated]);

  const validateStep1 = (): boolean => {
    const newErrors: Partial<SignupData> = {};
    
    if (!signupData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signupData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!signupData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (signupData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[0-9])(?=.*[!@#$%^&*])/.test(signupData.password)) {
      newErrors.password = 'Password must contain at least 1 number or symbol';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<SignupData> = {};
    
    if (!signupData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (signupData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    } else if (signupData.fullName.trim().length > 100) {
      newErrors.fullName = 'Full name must be less than 100 characters';
    }
    
    if (!signupData.age.trim()) {
      newErrors.age = 'Age is required';
    } else {
      const age = parseInt(signupData.age);
      if (isNaN(age) || age < 13 || age > 120) {
        newErrors.age = 'Age must be between 13 and 120';
      }
    }
    
    if (signupData.weight.trim()) {
      const weight = parseFloat(signupData.weight);
      if (isNaN(weight) || weight <= 0) {
        newErrors.weight = 'Weight must be a positive number';
      }
    }
    
    if (signupData.occupation.length > 100) {
      newErrors.occupation = 'Occupation must be less than 100 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSignUp = async () => {
    if (!validateStep2()) return;
    
    setLoading(true);
    try {
      // Step 1: Create auth account
      const authResult = await signUpWithEmail(signupData.email.trim(), signupData.password);
      
      if (authResult.error) {
        Alert.alert('Error', authResult.error);
        return;
      }
      
      // Step 2: Create user profile
      const profileData = {
        fullName: signupData.fullName.trim(),
        age: parseInt(signupData.age),
        gender: signupData.gender,
        weight: signupData.weight.trim() ? parseFloat(signupData.weight) : undefined,
        occupation: signupData.occupation.trim() || undefined,
        weightUnit: signupData.weightUnit,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      
      await createProfileMutation.mutateAsync(profileData);
      
      Alert.alert(
        'Success!', 
        'Your account has been created successfully. Welcome to Mindful Check-In!',
        [{ text: 'Get Started', onPress: () => router.replace('/(tabs)/home') }]
      );
      
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Failed to create your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateSignupData = (field: keyof SignupData, value: string) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const renderStep1 = () => (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.requiredLabel}>
          Email <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          value={signupData.email}
          onChangeText={(value) => updateSignupData('email', value)}
          placeholder="Enter your email"
          placeholderTextColor="#666"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.requiredLabel}>
          Password <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          value={signupData.password}
          onChangeText={(value) => updateSignupData('password', value)}
          placeholder="Enter your password"
          placeholderTextColor="#666"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        <Text style={styles.optionalText}>
          Must be at least 8 characters with 1 number or symbol
        </Text>
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.requiredLabel}>
          Full Name <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.fullName && styles.inputError]}
          value={signupData.fullName}
          onChangeText={(value) => updateSignupData('fullName', value)}
          placeholder="Enter your full name"
          placeholderTextColor="#666"
          autoCapitalize="words"
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.requiredLabel}>
          Age <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.age && styles.inputError]}
          value={signupData.age}
          onChangeText={(value) => updateSignupData('age', value)}
          placeholder="Enter your age"
          placeholderTextColor="#666"
          keyboardType="numeric"
        />
        {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Gender <Text style={styles.optionalText}>(optional)</Text>
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={signupData.gender}
            onValueChange={(value: string) => updateSignupData('gender', value as 'Male' | 'Female' | 'Other' | 'Prefer not to say')}
            style={styles.picker}
            dropdownIconColor="white"
          >
            <Picker.Item label="Prefer not to say" value="Prefer not to say" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Weight <Text style={styles.optionalText}>(optional)</Text>
        </Text>
        <View style={styles.weightContainer}>
          <TextInput
            style={[styles.input, styles.weightInput, errors.weight && styles.inputError]}
            value={signupData.weight}
            onChangeText={(value) => updateSignupData('weight', value)}
            placeholder="Enter weight"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
          />
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[styles.unitButton, signupData.weightUnit === 'kg' && styles.unitButtonActive]}
              onPress={() => updateSignupData('weightUnit', 'kg')}
            >
              <Text style={[
                styles.unitButtonText,
                signupData.weightUnit === 'kg' && styles.unitButtonTextActive
              ]}>
                kg
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitButton, signupData.weightUnit === 'lbs' && styles.unitButtonActive]}
              onPress={() => updateSignupData('weightUnit', 'lbs')}
            >
              <Text style={[
                styles.unitButtonText,
                signupData.weightUnit === 'lbs' && styles.unitButtonTextActive
              ]}>
                lbs
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Occupation <Text style={styles.optionalText}>(optional)</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.occupation && styles.inputError]}
          value={signupData.occupation}
          onChangeText={(value) => updateSignupData('occupation', value)}
          placeholder="Enter your occupation"
          placeholderTextColor="#666"
          autoCapitalize="words"
        />
        {errors.occupation && <Text style={styles.errorText}>{errors.occupation}</Text>}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              {currentStep === 1 ? 'Account Credentials' : 'Profile Setup'}
            </Text>
            
            <View style={styles.progressContainer}>
              <View style={[styles.progressStep, currentStep >= 1 && styles.progressStepActive]}>
                <Text style={styles.progressStepText}>1</Text>
              </View>
              <View style={[styles.progressLine, currentStep >= 2 && styles.progressLineActive]} />
              <View style={[styles.progressStep, currentStep >= 2 && styles.progressStepActive]}>
                <Text style={styles.progressStepText}>2</Text>
              </View>
            </View>
          </View>

          {currentStep === 1 ? renderStep1() : renderStep2()}

          <View style={styles.buttonContainer}>
            {currentStep === 2 && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleBack}
                disabled={loading}
              >
                <ChevronLeft size={20} color="#007AFF" />
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Back</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.button,
                loading && styles.buttonDisabled,
                currentStep === 2 && { marginLeft: 8 }
              ]}
              onPress={currentStep === 1 ? handleNext : handleSignUp}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Account...' : (currentStep === 1 ? 'Next' : 'Create Account')}
              </Text>
              {currentStep === 1 && !loading && <ChevronRight size={20} color="white" />}
            </TouchableOpacity>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>Already have an account?</Text>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => router.replace('/login')}
            >
              <Text style={styles.switchButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}