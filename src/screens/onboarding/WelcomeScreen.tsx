import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FadeInText } from '../../components/common/FadeInText';
import { FadeInView } from '../../components/common/FadeInView';
import { TypewriterText } from '../../components/common/TypewriterText';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0F" />
      
      <View style={styles.content}>
        {/* Logo/Icône principale */}
        <View style={styles.logoContainer}>
          <Ionicons name="fitness-outline" size={64} color="#FFFFFF" />
        </View>

        {/* Titre principal avec effet TypewriterText */}
        <TypewriterText
          text="Welcome to Peak"
          style={styles.title}
          speed={100}
        />
        
        {/* Sous-titre avec effet FadeIn */}
        <FadeInText
          text="Your journey to peak fitness starts here. Let's get to know you better so we can create the perfect workout experience."
          style={styles.subtitle}
          startDelay={2000}
        />

        {/* Liste des bénéfices */}
        <View style={styles.benefitsContainer}>
          <FadeInView startDelay={3000}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Personalized workout plans</Text>
            </View>
          </FadeInView>
          
          <FadeInView startDelay={3500}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Track your progress</Text>
            </View>
          </FadeInView>
          
          <FadeInView startDelay={4000}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.benefitText}>Achieve your fitness goals</Text>
            </View>
          </FadeInView>
        </View>
      </View>

      {/* Bouton Get Started */}
      <FadeInView startDelay={4500}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.getStartedButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#000000" />
          </TouchableOpacity>
        </View>
      </FadeInView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 48,
    padding: 24,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 48,
  },
  benefitsContainer: {
    width: '100%',
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  benefitText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
