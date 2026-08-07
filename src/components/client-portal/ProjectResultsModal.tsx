
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Model3DViewer } from '@/components/3d/Model3DViewer';
import { ClientPortalProject, ClientPortalProjectResults } from '@/hooks/useClientPortalProjects';
import { getRoomLabel, getRoomDimensionsText } from '@/lib/blueprintPipeline';

interface ProjectResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ClientPortalProject | null;
  results?: ClientPortalProjectResults | null;
}

const suitabilityBadgeVariant = (color: string): 'default' | 'secondary' | 'destructive' => {
  if (color === 'green') return 'default';
  if (color === 'yellow') return 'secondary';
  return 'destructive';
};

export const ProjectResultsModal: React.FC<ProjectResultsModalProps> = ({
  open,
  onOpenChange,
  project,
  results,
}) => {
  if (!project) return null;

  const gis = results?.gis_results;
  const rooms = results?.room_results;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl md:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{project.project_name}</SheetTitle>
          <SheetDescription>
            {project.client_name}
            {project.site_address ? ` · ${project.site_address}` : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">GIS Analysis</h3>
            {gis ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="text-sm font-medium">Site Suitability Score</div>
                    <div className="text-xs text-muted-foreground">Higher = more suitable for construction</div>
                  </div>
                  <Badge variant={suitabilityBadgeVariant(gis.suitability.color)} className="text-base px-3 py-1">
                    {gis.suitability.score}/10
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border p-4 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Flood Risk</div>
                    <div className="text-sm font-semibold">{gis.flood.riskLevel}</div>
                    <div className="text-xs text-muted-foreground">{gis.flood.explanation}</div>
                    {gis.flood.highestZone && (
                      <div className="text-xs text-muted-foreground">Zone: {gis.flood.highestZone}</div>
                    )}
                  </div>

                  <div className="rounded-lg border p-4 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Protected Areas</div>
                    <div className="text-sm font-semibold">{gis.protected.count} nearby</div>
                    {gis.protected.closest.slice(0, 3).map((p, i) => (
                      <div key={i} className="text-xs text-muted-foreground">
                        {p.name} — {p.agency}
                        {p.distanceMiles != null ? ` (${p.distanceMiles.toFixed(2)} mi)` : ''}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border p-4 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Soils & Wetlands</div>
                    <div className="text-sm font-semibold">{gis.soils.dominantSoil || 'No data'}</div>
                    <div className="text-xs text-muted-foreground">
                      {gis.soils.wetlandsPresent
                        ? `Wetlands present: ${gis.soils.wetlandTypes.join(', ') || 'Yes'}`
                        : 'No wetlands detected'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No GIS results available.</p>
            )}
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">Room Analysis</h3>
            {rooms ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-8">
                  <div>
                    <div className="text-2xl font-bold">{rooms.roomCount}</div>
                    <div className="text-xs text-muted-foreground">Rooms detected</div>
                  </div>
                  {(rooms.building?.total_area_sqft != null || rooms.building?.total_area_m2 != null) && (
                    <div>
                      <div className="text-2xl font-bold">
                        {rooms.building?.total_area_sqft != null
                          ? `${Math.round(rooms.building.total_area_sqft)} sq ft`
                          : `${rooms.building?.total_area_m2} m²`}
                      </div>
                      <div className="text-xs text-muted-foreground">Total area</div>
                    </div>
                  )}
                  {rooms.scale?.unit_system && (
                    <div>
                      <div className="text-sm font-semibold capitalize pt-1.5">
                        {rooms.scale.scale_text || rooms.scale.scale_source || 'estimated'}
                      </div>
                      <div className="text-xs text-muted-foreground">Scale ({rooms.scale.unit_system})</div>
                    </div>
                  )}
                </div>

                {rooms.walls && rooms.walls.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {rooms.walls.filter((w) => w.wall_type === 'exterior_wall').length} exterior ·{' '}
                    {rooms.walls.filter((w) => w.wall_type === 'interior_wall').length} interior ·{' '}
                    {rooms.walls.filter((w) => w.wall_type === 'load_bearing_wall').length} load-bearing walls
                  </div>
                )}

                {rooms.rooms.length > 0 ? (
                  <div className="rounded-md border divide-y">
                    {rooms.rooms.map((room, index) => (
                      <div key={index} className="flex items-center justify-between px-4 py-2 text-sm">
                        <span className="font-medium capitalize">{getRoomLabel(room, index)}</span>
                        <span className="text-muted-foreground">
                          {getRoomDimensionsText(room) ?? '—'}
                          {room.confidence != null ? ` · ${Math.round(room.confidence * 100)}%` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No rooms detected in this blueprint.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No room analysis available.</p>
            )}
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">3D Model</h3>
            {results?.model_3d_url ? (
              <Model3DViewer modelUrl={results.model_3d_url} modelName={project.project_name} />
            ) : (
              <p className="text-sm text-muted-foreground">3D model not available.</p>
            )}
          </section>

          <Separator />

          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wide">Compliance</h3>
            <p className="text-sm text-muted-foreground">Compliance analysis coming soon.</p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};
