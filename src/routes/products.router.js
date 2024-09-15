const { Router } = require("express");
const ProductManager = require("../dao/ProductManager");
const { isValidObjectId } = require("mongoose");
const ProductModel = require("../dao/models/ProductModel");
const config = require("../config/config.js");
const PORT = config.PORT;

const router = Router();

router.get("/", async (req, res) => {
  let { limit, page, sort, query } = req.query;
  if (!limit || isNaN(Number(limit))) {
    limit = 10;
  }
  if (!page || isNaN(Number(page))) {
    page = 1;
  }

  let filter = {};
  if (query) {
    filter = { category: query, stock: { $gt: 0 } }; // Filtra por categoría y productos con stock
  }

  let sortOptions = {};
  if (sort && !isNaN(Number(sort))) {
    sortOptions = { price: Number(sort) }; // Ordenamos por precio
  }

  try {
    let products = await ProductManager.getProducts(
      limit,
      page,
      filter,
      sortOptions
    );
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({
      status: "success",
      payload: products.docs, // Lista de productos devueltos
      totalPages: products.totalPages,
      prevPage: products.prevPage,
      nextPage: products.nextPage,
      page: products.page,
      hasPrevPage: products.hasPrevPage,
      hasNextPage: products.hasNextPage,
      prevLink: products.hasPrevPage
        ? `http://localhost:${PORT}/api/products?limit=${limit}&page=${
            products.prevPage
          }&sort=${sort || ""}&query=${query || ""}`
        : null,
      nextLink: products.hasNextPage
        ? `http://localhost:${PORT}/api/products?limit=${limit}&page=${
            products.nextPage
          }&sort=${sort || ""}&query=${query || ""}`
        : null,
    });
  } catch (error) {
    return `que paso... ${error.message}`;
  }
});
router.get("/:pid", async (req, res) => {
  let { pid } = req.params;
  if (!isValidObjectId(pid)) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: `Ingrese un ID valido de producto` });
  }

  let products = await ProductManager.getByID(pid);
  if (!products) {
    return res.status(404).send(`Producto com Id ${pid} no encontrado`);
  }
  res.status(200).send(products);
});

router.post("/", async (req, res) => {
  let {
    id,
    title,
    description,
    price,
    //thumbnails,
    code,
    stock,
    status,
    category,
  } = req.body;
  if (
    id ||
    !title ||
    typeof title !== "string" ||
    !description ||
    typeof description !== "string" ||
    !price ||
    typeof price !== "number" ||
    //!thumbnails ||
    //!Array.isArray(thumbnails) ||
    !code ||
    typeof code !== "string" ||
    !stock ||
    typeof stock !== "number" ||
    !status ||
    typeof status !== "boolean" ||
    !category ||
    typeof category !== "string"
  ) {
    res.setHeader("Content-Type", "application/json");
    return res
      .status(400)
      .json({ error: `Parametros invalidos, por favor verifica nuevamente` });
  }
  // Valido si ya existe el code en otro producto

  const existproduct = await ProductModel.findOne({ code: code.toLowerCase() });
  if (existproduct) {
    res.setHeader("Content-Type", "application/json");
    return res
      .status(400)
      .json({ error: `Ya existe un producto con el código: ${code}` });
  }

  try {
    let productNew = await ProductManager.addProduct({
      title,
      description,
      price,
      //thumbnails,
      code,
      stock,
      status,
      category,
    });

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ productNew });
  } catch (error) {
    console.log(error);
    res.setHeader("Content-Type", "application/json");
    return res.status(500).json({
      error: `Error inesperado en el servidor - Intente más tarde, o contacte a su administrador`,
      detalle: `${error.message}`,
    });
  }
});

router.put("/:pid", async (req, res) => {
  const { pid } = req.params;
  const { title, description, price, code, stock, status, category } = req.body;

  // Validar el ID del producto
  if (!isValidObjectId(pid)) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: `Ingrese un ID válido de producto` });
  }

  // Validar que el campo _id no se esté modificando
  if (req.body._id) {
    return res.status(400).json({ error: `No se puede modificar el campo _id` });
  }

  // Validar que el código sea único
  if (code) {
    try {
      let existingProducts = await ProductManager.getBy({ code: code });
      if (existingProducts && existingProducts.length > 0 && existingProducts[0]._id.toString() !== pid) {
        return res.status(400).json({ error: `Ya existe otro producto con el código ${code}` });
      }
    } catch (error) {
      console.log(error);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({
        error: `Error al validar el código`,
        detalle: `${error.message}`,
      });
    }
  }

  try {
    // Obtener el producto por ID
    let product = await ProductManager.getByID(pid);
    if (!product) {
      return res.status(404).json({ error: `Producto con ID ${pid} no encontrado` });
    }

    // Actualizar el producto
    let updatedProduct = await ProductManager.updateProduct(pid, {
      title,
      description,
      price,
      code,
      stock,
      status,
      category,
    });

    // Devolver el producto actualizado
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ updatedProduct });
  } catch (error) {
    console.log(error);
    res.setHeader("Content-Type", "application/json");
    return res.status(500).json({
      error: `Error inesperado en el servidor - Intente más tarde, o contacte a su administrador`,
      detalle: `${error.message}`,
    });
  }
});

router.delete("/:pid", async (req, res) => {
  let { pid } = req.params;
  if (!isValidObjectId(pid)) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: `Ingrese un ID valido` });
  }

  let product = await ProductManager.getByID(pid);
  if (!product) {
    return res.status(404).send(`Producto com Id ${pid} no encontrado`);
  }
  try {
    await ProductManager.deleteProduct(pid);
    res.status(200).json({ message: `Producto com Id ${pid} eliminado`});
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar el producto",
      error: error.message,
    });
  }
});

module.exports = { router };
