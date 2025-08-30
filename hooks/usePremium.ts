import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { 
  UserPremiumInfo,
  UserProfile,
  SubscriptionPlan,
  PremiumPackageType, 
  PaymentPeriod,
  SubscriptionStatus,
  PremiumFeature,
  PREMIUM_FEATURES,
  deriveUserPremiumInfo
} from '@/types/types';

export const usePremium = () => {
  const { user } = useAuth();
  const [premiumInfo, setPremiumInfo] = useState<UserPremiumInfo | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to check if user has access to a feature
  const hasFeatureAccess = (
    userPackage: PremiumPackageType,
    requiredLevel: PremiumPackageType
  ): boolean => {
    const packageLevels = {
      [PremiumPackageType.FREE]: 0,
      [PremiumPackageType.SUPPORTER]: 1,
      [PremiumPackageType.PROTECTOR]: 2,
      [PremiumPackageType.SPONSOR]: 3
    };
    
    return packageLevels[userPackage] >= packageLevels[requiredLevel];
  };

  // Helper function to get features available for a package
  const getAvailableFeatures = (packageType: PremiumPackageType): PremiumFeature[] => {
    return PREMIUM_FEATURES.filter(feature => 
      hasFeatureAccess(packageType, feature.requiredLevel)
    );
  };

  // Fetch user profile and subscription plan from database
  const fetchPremiumData = async () => {
    if (!user) {
      setPremiumInfo(null);
      setUserProfile(null);
      setSubscriptionPlan(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Type assertion for profile data
      const profile = profileData as UserProfile;
      setUserProfile(profile);

      let plan: SubscriptionPlan | null = null;

      // If user has a subscription plan, fetch it
      if (profile?.subscription_plan_id) {
        const { data: planData, error: planError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', profile.subscription_plan_id)
          .single();

        if (planError) {
          console.error('Error fetching subscription plan:', planError);
        } else {
          // Type assertion for plan data
          plan = planData as SubscriptionPlan;
          setSubscriptionPlan(plan);
        }
      }

      // Derive premium info from profile and plan
      const derivedPremiumInfo = deriveUserPremiumInfo(profile, plan);
      setPremiumInfo(derivedPremiumInfo);

    } catch (err) {
      console.error('Error fetching premium data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // Fallback to static data if database fetch fails
      setupStaticPremiumInfo();
    } finally {
      setLoading(false);
    }
  };

  // Static premium info fallback (for development/testing)
  const setupStaticPremiumInfo = () => {
    if (!user) {
      setPremiumInfo(null);
      return;
    }

    // Set users to Protector package (Premium 2) as fallback
    const staticPremiumInfo: UserPremiumInfo = {
      isPremium: true,
      premiumPackageType: PremiumPackageType.PROTECTOR,
      paymentPeriod: PaymentPeriod.MONTHLY,
      subscriptionStartDate: new Date().toISOString(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      isActive: true,
      autoRenew: false,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      price: 99.99,
      durationInDays: 30
    };

    setPremiumInfo(staticPremiumInfo);
  };

  // Check access to a specific feature
  const hasAccessToFeature = (featureId: string): boolean => {
    if (!premiumInfo || !premiumInfo.isPremium) {
      return false;
    }

    const feature = PREMIUM_FEATURES.find(f => f.id === featureId);
    if (!feature) {
      return true; // Undefined features are accessible by default
    }

    return hasFeatureAccess(premiumInfo.premiumPackageType, feature.requiredLevel);
  };

  // Check access to a specific level
  const hasAccessToLevel = (requiredLevel: PremiumPackageType): boolean => {
    if (!premiumInfo || !premiumInfo.isPremium) {
      return requiredLevel === PremiumPackageType.FREE;
    }

    return hasFeatureAccess(premiumInfo.premiumPackageType, requiredLevel);
  };

  // Get feature info
  const getFeatureInfo = (featureId: string): PremiumFeature | null => {
    return PREMIUM_FEATURES.find(f => f.id === featureId) || null;
  };

  // Get current level
  const getCurrentLevel = (): PremiumPackageType => {
    return premiumInfo?.premiumPackageType || PremiumPackageType.FREE;
  };

  // Check if premium
  const isPremium = (): boolean => {
    return premiumInfo?.isPremium || false;
  };

  // Check if subscription is active
  const isSubscriptionActive = (): boolean => {
    if (!premiumInfo) return false;
    
    // Check both status and end date
    if (premiumInfo.subscriptionStatus !== SubscriptionStatus.ACTIVE) {
      return false;
    }
    
    if (premiumInfo.subscriptionEndDate) {
      return new Date(premiumInfo.subscriptionEndDate) > new Date();
    }
    
    return premiumInfo.isActive;
  };

  // Get available features for current level
  const getMyAvailableFeatures = (): PremiumFeature[] => {
    const currentLevel = getCurrentLevel();
    return getAvailableFeatures(currentLevel);
  };

  // Update premium level (for testing/admin purposes)
  const updatePremiumLevel = async (newLevel: PremiumPackageType) => {
    if (!user || !userProfile) {
      console.error('No user or profile found');
      return;
    }

    try {
      // Find the corresponding subscription plan
      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', newLevel)
        .eq('billing_period', PaymentPeriod.MONTHLY)
        .single();

      if (planError) {
        throw planError;
      }

      // Type assertion for plan data
      const plan = planData as SubscriptionPlan;

      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_plan_id: plan.id,
          subscription_status: newLevel === PremiumPackageType.FREE ? 
            SubscriptionStatus.FREE : SubscriptionStatus.ACTIVE,
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: new Date(Date.now() + plan.duration_in_days * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Refresh premium data
      await fetchPremiumData();
    } catch (err) {
      console.error('Error updating premium level:', err);
      setError(err instanceof Error ? err.message : 'Failed to update premium level');
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    if (!user || !userProfile) {
      console.error('No user or profile found');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          auto_renew: false,
          subscription_status: SubscriptionStatus.CANCELLED
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Refresh premium data
      await fetchPremiumData();
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    }
  };

  // Get days remaining in subscription
  const getDaysRemaining = (): number | null => {
    if (!premiumInfo?.subscriptionEndDate) return null;
    
    const now = new Date();
    const endDate = new Date(premiumInfo.subscriptionEndDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  // Check if subscription is expiring soon (within 7 days)
  const isExpiringSoon = (): boolean => {
    const daysRemaining = getDaysRemaining();
    return daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
  };

  useEffect(() => {
    fetchPremiumData();
  }, [user]);

  // Listen for subscription changes
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        () => {
          fetchPremiumData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    premiumInfo,
    userProfile,
    subscriptionPlan,
    loading,
    error,
    hasAccessToFeature,
    hasAccessToLevel,
    getFeatureInfo,
    getCurrentLevel,
    isPremium,
    isSubscriptionActive,
    getMyAvailableFeatures,
    updatePremiumLevel,
    cancelSubscription,
    getDaysRemaining,
    isExpiringSoon,
    refetch: fetchPremiumData,
    PREMIUM_FEATURES
  };
};