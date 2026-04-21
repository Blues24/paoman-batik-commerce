/**
 * ulasan.js - Review/Rating System Handler
 * - Display reviews di product detail
 * - Calculate rating summary
 * - Format review data
 */

//const API_URL = 'http://localhost:8000/api'; // Kena Error redefinition

// =========== FETCH & DISPLAY REVIEWS ===========
async function fetchProductReviews(produkId) {
    try {
        const response = await fetch(`${API_URL}/produk/${produkId}/ulasan`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            return data.data || [];
        } else {
            console.error('Failed to fetch reviews:', data.message);
            return [];
        }
    } catch (err) {
        console.error('Fetch reviews error:', err);
        return [];
    }
}

// =========== RENDER REVIEWS ===========
function renderReviews(reviews, containerId = 'reviewsContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="empty-reviews">
                <p>Belum ada ulasan untuk produk ini. Jadilah yang pertama memberi ulasan!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    reviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        reviewCard.innerHTML = `
            <div class="review-header">
                <div class="review-user-info">
                    <strong>${review.nama_pelanggan || 'Anonymous'}</strong>
                    <span class="review-date">${formatReviewDate(review.tanggal_ulasan)}</span>
                </div>
                <div class="review-rating">
                    ${renderStars(review.rating)}
                </div>
            </div>

            <div class="review-body">
                ${review.komentar ? `<p>${review.komentar}</p>` : '<p><em>Tidak ada komentar</em></p>'}
            </div>
        `;
        container.appendChild(reviewCard);
    });
}

// =========== STAR RENDERING ===========
function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? '★' : '☆';
    }
    return `<span class="stars">${stars}</span>`;
}

// =========== RATING SUMMARY ===========
function calculateRatingSummary(reviews) {
    if (reviews.length === 0) {
        return {
            avgRating: 0,
            totalReviews: 0,
            distribution: [0, 0, 0, 0, 0]
        };
    }

    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = (total / reviews.length).toFixed(1);

    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
        distribution[r.rating - 1]++;
    });

    return {
        avgRating: parseFloat(avg),
        totalReviews: reviews.length,
        distribution
    };
}

// =========== FORMAT HELPERS ===========
function formatReviewDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan lalu`;
    return date.toLocaleDateString('id-ID');
}

// =========== RENDER RATING BAR CHART ===========
function renderRatingDistribution(reviews, containerId = 'ratingDistribution') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const summary = calculateRatingSummary(reviews);

    let html = `
        <div class="rating-summary">
            <div class="rating-avg">
                <div class="rating-avg-number">${summary.avgRating}</div>
                <div class="rating-avg-stars">${renderStars(Math.round(summary.avgRating))}</div>
                <div class="rating-avg-count">${summary.totalReviews} ulasan</div>
            </div>

            <div class="rating-bars">
    `;

    for (let i = 5; i >= 1; i--) {
        const count = summary.distribution[i - 1];
        const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;

        html += `
            <div class="rating-bar-row">
                <span class="rating-label">${i} ★</span>
                <div class="rating-bar-bg">
                    <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="rating-count">${count}</span>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// =========== MODAL CLOSE HELPER ===========
function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.classList.add('d-none');
    }
}

// =========== EXPORT untuk ke pembelian.html ===========
// Bisa di-import untuk display reviews di product detail page