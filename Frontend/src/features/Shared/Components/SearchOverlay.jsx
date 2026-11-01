import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useProduct } from "../../products/hooks/useProduct";
import { matchesQuery } from "../../products/utils/productSearch";

// Edit these quick-search chips to match your catalogue
const SUGGESTIONS = ["Shirt", "Oversized", "Black", "Jacket"];

const SearchOverlay = ({ open, onClose }) => {
  const products = useSelector((state) => state.product.products);
  const { handleGetAllProducts } = useProduct();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;

    // Make sure products are loaded even if the user never visited the shop page
    if (!products || products.length === 0) {
      handleGetAllProducts().catch((err) =>
        console.error("Search: failed to load products", err),
      );
    }

    setQuery("");
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // every product that matches, and the first 8 for the quick list
  const matches = useMemo(() => {
    if (!query.trim()) return [];
    return (products || []).filter((product) => matchesQuery(product, query));
  }, [query, products]);

  const results = matches.slice(0, 8);

  const goToProduct = (id) => {
    onClose();
    navigate(`/product/${id}`);
  };

  // Enter (or the "view all" link) opens the full results on the shop page
  const goToShop = () => {
    const q = query.trim();
    if (!q) return;
    onClose();
    navigate(`/shop?q=${encodeURIComponent(q)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    goToShop();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Dim backdrop */}
      <div
        className="search-backdrop absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(27,28,26,0.45)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="search-panel absolute top-0 inset-x-0 max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{
          backgroundColor: "#fbf9f6",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div className="max-w-4xl mx-auto px-8 pt-10 pb-12">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-4 border-b pb-4"
            style={{ borderColor: "#C9A96E" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C9A96E"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for pieces…"
              className="flex-1 bg-transparent outline-none text-2xl font-light placeholder:text-[#d0c5b5]"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "#1b1c1a",
              }}
            />
            <button
              type="button"
              onClick={onClose}
              className="text-[10px] uppercase tracking-[0.2em] font-medium transition-colors hover:text-[#C9A96E]"
              style={{ color: "#7A6E63" }}
            >
              Close
            </button>
          </form>

          {/* Empty query: suggestions */}
          {!query.trim() && (
            <div className="pt-8">
              <p
                className="text-[10px] uppercase tracking-[0.24em] font-medium mb-4"
                style={{ color: "#B5ADA3" }}
              >
                Popular searches
              </p>
              <div className="flex flex-wrap gap-3">
                {SUGGESTIONS.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="px-4 py-2 text-[11px] uppercase tracking-[0.15em] border transition-colors hover:border-[#C9A96E] hover:text-[#C9A96E]"
                    style={{ borderColor: "#e4e2df", color: "#7A6E63" }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {query.trim() && results.length > 0 && (
            <>
              <ul className="pt-6">
                {results.map((product, i) => {
                  const img =
                    product.images?.[0]?.url || "/snitch_editorial_warm.png";
                  return (
                    <li
                      key={product._id}
                      className="search-result"
                      style={{ "--i": `${i * 50}ms` }}
                    >
                      <button
                        type="button"
                        onClick={() => goToProduct(product._id)}
                        className="group w-full flex items-center gap-5 py-4 border-b text-left"
                        style={{ borderColor: "#e4e2df" }}
                      >
                        <div
                          className="w-14 h-[70px] overflow-hidden shrink-0"
                          style={{ backgroundColor: "#f5f3f0" }}
                        >
                          <img
                            src={img}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className="text-lg truncate transition-colors duration-300 group-hover:text-[#C9A96E]"
                            style={{
                              fontFamily: "'Cormorant Garamond', serif",
                              color: "#1b1c1a",
                            }}
                          >
                            {product.title}
                          </h4>
                          <p
                            className="text-[12px] truncate"
                            style={{ color: "#7A6E63" }}
                          >
                            {product.description}
                          </p>
                        </div>
                        <span
                          className="text-[10px] uppercase tracking-[0.2em] font-medium"
                          style={{ color: "#1b1c1a" }}
                        >
                          {product.price?.currency}{" "}
                          {product.price?.amount?.toLocaleString()}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <button
                type="button"
                onClick={goToShop}
                className="mt-8 link-underline text-[10px] uppercase tracking-[0.22em] font-medium transition-colors hover:text-[#C9A96E]"
                style={{ color: "#1b1c1a" }}
              >
                View all {matches.length}{" "}
                {matches.length === 1 ? "result" : "results"} →
              </button>
            </>
          )}

          {/* No results */}
          {query.trim() && results.length === 0 && (
            <div className="pt-12 text-center">
              <h4
                className="text-2xl mb-2"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "#1b1c1a",
                }}
              >
                No pieces match “{query.trim()}”
              </h4>
              <p className="text-sm" style={{ color: "#7A6E63" }}>
                Try a different word, or check the spelling.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
