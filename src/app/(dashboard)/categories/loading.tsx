export default function CategoriesLoading() {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 8, fontSize: 20, fontWeight: 700 }}>
        Loading categories...
      </h2>
      <p style={{ color: "var(--color-text-secondary)" }}>
        Fetching your category list.
      </p>
    </div>
  );
}
