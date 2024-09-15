const { Router } = require("express");
const CartManager = require("../dao/CartManager.js");
const { isValidObjectId } = require("mongoose");
const ProductManager = require("../dao/ProductManager.js");
const router = Router();

router.get("/", async (req, res) => {
  let carts = await CartManager.getCarts();
  res.status(200).send(carts);
});
router.post("/", async (req, res) => {
  try {
    let productNew = await CartManager.addProductCart();
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
// --- ok
router.get("/:cid", async (req, res) => {
  let { cid } = req.params;
  if (!isValidObjectId(cid)) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: `Ingrese un ID valido` });
  }

  let carts = await CartManager.getCartsBy(cid);
  if (!carts) {
    return res.status(404).send(`Producto com Id ${cid} not found`);
  }
  res.status(200).send(carts);
});

//--- ok.
router.put("/:cid", async (req, res) => {
  let { cid } = req.params;
  let { products } = req.body;

  // Valida cid
  if (!isValidObjectId(cid)) {
    return res.status(400).json({ error: `Ingrese un ID valido` });
  }

  // Valida que se proporciona un array de productos
  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: "Debes proporcionar un arreglo de productos" });
  }

  try {
    // Busca el carrito
    let cart = await CartManager.getCartsBy(cid);
    if (!cart) {
      return res.status(404).json({ error: `No existe cart con id ${cid}` });
    }

    // Validar cada producto en el array de productos
    for (let product of products) {
      let productExists = await ProductManager.getBy({ _id: product.product });
      if (!productExists) {
        return res.status(400).json({ error: `Producto con id ${product.product} no existe` });
      }
    }

    // Actualiza el carrito
    cart.products = products;

    // Guarda el carrito
    let resultado = await CartManager.updateCartProduct(cid, cart);
    if (resultado.modifiedCount > 0) {
      res.status(200).json({
        message: "Carrito actualizado con los nuevos productos",
        cart,
      });
    } else {
      return res.status(400).json({ error: "Fallo en la actualización del carrito" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error inesperado en el servidor - Intente más tarde",
      detalle: error.message,
    });
  }
});
//--- ok  
router.delete("/:cid", async (req, res) => {
  let { cid } = req.params;
  if (!isValidObjectId(cid)) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).json({ error: `Ingrese un ID valido` });
  }

  let carts = await CartManager.getCartsBy(cid);
  if (!carts) {
    return res.status(404).send(`Producto com Id ${cid} not found`);
  }
  try {
    const cart = await CartManager.deleteProduct(cid);
    res.status(200).json({ message: "Producto eliminado del carrito", cart });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar el producto del carrito",
      error: error.message,
    });
  }
});
// ---- ok
router.post("/:cid/product/:pid", async (req, res) => {
  let { cid, pid } = req.params;

  // Validar que cid y pid
  if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
    return res.status(400).json({ error: "cid y pid deben ser validos" });
  }

  try {
    // Buscar el carrito por ID
    let cart = await CartManager.getCartsBy(cid);
    if (!cart) {
      return res.status(400).json({ error: `No existe cart con id ${cid}` });
    }
    // Verifica si el producto existe
    let product = await ProductManager.getBy({ _id: pid });
    if (!product) {
      return res
        .status(400)
        .json({ error: `No existe producto con id ${pid}` });
    }
    // Verificar si el producto ya existe en el carrito
    let productIndex = cart.products.findIndex(
      (p) => p.product._id.toString() === pid
    );
    if (productIndex !== -1) {
      // Producto ya existe en el carrito, incrementar la cantidad
      cart.products[productIndex].quantity =
        (cart.products[productIndex].quantity || 0) + 1;
    } else {
      // Producto no existe, agregar nuevo producto con quantity 1
      cart.products.push({
        product: pid,
        quantity: 1,
      });
    }

    // Guardar el carrito actualizado
    let resultado = await CartManager.updateCartProduct(cid, cart);
    // Responder con éxito
    if (resultado.modifiedCount > 0) {
      res.status(200).json({
        message: "Producto agregado o actualizado en el carrito",
        cart,
      });
    } else {
      return res.status(400).json({ error: `Fallo en la actualizacion` });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error inesperado en el servidor - Intente más tarde",
      detalle: error.message,
    });
  }
});
// ---- ok
router.put("/:cid/product/:pid", async (req, res) => {
  let { cid, pid } = req.params;
  let {quantity} = req.body;
  // Validar cid y pid
  if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
    return res.status(400).json({ error: "cid y pid deben ser validos" });
  }
  // Validar que quantity
  if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
    return res.status(400).json({ error: "La cantidad debe ser un número positivo" });
  }
  try {
    // Buscar el carrito por ID
    let cart = await CartManager.getCartsBy(cid);
    if (!cart) {
      return res.status(400).json({ error: `No existe cart con id ${cid}` });
    }
    // Verifica si el producto existe
    let product = await ProductManager.getBy({ _id: pid });
    if (!product) {
      return res
        .status(400)
        .json({ error: `No existe producto con id ${pid}` });
    }
    // Verificar si el producto ya existe en el carrito
    let productIndex = cart.products.findIndex(
      (p) => p.product._id.toString() === pid
    );
    if (productIndex !== -1) {
      // Producto ya existe en el carrito, incrementar la cantidad
      cart.products[productIndex].quantity = Number(quantity)
    } else {
      return res.status(404).json({ error: 'Producto no encontrado en el carrito' })
    }

    // Guardar el carrito actualizado
    let resultado = await CartManager.updateCartProduct(cid, cart);
    // Responder con éxito
    if (resultado.modifiedCount > 0) {
      res.status(200).json({
        message: "Cantidad de producto actualizado en el carrito",
        cart,
      });
    } else {
      return res.status(400).json({ error: `Fallo en la actualizacion` });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error inesperado en el servidor - Intente más tarde",
      detalle: error.message,
    });
  }
});
//---- ok
router.delete("/:cid/product/:pid", async (req, res) => {
  let { cid, pid } = req.params;
  // Validar cid y pid
  if (!isValidObjectId(cid) || !isValidObjectId(pid)) {
    return res.status(400).json({ error: "cid y pid deben ser validos" });
  }

  try {
    // Buscar el carrito por ID
    let cart = await CartManager.getCartsBy(cid);
    if (!cart) {
      return res.status(400).json({ error: `No existe cart con id ${cid}` });
    }
    // Verificar si el producto existe
    let product = await ProductManager.getBy({ _id: pid });
    if (!product) {
      return res
        .status(400)
        .json({ error: `No existe producto con id ${pid}` });
    }
    // Verificar si el producto ya existe en el carrito
    let productIndex = cart.products.findIndex(
      (p) => p.product._id.toString() === pid
    );
    if (productIndex === -1) {
      return res
        .status(404)
        .json({ error: "El producto no existe en el carrito" });
    }

    //Eliminamos el producto del carrito
    const result = await CartManager.deleteCartProduct(cid, pid);
    if (result.modifiedCount === 0) {
      return res
        .status(500)
        .json({ error: "Error al eliminar el producto del carrito" });
    }
    res.status(200).json({ message: "Producto eliminado del carrito", cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error al eliminar el producto del carrito",
      details: error.message,
    });
  }
});

module.exports = { router };
