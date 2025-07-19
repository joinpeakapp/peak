import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

/**
 * ErrorBoundary global pour capturer et gérer les erreurs React
 * Empêche l'application de crasher complètement et offre une interface de récupération
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Méthode statique appelée quand une erreur est attrapée
   * Met à jour l'état pour afficher l'interface d'erreur
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Méthode appelée quand une erreur est attrapée
   * Permet de logger l'erreur pour le debugging
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Logger l'erreur pour le debugging
    console.error('🚨 [ErrorBoundary] Error caught:', error);
    console.error('🚨 [ErrorBoundary] Error info:', errorInfo);
    
    // Mettre à jour l'état avec les informations d'erreur
    this.setState({
      error,
      errorInfo,
    });

    // TODO: En production, envoyer l'erreur à un service de monitoring
    // comme Sentry, Bugsnag, etc.
    // this.reportErrorToService(error, errorInfo);
  }

  /**
   * Méthode pour réinitialiser l'état d'erreur
   * Permet à l'utilisateur de tenter une récupération
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Méthode pour recharger l'application complètement
   */
  handleReload = () => {
    // En développement, on peut juste reset le state
    if (__DEV__) {
      this.handleReset();
      return;
    }

    // En production, on pourrait utiliser un module comme expo-updates
    // ou rediriger vers un écran de redémarrage
    this.handleReset();
  };

  /**
   * Formater l'erreur pour l'affichage
   */
  formatErrorForDisplay = (error: Error): string => {
    if (!error) return 'Unknown error occurred';
    
    // En développement, afficher plus de détails
    if (__DEV__) {
      return `${error.name}: ${error.message}`;
    }
    
    // En production, afficher un message plus user-friendly
    return 'Something went wrong. Please try again.';
  };

  /**
   * Obtenir un code d'erreur simple pour le support
   */
  getErrorCode = (): string => {
    const timestamp = Date.now().toString(36);
    const errorHash = this.state.error?.name?.slice(0, 3) || 'UNK';
    return `${errorHash}-${timestamp}`;
  };

  render() {
    if (this.state.hasError) {
      const errorCode = this.getErrorCode();
      
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView 
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Icône d'erreur */}
            <View style={styles.iconContainer}>
              <Ionicons name="warning-outline" size={64} color="#FF6B6B" />
            </View>
            
            {/* Titre */}
            <Text style={styles.title}>Oops! Something went wrong</Text>
            
            {/* Message d'erreur */}
            <Text style={styles.message}>
              We encountered an unexpected error. Don't worry, your data is safe.
            </Text>
            
            {/* Détails de l'erreur (en développement) */}
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetailsContainer}>
                <Text style={styles.errorDetailsTitle}>Error Details (Dev Mode):</Text>
                <ScrollView style={styles.errorDetailsScroll}>
                  <Text style={styles.errorDetailsText}>
                    {this.formatErrorForDisplay(this.state.error)}
                  </Text>
                  {this.state.errorInfo?.componentStack && (
                    <Text style={styles.errorDetailsText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}
            
            {/* Code d'erreur pour le support */}
            <View style={styles.errorCodeContainer}>
              <Text style={styles.errorCodeLabel}>Error Code:</Text>
              <Text style={styles.errorCodeText}>{errorCode}</Text>
            </View>
            
            {/* Boutons d'action */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={this.handleReset}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={this.handleReload}
                activeOpacity={0.8}
              >
                <Ionicons name="reload-outline" size={20} color="#FFFFFF" />
                <Text style={styles.secondaryButtonText}>Restart App</Text>
              </TouchableOpacity>
            </View>
            
            {/* Message d'aide */}
            <Text style={styles.helpText}>
              If the problem persists, please contact support with the error code above.
            </Text>
          </ScrollView>
        </SafeAreaView>
      );
    }

    // Si pas d'erreur, afficher les children normalement
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorDetailsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    maxHeight: 200,
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  errorDetailsScroll: {
    maxHeight: 150,
  },
  errorDetailsText: {
    fontSize: 12,
    color: '#FFAAAA',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  errorCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 32,
  },
  errorCodeLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginRight: 8,
  },
  errorCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D0D0F',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helpText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 24,
  },
}); 