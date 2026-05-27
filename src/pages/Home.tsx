import React from 'react';
import { HomeHeroSection } from '@/components/home/HomeHeroSection';
import { HomeStatsBar } from '@/components/home/HomeStatsBar';
import { HomeFeaturesSection } from '@/components/home/HomeFeaturesSection';
import { HomeHowItWorks } from '@/components/home/HomeHowItWorks';
import { HomeDataSources } from '@/components/home/HomeDataSources';
import { HomeSecuritySection } from '@/components/home/HomeSecuritySection';
import { HomeCTASection } from '@/components/home/HomeCTASection';
import { HomePageFooter } from '@/components/home/HomePageFooter';

export default function Home() {
  return (
    <div style={{ overflowX: 'hidden' }}>
      <HomeHeroSection />
      <HomeStatsBar />
      <HomeFeaturesSection />
      <HomeHowItWorks />
      <HomeDataSources />
      <HomeSecuritySection />
      <HomeCTASection />
      <HomePageFooter />
    </div>
  );
}
