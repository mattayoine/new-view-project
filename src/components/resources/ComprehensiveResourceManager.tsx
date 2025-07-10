import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Upload, 
  FileText, 
  Download, 
  Share2, 
  Trash2, 
  Search, 
  Filter,
  Eye,
  Star,
  Clock,
  Users,
  Tag,
  Folder,
  Plus,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedFileUpload } from '@/hooks/useEnhancedFileUpload';

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: string;
  access_level: 'public' | 'private' | 'restricted';
  file_url?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  download_count: number;
  view_count: number;
  is_featured: boolean;
  shared_by: string;
  category_id?: string;
  created_at: string;
  updated_at: string;
  category?: { name: string; color: string };
}

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
}

export const ComprehensiveResourceManager: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [accessFilter, setAccessFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'download_count' | 'view_count'>('created_at');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadFile, uploading } = useEnhancedFileUpload();

  // Form states
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    type: 'document',
    access_level: 'public' as 'public' | 'private' | 'restricted',
    category_id: '',
    file: null as File | null
  });

  useEffect(() => {
    fetchResources();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [resources, searchTerm, categoryFilter, typeFilter, accessFilter, sortBy]);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          category:resource_categories(name, color)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources((data || []) as Resource[]);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resources',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('resource_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...resources];

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(search) ||
        resource.description?.toLowerCase().includes(search) ||
        resource.type.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(resource => resource.category_id === categoryFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(resource => resource.type === typeFilter);
    }

    // Access level filter
    if (accessFilter !== 'all') {
      filtered = filtered.filter(resource => resource.access_level === accessFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'download_count':
          return b.download_count - a.download_count;
        case 'view_count':
          return b.view_count - a.view_count;
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredResources(filtered);
  };

  const handleUploadResource = async () => {
    if (!newResource.title.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a title for the resource',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      let fileUrl = '';
      let filePath = '';
      let fileSize = 0;
      let mimeType = '';

      // Upload file if provided
      if (newResource.file) {
        const bucket = newResource.access_level === 'public' ? 'resources' : 'documents';
        const uploadResult = await uploadFile(newResource.file, { bucket });
        
        if (uploadResult.url && uploadResult.path) {
          fileUrl = uploadResult.url;
          filePath = uploadResult.path;
          fileSize = newResource.file.size;
          mimeType = newResource.file.type;
        } else {
          throw new Error('File upload failed');
        }
      }

      // Create resource record
      const { data, error } = await supabase
        .from('resources')
        .insert({
          title: newResource.title.trim(),
          description: newResource.description.trim() || null,
          type: newResource.type,
          access_level: newResource.access_level,
          category_id: newResource.category_id || null,
          file_url: fileUrl || null,
          file_path: filePath || null,
          file_size: fileSize,
          mime_type: mimeType || null,
          shared_by: user?.id,
          download_count: 0,
          view_count: 0,
          is_featured: false
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Resource Added',
        description: 'Resource has been successfully uploaded'
      });

      // Reset form
      setNewResource({
        title: '',
        description: '',
        type: 'document',
        access_level: 'public',
        category_id: '',
        file: null
      });

      setShowUploadDialog(false);
      fetchResources();

    } catch (error) {
      console.error('Error uploading resource:', error);
      toast({
        title: 'Upload Failed',
        description: 'Could not upload resource. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewResource = async (resource: Resource) => {
    try {
      // Increment view count
      await supabase
        .from('resources')
        .update({ view_count: resource.view_count + 1 })
        .eq('id', resource.id);

      // Update local state
      setResources(prev => prev.map(r => 
        r.id === resource.id 
          ? { ...r, view_count: r.view_count + 1 }
          : r
      ));

      // Open file if available
      if (resource.file_url) {
        window.open(resource.file_url, '_blank');
      }
    } catch (error) {
      console.error('Error viewing resource:', error);
    }
  };

  const handleDownloadResource = async (resource: Resource) => {
    try {
      // Increment download count
      await supabase
        .from('resources')
        .update({ download_count: resource.download_count + 1 })
        .eq('id', resource.id);

      // Update local state
      setResources(prev => prev.map(r => 
        r.id === resource.id 
          ? { ...r, download_count: r.download_count + 1 }
          : r
      ));

      // Download file
      if (resource.file_url) {
        const link = document.createElement('a');
        link.href = resource.file_url;
        link.download = resource.title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading resource:', error);
      toast({
        title: 'Download Failed',
        description: 'Could not download resource',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: 'Resource Deleted',
        description: 'Resource has been removed'
      });

      fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Delete Failed',
        description: 'Could not delete resource',
        variant: 'destructive'
      });
    }
  };

  const toggleFeatured = async (resource: Resource) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ is_featured: !resource.is_featured })
        .eq('id', resource.id);

      if (error) throw error;

      setResources(prev => prev.map(r => 
        r.id === resource.id 
          ? { ...r, is_featured: !r.is_featured }
          : r
      ));

      toast({
        title: 'Updated',
        description: `Resource ${resource.is_featured ? 'removed from' : 'added to'} featured`
      });
    } catch (error) {
      console.error('Error updating featured status:', error);
    }
  };

  const getFileIcon = (mimeType: string, type: string) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('image')) return '🖼️';
    if (mimeType?.includes('video')) return '🎥';
    if (mimeType?.includes('audio')) return '🎵';
    if (type === 'link') return '🔗';
    return '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'private': return 'bg-red-100 text-red-800';
      case 'restricted': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const resourceTypes = [...new Set(resources.map(r => r.type))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Folder className="w-5 h-5 mr-2" />
              Resource Management
            </div>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload New Resource</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newResource.title}
                      onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Resource title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newResource.description}
                      onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Resource description"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={newResource.type} onValueChange={(v) => setNewResource(prev => ({ ...prev, type: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="document">Document</SelectItem>
                          <SelectItem value="template">Template</SelectItem>
                          <SelectItem value="guide">Guide</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="link">Link</SelectItem>
                          <SelectItem value="tool">Tool</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="access">Access Level</Label>
                      <Select value={newResource.access_level} onValueChange={(v: any) => setNewResource(prev => ({ ...prev, access_level: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="restricted">Restricted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={newResource.category_id} onValueChange={(v) => setNewResource(prev => ({ ...prev, category_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Category</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="file">File</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setNewResource(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                      accept="*/*"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUploadResource} disabled={uploading || loading}>
                      {uploading || loading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {resourceTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={accessFilter} onValueChange={setAccessFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Access Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Access Levels</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Latest</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="download_count">Most Downloaded</SelectItem>
                <SelectItem value="view_count">Most Viewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        ) : (
          filteredResources.map((resource) => (
            <Card key={resource.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {getFileIcon(resource.mime_type || '', resource.type)}
                    </span>
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2">{resource.title}</h3>
                      {resource.category && (
                        <Badge 
                          variant="outline"
                          className="mt-1"
                          style={{ borderColor: resource.category.color, color: resource.category.color }}
                        >
                          {resource.category.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {resource.is_featured && (
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  )}
                </div>

                {resource.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {resource.description}
                  </p>
                )}

                <div className="flex items-center justify-between mb-4">
                  <Badge className={getAccessLevelColor(resource.access_level)}>
                    {resource.access_level}
                  </Badge>
                  
                  {resource.file_size && (
                    <span className="text-sm text-gray-500">
                      {formatFileSize(resource.file_size)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {resource.view_count}
                  </div>
                  <div className="flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    {resource.download_count}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(resource.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {resource.file_url && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewResource(resource)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadResource(resource)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </>
                  )}

                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => toggleFeatured(resource)}
                  >
                    <Star className={`w-4 h-4 ${resource.is_featured ? 'text-yellow-500 fill-current' : ''}`} />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{resource.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteResource(resource.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};