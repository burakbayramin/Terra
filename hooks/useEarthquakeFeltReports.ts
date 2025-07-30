// hooks/useEarthquakeFeltReports.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// Types
export interface EarthquakeFeltReport {
  id: string;
  profile_id: string;
  earthquake_id: string;
  created_at: string;
}

export interface FeltReportStats {
  total_reports: number;
  user_has_reported: boolean;
}

export const useEarthquakeFeltReports = (earthquakeId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Hissedilme istatistiklerini getir
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['earthquake-felt-reports', earthquakeId, user?.id],
    queryFn: async (): Promise<FeltReportStats> => {
      try {
        // Toplam rapor sayısını al
        const { count: totalReports, error: countError } = await supabase
          .from('earthquake_felt_reports')
          .select('*', { count: 'exact', head: true })
          .eq('earthquake_id', earthquakeId);

        if (countError) throw countError;

        let userHasReported = false;

        // Kullanıcı giriş yapmışsa kontrol et
        if (user?.id) {
          const { data: userReport, error: userError } = await supabase
            .from('earthquake_felt_reports')
            .select('id')
            .eq('earthquake_id', earthquakeId)
            .eq('profile_id', user.id)
            .maybeSingle();

          if (userError) throw userError;
          userHasReported = !!userReport;
        }

        return {
          total_reports: totalReports || 0,
          user_has_reported: userHasReported,
        };
      } catch (error) {
        console.error('Error fetching felt reports stats:', error);
        throw new Error('Hissedilme verileri alınamadı');
      }
    },
    enabled: !!earthquakeId,
    staleTime: 30 * 1000, // 30 saniye fresh
    refetchInterval: 60 * 1000, // Her dakika güncelle
  });

  // Rapor ekleme mutation
  const addReportMutation = useMutation({
    mutationFn: async (): Promise<EarthquakeFeltReport> => {
      if (!user?.id) {
        throw new Error('Giriş yapmalısınız');
      }

      const { data, error } = await supabase
        .from('earthquake_felt_reports')
        .insert({
          earthquake_id: earthquakeId,
          profile_id: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Bu deprem için zaten rapor verdiniz.');
        }
        throw new Error('Rapor kaydedilemedi');
      }

      return data;
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: ['earthquake-felt-reports', earthquakeId, user?.id],
      });

      const previousStats = queryClient.getQueryData<FeltReportStats>([
        'earthquake-felt-reports',
        earthquakeId,
        user?.id,
      ]);

      if (previousStats) {
        queryClient.setQueryData<FeltReportStats>(
          ['earthquake-felt-reports', earthquakeId, user?.id],
          {
            total_reports: previousStats.total_reports + 1,
            user_has_reported: true,
          }
        );
      }

      return { previousStats };
    },
    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousStats) {
        queryClient.setQueryData(
          ['earthquake-felt-reports', earthquakeId, user?.id],
          context.previousStats
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['earthquake-felt-reports', earthquakeId],
      });
    },
  });

  // Rapor kaldırma mutation
  const removeReportMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!user?.id) {
        throw new Error('Giriş yapmalısınız');
      }

      const { error } = await supabase
        .from('earthquake_felt_reports')
        .delete()
        .eq('earthquake_id', earthquakeId)
        .eq('profile_id', user.id);

      if (error) {
        throw new Error('Rapor kaldırılamadı');
      }
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: ['earthquake-felt-reports', earthquakeId, user?.id],
      });

      const previousStats = queryClient.getQueryData<FeltReportStats>([
        'earthquake-felt-reports',
        earthquakeId,
        user?.id,
      ]);

      if (previousStats) {
        queryClient.setQueryData<FeltReportStats>(
          ['earthquake-felt-reports', earthquakeId, user?.id],
          {
            total_reports: Math.max(0, previousStats.total_reports - 1),
            user_has_reported: false,
          }
        );
      }

      return { previousStats };
    },
    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousStats) {
        queryClient.setQueryData(
          ['earthquake-felt-reports', earthquakeId, user?.id],
          context.previousStats
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['earthquake-felt-reports', earthquakeId],
      });
    },
  });

  // Toggle fonksiyonu
  const toggleFeltReport = async () => {
    if (!user) {
      throw new Error('Bu işlem için giriş yapmalısınız');
    }

    try {
      if (stats?.user_has_reported) {
        await removeReportMutation.mutateAsync();
      } else {
        await addReportMutation.mutateAsync();
      }
    } catch (error) {
      throw error;
    }
  };

  return {
    // Data
    stats,
    isLoading,
    error,
    
    // Actions
    toggleFeltReport,
    refetch,
    
    // States
    isUpdating: addReportMutation.isPending || removeReportMutation.isPending,
    isAdding: addReportMutation.isPending,
    isRemoving: removeReportMutation.isPending,
    
    // Individual mutations
    addReport: addReportMutation.mutateAsync,
    removeReport: removeReportMutation.mutateAsync,
    
    // Mutation errors
    addError: addReportMutation.error,
    removeError: removeReportMutation.error,
  };
};