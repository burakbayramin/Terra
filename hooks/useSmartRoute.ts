// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { supabase } from '@/lib/supabase';
// import { 
//   SmartRouteSettings, 
//   SmartRoute, 
//   RouteWaypoint, 
//   UserRouteSelection, 
//   UserRouteProgress, 
//   RouteStatistics,
//   RouteWithDetails 
// } from '@/types/types';

// // Smart Route Settings Hooks
// export const useSmartRouteSettings = (networkId: string) => {
//   return useQuery({
//     queryKey: ['smartRouteSettings', networkId],
//     queryFn: async (): Promise<SmartRouteSettings | null> => {
//       try {
//         const { data, error } = await supabase
//           .from('smart_route_settings')
//           .select('*')
//           .eq('network_id', networkId)
//           .single();

//         if (error && error.code !== 'PGRST116') {
//           console.log('Smart Route Settings Error:', error);
//           throw error;
//         }

//         return data;
//       } catch (error) {
//         console.log('Smart Route Settings Catch Error:', error);
//         // Fallback: Return null if table doesn't exist or other error
//         return null;
//       }
//     },
//     enabled: !!networkId,
//   });
// };

// export const useUpdateSmartRouteSettings = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({ networkId, isEnabled }: { networkId: string; isEnabled: boolean }) => {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error('User not authenticated');

//       const { data, error } = await supabase
//         .from('smart_route_settings')
//         .upsert({
//           network_id: networkId,
//           is_enabled: isEnabled,
//           created_by: user.id,
//         })
//         .select()
//         .single();

//       if (error) throw error;
//       return data;
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ['smartRouteSettings', data.network_id] });
//     },
//   });
// };

// // Smart Routes Hooks
// export const useSmartRoutes = (networkId: string) => {
//   return useQuery({
//     queryKey: ['smartRoutes', networkId],
//     queryFn: async (): Promise<SmartRoute[]> => {
//       try {
//         const { data, error } = await supabase
//           .from('smart_routes')
//           .select(`
//             *,
//             route_waypoints (*),
//             route_statistics (*)
//           `)
//           .eq('network_id', networkId)
//           .order('created_at', { ascending: false });

//         if (error) {
//           console.log('Smart Routes Error:', error);
//           throw error;
//         }
//         return data || [];
//       } catch (error) {
//         console.log('Smart Routes Catch Error:', error);
//         // Fallback: Return empty array if table doesn't exist or other error
//         return [];
//       }
//     },
//     enabled: !!networkId,
//   });
// };

// export const useSmartRoute = (routeId: string) => {
//   return useQuery({
//     queryKey: ['smartRoute', routeId],
//     queryFn: async (): Promise<SmartRoute | null> => {
//       const { data, error } = await supabase
//         .from('smart_routes')
//         .select(`
//           *,
//           route_waypoints (*),
//           route_statistics (*)
//         `)
//         .eq('id', routeId)
//         .single();

//       if (error && error.code !== 'PGRST116') {
//         throw error;
//       }

//       return data;
//     },
//     enabled: !!routeId,
//   });
// };

// export const useCreateSmartRoute = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (routeData: {
//       networkId: string;
//       name: string;
//       description?: string;
//       routeType: SmartRoute['route_type'];
//       isDefault?: boolean;
//       waypoints?: Omit<RouteWaypoint, 'id' | 'route_id' | 'created_at'>[];
//     }) => {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error('User not authenticated');

//       // Create route
//       const { data: route, error: routeError } = await supabase
//         .from('smart_routes')
//         .insert({
//           network_id: routeData.networkId,
//           name: routeData.name,
//           description: routeData.description,
//           route_type: routeData.routeType,
//           is_default: routeData.isDefault || false,
//           created_by: user.id,
//         })
//         .select()
//         .single();

//       if (routeError) throw routeError;

//       // Create waypoints if provided
//       if (routeData.waypoints && routeData.waypoints.length > 0) {
//         const waypointsData = routeData.waypoints.map(waypoint => ({
//           ...waypoint,
//           route_id: route.id,
//         }));

//         const { error: waypointsError } = await supabase
//           .from('route_waypoints')
//           .insert(waypointsData);

//         if (waypointsError) throw waypointsError;
//       }

//       return route;
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ['smartRoutes', data.network_id] });
//     },
//   });
// };

// export const useUpdateSmartRoute = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (routeData: {
//       id: string;
//       name?: string;
//       description?: string;
//       routeType?: SmartRoute['route_type'];
//       isDefault?: boolean;
//     }) => {
//       const { data, error } = await supabase
//         .from('smart_routes')
//         .update({
//           name: routeData.name,
//           description: routeData.description,
//           route_type: routeData.routeType,
//           is_default: routeData.isDefault,
//         })
//         .eq('id', routeData.id)
//         .select()
//         .single();

//       if (error) throw error;
//       return data;
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ['smartRoutes', data.network_id] });
//     },
//   });
// };

// export const useDeleteSmartRoute = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (routeId: string) => {
//       const { error } = await supabase
//         .from('smart_routes')
//         .delete()
//         .eq('id', routeId);

//       if (error) throw error;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['smartRoutes'] });
//     },
//   });
// };

// // Route Waypoints Hooks
// export const useRouteWaypoints = (routeId: string) => {
//   return useQuery({
//     queryKey: ['routeWaypoints', routeId],
//     queryFn: async (): Promise<RouteWaypoint[]> => {
//       const { data, error } = await supabase
//         .from('route_waypoints')
//         .select('*')
//         .eq('route_id', routeId)
//         .order('order_index', { ascending: true });

//       if (error) throw error;
//       return data || [];
//     },
//     enabled: !!routeId,
//   });
// };

// export const useCreateRouteWaypoint = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (waypointData: Omit<RouteWaypoint, 'id' | 'created_at'>) => {
//       const { data, error } = await supabase
//         .from('route_waypoints')
//         .insert(waypointData)
//         .select()
//         .single();

//       if (error) throw error;
//       return data;
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ['routeWaypoints', data.route_id] });
//       queryClient.invalidateQueries({ queryKey: ['smartRoutes'] });
//     },
//   });
// };

// export const useUpdateRouteWaypoint = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (waypointData: {
//       id: string;
//       name?: string;
//       description?: string;
//       latitude?: number;
//       longitude?: number;
//       order_index?: number;
//       estimated_time_minutes?: number;
//       distance_meters?: number;
//     }) => {
//       const { data, error } = await supabase
//         .from('route_waypoints')
//         .update(waypointData)
//         .eq('id', waypointData.id)
//         .select()
//         .single();

//       if (error) throw error;
//       return data;
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ['routeWaypoints', data.route_id] });
//       queryClient.invalidateQueries({ queryKey: ['smartRoutes'] });
//     },
//   });
// };

// export const useDeleteRouteWaypoint = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (waypointId: string) => {
//       const { error } = await supabase
//         .from('route_waypoints')
//         .delete()
//         .eq('id', waypointId);

//       if (error) throw error;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['routeWaypoints'] });
//       queryClient.invalidateQueries({ queryKey: ['smartRoutes'] });
//     },
//   });
// };

// // User Route Selection Hooks
// export const useUserRouteSelection = (networkId: string) => {
//   return useQuery({
//     queryKey: ['userRouteSelection', networkId],
//     queryFn: async (): Promise<UserRouteSelection | null> => {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return null;

//       const { data, error } = await supabase
//         .from('user_route_selections')
//         .select(`
//           *,
//           smart_routes (*)
//         `)
//         .eq('user_id', user.id)
//         .eq('network_id', networkId)
//         .eq('is_active', true)
//         .single();

//       if (error && error.code !== 'PGRST116') {
//         throw error;
//       }

//       return data;
//     },
//     enabled: !!networkId,
//   });
// };

// export const useSelectRoute = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({ networkId, routeId }: { networkId: string; routeId: string }) => {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error('User not authenticated');

//       // Deactivate previous selection
//       await supabase
//         .from('user_route_selections')
//         .update({ is_active: false })
//         .eq('user_id', user.id)
//         .eq('network_id', networkId);

//       // Create new selection
//       const { data, error } = await supabase
//         .from('user_route_selections')
//         .insert({
//           user_id: user.id,
//           network_id: networkId,
//           route_id: routeId,
//           is_active: true,
//         })
//         .select()
//         .single();

//       if (error) throw error;
//       return data;
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ['userRouteSelection', data.network_id] });
//       queryClient.invalidateQueries({ queryKey: ['userRouteProgress', data.network_id] });
//     },
//   });
// };

// // User Route Progress Hooks
// export const useUserRouteProgress = (networkId: string) => {
//   return useQuery({
//     queryKey: ['userRouteProgress', networkId],
//     queryFn: async (): Promise<UserRouteProgress | null> => {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return null;

//       const { data, error } = await supabase
//         .from('user_route_progress')
//         .select(`
//           *,
//           smart_routes (*),
//           route_waypoints (*)
//         `)
//         .eq('user_id', user.id)
//         .eq('network_id', networkId)
//         .order('last_updated', { ascending: false })
//         .limit(1)
//         .single();

//       if (error && error.code !== 'PGRST116') {
//         throw error;
//       }

//       return data;
//     },
//     enabled: !!networkId,
//   });
// };

// export const useUpdateRouteProgress = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (progressData: {
//       networkId: string;
//       routeId: string;
//       status: UserRouteProgress['status'];
//       currentWaypointId?: string;
//       currentLatitude?: number;
//       currentLongitude?: number;
//     }) => {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error('User not authenticated');

//       const { data, error } = await supabase
//         .from('user_route_progress')
//         .upsert({
//           user_id: user.id,
//           network_id: progressData.networkId,
//           route_id: progressData.routeId,
//           status: progressData.status,
//           current_waypoint_id: progressData.currentWaypointId,
//           current_latitude: progressData.currentLatitude,
//           current_longitude: progressData.currentLongitude,
//           started_at: progressData.status === 'in_progress' ? new Date().toISOString() : undefined,
//           completed_at: progressData.status === 'completed' ? new Date().toISOString() : undefined,
//           last_updated: new Date().toISOString(),
//         })
//         .select()
//         .single();

//       if (error) throw error;
//       return data;
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ['userRouteProgress', data.network_id] });
//     },
//   });
// };

// // Route Statistics Hooks
// export const useRouteStatistics = (routeId: string) => {
//   return useQuery({
//     queryKey: ['routeStatistics', routeId],
//     queryFn: async (): Promise<RouteStatistics | null> => {
//       const { data, error } = await supabase
//         .from('route_statistics')
//         .select('*')
//         .eq('route_id', routeId)
//         .single();

//       if (error && error.code !== 'PGRST116') {
//         throw error;
//       }

//       return data;
//     },
//     enabled: !!routeId,
//   });
// };

// // Network Route Overview Hook
// export const useNetworkRouteOverview = (networkId: string) => {
//   return useQuery({
//     queryKey: ['networkRouteOverview', networkId],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from('smart_routes')
//         .select(`
//           *,
//           route_waypoints (*),
//           route_statistics (*),
//           user_route_selections (
//             user_id,
//             selected_at,
//             profiles (name, surname)
//           )
//         `)
//         .eq('network_id', networkId)
//         .order('created_at', { ascending: false });

//       if (error) throw error;
//       return data || [];
//     },
//     enabled: !!networkId,
//   });
// }; 