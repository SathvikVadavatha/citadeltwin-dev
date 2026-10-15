/**
 * Hand-written knowledge base for the in-app navigation assistant.
 * Every entry below was verified against the live code (routes in src/App.tsx,
 * the component/hook it names, and — where noted — PROJECT_MAP.md's prior
 * verified trace) as of 2026-09-17. Do not add a claim here that hasn't been
 * confirmed in the code; the assistant is only allowed to state what's in
 * this file, so an unverified entry becomes a hallucination once it ships.
 */

export type FeatureStatus = 'working' | 'partial' | 'broken';

export interface KnowledgeEntry {
  id: string;
  title: string;
  route: string | null;
  status: FeatureStatus;
  summary: string;
  details?: string;
  caveats?: string;
  alternative?: string;
  keywords: string;
}

export const APP_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'upload-blueprints',
    title: 'Upload Blueprints',
    route: '/blueprints/upload',
    status: 'working',
    summary: 'Upload a 2D floor plan image or PDF. The app analyzes it and, once processed, can generate a 3D model from it.',
    details:
      'Drag a single file onto the upload box, or click to browse. Supported types: JPEG, PNG, GIF, and PDF (one file per upload). After upload, the file is analyzed automatically — no separate "start analysis" step is needed. Once analysis finishes, go to View Blueprints or Blueprint → 3D to generate the 3D model.',
    caveats: 'Only one file can be uploaded at a time.',
    keywords: 'upload blueprint floor plan file pdf image jpeg png import add new drawing',
  },
  {
    id: 'view-blueprints',
    title: 'View Blueprints',
    route: '/blueprints/view',
    status: 'working',
    summary: 'Lists every blueprint you have uploaded, with its processing status and a button to view or generate its 3D model.',
    details:
      'Each blueprint card shows a thumbnail, file size, upload date, and a status badge (uploaded / processing / processed). The action button on each card changes based on state: "View 3D Model" if a model already exists, "Generate 3D Model" if the blueprint is processed but has no model yet, "Regenerate 3D Model" if the existing model has expired (see the "why a model says expired" topic), "Generating…" while a model is being built, or a disabled button explaining why (still processing, or processing failed) when no action is available yet.',
    keywords: 'view blueprints list my blueprints uploaded files status 3d model button generate regenerate',
  },
  {
    id: 'blueprint-to-3d',
    title: 'Blueprint → 3D (3D Viewer & Generation)',
    route: '/blueprint-3d',
    status: 'partial',
    summary: 'Generates and displays a 3D model from an already-uploaded, processed blueprint.',
    details:
      'Reached either directly (to upload a fresh file) or via a "Generate/View/Regenerate 3D Model" link from View Blueprints, which passes the specific blueprint so it does not need to be re-uploaded. Generation runs a real detection pipeline (wall/door/window/room recognition) and can take a little while; you do not need to stay on the page — the status is saved and picked up again if you navigate away and come back.',
    caveats:
      'The underlying pipeline is real, not a demo, but is a genuinely different system from the general engineering AI features described elsewhere — it does not do code compliance or engineering calculations, only geometry generation.',
    keywords: '3d model generate blueprint 3d viewer regenerate model glb convert floor plan to 3d',
  },
  {
    id: 'site-requirements',
    title: 'Site & Federal Requirements',
    route: '/site-requirements',
    status: 'working',
    summary: 'Enter a project address to get seismic and flood hazard data plus a list of relevant federal (ADA/OSHA) rules and state/local code links.',
    details:
      'Enter an address, ZIP, and property type. The tool geocodes the address and looks up live seismic design data (USGS) and flood zone data (FEMA), then shows applicable federal ADA/OSHA rules and links to the correct state/local building department for that jurisdiction.',
    caveats:
      'This is a reference and lookup tool only — it does NOT determine whether a project is compliant, and it does not hold or evaluate the actual text of state or local building codes. Wind speed, ground snow load, and ice thickness are not yet included in the hazard results. Always verify with the linked local authority or a licensed professional.',
    keywords: 'site requirements address hazard seismic flood zone federal ada osha jurisdiction code lookup building department',
  },
  {
    id: 'compliance',
    title: 'Compliance (automated check)',
    route: '/compliance',
    status: 'broken',
    summary: 'The "Run Comprehensive Check" automated compliance analysis on this page is currently not working and will fail.',
    details:
      'The Compliance page also has a working eCFR federal-regulation search and a static per-state quick-reference sheet (structural/energy/fire/accessibility notes for Ohio, Florida, NYC, California, and Texas) — those parts do work. But the automated "Run Comprehensive Check" analysis feature errors out and should not be relied on.',
    caveats: 'Even when it runs, this feature only checks against a handful of generic seeded rules, not a real jurisdiction-specific code database.',
    alternative: 'site-requirements',
    keywords: 'compliance check building code run comprehensive check jurisdiction violation broken error',
  },
  {
    id: 'gis-analysis',
    title: 'GIS Analysis',
    route: '/gis',
    status: 'working',
    summary: 'Search an address or area on a map to see environmental and hazard layers (flood zones, protected/conservation land, soils, wetlands).',
    details: 'Uses live data from FEMA, USGS, USDA, and US Fish & Wildlife Service, rendered on a Google Maps view.',
    caveats:
      'If one of those external data sources is temporarily unavailable, this page can silently fall back to placeholder data for that layer without a clear warning — if a result looks suspicious, treat it with caution.',
    keywords: 'gis map address environmental hazard flood zone wetlands soils protected land',
  },
  {
    id: 'client-portal',
    title: 'Client Portal',
    route: '/client-portal',
    status: 'partial',
    summary: 'Track client projects end-to-end: add a project with an address and blueprint, and it automatically runs both GIS site analysis and 3D model generation.',
    details:
      'Add a project via "Add New Project" (name, client, address, building type, blueprint file). The app then runs GIS and 3D analysis in the background; open the project once processing completes to see the 3D model, room dimensions, and site risk summary, and to approve it.',
    caveats: 'The Compliance section of a project\'s results is a placeholder — it always shows "coming soon" and never produces a real analysis.',
    keywords: 'client portal project track add new project approve results',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    route: '/dashboard',
    status: 'working',
    summary: 'A tabbed workspace combining Upload, 3D View, BIM, Compliance, Documents, and GIS in one page.',
    details: 'Each tab reflects the same underlying feature reachable from the sidebar (e.g. its Compliance tab has the same limitations as the standalone Compliance page).',
    keywords: 'dashboard tabs upload 3d view bim compliance documents gis overview',
  },
  {
    id: 'documents',
    title: 'Documents',
    route: '/documents',
    status: 'broken',
    summary: 'Document generation on this page does not currently work — generated documents are never actually saved, so downloads will fail.',
    keywords: 'documents generate document export download report broken',
  },
  {
    id: 'bim',
    title: 'BIM Elements',
    route: null,
    status: 'partial',
    summary: 'A parametric BIM data model and IFC file viewer, found inside the Dashboard\'s "BIM" tab (there is no separate page for it).',
    details: 'You can import IFC files and inspect/edit structured building elements (walls, materials, constraints).',
    caveats: 'BIM data is not connected to the 3D model shown in Blueprint → 3D — editing a BIM element will not change the generated 3D model, and vice versa. They are two separate systems working from the same upload.',
    keywords: 'bim ifc elements materials import model building information',
  },
  {
    id: 'users',
    title: 'Users',
    route: '/users',
    status: 'working',
    summary: 'Admin page listing all users, with search/filter and (for admins) the ability to edit roles or deactivate accounts.',
    keywords: 'users admin manage accounts roles deactivate team members',
  },
  {
    id: 'settings',
    title: 'Settings',
    route: '/settings',
    status: 'working',
    summary: 'Your account settings: Profile, Security, Notifications, and System preferences, organized into tabs.',
    keywords: 'settings profile account preferences notifications security tab',
  },
  {
    id: 'security',
    title: 'Security Dashboard',
    route: '/security',
    status: 'partial',
    summary: 'Shows audit logs, security events, backup jobs, and related security metrics for the account.',
    caveats: 'The "Two-factor authentication enabled" indicator seen elsewhere in the app is decorative — this app does not currently have real multi-factor authentication.',
    keywords: 'security audit logs events backup encryption ip whitelist two-factor mfa',
  },
  {
    id: 'workflow-automation',
    title: 'Workflow Automation',
    route: '/workflow-automation',
    status: 'working',
    summary: 'Create and manage workflow templates and automated project setups for common building types.',
    keywords: 'workflow automation templates triggers automated setup building type',
  },
  {
    id: 'home',
    title: 'Home',
    route: '/home',
    status: 'working',
    summary: 'The landing page you see right after logging in — an overview/marketing page with no live data of its own.',
    keywords: 'home landing page after login start',
  },
  {
    id: 'login-auth',
    title: 'Login & Account Access',
    route: '/auth/login',
    status: 'working',
    summary: 'Sign in with email/password, or use Google/Azure/Okta single sign-on. Forgot-password and reset-password both work.',
    caveats: 'There is no real multi-factor authentication in this app yet, even though some screens display a "two-factor enabled" badge.',
    keywords: 'login sign in log in password forgot reset account oauth google sso',
  },
  {
    id: 'concept-processed-status',
    title: 'What "processed" means',
    route: null,
    status: 'working',
    summary: 'A blueprint status of "processed" only means the 2D image analysis (detecting walls, rooms, etc.) finished — it does NOT mean a 3D model has been generated yet.',
    details: 'You still need to click "Generate 3D Model" (from View Blueprints or Blueprint → 3D) to actually build the 3D model from a processed blueprint.',
    keywords: 'processed status meaning uploaded processing what does processed mean',
  },
  {
    id: 'concept-expired-model',
    title: 'Why a 3D model says "expired"',
    route: null,
    status: 'working',
    summary: 'Some older 3D models were generated before a fix that made them save permanently — those show as expired and need to be regenerated once to fix them for good.',
    details:
      'Before a recent fix, generated 3D models were only kept in your browser\'s temporary memory for that session, so they disappeared after a refresh or new visit. Clicking "Regenerate 3D Model" on that blueprint runs the pipeline again and saves the result properly this time — it only needs to be done once per affected blueprint.',
    keywords: 'expired model 3d model gone disappeared missing regenerate why blob url',
  },
  {
    id: 'concept-file-types',
    title: 'Supported blueprint file types',
    route: '/blueprints/upload',
    status: 'working',
    summary: 'Upload accepts JPEG, PNG, GIF images, or a PDF — one file per upload.',
    keywords: 'supported file types format pdf jpg png gif what files can I upload',
  },
  {
    id: 'concept-assistant-scope',
    title: 'What this assistant can help with',
    route: null,
    status: 'working',
    summary: 'This assistant only answers questions about using CitadelTwin itself — where features are, how to complete a task, what a status means, or a few questions about your own uploaded data.',
    caveats:
      'It does not answer engineering questions, give building code values or numbers, do structural calculations, or offer design advice — for those, consult a licensed professional or the Site & Federal Requirements page for reference links.',
    keywords: 'what can you do help assistant scope capabilities engineering advice calculations',
  },
  {
    id: 'task-blueprint-to-3d-e2e',
    title: 'How to get a 3D model from a floor plan',
    route: '/blueprints/upload',
    status: 'working',
    summary: 'End-to-end steps: 1) Upload Blueprints — upload your floor plan image or PDF and wait for it to finish processing. 2) View Blueprints — find your blueprint in the list; once its status shows processed, click "Generate 3D Model" on its card. 3) The 3D model opens in Blueprint → 3D once generation finishes.',
    keywords: 'how to make 3d model from floor plan steps convert generate walkthrough process',
  },
  {
    id: 'task-find-site-requirements-e2e',
    title: 'How to find requirements for an address',
    route: '/site-requirements',
    status: 'working',
    summary: 'Go to Site & Federal Requirements, enter the project address, ZIP, and property type, and submit. You\'ll get hazard data (seismic/flood) plus applicable federal rules and links to that jurisdiction\'s building department.',
    caveats: 'This gives reference information, not a compliance determination.',
    keywords: 'how to find requirements for address steps site requirements lookup walkthrough',
  },
];
