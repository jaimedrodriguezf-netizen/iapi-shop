import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal | Tenddy Shop",
  description: "Términos, condiciones y políticas de privacidad de Tenddy Shop.",
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <article className="prose prose-neutral max-w-none dark:prose-invert">
        {children}
      </article>
    </div>
  );
}