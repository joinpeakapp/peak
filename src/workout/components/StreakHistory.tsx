import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { StreakData, StreakHistoryEntry, Workout } from '../../types/workout';
import { useStreak } from '../contexts/StreakContext';
import { theme } from '../../constants/theme';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMemo } from 'react';

interface StreakHistoryProps {
  workoutId: string;
  streakData: StreakData | null;
  loading: boolean;
}

export const StreakHistory: React.FC<StreakHistoryProps> = ({ 
  workoutId, 
  streakData, 
  loading 
}) => {
  // Sort streak history by start date (most recent first)
  const sortedHistory = useMemo(() => {
    if (!streakData?.streakHistory) return [];
    
    return [...streakData.streakHistory].sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return dateB.getTime() - dateA.getTime();
    });
  }, [streakData?.streakHistory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatBestStreakText = (streakData: StreakData | null) => {
    if (!streakData || streakData.longest === 0) {
      return 'Aucune série pour le moment';
    }
    
    const sessionText = streakData.longest === 1 ? 'session' : 'sessions';
    return `Meilleure série : ${streakData.longest} ${sessionText}`;
  };

  const renderHistoryItem = ({ item: entry, index }: { item: StreakHistoryEntry, index: number }) => {
    const progress = entry.count / (streakData?.longest || 1);
    return (
      <View style={styles.historyItem}>
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
  };

  const renderHeader = () => (
    <>
      <Text style={styles.title}>Historique des Streaks</Text>
      
      <View style={styles.bestStreakContainer}>
        <Text style={styles.bestStreakTitle}>🔥</Text>
        <Text style={styles.bestStreakValue}>
          {formatBestStreakText(streakData)}
        </Text>
      </View>
    </>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>Aucun historique de streak disponible</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Chargement de l'historique...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item, index) => `${item.startDate}-${item.endDate}-${index}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={8}
        windowSize={10}
        contentContainerStyle={styles.listContent}
      />
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
  listContent: {
    paddingBottom: theme.spacing.md,
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#191A1D',
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.md,
  },
  emptyStateText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
}); 