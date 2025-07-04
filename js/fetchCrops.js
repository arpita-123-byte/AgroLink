document.addEventListener('DOMContentLoaded', async () => {
  const cropGrid = document.getElementById('cropGrid');

  try {
    const response = await fetch('http://localhost:5000/api/crops');
    const crops = await response.json();

    if (!Array.isArray(crops)) {
      cropGrid.innerHTML = `<p class="text-danger">Invalid data from server.</p>`;
      return;
    }

    // Clear any existing cards
    cropGrid.innerHTML = '';

    crops.forEach(crop => {
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'col-md-4';

      cardWrapper.innerHTML = `
        <div class="card" data-category="${crop.category}" data-price="${crop.price}">
         <img src="http://localhost:5000/${crop.image.replace(/\\/g, '/')}" class="card-img-top" alt="${crop.name}">


          <div class="card-body">
            <h5 class="card-title">${crop.name}</h5>
            <p class="card-text">${crop.description}</p>
            <p class="text-muted mb-1">${crop.quantity} from ${crop.location}</p>
            <span class="badge bg-success">₹${crop.price}</span>
          </div>
        </div>
      `;

      cropGrid.appendChild(cardWrapper);
    });

  } catch (error) {
    console.error('Error fetching crops:', error);
    cropGrid.innerHTML = `<p class="text-danger">Failed to load crops. Please try again later.</p>`;
  }
});




