import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LanguageService, Language } from '../../i18n/languageService';
import i18n from '../../i18n';

interface LanguageSelectionScreenProps {
  onContinue: () => void;
}

export const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({
  onContinue,
}) => {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Charger la langue sauvegardée
    const loadSavedLanguage = async () => {
      const savedLang = await LanguageService.getLanguage();
      setSelectedLanguage(savedLang);
    };
    loadSavedLanguage();

    // Animation d'entrée
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

  const handleLanguageSelect = async (language: Language) => {
    setSelectedLanguage(language);
    // Sauvegarder et changer la langue immédiatement
    await LanguageService.setLanguage(language);
    await i18n.changeLanguage(language);
  };

  const handleContinue = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onContinue();
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <LinearGradient
          colors={['#9B93E440', 'rgba(10, 10, 12, 0.25)']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="language" size={64} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>{t('onboarding.language.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.language.subtitle')}</Text>

        <View style={styles.languageOptions}>
          <TouchableOpacity
            style={[
              styles.languageOption,
              selectedLanguage === 'en' && styles.languageOptionSelected,
            ]}
            onPress={() => handleLanguageSelect('en')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.languageText,
                selectedLanguage === 'en' && styles.languageTextSelected,
              ]}
            >
              {t('onboarding.language.english')}
            </Text>
            {selectedLanguage === 'en' && (
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.languageOption,
              selectedLanguage === 'fr' && styles.languageOptionSelected,
            ]}
            onPress={() => handleLanguageSelect('fr')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.languageText,
                selectedLanguage === 'fr' && styles.languageTextSelected,
              ]}
            >
              {t('onboarding.language.french')}
            </Text>
            {selectedLanguage === 'fr' && (
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        <Animated.View style={{ width: '100%', transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>{t('onboarding.language.continue')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    opacity: 0.7,
  },
  languageOptions: {
    width: '100%',
    marginBottom: 48,
    gap: 16,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: '#FFFFFF',
  },
  languageText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Poppins-Regular',
  },
  languageTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1000,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins-SemiBold',
  },
});


