import CategoryFilter from "@/components/landing/CategoryFilter";
import HeroSection from "@/components/landing/hero";
import HomeLayout from "@/components/landing/HomeLayout";

export default function Home() {
  return (
    <section className="">
      <HeroSection />
      <CategoryFilter />
      <HomeLayout />
    </section>
  );
}