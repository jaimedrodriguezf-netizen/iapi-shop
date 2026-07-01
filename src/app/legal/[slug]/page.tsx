import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TerminosContent } from "../content/terminos";
import { PrivacidadContent } from "../content/privacidad";

const legalPages: Record<string, { title: string; description: string; Component: React.ComponentType }> = {
  terminos: {
    title: "Términos y Condiciones | Tenddy Shop",
    description:
      "Términos y condiciones de uso de la plataforma Tenddy Shop, incluyendo la declaración de intermediación conforme a la Ley de Comercio Electrónico del Ecuador.",
    Component: TerminosContent,
  },
  privacidad: {
    title: "Política de Privacidad | Tenddy Shop",
    description:
      "Política de privacidad y protección de datos de Tenddy Shop, conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador.",
    Component: PrivacidadContent,
  },
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = legalPages[slug];
  if (!page) return { title: "Página no encontrada | Tenddy Shop" };
  return { title: page.title, description: page.description };
}

export default async function LegalPage({ params }: PageProps) {
  const { slug } = await params;
  const page = legalPages[slug];
  if (!page) notFound();

  const Content = page.Component;
  return <Content />;
}