import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Composant de test pour déclencher des erreurs volontairement
 * Utilisé uniquement en développement pour tester l'ErrorBoundary
 */

interface ErrorTestComponentProps {
  onClose: () => void;
}

export const ErrorTestComponent: React.FC<ErrorTestComponentProps> = ({ onClose }) => {
  const [shouldThrowError, setShouldThrowError] = useState(false);
  const [shouldThrowPropertyError, setShouldThrowPropertyError] = useState(false);

  // Déclencher une erreur synchrone dans le render
  if (shouldThrowError) {
    throw new Error('🧪 Test Error: This is a deliberate error to test ErrorBoundary');
  }

  // Déclencher une erreur de propriété dans le render
  if (shouldThrowPropertyError) {
    const obj: any = null;
    // This will throw: Cannot read property 'nonexistent' of null
    }

  // Déclencher une erreur asynchrone (ne sera pas attrapée par ErrorBoundary)
  const triggerAsyncError = () => {
    setTimeout(() => {
      throw new Error('🧪 Async Error: This error will NOT be caught by ErrorBoundary');
    }, 100);
  };

  // Déclencher une erreur dans un Promise (ne sera pas attrapée par ErrorBoundary)
  const triggerPromiseError = () => {
    Promise.reject(new Error('🧪 Promise Error: This error will NOT be caught by ErrorBoundary'))
      .catch(error => {
        console.error('Promise error caught in component:', error);
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Error Boundary Test</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.description}>
        Use these buttons to test different types of errors and see how the ErrorBoundary handles them.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => setShouldThrowError(true)}
        >
          <Ionicons name="warning" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Throw Render Error</Text>
          <Text style={styles.buttonSubtext}>Will be caught by ErrorBoundary</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => setShouldThrowPropertyError(true)}
        >
          <Ionicons name="bug" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Property Access Error</Text>
          <Text style={styles.buttonSubtext}>Will be caught by ErrorBoundary</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.warningButton}
          onPress={triggerAsyncError}
        >
          <Ionicons name="time" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Async Error (setTimeout)</Text>
          <Text style={styles.buttonSubtext}>Will NOT be caught (check console)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.warningButton}
          onPress={triggerPromiseError}
        >
          <Ionicons name="cloud-offline" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Promise Rejection</Text>
          <Text style={styles.buttonSubtext}>Will NOT be caught (check console)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>ℹ️ What to expect:</Text>
        <Text style={styles.infoText}>
          • Red buttons: Will trigger ErrorBoundary screen{'\n'}
          • Orange buttons: Will only log to console{'\n'}
          • ErrorBoundary only catches render-time errors
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  description: {
    fontSize: 16,
    color: '#AAAAAA',
    lineHeight: 22,
    marginBottom: 30,
  },
  buttonContainer: {
    gap: 16,
  },
  errorButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  warningButton: {
    backgroundColor: '#FFB84D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  infoContainer: {
    marginTop: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 20,
  },
}); 