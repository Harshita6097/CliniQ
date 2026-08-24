import LandingNavbar     from '../components/landing/LandingNavbar';
import HeroSection       from '../components/landing/HeroSection';
import FeatureSpotlights from '../components/landing/FeatureSpotlight';
import HowItWorks        from '../components/landing/HowItWorks';
import RoleTabsCard      from '../components/landing/RoleTabsCard';
import LandingFooter     from '../components/landing/LandingFooter';

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper font-sans">
      <LandingNavbar />
      <main>
        <HeroSection />
        <FeatureSpotlights />
        <HowItWorks />
        <RoleTabsCard />
      </main>
      <LandingFooter />
    </div>
  );
}
