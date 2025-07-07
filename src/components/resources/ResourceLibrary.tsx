
import React, { useState } from 'react';
import { Search, Filter, BookOpen, Download, Share2, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useResources } from '@/hooks/useResources';

const ResourceLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAccess, setFilterAccess] = useState('all');
  
  const { resources, isLoading, incrementDownloadCount } = useResources();

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || resource.type === filterType;
    const matchesAccess = filterAccess === 'all' || resource.access_level === filterAccess;
    
    return matchesSearch && matchesType && matchesAccess;
  });

  const handleDownload = async (resource: any) => {
    try {
      if (resource.file_url) {
        const a = document.createElement('a');
        a.href = resource.file_url;
        a.download = resource.original_filename || resource.title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Increment download count
        incrementDownloadCount.mutate(resource.id);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getResourceTypeColor = (type: string) => {
    const colors = {
      template: 'bg-blue-100 text-blue-800',
      guide: 'bg-green-100 text-green-800',
      tool: 'bg-purple-100 text-purple-800',
      case_study: 'bg-orange-100 text-orange-800',
      presentation: 'bg-red-100 text-red-800',
      document: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.document;
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading resources...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Resource Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="template">Templates</SelectItem>
                <SelectItem value="guide">Guides</SelectItem>
                <SelectItem value="tool">Tools</SelectItem>
                <SelectItem value="case_study">Case Studies</SelectItem>
                <SelectItem value="presentation">Presentations</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterAccess} onValueChange={setFilterAccess}>
              <SelectTrigger>
                <SelectValue placeholder="All Access" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No resources found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getResourceTypeColor(resource.type)}>
                        {resource.type.replace('_', ' ')}
                      </Badge>
                      {resource.is_featured && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {resource.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {resource.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatFileSize(resource.file_size)}</span>
                  <span>{resource.download_count} downloads</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {resource.file_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(resource)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ResourceLibrary;
