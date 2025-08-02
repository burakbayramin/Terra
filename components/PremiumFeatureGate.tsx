import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { usePremium } from '@/hooks/usePremium';
import { Ionicons } from '@expo/vector-icons';

interface PremiumFeatureGateProps {
  featureName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeButton?: boolean;
}

export default function PremiumFeatureGate({
  featureName,
  children,
  fallback,
  showUpgradeButton = true,
}: PremiumFeatureGateProps) {
  const { hasFeature, currentPackage } = usePremium();
  const router = useRouter();

  if (hasFeature(featureName)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="diamond" size={32} color={colors.primary} />
        </View>
        <Text style={styles.title}>Premium Özellik</Text>
        <Text style={styles.description}>
          Bu özellik {currentPackage?.name || 'Free Package'} paketinde mevcut değil.
        </Text>
        {showUpgradeButton && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push('/(protected)/premium-packages')}
          >
            <Text style={styles.upgradeButtonText}>Paketleri Görüntüle</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.light.background,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.light.surface,
    borderRadius: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 