// hooks/useEarthquakeComments.ts - Join'siz Basit Version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface EarthquakeComment {
  id: string;
  profile_id: string;
  earthquake_id: string;
  comment: string;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  is_own_comment?: boolean;
  profiles?: {
    id: string;
    full_name: string;
  };
}

// Query key
const getCommentsKey = (earthquakeId: string) => ['earthquake-comments', earthquakeId];

// API Functions - Join yapmadan
const fetchComments = async (earthquakeId: string, userId?: string) => {
  // Önce yorumları al
  const { data: comments, error: commentsError } = await supabase
    .from('earthquake_comments')
    .select(`
      id,
      profile_id,
      earthquake_id,
      comment,
      is_edited,
      edited_at,
      created_at
    `)
    .eq('earthquake_id', earthquakeId)
    .order('created_at', { ascending: false });

  if (commentsError) throw commentsError;
  if (!comments) return [];

  // Benzersiz profile ID'leri al
  const profileIds = [...new Set(comments.map(c => c.profile_id))];
  
  // Profilleri ayrı sorguda al
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', profileIds);

  if (profilesError) {
    console.warn('Profiles fetch error:', profilesError);
    // Profil hatası olursa sadece yorumları döndür
    return comments.map((comment: any) => ({
      ...comment,
      is_own_comment: userId === comment.profile_id,
      profiles: {
        id: comment.profile_id,
        full_name: 'Kullanıcı'
      }
    }));
  }

  // Yorumları profil bilgileriyle birleştir
  return comments.map((comment: any) => {
    const profile = profiles?.find(p => p.id === comment.profile_id);
    return {
      ...comment,
      is_own_comment: userId === comment.profile_id,
      profiles: {
        id: comment.profile_id,
        full_name: profile?.name || 'Kullanıcı'
      }
    };
  });
};

const addCommentApi = async (earthquakeId: string, userId: string, commentText: string) => {
  console.log('Adding comment:', { earthquakeId, userId, commentText });
  
  const { data, error } = await supabase
    .from('earthquake_comments')
    .insert({
      profile_id: userId,
      earthquake_id: earthquakeId,
      comment: commentText.trim(),
    })
    .select(`
      id,
      profile_id,
      earthquake_id,
      comment,
      is_edited,
      edited_at,
      created_at
    `)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }
  
  // İsim bilgisini ayrı sorguda al
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .single();
  
  console.log('Comment added successfully:', data);
  
  return {
    ...data,
    profiles: {
      id: userId,
      full_name: profile?.name || 'Kullanıcı'
    }
  };
};

const updateCommentApi = async (commentId: string, userId: string, newText: string) => {
  const { data, error } = await supabase
    .from('earthquake_comments')
    .update({
      comment: newText.trim(),
      is_edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('profile_id', userId)
    .select(`
      id,
      profile_id,
      earthquake_id,
      comment,
      is_edited,
      edited_at,
      created_at
    `)
    .single();

  if (error) throw error;
  
  // İsim bilgisini ayrı sorguda al
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .single();
  
  return {
    ...data,
    profiles: {
      id: userId,
      full_name: profile?.name || 'Kullanıcı'
    }
  };
};

const deleteCommentApi = async (commentId: string, userId: string) => {
  const { error } = await supabase
    .from('earthquake_comments')
    .delete()
    .eq('id', commentId)
    .eq('profile_id', userId);

  if (error) throw error;
  return commentId;
};

// Main Hook
export const useEarthquakeComments = (earthquakeId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch Comments
  const {
    data: comments = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: getCommentsKey(earthquakeId),
    queryFn: () => fetchComments(earthquakeId, user?.id),
    enabled: !!earthquakeId,
  });

  // Add Comment
  const addCommentMutation = useMutation({
    mutationFn: (commentText: string) => {
      console.log('Mutation started with:', { user: user?.id, earthquakeId, commentText });
      
      if (!user) {
        console.error('No user found');
        throw new Error('Yorum yapmak için giriş yapmalısınız');
      }
      
      return addCommentApi(earthquakeId, user.id, commentText);
    },
    onSuccess: (data) => {
      console.log('Mutation success:', data);
      queryClient.invalidateQueries({ queryKey: getCommentsKey(earthquakeId) });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
    },
  });

  // Update Comment
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, newText }: { commentId: string; newText: string }) => {
      if (!user) throw new Error('Yorum güncellemek için giriş yapmalısınız');
      return updateCommentApi(commentId, user.id, newText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getCommentsKey(earthquakeId) });
    },
  });

  // Delete Comment
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => {
      if (!user) throw new Error('Yorum silmek için giriş yapmalısınız');
      return deleteCommentApi(commentId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getCommentsKey(earthquakeId) });
    },
  });

  // Helper functions
  const addComment = async (commentText: string) => {
    try {
      console.log('addComment called with:', commentText);
      return await addCommentMutation.mutateAsync(commentText);
    } catch (error) {
      console.error('addComment error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          throw new Error('Bu yorum zaten eklenmiş');
        }
        if (error.message.includes('foreign key')) {
          throw new Error('Geçersiz deprem ID');
        }
        if (error.message.includes('not null')) {
          throw new Error('Gerekli alanlar eksik');
        }
        if (error.message.includes('permission')) {
          throw new Error('Yorum yapma yetkiniz yok');
        }
      }
      
      throw error;
    }
  };

  const updateComment = async (commentId: string, newText: string) => {
    return updateCommentMutation.mutateAsync({ commentId, newText });
  };

  const deleteComment = async (commentId: string) => {
    return deleteCommentMutation.mutateAsync(commentId);
  };

  return {
    // Data
    comments,
    
    // Loading states
    isLoading,
    isSubmitting: addCommentMutation.isPending || updateCommentMutation.isPending || deleteCommentMutation.isPending,
    isAddingComment: addCommentMutation.isPending,
    isUpdatingComment: updateCommentMutation.isPending,
    isDeletingComment: deleteCommentMutation.isPending,
    
    // Error
    error: error?.message || addCommentMutation.error?.message || updateCommentMutation.error?.message || deleteCommentMutation.error?.message,
    
    // Actions
    addComment,
    updateComment,
    deleteComment,
    refetch,
  };
};