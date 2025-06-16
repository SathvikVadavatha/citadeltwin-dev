
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Clock, CheckCircle, XCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useClientFeedback } from '@/hooks/useClientFeedback';

export const ClientFeedbackManager: React.FC = () => {
  const [newFeedback, setNewFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('comment');
  const { feedback, submitFeedback, loading } = useClientFeedback();

  const handleSubmitFeedback = async () => {
    if (!newFeedback.trim()) return;
    
    await submitFeedback({
      content: newFeedback,
      type: feedbackType,
    });
    
    setNewFeedback('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Submit New Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comment">General Comment</SelectItem>
                <SelectItem value="approval">Approval Request</SelectItem>
                <SelectItem value="revision">Revision Request</SelectItem>
                <SelectItem value="question">Question</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Enter your feedback or comments..."
            value={newFeedback}
            onChange={(e) => setNewFeedback(e.target.value)}
            className="min-h-[120px]"
          />
          <Button 
            onClick={handleSubmitFeedback}
            disabled={!newFeedback.trim() || loading}
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Feedback
          </Button>
        </CardContent>
      </Card>

      {/* Feedback History */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feedback.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No feedback submitted yet</p>
              </div>
            ) : (
              feedback.map((item: any) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="font-medium">{item.type}</span>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm">{item.content}</p>
                  {item.response && (
                    <div className="mt-3 p-3 bg-muted rounded border-l-4 border-primary">
                      <div className="text-sm font-medium text-primary mb-1">Response:</div>
                      <p className="text-sm">{item.response}</p>
                      {item.responded_at && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Responded on {format(new Date(item.responded_at), 'MMM d, yyyy h:mm a')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
