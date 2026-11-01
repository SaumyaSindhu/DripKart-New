import React, { useMemo } from "react";
import { Link } from "react-router";
import Reveal from "../../Shared/Components/Reveal";

const ShopByColor = ({ products }) => {
  // Build [{ name, image, count }] from the "Color" attribute of every variant
  const colors = useMemo(() => {
    const map = {};

    (products || []).forEach((product) => {
      (product.variants || []).forEach((variant) => {
        const raw = variant.attributes?.Color;
        if (!raw) return;

        const key = String(raw).trim().toLowerCase();
        if (!map[key]) {
          map[key] = {
            name: key.charAt(0).toUpperCase() + key.slice(1),
            image: variant.images?.[0]?.url || product.images?.[0]?.url,
            productIds: new Set(),
          };
        }
        map[key].productIds.add(product._id);
      });
    });

    return Object.values(map).slice(0, 6);
  }, [products]);

  if (colors.length < 2) return null;

  return (
    <section className="max-w-7xl mx-auto px-8 lg:px-16 xl:px-24 pb-24">
      <Reveal>
        <div className="mb-12">
          <h2
            className="text-4xl lg:text-5xl font-light mb-4"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: "#1b1c1a",
            }}
          >
            Shop by Color
          </h2>
          <div className="w-14 h-px" style={{ backgroundColor: "#C9A96E" }} />
        </div>
      </Reveal>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {colors.map((color, i) => (
          <Reveal key={color.name} delay={i * 70}>
            <Link
              to={`/shop?q=${encodeURIComponent(color.name)}`}
              className="group block"
            >
              <div
                className="aspect-[3/4] overflow-hidden mb-4"
                style={{ backgroundColor: "#f5f3f0" }}
              >
                {color.image && (
                  <img
                    src={color.image}
                    alt={color.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
              </div>
              <p
                className="text-[11px] uppercase tracking-[0.2em] font-medium transition-colors duration-300 group-hover:text-[#C9A96E]"
                style={{ color: "#1b1c1a" }}
              >
                {color.name}
              </p>
              <p className="text-[10px] mt-1" style={{ color: "#B5ADA3" }}>
                {color.productIds.size}{" "}
                {color.productIds.size === 1 ? "piece" : "pieces"}
              </p>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default ShopByColor;
