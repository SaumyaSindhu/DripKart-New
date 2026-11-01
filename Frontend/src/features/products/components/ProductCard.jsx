import React, { useMemo } from "react";
import { Link } from "react-router";
import { sortSizes } from "../utils/productSearch";

const ProductCard = ({ product }) => {
  const firstImage = product.images?.[0]?.url || "/snitch_editorial_warm.png";
  const secondImage = product.images?.[1]?.url;

  // Build [{ size, inStock }] from variants that have a "Size" attribute
  const sizes = useMemo(() => {
    const map = {};
    (product.variants || []).forEach((variant) => {
      const size = variant.attributes?.Size;
      if (!size) return;
      map[size] = map[size] || variant.stock > 0;
    });
    return Object.keys(map)
      .sort(sortSizes)
      .map((size) => ({ size, inStock: map[size] }));
  }, [product]);

  return (
    <Link to={`/product/${product._id}`} className="group flex flex-col">
      {/* Image */}
      <div
        className="relative aspect-[4/5] overflow-hidden mb-5"
        style={{ backgroundColor: "#f5f3f0" }}
      >
        <img
          src={firstImage}
          alt={product.title}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${secondImage ? "group-hover:opacity-0" : ""}`}
        />
        {secondImage && (
          <img
            src={secondImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-105"
          />
        )}

        {/* Sizes slide up on hover */}
        {sizes.length > 0 && (
          <div
            className="absolute inset-x-0 bottom-0 flex justify-center gap-3 py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500"
            style={{ backgroundColor: "rgba(251,249,246,0.92)" }}
          >
            {sizes.map(({ size, inStock }) => (
              <span
                key={size}
                className="text-[10px] uppercase tracking-[0.15em] font-medium"
                style={{
                  color: inStock ? "#1b1c1a" : "#B5ADA3",
                  textDecoration: inStock ? "none" : "line-through",
                }}
              >
                {size}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1.5">
        <h3
          className="text-xl leading-snug transition-colors duration-300 group-hover:text-[#C9A96E]"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: "#1b1c1a",
          }}
        >
          {product.title}
        </h3>
        <span
          className="text-[10px] uppercase tracking-[0.2em] font-medium"
          style={{ color: "#1b1c1a" }}
        >
          {product.price?.currency} {product.price?.amount?.toLocaleString()}
        </span>
      </div>
    </Link>
  );
};

export default ProductCard;
