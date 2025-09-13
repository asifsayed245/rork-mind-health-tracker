import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, RefreshCw, CheckCircle } from 'lucide-react-native';

interface BackendStatusProps {
  onRetry?: () => void;
}

export const BackendStatus: React.FC<BackendStatusProps> = ({ onRetry }) => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'html_error' | 'setup_needed' | 'setting_up'>('checking');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [setupMessage, setSetupMessage] = useState<string>('');

  const checkBackendStatus = async () => {
    setStatus('checking');
    try {
      const baseUrl = typeof window !== 'undefined' && window.location 
        ? window.location.origin 
        : process.env.EXPO_PUBLIC_RORK_API_BASE_URL || '';
      
      if (!baseUrl) {
        setStatus('disconnected');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${baseUrl}/api/test-db`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        // Check if we're getting HTML instead of JSON
        if (text.includes('<!DOCTYPE') || text.includes('<html>')) {
          console.error('❌ Backend connection error: Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON');
          console.error('This usually means the backend server is not running or misconfigured');
          console.error('Response text:', text.substring(0, 200));
          setStatus('html_error');
        } else {
          try {
            const data = JSON.parse(text);
            if (data.status === 'ok') {
              setStatus('connected');
              setShowSuccess(true);
              // Hide success message after 3 seconds
              setTimeout(() => setShowSuccess(false), 3000);
            } else if (data.status === 'warning' && data.message?.includes('tables')) {
              setStatus('setup_needed');
              setSetupMessage(data.message || 'Database tables need to be set up');
            } else {
              console.warn('Backend responded but with non-ok status:', data);
              setStatus('disconnected');
            }
          } catch (parseError) {
            console.error('Failed to parse backend response as JSON:', parseError);
            setStatus('html_error');
          }
        }
      } else {
        console.error('Backend health check failed with status:', response.status);
        setStatus('disconnected');
      }
    } catch (error) {
      console.log('Backend status check failed:', error);
      setStatus('disconnected');
    }
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    checkBackendStatus();
    onRetry?.();
  };

  const handleSetupDatabase = async () => {
    setStatus('setting_up');
    setSetupMessage('Setting up database schema...');
    
    try {
      const baseUrl = typeof window !== 'undefined' && window.location 
        ? window.location.origin 
        : process.env.EXPO_PUBLIC_RORK_API_BASE_URL || '';
      
      const response = await fetch(`${baseUrl}/api/setup-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setSetupMessage('Database setup completed successfully!');
          setTimeout(() => {
            checkBackendStatus();
          }, 2000);
        } else {
          setSetupMessage(`Setup failed: ${data.message}`);
          setStatus('setup_needed');
        }
      } else {
        setSetupMessage('Setup request failed. Please try manual setup.');
        setStatus('setup_needed');
      }
    } catch (error) {
      console.error('Database setup error:', error);
      setSetupMessage('Setup failed. Please try manual setup.');
      setStatus('setup_needed');
    }
  };

  // Show a brief success message when connected, then hide
  if (status === 'connected' && showSuccess) {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <CheckCircle size={24} color="#10b981" />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, styles.successTitle]}>Backend Connected</Text>
            <Text style={[styles.description, styles.successDescription]}>All systems operational</Text>
          </View>
        </View>
      </View>
    );
  }

  // Hide component completely when connected (after success message)
  if (status === 'connected') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {status === 'checking' ? (
            <RefreshCw size={24} color="#f59e0b" />
          ) : (
            <AlertCircle size={24} color="#ef4444" />
          )}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {status === 'checking' 
              ? 'Connecting to backend...' 
              : status === 'html_error'
              ? 'Backend Configuration Error'
              : status === 'setup_needed'
              ? 'Database Setup Required'
              : status === 'setting_up'
              ? 'Setting Up Database...'
              : 'Backend Server Not Running'
            }
          </Text>
          <Text style={styles.description}>
            {status === 'checking' 
              ? 'Please wait while we establish connection'
              : status === 'html_error'
              ? 'The backend is returning HTML instead of JSON. This indicates a configuration issue that needs to be resolved by support.'
              : status === 'setup_needed'
              ? setupMessage || 'Database tables are missing and need to be created.'
              : status === 'setting_up'
              ? setupMessage || 'Please wait while we set up your database...'
              : 'Backend server connection failed. Please check the setup instructions and ensure the database is properly configured.'
            }
          </Text>
          {(status === 'disconnected' || status === 'html_error' || status === 'setup_needed') && (
            <Text style={styles.instructions}>
              📋 Setup Required:
              {"\n"}1. Run SQL schema in Supabase Dashboard
              {"\n"}2. Update service role key in .env
              {"\n"}3. Check SETUP_INSTRUCTIONS.md for details
            </Text>
          )}
          <Text style={styles.timestamp}>
            Last checked: {lastCheck.toLocaleTimeString()}
          </Text>
        </View>

        {status === 'setup_needed' && (
          <TouchableOpacity style={styles.setupButton} onPress={handleSetupDatabase}>
            <Text style={styles.setupText}>Auto Setup</Text>
          </TouchableOpacity>
        )}
        
        {(status === 'disconnected' || status === 'html_error') && (
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <RefreshCw size={16} color="#ffffff" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    margin: 16,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#a16207',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#a16207',
    opacity: 0.8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  successContainer: {
    backgroundColor: '#d1fae5',
    borderLeftColor: '#10b981',
  },
  successTitle: {
    color: '#065f46',
  },
  successDescription: {
    color: '#047857',
  },
  instructions: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'monospace',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  setupText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});