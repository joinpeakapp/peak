import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { StreakData, StreakHistoryEntry, Workout } from '../../types/workout';
import { useStreak } from '../contexts/StreakContext';
import { theme } from '../../constants/theme';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StreakHistoryProps {
  workout: Workout;
  maxItems?: number;
}

export const StreakHistory: React.FC<StreakHistoryProps> = ({ 
  workout, 
  maxItems = 5 
}) => {
  const { getWorkoutStreak, formatBestStreakText } = useStreak();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStreakData = async () => {
      try {
        setLoading(true);
        const data = await getWorkoutStreak(workout.id, workout);
        setStreakData(data);
      } catch (error) {
        console.error("[StreakHistory] Error loading streak data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStreakData();
  }, [workout.id, getWorkoutStreak, workout]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (!streakData || !streakData.streakHistory || streakData.streakHistory.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucun historique de streak disponible</Text>
      </View>
    );
  }

  // Trier l'historique par ordre décroissant de count et prendre les maxItems éléments
  const sortedHistory = [...streakData.streakHistory]
    .sort((a, b) => b.count - a.count)
    .slice(0, maxItems);

  const formatDate = (dateStr: string) => {
    try {
      const date = parse(dateStr, 'yyyy-MM-dd', new Date());
      return format(date, 'd MMM yyyy', { locale: fr });
    } catch (error) {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historique des Streaks</Text>
      
      <View style={styles.bestStreakContainer}>
        <Text style={styles.bestStreakTitle}>🔥</Text>
        <Text style={styles.bestStreakValue}>
          {formatBestStreakText(streakData)}
        </Text>
      </View>
      
      <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
        {sortedHistory.map((entry, index) => {
          const progress = entry.count / (streakData?.longest || 1);
          return (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyItemHeader}>
                <Text style={styles.historyItemCount}>
                  {entry.count} session{entry.count > 1 ? 's' : ''}
                </Text>
                <View style={styles.historyItemDates}>
                  <Text style={styles.historyItemDateText}>
                    {entry.startDate === entry.endDate
                      ? formatDate(entry.startDate)
                      : `${formatDate(entry.startDate)} - ${formatDate(entry.endDate)}`
                    }
                  </Text>
                </View>
              </View>
              <View style={styles.historyItemBar}>
                <View 
                  style={[
                    styles.historyItemProgress, 
                    { 
                      width: `${progress * 100}%`,
                      backgroundColor: theme.colors.primary 
                    }
                  ]} 
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: '#191A1D',
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.md,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#191A1D',
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: theme.spacing.md,
  },
  bestStreakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    backgroundColor: 'rgba(244, 81, 30, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  bestStreakTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: theme.spacing.sm,
  },
  bestStreakValue: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  historyList: {
    marginTop: theme.spacing.md,
  },
  historyItem: {
    marginBottom: theme.spacing.md,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.xs,
  },
  historyItemCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyItemDates: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemDateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  historyItemBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  historyItemProgress: {
    height: '100%',
    borderRadius: theme.borderRadius.md,
  },
}); 