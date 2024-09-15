const cartsModel = require("./models/CartModel.js");

class CartManager {
  static async getCarts() {
    return await cartsModel.find();
  }

  static async getCartsBy(id) {
    return await cartsModel.findOne({ _id: id });
  }

  // este seria el create card
  static async addProductCart() {
    return await cartsModel.create({ products: [] });
  }

  // y este seria el addProductToCart
  static async addProductToCart(cartId, productId) {
    return await cartsModel.findByIdAndUpdate(cartId, { $addToSet: { products: productId } }, { new: true });
  }
  static async updateCartProduct(id, cart) {
    return await cartsModel.updateOne({ _id: id }, cart);
  }
  
  static async deleteProduct(id) {
    return await cartsModel.deleteOne({ _id: id });
  }
  static async deleteCartProduct(cid, pid) {
    return await cartsModel.updateOne(
      { _id: cid },
      { $pull: { products: { product: pid } } }
    );
  }
}

module.exports = CartManager;
