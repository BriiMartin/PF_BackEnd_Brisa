const express = require("express");
const fs = require("fs");
const { Server } = require("socket.io");
const { router: productsRouter } = require("./routes/products.router.js");
const { router: cartsRouter } = require("./routes/carts.router.js");
const { router: vistasRouter } = require("./routes/vistasRouter.js");
const { engine } = require("express-handlebars");
const ProductManager = require("./dao/ProductManager");
const connDB = require("./connDB.js");
const config = require("./config/config.js");
const CartManager = require("./dao/CartManager.js");
const PORT = config.PORT;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("./src/public"));

app.engine("handlebars", engine()); // inicializamos el motor
app.set("view engine", "handlebars"); // seteamos nuestro motor
app.set("views", "./src/views"); // setear la carpeta de vistas

//creo el middle para pasar Io a las rutas.
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/", vistasRouter);

// base de datos MONGO - Config.js

connDB();

//El servidor se levanta escuchando por el puerto 8080. Segundo argumento es un callback que mustra que el servidor esta arriba.
const serverHTTP = app.listen(PORT, () => {
  console.log(`Server escuchando en puerto ${PORT}`);
});

const io = new Server(serverHTTP);

io.on("connection", (socket) => {
  console.log("Cliente conectado");

  // Maneja el nuevoProducto
  socket.on("nuevoProducto", async (newProduct, callback) => {
    console.log("Producto recibido en el servidor:", newProduct);
    try {
      const result = await ProductManager.addProduct(newProduct);
      console.log("Producto agregado a la base de datos:", result);
      let products = await ProductManager.getProducts();
      io.emit("updateProducts", products);
      // Llamar al callback con éxito
      if (callback) {
        callback({ success: true });
      }
    } catch (error) {
      console.error("Error al agregar producto:", error);
      // Llamar al callback con error
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });


  // Maneja el productDeleted
  socket.on("productDeleted", async (id) => {
    try {
      await ProductManager.deleteProduct(id);
      let products = await ProductManager.getProducts();
      io.emit("updateProducts", products);
    } catch (error) {
      console.error("Error al eliminar producto:", error);
    }
  });

  let carritoId = null;

  // creación del carrito

  socket.on("crearCarrito", async () => {
    try {
      const carrito = await CartManager.addProductCart();
      carritoId = carrito._id;
      socket.emit("carritoCreado", carritoId);
    } catch (error) {
      console.error("Error al crear el carrito:", error);
    }
  });

 // Agrega producto al carrito
socket.on("agregarAlCarrito", async (productId, callback) => {
  try {
    // Verifica si hay carritos, si no, crea uno nuevo
    let cart = await CartManager.getCarts();
    
    if (!cart || cart.length === 0) {
      console.log("No hay carritos, creando uno nuevo.");
      cart = await CartManager.addProductCart(); // Crear un nuevo carrito
    } else {
      cart = cart[0]; // Usa el primer carrito encontrado
    }

    let product = await ProductManager.getByID(productId);
    if (!product) {
      throw new Error("Producto no encontrado");
    }

    // Verifica si el producto ya está en el carrito
    let productInCart = cart.products.find(item => item.product.equals(product._id));

    if (productInCart) {
      // Si el producto ya existe en el carrito, incrementa la cantidad
      productInCart.quantity += 1;
    } else {
      // Si el producto no está en el carrito, agrégalo con cantidad 1
      cart.products.push({ product: product._id, quantity: 1 });
    }

    // Actualizar carrito en la base de datos
    await CartManager.updateCartProduct(cart._id, cart);

    // Emitir la actualización de productos y enviar el carrito de vuelta al cliente
    io.emit("updateProducts", await ProductManager.getProducts());

    if (callback) {
      callback({ success: true, cartId: cart._id }); // Devolver el ID del carrito
    }
  } catch (error) {
    console.error("Error al agregar producto al carrito:", error);
    if (callback) {
      callback({ success: false, error: error.message });
    }
  }
});


    socket.on("disconnect", () => {
      console.log("Cliente Desconectado");
    });
  });


