import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { NotificationSetting } from '@/types/types';
import { useAuth } from './useAuth';

export const useNotificationSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Bildirimleri getir
  const {
    data: notifications,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Yeni bildirim ekle
  const addNotificationMutation = useMutation({
    mutationFn: async (notificationData: Omit<NotificationSetting, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('notification_settings')
        .insert({
          user_id: user?.id,
          ...notificationData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', user?.id] });
    },
    onError: (error) => {
      console.error('Bildirim eklenirken hata:', error);
      console.error('Hata detayları:', JSON.stringify(error, null, 2));
    },
  });

  // Bildirim güncelle
  const updateNotificationMutation = useMutation({
    mutationFn: async ({ id, ...notificationData }: Partial<NotificationSetting> & { id: string }) => {
      const { data, error } = await supabase
        .from('notification_settings')
        .update(notificationData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', user?.id] });
    },
    onError: (error) => {
      console.error('Bildirim güncellenirken hata:', error);
      console.error('Hata detayları:', JSON.stringify(error, null, 2));
    },
  });

  // Bildirim sil
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notification_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', user?.id] });
    },
  });

  // Bildirim durumunu değiştir
  const toggleNotificationMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('notification_settings')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings', user?.id] });
    },
  });

  return {
    notifications: notifications || [],
    isLoading,
    error,
    refetch,
    addNotification: addNotificationMutation.mutate,
    updateNotification: updateNotificationMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    toggleNotification: toggleNotificationMutation.mutate,
    isAdding: addNotificationMutation.isPending,
    isUpdating: updateNotificationMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    isToggling: toggleNotificationMutation.isPending,
  };
}; 