import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../utils/constants/colors';
import { DashboardStats } from '../../types/dashboard.types';

interface WelcomeSectionProps {
  userName: string;
  stats: DashboardStats;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ userName, stats }) => {
  const getComplianceColor = (score: number) => {
    if (score >= 90) return COLORS.secondary;
    if (score >= 75) return '#F59E0B'; // amber
    return COLORS.error;
  };

  const getUrgencyMessage = (days: number) => {
    if (days <= 30) return 'Urgent: Revalidation due soon';
    if (days <= 90) return 'Revalidation approaching';
    return 'Revalidation on track';
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 30) return COLORS.error;
    if (days <= 90) return '#F59E0B';
    return COLORS.secondary;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
        style={styles.welcomeCard}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeTitle}>Welcome back, {userName}!</Text>
          <Text style={styles.welcomeSubtitle}>Here's your professional overview</Text>
        </View>

        <View style={styles.statsGrid}>
          {/* CPD Hours */}
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.iconText}>📚</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{stats.cpdHoursLogged}</Text>
              <Text style={styles.statLabel}>CPD Hours</Text>
            </View>
          </View>

          {/* Days Until Revalidation */}
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: getUrgencyColor(stats.daysUntilRevalidation) }]}>
              <Text style={styles.iconText}>⏰</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{stats.daysUntilRevalidation}</Text>
              <Text style={styles.statLabel}>Days Left</Text>
            </View>
          </View>

          {/* Completed Activities */}
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.secondary }]}>
              <Text style={styles.iconText}>✅</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{stats.completedActivities}</Text>
              <Text style={styles.statLabel}>Activities</Text>
            </View>
          </View>

          {/* Compliance Score */}
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: getComplianceColor(stats.complianceScore) }]}>
              <Text style={styles.iconText}>🏆</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{stats.complianceScore}%</Text>
              <Text style={styles.statLabel}>Compliance</Text>
            </View>
          </View>
        </View>

        {/* Urgency Banner */}
        {stats.daysUntilRevalidation <= 90 && (
          <View style={[styles.urgencyBanner, { backgroundColor: `${getUrgencyColor(stats.daysUntilRevalidation)}15` }]}>
            <View style={[styles.urgencyDot, { backgroundColor: getUrgencyColor(stats.daysUntilRevalidation) }]} />
            <Text style={[styles.urgencyText, { color: getUrgencyColor(stats.daysUntilRevalidation) }]}>
              {getUrgencyMessage(stats.daysUntilRevalidation)}
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(107, 70, 193, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(107, 70, 193, 0.1)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default WelcomeSection;