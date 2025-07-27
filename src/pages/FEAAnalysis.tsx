
import React from 'react';
import { FEAAnalysisManager } from '@/components/fea/FEAAnalysisManager';
import { RoomBoundaryDetector } from '@/components/analysis/RoomBoundaryDetector';
import { useViewport } from '@/hooks/useViewport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const FEAAnalysis: React.FC = () => {
  const { isMobile } = useViewport();
  
  return (
    <div className={`container mx-auto ${isMobile ? 'p-3' : 'p-6'}`}>
      <div className="space-y-6">
        <div>
          <h1 className={`font-bold text-foreground ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            Structural Analysis & Room Detection
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive finite element analysis and floor plan room boundary detection
          </p>
        </div>
        
        <Tabs defaultValue="fea" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fea">FEA Analysis</TabsTrigger>
            <TabsTrigger value="room-detection">Room Detection</TabsTrigger>
          </TabsList>
          
          <TabsContent value="fea" className="space-y-6">
            <FEAAnalysisManager />
          </TabsContent>
          
          <TabsContent value="room-detection" className="space-y-6">
            <RoomBoundaryDetector />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
