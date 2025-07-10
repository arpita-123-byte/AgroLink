document.addEventListener('DOMContentLoaded', async () => {
  const cropGrid = document.getElementById('cropGrid');
  const categoryFilter = document.getElementById('categoryFilter');
  const priceRange = document.getElementById('priceRange');
  const priceValue = document.getElementById('priceValue');

  const params = new URLSearchParams(window.location.search);
  const searchQuery = params.get("search");
  const savedCategory = localStorage.getItem('selectedCategory');

  let cropCards = [];
  let crops = [];

  try {
    // ✅ Fetch from search or all crops based on query param
    const response = await fetch(
      searchQuery
        ? `/api/crops/search?query=${encodeURIComponent(searchQuery)}`
        : 'http://localhost:5000/api/crops'
    );
    crops = await response.json();

    if (!Array.isArray(crops)) {
      cropGrid.innerHTML = `<p class="text-danger">Invalid data from server.</p>`;
      return;
    }

    cropGrid.innerHTML = '';

    crops.forEach(crop => {
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'col-md-4';

      cardWrapper.innerHTML = `
        <a href="crop-detail.html?id=${crop._id}" class="text-decoration-none text-dark">
          <div class="card h-100" data-category="${crop.category}" data-price="${crop.price}">
            <img src="http://localhost:5000${crop.image}" class="card-img-top" alt="${crop.name}">
            <div class="card-body">
              <h5 class="card-title">${crop.name}</h5>
              <p class="card-text">${crop.description}</p>
              <p class="text-muted mb-1">${crop.quantity} from ${crop.location}</p>
              <span class="badge bg-success">₹${crop.price}</span>
            </div>
          </div>
        </a>
      `;

      cropGrid.appendChild(cardWrapper);
    });

    cropCards = document.querySelectorAll('.card');

    function filterCrops() {
      const selectedCategory = categoryFilter.value;
      const selectedPrice = parseInt(priceRange.value);
      priceValue.textContent = selectedPrice;

      cropCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        const cardPrice = parseInt(card.getAttribute('data-price'));

        const matchesCategory = selectedCategory === 'All' || cardCategory === selectedCategory;
        const matchesPrice = cardPrice <= selectedPrice;

        card.closest('.col-md-4').style.display = matchesCategory && matchesPrice ? 'block' : 'none';
      });
    }

    // Attach event listeners
    categoryFilter.addEventListener('change', filterCrops);
    priceRange.addEventListener('input', filterCrops);

    // Apply pre-selected category (from homepage)
    if (savedCategory) {
      categoryFilter.value = savedCategory;
      localStorage.removeItem('selectedCategory');
    }

    filterCrops(); // Apply filters after rendering

  } catch (error) {
    console.error('Error fetching crops:', error);
    cropGrid.innerHTML = `<p class="text-danger">Failed to load crops. Please try again later.</p>`;
  }
});

// 🔍 Live search suggestions (if used in crops.html)
const searchInput = document.getElementById("searchInput");
const suggestionsList = document.getElementById("suggestionsList");

if (searchInput && suggestionsList) {
  searchInput.addEventListener("input", async () => {
    const query = searchInput.value.trim();

    if (!query) {
      suggestionsList.innerHTML = "";
      return;
    }

    try {
      const res = await fetch(`/api/crops/search?query=${encodeURIComponent(query)}`);
      const crops = await res.json();

      suggestionsList.innerHTML = "";

      if (!Array.isArray(crops) || crops.length === 0) {
        suggestionsList.innerHTML = `<li class="list-group-item">No crops found</li>`;
        return;
      }

      crops.forEach(crop => {
        const li = document.createElement("li");
        li.className = "list-group-item list-group-item-action";
        li.textContent = crop.name;

        li.addEventListener("click", () => {
          searchInput.value = crop.name;
          suggestionsList.innerHTML = "";
          window.location.href = `crop-detail.html?id=${crop._id}`;
        });

        suggestionsList.appendChild(li);
      });
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target)) {
      suggestionsList.innerHTML = "";
    }
  });
}



