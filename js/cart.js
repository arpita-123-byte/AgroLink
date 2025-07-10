document.addEventListener("DOMContentLoaded", () => {
  const cartContainer = document.getElementById("cartItemsContainer");
  const cartTotalEl = document.getElementById("cartTotal");

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  function renderCart() {
    cartContainer.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
      cartContainer.innerHTML = `<p class="text-muted">Your cart is empty.</p>`;
      cartTotalEl.textContent = "0";
      return;
    }

    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;

      const itemEl = document.createElement("div");
      itemEl.classList.add("row", "align-items-center", "cart-item");

      itemEl.innerHTML = `
        <div class="col-md-2">
          <img src="http://localhost:5000${item.image}" alt="${item.name}" class="img-fluid" />
        </div>
        <div class="col-md-3">
          <h5>${item.name}</h5>
          <p class="text-muted">₹${item.price} x ${item.quantity}</p>
        </div>
        <div class="col-md-3">
          <div class="d-flex align-items-center">
            <button class="btn btn-outline-danger btn-sm me-2 decrease-btn">−</button>
            <span class="fw-bold">${item.quantity}</span>
            <button class="btn btn-outline-success btn-sm ms-2 increase-btn">+</button>
          </div>
        </div>
        <div class="col-md-2 fw-semibold">
          ₹${itemTotal}
        </div>
        <div class="col-md-2 text-end">
          <button class="btn btn-sm btn-outline-dark remove-btn">Remove</button>
        </div>
      `;

      // Add functionality to buttons
      itemEl.querySelector(".increase-btn").addEventListener("click", () => {
        item.quantity++;
        saveCartAndRender();
      });

      itemEl.querySelector(".decrease-btn").addEventListener("click", () => {
        if (item.quantity > 1) {
          item.quantity--;
          saveCartAndRender();
        }
      });

      itemEl.querySelector(".remove-btn").addEventListener("click", () => {
        cart = cart.filter(c => c.id !== item.id);
        saveCartAndRender();
      });

      cartContainer.appendChild(itemEl);
    });

    cartTotalEl.textContent = total.toFixed(2);
  }

  function saveCartAndRender() {
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
  }

  // Initial load
  renderCart();

  // Handle checkout
  const checkoutBtn = document.getElementById("checkoutBtn");
  checkoutBtn.addEventListener("click", () => {
    alert("Checkout functionality coming soon! 🚀");
    // Later: trigger payment gateway
  });
});
