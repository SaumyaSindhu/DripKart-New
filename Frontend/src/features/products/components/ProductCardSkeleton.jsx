import React from "react";

const ProductCardSkeleton = () => {
  return (
    <div className="flex flex-col" aria-hidden="true">
      <div className="skeleton aspect-[4/5] mb-5" />
      <div className="skeleton h-5 w-3/4 mb-3" />
      <div className="skeleton h-3 w-1/3" />
    </div>
  );
};

export default ProductCardSkeleton;
