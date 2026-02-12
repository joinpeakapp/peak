import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CachedImage } from './CachedImage';
import { UserProfile } from '../../services/userProfileService';
import UserProfileService from '../../services/userProfileService';
import { PhotoStorageService } from '../../services/photoStorageService';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onProfileUpdated: (profile: UserProfile) => void;
}

const { height } = Dimensions.get('window');
const ANIMATION_DURATION = 300;

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  userProfile,
  onProfileUpdated,
}) => {
  const [firstName, setFirstName] = useState('');
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  
  // Animation values
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  // Initialiser les valeurs depuis le profil utilisateur
  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || '');
      setProfilePhotoUri(userProfile.profilePhotoUri);
    }
  }, [userProfile]);

  // Animation logic
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      slideAnim.setValue(height);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, modalVisible]);

  const handleSelectPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de l\'accès à vos photos pour définir votre photo de profil.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Sauvegarder la photo de manière permanente avant de l'afficher
        const permanentUri = await PhotoStorageService.saveProfilePhoto(result.assets[0].uri);
        setProfilePhotoUri(permanentUri);
      }
    } catch (error) {
      console.error('[EditProfileModal] Error selecting photo:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sélection de la photo.');
    }
  };

  const handleSave = async () => {
    if (!userProfile) return;

    if (!firstName.trim()) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedProfile: UserProfile = {
        ...userProfile,
        firstName: firstName.trim(),
        profilePhotoUri,
      };

      await UserProfileService.saveUserProfile(updatedProfile);
      onProfileUpdated(updatedProfile);
      onClose();
    } catch (error) {
      console.error('[EditProfileModal] Error saving profile:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!modalVisible && !visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.backdrop, 
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={onClose} 
          />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.modalContainer, 
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.handle} />
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
            >
              <Ionicons name="arrow-down" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Titre maintenant dans le ScrollView */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Edit Profile</Text>
            </View>
            {/* Photo de profil */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile Photo</Text>
              <TouchableOpacity
                onPress={handleSelectPhoto}
                style={styles.photoContainer}
                activeOpacity={0.8}
              >
                {profilePhotoUri ? (
                  <CachedImage uri={profilePhotoUri} style={styles.profilePhoto} />
                ) : (
                  <View style={styles.profilePhotoPlaceholder}>
                    <Ionicons name="person" size={48} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.editPhotoOverlay}>
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Nom */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your name"
                placeholderTextColor="#888"
                autoCapitalize="words"
              />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 100,
    backgroundColor: '#0D0D0F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  closeButton: {
    alignSelf: 'flex-start',
    padding: 8,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#0D0D0F',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  photoContainer: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
    position: 'relative',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  profilePhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0D0D0F',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

