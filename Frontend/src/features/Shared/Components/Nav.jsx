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
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile menu: lock page scroll and close on Escape while open
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const onLogout = async () => {
    try {
      await handleLogout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const onMobileLogout = async () => {
    closeMenu();
    await onLogout();
  };

  // links shown inside the mobile menu
  const menuLinks = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    ...(user?.role === "seller"
      ? [{ to: "/seller/dashboard", label: "Seller Dashboard" }]
      : []),
    ...(user ? [{ to: "/cart", label: "Cart" }] : []),
  ];

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
          className={`px-5 md:px-8 lg:px-16 xl:px-24 grid grid-cols-[1fr_auto_1fr] items-center transition-all duration-500 ${scrolled ? "py-3 md:py-4" : "py-5 md:py-7"}`}
        >
          {/* LEFT: hamburger (mobile) / links (desktop) */}
          <div
            className="flex items-center text-[10px] uppercase tracking-[0.2em] font-medium"
            style={{ color: "#7A6E63" }}
          >
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="md:hidden -ml-1 p-1 hover:opacity-70 transition-opacity"
              style={{ color: "#1b1c1a" }}
              aria-label="Open menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <line x1="4" y1="8" x2="20" y2="8" />
                <line x1="4" y1="16" x2="14" y2="16" />
              </svg>
            </button>
            <Link
              to="/shop"
              className="hidden md:inline link-underline transition-colors hover:text-[#C9A96E]"
            >
              Shop
            </Link>
          </div>

          {/* CENTER: logo */}
          <Link
            to="/"
            className="justify-self-center text-sm md:text-base font-medium tracking-[0.3em] md:tracking-[0.35em] uppercase hover:opacity-80 transition-opacity outline-none focus-visible:ring-1 focus-visible:ring-[#C9A96E] focus-visible:ring-offset-8 focus-visible:ring-offset-[#fbf9f6]"
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
                  className="hidden md:inline-block rounded px-4 py-2 text-white transition-colors hover:bg-red-700"
                  style={{ backgroundColor: "#b42318" }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden md:inline link-underline transition-colors hover:text-[#C9A96E]"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden md:inline link-underline transition-colors hover:text-[#C9A96E]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile menu. Rendered outside <header> because the header's blur would
                otherwise trap a fixed-position child inside it. */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="search-backdrop absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(27,28,26,0.45)" }}
            onClick={closeMenu}
          />

          <aside
            className="drawer-panel absolute left-0 top-0 h-full w-[85%] max-w-sm flex flex-col shadow-2xl"
            style={{
              backgroundColor: "#fbf9f6",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-6 border-b"
              style={{ borderColor: "#e4e2df" }}
            >
              <Link
                to="/"
                onClick={closeMenu}
                className="text-sm font-medium tracking-[0.3em] uppercase"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "#C9A96E",
                }}
              >
                DripKart.
              </Link>
              <button
                type="button"
                onClick={closeMenu}
                className="p-1 hover:opacity-70 transition-opacity"
                style={{ color: "#1b1c1a" }}
                aria-label="Close menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pt-4">
              {menuLinks.map((link, i) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className="drawer-link block py-5 border-b text-3xl font-light transition-colors hover:text-[#C9A96E]"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    color: "#1b1c1a",
                    borderColor: "#e4e2df",
                    "--i": `${120 + i * 70}ms`,
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div
              className="px-6 py-8 border-t flex flex-col gap-4"
              style={{ borderColor: "#e4e2df" }}
            >
              {user ? (
                <>
                  <p
                    className="text-[10px] uppercase tracking-[0.22em] font-medium"
                    style={{ color: "#7A6E63" }}
                  >
                    Signed in as{" "}
                    <span style={{ color: "#1b1c1a" }}>{user.fullname}</span>
                  </p>
                  <button
                    type="button"
                    onClick={onMobileLogout}
                    className="w-full py-4 text-[11px] uppercase tracking-[0.25em] font-medium text-white"
                    style={{ backgroundColor: "#b42318" }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="w-full py-4 text-center text-[11px] uppercase tracking-[0.25em] font-medium"
                    style={{ backgroundColor: "#1b1c1a", color: "#fbf9f6" }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="w-full py-4 text-center text-[11px] uppercase tracking-[0.25em] font-medium border"
                    style={{ borderColor: "#d0c5b5", color: "#1b1c1a" }}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Nav;
