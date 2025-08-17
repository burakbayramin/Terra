import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Types
export interface Network {
  id: string;
  network_code: string;
  name: string;
  description?: string;
  creator_id: string;
  max_members: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface NetworkMember {
  id: string;
  network_id: string;
  user_id: string;
  role: 'creator' | 'member';
  joined_at: string;
  is_active: boolean;
  // Profile bilgileri join edilmiş olarak gelecek
  profiles?: {
    name?: string;
    surname?: string;
    city?: string;
    district?: string;
    emergency_phone?: string;
    safety_score?: number;
  };
}

export interface NetworkInvitation {
  id: string;
  network_id: string;
  inviter_id: string;
  invited_phone?: string;
  invited_user_id?: string;
  invitation_code: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
}

export interface CreateNetworkData {
  name: string;
  description?: string;
  max_members?: number;
}

export interface CreateInvitationData {
  network_id: string;
  invited_phone?: string;
  invited_user_id?: string;
}

// Query Keys
export const networkKeys = {
  all: ['networks'] as const,
  lists: () => [...networkKeys.all, 'list'] as const,
  list: (filters: string) => [...networkKeys.lists(), { filters }] as const,
  details: () => [...networkKeys.all, 'detail'] as const,
  detail: (id: string) => [...networkKeys.details(), id] as const,
  members: (networkId: string) => [...networkKeys.all, 'members', networkId] as const,
  invitations: (networkId: string) => [...networkKeys.all, 'invitations', networkId] as const,
  myNetworks: () => [...networkKeys.all, 'my-networks'] as const,
};

// Hooks

// 1. Kullanıcının ağlarını getir
export const useMyNetworks = () => {
  return useQuery({
    queryKey: networkKeys.myNetworks(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı girişi yapılmamış');

      const { data, error } = await supabase
        .from('network_members')
        .select(`
          *,
          networks (
            id,
            network_code,
            name,
            description,
            creator_id,
            max_members,
            created_at,
            updated_at,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching my networks:', error);
        throw error;
      }
      
      return data;
    },
  });
};

// 2. Ağ detayları getir
export const useNetwork = (networkId: string) => {
  return useQuery({
    queryKey: networkKeys.detail(networkId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('networks')
        .select('*')
        .eq('id', networkId)
        .single();

      if (error) {
        console.error('Error fetching network details:', error);
        throw error;
      }
      
      return data as Network;
    },
    enabled: !!networkId,
  });
};

// 3. Ağ üyelerini getir
export const useNetworkMembers = (networkId: string) => {
  return useQuery({
    queryKey: networkKeys.members(networkId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('network_members')
        .select(`
          *,
          profiles (
            name,
            surname,
            city,
            district,
            emergency_phone,
            safety_score
          )
        `)
        .eq('network_id', networkId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching network members:', error);
        throw error;
      }
      
      return data as NetworkMember[];
    },
    enabled: !!networkId,
  });
};

// 4. Ağ davetlerini getir
export const useNetworkInvitations = (networkId: string) => {
  return useQuery({
    queryKey: networkKeys.invitations(networkId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('network_invitations')
        .select('*')
        .eq('network_id', networkId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching network invitations:', error);
        throw error;
      }
      
      return data as NetworkInvitation[];
    },
    enabled: !!networkId,
  });
};

// 5. Ağ oluştur (RPC function kullanarak - güncellendi)
export const useCreateNetwork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (networkData: CreateNetworkData) => {
      // Auth kontrolü
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      console.log('Creating network with data:', networkData);
      console.log('Current user:', user.id);

      // RPC fonksiyonunu çağır - parametre isimleri güncellendi
      const { data, error } = await supabase.rpc('create_network_with_member', {
        p_name: networkData.name,
        p_description: networkData.description || null,
        p_max_members: networkData.max_members || 50,
      });

      if (error) {
        console.error('Network creation RPC error:', error);
        throw new Error(error.message || 'Ağ oluşturulamadı');
      }

      if (!data) {
        throw new Error('Ağ oluşturulamadı - boş response');
      }

      console.log('Network created successfully:', data);
      return data as Network;
    },
    onSuccess: (data) => {
      console.log('Network creation success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: networkKeys.myNetworks() });
      queryClient.invalidateQueries({ queryKey: networkKeys.all });
    },
    onError: (error) => {
      console.error('Network creation mutation error:', error);
    },
  });
};

// 6. Ağa katıl (RPC function kullanarak - güncellendi)
export const useJoinNetwork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (networkCode: string) => {
      // Auth kontrolü
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      console.log('Joining network with code:', networkCode);

      // RPC fonksiyonunu çağır - parametre ismi güncellendi
      const { data, error } = await supabase.rpc('join_network_by_code', {
        p_network_code: networkCode,
      });

      if (error) {
        console.error('Join network RPC error:', error);
        throw new Error(error.message || 'Ağa katılınamadı');
      }

      // Başarı kontrolü
      if (data && !data.success) {
        throw new Error(data.message || 'Ağa katılınamadı');
      }

      console.log('Successfully joined network:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Join network success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: networkKeys.myNetworks() });
      queryClient.invalidateQueries({ queryKey: networkKeys.all });
    },
    onError: (error) => {
      console.error('Join network mutation error:', error);
    },
  });
};

// 7. Davet gönder (güncellendi - RPC function kullanabilir)
export const useCreateInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationData: CreateInvitationData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      console.log('Creating invitation:', invitationData);

      // Benzersiz invitation code oluştur
      const generateInvitationCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      const { data, error } = await supabase
        .from('network_invitations')
        .insert({
          ...invitationData,
          inviter_id: user.id,
          invitation_code: generateInvitationCode(),
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 gün
        })
        .select()
        .single();

      if (error) {
        console.error('Create invitation error:', error);
        throw error;
      }

      console.log('Invitation created:', data);
      return data as NetworkInvitation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: networkKeys.invitations(variables.network_id) 
      });
    },
  });
};

// 8. Daveti kabul et
export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationCode: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      console.log('Accepting invitation with code:', invitationCode);

      // Daveti bul ve güncelle
      const { data: invitation, error: inviteError } = await supabase
        .from('network_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          invited_user_id: user.id,
        })
        .eq('invitation_code', invitationCode)
        .eq('status', 'pending')
        .select()
        .single();

      if (inviteError) {
        console.error('Invitation update error:', inviteError);
        throw new Error('Davet bulunamadı veya süresi dolmuş');
      }

      // Üye olarak ekle
      const { error: memberError } = await supabase
        .from('network_members')
        .insert({
          network_id: invitation.network_id,
          user_id: user.id,
          role: 'member',
          is_active: true,
        });

      if (memberError) {
        console.error('Member insert error:', memberError);
        
        // Eğer zaten üyeyse, aktif et
        if (memberError.code === '23505') { // Unique violation
          const { error: updateError } = await supabase
            .from('network_members')
            .update({ is_active: true })
            .eq('network_id', invitation.network_id)
            .eq('user_id', user.id);
          
          if (updateError) throw updateError;
        } else {
          throw memberError;
        }
      }

      console.log('Invitation accepted successfully');
      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkKeys.myNetworks() });
      queryClient.invalidateQueries({ queryKey: networkKeys.all });
    },
  });
};

// 9. Ağdan çık (RPC function kullanarak - güncellendi)
export const useLeaveNetwork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (networkId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      console.log('Leaving network:', networkId);

      // RPC fonksiyonu varsa kullan
      const { data: rpcData, error: rpcError } = await supabase.rpc('leave_network', {
        p_network_id: networkId,
      });

      if (!rpcError && rpcData) {
        if (!rpcData.success) {
          throw new Error(rpcData.message || 'Ağdan ayrılınamadı');
        }
        return rpcData;
      }

      // RPC yoksa doğrudan güncelle (soft delete)
      const { error } = await supabase
        .from('network_members')
        .update({ is_active: false })
        .eq('network_id', networkId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Leave network error:', error);
        throw error;
      }

      console.log('Successfully left network');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkKeys.myNetworks() });
      queryClient.invalidateQueries({ queryKey: networkKeys.all });
    },
  });
};

// 10. Üyeyi çıkar (sadece creator)
export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ networkId, userId }: { networkId: string; userId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      console.log('Removing member:', { networkId, userId });

      // Creator kontrolü
      const { data: network, error: networkError } = await supabase
        .from('networks')
        .select('creator_id')
        .eq('id', networkId)
        .single();

      if (networkError || network.creator_id !== user.id) {
        throw new Error('Bu işlem için yetkiniz yok');
      }

      // Üyeyi pasif yap (soft delete)
      const { error } = await supabase
        .from('network_members')
        .update({ is_active: false })
        .eq('network_id', networkId)
        .eq('user_id', userId);

      if (error) {
        console.error('Remove member error:', error);
        throw error;
      }

      console.log('Member removed successfully');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: networkKeys.members(variables.networkId) 
      });
    },
  });
};

// 11. Ağı güncelle
export const useUpdateNetwork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      networkId, 
      updates 
    }: { 
      networkId: string; 
      updates: Partial<Pick<Network, 'name' | 'description' | 'max_members'>>
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      console.log('Updating network:', { networkId, updates });

      // Creator kontrolü
      const { data: network, error: networkError } = await supabase
        .from('networks')
        .select('creator_id')
        .eq('id', networkId)
        .single();

      if (networkError || network.creator_id !== user.id) {
        throw new Error('Bu işlem için yetkiniz yok');
      }

      const { data, error } = await supabase
        .from('networks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', networkId)
        .select()
        .single();

      if (error) {
        console.error('Update network error:', error);
        throw error;
      }

      console.log('Network updated successfully:', data);
      return data as Network;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: networkKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: networkKeys.myNetworks() });
    },
  });
};

// 12. Ağı sil
export const useDeleteNetwork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (networkId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      console.log('Deleting network:', networkId);

      // Creator kontrolü
      const { data: network, error: networkError } = await supabase
        .from('networks')
        .select('creator_id')
        .eq('id', networkId)
        .single();

      if (networkError || network.creator_id !== user.id) {
        throw new Error('Bu işlem için yetkiniz yok');
      }

      // Soft delete - ağı pasif yap
      const { error } = await supabase
        .from('networks')
        .update({ is_active: false })
        .eq('id', networkId);

      if (error) {
        console.error('Delete network error:', error);
        throw error;
      }

      console.log('Network deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkKeys.myNetworks() });
      queryClient.invalidateQueries({ queryKey: networkKeys.all });
    },
  });
};