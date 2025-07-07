
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  access_level: string;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  original_filename: string | null;
  storage_path: string | null;
  download_count: number;
  view_count: number;
  is_featured: boolean;
  shared_by: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useResources = (categoryId?: string, accessLevel?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources', categoryId, accessLevel],
    queryFn: async () => {
      let query = supabase
        .from('resources')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (accessLevel) {
        query = query.eq('access_level', accessLevel);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Resource[];
    }
  });

  const createResource = useMutation({
    mutationFn: async (resourceData: {
      title: string;
      description?: string;
      type: string;
      access_level?: string;
      file_url?: string;
      file_size?: number;
      mime_type?: string;
      original_filename?: string;
      storage_path?: string;
      category_id?: string;
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
        .from('resources')
        .insert({
          ...resourceData,
          shared_by: userData.id,
          access_level: resourceData.access_level || 'public'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create resource');
    }
  });

  const updateResource = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Resource>) => {
      const { data, error } = await supabase
        .from('resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update resource');
    }
  });

  const deleteResource = useMutation({
    mutationFn: async (resourceId: string) => {
      const { error } = await supabase
        .from('resources')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', resourceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete resource');
    }
  });

  const incrementDownloadCount = useMutation({
    mutationFn: async (resourceId: string) => {
      const { error } = await supabase.rpc('increment', {
        table_name: 'resources',
        row_id: resourceId,
        column_name: 'download_count'
      });

      if (error) throw error;
    }
  });

  return {
    resources: resources || [],
    isLoading,
    createResource,
    updateResource,
    deleteResource,
    incrementDownloadCount
  };
};
