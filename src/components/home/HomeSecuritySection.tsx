import React from 'react';
import { ShieldCheck, Lock, Database } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const ITEMS = [
  {
    icon: ShieldCheck,
    title: 'SOC 2 Type II',
    desc: 'Enterprise-grade security controls and full audit trails for every action on the platform.',
    color: 'hsl(142 60% 35%)',
    colorDim: 'hsl(142 60% 35% / 0.10)',
  },
  {
    icon: Lock,
    title: 'SSO & 2FA',
    desc: 'Single sign-on via Google, Azure AD, and Okta. Multi-factor authentication supported.',
    color: 'hsl(215 20% 33%)',
    colorDim: 'hsl(215 20% 33% / 0.10)',
  },
  {
    icon: Database,
    title: 'Supabase Auth',
    desc: 'Row-level security, encrypted storage, and role-based access control for all project data.',
    color: 'hsl(21 90% 44%)',
    colorDim: 'hsl(21 90% 44% / 0.10)',
  },
];

export function HomeSecuritySection() {
  const ref = useScrollReveal();

  return (
    <section
      id="security"
      ref={ref as React.RefObject<HTMLElement>}
      className="py-20 px-6"
      style={{
        background: 'hsl(var(--secondary, 40 15% 91%))',
        borderTop: '1px solid hsl(var(--border))',
        borderBottom: '1px solid hsl(var(--border))',
      }}
    >
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12 hp-reveal">
          <p className="hp-eyebrow mb-3">Enterprise Grade</p>
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            Built for security and compliance
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`hp-feature-card hp-reveal hp-stagger-${i + 1} flex flex-col gap-4`}
              >
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{ width: 48, height: 48, background: item.colorDim, border: `1px solid ${item.color}33` }}
                >
                  <Icon size={22} style={{ color: item.color }} />
                </div>
                <h3 className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
