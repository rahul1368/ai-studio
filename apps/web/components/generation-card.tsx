'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Download, RefreshCw, Eye } from 'lucide-react';
import { API_URL } from '@/lib/api-config';
import { toast } from 'sonner';

interface Generation {
  id: string;
  prompt: string;
  originalImage: string;
  resultImage: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

interface GenerationCardProps {
  generation: Generation;
  onReapply: (id: string, prompt: string) => void;
  viewMode: 'grid' | 'list';
}

export function GenerationCard({ generation, onReapply, viewMode }: GenerationCardProps) {
  const [reapplyOpen, setReapplyOpen] = useState(false);
  const [reapplyPrompt, setReapplyPrompt] = useState(generation.prompt);

  const buildUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const normalized = path.startsWith('/') ? path.slice(1) : path;
    return `${API_URL}/${normalized}`;
  };

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image downloaded');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (viewMode === 'list') {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={buildUrl(generation.originalImage)}
                alt="Original"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              {generation.resultImage ? (
                <img
                  src={buildUrl(generation.resultImage)}
                  alt="Generated"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {generation.prompt}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs ${getStatusColor(generation.status)}`}>
                  {generation.status}
                </Badge>
                <span className="text-xs text-gray-500">
                  {new Date(generation.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReapply(generation.id, generation.prompt)}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleDownload(
                      `${API_URL}/uploads/${generation.resultImage.split('/').pop()}`,
                      `generated-${generation.id}.jpg`
                    )}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Result
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDownload(
                      `${API_URL}/uploads/${generation.originalImage.split('/').pop()}`,
                      `original-${generation.id}.jpg`
                    )}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Original
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-square">
          {generation.resultImage ? (
            <img
              src={buildUrl(generation.resultImage)}
              alt="Generated"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <img
              src={buildUrl(generation.originalImage)}
              alt="Original"
              className="h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(buildUrl(generation.resultImage), '_blank')}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onReapply(generation.id, generation.prompt)}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleDownload(
                    `${API_URL}/uploads/${generation.resultImage.split('/').pop()}`,
                    `generated-${generation.id}.jpg`
                  )}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Result
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDownload(
                    `${API_URL}/uploads/${generation.originalImage.split('/').pop()}`,
                    `original-${generation.id}.jpg`
                  )}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Original
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="absolute top-2 left-2">
            <Badge className={`text-xs ${getStatusColor(generation.status)}`}>
              {generation.status}
            </Badge>
          </div>
        </div>
        <div className="p-3">
          <p className="text-sm font-medium text-gray-900 truncate mb-1">
            {generation.prompt}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(generation.createdAt).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
