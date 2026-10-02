import CategoryFilter from "@/components/landing/CategoryFilter";
import HeroSection from "@/components/landing/hero";
import HowItWorks from "@/components/landing/HowItWorks";
import HomeLayout from "@/components/landing/HomeLayout";
import ExploreTopLocations from "@/components/landing/ExploreTopLocations";

export default function Home() {
  return (
    <section className="">
      <HeroSection />
      <CategoryFilter />
      <HomeLayout />
      <HowItWorks />
      <ExploreTopLocations />
    </section>
  );
}