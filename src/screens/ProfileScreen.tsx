import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkout } from '../hooks/useWorkout';
import { useNavigation } from '@react-navigation/native';
import { ProfileScreenProps } from '../types/navigation';
import { PersonalRecordService } from '../services/personalRecordService';
import { PersonalRecordBadge } from '../workout/components/PersonalRecordBadge';

// Types pour organiser les records par catégorie
interface PersonalRecordsByCategory {
  [category: string]: Array<{
    exerciseName: string;
    weight: number;
    reps: number;
    date: string;
  }>;
}

export const ProfileScreen: React.FC = () => {
  const { personalRecords } = useWorkout();
  const navigation = useNavigation<ProfileScreenProps['navigation']>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Utiliser le service pour récupérer les records par catégorie
  const recordsByCategory = useMemo(() => {
    return PersonalRecordService.getRecordsByCategory(personalRecords);
  }, [personalRecords]);

  // Liste des catégories qui ont au moins un record
  const categoriesWithRecords = useMemo(() => {
    return Object.entries(recordsByCategory)
      .filter(([_, records]) => records.length > 0)
      .map(([category]) => category);
  }, [recordsByCategory]);

  // Afficher un message si aucun record n'est disponible
  if (categoriesWithRecords.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes Records</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={64} color="#444" />
          <Text style={styles.emptyText}>
            Aucun record personnel enregistré
          </Text>
          <Text style={styles.emptySubtext}>
            Complétez des entraînements pour voir vos records apparaître ici
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Records</Text>
      </View>
      
      {/* Sélecteur de catégorie */}
      <View style={styles.categorySelector}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categorySelectorContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === null && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === null && styles.categoryButtonTextActive
            ]}>
              Tous
            </Text>
          </TouchableOpacity>
          
          {categoriesWithRecords.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Liste des records */}
      <ScrollView style={styles.recordsContainer}>
        {(selectedCategory === null ? categoriesWithRecords : [selectedCategory]).map((category) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            
            {recordsByCategory[category].map((record, index) => (
              <View key={`${record.exerciseName}_${index}`} style={styles.recordCard}>
                <View style={styles.recordInfo}>
                  <View style={styles.exerciseNameContainer}>
                    <Text style={styles.exerciseName}>
                      {record.exerciseName}
                    </Text>
                    <PersonalRecordBadge size="small" />
                  </View>
                  <Text style={styles.recordDate}>
                    {new Date(record.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                
                <View style={styles.recordValues}>
                  <View style={styles.recordValue}>
                    <Text style={styles.recordValueNumber}>{record.weight}</Text>
                    <Text style={styles.recordValueUnit}>kg</Text>
                  </View>
                  
                  <Text style={styles.recordValueSeparator}>×</Text>
                  
                  <View style={styles.recordValue}>
                    <Text style={styles.recordValueNumber}>{record.reps}</Text>
                    <Text style={styles.recordValueUnit}>reps</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
  categorySelector: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  categorySelectorContent: {
    paddingHorizontal: 15,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  categoryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#000000',
  },
  recordsContainer: {
    flex: 1,
    padding: 15,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  recordCard: {
    backgroundColor: '#1A1A1D',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordInfo: {
    flex: 1,
  },
  exerciseNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginRight: 8,
  },
  recordDate: {
    fontSize: 12,
    color: '#888',
  },
  recordValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  recordValueNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  recordValueUnit: {
    fontSize: 12,
    color: '#888',
    marginLeft: 2,
  },
  recordValueSeparator: {
    fontSize: 16,
    color: '#888',
    marginHorizontal: 8,
  },
}); 