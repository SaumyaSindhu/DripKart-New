import "dotenv/config";
import mongoose from "mongoose";
import userModel from "../src/models/user.model.js";
import productModel from "../src/models/product.model.js";

const sellerEmail = process.env.SEED_SELLER_EMAIL?.trim();
if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing from Backend/.env");
if (!sellerEmail) throw new Error("SEED_SELLER_EMAIL is missing from Backend/.env");

function plainAttributes(attributes) {
  if (attributes instanceof Map) return Object.fromEntries(attributes.entries());
  if (attributes && typeof attributes.toObject === "function") return attributes.toObject();
  return attributes || {};
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const seller = await userModel.findOne({
    email: sellerEmail,
  }).select("fullname email role");

  if (!seller) throw new Error(`Seller not found: ${sellerEmail}`);
  if (seller.role !== "seller") throw new Error(`${sellerEmail} is not a seller account`);

  const products = await productModel.find({ seller: seller._id })
    .select("title price images variants")
    .sort({ title: 1 })
    .lean();

  const report = products.map((product) => {
    const colors = new Map();
    for (const variant of product.variants || []) {
      const attrs = plainAttributes(variant.attributes);
      const color = attrs.Color || "(no Color attribute)";
      if (!colors.has(color)) colors.set(color, { sizes: [], imageCounts: [] });
      colors.get(color).sizes.push(attrs.Size || "?");
      colors.get(color).imageCounts.push((variant.images || []).length);
    }
    return {
      title: product.title,
      price: product.price,
      productImageCount: (product.images || []).length,
      colors: Object.fromEntries([...colors.entries()].map(([color, data]) => [
        color,
        {
          sizes: [...new Set(data.sizes)].sort(),
          variantImageCounts: [...new Set(data.imageCounts)],
        },
      ])),
    };
  });

  console.log(JSON.stringify({ seller: seller.email, totalProducts: products.length, products: report }, null, 2));
}

main().catch((error) => {
  console.error("Catalogue audit failed:", error.message);
  process.exitCode = 1;
}).finally(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
});
