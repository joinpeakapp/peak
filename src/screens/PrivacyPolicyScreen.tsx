import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last Updated: January 30, 2026</Text>

        <Section title="Introduction">
          <Text style={styles.paragraph}>
            Peak ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use the Peak mobile application.
          </Text>
        </Section>

        <Section title="Information We Collect">
          <Text style={styles.sectionSubtitle}>Information Stored Locally on Your Device</Text>
          <Text style={styles.paragraph}>
            Peak is designed with privacy in mind. All your workout data is stored <Text style={styles.bold}>locally on your device</Text> and is never transmitted to our servers. This includes:
          </Text>
          <BulletPoint text="Workout Templates: Your custom workout routines, exercises, sets, reps, and rest timers" />
          <BulletPoint text="Workout History: Records of completed workouts, including dates, durations, and performance data" />
          <BulletPoint text="Personal Records: Your best performances for each exercise" />
          <BulletPoint text="Streak Data: Your workout consistency tracking" />
          <BulletPoint text="Photos: Workout photos you take within the app (stored locally)" />
          <BulletPoint text="Settings: Your app preferences, notification settings, and language preferences" />
        </Section>

        <Section title="Information We Do NOT Collect">
          <Text style={styles.paragraph}>
            We do <Text style={styles.bold}>NOT</Text> collect, store, or transmit:
          </Text>
          <BulletPoint text="Personal identification information (name, email, phone number)" />
          <BulletPoint text="Location data" />
          <BulletPoint text="Health data beyond what you manually enter" />
          <BulletPoint text="Payment information" />
          <BulletPoint text="Device identifiers for tracking purposes" />
          <BulletPoint text="Analytics or usage data" />
        </Section>

        <Section title="How We Use Your Information">
          <Text style={styles.paragraph}>
            Since all data is stored locally on your device:
          </Text>
          <BulletPoint text="Workout Tracking: To display your workout history, progress, and statistics" />
          <BulletPoint text="Notifications: To send you local reminders for scheduled workouts (if enabled)" />
          <BulletPoint text="App Functionality: To provide core features like rest timers, exercise tracking, and personal records" />
        </Section>

        <Section title="Data Storage and Security">
          <BulletPoint text="Local Storage: All data is stored on your device using secure iOS storage mechanisms" />
          <BulletPoint text="No Cloud Sync: We do not sync your data to any cloud servers" />
          <BulletPoint text="No Third-Party Access: Your data is never shared with third parties" />
          <BulletPoint text="Device Security: Your data security depends on your device's security settings (passcode, Face ID, etc.)" />
        </Section>

        <Section title="Permissions We Request">
          <Text style={styles.paragraph}>
            Peak may request the following permissions:
          </Text>
          <BulletPoint text="Camera: To take workout photos (optional, only when you choose to take a photo)" />
          <BulletPoint text="Photo Library: To save or select workout photos (optional)" />
          <BulletPoint text="Notifications: To send workout reminders (optional, can be disabled in settings)" />
          <Text style={styles.paragraph}>
            All permissions are optional and only requested when needed for specific features.
          </Text>
        </Section>

        <Section title="Your Rights">
          <Text style={styles.paragraph}>
            You have the right to:
          </Text>
          <BulletPoint text="Access: View all your data within the app" />
          <BulletPoint text="Modify: Edit or update your workout data at any time" />
          <BulletPoint text="Delete: Remove individual workouts or clear all data" />
          <BulletPoint text="Export: Backup your data through device backups" />
          <BulletPoint text="Control: Manage app permissions in your device settings" />
        </Section>

        <Section title="Contact Us">
          <Text style={styles.paragraph}>
            If you have questions about this Privacy Policy or your data, please contact us:
          </Text>
          <Text style={styles.contactEmail}>joinpeakapp@gmail.com</Text>
          <Text style={styles.paragraph}>
            We will respond to your inquiry within 48 hours.
          </Text>
        </Section>

        <Section title="Changes to This Privacy Policy">
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date at the top of this policy and displaying a notice in the app for significant changes.
          </Text>
        </Section>

        <Section title="Compliance">
          <Text style={styles.paragraph}>
            This Privacy Policy complies with:
          </Text>
          <BulletPoint text="Apple App Store Guidelines" />
          <BulletPoint text="General Data Protection Regulation (GDPR) principles" />
          <BulletPoint text="California Consumer Privacy Act (CCPA) principles" />
          <BulletPoint text="Children's Online Privacy Protection Act (COPPA)" />
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Peak - Your Privacy-First Workout Tracker</Text>
          <Text style={styles.footerEmail}>joinpeakapp@gmail.com</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const BulletPoint: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.bulletContainer}>
    <Text style={styles.bullet}>•</Text>
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  bold: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  contactEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 12,
  },
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  footerEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
