const ProductModel = require("./models/ProductModel");
const productsModel = require("./models/ProductModel");

class ProductManager {
  
  static async getBy(filtro = {}) {
    return await productsModel.find(filtro);
  }
  static async getByID(id) {
    return await productsModel.findOne({_id:id});
  }

  static async getProducts(limit, page, filter, sortOptions) {
    return await productsModel.paginate(filter, {
      lean: true,
      page: Number(page),
      limit: Number(limit),
      sort: sortOptions,
    });
  }

  static async addProduct(product) {
    return await productsModel.create(product);
  }

  static async updateProduct(id, aModificar = {}) {
    const product = await productsModel.findByIdAndUpdate(id, aModificar, { new: true });
    if (!product) {
      throw new Error(`Error: no existe id ${id}`);
    }
    return product;
  }

  static async deleteProduct(id) {
        return await ProductModel.deleteOne({ _id: id });
  }
}

module.exports = ProductManager;
