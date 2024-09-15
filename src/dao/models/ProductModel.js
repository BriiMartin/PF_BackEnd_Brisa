const mongoose = require("mongoose");
const paginate = require ("mongoose-paginate-v2")

const productSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    price: Number,
    //thumbnails
    code: {
      type: String,
      unique: true,
    },
    stock: Number,
    status: Boolean,
    category: String
  },
  {
    timestamps: true,
  }
)

productSchema.plugin(paginate)

module.exports = mongoose.model("products", productSchema)
