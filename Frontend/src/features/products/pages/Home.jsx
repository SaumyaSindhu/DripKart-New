import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useProduct } from "../hooks/useProduct";
import { useSearchParams } from "react-router";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import Reveal from "../../Shared/Components/Reveal";
import Footer from "../../Shared/Components/Footer";
import { matchesQuery, sortSizes } from "../utils/productSearch";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

const Home = () => {
  const products = useSelector((state) => state.product.products);
  const { handleGetAllProducts } = useProduct();

  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [sort, setSort] = useState("newest");
  const [size, setSize] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleGetAllProducts()
      .catch((err) => console.error("Failed to load products", err))
      .finally(() => setLoading(false));
  }, []);

  // every size that has at least one variant in stock
  const availableSizes = useMemo(() => {
    const set = new Set();
    (products || []).forEach((product) => {
      (product.variants || []).forEach((v) => {
        if (v.attributes?.Size && v.stock > 0) set.add(v.attributes.Size);
      });
    });
    return [...set].sort(sortSizes);
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...(products || [])];

    if (query) list = list.filter((p) => matchesQuery(p, query));

    if (size) {
      list = list.filter((p) =>
        (p.variants || []).some(
          (v) => v.attributes?.Size === size && v.stock > 0,
        ),
      );
    }

    list.sort((a, b) => {
      if (sort === "price-asc")
        return (a.price?.amount || 0) - (b.price?.amount || 0);
      if (sort === "price-desc")
        return (b.price?.amount || 0) - (a.price?.amount || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return list;
  }, [products, query, size, sort]);

  const clearAll = () => {
    setSearchParams({});
    setSize(null);
    setSort("newest");
  };

  const hasFilters = Boolean(query || size);

  return (
    <>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <div
        className="min-h-screen selection:bg-[#C9A96E]/30"
        style={{
          backgroundColor: "#fbf9f6",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div className="max-w-7xl mx-auto px-8 lg:px-16 xl:px-24">
          {/* ── Hero / Header ── */}
          <div className="pt-16 pb-14 text-center flex flex-col items-center">
            <span
              className="animate-fade-up text-[10px] uppercase tracking-[0.24em] font-medium mb-6"
              style={{ color: "#C9A96E" }}
            >
              {query ? "Search Results" : "The Collection"}
            </span>
            <h1
              className="animate-fade-up text-5xl lg:text-7xl font-light leading-tight mb-6"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "#1b1c1a",
                "--d": "120ms",
              }}
            >
              {query ? `“${query}”` : "Curated Archive"}
            </h1>
            {!query && (
              <p
                className="animate-fade-up max-w-xl mx-auto text-sm leading-relaxed"
                style={{ color: "#7A6E63", "--d": "240ms" }}
              >
                Discover our latest curation of premium minimalist pieces,
                meticulously designed for effortless elegance and enduring
                quality.
              </p>
            )}
          </div>

          {/* ── Toolbar: count + size filter + sort ── */}
          {products && products.length > 0 && (
            <div
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 py-6 mb-12 border-y"
              style={{ borderColor: "#e4e2df" }}
            >
              <div className="flex items-center gap-5">
                <span
                  className="text-[10px] uppercase tracking-[0.22em] font-medium"
                  style={{ color: "#7A6E63" }}
                >
                  {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
                </span>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="link-underline text-[10px] uppercase tracking-[0.2em] font-medium transition-colors hover:text-[#C9A96E]"
                    style={{ color: "#1b1c1a" }}
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                {availableSizes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] uppercase tracking-[0.22em] font-medium mr-2"
                      style={{ color: "#B5ADA3" }}
                    >
                      Size
                    </span>
                    {availableSizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(size === s ? null : s)}
                        className={`min-w-9 h-9 px-2 text-[10px] uppercase tracking-[0.12em] font-medium border transition-colors duration-300 ${size === s ? "bg-[#1b1c1a] text-[#fbf9f6] border-[#1b1c1a]" : "hover:border-[#C9A96E] hover:text-[#C9A96E]"}`}
                        style={
                          size === s
                            ? undefined
                            : { borderColor: "#d0c5b5", color: "#1b1c1a" }
                        }
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <label className="flex items-center gap-3">
                  <span
                    className="text-[10px] uppercase tracking-[0.22em] font-medium"
                    style={{ color: "#B5ADA3" }}
                  >
                    Sort
                  </span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="bg-transparent border-b py-1 text-[11px] uppercase tracking-[0.12em] font-medium outline-none cursor-pointer focus:border-[#C9A96E]"
                    style={{ borderColor: "#d0c5b5", color: "#1b1c1a" }}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}

          {/* ── Product Grid ── */}
          {loading && filtered.length === 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-14 pb-32">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-14 pb-32">
              {filtered.map((product, i) => (
                <Reveal key={product._id} delay={(i % 4) * 80}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center flex flex-col items-center">
              <h2
                className="text-2xl mb-4"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "#1b1c1a",
                }}
              >
                {products && products.length > 0
                  ? "No pieces match your filters."
                  : "No pieces available."}
              </h2>
              <p
                className="max-w-md mx-auto text-sm leading-relaxed mb-8"
                style={{ color: "#7A6E63" }}
              >
                {products && products.length > 0
                  ? "Try a different word, size or sort."
                  : "We are currently preparing our next collection. Please check back later."}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-8 py-4 text-[11px] uppercase tracking-[0.25em] font-medium transition-colors duration-300 hover:bg-[#C9A96E] hover:text-[#1b1c1a]"
                  style={{ backgroundColor: "#1b1c1a", color: "#fbf9f6" }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Home;
