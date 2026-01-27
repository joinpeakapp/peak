import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CachedImage } from '../../components/common/CachedImage';
import { PhotoStorageService } from '../../services/photoStorageService';

interface ProfileSetupScreenProps {
  onContinue: (firstName: string, profilePhotoUri?: string) => void;
}

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({
  onContinue,
}) => {
  const [firstName, setFirstName] = useState('');
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | undefined>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSelectPhoto = async () => {
    try {
      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (galleryStatus !== 'granted') {
        Alert.alert(
          'Permission required',
          'We need access to your photos to set your profile picture.'
        );
        return;
      }

      Alert.alert(
        'Choose a photo',
        'Where would you like to take your photo from?',
        [
          {
            text: 'Gallery',
            onPress: async () => {
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
            },
          },
          {
            text: 'Camera',
            onPress: async () => {
              const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
              
              if (cameraStatus !== 'granted') {
                Alert.alert(
                  'Permission required',
                  'We need access to your camera to take a photo.'
                );
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                // Sauvegarder la photo de manière permanente avant de l'afficher
                const permanentUri = await PhotoStorageService.saveProfilePhoto(result.assets[0].uri);
                setProfilePhotoUri(permanentUri);
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('[ProfileSetupScreen] Error selecting photo:', error);
      Alert.alert('Error', 'An error occurred while selecting the photo.');
    }
  };

  const handleContinue = () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name.');
      return;
    }
    onContinue(firstName.trim(), profilePhotoUri);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Content */}
          <Animated.View
            style={[
              styles.topContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.title}>Create your profile</Text>
            <Text style={styles.description}>
              Let's start by personalizing your profile with your name and a photo.
            </Text>

            {/* Photo de profil */}
            <View style={styles.photoWrapper}>
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
                  <Ionicons name="create-outline" size={18} color="#000000" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Nom */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom Button */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.button, !firstName.trim() && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!firstName.trim()}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Espace pour le bouton fixe
  },
  topContent: {
    paddingTop: 120,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 48,
    opacity: 0.7,
  },
  photoWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0D0D0F',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    height: 56,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 48,
    left: 40,
    right: 40,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1000,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins-SemiBold',
  },
});
