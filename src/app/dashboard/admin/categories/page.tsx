import { getCategories } from "@/lib/products/actions";
import { CategoriesClient } from "./categories-client";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categoriesResult = await getCategories();
  const categories = categoriesResult.success && categoriesResult.categories ? categoriesResult.categories : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categorías Globales</h1>
        <p className="text-muted-foreground">
          Administra las categorías y subcategorías maestras. Estas estarán disponibles para todas las sucursales.
        </p>
      </div>

      <CategoriesClient categories={categories} />
    </div>
  );
}
