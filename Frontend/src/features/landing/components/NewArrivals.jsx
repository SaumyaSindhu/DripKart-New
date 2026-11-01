import React, { useRef } from "react";
import { Link } from "react-router";
import Reveal from "../../Shared/Components/Reveal";
import ProductCard from "../../products/components/ProductCard";
import ProductCardSkeleton from "../../products/components/ProductCardSkeleton";

const NewArrivals = ({ products, loading = false }) => {
  const scroller = useRef(null);

  const scrollByCards = (direction) => {
    scroller.current?.scrollBy({ left: direction * 420, behavior: "smooth" });
  };

  if (loading) {
    return (
      <section
        className="max-w-7xl mx-auto px-8 lg:px-16 xl:px-24 py-24"
        aria-hidden="true"
      >
        <div className="skeleton h-3 w-24 mb-4" />
        <div className="skeleton h-10 w-64 mb-12" />
        <div className="flex gap-6 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="shrink-0 w-[70%] sm:w-[40%] lg:w-[23%]">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-8 lg:px-16 xl:px-24 py-24">
      <Reveal>
        <div className="flex items-end justify-between mb-12">
          <div>
            <span
              className="block text-[10px] uppercase tracking-[0.24em] font-medium mb-4"
              style={{ color: "#C9A96E" }}
            >
              Just Landed
            </span>
            <h2
              className="text-4xl lg:text-5xl font-light"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "#1b1c1a",
              }}
            >
              New Arrivals
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <Link
              to="/shop"
              className="link-underline hidden sm:inline text-[10px] uppercase tracking-[0.2em] font-medium transition-colors hover:text-[#C9A96E]"
              style={{ color: "#7A6E63" }}
            >
              Shop all
            </Link>
            <div className="flex gap-2">
              {[
                { dir: -1, label: "Previous", char: "←" },
                { dir: 1, label: "Next", char: "→" },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => scrollByCards(btn.dir)}
                  aria-label={btn.label}
                  className="w-10 h-10 border flex items-center justify-center transition-colors duration-300 hover:bg-[#1b1c1a] hover:text-[#fbf9f6]"
                  style={{ borderColor: "#d0c5b5", color: "#1b1c1a" }}
                >
                  {btn.char}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      <div
        ref={scroller}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2"
      >
        {products.map((product, i) => (
          <div
            key={product._id}
            className="snap-start shrink-0 w-[70%] sm:w-[40%] lg:w-[23%]"
          >
            <Reveal delay={i * 80}>
              <ProductCard product={product} />
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NewArrivals;
