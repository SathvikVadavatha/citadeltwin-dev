import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, ExternalLink } from 'lucide-react';

const PLATFORM_LINKS = [
  { label: 'Upload Blueprint',    route: '/blueprints/upload' },
  { label: 'Blueprint → 3D',      route: '/blueprint-3d' },
  { label: 'GIS Analysis',        route: '/gis' },
  { label: 'Compliance',          route: '/compliance' },
  { label: 'Documents',           route: '/documents' },
  { label: 'Client Portal',       route: '/client-portal' },
];

const DATA_LINKS = [
  { label: 'FEMA NFHL',   href: 'https://msc.fema.gov/portal/home' },
  { label: 'USGS PAD-US', href: 'https://www.usgs.gov/programs/gap-analysis-project/science/pad-us-data-download' },
  { label: 'USFWS NWI',   href: 'https://www.fws.gov/program/national-wetlands-inventory' },
  { label: 'USDA SSURGO', href: 'https://www.nrcs.usda.gov/resources/data-and-reports/ssurgo' },
  { label: 'OpenFEMA',    href: 'https://www.fema.gov/about/openfema/data-sets' },
  { label: 'eCFR',        href: 'https://www.ecfr.gov' },
];

export function HomePageFooter() {
  const navigate = useNavigate();

  return (
    <footer
      style={{
        background: 'hsl(var(--card))',
        borderTop: '1px solid hsl(var(--border))',
        color: 'hsl(var(--foreground))',
        fontFamily: 'DM Sans, Inter, sans-serif',
      }}
    >
      {/* Main footer grid */}
      <div
        className="max-w-6xl mx-auto px-6 py-14 grid gap-10"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        }}
      >

        {/* Column 1 — Brand */}
        <div className="flex flex-col gap-4" style={{ minWidth: 200 }}>
          <div className="flex items-center gap-2">
            <img
              src={"/citadeltwin-logo.png"}
              alt="CitadelTwin"
              className="h-14 w-auto max-w-[11rem] object-contain"
            />
          </div>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'hsl(var(--muted-foreground))', maxWidth: 220 }}
          >
            AI-powered digital twin platform for construction and real estate.
            Built by Community Dreams Foundation.
          </p>

          {/* Contact */}
          <div className="flex flex-col gap-2 mt-2">
            <a href="tel:+14072594242" className="hp-contact-link">
              <Phone size={14} style={{ color: 'hsl(21 90% 44%)', flexShrink: 0 }} />
              +1 (407) 259-4242
            </a>
            <a href="mailto:info@cdreams.org" className="hp-contact-link">
              <Mail size={14} style={{ color: 'hsl(21 90% 44%)', flexShrink: 0 }} />
              info@cdreams.org
            </a>
          </div>
        </div>

        {/* Column 2 — Platform */}
        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: 'hsl(21 90% 44%)' }}
          >
            Platform
          </p>
          <ul className="flex flex-col gap-2.5">
            {PLATFORM_LINKS.map((link) => (
              <li key={link.route}>
                <button
                  onClick={() => navigate(link.route)}
                  className="text-sm transition-colors hover:underline text-left"
                  style={{
                    color: 'hsl(var(--muted-foreground))',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLElement).style.color = 'hsl(21 90% 44%)')
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLElement).style.color =
                      'hsl(var(--muted-foreground))')
                  }
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3 — Data Sources */}
        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: 'hsl(21 90% 44%)' }}
          >
            Data Sources
          </p>
          <ul className="flex flex-col gap-2.5">
            {DATA_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm inline-flex items-center gap-1 transition-colors"
                  style={{ color: 'hsl(var(--muted-foreground))', textDecoration: 'none' }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = 'hsl(21 90% 44%)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = 'hsl(var(--muted-foreground))';
                  }}
                >
                  {link.label}
                  <ExternalLink size={11} style={{ opacity: 0.5 }} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4 — Organization */}
        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: 'hsl(21 90% 44%)' }}
          >
            Organization
          </p>
          <ul className="flex flex-col gap-2.5">
            {[
              { label: 'Community Dreams Foundation', href: 'https://communitydreams.org' },
              { label: 'About CitadelTwin', href: '#' },
              { label: 'Privacy Policy', href: '#', muted: true },
              { label: 'Terms of Service', href: '#', muted: true },
            ].map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target={item.href !== '#' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  title={item.href === '#' ? 'Coming soon' : undefined}
                  className="text-sm transition-colors"
                  style={{ color: 'hsl(var(--muted-foreground))', textDecoration: 'none' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'hsl(21 90% 44%)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color =
                      'hsl(var(--muted-foreground))';
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div
        className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{
          borderTop: '1px solid hsl(var(--border))',
          color: 'hsl(var(--muted-foreground))',
        }}
      >
        <span>
          © {new Date().getFullYear()} Community Dreams Foundation. CitadelTwin is a nonprofit volunteer project.
        </span>
        <span
          className="hp-badge"
          style={{ fontSize: '11px', padding: '3px 10px' }}
        >
          Built with ❤ for the AEC community
        </span>
      </div>
    </footer>
  );
}
