import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageOptimizationService from '../../services/imageOptimizationService';
import { OptimizedImage } from './OptimizedImage';

interface ImageCacheTestComponentProps {
  onClose: () => void;
}

export const ImageCacheTestComponent: React.FC<ImageCacheTestComponentProps> = ({ onClose }) => {
  const [cacheStats, setCacheStats] = useState({
    itemCount: 0,
    totalSize: 0,
    oldestItem: 0,
    newestItem: 0,
  });
  const [testImageUri, setTestImageUri] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedUri, setOptimizedUri] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Charger les statistiques du cache
  const loadCacheStats = async () => {
    try {
      const stats = await ImageOptimizationService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Error loading cache stats:', error);
    }
  };

  useEffect(() => {
    loadCacheStats();
  }, []);

  // Tester l'optimisation d'image
  const testImageOptimization = async () => {
    if (!testImageUri) {
      Alert.alert('Erreur', 'Veuillez saisir une URI d\'image');
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await ImageOptimizationService.optimizeWorkoutPhoto(testImageUri);
      setOptimizedUri(result);
      await loadCacheStats(); // Recharger les stats après optimisation
      Alert.alert('Succès', 'Image optimisée avec succès !');
    } catch (error) {
      console.error('Error optimizing image:', error);
      Alert.alert('Erreur', 'Échec de l\'optimisation de l\'image');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Vider le cache
  const clearCache = async () => {
    Alert.alert(
      'Vider le cache',
      'Êtes-vous sûr de vouloir vider tout le cache d\'images ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              await ImageOptimizationService.clearCache();
              await loadCacheStats();
              Alert.alert('Succès', 'Cache vidé avec succès !');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Erreur', 'Échec du vidage du cache');
            } finally {
              setIsClearing(false);
            }
          }
        }
      ]
    );
  };

  // Formater la date
  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🖼️ Image Optimization Test</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistiques du cache */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Cache Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Items:</Text>
              <Text style={styles.statValue}>{cacheStats.itemCount}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Size:</Text>
              <Text style={styles.statValue}>
                {ImageOptimizationService.formatSize(cacheStats.totalSize)}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Oldest Item:</Text>
              <Text style={styles.statValue}>{formatDate(cacheStats.oldestItem)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Newest Item:</Text>
              <Text style={styles.statValue}>{formatDate(cacheStats.newestItem)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.refreshButton]}
            onPress={loadCacheStats}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Refresh Stats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearCache}
            disabled={isClearing}
          >
            {isClearing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="trash" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.buttonText}>Clear Cache</Text>
          </TouchableOpacity>
        </View>

        {/* Test d'optimisation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Test Image Optimization</Text>
          
          <Text style={styles.inputLabel}>Image URI:</Text>
          <TextInput
            style={styles.textInput}
            value={testImageUri}
            onChangeText={setTestImageUri}
            placeholder="https://example.com/image.jpg"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            multiline
          />

          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={testImageOptimization}
            disabled={isOptimizing || !testImageUri}
          >
            {isOptimizing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.buttonText}>Optimize Image</Text>
          </TouchableOpacity>

          {/* Affichage du résultat */}
          {optimizedUri && (
            <View style={styles.imageResultContainer}>
              <Text style={styles.resultTitle}>✅ Optimized Image:</Text>
              <OptimizedImage
                uri={optimizedUri}
                style={styles.testImage}
                resizeMode="cover"
                placeholder={
                  <ActivityIndicator size="large" color="rgba(255, 255, 255, 0.5)" />
                }
              />
              <Text style={styles.resultUri} numberOfLines={3} ellipsizeMode="middle">
                {optimizedUri}
              </Text>
            </View>
          )}
        </View>

        {/* Instructions d'utilisation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Features Tested</Text>
          <View style={styles.featuresList}>
            <Text style={styles.featureItem}>✅ Automatic image compression (quality: 85%)</Text>
            <Text style={styles.featureItem}>✅ Image resizing (max: 800x1200px)</Text>
            <Text style={styles.featureItem}>✅ Mirror correction for front camera photos</Text>
            <Text style={styles.featureItem}>✅ Automatic orientation correction (EXIF)</Text>
            <Text style={styles.featureItem}>✅ Smart caching system (100MB max)</Text>
            <Text style={styles.featureItem}>✅ Cache cleanup (30 days TTL)</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  statsContainer: {
    backgroundColor: '#1A1A1D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  statValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  refreshButton: {
    backgroundColor: '#10B981',
  },
  clearButton: {
    backgroundColor: '#EF4444',
  },
  testButton: {
    backgroundColor: '#3B82F6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1A1A1D',
    borderRadius: 10,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 15,
    minHeight: 50,
  },
  imageResultContainer: {
    backgroundColor: '#1A1A1D',
    borderRadius: 12,
    padding: 16,
    marginTop: 15,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 10,
  },
  testImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  resultUri: {
    fontSize: 12,
    color: '#AAAAAA',
    fontFamily: 'monospace',
  },
  featuresList: {
    backgroundColor: '#1A1A1D',
    borderRadius: 12,
    padding: 16,
  },
  featureItem: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 20,
  },
}); 