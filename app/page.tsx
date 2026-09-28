import CategoryFilter from "@/components/landing/CategoryFilter";
import HeroSection from "@/components/landing/hero";
import HomeLayout from "@/components/landing/HomeLayout";

export default function Home() {
  return (
    <main className="">
      <HeroSection />
      <CategoryFilter />
      <HomeLayout />
    </main>
  );
}