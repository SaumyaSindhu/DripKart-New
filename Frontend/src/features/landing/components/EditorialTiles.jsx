import React from "react";
import { Link } from "react-router";
import Reveal from "../../Shared/Components/Reveal";

const EditorialTiles = ({ products }) => {
  if (!products || products.length === 0) return null;

  return (
    <section className="grid grid-cols-1 md:grid-cols-3">
      {products.map((product, i) => (
        <Reveal key={product._id} delay={i * 120}>
          <Link
            to={`/product/${product._id}`}
            className="group relative block aspect-[4/5] overflow-hidden"
            style={{ backgroundColor: "#f5f3f0" }}
          >
            <img
              src={product.images?.[0]?.url || "/snitch_editorial_warm.png"}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(27,24,20,0.72) 0%, rgba(27,24,20,0.05) 55%, transparent 100%)",
              }}
            />
            <div className="absolute bottom-0 inset-x-0 p-8 text-white">
              <span
                className="block text-[10px] uppercase tracking-[0.24em] font-medium mb-3"
                style={{ color: "#C9A96E" }}
              >
                0{i + 1}
              </span>
              <h3
                className="text-3xl font-light leading-tight mb-4 line-clamp-2"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {product.title}
              </h3>
              <span className="inline-block text-[10px] uppercase tracking-[0.2em] font-medium transition-transform duration-500 group-hover:translate-x-2">
                Shop now →
              </span>
            </div>
          </Link>
        </Reveal>
      ))}
    </section>
  );
};

export default EditorialTiles;
