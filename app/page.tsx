import Pricing from "@/components/home/Pricing";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import ResearchDomains from "@/components/home/ResearchDomains";
import HowItWorks from "@/components/home/HowItWorks";
import Stats from "@/components/home/Stats";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <ResearchDomains />
      <HowItWorks />
      <Pricing />
      <Stats />
      <Footer />
    </>
  );
}