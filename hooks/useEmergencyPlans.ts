import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface EmergencyPlan {
  id: string;
  name: string;
  network_id: string;
  created_by: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  steps: PlanStep[];
}

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  category: 'emergency' | 'post_emergency';
  order: number;
  safe_zone_id?: string;
  safe_zone_name?: string;
}

export interface CreatePlanData {
  name: string;
  steps: PlanStep[];
  network_id: string;
}

export interface UpdatePlanData {
  id: string;
  is_active: boolean;
}

// Fetch emergency plans for a network
export const useEmergencyPlans = (networkId: string) => {
  return useQuery({
    queryKey: ['emergency-plans', networkId],
    queryFn: async (): Promise<EmergencyPlan[]> => {
      const { data, error } = await supabase
        .from('emergency_plans')
        .select(`
          *,
          profiles:created_by(name, surname),
          steps:emergency_plan_steps(
            *,
            safe_zones(name)
          )
        `)
        .eq('network_id', networkId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data?.map(plan => ({
        ...plan,
        creator_name: plan.profiles?.name && plan.profiles?.surname 
          ? `${plan.profiles.name} ${plan.profiles.surname}`
          : plan.profiles?.name || 'Bilinmeyen Kullanıcı',
        steps: plan.steps?.map(step => ({
          ...step,
          safe_zone_name: step.safe_zones?.name
        })) || []
      })) || [];
    },
    enabled: !!networkId,
  });
};

// Create a new emergency plan
export const useCreateEmergencyPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePlanData): Promise<EmergencyPlan> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }

      // Create the plan
      const { data: plan, error: planError } = await supabase
        .from('emergency_plans')
        .insert({
          name: data.name,
          network_id: data.network_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (planError) {
        throw new Error(planError.message);
      }

      // Create the steps
      if (data.steps.length > 0) {
        const stepsData = data.steps.map(step => ({
          plan_id: plan.id,
          title: step.title,
          description: step.description,
          category: step.category,
          order_index: step.order,
          safe_zone_id: step.safe_zone_id,
        }));

        const { error: stepsError } = await supabase
          .from('emergency_plan_steps')
          .insert(stepsData);

        if (stepsError) {
          throw new Error(stepsError.message);
        }
      }

      return plan;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch emergency plans for this network
      queryClient.invalidateQueries({
        queryKey: ['emergency-plans', variables.network_id],
      });
    },
  });
};

// Update emergency plan (activate/deactivate)
export const useUpdateEmergencyPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePlanData): Promise<EmergencyPlan> => {
      const { data: plan, error } = await supabase
        .from('emergency_plans')
        .update({
          is_active: data.is_active,
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return plan;
    },
    onSuccess: (plan) => {
      // Invalidate and refetch emergency plans for this network
      queryClient.invalidateQueries({
        queryKey: ['emergency-plans', plan.network_id],
      });
    },
  });
};

// Delete an emergency plan
export const useDeleteEmergencyPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string): Promise<void> => {
      const { error } = await supabase
        .from('emergency_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (_, planId) => {
      // Invalidate all emergency plans queries since we don't know the network_id
      queryClient.invalidateQueries({
        queryKey: ['emergency-plans'],
      });
    },
  });
}; 