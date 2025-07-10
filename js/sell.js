document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('cropForm');
  const message = document.getElementById('message');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(form);

    try {
      const response = await fetch('http://localhost:5000/api/crops', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      message.innerHTML = ""; // Clear previous messages

      if (response.ok) {
        message.innerText = result.message || 'Crop submitted successfully!';
        message.style.color = 'green';
        form.reset();

        // ✅ Show image preview
        if (result.crop && result.crop.image) {
          const img = document.createElement('img');
          img.src = `http://localhost:5000/${result.crop.image}`;
          img.alt = result.crop.name;
          img.className = "mt-3 img-fluid";
          img.style.maxWidth = "300px";

          message.appendChild(document.createElement("br"));
          message.appendChild(img);
        }

      } else {
        message.innerText = result.error || 'Failed to submit crop';
        message.style.color = 'red';
      }
    } catch (err) {
      message.innerText = 'Server error. Please try again.';
      message.style.color = 'red';
    }
  });
});

