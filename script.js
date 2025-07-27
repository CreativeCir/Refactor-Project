// TMDb API Configuration
const API_KEY = '8d45a043fb7bd500b274e2039e106151';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

// DOM Elements
const searchInput = document.getElementById('movie-search-input');
const searchButton = document.getElementById('search-button');
const moviesGrid = document.getElementById('movies-grid');

// State
let currentPage = 1;
let isLoading = false;
let currentQuery = '';

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadPopularMovies();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Real-time search (debounced)
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            if (searchInput.value.trim()) {
                handleSearch();
            } else {
                loadPopularMovies();
            }
        }, 500);
    });

    // Infinite scroll
    window.addEventListener('scroll', handleScroll);
}

// Handle search
function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        currentQuery = query;
        currentPage = 1;
        searchMovies(query, true);
    } else {
        currentQuery = '';
        loadPopularMovies();
    }
}

// Handle infinite scroll
function handleScroll() {
    if (isLoading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 1000) {
        if (currentQuery) {
            searchMovies(currentQuery, false);
        } else {
            loadPopularMovies(false);
        }
    }
}

// Load popular movies
async function loadPopularMovies(clearGrid = true) {
    if (isLoading) return;
    
    try {
        isLoading = true;
        showLoading(clearGrid);
        
        const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${currentPage}`);
        const data = await response.json();
        
        if (data.results) {
            displayMovies(data.results, clearGrid);
            currentPage++;
        }
    } catch (error) {
        console.error('Error loading popular movies:', error);
        showError('Failed to load popular movies. Please try again.');
    } finally {
        isLoading = false;
        hideLoading();
    }
}

// Search movies
async function searchMovies(query, clearGrid = true) {
    if (isLoading) return;
    
    try {
        isLoading = true;
        showLoading(clearGrid);
        
        const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${currentPage}`);
        const data = await response.json();
        
        if (data.results) {
            if (data.results.length === 0 && clearGrid) {
                showNoResults();
            } else {
                displayMovies(data.results, clearGrid);
                if (!clearGrid) currentPage++;
            }
        }
    } catch (error) {
        console.error('Error searching movies:', error);
        showError('Failed to search movies. Please try again.');
    } finally {
        isLoading = false;
        hideLoading();
    }
}

// Display movies in the grid
function displayMovies(movies, clearGrid = true) {
    if (clearGrid) {
        moviesGrid.innerHTML = '';
    }
    
    movies.forEach((movie, index) => {
        const movieCard = createMovieCard(movie, clearGrid ? index + 1 : moviesGrid.children.length + index + 1);
        moviesGrid.appendChild(movieCard);
    });
    
    // Enhanced fade-in animation with staggered timing
    const newCards = moviesGrid.querySelectorAll('.movie-card:not(.animated)');
    newCards.forEach((card, index) => {
        card.classList.add('animated');
        
        // Staggered animation with different delays
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
            card.classList.add('fade-in-complete');
        }, index * 150); // Increased delay for better visual effect
    });
    
    // Add entrance animation class for CSS transitions
    setTimeout(() => {
        newCards.forEach(card => {
            card.classList.add('entrance-animation');
        });
    }, 50);
}

// Create movie card element
function createMovieCard(movie, index) {
    const card = document.createElement('article');
    card.className = 'movie-card';
    card.id = `movie-card-${index}`;
    
    // Enhanced initial styling for better animation
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px) scale(0.95)';
    card.style.transition = 'opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    const posterUrl = movie.poster_path 
        ? `${IMAGE_BASE_URL}${movie.poster_path}` 
        : 'https://via.placeholder.com/300x450/333/fff?text=No+Image';
    
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const stars = generateStars(movie.vote_average);
    
    card.innerHTML = `
        <div class="movie-poster">
            <img src="${posterUrl}" alt="${movie.title} Poster" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450/333/fff?text=No+Image'">
            <div class="movie-overlay">
                <button class="play-button" id="play-button-${index}" aria-label="Play ${movie.title}" onclick="showMovieDetails(${movie.id})">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5,3 19,12 5,21"></polygon>
                    </svg>
                </button>
            </div>
        </div>
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-rating" id="rating-${index}">
                <span class="rating-stars">${stars}</span>
                <span class="rating-value">${rating}</span>
            </div>
            <div class="movie-meta">
                <span class="release-date">${formatDate(movie.release_date)}</span>
            </div>
        </div>
    `;
    
    return card;
}

// Generate star rating
function generateStars(rating) {
    if (!rating) return '☆☆☆☆☆';
    
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = (rating % 2) >= 1;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
}

// Format release date
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return date.getFullYear();
}

// Show movie details (placeholder function)
async function showMovieDetails(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
        const movie = await response.json();
        
        // Create a simple modal or alert with movie details
        const modal = createMovieModal(movie);
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
    } catch (error) {
        console.error('Error loading movie details:', error);
        alert('Failed to load movie details. Please try again.');
    }
}

// Create movie details modal
function createMovieModal(movie) {
    const modal = document.createElement('div');
    modal.className = 'movie-modal';
    modal.id = 'movie-modal';
    
    const backdropUrl = movie.backdrop_path 
        ? `${BACKDROP_BASE_URL}${movie.backdrop_path}` 
        : `${IMAGE_BASE_URL}${movie.poster_path}`;
    
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeMovieModal()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeMovieModal()">&times;</button>
            <div class="modal-backdrop" style="background-image: url('${backdropUrl}')"></div>
            <div class="modal-info">
                <h2>${movie.title}</h2>
                <div class="modal-meta">
                    <span class="rating">★ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                    <span class="runtime">${movie.runtime ? movie.runtime + ' min' : 'Unknown'}</span>
                    <span class="year">${formatDate(movie.release_date)}</span>
                </div>
                <p class="overview">${movie.overview || 'No overview available.'}</p>
                <div class="genres">
                    ${movie.genres ? movie.genres.map(genre => `<span class="genre">${genre.name}</span>`).join('') : ''}
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

// Close movie modal
function closeMovieModal() {
    const modal = document.getElementById('movie-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Show loading state
function showLoading(clearGrid = true) {
    if (clearGrid) {
        moviesGrid.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <div class="loading-text">Loading movies...</div>
            </div>
        `;
    } else {
        // Show inline loading for infinite scroll
        const existingInlineLoader = moviesGrid.querySelector('.inline-loading');
        if (!existingInlineLoader) {
            const inlineLoader = document.createElement('div');
            inlineLoader.className = 'inline-loading';
            inlineLoader.innerHTML = `
                <div class="inline-spinner">
                    <div class="spinner-ring small"></div>
                    <div class="spinner-ring small"></div>
                    <div class="spinner-ring small"></div>
                    <div class="spinner-ring small"></div>
                </div>
                <span>Loading more movies...</span>
            `;
            moviesGrid.appendChild(inlineLoader);
        }
    }
}

// Hide loading state
function hideLoading() {
    const loading = moviesGrid.querySelector('.loading-container');
    const inlineLoading = moviesGrid.querySelector('.inline-loading');
    
    if (loading) {
        loading.remove();
    }
    if (inlineLoading) {
        inlineLoading.remove();
    }
}

// Show error message
function showError(message) {
    moviesGrid.innerHTML = `<div class="error">${message}</div>`;
}

// Show no results message
function showNoResults() {
    moviesGrid.innerHTML = '<div class="no-results">No movies found. Try a different search term.</div>';
}

// Utility function to debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
