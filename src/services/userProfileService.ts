import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersonalRecords } from '../types/workout';

export interface UserProfile {
  firstName: string;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal: 'strength' | 'consistency' | 'progress';
  onboardingCompleted: boolean;
  createdAt: string;
  personalRecords: PersonalRecords; // Ajout des PRs dans le profil
}

export interface OnboardingData {
  firstName?: string;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal?: 'strength' | 'consistency' | 'progress';
}

class UserProfileService {
  private static readonly USER_PROFILE_KEY = 'user_profile';

  /**
   * Récupère le profil utilisateur
   */
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profileData = await AsyncStorage.getItem(this.USER_PROFILE_KEY);
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  /**
   * Sauvegarde le profil utilisateur complet
   */
  static async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(profile));
      console.log('✅ User profile saved successfully');
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  }

  /**
   * Met à jour des données partielles du profil
   */
  static async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      const currentProfile = await this.getUserProfile();
      const updatedProfile = { ...currentProfile, ...updates };
      await this.saveUserProfile(updatedProfile as UserProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Complète l'onboarding avec les données collectées
   */
  static async completeOnboarding(data: OnboardingData): Promise<UserProfile> {
    try {
      const profile: UserProfile = {
        firstName: data.firstName || 'User',
        fitnessLevel: data.fitnessLevel || 'beginner',
        primaryGoal: data.primaryGoal || 'progress',
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        personalRecords: {}, // Initialiser avec des PRs vides
      };

      await this.saveUserProfile(profile);
      console.log('✅ Onboarding completed for:', profile.firstName);
      return profile;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  /**
   * Vérifie si l'onboarding a été complété
   */
  static async isOnboardingCompleted(): Promise<boolean> {
    try {
      const profile = await this.getUserProfile();
      return profile?.onboardingCompleted === true;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Remet à zéro le profil utilisateur (pour développement/tests)
   */
  static async resetUserProfile(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.USER_PROFILE_KEY);
      console.log('🔄 User profile reset');
    } catch (error) {
      console.error('Error resetting user profile:', error);
      throw error;
    }
  }

  /**
   * Obtient le label d'affichage pour le niveau de fitness
   */
  static getFitnessLevelLabel(level: UserProfile['fitnessLevel']): string {
    switch (level) {
      case 'beginner':
        return 'Beginner';
      case 'intermediate':
        return 'Intermediate';
      case 'advanced':
        return 'Advanced';
      default:
        return 'Unknown';
    }
  }

  /**
   * Obtient le label d'affichage pour l'objectif principal
   */
  static getPrimaryGoalLabel(goal: UserProfile['primaryGoal']): string {
    switch (goal) {
      case 'strength':
        return 'Build Strength';
      case 'consistency':
        return 'Stay Consistent';
      case 'progress':
        return 'Track Progress';
      default:
        return 'Unknown';
    }
  }

  /**
   * Met à jour les Personal Records dans le profil utilisateur
   */
  static async updatePersonalRecords(records: PersonalRecords): Promise<void> {
    try {
      const currentProfile = await this.getUserProfile();
      if (!currentProfile) {
        throw new Error('No user profile found');
      }

      const updatedProfile: UserProfile = {
        ...currentProfile,
        personalRecords: records
      };

      await this.saveUserProfile(updatedProfile);
      console.log('✅ Personal records updated in profile');
    } catch (error) {
      console.error('Error updating personal records:', error);
      throw error;
    }
  }

  /**
   * Récupère les Personal Records depuis le profil utilisateur
   */
  static async getPersonalRecords(): Promise<PersonalRecords> {
    try {
      const profile = await this.getUserProfile();
      return profile?.personalRecords || {};
    } catch (error) {
      console.error('Error loading personal records:', error);
      return {};
    }
  }
}

export default UserProfileService; 