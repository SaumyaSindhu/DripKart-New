import React, { useEffect, useState } from "react";
import { Link } from "react-router";

// Shown only when there are no products in the database yet
const FALLBACK_SLIDE = {
  _id: null,
  title: "Curated Archive",
  description:
    "Premium minimalist pieces, meticulously designed for effortless elegance and enduring quality.",
  images: [{ url: "/snitch_editorial_warm.png" }],
  price: null,
};

const HeroSlider = ({ products }) => {
  const slides = products.length > 0 ? products : [FALLBACK_SLIDE];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      5500,
    );
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  const slide = slides[index] || slides[0];

  return (
    <section
      className="grid grid-cols-1 lg:grid-cols-2 lg:h-[calc(100vh-170px)] lg:min-h-[560px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── LEFT: text ── */}
      <div className="order-2 lg:order-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24 py-16 lg:py-0">
        {/* key={index} restarts the fade-up animation on every slide change */}
        <div key={index}>
          <span
            className="animate-fade-up block text-[10px] uppercase tracking-[0.24em] font-medium mb-6"
            style={{ color: "#C9A96E", "--d": "0ms" }}
          >
            {slide._id
              ? `New Arrival · 0${index + 1} / 0${slides.length}`
              : "The Collection"}
          </span>

          <h1
            className="animate-fade-up text-5xl lg:text-6xl xl:text-7xl font-light leading-[1.05] mb-6 line-clamp-3"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: "#1b1c1a",
              "--d": "120ms",
            }}
          >
            {slide.title}
          </h1>

          <p
            className="animate-fade-up max-w-md text-sm leading-relaxed mb-4 line-clamp-3"
            style={{ color: "#7A6E63", "--d": "240ms" }}
          >
            {slide.description}
          </p>

          {slide.price && (
            <p
              className="animate-fade-up text-[11px] uppercase tracking-[0.2em] font-medium mb-10"
              style={{ color: "#1b1c1a", "--d": "320ms" }}
            >
              {slide.price.currency} {slide.price.amount?.toLocaleString()}
            </p>
          )}

          <div
            className="animate-fade-up flex items-center gap-8"
            style={{ "--d": "400ms" }}
          >
            <Link
              to={slide._id ? `/product/${slide._id}` : "/shop"}
              className="px-8 py-4 text-[11px] uppercase tracking-[0.25em] font-medium transition-colors duration-300 hover:bg-[#C9A96E] hover:text-[#1b1c1a]"
              style={{ backgroundColor: "#1b1c1a", color: "#fbf9f6" }}
            >
              {slide._id ? "Shop the piece" : "Enter the archive"}
            </Link>
            <Link
              to="/shop"
              className="link-underline text-[10px] uppercase tracking-[0.2em] font-medium transition-colors hover:text-[#C9A96E]"
              style={{ color: "#7A6E63" }}
            >
              Shop all
            </Link>
          </div>
        </div>

        {/* Slide indicators */}
        {slides.length > 1 && (
          <div className="flex items-center gap-3 mt-14">
            {slides.map((s, i) => (
              <button
                key={s._id || i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="py-3"
              >
                <span
                  className="block h-px transition-all duration-500"
                  style={{
                    width: i === index ? "48px" : "24px",
                    backgroundColor: i === index ? "#C9A96E" : "#d0c5b5",
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT: image stack (cross-fade + slow zoom) ── */}
      <div
        className="order-1 lg:order-2 relative overflow-hidden aspect-[4/5] lg:aspect-auto"
        style={{ backgroundColor: "#f5f3f0" }}
      >
        {slides.map((s, i) => (
          <img
            key={s._id || "fallback"}
            src={s.images?.[0]?.url || "/snitch_editorial_warm.png"}
            alt={s.title}
            className={`hero-img absolute inset-0 w-full h-full object-cover object-top ${i === index ? "is-active" : ""}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
