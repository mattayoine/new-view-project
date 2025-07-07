
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UserDocument {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  document_type: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserDocuments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['user-documents', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserDocument[];
    },
    enabled: !!user
  });

  const addDocument = useMutation({
    mutationFn: async (documentData: {
      filename: string;
      original_filename: string;
      file_size: number;
      mime_type: string;
      storage_path: string;
      document_type?: string;
      is_private?: boolean;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError) throw userError;

      const { data, error } = await supabase
        .from('user_documents')
        .insert({
          user_id: userData.id,
          ...documentData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      toast.success('Document saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save document');
    }
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      toast.success('Document deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete document');
    }
  });

  const getDocumentUrl = async (storagePath: string) => {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);
    
    return data.publicUrl;
  };

  return {
    documents: documents || [],
    isLoading,
    addDocument,
    deleteDocument,
    getDocumentUrl
  };
};
