import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertTriangle,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  Download,
  FileUp,
  Landmark,
  Loader2,
  MapPin,
  MapPinned,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Waves,
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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

const CHART_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#ea580c', '#16a34a'];

const titleCase = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const floodRiskClasses = (riskLevel: string) => {
  switch (riskLevel) {
    case 'HIGH':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'MODERATE':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'LOW':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    default:
      return 'border-border bg-muted/40 text-muted-foreground';
  }
};

const suitabilityClasses = (score: number | null) => {
  if (score == null) return 'border-border bg-muted/40';
  if (score >= 8) return 'border-emerald-200 bg-emerald-50';
  if (score >= 5) return 'border-amber-200 bg-amber-50';
  return 'border-red-200 bg-red-50';
};

export const ProjectResultsModal: React.FC<ProjectResultsModalProps> = ({
  open,
  onOpenChange,
  project,
  results,
  onApprove,
}) => {
  const complianceResults = results?.compliance_results ?? null;
  const isProcessing = Boolean(project) && (
    !results || results.processing_status === 'running' || results.processing_status === 'pending'
  );

  // Federal rules only need the property type, which we always know from the
  // project itself — this works even when the resolve-location call hasn't
  // run yet/failed, unlike jurisdiction links below (which need a resolved state).
  const mappedPropertyType: 'residential' | 'commercial' =
    complianceResults?.propertyType ?? (project?.building_type === 'residential' ? 'residential' : 'commercial');

  // Hooks must run unconditionally on every render (rules of hooks), so these
  // are called before the `if (!project)` guard below, disabled via null input
  // when there's nothing to show yet.
  const { rules: federalRules, rulesLoading: federalRulesLoading, rulesError: federalRulesError } =
    useFederalRules(project && !isProcessing ? mappedPropertyType : null);

  const { stateLinks, nationalLinks, linksLoading: jurisdictionLinksLoading, linksError: jurisdictionLinksError } =
    useJurisdictionLinks(!isProcessing ? complianceResults?.project.state_code ?? null : null);

  if (!project) return null;

  const gis = results?.gis_results;
  const rooms = results?.room_results;

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

  const federalRequirementRows = federalRules.filter((rule) => rule.comparator !== 'note');
  const siteConditionsCount = complianceResults?.siteConditions.length ?? 0;
  const warningsCount = complianceResults?.warnings.length ?? 0;
  const jurisdictionResourceCount = stateLinks.length + nationalLinks.length;
  const suitabilityScore = gis?.suitability.score ?? null;

  const siteSuitabilityNote =
    suitabilityScore == null
      ? 'No GIS suitability score is available for this project yet.'
      : suitabilityScore >= 8
        ? 'Strong suitability in the available GIS analysis, with fewer identified site constraints.'
        : suitabilityScore >= 5
          ? 'Moderate suitability; some location conditions may need closer review.'
          : 'Lower suitability; the identified site constraints should be reviewed carefully.';

  const floodRiskNote = !gis
    ? 'No flood-risk result is available for this project yet.'
    : gis.flood.riskLevel === 'HIGH'
      ? 'High flood exposure is an important site factor to review for this project.'
      : gis.flood.riskLevel === 'MODERATE'
        ? 'Moderate flood exposure is present and may need closer review.'
        : gis.flood.riskLevel === 'LOW'
          ? 'Low flood exposure is indicated in the available GIS result.'
          : 'A flood-risk value was returned, but it is not classified as Low, Moderate, or High.';

  const requirementSourceData = [
    { name: 'Federal rules', value: federalRequirementRows.length },
    { name: 'State resources', value: stateLinks.length },
    { name: 'National resources', value: nationalLinks.length },
    { name: 'Site conditions', value: siteConditionsCount },
  ].filter((item) => item.value > 0);

  const federalCategoryData = Array.from(
    federalRequirementRows.reduce((acc, rule) => {
      const category = titleCase(rule.category || 'Other');
      acc.set(category, (acc.get(category) ?? 0) + 1);
      return acc;
    }, new Map<string, number>())
  ).map(([category, count]) => ({ category, count }));

  const gisSignalData = gis
    ? [
        { label: 'Flood zones', count: gis.flood.zoneCount },
        { label: 'Protected areas', count: gis.protected.count },
        { label: 'Wetland types', count: gis.soils.wetlandTypes.length },
        { label: 'Site conditions', count: siteConditionsCount },
      ]
    : [];

  const environmentalSignalTotal = gisSignalData.reduce((sum, item) => sum + item.count, 0);

  const closestProtectedArea = gis?.protected.closest.find(
    (area) => typeof area.distanceMiles === 'number'
  );

  const localJurisdictionLabel = complianceResults
    ? [
        complianceResults.project.place_name,
        complianceResults.project.county_name,
        complianceResults.project.state_name,
      ]
        .filter(Boolean)
        .join(' · ')
    : project.site_address || 'Location not resolved';

  const insightItems: Array<{ title: string; detail: string }> = [];

  if (gis) {
    insightItems.push({
      title: 'Site suitability',
      detail: `The current GIS suitability score is ${gis.suitability.score}/10.`,
    });

    insightItems.push({
      title: 'Flood exposure',
      detail: `${titleCase(gis.flood.riskLevel)} flood risk${
        gis.flood.highestZone ? ` with highest mapped zone ${gis.flood.highestZone}` : ''
      }.`,
    });

    insightItems.push({
      title: 'Wetlands',
      detail: gis.soils.wetlandsPresent
        ? `Wetlands were detected${
            gis.soils.wetlandTypes.length > 0 ? `: ${gis.soils.wetlandTypes.join(', ')}` : ''
          }.`
        : 'No wetlands were detected in the available GIS result.',
    });

    if (closestProtectedArea) {
      insightItems.push({
        title: 'Nearby protected area',
        detail: `${closestProtectedArea.name} is ${
          closestProtectedArea.distanceMiles?.toFixed(2) ?? '—'
        } miles away.`,
      });
    }
  }

  if (!federalRulesLoading && !federalRulesError) {
    insightItems.push({
      title: 'Federal requirement coverage',
      detail: `${federalRequirementRows.length} applicable federal requirement${
        federalRequirementRows.length === 1 ? '' : 's'
      } are available for this ${mappedPropertyType} project.`,
    });
  }

  if (!jurisdictionLinksLoading && !jurisdictionLinksError) {
    insightItems.push({
      title: 'Jurisdiction resources',
      detail: `${stateLinks.length} state resource${stateLinks.length === 1 ? '' : 's'} and ${
        nationalLinks.length
      } national resource${nationalLinks.length === 1 ? '' : 's'} are available.`,
    });
  }

  if (warningsCount > 0) {
    insightItems.push({
      title: 'Items to review',
      detail: `${warningsCount} site / requirements warning${warningsCount === 1 ? '' : 's'} ${
        warningsCount === 1 ? 'is' : 'are'
      } currently surfaced for review.`,
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="h-dvh w-screen max-w-none overflow-y-auto overflow-x-hidden border-0 p-0 sm:max-w-none [&>button]:right-5 [&>button]:top-5 [&>button]:flex [&>button]:h-11 [&>button]:w-11 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-xl [&>button]:border [&>button]:border-border [&>button]:bg-background [&>button]:opacity-100 [&>button]:shadow-md [&>button]:transition-all [&>button]:duration-200 hover:[&>button]:border-primary/40 hover:[&>button]:bg-accent hover:[&>button]:shadow-lg [&>button>svg]:h-5 [&>button>svg]:w-5"
      >
        <div className="mx-auto w-full min-w-0 max-w-[1800px] space-y-6 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <SheetHeader className="pr-16">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <div className="min-w-0">
                <SheetTitle className="truncate text-2xl" title={project.project_name}>
                  {project.project_name}
                </SheetTitle>
                <SheetDescription className="mt-1">
                  {project.client_name}
                  {project.site_address ? ` · ${project.site_address}` : ''}
                </SheetDescription>
              </div>
              <Badge
                variant={getStatusBadgeVariant(project.status)}
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold tracking-wide shadow-sm ring-1 ring-border/60"
              >
                {getStatusLabel(project.status)}
              </Badge>
            </div>
          </SheetHeader>

          {isProcessing ? (
            <div className="flex min-h-[calc(100dvh-10rem)] items-center justify-center">
              <div
                className="flex flex-col items-center rounded-3xl border border-border/70 bg-card/95 px-12 py-10 text-center shadow-xl shadow-primary/10"
                role="status"
                aria-live="polite"
              >
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10" />
                  <div className="absolute inset-2 rounded-full border border-primary/20 bg-background shadow-inner" />
                  <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
                </div>
                <p className="mt-6 text-lg font-semibold text-foreground">Preparing project results</p>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Analyzing the blueprint and assembling the project information.
                </p>
                <div className="mt-5 flex items-center gap-1.5" aria-hidden="true">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:-300ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:-150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
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

          <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)]">
            <div className="min-w-0 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5" />
                    3D Model and Blueprint Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {results?.model_3d_url ? (
                    <Model3DViewer
                      modelUrl={results.model_3d_url}
                      modelName={project.project_name}
                      blueprintPublicUrl={project.blueprint_public_url}
                      largeViewport
                    />
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

              <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-background via-background to-primary/[0.04] shadow-sm">

                <CardContent className="space-y-6 p-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className={`rounded-xl border p-4 ${suitabilityClasses(suitabilityScore)}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Site suitability</p>
                          <p className="mt-2 text-2xl font-semibold">
                            {suitabilityScore != null ? `${suitabilityScore}/10` : '—'}
                          </p>
                          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                            {siteSuitabilityNote}
                          </p>
                        </div>
                        <ShieldCheck className="h-7 w-7 text-emerald-600" />
                      </div>
                    </div>

                    <div className={`rounded-xl border p-4 ${floodRiskClasses(gis?.flood.riskLevel ?? 'UNKNOWN')}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide opacity-75">Flood risk</p>
                          <p className="mt-2 text-2xl font-semibold">
                            {gis ? titleCase(gis.flood.riskLevel) : '—'}
                          </p>
                          <p className="mt-2 text-[11px] leading-relaxed opacity-80">
                            {floodRiskNote}
                          </p>
                        </div>
                        <Waves className="h-7 w-7" />
                      </div>
                    </div>

                    <div className="rounded-xl border bg-background p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Federal rules</p>
                          <p className="mt-2 text-2xl font-semibold">
                            {federalRulesLoading ? '…' : federalRequirementRows.length}
                          </p>
                          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                            Applicable structured federal rule records for this property type; this is not a violation count.
                          </p>
                        </div>
                        <BookOpenCheck className="h-7 w-7 text-primary" />
                      </div>
                    </div>

                    <div className="rounded-xl border bg-background p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Jurisdiction resources</p>
                          <p className="mt-2 text-2xl font-semibold">
                            {jurisdictionLinksLoading ? '…' : jurisdictionResourceCount}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">State + national</p>
                          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                            Reference resources found for the resolved project location; these are not approvals or violations.
                          </p>
                        </div>
                        <Landmark className="h-7 w-7 text-violet-600" />
                      </div>
                    </div>

                    <div className="rounded-xl border bg-background p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Review signals</p>
                          <p className="mt-2 text-2xl font-semibold">{warningsCount}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">Site / requirement warnings</p>
                          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                            Explicit warnings currently surfaced for review; zero does not mean the project is fully compliant.
                          </p>
                        </div>
                        <Activity className="h-7 w-7 text-orange-600" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-background/80 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resolved jurisdiction context</p>
                        <p className="mt-1 font-medium">{localJurisdictionLabel}</p>
                        {complianceResults?.project.geocode_match_quality && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Location match: {titleCase(complianceResults.project.geocode_match_quality)}
                          </p>
                        )}
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          This confirms the city, county, and state used to determine the location-based GIS and regulatory resources for this project.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
                    <div className="rounded-xl border bg-background p-4">
                      <div className="mb-3">
                        <p className="font-medium">Site suitability</p>
                        <p className="text-xs text-muted-foreground">Current GIS-derived suitability score</p>
                      </div>
                      {gis ? (
                        <div className="relative h-[230px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                              cx="50%"
                              cy="50%"
                              innerRadius="68%"
                              outerRadius="100%"
                              barSize={18}
                              data={[{ name: 'Suitability', value: gis.suitability.score, fill: CHART_COLORS[4] }]}
                              startAngle={90}
                              endAngle={-270}
                            >
                              <PolarAngleAxis type="number" domain={[0, 10]} angleAxisId={0} tick={false} />
                              <RadialBar dataKey="value" background cornerRadius={10} />
                              <Tooltip formatter={(value) => [`${value}/10`, 'Suitability']} />
                            </RadialBarChart>
                          </ResponsiveContainer>
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-semibold">{gis.suitability.score}</span>
                            <span className="text-xs text-muted-foreground">out of 10</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-[230px] items-center justify-center text-sm text-muted-foreground">
                          No GIS suitability result available.
                        </div>
                      )}
                      <p className="mt-3 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                        Inference: {siteSuitabilityNote}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-background p-4">
                      <div className="mb-3">
                        <p className="font-medium">Environmental signals</p>
                        <p className="text-xs text-muted-foreground">Counts surfaced by GIS and site analysis</p>
                      </div>
                      {gisSignalData.length > 0 ? (
                        <div className="h-[230px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={gisSignalData} layout="vertical" margin={{ left: 8, right: 16 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.25} />
                              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                              <YAxis
                                type="category"
                                dataKey="label"
                                width={100}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 11 }}
                              />
                              <Tooltip />
                              <Bar dataKey="count" name="Signals" fill={CHART_COLORS[0]} radius={[0, 6, 6, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex h-[230px] items-center justify-center text-sm text-muted-foreground">
                          No environmental signal data available.
                        </div>
                      )}
                      <p className="mt-3 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                        Inference: {gis
                          ? `${environmentalSignalTotal} total environmental/site signals are represented. Higher counts mean more factors were identified for review, not automatically higher overall risk.`
                          : 'Environmental signals will appear when GIS results are available.'}
                      </p>
                    </div>

                    <div className="rounded-xl border bg-background p-4">
                      <div className="mb-3">
                        <p className="font-medium">Requirements &amp; resource coverage</p>
                        <p className="text-xs text-muted-foreground">Available federal, state, national, and site information</p>
                      </div>
                      {requirementSourceData.length > 0 ? (
                        <div className="h-[230px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={requirementSourceData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="45%"
                                innerRadius={48}
                                outerRadius={78}
                                paddingAngle={3}
                              >
                                {requirementSourceData.map((entry, index) => (
                                  <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex h-[230px] items-center justify-center text-sm text-muted-foreground">
                          Requirement and jurisdiction data is not available yet.
                        </div>
                      )}
                      <p className="mt-3 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                        Inference: This shows where the available regulatory and site information comes from. It is a data-coverage breakdown, not a compliance percentage.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="rounded-xl border bg-background p-4">
                      <div className="mb-3">
                        <p className="font-medium">Federal requirement categories</p>
                        <p className="text-xs text-muted-foreground">Applicable requirements grouped by the stored category</p>
                      </div>
                      {federalCategoryData.length > 0 ? (
                        <div className="h-[220px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={federalCategoryData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                              <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                              <Tooltip />
                              <Bar dataKey="count" name="Requirements" fill={CHART_COLORS[1]} radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                          No federal requirement categories are available for this project type.
                        </div>
                      )}
                      <p className="mt-3 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                        Inference: This shows which federal requirement categories contain the most applicable rule records. Higher bars mean more applicable requirements in that category, not more violations.
                      </p>
                    </div>

                    <div className="rounded-xl border bg-background p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">Key project insights</p>
                          <p className="text-xs text-muted-foreground">Plain-language interpretation of the available project data</p>
                        </div>
                      </div>

                      {insightItems.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {insightItems.slice(0, 8).map((insight) => (
                            <div key={insight.title} className="rounded-lg border bg-muted/20 p-3">
                              <p className="text-sm font-medium">{insight.title}</p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{insight.detail}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">
                          Insights will appear when GIS and requirements data is available.
                        </div>
                      )}
                      <p className="mt-3 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                        Inference: These cards summarize the same available GIS and regulatory findings in plain language so the main project conditions can be reviewed quickly.
                      </p>
                    </div>
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

            <div className="min-w-0 space-y-6">
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
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};