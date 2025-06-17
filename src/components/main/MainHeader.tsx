
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MainHeader: React.FC = () => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CitadelTwin</h1>
          <p className="text-muted-foreground">Civil Engineering Digital Twin Platform</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/collaboration">
              <Users className="h-4 w-4 mr-2" />
              Collaboration
            </Link>
          </Button>
          <Button asChild>
            <Link to="/ai-assistant">
              <Brain className="h-4 w-4 mr-2" />
              AI Assistant
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
