console.log("Cargo Script");

let currentCartId = null;

const socket = io(); // Conectar al servidor

// Manejar actualización de productos
socket.on("updateProducts", (payload) => {
  console.log("Payload recibido:", payload)

  const productList = document.getElementById("product-list");
  productList.innerHTML = ""; // Limpia la list

  payload.docs.forEach((product) => {
    const li = document.createElement("li");
    li.className = "product-item";

    
    const title = document.createElement("h2");
    title.textContent = product.title;

    const description = document.createElement("p");
    description.textContent = `Descripción: ${product.description}`;

    const price = document.createElement("p");
    price.textContent = `Precio: $${product.price}`;

    const code = document.createElement("p");
    code.textContent = `Código: ${product.code}`;

    const stock = document.createElement("p");
    stock.textContent = `Stock: ${product.stock}`;

    const status = document.createElement("p");
    status.textContent = `Estado: ${product.status ? 'Activo' : 'Inactivo'}`;

    const category = document.createElement("p");
    category.textContent = `Categoría: ${product.category}`;

    // Crear botón de eliminar
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Eliminar";
    deleteButton.className = "delete-button";
    deleteButton.setAttribute("data-id", product.id);
    deleteButton.addEventListener("click", () => deleteProduct(product.id));

    // Agregar todos los elementos al <li>
    li.appendChild(title);
    li.appendChild(description);
    li.appendChild(price);
    li.appendChild(code);
    li.appendChild(stock);
    li.appendChild(status);
    li.appendChild(category);
    li.appendChild(deleteButton);

    // Agregar <li> a la lista
    productList.appendChild(li);
  });
  // Actualizar paginación si la tienes en la misma vista
  const pagination = document.getElementById("pagination");
  if (pagination) {
    pagination.innerHTML = `
      <a href="${payload.prevLink}" ${payload.hasPrevPage ? "" : "disabled"}>Anterior</a>
      <span>Página ${payload.page} de ${payload.totalPages}</span>
      <a href="${payload.nextLink}" ${payload.hasNextPage ? "" : "disabled"}>Siguiente</a>
    `;
  }
}); 

// Enviar nuevo producto
document.getElementById("product-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const newProduct = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    price: parseFloat(document.getElementById("price").value),
    code: document.getElementById("code").value,
    stock: parseInt(document.getElementById("stock").value),
    status: document.getElementById("status").checked,
    category: document.getElementById("category").value,
  };

  fetch('/realtimeproducts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newProduct)
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      console.error('Error al agregar producto:', data.error);
    } else {
      console.log('Producto agregado correctamente');
          }
  })
  .catch(error => {
    console.error('Error en la solicitud:', error);
  });
});

// Delete realtimeProduct

function deleteProduct(productId) {
  // Emitimos el evento 'productDeleted' al servidor, pasándole el ID del producto a eliminar
  socket.emit("productDeleted", productId, (response) => {
    if (response && response.success) {
      alert("Producto eliminado correctamente");
    } else {
      alert("Error al eliminar el producto");
    }
  });
}
//Funcion para eliminar producto del cart 
function deleteProductCart(productId,cartId) {
  console.log(`Deleting product ${productId} from cart ${cartId}`)
  fetch(`/api/carts/${cartId}/product/${productId}`, {
    method: 'DELETE',
  })
    .then(response => {
      if (response.ok) {
        alert('Producto eliminado correctamente');
        window.location.reload(); // Recarga la página para actualizar la lista
      } else {
        alert('Error al eliminar el producto');
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}
// Función para eliminar producto handlebars
function deleteProduct(productId) {
  fetch(`/api/products/${productId}`, {
    method: 'DELETE',
  })
    .then(response => {
      if (response.ok) {
        alert('Producto eliminado correctamente');
        window.location.reload(); // Recarga la página para actualizar la lista
      } else {
        alert('Error al eliminar el producto');
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

function viewCart() {
  if (currentCartId) {
    window.location.href = `http://localhost:8080/carts/${currentCartId}`;
  } else {
    alert("No fue creado ningun carrito todavia :)");
  }
}
// Función para crear un nuevo carrito
async function createCart() {
  try {
    const response = await fetch('/api/carts', { method: 'POST' });
    
    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Verificar si el campo productNew y _id están presentes
    if (data.productNew && data.productNew._id) {
      currentCartId = data.productNew._id;
      return currentCartId;
    } else {
      throw new Error('Formato de respuesta inesperado');
    }
  } catch (error) {
    console.error('Error al crear el carrito:', error);
    throw error; // Lanza el error para manejarlo adecuadamente en el flujo de llamada
  }
}

// Función para agregar producto al carrito
async function addToCart(productId) {
  
  console.log('currentCartId:', currentCartId);

  try {
    if (!currentCartId) {
      // Crear el carrito si no existe
      currentCartId = await createCart();
    }

    // Agregar producto al carrito existente
    const response = await fetch(`/api/carts/${currentCartId}/product/${productId}`, {
      method: 'POST',                                                                         
});
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }else {
      alert(`Producto agregado al carrito ${currentCartId}`)
    }

  } catch (error) {
    console.error('Error:', error);
    alert('Hubo un problema al agregar el producto al carrito');
  }
}

async function showCart() {
  console.log('currentCartId:', currentCartId);
  
  try {
    if (currentCartId) {
      console.log('Redirigiendo a:', `/carts/${currentCartId}`);
      window.open(`/carts/${currentCartId}`, '_blank'); // Abre la URL en una nueva pestaña
    } else {
      alert('No se ha creado un carrito aún.');
    }
  } catch (error) {
    console.error('Error al crear el carrito:', error);
    throw error; // Lanza el error para manejarlo adecuadamente en el flujo de llamada
  }
}
