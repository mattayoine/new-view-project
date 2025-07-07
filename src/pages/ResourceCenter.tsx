
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Upload, FolderOpen } from 'lucide-react';
import ResourceLibrary from '@/components/resources/ResourceLibrary';
import ResourceUpload from '@/components/resources/ResourceUpload';
import DocumentManager from '@/components/documents/DocumentManager';

const ResourceCenter: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resource Center</h1>
        <p className="text-gray-600">
          Manage your documents, access shared resources, and contribute to the knowledge base
        </p>
      </div>

      <Tabs defaultValue="library" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="library" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Resource Library
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            My Documents
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Resource
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library">
          <ResourceLibrary />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentManager />
        </TabsContent>

        <TabsContent value="upload">
          <ResourceUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResourceCenter;
