import "dotenv/config";
import mongoose from "mongoose";
import ImageKit, { toFile } from "@imagekit/nodejs";
import userModel from "../src/models/user.model.js";
import productModel from "../src/models/product.model.js";
import { seedProducts } from "./productSeedData.js";

const REQUIRED_ENV = ["MONGO_URI", "IMAGEKIT_PRIVATE_KEY", "SEED_SELLER_EMAIL"];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`${key} is missing from Backend/.env`);
  }
}

const imageKit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

const SIZES = ["S", "M", "L", "XL", "XXL"];
const DEFAULT_CURRENCY = "INR";
const IMAGE_FOLDER = "/dripkart/products/";

function buildVariants(colors) {
  return colors.flatMap((color) =>
    SIZES.map((size, sizeIndex) => ({
      attributes: { Size: size, Color: color },
      stock: 8 + ((sizeIndex * 3 + color.length) % 13),
      // Product-level images are used as the fallback by the existing UI.
      images: [],
    })),
  );
}

async function uploadProductImage(imageUrl, productTitle) {
  const response = await fetch(imageUrl, {
    signal: AbortSignal.timeout(30000),
    headers: { "User-Agent": "DripKart-ProductSeeder/1.0" },
  });

  if (!response.ok) {
    throw new Error(
      `Image download failed (${response.status}) for "${productTitle}"`,
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Image URL did not return an image for "${productTitle}"`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error(`Downloaded image is empty for "${productTitle}"`);
  }

  const safeName = productTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const uploaded = await imageKit.files.upload({
    file: await toFile(buffer, `${safeName}.jpg`),
    fileName: `${safeName}.jpg`,
    folder: IMAGE_FOLDER,
    useUniqueFileName: true,
  });

  if (!uploaded?.url) {
    throw new Error(`ImageKit did not return a URL for "${productTitle}"`);
  }

  return uploaded.url;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const sellerEmail = process.env.SEED_SELLER_EMAIL.trim();
  const escapedEmail = sellerEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const seller = await userModel.findOne({
    email: { $regex: `^${escapedEmail}$`, $options: "i" },
  });

  if (!seller) {
    throw new Error(
      `No user found for SEED_SELLER_EMAIL="${process.env.SEED_SELLER_EMAIL}". Register this account in DripKart first.`,
    );
  }

  if (seller.role !== "seller") {
    throw new Error(
      `The account ${seller.email} is not a seller. Register/select a seller account before seeding.`,
    );
  }

  let created = 0;
  let skipped = 0;

  for (const item of seedProducts) {
    const alreadyExists = await productModel.exists({
      seller: seller._id,
      title: item.title,
    });

    if (alreadyExists) {
      console.log(`SKIP  ${item.title} (already seeded for this seller)`);
      skipped += 1;
      continue;
    }

    console.log(`Uploading image: ${item.title}`);
    const imageUrl = await uploadProductImage(item.imageUrl, item.title);

    await productModel.create({
      title: item.title,
      description: item.description,
      seller: seller._id,
      price: {
        amount: item.priceAmount,
        currency: DEFAULT_CURRENCY,
      },
      images: [{ url: imageUrl }],
      variants: buildVariants(item.colors),
    });

    console.log(`CREATED  ${item.title}`);
    created += 1;
  }

  console.log("\nDripKart product seeding complete.");
  console.log(`Seller: ${seller.fullname} (${seller.email})`);
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Catalogue size in seed file: ${seedProducts.length}`);
}

seed()
  .catch((error) => {
    console.error("\nProduct seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  });
