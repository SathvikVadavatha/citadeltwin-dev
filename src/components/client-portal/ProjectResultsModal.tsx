
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Download,
  FileUp,
  Landmark,
  MapPinned,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { Model3DViewer } from '@/components/3d/Model3DViewer';
import { ClientPortalProject, ClientPortalProjectResults } from '@/hooks/useClientPortalProjects';
import { getRoomLabel, getRoomDimensionsText } from '@/lib/blueprintPipeline';
import { BUILDING_TYPES } from './buildingTypeOptions';
import { useFederalRules } from '@/hooks/site-requirements/useFederalRules';
import { useJurisdictionLinks } from '@/hooks/site-requirements/useJurisdictionLinks';
import { FederalRequirementsTable } from '@/components/site-requirements/FederalRequirementsTable';
import { JurisdictionLinksSection } from '@/components/site-requirements/JurisdictionLinksSection';

interface ProjectResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ClientPortalProject | null;
  results?: ClientPortalProjectResults | null;
  onApprove?: () => void;
}

const suitabilityBadgeVariant = (color: string): 'default' | 'secondary' | 'destructive' => {
  if (color === 'green') return 'default';
  if (color === 'yellow') return 'secondary';
  return 'destructive';
};

const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'outline' => {
  switch (status) {
    case 'approved':
      return 'default';
    case 'in_progress':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getStatusLabel = (status: string) =>
  status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const getBuildingTypeLabel = (value: string | null) =>
  BUILDING_TYPES.find((t) => t.value === value)?.label || value || '—';

const getBuildingSubTypeLabel = (buildingType: string | null, subType: string | null) => {
  if (!subType) return null;
  const type = BUILDING_TYPES.find((t) => t.value === buildingType);
  return type?.subTypes.find((s) => s.value === subType)?.label || subType;
};

export const ProjectResultsModal: React.FC<ProjectResultsModalProps> = ({
  open,
  onOpenChange,
  project,
  results,
  onApprove,
}) => {
  const complianceResults = results?.compliance_results ?? null;

  // Federal rules only need the property type, which we always know from the
  // project itself — this works even when the resolve-location call hasn't
  // run yet/failed, unlike jurisdiction links below (which need a resolved state).
  const mappedPropertyType: 'residential' | 'commercial' =
    complianceResults?.propertyType ?? (project?.building_type === 'residential' ? 'residential' : 'commercial');

  // Hooks must run unconditionally on every render (rules of hooks), so these
  // are called before the `if (!project)` guard below, disabled via null input
  // when there's nothing to show yet.
  const { rules: federalRules, rulesLoading: federalRulesLoading, rulesError: federalRulesError } =
    useFederalRules(project ? mappedPropertyType : null);

  const { stateLinks, nationalLinks, linksLoading: jurisdictionLinksLoading, linksError: jurisdictionLinksError } =
    useJurisdictionLinks(complianceResults?.project.state_code ?? null);

  if (!project) return null;

  const gis = results?.gis_results;
  const rooms = results?.room_results;
  const isProcessing = results?.processing_status === 'running' || results?.processing_status === 'pending';

  // Coherent with the row/project status: once the model is ready, say so — and call
  // out GIS specifically if it's the only piece missing, instead of showing "Model
  // ready" next to an unrelated "failed"/"in progress" label elsewhere on the page.
  const modelStatusLabel = results?.model_3d_url
    ? gis
      ? 'Ready'
      : 'Ready (GIS unavailable)'
    : isProcessing
      ? 'Processing…'
      : 'Not available';

  const modelPlaceholderText = isProcessing
    ? '3D model is still processing.'
    : '3D model is not available for this project.';

  const toNumber = (value: number | string | undefined): number | null => {
    if (value == null) return null;
    const n = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(n) ? n : null;
  };

  // Fallback for when the pipeline didn't return an aggregate building.total_area_*:
  // sum whatever per-room width/depth the pipeline did return (rooms/labels already
  // rely on these same fields, so they're known-available even when the aggregate isn't).
  const roomAreasSqft = (rooms?.rooms ?? [])
    .map((room) => {
      const widthFt = toNumber(room.width_ft);
      const depthFt = toNumber(room.depth_ft);
      if (widthFt != null && depthFt != null) return widthFt * depthFt;
      const widthM = toNumber(room.width_m);
      const depthM = toNumber(room.depth_m);
      if (widthM != null && depthM != null) return widthM * depthM * 10.7639;
      return null;
    })
    .filter((area): area is number => area != null);
  const fallbackAreaSqft = roomAreasSqft.length > 0 ? roomAreasSqft.reduce((a, b) => a + b, 0) : null;

  const dimensionsText =
    rooms?.building?.total_area_sqft != null
      ? `${Math.round(rooms.building.total_area_sqft)} sq ft`
      : rooms?.building?.total_area_m2 != null
        ? `${rooms.building.total_area_m2} m²`
        : fallbackAreaSqft != null
          ? `~${Math.round(fallbackAreaSqft)} sq ft (from rooms)`
          : rooms && rooms.rooms.length > 0
            ? 'See room list below'
            : '—';

  const inferredUnit = (rooms?.rooms ?? []).some((room) => room.width_ft != null || room.depth_ft != null)
    ? 'imperial'
    : (rooms?.rooms ?? []).some((room) => room.width_m != null || room.depth_m != null)
      ? 'metric'
      : null;
  const measurementUnitText = rooms?.scale?.unit_system || inferredUnit || '—';

  const subTypeLabel = getBuildingSubTypeLabel(project.building_type, project.building_sub_type);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-none lg:w-[88vw] xl:max-w-6xl">
        <div className="mx-auto space-y-6 pb-8">
          <SheetHeader className="pr-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <SheetTitle className="text-2xl">{project.project_name}</SheetTitle>
                <SheetDescription className="mt-1">
                  {project.client_name}
                  {project.site_address ? ` · ${project.site_address}` : ''}
                </SheetDescription>
              </div>
              <Badge variant={getStatusBadgeVariant(project.status)}>{getStatusLabel(project.status)}</Badge>
            </div>
          </SheetHeader>

          <Card>
            <CardContent className="grid grid-cols-1 gap-4 p-5 text-sm sm:grid-cols-2 xl:grid-cols-5">
              <div>
                <p className="text-muted-foreground">Project ID</p>
                <p className="font-mono text-xs font-medium truncate" title={project.id}>
                  {project.id}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Building Type</p>
                <p className="font-medium">
                  {getBuildingTypeLabel(project.building_type)}
                  {subTypeLabel ? ` / ${subTypeLabel}` : ''}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Blueprint</p>
                <p className="font-medium truncate" title={project.blueprint_file_name ?? undefined}>
                  {project.blueprint_file_name || '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Model Status</p>
                <p className="font-medium">{modelStatusLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">{format(new Date(project.updated_at), 'MMM d, yyyy')}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5" />
                    3D Model and Blueprint Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {results?.model_3d_url ? (
                    <Model3DViewer modelUrl={results.model_3d_url} modelName={project.project_name} />
                  ) : (
                    <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed bg-muted/30 p-6 text-center">
                      <div className="max-w-md">
                        <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
                        <p className="mt-3 font-medium">{modelPlaceholderText}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                    <div className="rounded-md border p-3">
                      <p className="text-muted-foreground">Dimensions</p>
                      <p className="mt-1 font-medium">{dimensionsText}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-muted-foreground">Measurement Unit</p>
                      <p className="mt-1 font-medium capitalize">{measurementUnitText}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-muted-foreground">Rooms Detected</p>
                      <p className="mt-1 font-medium">{rooms?.roomCount ?? '—'}</p>
                    </div>
                  </div>

                  {rooms?.walls && rooms.walls.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {rooms.walls.filter((w) => w.wall_type === 'exterior_wall').length} exterior ·{' '}
                      {rooms.walls.filter((w) => w.wall_type === 'interior_wall').length} interior ·{' '}
                      {rooms.walls.filter((w) => w.wall_type === 'load_bearing_wall').length} load-bearing walls
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium">Room labels</p>
                    {rooms && rooms.rooms.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {rooms.rooms.map((room, index) => {
                          const dims = getRoomDimensionsText(room);
                          return (
                            <Badge key={index} variant="secondary" className="capitalize">
                              {getRoomLabel(room, index)}
                              {dims ? ` — ${dims}` : ''}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">No rooms detected in this blueprint.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5" />
                    Client Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project.feedback ? (
                    <p className="text-sm whitespace-pre-wrap">{project.feedback}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No feedback yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Landmark className="h-5 w-5" />
                    Site &amp; Federal Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    This surfaces federal requirements and site hazard data; it does not review
                    your design or determine compliance.
                  </p>

                  {complianceResults ? (
                    <>
                      {complianceResults.warnings.length > 0 && (
                        <div className="space-y-1 rounded-md border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
                          {complianceResults.warnings.map((warning, index) => (
                            <p key={index}>{warning}</p>
                          ))}
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-medium">Site conditions</p>
                        {complianceResults.siteConditions.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            {complianceResults.siteConditions.map((condition) => (
                              <div key={condition.id} className="rounded-md border p-3 text-sm">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-medium">{condition.label}</p>
                                  <p className="font-medium">
                                    {condition.value}
                                    {condition.unit ? ` ${condition.unit}` : ''}
                                  </p>
                                </div>
                                {condition.note && (
                                  <p className="mt-1 text-xs text-muted-foreground">{condition.note}</p>
                                )}
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Source:{' '}
                                  {condition.source_url ? (
                                    <a
                                      href={condition.source_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      {condition.source}
                                      {condition.source_edition ? ` (${condition.source_edition})` : ''}
                                    </a>
                                  ) : (
                                    <>
                                      {condition.source}
                                      {condition.source_edition ? ` (${condition.source_edition})` : ''}
                                    </>
                                  )}
                                  {' · retrieved '}
                                  {format(new Date(condition.retrieved_at), 'MMM d, yyyy')}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">No site conditions retrieved.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Site &amp; federal data not available.</p>
                  )}
                </CardContent>
              </Card>

              <FederalRequirementsTable
                rules={federalRules}
                isLoading={federalRulesLoading}
                error={federalRulesError}
                propertyType={mappedPropertyType}
              />

              <JurisdictionLinksSection
                stateName={complianceResults?.project.state_name ?? null}
                placeName={complianceResults?.project.place_name ?? null}
                stateLinks={stateLinks}
                nationalLinks={nationalLinks}
                isLoading={jurisdictionLinksLoading}
                error={jurisdictionLinksError}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPinned className="h-5 w-5" />
                    Site Risk and GIS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {gis ? (
                    <>
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <p className="font-medium">Site Suitability</p>
                          <p className="text-xs text-muted-foreground">Higher = more suitable for construction</p>
                        </div>
                        <Badge variant={suitabilityBadgeVariant(gis.suitability.color)} className="text-base px-3 py-1">
                          {gis.suitability.score}/10
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-md border p-3">
                          <p className="text-xs font-medium text-muted-foreground">Flood Risk</p>
                          <p className="mt-1 font-medium">{gis.flood.riskLevel}</p>
                          {gis.flood.highestZone && (
                            <p className="text-xs text-muted-foreground">Zone: {gis.flood.highestZone}</p>
                          )}
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs font-medium text-muted-foreground">Protected / Wetlands</p>
                          <p className="mt-1 font-medium">{gis.protected.count} nearby</p>
                          <p className="text-xs text-muted-foreground">
                            {gis.soils.wetlandsPresent
                              ? `Wetlands: ${gis.soils.wetlandTypes.join(', ') || 'Present'}`
                              : 'No wetlands detected'}
                          </p>
                        </div>
                        <div className="rounded-md border p-3 col-span-2">
                          <p className="text-xs font-medium text-muted-foreground">Soils</p>
                          <p className="mt-1 font-medium">{gis.soils.dominantSoil || 'No data available'}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No GIS results available.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="sticky bottom-0 rounded-lg border bg-background/95 p-4 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex max-w-3xl items-start gap-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                <p className="text-muted-foreground">
                  These results are preliminary and are not a substitute for review by a licensed professional.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled>
                  <FileUp className="mr-2 h-4 w-4" />
                  Re-upload Revision
                </Button>
                <Button variant="outline" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button onClick={onApprove} disabled={!onApprove || project.status === 'approved'}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {project.status === 'approved' ? 'Approved' : 'Approve Project'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
