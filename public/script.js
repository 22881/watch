// ===================== Завантаження товарів з Google Таблиці =====================
const apiUrl = "https://script.google.com/macros/s/AKfycbx3V5lXTTFkBg-dODF40S4Fe9e4nDJph_w6W5eZRowvJSs20_0NX59_pM0aOIG17Kjb_A/exec";

function generateProductCard(product) {
  const imagesHTML = product.images
    .map(img => `<img src="${img}" alt="${product.name}" />`)
    .join('');

  let sizesHTML = '';
if (product.category === 'couples') {
  sizesHTML = `
  <div class="size-selector">
    <div class="watch-size-container">
      <span class="watch-size-label">Rozmiar zegarka: </span>
      <button class="size-btn active" data-size="42x36" disabled>42 na 36</button>
      <button class="size-btn active" data-size="36x28" disabled>36 na 28</button>
    </div>
  </div>
  `;
} else {
  sizesHTML = `
  <div class="size-selector">
    <div class="watch-size-container">
      <span class="watch-size-label">Rozmiar zegarka: </span>
      <button class="size-btn active" data-size="42x36">42 na 36</button>
      <button class="size-btn" data-size="36x28">36 na 28</button>
    </div>
  </div>
  `;
}

function truncateText(text, limit) {
  if (!text) return "";
  return text.length > limit ? text.substring(0, limit) : text;
}

return `
    <div class="product" 
         data-name="${product.name}" 
         data-price="${product.price}" 
         data-category="${product.category}">
      <div class="image-carousel">
        <div class="image-carousel-inner">
          ${imagesHTML}
        </div>
      </div>
      <div class="carousel-controls">
        <button class="prev"></button>
        <button class="next"></button>
      </div>
      <p class="product-description">
        ${truncateText(product.description, 67)}
      </p>
      <p class="product-color">
        <strong>Колір:</strong>${product.colorName}
        <span class="color-dot" style="background-color: ${product.colorHex};"></span>
      </p>
      ${sizesHTML}
      <p class="product-stock">
        <span class="stock-dot"><span class="stock-dot-inner"></span></span>
        ${product.stock ? 'W magazynie' : 'Немає в наявності'}
      </p>
      <p class="product-price">${product.price} zł</p>
      <button class="add-to-cart-btn">Dodaj do koszyka</button>
    </div>
  `;
}

function generateCategory(title, products) {
  if (!products.length) return '';
  return `
    <h1 style="text-align:center; font-size:40px; font-weight:600;">${title}</h1>
    <div class="gallery-row">
      <div class="gallery-scroll">
        ${products.map(generateProductCard).join('')}
      </div>
    </div>
  `;
}

function loadProducts() {
  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      // тут у data вже JSON-масив з Apps Script
      const products = data.map(obj => ({
        category: obj.category,
        name: obj.name,
        price: obj.price,
        description: obj.description,
        colorName: obj.colorName,
        colorHex: obj.colorHex,
        stock: obj.stock.toLowerCase() === "yes",
        images: [obj.image1, obj.image2, obj.image3].filter(img => img && img.length > 0)
      }));

      const men = products.filter(p => p.category === "men");
      const women = products.filter(p => p.category === "women");
      const couples = products.filter(p => p.category === "couples");

      document.getElementById('catalog').innerHTML =
        generateCategory("Zegarki męskie", men) +
        generateCategory("Zegarki damskie", women) +
        generateCategory("Para zegarków", couples);

      // Ініціалізуємо функціонал для нових карток
      initProductEvents();
    })
    .catch(err => console.error("Помилка завантаження товарів:", err));
}

// ===================== Кошик =====================
const cart = [];
const cartBtn = document.getElementById('cart-btn');
const cartModal = document.getElementById('cart-modal');
const cartItems = document.getElementById('cart-items');
const totalElem = document.getElementById('total');

// ===================== Лайтбокс =====================
const lightbox = document.createElement('div');
lightbox.id = 'lightbox';
lightbox.innerHTML = `
  <span class="close">&times;</span>
  <button class="lightbox-prev">&#10094;</button>
  <div class="lightbox-content">
    <img src="" alt="Lightbox Image">
  </div>
  <button class="lightbox-next">&#10095;</button>
`;
document.body.appendChild(lightbox);

// Тепер lightboxImg потрібно шукати всередині lightbox-content
const lightboxImg = lightbox.querySelector('.lightbox-content img');
const closeBtn = lightbox.querySelector('.close');
const prevBtn = lightbox.querySelector('.lightbox-prev');
const nextBtn = lightbox.querySelector('.lightbox-next');

let currentImages = [];
let currentIndex = 0;

function openLightbox(images, index) {
  if (!images || !images.length) return;
  currentImages = images;
  currentIndex = index;
  updateLightboxImage();
  lightbox.classList.add('show');
}

function closeLightbox() {
  lightbox.classList.remove('show');
}

function updateLightboxImage() {
  lightboxImg.src = currentImages[currentIndex];
}

function showPrev() {
  if (!currentImages.length) return;
  currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
  updateLightboxImage();
}

function showNext() {
  if (!currentImages.length) return;
  currentIndex = (currentIndex + 1) % currentImages.length;
  updateLightboxImage();
}

closeBtn.addEventListener('click', closeLightbox);

prevBtn.addEventListener('click', e => { e.stopPropagation(); showPrev(); });
nextBtn.addEventListener('click', e => { e.stopPropagation(); showNext(); });

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) {
    closeLightbox();
  }
});

// ===================== Ініціалізація функціоналу товарів =====================
function initProductEvents() {
  // Карусель
  document.querySelectorAll('.product').forEach(product => {
    const carouselInner = product.querySelector('.image-carousel-inner');
    if (!carouselInner) return;

    const imgs = carouselInner.querySelectorAll('img');
    const btnPrev = product.querySelector('.carousel-controls .prev');
    const btnNext = product.querySelector('.carousel-controls .next');
    let index = 0;

    function showSlide(i) {
      if (i < 0) i = imgs.length - 1;
      if (i >= imgs.length) i = 0;
      index = i;
      const containerWidth = carouselInner.offsetWidth;
      carouselInner.style.transform = `translateX(-${index * containerWidth}px)`;
    }

    let startX = 0;
    carouselInner.addEventListener('touchstart', e => startX = e.touches[0].clientX);
    carouselInner.addEventListener('touchend', e => {
      const delta = e.changedTouches[0].clientX - startX;
      if (Math.abs(delta) > 40) {
        if (delta < 0) showSlide(index + 1);
        else showSlide(index - 1);
      }
    });

    btnPrev.addEventListener('click', e => { e.stopPropagation(); showSlide(index - 1); });
    btnNext.addEventListener('click', e => { e.stopPropagation(); showSlide(index + 1); });
    showSlide(0);
  });

  // Лайтбокс для фото
  document.querySelectorAll('.product').forEach(product => {
  const imgs = product.querySelectorAll('.image-carousel-inner img');
  const imgSources = Array.from(imgs).map(img => img.src);

  imgs.forEach((img, index) => {
    img.addEventListener('click', () => openLightbox(imgSources, index));
    
  });
});

  // Додавання в кошик
  document.querySelectorAll('.product .add-to-cart-btn').forEach(btn => {
  btn.addEventListener('click', event => {
    event.stopPropagation();
    const product = btn.closest('.product');
    const name = product.dataset.name;
    const price = parseFloat(product.dataset.price);

    let imgSrc = '';
    const firstImg = product.querySelector('.image-carousel-inner img');
    if (firstImg) imgSrc = firstImg.src;

    let size = 'Без розміру';
    // ✅ Для парних годинників фіксований текст
    if (product.dataset.category === "couples") {
      size = "42 на 36 + 36 на 28";
    } else {
      const selectedSizeElem = product.querySelector('.size-btn.active');
      size = selectedSizeElem ? selectedSizeElem.textContent : 'Без розміру';
    }

    // перевірка чи є товар у кошику
    const existingItem = cart.find(p => p.name === name && p.size === size);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ name, price, imgSrc, size, quantity: 1 });
    }

    updateCartUI();
    showAddToCartPopup();
  });
});


  // Вибір розміру
  document.querySelectorAll('.product .size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const siblings = btn.closest('.watch-size-container').querySelectorAll('.size-btn');
      siblings.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// ===================== Кошик та оформлення =====================
function updateCartUI() {
  cartItems.innerHTML = '';

  let total = 0;

  if (cart.length === 0) {
    cartItems.innerHTML = '<p style="text-align:center; color:gray; font-family: Arial;">Koszyk jest pusty</p>';
  }

  cart.forEach(item => {
    total += item.price * item.quantity; // ✅ враховуємо кількість

    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'space-between';

    const infoSpan = document.createElement('div');
    infoSpan.style.display = "flex";
    infoSpan.style.alignItems = "center";
    infoSpan.style.gap = "10px"; // відступ між картинкою і текстом

infoSpan.innerHTML = `
  <img src="${item.imgSrc}" alt="${item.name}" style="width:200px; height:auto; border-radius:4px;">
  <span style="font-size:16px; font-family:Arial; font-weight:bold; display:block;">
  ${item.name} — ${item.size || 'Без розміру'} — zł${item.price}
</span>
`;

    // Кнопки +/-
    const qtyControls = document.createElement('div');
    qtyControls.style.display = 'flex';
    qtyControls.style.alignItems = 'center';
    qtyControls.innerHTML = `
      <button class="qty-minus" style="margin:0 5px;">-</button>
      <span>${item.quantity}</span>
      <button class="qty-plus" style="margin:0 5px;">+</button>
    `;

    qtyControls.querySelector('.qty-minus').addEventListener('click', () => {
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        cart.splice(cart.indexOf(item), 1);
      }
      updateCartUI();
    });

    qtyControls.querySelector('.qty-plus').addEventListener('click', () => {
      item.quantity++;
      updateCartUI();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.style.background = 'transparent';
    deleteBtn.style.border = 'none';
    deleteBtn.style.color = '#e74c3c';
    deleteBtn.style.fontSize = '20px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.title = 'Видалити товар';

    deleteBtn.addEventListener('click', e => {
      e.stopPropagation();
      cart.splice(cart.indexOf(item), 1);
      updateCartUI();
    });

    div.appendChild(infoSpan);
    div.appendChild(qtyControls);
    div.appendChild(deleteBtn);
    cartItems.appendChild(div);
  });

  // ✅ загальна сума
  totalElem.textContent = `zł ${total}`;

  // ✅ кількість усіх товарів (не тільки cart.length)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartBtn.textContent = `Кошик (${totalItems})`;
}

// Очищення кошика
function clearCart() {
  cart.length = 0;
  updateCartUI();
}


function toggleCart() {
  cartModal.style.display = cartModal.style.display === 'block' ? 'none' : 'block';
}
cartBtn.addEventListener('click', toggleCart);

function showAddToCartPopup() {
  const popup = document.getElementById('add-to-cart-popup');
  if (!popup) return;

  // додаємо обробник кнопки "Відкрити"
  const openCartLink = popup.querySelector('#open-cart-link');
  if (openCartLink && !openCartLink.dataset.listenerAttached) {
    openCartLink.addEventListener('click', (e) => {
      e.preventDefault();
      toggleCart(); // відкриваємо кошик
    });
    openCartLink.dataset.listenerAttached = 'true'; // щоб не додавати багато разів
  }

  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 3000);
}

function checkout() {
  document.getElementById('checkout-form-modal').style.display = 'flex';
}
function closeCheckoutForm() {
  document.getElementById('checkout-form-modal').style.display = 'none';
  document.getElementById('thank-you-message').style.display = 'none';
  document.getElementById('checkout-form').style.display = 'block';
}
function generateOrderId() {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${randomNum}`;
}
async function submitOrder(event) {
  event.preventDefault();
  const formElem = document.getElementById('checkout-form');
  const formData = new FormData(formElem);
  const form = Object.fromEntries(formData.entries());
  form.orderId = generateOrderId();
  const response = await fetch('/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cart, form })
});
  const data = await response.json();
  const stripe = Stripe('pk_test_51RlQIwIwHNIYYpTvf9yXuhO4LM7TmG68XIj76ey3jXX2DjZnTktCevAXau875ghJ7zSVgYRYuKIymYCHl4ipGoLi00TdS8ECj9');
  stripe.redirectToCheckout({ sessionId: data.id });
}
function getQueryParams() {
  const params = {};
  const queryString = window.location.search.slice(1);
  const pairs = queryString.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  }
  return params;
}
function showSuccessModal(orderId) {
  const modal = document.getElementById('order-success-modal');
  const orderIdElem = document.getElementById('order-success-id');
  if (modal && orderIdElem) {
    orderIdElem.textContent = orderId;
    modal.style.display = 'flex';
  }
}
function closeSuccessModal() {
  const modal = document.getElementById('order-success-modal');
  if (modal) modal.style.display = 'none';
}
window.addEventListener('DOMContentLoaded', () => {
  loadProducts(); // завантаження товарів
  const params = getQueryParams();
  if (params.success === 'true' && params.orderId) {
    showSuccessModal(params.orderId);
  }
});
