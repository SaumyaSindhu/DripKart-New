import "dotenv/config";
import mongoose from "mongoose";
import userModel from "../src/models/user.model.js";
import productModel from "../src/models/product.model.js";
import { uploadFile } from "../src/services/storage.service.js";

const REQUIRED_ENV = ["MONGO_URI", "SEED_SELLER_EMAIL"];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`${key} is missing from Backend/.env`);
  }
}

const TARGET_PRODUCT_TITLE = "Essential Heavyweight Tee";
const TARGET_COLOR = "Black";
const IMAGE_FOLDER = "dripkart/product-gallery";

// Three distinct images exposed by the SNITCH product page.
// Use only for a private/local portfolio demo unless you have reuse permission.
const SOURCE_IMAGES = [
  {
    url: "https://cdn.shopify.com/s/files/1/0420/7073/7058/files/1_fbd772c9-7a31-4579-8ff7-151891aa7dc8.jpg?v=1787640410",
    fileName: "essential-heavyweight-tee-black-01.jpg",
  },
  {
    url: "https://cdn.shopify.com/s/files/1/0420/7073/7058/files/1_dd2736e2-9529-4caa-8617-354410aaeb2b.jpg?v=1780588318",
    fileName: "essential-heavyweight-tee-black-02.jpg",
  },
  {
    url: "https://cdn.shopify.com/s/files/1/0420/7073/7058/files/1_6653ab69-3b9d-44d8-98c0-52bed2418899.jpg?v=1787640348",
    fileName: "essential-heavyweight-tee-black-03.jpg",
  },
];

const APPLY_CHANGES = process.argv.includes("--apply");

function getAttribute(variant, key) {
  const attributes = variant.attributes;

  if (attributes instanceof Map) {
    return attributes.get(key);
  }

  if (typeof attributes?.get === "function") {
    return attributes.get(key);
  }

  return attributes?.[key];
}

async function downloadImage({ url, fileName }) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: {
      "User-Agent": "Mozilla/5.0 DripKartPortfolioDemo/1.0",
      Referer: "https://www.snitch.com/",
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed (${response.status}) for ${fileName}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(
      `Expected an image for ${fileName}, received "${contentType || "unknown"}"`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (!buffer.length) {
    throw new Error(`Downloaded image is empty: ${fileName}`);
  }

  return { buffer, fileName };
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const email = process.env.SEED_SELLER_EMAIL.trim();
  const seller = await userModel.findOne({
    email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });

  if (!seller) {
    throw new Error(`Seller account not found: ${email}`);
  }

  if (seller.role !== "seller") {
    throw new Error(`Account ${seller.email} is not registered as a seller.`);
  }

  const product = await productModel.findOne({
    seller: seller._id,
    title: TARGET_PRODUCT_TITLE,
  });

  if (!product) {
    throw new Error(
      `Seeded product "${TARGET_PRODUCT_TITLE}" was not found for ${seller.email}. Check the title and seller email.`,
    );
  }

  const matchingVariants = product.variants.filter(
    (variant) => getAttribute(variant, "Color") === TARGET_COLOR,
  );

  if (!matchingVariants.length) {
    throw new Error(
      `No "${TARGET_COLOR}" variants found on "${TARGET_PRODUCT_TITLE}". No changes were made.`,
    );
  }

  console.log(`Seller: ${seller.email}`);
  console.log(`Product: ${product.title}`);
  console.log(`Matching ${TARGET_COLOR} size variants: ${matchingVariants.length}`);
  console.log(`Images to upload: ${SOURCE_IMAGES.length}`);

  if (!APPLY_CHANGES) {
    console.log("\nDRY RUN ONLY — database and ImageKit were not changed.");
    console.log("If the target details above are correct, run:");
    console.log("node scripts/updateSeededProductGallery.js --apply");
    return;
  }

  // Download every source image before uploading or mutating the product.
  const downloadedImages = [];
  for (const source of SOURCE_IMAGES) {
    console.log(`Downloading ${source.fileName}`);
    downloadedImages.push(await downloadImage(source));
  }

  // Upload all images before changing MongoDB, so a failed upload leaves the product unchanged.
  const uploadedImages = [];
  for (const image of downloadedImages) {
    console.log(`Uploading ${image.fileName} to ImageKit`);
    const uploaded = await uploadFile({
      buffer: image.buffer,
      fileName: image.fileName,
      folder: IMAGE_FOLDER,
    });

    if (!uploaded?.url) {
      throw new Error(`ImageKit did not return a URL for ${image.fileName}`);
    }

    uploadedImages.push({ url: uploaded.url });
  }

  // Apply the same gallery to every size variant of the selected colour.
  for (const variant of matchingVariants) {
    variant.images = uploadedImages.map((image) => ({ ...image }));
  }

  // Keep the product card and fallback gallery aligned with the selected colour's first image.
  product.images = [{ url: uploadedImages[0].url }];

  product.markModified("variants");
  await product.save();

  console.log("\nGallery update completed.");
  console.log(`Updated variants: ${matchingVariants.length}`);
  console.log(`Images per matching variant: ${uploadedImages.length}`);
  console.log("Other colours and all other products were left unchanged.");
}

main()
  .catch((error) => {
    console.error("\nGallery update failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("MongoDB connection closed.");
    }
  });
