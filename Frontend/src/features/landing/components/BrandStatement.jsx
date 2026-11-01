import React from "react";
import { Link } from "react-router";
import Reveal from "../../Shared/Components/Reveal";

const BrandStatement = () => {
  return (
    <section className="max-w-4xl mx-auto px-8 py-32 text-center">
      <Reveal>
        <div
          className="w-14 h-px mx-auto mb-10"
          style={{ backgroundColor: "#C9A96E" }}
        />
        <p
          className="text-3xl lg:text-5xl font-light italic leading-snug mb-12"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: "#1b1c1a",
          }}
        >
          Premium minimalist pieces, meticulously designed for effortless
          elegance and enduring quality.
        </p>
        <Link
          to="/shop"
          className="inline-block px-10 py-4 text-[11px] uppercase tracking-[0.25em] font-medium transition-colors duration-300 hover:bg-[#C9A96E] hover:text-[#1b1c1a]"
          style={{ backgroundColor: "#1b1c1a", color: "#fbf9f6" }}
        >
          Enter the archive
        </Link>
      </Reveal>
    </section>
  );
};

export default BrandStatement;
