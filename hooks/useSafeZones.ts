import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SafeZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  network_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_name?: string;
}

export interface CreateSafeZoneData {
  name: string;
  latitude: number;
  longitude: number;
  network_id: string;
}

export interface UpdateSafeZoneData {
  id: string;
  name: string;
}

// Fetch safe zones for a network
export const useSafeZones = (networkId: string) => {
  return useQuery({
    queryKey: ['safe-zones', networkId],
    queryFn: async (): Promise<SafeZone[]> => {
      // Dummy data for testing - remove this when database is ready
      const dummyData: SafeZone[] = [
        {
          id: '1',
          name: 'Merkez Park',
          latitude: 41.0082,
          longitude: 28.9784,
          network_id: networkId,
          created_by: 'user1',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
          creator_name: 'Ahmet Yılmaz'
        },
        {
          id: '2',
          name: 'Şehir Hastanesi',
          latitude: 41.0123,
          longitude: 28.9856,
          network_id: networkId,
          created_by: 'user2',
          created_at: '2024-01-14T14:20:00Z',
          updated_at: '2024-01-14T14:20:00Z',
          creator_name: 'Ayşe Demir'
        },
        {
          id: '3',
          name: 'Belediye Meydanı',
          latitude: 41.0067,
          longitude: 28.9812,
          network_id: networkId,
          created_by: 'user3',
          created_at: '2024-01-13T09:15:00Z',
          updated_at: '2024-01-13T09:15:00Z',
          creator_name: 'Mehmet Kaya'
        },
        {
          id: '4',
          name: 'Okul Bahçesi',
          latitude: 41.0098,
          longitude: 28.9834,
          network_id: networkId,
          created_by: 'user1',
          created_at: '2024-01-12T16:45:00Z',
          updated_at: '2024-01-12T16:45:00Z',
          creator_name: 'Ahmet Yılmaz'
        },
        {
          id: '5',
          name: 'Spor Salonu',
          latitude: 41.0112,
          longitude: 28.9876,
          network_id: networkId,
          created_by: 'user4',
          created_at: '2024-01-11T11:30:00Z',
          updated_at: '2024-01-11T11:30:00Z',
          creator_name: 'Fatma Özkan'
        },
        {
          id: '6',
          name: 'Güvenli Ev',
          latitude: 41.0105,
          longitude: 28.9820,
          network_id: networkId,
          created_by: 'user5',
          created_at: '2024-01-10T08:45:00Z',
          updated_at: '2024-01-10T08:45:00Z',
          creator_name: 'Siz'
        }
      ];

      // Uncomment this when database is ready
      /*
      const { data, error } = await supabase
        .from('safe_zones')
        .select(`
          *,
          profiles:created_by(name, surname)
        `)
        .eq('network_id', networkId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data?.map(zone => ({
        ...zone,
        creator_name: zone.profiles?.name && zone.profiles?.surname 
          ? `${zone.profiles.name} ${zone.profiles.surname}`
          : zone.profiles?.name || 'Bilinmeyen Kullanıcı'
      })) || [];
      */

      return dummyData;
    },
    enabled: !!networkId,
  });
};

// Create a new safe zone
export const useCreateSafeZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSafeZoneData): Promise<SafeZone> => {
      // Dummy implementation for testing
      const newZone: SafeZone = {
        id: Date.now().toString(),
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        network_id: data.network_id,
        created_by: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator_name: 'Siz'
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return newZone;

      // Uncomment this when database is ready
      /*
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }

      const { data: safeZone, error } = await supabase
        .from('safe_zones')
        .insert({
          name: data.name,
          latitude: data.latitude,
          longitude: data.longitude,
          network_id: data.network_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return safeZone;
      */
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch safe zones for this network
      queryClient.invalidateQueries({
        queryKey: ['safe-zones', variables.network_id],
      });
    },
  });
};

// Update a safe zone
export const useUpdateSafeZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSafeZoneData): Promise<SafeZone> => {
      // Dummy implementation for testing
      const updatedZone: SafeZone = {
        id: data.id,
        name: data.name,
        latitude: 41.0082, // dummy values
        longitude: 28.9784,
        network_id: 'dummy-network',
        created_by: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator_name: 'Siz'
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return updatedZone;

      // Uncomment this when database is ready
      /*
      const { data: safeZone, error } = await supabase
        .from('safe_zones')
        .update({
          name: data.name,
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return safeZone;
      */
    },
    onSuccess: (safeZone) => {
      // Invalidate and refetch safe zones for this network
      queryClient.invalidateQueries({
        queryKey: ['safe-zones', safeZone.network_id],
      });
    },
  });
};

// Delete a safe zone
export const useDeleteSafeZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (zoneId: string): Promise<void> => {
      // Dummy implementation for testing
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Uncomment this when database is ready
      /*
      const { error } = await supabase
        .from('safe_zones')
        .delete()
        .eq('id', zoneId);

      if (error) {
        throw new Error(error.message);
      }
      */
    },
    onSuccess: (_, zoneId) => {
      // Invalidate all safe zones queries since we don't know the network_id
      queryClient.invalidateQueries({
        queryKey: ['safe-zones'],
      });
    },
  });
}; 