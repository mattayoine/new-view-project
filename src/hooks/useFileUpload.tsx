
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UploadOptions {
  bucket: 'avatars' | 'documents' | 'resources';
  folder?: string;
  maxSize?: number;
  allowedTypes?: string[];
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, options: UploadOptions) => {
    try {
      setUploading(true);
      setProgress(0);

      // Validate file size
      if (options.maxSize && file.size > options.maxSize) {
        throw new Error(`File size must be less than ${Math.round(options.maxSize / 1024 / 1024)}MB`);
      }

      // Validate file type
      if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
        throw new Error('File type not allowed');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = options.folder ? `${user.id}/${options.folder}/${fileName}` : `${user.id}/${fileName}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(filePath);

      setProgress(100);
      return {
        path: data.path,
        publicUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      };

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed');
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteFile = async (bucket: string, path: string) => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      
      toast.success('File deleted successfully');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Delete failed');
      throw error;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading,
    progress
  };
};
