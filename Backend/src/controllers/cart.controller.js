import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";
import { stockOfVariant } from "../dao/product.dao.js";
import mongoose from "mongoose";
import { createOrder } from "../services/payment.service.js";
import { getCartDetails } from "../dao/cart.dao.js";
import paymentModel from "../models/payment.model.js";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils.js";
import { config } from "../config/config.js";

export const addToCart = async (req, res) => {
  const { productId, variantId } = req.params;
  const { quantity = 1 } = req.body;

  const product = await productModel.findOne({
    _id: productId,
    "variants._id": variantId,
  });

  if (!product) {
    return res.status(404).json({
      message: "Product or variant not found",
      success: false,
    });
  }

  const stock = await stockOfVariant(productId, variantId);

  const cart =
    (await cartModel.findOne({ user: req.user._id })) ||
    (await cartModel.create({ user: req.user._id }));

  const isProductAlreadyInCart = cart.items.some(
    (item) =>
      item.product.toString() === productId &&
      item.variant?.toString() === variantId,
  );

  if (isProductAlreadyInCart) {
    const quantityInCart = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.variant?.toString() === variantId,
    ).quantity;
    if (quantityInCart + quantity > stock) {
      return res.status(400).json({
        message: `Only ${stock} items left in stock. and you already have ${quantityInCart} items in your cart`,
        success: false,
      });
    }

    await cartModel.findOneAndUpdate(
      {
        user: req.user._id,
        "items.product": productId,
        "items.variant": variantId,
      },
      { $inc: { "items.$.quantity": quantity } },
      { new: true },
    );

    return res.status(200).json({
      message: "Cart updated successfully",
      success: true,
    });
  }

  if (quantity > stock) {
    return res.status(400).json({
      message: `Only ${stock} items left in stock`,
      success: false,
    });
  }

  const chosenVariant = product.variants.id(variantId);

  cart.items.push({
    product: productId,
    variant: variantId,
    quantity,
    price: chosenVariant?.price?.amount ? chosenVariant.price : product.price,
  });

  await cart.save();

  return res.status(200).json({
    message: "Product added to cart successfully",
    success: true,
  });
};

export const getCart = async (req, res) => {
  const user = req.user;

  let cart = await getCartDetails(user._id);

  if (!cart) {
    cart =
      (await cartModel.findOne({ user: user._id })) ||
      (await cartModel.create({ user: user._id }));
  }

  return res.status(200).json({
    message: "Cart fetched successfully",
    success: true,
    cart,
  });
};

export const incrementCartItemQuantity = async (req, res) => {
  const { productId, variantId } = req.params;

  const product = await productModel.findOne({
    _id: productId,
    "variants._id": variantId,
  });

  if (!product) {
    return res.status(404).json({
      message: "Product or variant not found",
      success: false,
    });
  }

  const cart = await cartModel.findOne({ user: req.user._id });

  if (!cart) {
    return res.status(404).json({
      message: "Cart not found",
      success: false,
    });
  }

  const stock = await stockOfVariant(productId, variantId);

  const itemQuantityInCart =
    cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.variant?.toString() === variantId,
    )?.quantity || 0;

  if (itemQuantityInCart + 1 > stock) {
    return res.status(400).json({
      message: `Only ${stock} items left in stock. and you already have ${itemQuantityInCart} items in your cart`,
      success: false,
    });
  }

  await cartModel.findOneAndUpdate(
    {
      user: req.user._id,
      "items.product": productId,
      "items.variant": variantId,
    },
    { $inc: { "items.$.quantity": 1 } },
    { new: true },
  );

  return res.status(200).json({
    message: "Cart item quantity incremented successfully",
    success: true,
  });
};

export const decrementCartItemQuantity = async (req, res) => {
  const { productId, variantId } = req.params;

  // Only matches if the item exists AND its quantity is above 1,
  // so the quantity can never drop below 1 (use remove for that)
  const cart = await cartModel.findOneAndUpdate(
    {
      user: req.user._id,
      items: {
        $elemMatch: {
          product: productId,
          variant: variantId,
          quantity: { $gt: 1 },
        },
      },
    },
    { $inc: { "items.$.quantity": -1 } },
    { new: true },
  );

  if (!cart) {
    return res.status(400).json({
      message: "Quantity can't go below 1. Use Remove to delete this item.",
      success: false,
    });
  }

  return res.status(200).json({
    message: "Cart item quantity decremented successfully",
    success: true,
  });
};

export const removeCartItem = async (req, res) => {
  const { productId, variantId } = req.params;

  const cart = await cartModel.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { items: { product: productId, variant: variantId } } },
    { new: true },
  );

  if (!cart) {
    return res.status(404).json({
      message: "Cart not found",
      success: false,
    });
  }

  return res.status(200).json({
    message: "Item removed from cart successfully",
    success: true,
  });
};

export const createOrderController = async (req, res) => {
  const cart = await getCartDetails(req.user._id);

  if (!cart) {
    return res.status(400).json({
      message: "Cart is empty",
      success: false,
    });
  }

  const order = await createOrder({
    amount: cart.totalPrice,
    currency: cart.currency,
  });

  const payment = await paymentModel.create({
    user: req.user._id,
    razorpay: {
      orderId: order.id,
    },
    price: {
      amount: cart.totalPrice,
      currency: cart.currency,
    },
    orderItems: cart.items.map((item) => ({
      title: item.product.title,
      productId: item.product._id,
      variantId: item.variant,
      quantity: item.quantity,
      images: item.product.variants.images || item.product.images,
      description: item.product.description,
      price: {
        amount: item.product.variants.price.amount || item.product.price.amount,
        currency:
          item.product.variants.price.currency || item.product.price.currency,
      },
    })),
  });

  return res.status(200).json({
    message: "Order created successfully",
    success: true,
    order,
  });
};

export const createBuyNowOrderController = async (req, res) => {
  const { productId, variantId } = req.params;

  const product = await productModel.findById(productId);

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
      success: false,
    });
  }

  const variant = product.variants.id(variantId);

  if (!variant) {
    return res.status(404).json({
      message: "Variant not found",
      success: false,
    });
  }

  if (variant.stock < 1) {
    return res.status(400).json({
      message: "This item is out of stock",
      success: false,
    });
  }

  // variant price if it has one, otherwise the product's base price
  const price = variant.price?.amount ? variant.price : product.price;
  const { amount, currency } = price;

  const order = await createOrder({ amount, currency });

  await paymentModel.create({
    user: req.user._id,
    razorpay: {
      orderId: order.id,
    },
    price: { amount, currency },
    source: "buy-now",
    orderItems: [
      {
        title: product.title,
        productId: product._id,
        variantId: variant._id,
        quantity: 1,
        images: (variant.images?.length ? variant.images : product.images).map(
          (img) => ({ url: img.url }),
        ),
        description: product.description,
        price: { amount, currency },
      },
    ],
  });

  return res.status(200).json({
    message: "Order created successfully",
    success: true,
    order,
  });
};

export const verifyOrderController = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  // only the buyer who created this order may verify it
  const payment = await paymentModel.findOne({
    "razorpay.orderId": razorpay_order_id,
    user: req.user._id,
    status: "pending",
  });

  if (!payment) {
    return res.status(400).json({
      message: "Payment not found",
      success: false,
    });
  }

  const isPaymentValid = validatePaymentVerification(
    {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
    },
    razorpay_signature,
    config.RAZORPAY_KEY_SECRET,
  );

  // invalid signature: mark failed and STOP. No stock or cart changes here.
  if (!isPaymentValid) {
    payment.status = "failed";
    await payment.save();

    return res.status(400).json({
      message: "Payment verification failed",
      success: false,
    });
  }

  // Claim the payment atomically: if two verify requests arrive together,
  // only one of them can move it from "pending" to "paid" and run the steps below.
  const paidPayment = await paymentModel.findOneAndUpdate(
    { _id: payment._id, status: "pending" },
    {
      $set: {
        status: "paid",
        "razorpay.paymentId": razorpay_payment_id,
        "razorpay.signature": razorpay_signature,
      },
    },
    { new: true },
  );

  if (!paidPayment) {
    return res.status(400).json({
      message: "Payment already processed",
      success: false,
    });
  }

  // 1) reduce stock for everything that was bought (never below zero)
  await Promise.all(
    paidPayment.orderItems.map(async (item) => {
      const result = await productModel.updateOne(
        {
          _id: item.productId,
          variants: {
            $elemMatch: { _id: item.variantId, stock: { $gte: item.quantity } },
          },
        },
        { $inc: { "variants.$.stock": -item.quantity } },
      );
      if (result.modifiedCount === 0) {
        console.warn(
          `Stock could not be reduced for product ${item.productId} variant ${item.variantId}`,
        );
      }
    }),
  );

  // 2) a paid CART checkout empties those items from the cart (Buy Now never touched the cart)
  if (paidPayment.source === "cart") {
    await cartModel.updateOne(
      { user: paidPayment.user },
      {
        $pull: {
          items: {
            $or: paidPayment.orderItems.map((i) => ({
              product: i.productId,
              variant: i.variantId,
            })),
          },
        },
      },
    );
  }

  return res.status(200).json({
    message: "Payment verified successfully",
    success: true,
  });
};