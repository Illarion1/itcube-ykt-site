import { AboutSection } from '../components/home/AboutSection';
import { AdmissionSteps } from '../components/home/AdmissionSteps';
import { ContactsSection } from '../components/home/ContactsSection';
import { DirectionsSection } from '../components/home/DirectionsSection';
import { Facts } from '../components/home/Facts';
import { Hero } from '../components/home/Hero';
import { NewsSection } from '../components/home/NewsSection';
import { PartnersSection } from '../components/home/PartnersSection';
import { TeamSection } from '../components/home/TeamSection';
import { Seo } from '../components/ui/Seo';

/** Главная страница — собрана из секций в порядке, заданном в техническом задании */
export function HomePage() {
  return (
    <>
      <Seo />
      <Hero />
      <Facts />
      <DirectionsSection />
      <AboutSection />
      <AdmissionSteps />
      <NewsSection />
      <TeamSection />
      <PartnersSection />
      <ContactsSection />
    </>
  );
}
