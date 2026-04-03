
import React, { useMemo, useState } from 'react';
import { RefactoredMultiJurisdictionComplianceEngine } from '@/components/compliance/RefactoredMultiJurisdictionComplianceEngine';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertCircle, ChevronDown, ChevronRight, ExternalLink, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComplianceTemplateKey } from '@/types/complianceTemplate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

type ComplianceItem = {
  code: string;
  requirement: string;
  detail: string;
};

type ComplianceCategory = {
  name: string;
  icon: string;
  items: ComplianceItem[];
};

type ComplianceJurisdiction = {
  name: string;
  type: string;
  codeReference: string;
  lastUpdated: string;
  specialRequirements: string[];
  categories: ComplianceCategory[];
};

const COMPLIANCE_DATA: Record<ComplianceTemplateKey, ComplianceJurisdiction> = {
  ohio: {
    name: 'Ohio',
    type: 'state',
    codeReference: 'OBC 4101:1 | RCO 4101:8 | OFC 1301:7',
    lastUpdated: '2024',
    specialRequirements: ['Snow Load', 'Frost Depth', 'Energy Code'],
    categories: [
      {
        name: 'Structural',
        icon: '🏗️',
        items: [
          { code: 'OBC 4101:1', requirement: 'Snow Load', detail: '25-30 psf ground snow load minimum' },
          { code: 'OBC 4101:1', requirement: 'Frost Depth', detail: '36 inches minimum foundation depth' },
          { code: 'OBC 4101:1', requirement: 'Wind Speed', detail: '90 mph basic design wind speed' },
          { code: 'OBC 4101:1', requirement: 'Seismic', detail: 'Design Category A/B — low seismic risk' },
        ],
      },
      {
        name: 'Energy',
        icon: '⚡',
        items: [
          { code: 'IECC 2021', requirement: 'Energy Code', detail: 'ASHRAE 90.1 / IECC 2021 compliance required' },
          { code: 'Title 24', requirement: 'Insulation', detail: 'Minimum R-49 roof, R-20 walls for climate zone 5' },
          { code: 'OBC 4101:1', requirement: 'Radon Mitigation', detail: 'Required in Zone 1 areas — most of Ohio' },
        ],
      },
      {
        name: 'Fire Safety',
        icon: '🔥',
        items: [
          { code: 'OFC 1301:7', requirement: 'Sprinklers', detail: 'Required in buildings over 5,000 sq ft' },
          { code: 'OFC 1301:7', requirement: 'Fire Code', detail: 'Ohio Fire Code Division of State Fire Marshal' },
        ],
      },
      {
        name: 'Accessibility',
        icon: '♿',
        items: [
          { code: 'ORC 4112', requirement: 'ADA Compliance', detail: 'ADA plus Ohio Civil Rights Commission requirements' },
        ],
      },
      {
        name: 'Mechanical & Plumbing',
        icon: '🔧',
        items: [
          { code: 'OBC 4101:2', requirement: 'Mechanical Code', detail: 'Ohio Mechanical Code compliance required' },
          { code: 'OBC 4101:3', requirement: 'Plumbing Code', detail: 'Ohio Plumbing Code compliance required' },
        ],
      },
      {
        name: 'Residential',
        icon: '🏠',
        items: [
          { code: 'RCO 4101:8', requirement: 'Residential Code', detail: 'Residential Code of Ohio applies to all one and two family dwellings' },
        ],
      },
    ],
  },
  florida: {
    name: 'Florida',
    type: 'state',
    codeReference: 'FBC 7th Edition | FBC Residential 7th Edition',
    lastUpdated: '2023',
    specialRequirements: ['Hurricane', 'Flood', 'Coastal'],
    categories: [
      {
        name: 'Wind and Hurricane',
        icon: '🌀',
        items: [
          { code: 'FBC 7th', requirement: 'Hurricane Straps', detail: 'Required on all roof-to-wall connections' },
          { code: 'FBC 7th', requirement: 'Wind Speed', detail: '130-180 mph depending on location and risk category' },
          { code: 'FBC 7th', requirement: 'Impact Glazing', detail: 'Impact resistant glazing required within 1 mile of coast or high wind zones' },
          { code: 'FBC HVHZ', requirement: 'HVHZ Requirements', detail: 'High velocity hurricane zone requirements in Miami-Dade and Broward counties' },
        ],
      },
      {
        name: 'Flood and Coastal',
        icon: '🌊',
        items: [
          { code: 'FEMA NFIP', requirement: 'Flood Zone', detail: 'FEMA flood zone compliance required — freeboard minimum 1 ft above BFE' },
          { code: 'FBC 7th', requirement: 'Coastal Construction', detail: 'CCCL setback requirements for coastal properties' },
          { code: 'FBC 7th', requirement: 'Slab Foundation', detail: 'Minimum 12 inches above grade in flood zones' },
        ],
      },
      {
        name: 'Energy',
        icon: '⚡',
        items: [
          { code: 'FEEC', requirement: 'Energy Code', detail: 'Florida Energy Efficiency Code — stricter than base IECC' },
          { code: 'FBC 7th', requirement: 'Moisture Control', detail: 'Vapor barrier and drainage requirements due to humidity' },
        ],
      },
      {
        name: 'Materials',
        icon: '🧱',
        items: [
          { code: 'FBC 7th', requirement: 'Roof Covering', detail: 'High wind rated roof covering required statewide' },
          { code: 'FBC 7th', requirement: 'Termite Protection', detail: 'Required treatment for all wood framing' },
        ],
      },
      {
        name: 'Accessibility',
        icon: '♿',
        items: [
          { code: 'FAC', requirement: 'Florida Accessibility Code', detail: 'Mirrors ADA with Florida state amendments' },
        ],
      },
    ],
  },
  nyc: {
    name: 'New York City',
    type: 'city',
    codeReference: 'NYC Building Code 2022 | NYC FC | Local Laws',
    lastUpdated: '2022',
    specialRequirements: ['Fire Safety', 'Egress', 'High-Rise'],
    categories: [
      {
        name: 'Fire Safety',
        icon: '🔥',
        items: [
          { code: 'Local Law 26', requirement: 'Sprinklers', detail: 'Required in ALL new buildings — no exceptions' },
          { code: 'NYC BC Ch.10', requirement: 'Egress', detail: 'Minimum 2 means of egress required for all occupancies' },
          { code: 'NYC BC', requirement: 'High Rise', detail: 'Buildings over 75 ft require additional fire safety systems' },
        ],
      },
      {
        name: 'Energy and Environment',
        icon: '⚡',
        items: [
          { code: 'NYCECC', requirement: 'Energy Code', detail: 'NYC Energy Conservation Code — most stringent in US' },
          { code: 'Local Law 97', requirement: 'Carbon Emissions', detail: 'Emissions limits for buildings over 25,000 sq ft — fines for non-compliance' },
        ],
      },
      {
        name: 'Facade and Maintenance',
        icon: '🏢',
        items: [
          { code: 'Local Law 11', requirement: 'Facade Inspection', detail: 'FISP required every 5 years for buildings over 6 stories' },
          { code: 'NYC BC', requirement: 'Facade Repair', detail: 'Unsafe facade conditions must be remediated immediately' },
        ],
      },
      {
        name: 'Zoning',
        icon: '📋',
        items: [
          { code: 'ZR', requirement: 'FAR Compliance', detail: 'Floor Area Ratio compliance required per NYC Zoning Resolution' },
          { code: 'NYC BC', requirement: 'Seismic', detail: 'Design Category B — moderate seismic consideration required' },
        ],
      },
      {
        name: 'Accessibility',
        icon: '♿',
        items: [
          { code: 'NYC BC Ch.11', requirement: 'Accessibility', detail: 'Exceeds federal ADA requirements — applies to all occupancies' },
        ],
      },
      {
        name: 'Mechanical and Plumbing',
        icon: '🔧',
        items: [
          { code: 'NYC MC', requirement: 'Mechanical Code', detail: 'Ventilation requirements stricter than base IBC' },
          { code: 'NYC PC', requirement: 'Plumbing Code', detail: 'NYC Plumbing Code with local amendments' },
        ],
      },
    ],
  },
  california: {
    name: 'California',
    type: 'state',
    codeReference: 'CBC 2022 | Title 24 | CalGreen',
    lastUpdated: '2022',
    specialRequirements: ['Seismic', 'Title 24', 'Accessibility'],
    categories: [
      {
        name: 'Seismic',
        icon: '🌍',
        items: [
          { code: 'CBC 2022', requirement: 'Seismic Zone 4', detail: 'Highest seismic risk in US — special moment frames required' },
          { code: 'CBC 2022', requirement: 'Foundation', detail: 'Geotechnical report required for all projects in seismic zones' },
          { code: 'CBC 2022', requirement: 'Wind', detail: '85-110 mph depending on location — coastal areas higher' },
        ],
      },
      {
        name: 'Energy — Title 24',
        icon: '⚡',
        items: [
          { code: 'Title 24 Part 6', requirement: 'Energy Code', detail: 'Most comprehensive energy code in US — mandatory compliance' },
          { code: 'Title 24', requirement: 'Cool Roof', detail: 'Minimum solar reflectance 0.20 required on all roofs' },
          { code: 'Title 24', requirement: 'EV Charging', detail: 'EV ready conduit required in all new parking structures' },
          { code: 'Title 24', requirement: 'Solar Ready', detail: 'Solar zone required on all new low rise residential buildings' },
        ],
      },
      {
        name: 'Green Building — CalGreen',
        icon: '🌿',
        items: [
          { code: 'CALGreen', requirement: 'Mandatory Green', detail: 'CALGreen mandatory for all new construction statewide' },
          { code: 'CALGreen 4.303', requirement: 'Water Conservation', detail: 'Low flow fixtures mandatory in all new buildings' },
        ],
      },
      {
        name: 'Fire Safety',
        icon: '🔥',
        items: [
          { code: 'CBC R-13', requirement: 'Residential Sprinklers', detail: 'Sprinklers required in all new single family homes' },
          { code: 'PRC 4290', requirement: 'Wildfire', detail: 'Defensible space 100 ft required in State Responsibility Areas' },
        ],
      },
      {
        name: 'Accessibility',
        icon: '♿',
        items: [
          { code: 'CBC Ch.11B', requirement: 'Accessibility', detail: 'Exceeds ADA — applies to all occupancies including residential' },
        ],
      },
    ],
  },
  texas: {
    name: 'Texas',
    type: 'state',
    codeReference: 'IBC 2021 | IRC 2021 | Local Amendments',
    lastUpdated: '2021',
    specialRequirements: ['Wind Load', 'Flood', 'Energy'],
    categories: [
      {
        name: 'Wind and Storm',
        icon: '🌪️',
        items: [
          { code: 'IBC 2021', requirement: 'Wind Load', detail: '90-130 mph inland — coastal Gulf Coast areas up to 150 mph' },
          { code: 'IBC 2021', requirement: 'Wind Driven Rain', detail: 'Coastal areas require special flashing and water resistive barriers' },
          { code: 'IBC 2021', requirement: 'Hail', detail: 'Impact resistant roofing recommended in north Texas hail corridor' },
        ],
      },
      {
        name: 'Foundation',
        icon: '🏗️',
        items: [
          { code: 'IBC 2021', requirement: 'Expansive Soils', detail: 'Expansive clay soils common — post-tension slab often required' },
          { code: 'FEMA NFIP', requirement: 'Flood', detail: 'FEMA NFIP compliance required — significant flood plain areas statewide' },
        ],
      },
      {
        name: 'Energy',
        icon: '⚡',
        items: [
          { code: 'IECC 2021', requirement: 'Energy Code', detail: 'Texas adopts IECC 2021 with local amendments' },
          { code: 'ACCA Manual J', requirement: 'HVAC', detail: 'Manual J load calculations required for all new construction' },
        ],
      },
      {
        name: 'Local Code Notes',
        icon: '📋',
        items: [
          { code: 'State', requirement: 'No Statewide Code', detail: 'Texas has no single statewide building code — each city adopts its own' },
          { code: 'Houston', requirement: 'No Zoning', detail: 'Houston has no zoning ordinance — deed restrictions apply instead' },
          { code: 'IBC 2021', requirement: 'Dallas/Austin/San Antonio', detail: 'Each city adopts IBC with local amendments — verify with local authority' },
        ],
      },
      {
        name: 'Seismic and Accessibility',
        icon: '⚖️',
        items: [
          { code: 'IBC 2021', requirement: 'Seismic', detail: 'Low risk — Design Category A in most areas' },
          { code: 'ADA', requirement: 'Accessibility', detail: 'Federal ADA compliance — no additional state amendments' },
        ],
      },
    ],
  },
};

const JURISDICTION_FLAG_EMOJI: Record<ComplianceTemplateKey, string> = {
  ohio: '🏛️',
  florida: '🌴',
  nyc: '🗽',
  california: '🌁',
  texas: '⭐',
};

const OFFICIAL_CODE_URLS: Record<ComplianceTemplateKey, string> = {
  ohio: 'https://codes.ohio.gov',
  florida: 'https://floridabuilding.org',
  nyc: 'https://nyc.gov/buildings',
  california: 'https://www.dgs.ca.gov/BSC',
  texas: 'https://www.tdlr.texas.gov',
};

function getSpecialRequirementBadgeClass(label: string): string {
  const n = label.toLowerCase();
  if (/snow|frost/.test(n)) return 'border-blue-300 bg-blue-100 text-blue-900';
  if (/hurricane|wind|storm/.test(n)) return 'border-orange-300 bg-orange-100 text-orange-900';
  if (/flood|coastal/.test(n)) return 'border-teal-300 bg-teal-100 text-teal-900';
  if (/seismic/.test(n)) return 'border-red-300 bg-red-100 text-red-900';
  if (/energy|title\s*24/.test(n)) return 'border-green-300 bg-green-100 text-green-900';
  if (/fire|egress|high-rise|high rise/.test(n)) return 'border-red-300 bg-red-100 text-red-900';
  if (/access/.test(n)) return 'border-purple-300 bg-purple-100 text-purple-900';
  return 'border-slate-300 bg-slate-100 text-slate-800';
}

function filterCategories(data: ComplianceJurisdiction, query: string): ComplianceCategory[] {
  const q = query.trim().toLowerCase();
  if (!q) return data.categories;
  return data.categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          cat.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.requirement.toLowerCase().includes(q) ||
          item.detail.toLowerCase().includes(q)
      ),
    }))
    .filter((cat) => cat.items.length > 0);
}

interface EcfrSearchResult {
  title: string;
  headings?: {
    title?: string;
    part?: string;
    section?: string;
  };
  hierarchy_headings?: {
    section?: string;
    part?: string;
  };
  full_text_excerpt?: string;
  effective_date?: string;
  latest_amended_on?: string;
  last_updated?: string;
}

interface EcfrSearchResponse {
  results: EcfrSearchResult[];
  meta?: {
    total_count?: number;
  };
}

interface ParsedRegulationText {
  sectionHeading: string;
  body: string;
}

interface StructureNode {
  identifier: string;
  label: string;
  type: string;
  children: StructureNode[];
}

const QUICK_QUERIES: Array<{ label: string; query: string }> = [
  { label: 'Construction Safety', query: 'construction safety' },
  { label: 'Fire Safety', query: 'fire safety building' },
  { label: 'Egress Requirements', query: 'means of egress' },
  { label: 'Electrical Standards', query: 'electrical wiring construction' },
  { label: 'Structural Requirements', query: 'structural loads foundation' },
  { label: 'Hazardous Materials', query: 'hazardous materials storage' },
  { label: 'Accessibility ADA', query: 'accessibility disabled persons' },
  { label: 'Energy Codes', query: 'energy conservation building' },
];

const API_ERROR_MESSAGE = 'Unable to load regulations. Please check your connection and try again.';

function getResultTitle(result: EcfrSearchResult): string {
  const titleNum = result.title || 'Unknown';
  const part = result.headings?.part ? ` Part ${result.headings.part}` : '';
  const section = result.headings?.section ? `.${result.headings.section}` : '';
  return `${titleNum} CFR${part}${section}`;
}

function getResultHeading(result: EcfrSearchResult): string {
  return (
    result.hierarchy_headings?.section ||
    result.headings?.section ||
    result.hierarchy_headings?.part ||
    result.headings?.part ||
    'Regulation text'
  );
}

function getLastUpdatedDisplay(result: EcfrSearchResult): string | null {
  const raw = result.latest_amended_on ?? result.effective_date ?? result.last_updated;
  if (raw == null) return null;
  const s = String(raw).trim();
  return s === '' ? null : s;
}

function getBadgeClass(result: EcfrSearchResult): string {
  const title = String(result.title || '');
  const part = String(result.headings?.part || '');
  if (title === '29' && part === '1926') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (title === '29' && part === '1910') return 'bg-green-100 text-green-800 border-green-200';
  if (title === '40') return 'bg-teal-100 text-teal-800 border-teal-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function normalizeStructureNode(raw: unknown): StructureNode | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const identifier = String(obj.identifier || obj.slug || obj.part || obj.section || '');
  const label = String(obj.label || obj.name || obj.title || identifier || 'Untitled');
  const type = String(obj.type || obj.level || 'node');
  const rawChildren = Array.isArray(obj.children) ? obj.children : [];
  const children = rawChildren
    .map((child) => normalizeStructureNode(child))
    .filter((child): child is StructureNode => Boolean(child));
  if (!identifier && !label) return null;
  return { identifier: identifier || label, label, type, children };
}

function extractTextBySection(xmlText: string, requestedSection?: string): ParsedRegulationText {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    return {
      sectionHeading: 'Full regulation text',
      body: xmlText,
    };
  }

  const sectionNodes = Array.from(doc.getElementsByTagName('SECTION'));
  if (sectionNodes.length === 0) {
    return {
      sectionHeading: 'Full regulation text',
      body: doc.documentElement?.textContent?.trim() || 'No regulation text found.',
    };
  }

  const normalizedRequested = (requestedSection || '').replace(/[^\d.]/g, '');
  const matched = sectionNodes.find((sectionNode) => {
    if (!normalizedRequested) return false;
    const sectNo = sectionNode.getElementsByTagName('SECTNO')[0]?.textContent || '';
    return sectNo.replace(/[^\d.]/g, '').includes(normalizedRequested);
  }) || sectionNodes[0];

  const sectNo = matched.getElementsByTagName('SECTNO')[0]?.textContent?.trim() || 'Section';
  const subject = matched.getElementsByTagName('SUBJECT')[0]?.textContent?.trim() || '';
  const heading = subject ? `${sectNo} — ${subject}` : sectNo;

  const paragraphNodes = Array.from(matched.getElementsByTagName('P'));
  const body = paragraphNodes.length > 0
    ? paragraphNodes
        .map((p) => `  ${p.textContent?.trim() || ''}`)
        .filter(Boolean)
        .join('\n\n')
    : (matched.textContent?.trim() || 'No regulation text found.');

  return {
    sectionHeading: heading,
    body,
  };
}

const StructureTreeItem: React.FC<{
  node: StructureNode;
  level: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (node: StructureNode) => void;
}> = ({ node, level, expandedIds, onToggle, onSelect }) => {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.identifier);
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1" style={{ marginLeft: `${level * 12}px` }}>
        {hasChildren ? (
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-accent"
            onClick={() => onToggle(node.identifier)}
            aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="inline-block h-6 w-6" />
        )}
        <button
          type="button"
          className="text-left text-sm hover:underline"
          onClick={() => onSelect(node)}
        >
          {node.label}
        </button>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <StructureTreeItem
              key={`${node.identifier}-${child.identifier}`}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Compliance: React.FC = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<ComplianceTemplateKey | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  const openTemplate = (key: ComplianceTemplateKey) => {
    setActiveKey(key);
    setFilterQuery('');
    setSheetOpen(true);
  };

  const activeData = activeKey ? COMPLIANCE_DATA[activeKey] : null;
  const filteredCategories = useMemo(
    () => (activeData ? filterCategories(activeData, filterQuery) : []),
    [activeData, filterQuery]
  );

  const [ecfrQuery, setEcfrQuery] = useState('');
  const [isEcfrSearching, setIsEcfrSearching] = useState(false);
  const [ecfrSearchError, setEcfrSearchError] = useState<string | null>(null);
  const [ecfrResults, setEcfrResults] = useState<EcfrSearchResult[]>([]);
  const [ecfrTotalCount, setEcfrTotalCount] = useState(0);

  const [ecfrActiveResultKey, setEcfrActiveResultKey] = useState<string | null>(null);
  const [ecfrFullTextLoadingKey, setEcfrFullTextLoadingKey] = useState<string | null>(null);
  const [ecfrFullTextErrorKey, setEcfrFullTextErrorKey] = useState<string | null>(null);
  const [ecfrFullTextByKey, setEcfrFullTextByKey] = useState<Record<string, ParsedRegulationText>>({});

  const [showEcfrStructure, setShowEcfrStructure] = useState(false);
  const [ecfrStructureLoading, setEcfrStructureLoading] = useState(false);
  const [ecfrStructureError, setEcfrStructureError] = useState<string | null>(null);
  const [ecfrStructureNodes, setEcfrStructureNodes] = useState<StructureNode[]>([]);
  const [ecfrExpandedIds, setEcfrExpandedIds] = useState<Set<string>>(new Set());

  const [selectedEcfrStructureText, setSelectedEcfrStructureText] = useState<ParsedRegulationText | null>(null);
  const [selectedEcfrStructureLoading, setSelectedEcfrStructureLoading] = useState(false);
  const [selectedEcfrStructureError, setSelectedEcfrStructureError] = useState<string | null>(null);

  const ecfrOshaNodes = useMemo(
    () => ecfrStructureNodes.filter((n) => /1910|1926/.test(`${n.identifier} ${n.label}`)),
    [ecfrStructureNodes]
  );

  const runEcfrSearch = async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;
    setEcfrQuery(trimmed);
    setIsEcfrSearching(true);
    setEcfrSearchError(null);
    setEcfrResults([]);
    setEcfrTotalCount(0);
    try {
      const searchUrl = new URL('https://www.ecfr.gov/api/search/v1/results');
      searchUrl.searchParams.set('query', trimmed);
      searchUrl.searchParams.set('per_page', '20');
      const response = await fetch(searchUrl.toString());
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const data = (await response.json()) as EcfrSearchResponse;
      setEcfrResults(Array.isArray(data.results) ? data.results : []);
      setEcfrTotalCount(data.meta?.total_count ?? 0);
    } catch {
      setEcfrSearchError(API_ERROR_MESSAGE);
    } finally {
      setIsEcfrSearching(false);
    }
  };

  const ecfrKeyForResult = (result: EcfrSearchResult, index: number): string =>
    `${result.title || 'unknown'}-${result.headings?.part || 'p'}-${result.headings?.section || 's'}-${index}`;

  const loadEcfrFullTextForTitle = async (title: string, sectionHint?: string): Promise<ParsedRegulationText> => {
    const response = await fetch(`https://www.ecfr.gov/api/versioner/v1/full/current/title-${title}.xml`);
    if (!response.ok) throw new Error(`Versioner failed: ${response.status}`);
    const xml = await response.text();
    return extractTextBySection(xml, sectionHint);
  };

  const handleEcfrViewFullRegulation = async (result: EcfrSearchResult, index: number) => {
    const key = ecfrKeyForResult(result, index);
    if (ecfrActiveResultKey === key) {
      setEcfrActiveResultKey(null);
      return;
    }
    setEcfrActiveResultKey(key);
    setEcfrFullTextErrorKey(null);
    if (ecfrFullTextByKey[key]) return;
    setEcfrFullTextLoadingKey(key);
    try {
      const parsed = await loadEcfrFullTextForTitle(result.title, result.headings?.section);
      setEcfrFullTextByKey((prev) => ({ ...prev, [key]: parsed }));
    } catch {
      setEcfrFullTextErrorKey(key);
    } finally {
      setEcfrFullTextLoadingKey(null);
    }
  };

  const loadEcfrStructure = async () => {
    setEcfrStructureLoading(true);
    setEcfrStructureError(null);
    try {
      const response = await fetch('https://www.ecfr.gov/api/versioner/v1/structure/current/title-29.json');
      if (!response.ok) throw new Error(`Structure failed: ${response.status}`);
      const raw = (await response.json()) as unknown;
      const rootCandidate = normalizeStructureNode(raw);
      const children = rootCandidate?.children ?? [];
      setEcfrStructureNodes(children);
      setEcfrExpandedIds(new Set(children.slice(0, 2).map((c) => c.identifier)));
    } catch {
      setEcfrStructureError(API_ERROR_MESSAGE);
    } finally {
      setEcfrStructureLoading(false);
    }
  };

  const toggleEcfrStructure = async () => {
    const next = !showEcfrStructure;
    setShowEcfrStructure(next);
    if (next && ecfrStructureNodes.length === 0 && !ecfrStructureLoading) {
      await loadEcfrStructure();
    }
  };

  const toggleEcfrExpanded = (id: string) => {
    setEcfrExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectEcfrStructureNode = async (node: StructureNode) => {
    const sectionHintMatch = node.identifier.match(/\d+\.\d+/);
    const sectionHint = sectionHintMatch?.[0];
    setSelectedEcfrStructureLoading(true);
    setSelectedEcfrStructureError(null);
    setSelectedEcfrStructureText(null);
    try {
      const parsed = await loadEcfrFullTextForTitle('29', sectionHint);
      setSelectedEcfrStructureText(parsed);
    } catch {
      setSelectedEcfrStructureError('Unable to load full regulation text. View on eCFR.gov directly.');
    } finally {
      setSelectedEcfrStructureLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <RefactoredMultiJurisdictionComplianceEngine onOpenComplianceTemplate={openTemplate} />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          {activeData && activeKey && (
            <>
              <SheetHeader>
                <SheetTitle className="flex flex-wrap items-center gap-2 text-left">
                  <span>{JURISDICTION_FLAG_EMOJI[activeKey]}</span>
                  <span>{activeData.name}</span>
                </SheetTitle>
                <SheetDescription className="text-left space-y-3 pt-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {activeData.codeReference}
                    </Badge>
                    <Badge variant="outline">Last updated: {activeData.lastUpdated}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeData.specialRequirements.map((spec) => (
                      <Badge
                        key={spec}
                        variant="outline"
                        className={cn('text-xs', getSpecialRequirementBadgeClass(spec))}
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </SheetDescription>
              </SheetHeader>

              <div className="py-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search requirements, codes, or details…"
                    className="pl-9"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3 py-4">
                {filteredCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items match your search.</p>
                ) : (
                  filteredCategories.map((category) => (
                    <Collapsible key={category.name} defaultOpen={false} className="group rounded-lg border border-border bg-card">
                      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left font-medium text-foreground hover:bg-muted/50">
                        <span className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          {category.name}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 px-3 pb-3">
                        {category.items.map((item, idx) => (
                          <div
                            key={`${category.name}-${item.code}-${idx}`}
                            className="rounded-md border border-border/80 bg-muted/30 p-3"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {item.code}
                              </Badge>
                            </div>
                            <p className="mt-2 font-semibold text-sm">{item.requirement}</p>
                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                )}
              </div>

              <SheetFooter className="flex-col items-stretch gap-3 sm:flex-col border-t pt-4">
                <p className="text-xs text-muted-foreground text-center">
                  This information is for reference only. Always verify with local authorities and a licensed
                  professional.
                </p>
                <Button variant="outline" className="w-full text-foreground hover:text-foreground" asChild>
                  <a href={OFFICIAL_CODE_URLS[activeKey]} target="_blank" rel="noopener noreferrer">
                    View Official Code
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Separator className="my-8" />

      <h2 className="text-xl font-bold mb-1">Federal Regulations</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Live federal regulations from eCFR (public API)
      </p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Search Regulations</CardTitle>
            <CardDescription>Search federal building and safety regulation content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex flex-col sm:flex-row gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void runEcfrSearch(ecfrQuery);
              }}
            >
              <Input
                value={ecfrQuery}
                onChange={(e) => setEcfrQuery(e.target.value)}
                placeholder='Try "fire safety", "means of egress", or "foundation"'
                className="flex-1"
              />
              <Button type="submit" disabled={isEcfrSearching || !ecfrQuery.trim()}>
                {isEcfrSearching ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Searching
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search
                  </span>
                )}
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              {QUICK_QUERIES.map((item) => (
                <Button
                  key={item.label}
                  variant="outline"
                  size="sm"
                  onClick={() => void runEcfrSearch(item.query)}
                  disabled={isEcfrSearching}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Results</h2>
            {ecfrTotalCount > 0 && <Badge variant="secondary">{ecfrTotalCount} matches</Badge>}
          </div>

          {isEcfrSearching && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {ecfrSearchError && (
            <Card className="border-destructive/40">
              <CardContent className="pt-6 text-destructive text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                {ecfrSearchError}
              </CardContent>
            </Card>
          )}

          {!isEcfrSearching && !ecfrSearchError && ecfrResults.length === 0 && ecfrQuery.trim() && (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No regulations found for this search. Try different keywords.
              </CardContent>
            </Card>
          )}

          {!isEcfrSearching &&
            !ecfrSearchError &&
            ecfrResults.map((result, index) => {
              const key = ecfrKeyForResult(result, index);
              const parsedText = ecfrFullTextByKey[key];
              const isOpen = ecfrActiveResultKey === key;
              const isLoadingText = ecfrFullTextLoadingKey === key;
              const hasTextError = ecfrFullTextErrorKey === key;
              const updatedAt = getLastUpdatedDisplay(result);
              return (
                <Card key={key}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getBadgeClass(result)}>
                        <span dangerouslySetInnerHTML={{ __html: getResultTitle(result) }} />
                      </Badge>
                      {updatedAt != null && (
                        <Badge variant="outline">Updated: {updatedAt}</Badge>
                      )}
                    </div>
                    <CardTitle className="text-base">
                      <span dangerouslySetInnerHTML={{ __html: getResultHeading(result) }} />
                    </CardTitle>
                    <CardDescription>
                      {result.full_text_excerpt ? (
                        <span dangerouslySetInnerHTML={{ __html: result.full_text_excerpt }} />
                      ) : (
                        'No excerpt available for this regulation entry.'
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" onClick={() => void handleEcfrViewFullRegulation(result, index)}>
                      {isOpen ? 'Hide Regulation Text' : 'View Full Regulation'}
                    </Button>

                    {isOpen && (
                      <div className="space-y-2">
                        {isLoadingText && (
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-28 w-full" />
                          </div>
                        )}
                        {hasTextError && (
                          <Card className="border-destructive/40">
                            <CardContent className="pt-6 text-sm text-destructive">
                              Unable to load full regulation text. View on eCFR.gov directly.{' '}
                              <a
                                href="https://www.ecfr.gov"
                                target="_blank"
                                rel="noreferrer"
                                className="underline inline-flex items-center gap-1"
                              >
                                Open eCFR <ExternalLink className="h-3 w-3" />
                              </a>
                            </CardContent>
                          </Card>
                        )}
                        {!isLoadingText && !hasTextError && parsedText && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">{parsedText.sectionHeading}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ScrollArea className="h-72 rounded border p-3">
                                <pre className="whitespace-pre-wrap text-sm leading-relaxed">{parsedText.body}</pre>
                              </ScrollArea>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => void toggleEcfrStructure()}
            >
              <div>
                <CardTitle>Browse OSHA Standards</CardTitle>
                <CardDescription>Title 29 structure browser (Part 1910 and Part 1926)</CardDescription>
              </div>
              {showEcfrStructure ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </CardHeader>
          {showEcfrStructure && (
            <CardContent className="space-y-4">
              {ecfrStructureLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}

              {ecfrStructureError && (
                <div className="text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  {ecfrStructureError}
                </div>
              )}

              {!ecfrStructureLoading && !ecfrStructureError && (
                <div className="space-y-2">
                  {(ecfrOshaNodes.length > 0 ? ecfrOshaNodes : ecfrStructureNodes).map((node) => (
                    <StructureTreeItem
                      key={node.identifier}
                      node={node}
                      level={0}
                      expandedIds={ecfrExpandedIds}
                      onToggle={toggleEcfrExpanded}
                      onSelect={(selected) => void handleSelectEcfrStructureNode(selected)}
                    />
                  ))}
                </div>
              )}

              {(selectedEcfrStructureLoading || selectedEcfrStructureError || selectedEcfrStructureText) && (
                <Separator />
              )}

              {selectedEcfrStructureLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-32 w-full" />
                </div>
              )}

              {selectedEcfrStructureError && (
                <div className="text-sm text-destructive">
                  {selectedEcfrStructureError}{' '}
                  <a href="https://www.ecfr.gov" target="_blank" rel="noreferrer" className="underline">
                    Open eCFR
                  </a>
                </div>
              )}

              {selectedEcfrStructureText && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{selectedEcfrStructureText.sectionHeading}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-72 rounded border p-3">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed">{selectedEcfrStructureText.body}</pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};
