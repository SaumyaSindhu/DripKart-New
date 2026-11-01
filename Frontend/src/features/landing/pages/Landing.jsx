import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useProduct } from "../../products/hooks/useProduct";
import HeroSlider from "../components/HeroSlider";
import BigMarquee from "../components/BigMarquee";
import NewArrivals from "../components/NewArrivals";
import EditorialTiles from "../components/EditorialTiles";
import BrandStatement from "../components/BrandStatement";
import Footer from "../../Shared/Components/Footer";

const Landing = () => {
  const products = useSelector((state) => state.product.products);
  const { handleGetAllProducts } = useProduct();

  useEffect(() => {
    handleGetAllProducts();
  }, []);

  // newest first (copy before sorting: redux state is read-only)
  const latest = useMemo(() => {
    return [...(products || [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [products]);

  return (
    <>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <div
        className="min-h-screen selection:bg-[#C9A96E]/30"
        style={{
          backgroundColor: "#fbf9f6",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <HeroSlider products={latest.slice(0, 4)} />
        <BigMarquee />
        <NewArrivals products={latest.slice(0, 10)} />
        <EditorialTiles products={[...latest].reverse().slice(0, 3)} />
        <BrandStatement />
        <Footer />
      </div>
    </>
  );
};

export default Landing;
