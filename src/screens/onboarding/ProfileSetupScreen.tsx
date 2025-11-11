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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CachedImage } from '../../components/common/CachedImage';

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
                setProfilePhotoUri(result.assets[0].uri);
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
                setProfilePhotoUri(result.assets[0].uri);
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
      <View style={styles.background}>
        <LinearGradient
          colors={['#3BDF3240', 'rgba(10, 10, 12, 0.25)']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
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

            {/* Nom */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Your first name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                placeholderTextColor="#888"
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, !firstName.trim() && styles.buttonDisabled]}
                onPress={handleContinue}
                disabled={!firstName.trim()}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 48,
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
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    opacity: 0.7,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 32,
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
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    marginBottom: 8,
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
  buttonContainer: {
    width: '100%',
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
