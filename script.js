/**
 * Lumina Gallery - Script logic
 * Pure JS implementation of filtering, lightbox, search, and themes.
 */

const imageData = [
    { id: 1, title: 'Mountain Peak', category: 'nature', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80' },
    { id: 2, title: 'Minimal Architecture', category: 'architecture', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80' },
    { id: 3, title: 'Abstract Ocean', category: 'abstract', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80' },
    { id: 4, title: 'Forest Path', category: 'nature', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80' },
    { id: 5, title: 'Glass Tower', category: 'architecture', url: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=800&q=80' },
    { id: 6, title: 'Golden Dunes', category: 'minimal', url: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=800&q=80' },
    { id: 7, title: 'White Spiral', category: 'minimal', url: 'https://images.unsplash.com/photo-1490971688337-f2c79913ea7d?auto=format&fit=crop&w=800&q=80' },
    { id: 8, title: 'Cosmic Abstract', category: 'abstract', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80' },
    { id: 9, title: 'Misty Woods', category: 'nature', url: 'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?auto=format&fit=crop&w=800&q=80' },
    { id: 10, title: 'Urban Geometry', category: 'architecture', url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80' },
    { id: 11, title: 'Flowing Lines', category: 'abstract', url: 'https://images.unsplash.com/photo-1554188248-986adbb73be4?auto=format&fit=crop&w=800&q=80' },
    { id: 12, title: 'Quiet Morning', category: 'minimal', url: 'https://img.freepik.com/free-photo/view-foggy-mountain-landscape_1359-740.jpg' },
    { id: 13, title: 'Canyon View', category: 'nature', url: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=800&q=80' },
    { id: 14, title: 'Modern Facade', category: 'architecture', url: 'https://www.imaginationshaper.com/product_images/49x44-luxury-ultra-modern-house-design-front-elevation-1706.jpg' },
    { id: 15, title: 'Colorful Smoke', category: 'abstract', url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=800&q=80' },
    { id: 16, title: 'Minimalist Chair', category: 'minimal', url: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80' },
    { id: 17, title: 'Autumn Lake', category: 'nature', url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80' },
    { id: 18, title: 'Concrete Curves', category: 'architecture', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80' }
];

// DOM Elements
const galleryGrid = document.getElementById('galleryGrid');
const filterBtns = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');
const shuffleBtn = document.getElementById('shuffleBtn');
const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox.querySelector('.lightbox-img');
const lightboxCounter = lightbox.querySelector('.lightbox-counter');
const prevBtn = lightbox.querySelector('.lightbox-prev');
const nextBtn = lightbox.querySelector('.lightbox-next');
const closeBtn = lightbox.querySelector('.lightbox-close');
const downloadBtn = document.getElementById('downloadBtn');
const filterBtn = document.getElementById('filterBtn');

let currentFilter = 'all';
let currentSearch = '';
let currentImages = [...imageData];
let currentLightboxIndex = 0;

// Initialize
function init() {
    renderGallery();
    setupTheme();
    addEventListeners();
}

// Render Gallery
function renderGallery() {
    galleryGrid.innerHTML = '';

    // Filter by category and search
    const filtered = imageData.filter(img => {
        const matchesFilter = currentFilter === 'all' || img.category === currentFilter;
        const matchesSearch = img.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
            img.category.toLowerCase().includes(currentSearch.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    currentImages = filtered;

    if (filtered.length === 0) {
        galleryGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">No images found...</div>';
        return;
    }

    filtered.forEach((img, index) => {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.innerHTML = `
            <img src="${img.url}" alt="${img.title}" loading="lazy">
            <div class="card-overlay">
                <div class="card-info">
                    <h3>${img.title}</h3>
                    <p>${img.category.charAt(0).toUpperCase() + img.category.slice(1)}</p>
                </div>
            </div>
        `;

        card.addEventListener('click', () => openLightbox(index));
        galleryGrid.appendChild(card);

        // Fade in animation
        setTimeout(() => card.classList.add('loaded'), index * 100);
    });
}

// Theme Logic
function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', theme);
}

// Lightbox Logic
function openLightbox(index) {
    currentLightboxIndex = index;
    updateLightbox();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    lightboxImg.style.filter = 'none';
}

function updateLightbox() {
    const img = currentImages[currentLightboxIndex];
    lightboxImg.src = img.url;
    lightboxImg.alt = img.title;
    lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${currentImages.length}`;
}

function nextImage() {
    currentLightboxIndex = (currentLightboxIndex + 1) % currentImages.length;
    updateLightbox();
}

function prevImage() {
    currentLightboxIndex = (currentLightboxIndex - 1 + currentImages.length) % currentImages.length;
    updateLightbox();
}

// Event Listeners
function addEventListeners() {
    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderGallery();
        });
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderGallery();
    });

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    // Shuffle
    shuffleBtn.addEventListener('click', () => {
        currentImages.sort(() => Math.random() - 0.5);
        renderGallery();
    });

    // Lightbox Controls
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

    // Download
    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const img = currentImages[currentLightboxIndex];
        const link = document.createElement('a');
        link.href = img.url;
        link.download = img.title.toLowerCase().replace(/\s/g, '-');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Image Filter toggle
    filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentFilter = lightboxImg.style.filter;
        lightboxImg.style.filter = currentFilter === 'grayscale(100%)' ? 'none' : 'grayscale(100%)';
        filterBtn.classList.toggle('active');
    });

    // Keyboard Nav
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
    });
}

init();
