import { getUserCategories } from "./actions";
import CategoriesView from "./categories-view";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await getUserCategories();
  return <CategoriesView initialCategories={categories} />;
}
