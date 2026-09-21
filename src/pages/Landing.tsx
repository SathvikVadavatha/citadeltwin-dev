import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Upload,
  Boxes,
  Activity,
  Map,
  ShieldCheck,
  FileText,
  Users,
  Building2,
  Factory,
  Landmark,
  Home,
  CheckCircle2,
  Layers,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingFooter } from "@/components/landing/LandingFooter";
import heroImage from "@/assets/architectural-drafting-blueprint-brand.jpg";

// ------- Reusable motion primitives -------
const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const Reveal = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: "-80px" }}
    variants={fadeUp}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

// ------- Header -------
const Header = () => {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 80], ["hsla(var(--card) / 0)", "hsla(var(--card) / 0.85)"]);
  const border = useTransform(scrollY, [0, 80], ["hsla(var(--border) / 0)", "hsla(var(--border) / 1)"]);

  return (
    <motion.header
      style={{ background: bg, borderColor: border }}
      className="fixed top-0 inset-x-0 z-50 border-b backdrop-blur-md"
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={"/citadeltwin-logo.png"} alt="CitadelTwin" className="h-[66px] w-auto max-w-[13.5rem] object-contain" />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#capabilities" className="hover:text-foreground transition-colors">Capabilities</a>
          <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
          <a href="#industries" className="hover:text-foreground transition-colors">Industries</a>
          <a href="#security" className="hover:text-foreground transition-colors">Security</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth/login">
            <Button variant="ghost" size="sm" className="text-foreground">Sign in</Button>
          </Link>
          <Link to="/auth/login">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 skeuo-button-primary">
              Get started <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
};

// ------- Structural analysis hero visual -------
const BlueprintMock = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative w-full [perspective:1200px]">
      <motion.div
        className="relative aspect-[3/2] w-full overflow-hidden rounded-xl skeuo-card [transform-style:preserve-3d]"
        animate={reduceMotion ? undefined : { rotateY: [-3, 3, -3], rotateX: [1, -1, 1] }}
        transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
      >
        <img
          src={heroImage}
          alt="Architectural blueprint transitioning into a detailed 3D building model"
          className="h-full w-full object-cover object-[15%_center]"
        />
      </motion.div>
    </div>
  );
};

// ------- Hero -------
const Hero = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section ref={ref} className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 skeuo-drafting-grid opacity-60" aria-hidden />
      <motion.div
        aria-hidden
        className="absolute -top-40 -right-20 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, hsl(21 90% 48% / 0.22), transparent)",
          y,
        }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-40 -left-20 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, hsl(215 30% 40% / 0.20), transparent)",
        }}
      />

      <div className="container relative mx-auto px-6 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 skeuo-badge mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-muted-foreground">Now in public beta · AEC digital twins</span>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight text-foreground"
          >
            From blueprint to{" "}
            <span className="relative inline-block">
              <span className="relative z-10">digital twin</span>
              <motion.span
                aria-hidden
                className="absolute inset-x-0 -bottom-1 h-3 bg-accent/30 rounded-sm"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
            <br />
            in under ten minutes.
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
            CitadelTwin parses your CAD, BIM, and PDF plans into parametric 3D models,
            runs real-time FEA, checks code compliance for your jurisdiction, and exports
            full permit packages — all in one platform built for civil engineering teams.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth/login">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 skeuo-button-primary">
                Start free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#capabilities">
              <Button size="lg" variant="outline" className="border-border">
                Explore the platform
              </Button>
            </a>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> SOC 2 ready</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> SSO + 2FA</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> IFC · DWG · DXF · PDF</span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        >
          <BlueprintMock />
        </motion.div>
      </div>
    </section>
  );
};

// ------- Trust strip -------
const TrustStrip = () => (
  <Reveal className="border-y border-border bg-card/50">
    <div className="container mx-auto px-6 py-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
      <span>Trusted by AEC teams building for</span>
      <span className="font-semibold text-foreground/70">Residential</span>
      <span className="font-semibold text-foreground/70">Commercial</span>
      <span className="font-semibold text-foreground/70">Industrial</span>
      <span className="font-semibold text-foreground/70">Infrastructure</span>
      <span className="font-semibold text-foreground/70">Municipal</span>
    </div>
  </Reveal>
);

// ------- Capabilities (bento) -------
const capabilities = [
  { icon: Upload, title: "Intelligent ingestion", body: "DWG, DXF, IFC, vector + raster PDFs. OCR + ML semantically tags walls, openings, MEP, and dimensions." },
  { icon: Boxes, title: "Parametric 3D twin", body: "Auto-generated BIM with editable elements, materials, and graph-backed relationships." },
  { icon: Activity, title: "Real-time FEA", body: "Embedded solver returns stress, deflection, and pass/fail under five seconds per edit." },
  { icon: Map, title: "GIS + zoning context", body: "Parcels, roads, and utilities overlaid on the model with versioned municipal data." },
  { icon: ShieldCheck, title: "Compliance engine", body: "IBC, NEC, ADA and local zoning checks with deep links to the exact code clause." },
  { icon: FileText, title: "Permit-ready exports", body: "DWG, IFC, structural calcs, PDF/DOCX narratives, and full permit packages in one click." },
];

const Capabilities = () => (
  <section id="capabilities" className="py-24 lg:py-32">
    <div className="container mx-auto px-6">
      <Reveal className="max-w-2xl mb-16">
        <span className="skeuo-badge text-muted-foreground">Capabilities</span>
        <h2 className="mt-4 text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
          One platform for every step from plan to permit.
        </h2>
        <p className="mt-4 text-muted-foreground text-lg">
          The disconnected stack of CAD viewers, FEA packages, GIS portals, and manual
          document assemblers — unified into a single intelligent workspace.
        </p>
      </Reveal>

      <motion.div
        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
        variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {capabilities.map(({ icon: Icon, title, body }, i) => (
          <motion.div
            key={title} variants={fadeUp}
            whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className={`skeuo-card p-6 group ${i === 0 ? "lg:row-span-1" : ""}`}
          >
            <div className="h-11 w-11 rounded-md bg-accent/12 text-accent flex items-center justify-center mb-5 transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

// ------- Workflow -------
const steps = [
  { n: "01", title: "Upload your plans", body: "Drop a DWG, IFC, or scanned PDF. We normalize scale, OCR annotations, and detect semantic elements." },
  { n: "02", title: "Generate the twin", body: "A parametric BIM model assembles automatically — walls, openings, MEP routing, materials." },
  { n: "03", title: "Edit with confidence", body: "Move beams, swap materials, adjust spans. FEA validates structural integrity in real time." },
  { n: "04", title: "Ship the package", body: "Export DWG/IFC, structural calcs, compliance reports, and a permit-ready PDF in one click." },
];

const Workflow = () => (
  <section id="workflow" className="py-24 lg:py-32 bg-card border-y border-border">
    <div className="container mx-auto px-6">
      <Reveal className="max-w-2xl mb-16">
        <span className="skeuo-badge text-muted-foreground">Workflow</span>
        <h2 className="mt-4 text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
          Four steps. Hours instead of weeks.
        </h2>
      </Reveal>
      <div className="relative grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* connector line on desktop */}
        <div aria-hidden className="hidden lg:block absolute left-0 right-0 top-9 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.08} className="relative">
            <div className="relative z-10 h-12 w-12 rounded-full bg-background border border-border flex items-center justify-center mb-5 skeuo-button">
              <span className="text-xs font-semibold text-accent">{s.n}</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

// ------- Industries -------
const industries = [
  { icon: Home, title: "Residential", body: "Remodels, additions, ADUs with residential code automation." },
  { icon: Building2, title: "Commercial", body: "Tenant fit-outs and mid-rise mixed-use with zoning checks." },
  { icon: Factory, title: "Industrial", body: "Warehouse retrofits and factory expansions with load FEA." },
  { icon: Landmark, title: "Infrastructure", body: "Bridges, roads, utility networks with GIS-grade context." },
];

const Industries = () => (
  <section id="industries" className="py-24 lg:py-32">
    <div className="container mx-auto px-6">
      <Reveal className="max-w-2xl mb-16">
        <span className="skeuo-badge text-muted-foreground">Built for every scale</span>
        <h2 className="mt-4 text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
          From a single-family addition to a metro-scale utility network.
        </h2>
      </Reveal>
      <motion.div
        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
        variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {industries.map(({ icon: Icon, title, body }) => (
          <motion.div
            key={title} variants={fadeUp} whileHover={{ y: -4 }}
            className="skeuo-card p-6 relative overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/8 blur-2xl" aria-hidden />
            <Icon className="h-7 w-7 text-accent mb-4" />
            <h3 className="font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

// ------- Outcomes / Stats -------
const Outcomes = () => {
  const stats = [
    { v: "10 min", l: "Average blueprint-to-twin parse time" },
    { v: "< 5 s", l: "FEA feedback per editing operation" },
    { v: "98%", l: "Code-violation detection accuracy" },
    { v: "15+", l: "U.S. metros covered at launch" },
  ];
  return (
    <section className="py-24 bg-card border-y border-border">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-center">
          <Reveal>
            <span className="skeuo-badge text-muted-foreground">Outcomes</span>
            <h2 className="mt-4 text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
              Measurable wins on every project.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Stop juggling six tools, ten file formats, and endless code lookups.
              Teams using CitadelTwin ship permit packages in a single afternoon.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Cut document assembly from days to minutes",
                "Validate structural edits without leaving the model",
                "Catch zoning violations before they hit review",
                "Collaborate live with architects and reviewers",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-foreground/90">
                  <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 gap-4"
          >
            {stats.map((s) => (
              <motion.div key={s.l} variants={fadeUp} className="skeuo-card p-6">
                <div className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">{s.v}</div>
                <div className="mt-2 text-xs text-muted-foreground leading-snug">{s.l}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ------- Testimonials -------
const Testimonials = () => {
  const quotes = [
    {
      q: "We compressed our permit-package workflow from three days to one afternoon. The FEA loop is the difference-maker.",
      a: "Lead Structural Engineer", c: "Mid-size AEC firm",
    },
    {
      q: "Code compliance used to mean a binder and a magnifying glass. Now violations surface as I draw.",
      a: "Principal Architect", c: "Residential design studio",
    },
    {
      q: "GIS overlays plus parametric BIM in one place — this is the cockpit our municipal team has been waiting for.",
      a: "City Planning Director", c: "Mid-Atlantic metro",
    },
  ];
  return (
    <section className="py-24 lg:py-32">
      <div className="container mx-auto px-6">
        <Reveal className="max-w-2xl mb-12">
          <span className="skeuo-badge text-muted-foreground">Voices from the field</span>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
            What civil engineers are saying.
          </h2>
        </Reveal>
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
          variants={stagger} className="grid md:grid-cols-3 gap-5"
        >
          {quotes.map((q, i) => (
            <motion.figure key={i} variants={fadeUp} className="skeuo-card p-6 flex flex-col">
              <Layers className="h-5 w-5 text-accent mb-4" />
              <blockquote className="text-foreground/90 leading-relaxed text-[15px]">"{q.q}"</blockquote>
              <figcaption className="mt-6 pt-4 border-t border-border text-xs">
                <div className="font-semibold text-foreground">{q.a}</div>
                <div className="text-muted-foreground">{q.c}</div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// ------- Security -------
const Security = () => (
  <section id="security" className="py-24 bg-card border-y border-border">
    <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
      <Reveal>
        <span className="skeuo-badge text-muted-foreground">Enterprise security</span>
        <h2 className="mt-4 text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
          Your drawings are protected at every layer.
        </h2>
        <p className="mt-4 text-muted-foreground text-lg">
          End-to-end TLS, AES-256 at rest, SSO + 2FA, role-based access control, and
          SOC 2 Type II readiness — built on a hardened Supabase auth stack.
        </p>
      </Reveal>
      <motion.div
        initial="hidden" whileInView="show" viewport={{ once: true }}
        variants={stagger} className="grid sm:grid-cols-2 gap-4"
      >
        {[
          { icon: ShieldCheck, t: "SOC 2 Type II ready", d: "Audited security controls across the stack." },
          { icon: Users, t: "SSO + RBAC", d: "OAuth, SAML, and granular project permissions." },
          { icon: Gauge, t: "99.9% uptime SLA", d: "Resilient mesh with circuit breakers + replicas." },
          { icon: FileText, t: "GDPR conscious", d: "Data minimization and rights workflows built in." },
        ].map(({ icon: Icon, t, d }) => (
          <motion.div key={t} variants={fadeUp} className="skeuo-card p-5">
            <Icon className="h-5 w-5 text-accent mb-3" />
            <div className="font-semibold text-foreground text-sm">{t}</div>
            <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{d}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

// ------- Final CTA -------
const FinalCTA = () => (
  <section className="py-24 lg:py-32 relative overflow-hidden">
    <div className="absolute inset-0 skeuo-drafting-grid opacity-40" aria-hidden />
    <motion.div
      aria-hidden
      className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-96 blur-3xl"
      style={{
        background:
          "radial-gradient(closest-side, hsl(21 90% 48% / 0.18), transparent), radial-gradient(closest-side at 80% 50%, hsl(215 30% 40% / 0.15), transparent)",
      }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />
    <div className="container relative mx-auto px-6">
      <Reveal className="max-w-3xl mx-auto text-center skeuo-card p-10 md:p-14">
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
          Ready to retire the binder?
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">
          Spin up your first digital twin in minutes. No credit card required for the beta.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link to="/auth/login">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 skeuo-button-primary">
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/auth/login">
            <Button size="lg" variant="outline" className="border-border">Sign in</Button>
          </Link>
        </div>
      </Reveal>
    </div>
  </section>
);

// ------- Page -------
const Landing = () => {
  useEffect(() => {
    document.title = "CitadelTwin — Blueprint to digital twin in 10 minutes";
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <Capabilities />
        <Workflow />
        <Industries />
        <Outcomes />
        <Testimonials />
        <Security />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;
