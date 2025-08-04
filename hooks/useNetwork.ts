import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase'; // Supabase client'ınızın path'i

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
    username?: string;
    city?: string;
    district?: string;
    emergency_phone?: string;
    safety_score?: number;
    phone?: string;
    premium_status?: string;
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

      if (error) throw error;
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

      if (error) throw error;
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
            username,
            city,
            district,
            emergency_phone,
            safety_score,
            phone,
            premium_status
          )
        `)
        .eq('network_id', networkId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });

      if (error) throw error;
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

      if (error) throw error;
      return data as NetworkInvitation[];
    },
    enabled: !!networkId,
  });
};

// 5. Ağ oluştur (Manuel olarak)
export const useCreateNetwork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (networkData: CreateNetworkData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı girişi yapılmamış');

      // Benzersiz network code oluştur
      const generateUniqueNetworkCode = (): string => {
        // 6 karakterlik benzersiz kod oluştur
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      // Ağı oluştur (network code çakışması durumunda tekrar dene)
      let network;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        const networkCode = generateUniqueNetworkCode();
        
        try {
          const { data, error } = await supabase
            .from('networks')
            .insert({
              name: networkData.name,
              description: networkData.description || null,
              creator_id: user.id,
              max_members: networkData.max_members || 50,
              network_code: networkCode,
              is_active: true,
            })
            .select()
            .single();
          
          if (error) {
            // Network code çakışması durumunda tekrar dene
            if (error.code === '23505' && error.message.includes('network_code')) {
              attempts++;
              continue;
            }
            throw error;
          }
          
          network = data;
          break;
        } catch (error: any) {
          if (error.code === '23505' && error.message.includes('network_code')) {
            attempts++;
            continue;
          }
          throw error;
        }
      }
      
      if (!network) {
        throw new Error('Ağ oluşturulamadı, lütfen tekrar deneyin');
      }

      // 2. Kullanıcıyı ağa creator olarak ekle (RLS bypass)
      const { error: memberError } = await supabase
        .from('network_members')
        .insert({
          network_id: network.id,
          user_id: user.id,
          role: 'creator',
          is_active: true,
        })
        .select();

      if (memberError) {
        console.error('Member insert error:', memberError);
        throw new Error('Ağ üyesi eklenemedi: ' + memberError.message);
      }

      return network as Network;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkKeys.myNetworks() });
    },
  });
};

// 6. Ağa katıl (Database function kullanarak)
export const useJoinNetwork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (networkCode: string) => {
      const { data, error } = await supabase.rpc('join_network_by_code', {
        network_code_param: networkCode,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkKeys.myNetworks() });
    },
  });
};

// 7. Davet gönder
export const useCreateInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationData: CreateInvitationData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı girişi yapılmamış');

      const { data, error } = await supabase
        .from('network_invitations')
        .insert({
          ...invitationData,
          inviter_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
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
      if (!user) throw new Error('Kullanıcı girişi yapılmamış');

      // Daveti bul ve güncelle
      const { data: invitation, error: inviteError } = await supabase
        .from('network_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('invitation_code', invitationCode)
        .eq('status', 'pending')
        .select()
        .single();

      if (inviteError) throw new Error('Davet bulunamadı veya süresi dolmuş');

      // Üye olarak ekle
      const { error: memberError } = await supabase
        .from('network_members')
        .insert({
          network_id: invitation.network_id,
          user_id: user.id,
          role: 'member',
        });

      if (memberError) throw memberError;

      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkKeys.myNetworks() });
    },
  });
};

// 9. Ağdan çık
export const useLeaveNetwork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (networkId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı girişi yapılmamış');

      const { error } = await supabase
        .from('network_members')
        .delete()
        .eq('network_id', networkId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkKeys.myNetworks() });
    },
  });
};

// 10. Üyeyi çıkar (sadece creator)
export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ networkId, userId }: { networkId: string; userId: string }) => {
      const { error } = await supabase
        .from('network_members')
        .delete()
        .eq('network_id', networkId)
        .eq('user_id', userId);

      if (error) throw error;
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
      const { data, error } = await supabase
        .from('networks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', networkId)
        .select()
        .single();

      if (error) throw error;
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
      const { error } = await supabase
        .from('networks')
        .delete()
        .eq('id', networkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkKeys.myNetworks() });
    },
  });
};