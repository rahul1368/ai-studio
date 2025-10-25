'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Upload, LogOut, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

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
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && token) {
      fetchGenerations();
    }
  }, [user, token]);

  async function fetchGenerations() {
    try {
      const res = await fetch('/api/generations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setGenerations(data.generations);
      }
    } catch (error) {
      console.error('Failed to fetch generations:', error);
    } finally {
      setLoadingHistory(false);
    }
  }

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
      formData.append('image', file);
      formData.append('prompt', prompt.trim());

      const res = await fetch('/api/generate', {
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
        await fetchGenerations();
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
                <Input
                  id="prompt"
                  type="text"
                  placeholder="E.g., vintage style, bright colors, moody dark aesthetic..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={generating}
                />
                <p className="text-xs text-muted-foreground">
                  Describe how you want to transform your image
                </p>
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
            <CardTitle>Recent Generations</CardTitle>
            <CardDescription>Your last 5 image generations</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="text-center py-8">
                <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading history...</p>
              </div>
            ) : generations.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No generations yet. Create your first one above!
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {generations.map((gen) => (
                  <div key={gen.id} className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative aspect-square rounded-md overflow-hidden border">
                        <img
                          src={gen.originalImage}
                          alt="Original"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2">
                          Original
                        </div>
                      </div>
                      <div className="relative aspect-square rounded-md overflow-hidden border">
                        {gen.status === 'COMPLETED' && gen.resultImage ? (
                          <>
                            <img
                              src={gen.resultImage}
                              alt="Generated"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2">
                              Generated
                            </div>
                          </>
                        ) : gen.status === 'FAILED' ? (
                          <div className="h-full w-full flex items-center justify-center bg-destructive/10 text-destructive text-xs text-center p-2">
                            Failed
                          </div>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-muted">
                            <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      <strong>Prompt:</strong> {gen.prompt}
                    </p>
                    {gen.error && (
                      <p className="text-xs text-destructive">Error: {gen.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

