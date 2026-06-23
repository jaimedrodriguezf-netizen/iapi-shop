import { PricingSection } from "@/components/landing/pricing-section";

export const metadata = {
  title: "Planes - IAPI Shop",
  description: "Conoce nuestros planes y mejora tu tienda.",
};

export default function PlanesPage() {
  return (
    <div className="pb-12">
      <div className="rounded-3xl border bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
        <PricingSection />
      </div>
    </div>
  );
}
