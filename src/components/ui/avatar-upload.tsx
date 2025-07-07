
import React, { useState } from 'react';
import { Camera, User } from 'lucide-react';
import { Button } from './button';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { FileUpload } from './file-upload';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarChange: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onAvatarChange,
  size = 'md',
  disabled = false
}) => {
  const [showUpload, setShowUpload] = useState(false);
  const { uploadFile, uploading, progress } = useFileUpload();

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };

  const handleFileSelect = async (file: File) => {
    try {
      const result = await uploadFile(file, {
        bucket: 'avatars',
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

      // Update user's avatar URL in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ avatar_url: result.publicUrl })
          .eq('auth_id', user.id);

        if (error) throw error;
      }

      onAvatarChange(result.publicUrl);
      setShowUpload(false);
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(error.message || 'Failed to upload avatar');
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={currentAvatarUrl} alt="Avatar" />
          <AvatarFallback>
            <User className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        
        {!disabled && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute -bottom-2 -right-2 rounded-full p-2"
            onClick={() => setShowUpload(!showUpload)}
            disabled={uploading}
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showUpload && !disabled && (
        <div className="w-full max-w-sm">
          <FileUpload
            onFileSelect={handleFileSelect}
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            dragDropText="Drop your avatar image here"
            uploading={uploading}
            progress={progress}
          />
        </div>
      )}
    </div>
  );
};
