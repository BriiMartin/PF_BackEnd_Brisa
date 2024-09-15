const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    products: {
      type: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products",
          },
          quantity: Number,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

cartSchema.pre("findOne", function (){
  this.populate("products.product").lean()
})

module.exports = mongoose.model("carts", cartSchema);
