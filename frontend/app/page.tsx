import Header from "@/components/layout/Header"; // On importe le Header
import Footer from "@/components/layout/Footer"; // On importe le Footer
import Hero from "@/components/home/Hero";
import StatsBar from "@/components/home/StatsBar";
import BubbleGrid from "@/components/home/BubbleGrid";
import VideoSection from "@/components/home/VideoSection";
import Testimonials from "@/components/home/Testimonials";
import BoutiqueSection from "@/components/home/BoutiqueSection";
import WhyUsSection from "@/components/home/WhyUsSection";

export default function HomePage() {
  return (
    <>
      {/* ── HEADER MANUEL POUR L'ACCUEIL ── */}
      <Header />

      <main>
        <Hero />
        <StatsBar />
        <BubbleGrid />
        <WhyUsSection />
        <VideoSection />
        <BoutiqueSection />
        <Testimonials />
      </main>

      {/* ── FOOTER MANUEL POUR L'ACCUEIL ── */}
      <Footer />
    </>
  );
}
