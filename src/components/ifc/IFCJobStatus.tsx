import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText
} from "lucide-react";

interface IfcJob {
  id: string;
  status: string;
  output_file_path?: string | null;
  error_message?: string | null;
  processing_time_ms?: number | null;
  created_at: string;
  completed_at?: string | null;
  upload_id: string;
  user_id: string;
  input_data: any;
}

interface IFCJobStatusProps {
  job: IfcJob;
  onDownload: (job: IfcJob) => void;
}

export const IFCJobStatus: React.FC<IFCJobStatusProps> = ({ job, onDownload }) => {
  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'completed':
        return 'bg-green-50 text-green-800 border-green-300';
      case 'failed':
        return 'bg-red-50 text-red-800 border-red-300';
      case 'processing':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-300';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startTime: string, endTime?: string | null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const seconds = Math.floor(diffMs / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const getProgress = () => {
    switch (job.status) {
      case 'completed': return 100;
      case 'failed': return 100;
      case 'processing': return 65; // Estimated progress
      case 'pending': return 0;
      default: return 0;
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">IFC Generation</span>
          <Badge variant="outline" className={getStatusColor()}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </Badge>
        </div>
        
        {job.status === 'completed' && job.output_file_path && (
          <Button 
            size="sm" 
            onClick={() => onDownload(job)}
            className="gap-2"
          >
            <Download className="h-3 w-3" />
            Download IFC
          </Button>
        )}
      </div>

      {/* Progress bar for active jobs */}
      {(job.status === 'processing' || job.status === 'pending') && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {job.status === 'processing' ? 'Processing 3D model...' : 'Queued for processing'}
            </span>
            <span className="text-muted-foreground">{getProgress()}%</span>
          </div>
          <Progress value={getProgress()} className="h-2" />
        </div>
      )}

      {/* Job details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Started:</span>
          <span className="ml-2 font-medium">{formatDateTime(job.created_at)}</span>
        </div>
        
        {job.completed_at && (
          <div>
            <span className="text-muted-foreground">Completed:</span>
            <span className="ml-2 font-medium">{formatDateTime(job.completed_at)}</span>
          </div>
        )}
        
        <div>
          <span className="text-muted-foreground">Duration:</span>
          <span className="ml-2 font-medium">
            {formatDuration(job.created_at, job.completed_at)}
          </span>
        </div>
        
        {job.processing_time_ms && (
          <div>
            <span className="text-muted-foreground">Processing Time:</span>
            <span className="ml-2 font-medium">
              {(job.processing_time_ms / 1000).toFixed(1)}s
            </span>
          </div>
        )}
      </div>

      {/* Error message */}
      {job.status === 'failed' && job.error_message && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
          <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
            <AlertCircle className="h-3 w-3" />
            Generation Failed
          </div>
          <p className="text-red-700">{job.error_message}</p>
        </div>
      )}

      {/* Success message */}
      {job.status === 'completed' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
          <div className="flex items-center gap-2 text-green-800 font-medium mb-1">
            <CheckCircle className="h-3 w-3" />
            IFC Model Generated Successfully
          </div>
          <p className="text-green-700">
            Your 3D model is ready for download and can be imported into any BIM software that supports IFC format.
          </p>
        </div>
      )}

      {/* Job ID for reference */}
      <div className="text-xs text-muted-foreground">
        Job ID: {job.id.slice(0, 8)}...
      </div>
    </div>
  );
};