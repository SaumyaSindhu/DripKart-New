// Shared helpers for searching / filtering products on the frontend

export const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"];

export const sortSizes = (a, b) => {
  const ai = SIZE_ORDER.indexOf(a);
  const bi = SIZE_ORDER.indexOf(b);
  if (ai !== -1 && bi !== -1) return ai - bi;
  if (ai !== -1) return -1;
  if (bi !== -1) return 1;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
};

// true if every typed word appears in the title, description or any variant value (e.g. "Black", "M")
export const matchesQuery = (product, query) => {
  const q = (query || "").trim().toLowerCase();
  if (!q) return true;

  const variantValues = (product.variants || []).flatMap((v) =>
    Object.values(v.attributes || {}),
  );
  const haystack = [product.title, product.description, ...variantValues]
    .join(" ")
    .toLowerCase();

  return q.split(/\s+/).every((word) => haystack.includes(word));
};
