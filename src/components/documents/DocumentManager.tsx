
import React, { useState } from 'react';
import { FileText, Download, Trash2, Upload, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import { useUserDocuments } from '@/hooks/useUserDocuments';
import { useFileUpload } from '@/hooks/useFileUpload';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const DocumentManager: React.FC = () => {
  const { documents, isLoading, addDocument, deleteDocument } = useUserDocuments();
  const { uploadFile, uploading, progress } = useFileUpload();
  const [documentType, setDocumentType] = useState('general');

  const handleFileUpload = async (file: File) => {
    try {
      const result = await uploadFile(file, {
        bucket: 'documents',
        folder: documentType,
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ]
      });

      await addDocument.mutateAsync({
        filename: result.fileName,
        original_filename: file.name,
        file_size: result.fileSize,
        mime_type: result.mimeType,
        storage_path: result.path,
        document_type: documentType,
        is_private: true
      });
    } catch (error) {
      console.error('Document upload failed:', error);
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      const { data } = await supabase.storage
        .from('documents')
        .download(doc.storage_path);

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.original_filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeColor = (type: string) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800',
      contract: 'bg-blue-100 text-blue-800',
      financial: 'bg-green-100 text-green-800',
      legal: 'bg-red-100 text-red-800',
      marketing: 'bg-purple-100 text-purple-800',
      technical: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || colors.general;
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload New Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Document Type</label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <FileUpload
            onFileSelect={handleFileUpload}
            accept=".pdf,.doc,.docx,.txt"
            maxSize={50 * 1024 * 1024}
            dragDropText="Drop your documents here (PDF, DOC, DOCX, TXT)"
            uploading={uploading}
            progress={progress}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            My Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3 flex-1">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.original_filename}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge className={getDocumentTypeColor(doc.document_type)}>
                      {doc.document_type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Document</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{doc.original_filename}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteDocument.mutate(doc.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentManager;
