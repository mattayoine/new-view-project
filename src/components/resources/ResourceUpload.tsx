
import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/ui/file-upload';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useResources } from '@/hooks/useResources';

const ResourceUpload: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document',
    access_level: 'public',
    is_featured: false
  });
  
  const { uploadFile, uploading, progress } = useFileUpload();
  const { createResource } = useResources();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    try {
      await createResource.mutateAsync(formData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'document',
        access_level: 'public',
        is_featured: false
      });
    } catch (error) {
      console.error('Failed to create resource:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const result = await uploadFile(file, {
        bucket: 'resources',
        maxSize: 100 * 1024 * 1024, // 100MB
        allowedTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ]
      });

      // Auto-fill title if empty
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: result.fileName.split('.')[0]
        }));
      }

      // Create resource with file data
      await createResource.mutateAsync({
        ...formData,
        title: formData.title || result.fileName.split('.')[0],
        file_url: result.publicUrl,
        file_size: result.fileSize,
        mime_type: result.mimeType,
        original_filename: result.fileName,
        storage_path: result.path
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'document',
        access_level: 'public',
        is_featured: false
      });
      
    } catch (error) {
      console.error('Resource upload failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload New Resource
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Resource title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="tool">Tool</SelectItem>
                  <SelectItem value="case_study">Case Study</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this resource is about..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="access">Access Level</Label>
              <Select 
                value={formData.access_level} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, access_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
              />
              <Label htmlFor="featured">Featured Resource</Label>
            </div>
          </div>

          <FileUpload
            onFileSelect={handleFileUpload}
            accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
            maxSize={100 * 1024 * 1024}
            dragDropText="Drop your resource file here (PDF, DOC, DOCX, TXT, PPT, PPTX)"
            uploading={uploading}
            progress={progress}
          />

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData({
                title: '',
                description: '',
                type: 'document',
                access_level: 'public',
                is_featured: false
              })}
            >
              Reset
            </Button>
            <Button type="submit" disabled={createResource.isPending}>
              {createResource.isPending ? 'Creating...' : 'Create Resource'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ResourceUpload;
