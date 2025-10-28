'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Upload, LogOut, Loader2, Image as ImageIcon, Grid3X3, List, RefreshCw, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api-config';
import { compressImageFile } from '@/lib/image';
import { useInfiniteGenerations } from '@/lib/hooks/use-generations';
import { GenerationCard } from '@/components/generation-card';
import { GenerationsSkeleton } from '@/components/generations-skeleton';

interface Generation {
  id: string;
  prompt: string;
  originalImage: string;
  resultImage: string | null;
  status: string;
  error: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, logout, loading: authLoading, token } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  
  const recommended = ['vintage', 'retro', 'dark', 'moody', 'bright', 'vibrant', 'blur', 'soft'];
  const [reapplyOpenId, setReapplyOpenId] = useState<string | null>(null);
  const [reapplyPrompt, setReapplyPrompt] = useState('');

  const {
    generations,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteGenerations(token);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();

    if (!file || !prompt.trim()) {
      toast.error('Please upload an image and provide a prompt');
      return;
    }

    setGenerating(true);

    try {
      const formData = new FormData();
      const compressed = await compressImageFile(file, { maxSize: 1024, quality: 0.8, format: 'image/webp' });
      formData.append('image', compressed);
      formData.append('prompt', prompt.trim());

      const res = await fetch(`${API_URL}/generation`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Image generated successfully!');
        setFile(null);
        setPrompt('');
        setPreview(null);
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Refresh history
        refresh();
      } else {
        toast.error(data.error || 'Generation failed');
      }
    } catch (error) {
      toast.error('Failed to generate image');
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
    }
  }

  async function handleReapply(id: string, newPrompt: string) {
    try {
      const res = await fetch(`${API_URL}/generation/${id}/reapply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: newPrompt }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Reapplied filter');
        setReapplyOpenId(null);
        refresh();
      } else {
        toast.error(data.error || 'Failed to reapply');
      }
    } catch (e) {
      toast.error('Failed to reapply');
    }
  }

  const filteredGenerations = generations.filter(gen => {
    if (filterStatus === 'all') return true;
    return gen.status.toLowerCase() === filterStatus;
  });

  const sortedGenerations = [...filteredGenerations].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  });

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AI Studio</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.name || user.email}
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Generation</CardTitle>
            <CardDescription>
              Upload an image and provide a prompt to generate a new fashion image
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={generating}
                  />
                  {preview && (
                    <div className="relative h-20 w-20 rounded-md overflow-hidden border">
                      <img
                        src={preview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    id="prompt"
                    type="text"
                    placeholder="Try: vintage, dark, vibrant, blur..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={generating}
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {recommended.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setPrompt(tag)}
                        className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                          prompt === tag
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-accent text-foreground border-border'
                        }`}
                        aria-label={`Use prompt ${tag}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Describe how you want to transform your image</p>
              </div>

              <Button type="submit" disabled={generating || !file || !prompt.trim()}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Generations</CardTitle>
                <CardDescription>
                  {sortedGenerations.length} of {generations.length} generations
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refresh()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')} className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList>
                  <TabsTrigger value="grid" className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    Grid
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    List
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'newest' | 'oldest')}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'completed' | 'processing' | 'failed')}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="grid" className="space-y-4">
                {isLoading ? (
                  <GenerationsSkeleton viewMode="grid" count={8} />
                ) : sortedGenerations.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No generations yet. Create your first one above!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {sortedGenerations.map((gen) => (
                        <GenerationCard
                          key={gen.id}
                          generation={gen}
                          onReapply={handleReapply}
                          viewMode="grid"
                        />
                      ))}
                    </div>
                    {hasMore && (
                      <div className="flex justify-center pt-4">
                        <Button
                          variant="outline"
                          onClick={loadMore}
                          disabled={isLoadingMore}
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            'Load More'
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="list" className="space-y-4">
                {isLoading ? (
                  <GenerationsSkeleton viewMode="list" count={5} />
                ) : sortedGenerations.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No generations yet. Create your first one above!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {sortedGenerations.map((gen) => (
                        <GenerationCard
                          key={gen.id}
                          generation={gen}
                          onReapply={handleReapply}
                          viewMode="list"
                        />
                      ))}
                    </div>
                    {hasMore && (
                      <div className="flex justify-center pt-4">
                        <Button
                          variant="outline"
                          onClick={loadMore}
                          disabled={isLoadingMore}
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            'Load More'
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}