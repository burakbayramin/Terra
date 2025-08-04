import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Network,
  NetworkMember,
  NetworkInvitation,
  NetworkRequest,
} from "../types/types";
import { useAuth } from "./useAuth";

// Networks Hook - Ana ağ yönetimi
export const useNetworks = () => {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNetworks = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("networks")
        .select(
          `
          *,
          creator_profile:profiles!networks_created_by_fkey(*)
        `
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setNetworks(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createNetwork = async (networkData: {
    name: string;
    description?: string;
    is_private?: boolean;
    max_members?: number;
    join_code?: string;
  }) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı kimlik doğrulaması gerekli");

      const { data, error } = await supabase
        .from("networks")
        .insert({
          ...networkData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchNetworks();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateNetwork = async (
    networkId: string,
    updates: Partial<Network>
  ) => {
    try {
      const { data, error } = await supabase
        .from("networks")
        .update(updates)
        .eq("id", networkId)
        .select()
        .single();

      if (error) throw error;

      await fetchNetworks();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Database fonksiyonunu kullanarak ağı sil
  const deleteNetwork = async (networkId: string) => {
    try {
      const { data, error } = await supabase.rpc("delete_network", {
        network_id_param: networkId,
      });

      if (error) throw error;

      await fetchNetworks();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchNetworks();
  }, []);

  return {
    networks,
    loading,
    error,
    fetchNetworks,
    createNetwork,
    updateNetwork,
    deleteNetwork,
  };
};

// User Networks Hook - Kullanıcının ağları (user_networks view kullanarak)
export const useUserNetworks = () => {
  const { user } = useAuth();
  const [userNetworks, setUserNetworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserNetworks = async () => {
    try {
      if (!user) return;

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_networks")
        .select("*")
        .order("joined_at", { ascending: false });

      if (error) throw error;

      setUserNetworks(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Database fonksiyonunu kullanarak ağdan çık
  const leaveNetwork = async (networkId: string) => {
    try {
      const { data, error } = await supabase.rpc("leave_network", {
        network_id_param: networkId,
      });

      if (error) throw error;

      await fetchUserNetworks();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchUserNetworks();
  }, [user]);

  return {
    userNetworks,
    loading,
    error,
    fetchUserNetworks,
    leaveNetwork,
  };
};

// Network Members Hook - Ağ üyeleri yönetimi
export const useNetworkMembers = (networkId: string) => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      if (!networkId) return;

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("network_members_detail")
        .select("*")
        .eq("network_id", networkId)
        .order("joined_at", { ascending: true });

      if (error) throw error;

      setMembers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Database fonksiyonunu kullanarak üye çıkar (sadece creator)
  const removeMember = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc("remove_member_from_network", {
        network_id_param: networkId,
        user_id_param: userId,
      });

      if (error) throw error;

      await fetchMembers();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Katılım kodu ile ağa katıl
  const joinNetworkByCode = async (joinCode: string) => {
    try {
      const { data, error } = await supabase.rpc("join_network_with_code", {
        join_code_param: joinCode,
      });

      if (error) throw error;

      if (data === networkId) {
        await fetchMembers();
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [networkId]);

  return {
    members,
    loading,
    error,
    fetchMembers,
    removeMember,
    joinNetworkByCode,
  };
};

// Network Invitations Hook - Davet sistemi
export const useNetworkInvitations = () => {
  const { user } = useAuth();
  const [sentInvitations, setSentInvitations] = useState<NetworkInvitation[]>(
    []
  );
  const [receivedInvitations, setReceivedInvitations] = useState<
    NetworkInvitation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      if (!user) return;

      setLoading(true);
      setError(null);

      // Gönderilen davetler
      const { data: sent, error: sentError } = await supabase
        .from("network_invitations")
        .select(
          `
          *,
          network:networks(*),
          invitee_profile:profiles!network_invitations_invitee_id_fkey(*)
        `
        )
        .eq("inviter_id", user.id)
        .order("created_at", { ascending: false });

      if (sentError) throw sentError;

      // Alınan davetler
      const { data: received, error: receivedError } = await supabase
        .from("network_invitations")
        .select(
          `
          *,
          network:networks(*),
          inviter_profile:profiles!network_invitations_inviter_id_fkey(*)
        `
        )
        .eq("invitee_id", user.id)
        .order("created_at", { ascending: false });

      if (receivedError) throw receivedError;

      setSentInvitations(sent || []);
      setReceivedInvitations(received || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (
    networkId: string,
    inviteeId: string,
    message?: string
  ) => {
    try {
      if (!user) throw new Error("Kullanıcı kimlik doğrulaması gerekli");

      const { data, error } = await supabase
        .from("network_invitations")
        .insert({
          network_id: networkId,
          inviter_id: user.id,
          invitee_id: inviteeId,
          message: message || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchInvitations();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const respondToInvitation = async (invitationId: string, accept: boolean) => {
    try {
      const status = accept ? "accepted" : "rejected";

      const { data, error } = await supabase
        .from("network_invitations")
        .update({ status })
        .eq("id", invitationId)
        .select()
        .single();

      if (error) throw error;

      await fetchInvitations();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("network_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);

      if (error) throw error;

      await fetchInvitations();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [user]);

  return {
    sentInvitations,
    receivedInvitations,
    loading,
    error,
    fetchInvitations,
    sendInvitation,
    respondToInvitation,
    cancelInvitation,
  };
};

// Network Requests Hook - Katılma istekleri
export const useNetworkRequests = (networkId?: string) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [userRequests, setUserRequests] = useState<NetworkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      if (!user) return;

      setLoading(true);
      setError(null);

      // Belirli bir ağın isteklerini getir (networkId verilmişse)
      if (networkId) {
        const { data, error } = await supabase
          .from("network_requests")
          .select(
            `
            *,
            requester_profile:profiles!network_requests_requester_id_fkey(*),
            reviewer_profile:profiles!network_requests_reviewed_by_fkey(*)
          `
          )
          .eq("network_id", networkId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setRequests(data || []);
      }

      // Kullanıcının gönderdiği istekler
      const { data: userRequestsData, error: userRequestsError } =
        await supabase
          .from("network_requests")
          .select(
            `
          *,
          network:networks(*)
        `
          )
          .eq("requester_id", user.id)
          .order("created_at", { ascending: false });

      if (userRequestsError) throw userRequestsError;
      setUserRequests(userRequestsData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendJoinRequest = async (networkId: string, message?: string) => {
    try {
      if (!user) throw new Error("Kullanıcı kimlik doğrulaması gerekli");

      const { data, error } = await supabase
        .from("network_requests")
        .insert({
          network_id: networkId,
          requester_id: user.id,
          message: message || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchRequests();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Database fonksiyonunu kullanarak isteği yanıtla
  const reviewRequest = async (requestId: string, approve: boolean) => {
    try {
      const responseStatus = approve ? "approved" : "rejected";

      const { data, error } = await supabase.rpc("respond_to_join_request", {
        request_id_param: requestId,
        response_status: responseStatus,
      });

      if (error) throw error;

      await fetchRequests();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const cancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("network_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      await fetchRequests();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user, networkId]);

  return {
    requests,
    userRequests,
    loading,
    error,
    fetchRequests,
    sendJoinRequest,
    reviewRequest,
    cancelRequest,
  };
};

// Search Networks Hook - Ağ arama
export const useSearchNetworks = () => {
  const [searchResults, setSearchResults] = useState<Network[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchNetworks = async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      const { data, error } = await supabase
        .from("networks")
        .select(
          `
          *,
          creator_profile:profiles!networks_created_by_fkey(*)
        `
        )
        .eq("is_active", true)
        .eq("is_private", false)
        .or(`name.ilike.%${query}%, description.ilike.%${query}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSearchResults(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
    setError(null);
  };

  return {
    searchResults,
    loading,
    error,
    searchNetworks,
    clearSearch,
  };
};

// Network Statistics Hook - Ağ istatistikleri
export const useNetworkStats = (networkId?: string) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      if (!networkId) return;

      setLoading(true);
      setError(null);

      // Üye sayısı
      const { count: memberCount, error: memberError } = await supabase
        .from("network_members")
        .select("*", { count: "exact", head: true })
        .eq("network_id", networkId)
        .eq("is_active", true);

      if (memberError) throw memberError;

      // Bekleyen davetler
      const { count: pendingInvitations, error: invitationError } =
        await supabase
          .from("network_invitations")
          .select("*", { count: "exact", head: true })
          .eq("network_id", networkId)
          .eq("status", "pending");

      if (invitationError) throw invitationError;

      // Bekleyen istekler
      const { count: pendingRequests, error: requestError } = await supabase
        .from("network_requests")
        .select("*", { count: "exact", head: true })
        .eq("network_id", networkId)
        .eq("status", "pending");

      if (requestError) throw requestError;

      setStats({
        memberCount: memberCount || 0,
        pendingInvitations: pendingInvitations || 0,
        pendingRequests: pendingRequests || 0,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [networkId]);

  return {
    stats,
    loading,
    error,
    fetchStats,
  };
};

// Public Networks Hook - Herkese açık ağlar
export const usePublicNetworks = () => {
  const [publicNetworks, setPublicNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicNetworks = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("networks")
        .select(
          `
          *,
          creator_profile:profiles!networks_created_by_fkey(*)
        `
        )
        .eq("is_active", true)
        .eq("is_private", false)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      setPublicNetworks(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicNetworks();
  }, []);

  return {
    publicNetworks,
    loading,
    error,
    fetchPublicNetworks,
  };
};
