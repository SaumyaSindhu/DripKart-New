import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useProduct } from '../hooks/useProduct';
import { useCart } from '../../cart/hook/useCart';

// Add-to-cart button look + text for each state
const ADD_BTN_STYLES = {
    idle: 'bg-[#1b1c1a] text-[#fbf9f6] hover:bg-[#C9A96E] hover:text-[#1b1c1a]',
    loading: 'bg-[#1b1c1a] text-[#fbf9f6] cursor-wait',
    success: 'bg-[#4a7c59] text-white',
    error: 'bg-[#b42318] text-white',
    signin: 'bg-[#b42318] text-white',
};

const ADD_BTN_LABELS = {
    idle: 'Add to Cart',
    loading: 'Adding',
    success: 'Added to Cart',
    error: "Couldn't add. Try again",
    signin: 'Please sign in first',
};

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const navigate = useNavigate();
  const { handleGetProductById } = useProduct();
  const { handleAddItem, handleGetCart } = useCart();
  const [addStatus, setAddStatus] = useState("idle");
  const [touchStartX, setTouchStartX] = useState(null); // for swiping the gallery on mobile

  async function fetchProductDetails() {
    try {
      const data = await handleGetProductById(productId);
      // Handle both cases depending on how API is structured
      setProduct(data?.product || data);
    } catch (error) {
      console.error("Failed to fetch product details", error);
    }
  }

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  useEffect(() => {
    if (product?.variants?.length > 0) {
      setSelectedAttributes(product.variants[0].attributes || {});
    }
  }, [product]);

  const activeVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    return product.variants.find((v) => {
      if (!v.attributes) return false;
      const vKeys = Object.keys(v.attributes);
      const sKeys = Object.keys(selectedAttributes);
      const isMatch = vKeys.every(
        (k) => v.attributes[k] === selectedAttributes[k],
      );
      // If they don't have exactly the same keys, they shouldn't perfectly match,
      // but we might only care about matching what's available.
      return vKeys.length === sKeys.length && isMatch;
    });
  }, [product, selectedAttributes]);

  console.log({ product, activeVariant });

  const availableAttributes = useMemo(() => {
    if (!product?.variants) return {};
    const attrs = {};
    product.variants.forEach((variant) => {
      if (variant.attributes) {
        Object.entries(variant.attributes).forEach(([key, value]) => {
          if (!attrs[key]) attrs[key] = new Set();
          attrs[key].add(value);
        });
      }
    });
    Object.keys(attrs).forEach((key) => {
      attrs[key] = Array.from(attrs[key]);
    });
    return attrs;
  }, [product]);

  useEffect(() => {
    setSelectedImage(0);
  }, [activeVariant]);

  const handleAttributeChange = (attrName, value) => {
    const newAttrs = { ...selectedAttributes, [attrName]: value };

    // Find if an exact match exists for this combination
    const exactMatch = product.variants.find((v) => {
      const vAttrs = v.attributes || {};
      return (
        Object.keys(newAttrs).every((k) => newAttrs[k] === vAttrs[k]) &&
        Object.keys(vAttrs).every((k) => newAttrs[k] === vAttrs[k])
      );
    });

    if (exactMatch) {
      setSelectedAttributes(exactMatch.attributes);
    } else {
      // Find any variant that has this newly selected attribute to fallback nicely
      const fallbackVariant = product.variants.find(
        (v) => v.attributes && v.attributes[attrName] === value,
      );
      if (fallbackVariant) {
        setSelectedAttributes(fallbackVariant.attributes);
      } else {
        setSelectedAttributes(newAttrs);
      }
    }
  };

      if (!product) {
        return (
          <div
            className="min-h-screen selection:bg-[#C9A96E]/30 pb-24"
            style={{ backgroundColor: "#fbf9f6" }}
            aria-hidden="true"
          >
            <div className="max-w-7xl mx-auto px-8 lg:px-16 xl:px-24 pt-12 lg:pt-20">
              <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
                <div className="w-full lg:w-[70%] flex flex-col-reverse md:flex-row gap-4 lg:gap-6">
                  <div className="flex flex-row md:flex-col gap-4 md:w-20 lg:w-24">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="skeleton w-20 md:w-full aspect-[4/5]"
                      />
                    ))}
                  </div>
                  <div className="skeleton w-full aspect-[4/5]" />
                </div>
                <div className="w-full lg:w-[30%] flex flex-col gap-5 pt-4">
                  <div className="skeleton h-14 w-4/5" />
                  <div className="skeleton h-4 w-32" />
                  <div className="skeleton h-px w-full my-4" />
                  <div className="skeleton h-3 w-16" />
                  <div className="flex gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="skeleton h-10 w-12" />
                    ))}
                  </div>
                  <div className="skeleton h-14 w-full mt-6" />
                </div>
              </div>
            </div>
          </div>
        );
      }

  console.log(product);

  // Fallbacks
  const displayImages =
    activeVariant?.images && activeVariant.images.length > 0
      ? activeVariant.images
      : product.images && product.images.length > 0
        ? product.images
        : [{ url: "/snitch_editorial_warm.png" }];

  const displayPrice = activeVariant?.price?.amount
    ? activeVariant.price
    : product.price;

  const onAddToCart = async () => {
    if (addStatus !== "idle") return; // ignore clicks while animating

    if (!activeVariant) {
      setAddStatus("error");
      setTimeout(() => setAddStatus("idle"), 2200);
      return;
    }

    setAddStatus("loading");
    try {
      await handleAddItem({
        productId: product._id,
        variantId: activeVariant._id,
      });
      handleGetCart().catch(() => {}); // refresh navbar cart badge
      setAddStatus("success");
    } catch (error) {
      console.error("Add to cart failed", error);
      setAddStatus(error?.response?.status === 401 ? "signin" : "error");
    }
    setTimeout(() => setAddStatus("idle"), 2200);
  };

  return (
    <>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <div
        className="min-h-screen selection:bg-[#C9A96E]/30 pb-24"
        style={{
          backgroundColor: "#fbf9f6",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div className="max-w-7xl mx-auto px-8 lg:px-16 xl:px-24 pt-12 lg:pt-20">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
            {/* ── LEFT: Image Gallery ── */}
            <div className="w-full lg:w-[70%] flex flex-col-reverse md:flex-row gap-4 lg:gap-6">
              {/* Thumbnails (Vertical on Desktop, Horizontal on Mobile) */}
              {displayImages.length > 1 && (
                <div className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 scrollbar-hide w-full md:w-20 lg:w-24 flex-shrink-0 md:max-h-[calc(100vh-200px)]">
                  {displayImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-20 md:w-full aspect-[4/5] overflow-hidden transition-all duration-300 ${selectedImage === idx ? "opacity-100 ring-1 ring-[#C9A96E] ring-offset-2" : "opacity-50 hover:opacity-100"}`}
                      style={{
                        backgroundColor: "#f5f3f0",
                        "--tw-ring-offset-color": "#fbf9f6",
                      }}
                    >
                      <img
                        src={img.url}
                        alt={`View ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image (swipe on mobile, fades when it changes) */}
              <div
                className="relative w-full aspect-4/5 overflow-hidden group"
                style={{ backgroundColor: "#f5f3f0" }}
                onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  if (touchStartX === null || displayImages.length < 2) return;
                  const dx = e.changedTouches[0].clientX - touchStartX;
                  if (Math.abs(dx) > 40) {
                    setSelectedImage((prev) =>
                      dx < 0
                        ? prev === displayImages.length - 1
                          ? 0
                          : prev + 1
                        : prev === 0
                          ? displayImages.length - 1
                          : prev - 1,
                    );
                  }
                  setTouchStartX(null);
                }}
              >
                <img
                  key={
                    displayImages[selectedImage]?.url || displayImages[0].url
                  }
                  src={
                    displayImages[selectedImage]?.url || displayImages[0].url
                  }
                  alt={product.title}
                  className="img-fade w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                />
                {displayImages.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setSelectedImage((prev) =>
                          prev === 0 ? displayImages.length - 1 : prev - 1,
                        )
                      }
                      className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 border"
                      style={{
                        backgroundColor: "rgba(251,249,246,0.8)",
                        borderColor: "#e4e2df",
                        color: "#1b1c1a",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#fbf9f6")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "rgba(251,249,246,0.8)")
                      }
                      aria-label="Previous image"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.2"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImage((prev) =>
                          prev === displayImages.length - 1 ? 0 : prev + 1,
                        )
                      }
                      className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 border"
                      style={{
                        backgroundColor: "rgba(251,249,246,0.8)",
                        borderColor: "#e4e2df",
                        color: "#1b1c1a",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#fbf9f6")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "rgba(251,249,246,0.8)")
                      }
                      aria-label="Next image"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>

                    {/* Dots (mobile only; desktop has thumbnails) */}
                    <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 md:hidden">
                      {displayImages.map((_, idx) => (
                        <span
                          key={idx}
                          className="h-1 rounded-full transition-all duration-300"
                          style={{
                            width: selectedImage === idx ? "20px" : "6px",
                            backgroundColor:
                              selectedImage === idx
                                ? "#C9A96E"
                                : "rgba(251,249,246,0.85)",
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── RIGHT: Product Details ── */}
            <div className="w-full lg:w-[30%] lg:sticky lg:top-24 flex flex-col pt-4">
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-light leading-[1.05] mb-6"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: "#1b1c1a",
                }}
              >
                {product.title}
              </h1>

              <div className="mb-8">
                <span
                  className="text-sm uppercase tracking-[0.2em] font-medium"
                  style={{ color: "#1b1c1a" }}
                >
                  {displayPrice?.currency}{" "}
                  {displayPrice?.amount?.toLocaleString()}
                </span>
              </div>

              <div
                className="h-px w-full mb-8"
                style={{ backgroundColor: "#e4e2df" }}
              />

              {/* Options/Variants */}
              {Object.entries(availableAttributes).map(([attrName, values]) => (
                <div key={attrName} className="mb-6">
                  <h3
                    className="text-[10px] uppercase tracking-[0.24em] font-medium mb-3"
                    style={{ color: "#C9A96E" }}
                  >
                    {attrName}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {values.map((val) => {
                      const isSelected = selectedAttributes[attrName] === val;
                      return (
                        <button
                          key={val}
                          onClick={() => handleAttributeChange(attrName, val)}
                          className={`px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-300 border ${isSelected ? "border-[#1b1c1a] bg-[#1b1c1a] text-[#fbf9f6]" : "border-[#d0c5b5] text-[#1b1c1a] hover:border-[#1b1c1a]"}`}
                          style={
                            isSelected ? {} : { backgroundColor: "transparent" }
                          }
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Stock Information */}
              {activeVariant && activeVariant.stock !== undefined && (
                <div className="mb-6">
                  <span
                    className={`text-[10px] uppercase tracking-[0.2em] font-medium ${activeVariant.stock > 0 ? "text-green-700" : "text-red-700"}`}
                  >
                    {activeVariant.stock > 0
                      ? `${activeVariant.stock} in stock`
                      : "Out of stock"}
                  </span>
                </div>
              )}

              <div className="mb-12">
                <h3
                  className="text-[10px] uppercase tracking-[0.24em] font-medium mb-4"
                  style={{ color: "#C9A96E" }}
                >
                  The Details
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#7A6E63" }}
                >
                  {product.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-4 mt-auto">
                <button
                  type="button"
                  onClick={onAddToCart}
                  disabled={addStatus === "loading"}
                  aria-live="polite"
                  className={`w-full py-4 text-[11px] uppercase tracking-[0.25em] font-medium transition-all duration-500 ${ADD_BTN_STYLES[addStatus]} ${addStatus === "error" || addStatus === "signin" ? "shake" : ""}`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {/* key restarts the label animation each time the state changes */}
                  <span
                    key={addStatus}
                    className="label-in inline-flex items-center justify-center gap-2.5"
                  >
                    {addStatus === "loading" && (
                      <svg
                        className="animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <path d="M21 12a9 9 0 1 1-6.2-8.55" />
                      </svg>
                    )}
                    {addStatus === "success" && (
                      <span className="pop-in inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path className="check-draw" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                    {ADD_BTN_LABELS[addStatus]}
                  </span>
                </button>

                <button
                  className="w-full py-4 text-[11px] uppercase tracking-[0.25em] font-medium transition-all duration-300 border"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "#d0c5b5",
                    color: "#1b1c1a",
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#C9A96E";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#d0c5b5";
                  }}
                >
                  Buy Now
                </button>
              </div>

              {/* Extra elegant details */}
              <div
                className="mt-14 space-y-4 text-[10px] uppercase tracking-[0.1em]"
                style={{ color: "#B5ADA3" }}
              >
                <div
                  className="flex justify-between border-b pb-3"
                  style={{ borderColor: "#e4e2df" }}
                >
                  <span>Shipping</span>
                  <span>Complimentary over INR 15,000</span>
                </div>
                <div
                  className="flex justify-between border-b pb-3"
                  style={{ borderColor: "#e4e2df" }}
                >
                  <span>Returns</span>
                  <span>Within 14 days of delivery</span>
                </div>
                <div
                  className="flex justify-between border-b pb-3"
                  style={{ borderColor: "#e4e2df" }}
                >
                  <span>Authenticity</span>
                  <span>100% Guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;