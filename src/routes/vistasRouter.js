const { Router } = require("express");
const router = Router();
const ProductManager = require("../dao/ProductManager");
const ProductModel = require("../dao/models/ProductModel");
const CartManager = require("../dao/CartManager");
const { isValidObjectId } = require("mongoose");


router.get("/products", async (req, res) => {
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

   let products = await ProductManager.getProducts(
      limit,
      page,
      filter,
      sortOptions
    );
    const totalPagesArr = Array.from({ length: products.totalPages }, (_, i) => i + 1);
    
    res.render("index",{
      payload: products.docs, // Lista de productos devueltos
      totalPages: products.totalPages,
      prevPage: products.prevPage,
      nextPage: products.nextPage,
      page: products.page,
      hasPrevPage: products.hasPrevPage,
      hasNextPage: products.hasNextPage,
      prevLink: products.hasPrevPage
        ? `http://localhost:8080/products?limit=${limit}&page=${
            products.prevPage
          }&sort=${sort || ""}&query=${query || ""}`
        : null,
      nextLink: products.hasNextPage
        ? `http://localhost:8080/products?limit=${limit}&page=${
            products.nextPage
          }&sort=${sort || ""}&query=${query || ""}`
        : null,
      
    });
});
router.get("/products/:pid", async (req, res) => {
  let {pid} = req.params;
  if (!isValidObjectId(pid)){
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: `Ingrese un ID valido` });}
  let product= await ProductManager.getByID(pid);
  console.log(product)
  res.setHeader("Content-Type", "text/html");
  res.status(200).render("product", {
    product,
  });
});

router.get("/carts/:cid", async (req, res) => {
  let {cid} = req.params;
  if (!isValidObjectId(cid)){
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: `Ingrese un ID valido` });}
  let result= await CartManager.getCartsBy(cid);
  let carts = result.products
  console.log(carts)
  res.setHeader("Content-Type", "text/html");
  res.status(200).render("cart", {
    cartId:result._id,
    carts,
  });
});

router.get("/realtimeproducts", async (req, res) => {
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
  }else {
    // Si no se especifica orden, ordenar por fecha de creación descendente
    sortOptions = { createdAt: -1 }; 
  }

   let products = await ProductManager.getProducts(
      limit,
      page,
      filter,
      sortOptions
    );
    const totalPagesArr = Array.from({ length: products.totalPages }, (_, i) => i + 1);
    
    res.render("realTimeProducts",{
      payload: products.docs, // Lista de productos devueltos
      totalPages: products.totalPages,
      prevPage: products.prevPage,
      nextPage: products.nextPage,
      page: products.page,
      hasPrevPage: products.hasPrevPage,
      hasNextPage: products.hasNextPage,
      prevLink: products.hasPrevPage
        ? `http://localhost:8080/realtimeproducts?limit=${limit}&page=${
            products.prevPage
          }&sort=${sort || ""}&query=${query || ""}`
        : null,
      nextLink: products.hasNextPage
        ? `http://localhost:8080/realtimeproducts?limit=${limit}&page=${
            products.nextPage
          }&sort=${sort || ""}&query=${query || ""}`
        : null,
      
    });
});

router.post("/realtimeproducts", async (req, res) => {
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

  // Validación de los parámetros
  if (
    id ||
    !title || typeof title !== "string" ||
    !description || typeof description !== "string" ||
    !price || typeof price !== "number" ||
    //!thumbnails || !Array.isArray(thumbnails) ||
    !code || typeof code !== "string" ||
    !stock || typeof stock !== "number" ||
    !status || typeof status !== "boolean" ||
    !category || typeof category !== "string"
  ) {
    return res
      .status(400)
      .json({ error: "Parámetros inválidos, por favor verifica nuevamente" });
  }

  try {
    // Verificar si ya existe el producto con el mismo código
    const existproduct = await ProductModel.findOne({ code: code.toLowerCase() });
    if (existproduct) {
      return res
        .status(400)
        .json({ error: `Ya existe un producto con el código: ${code}` });
    }

    // Agregar el nuevo producto
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

    // Emitir la actualización de productos al socket
    const updateProducts = await ProductManager.getProducts(undefined, undefined,{},{ createdAt: -1 });
    req.io.emit("updateProducts", updateProducts);

    return res.status(200).json({ productNew });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error inesperado en el servidor. Intente más tarde o contacte al administrador.",
      detalle: error.message,
    });
  }
});




module.exports = { router };
