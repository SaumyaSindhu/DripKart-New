import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../../auth/hook/useAuth";
import AnnouncementBar from "./AnnouncementBar";
import SearchOverlay from "./SearchOverlay";

const Nav = () => {
  const navigate = useNavigate();
  const { handleLogout } = useAuth();
  const user = useSelector((state) => state.auth.user);
  const cartItems = useSelector((state) => state.cart?.items);

  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onLogout = async () => {
    try {
      await handleLogout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <AnnouncementBar />

      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md transition-shadow duration-500"
        style={{
          borderColor: "#e4e2df",
          backgroundColor: "rgba(251,249,246,0.92)",
          boxShadow: scrolled ? "0 10px 30px rgba(27,28,26,0.05)" : "none",
        }}
      >
        <nav
          className={`px-8 lg:px-16 xl:px-24 grid grid-cols-[1fr_auto_1fr] items-center transition-all duration-500 ${scrolled ? "py-4" : "py-7"}`}
        >
          {/* LEFT: links */}
          <div
            className="flex gap-8 items-center text-[10px] uppercase tracking-[0.2em] font-medium"
            style={{ color: "#7A6E63" }}
          >
            <Link
              to="/shop"
              className="link-underline transition-colors hover:text-[#C9A96E]"
            >
              Shop
            </Link>
          </div>

          {/* CENTER: logo */}
          <Link
            to="/"
            className="justify-self-center text-base font-medium tracking-[0.35em] uppercase hover:opacity-80 transition-opacity outline-none focus-visible:ring-1 focus-visible:ring-[#C9A96E] focus-visible:ring-offset-8 focus-visible:ring-offset-[#fbf9f6]"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: "#C9A96E",
            }}
          >
            DripKart.
          </Link>

          {/* RIGHT: search + user area */}
          <div
            className="flex gap-5 xl:gap-6 items-center justify-end whitespace-nowrap text-[10px] uppercase tracking-[0.2em] font-medium"
            style={{ color: "#7A6E63" }}
          >
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center hover:opacity-70 transition-opacity"
              style={{ color: "#1b1c1a" }}
              aria-label="Search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {user ? (
              <>
                <span className="hidden xl:inline" style={{ color: "#1b1c1a" }}>
                  {user.fullname}
                </span>
                {user.role === "seller" && (
                  <Link
                    to="/seller/dashboard"
                    className="hidden lg:inline link-underline transition-colors hover:text-[#C9A96E]"
                  >
                    Seller Dashboard
                  </Link>
                )}
                <Link
                  to="/cart"
                  className="relative flex items-center hover:opacity-70 transition-opacity"
                  style={{ color: "#1b1c1a" }}
                  aria-label="Shopping cart"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  {cartItems?.length > 0 && (
                    <span
                      className="absolute -top-2 -right-2 flex items-center justify-center rounded-full text-white"
                      style={{
                        backgroundColor: "#C9A96E",
                        width: "16px",
                        height: "16px",
                        fontSize: "9px",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        letterSpacing: 0,
                      }}
                    >
                      {cartItems.length > 9 ? "9+" : cartItems.length}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded px-4 py-2 text-white transition-colors hover:bg-red-700"
                  style={{ backgroundColor: "#b42318" }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="link-underline transition-colors hover:text-[#C9A96E]"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="link-underline transition-colors hover:text-[#C9A96E]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Nav;
