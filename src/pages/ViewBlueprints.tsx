import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileImage, Loader2, Upload } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/AuthProvider';
import { useUploads } from '@/hooks/useUploads';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes || bytes <= 0) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

interface StatusBadgeProps {
  status: string | null | undefined;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const value = status || 'unknown';
  const label = value.replace(/_/g, ' ');

  if (value === 'processing') {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        {label}
      </Badge>
    );
  }

  const variantClass = cn(
    value === 'processed' && 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300',
    value === 'processed_fallback' && 'border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
    value === 'uploaded' && 'border-muted-foreground/30 bg-muted text-muted-foreground',
    !['processed', 'processed_fallback', 'uploaded'].includes(value) &&
      'border-muted-foreground/30 bg-muted text-muted-foreground'
  );

  return (
    <Badge variant="outline" className={variantClass}>
      {label}
    </Badge>
  );
};

interface BlueprintRow {
  id: string;
  original_filename: string;
  filename?: string | null;
  file_size: number | null;
  upload_status: string | null;
  created_at: string;
  storage_path: string | null;
}

const BlueprintCardSkeleton: React.FC = () => (
  <Card>
    <CardHeader className="pb-3">
      <Skeleton className="h-32 w-full rounded-md" />
    </CardHeader>
    <CardContent className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </CardContent>
    <CardFooter>
      <Skeleton className="h-9 w-full" />
    </CardFooter>
  </Card>
);

interface BlueprintCardProps {
  upload: BlueprintRow;
}

const BlueprintCard: React.FC<BlueprintCardProps> = ({ upload }) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [thumbFailed, setThumbFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!upload.storage_path) {
      setThumbFailed(true);
      return;
    }

    supabase.storage
      .from('blueprints')
      .createSignedUrl(upload.storage_path, 60 * 60)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.signedUrl) {
          setThumbFailed(true);
        } else {
          setThumbUrl(data.signedUrl);
        }
      })
      .catch(() => {
        if (!cancelled) setThumbFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [upload.storage_path]);

  const handleView = () => {
    if (thumbUrl) {
      window.open(thumbUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative h-40 w-full overflow-hidden bg-muted">
        {thumbUrl && !thumbFailed ? (
          <img
            src={thumbUrl}
            alt={upload.original_filename}
            className="h-full w-full object-cover"
            onError={() => setThumbFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileImage className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute right-2 top-2">
          <StatusBadge status={upload.upload_status} />
        </div>
      </div>

      <CardContent className="flex-1 space-y-1 pt-4">
        <CardTitle className="truncate text-base" title={upload.original_filename}>
          {upload.original_filename}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(upload.file_size)} · {formatDate(upload.created_at)}
        </p>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleView}
          disabled={!thumbUrl}
          variant="outline"
          size="sm"
          className="w-full"
        >
          View
        </Button>
      </CardFooter>
    </Card>
  );
};

export const ViewBlueprints: React.FC = () => {
  const { user } = useAuth();
  const { uploads, isLoading } = useUploads(user?.id);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <BlueprintCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!uploads || uploads.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <FileImage className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                No blueprints uploaded yet.
              </h2>
              <p className="text-sm text-muted-foreground">
                Upload your first blueprint to get started.
              </p>
            </div>
            <Button asChild>
              <Link to="/blueprints/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Blueprint
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {uploads.length} {uploads.length === 1 ? 'Blueprint' : 'Blueprints'}
        </h1>
        <Button asChild>
          <Link to="/blueprints/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(uploads as BlueprintRow[]).map((upload) => (
          <BlueprintCard key={upload.id} upload={upload} />
        ))}
      </div>
    </div>
  );
};
