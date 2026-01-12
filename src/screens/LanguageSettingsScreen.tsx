import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LanguageService, Language } from '../i18n/languageService';
import i18n from '../i18n';

export const LanguageSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  // Recharger la langue quand on revient sur cet écran
  useFocusEffect(
    React.useCallback(() => {
      loadLanguage();
    }, [])
  );

  const loadLanguage = async () => {
    const lang = await LanguageService.getLanguage();
    setCurrentLanguage(lang);
  };

  const handleLanguageSelect = async (language: Language) => {
    setCurrentLanguage(language);
    await LanguageService.setLanguage(language);
    await i18n.changeLanguage(language);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('settings.language.title')}</Text>
        <Text style={styles.subtitle}>{t('settings.language.subtitle')}</Text>

        {/* Options de langue */}
        <View style={styles.languageOptions}>
          <TouchableOpacity
            style={[
              styles.languageOption,
              currentLanguage === 'en' && styles.languageOptionSelected,
            ]}
            onPress={() => handleLanguageSelect('en')}
            activeOpacity={0.7}
          >
            <View style={styles.languageContent}>
              <View style={styles.languageTextContainer}>
                <View style={styles.flagContainer}>
                  <Text style={styles.flagEmoji}>🇬🇧</Text>
                </View>
                <Text
                  style={[
                    styles.languageText,
                    currentLanguage === 'en' && styles.languageTextSelected,
                  ]}
                >
                  {t('settings.language.english')}
                </Text>
              </View>
              {currentLanguage === 'en' && (
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.languageOption,
              currentLanguage === 'fr' && styles.languageOptionSelected,
            ]}
            onPress={() => handleLanguageSelect('fr')}
            activeOpacity={0.7}
          >
            <View style={styles.languageContent}>
              <View style={styles.languageTextContainer}>
                <View style={styles.flagContainer}>
                  <Text style={styles.flagEmoji}>🇫🇷</Text>
                </View>
                <Text
                  style={[
                    styles.languageText,
                    currentLanguage === 'fr' && styles.languageTextSelected,
                  ]}
                >
                  {t('settings.language.french')}
                </Text>
              </View>
              {currentLanguage === 'fr' && (
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
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
    backgroundColor: '#0D0D0F',
  },
  backButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  languageOptions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  languageOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: '#FFFFFF',
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  languageTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  languageText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    includeFontPadding: false,
  },
  languageTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  flagContainer: {
    width: 24,
    height: 24,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagEmoji: {
    fontSize: 20,
    lineHeight: 20,
    includeFontPadding: false,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingTop: 32,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
});

