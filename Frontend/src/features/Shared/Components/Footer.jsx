import React from "react";
import { Link } from "react-router";

const Footer = () => {
  const linkClass =
    "link-underline text-[11px] transition-colors hover:text-[#C9A96E]";

  return (
    <footer className="border-t" style={{ borderColor: "#e4e2df" }}>
      <div className="max-w-7xl mx-auto px-8 lg:px-16 xl:px-24 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <span
            className="text-sm font-medium tracking-[0.35em] uppercase"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: "#C9A96E",
            }}
          >
            DripKart.
          </span>
          <p
            className="mt-5 max-w-xs text-sm leading-relaxed"
            style={{ color: "#7A6E63" }}
          >
            A curated archive of premium minimalist pieces.
          </p>
        </div>

        <div className="flex flex-col gap-3" style={{ color: "#7A6E63" }}>
          <span
            className="text-[10px] uppercase tracking-[0.24em] font-medium mb-2"
            style={{ color: "#1b1c1a" }}
          >
            Explore
          </span>
          <Link to="/shop" className={linkClass + " w-fit"}>
            Shop all
          </Link>
          <Link to="/cart" className={linkClass + " w-fit"}>
            Cart
          </Link>
        </div>

        <div className="flex flex-col gap-3" style={{ color: "#7A6E63" }}>
          <span
            className="text-[10px] uppercase tracking-[0.24em] font-medium mb-2"
            style={{ color: "#1b1c1a" }}
          >
            Account
          </span>
          <Link to="/login" className={linkClass + " w-fit"}>
            Sign in
          </Link>
          <Link to="/register" className={linkClass + " w-fit"}>
            Create account
          </Link>
        </div>
      </div>

      <div
        className="border-t py-6 text-center"
        style={{ borderColor: "#e4e2df" }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.35em]"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: "#C9A96E",
          }}
        >
          DripKart. © {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
};

export default Footer;
