(function() {
  if (!window.productData) return;
  
  const { id, type } = window.productData;
  let selectedRating = 0;
  
  // Load reviews on page load
  loadReviews();
  
  function loadReviews() {
    fetch(`/api/reviews/${type}/${id}`)
      .then(res => res.json())
      .then(data => {
        displayReviewSummary(data);
        displayReviews(data.reviews);
      })
      .catch(err => {
        console.error('Error loading reviews:', err);
        document.getElementById('reviews-container').innerHTML = 
          '<div class="alert alert-danger">Error loading reviews. Please refresh the page.</div>';
      });
  }
  
  function displayReviewSummary(data) {
    const avgRating = data.averageRating || 0;
    const total = data.totalReviews || 0;
    
    // Update average rating
    document.getElementById('avg-rating').textContent = avgRating.toFixed(1);
    document.getElementById('total-reviews').textContent = 
      total === 0 ? 'No reviews yet' : `Based on ${total} ${total === 1 ? 'review' : 'reviews'}`;
    
    // Update stars
    displayStars('avg-stars', avgRating);
    
    // Update distribution
    const distDiv = document.getElementById('rating-distribution');
    let html = '';
    for (let i = 5; i >= 1; i--) {
      const count = data.distribution[i] || 0;
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      const barColor = i >= 4 ? 'success' : i === 3 ? 'warning' : 'danger';
      
      html += `
        <div class="mb-2">
          <span class="mr-2">${i} stars</span>
          <div class="progress" style="height: 20px; display: inline-block; width: 60%;">
            <div class="progress-bar bg-${barColor}" role="progressbar" style="width: ${percent}%"></div>
          </div>
          <span class="ml-2">${percent}%</span>
        </div>
      `;
    }
    distDiv.innerHTML = html;
  }
  
  function displayStars(containerId, rating) {
    const container = document.getElementById(containerId);
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let html = '';
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        html += '<i class="fas fa-star"></i> ';
      } else if (i === fullStars + 1 && hasHalf) {
        html += '<i class="fas fa-star-half-alt"></i> ';
      } else {
        html += '<i class="far fa-star"></i> ';
      }
    }
    
    container.innerHTML = html;
  }
  
  function displayReviews(reviews) {
    const container = document.getElementById('reviews-container');
    
    if (!reviews || reviews.length === 0) {
      container.innerHTML = '<div class="alert alert-info">No reviews yet. Be the first to review this product!</div>';
      return;
    }
    
    let html = '';
    reviews.forEach(review => {
      const date = formatDate(review.createdAt);
      const stars = getStarsHtml(review.rating);
      const verifiedBadge = review.verified ? '<span class="badge badge-success ml-2">Verified Purchase</span>' : '';
      
      html += `
        <div class="card mb-3">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h5 class="card-title">${escapeHtml(review.userName)} ${verifiedBadge}</h5>
                <div class="text-warning mb-2">${stars}</div>
                <h6 class="mb-2"><strong>${escapeHtml(review.reviewTitle)}</strong></h6>
              </div>
              <small class="text-muted">${date}</small>
            </div>
            <p class="card-text">${escapeHtml(review.reviewText)}</p>
            <button class="btn btn-sm btn-outline-secondary helpful-btn" data-review-id="${review._id}">
              <i class="far fa-thumbs-up"></i> Helpful (<span class="helpful-count">${review.helpful || 0}</span>)
            </button>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
    
    // Attach event listeners to helpful buttons
    document.querySelectorAll('.helpful-btn').forEach(btn => {
      btn.addEventListener('click', handleHelpfulClick);
    });
  }
  
  function getStarsHtml(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += i <= rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    }
    return html;
  }
  
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function handleHelpfulClick(e) {
    const btn = e.currentTarget;
    const reviewId = btn.getAttribute('data-review-id');
    
    btn.disabled = true;
    
    fetch(`/api/review/${reviewId}/helpful`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          btn.querySelector('.helpful-count').textContent = data.helpful;
        }
      })
      .catch(err => console.error('Error marking helpful:', err))
      .finally(() => {
        setTimeout(() => btn.disabled = false, 2000);
      });
  }
  
  // Star rating selection in modal
  const stars = document.querySelectorAll('.star-rating');
  stars.forEach(star => {
    star.addEventListener('click', function() {
      selectedRating = parseInt(this.getAttribute('data-rating'));
      document.getElementById('rating-value').value = selectedRating;
      
      // Update visual stars
      stars.forEach((s, idx) => {
        if (idx < selectedRating) {
          s.classList.remove('far');
          s.classList.add('fas');
        } else {
          s.classList.remove('fas');
          s.classList.add('far');
        }
      });
    });
    
    // Hover effect
    star.addEventListener('mouseenter', function() {
      const rating = parseInt(this.getAttribute('data-rating'));
      stars.forEach((s, idx) => {
        if (idx < rating) {
          s.classList.add('text-warning');
        } else {
          s.classList.remove('text-warning');
        }
      });
    });
  });
  
  document.getElementById('star-input').addEventListener('mouseleave', function() {
    stars.forEach((s, idx) => {
      if (idx < selectedRating) {
        s.classList.add('text-warning');
      } else {
        s.classList.remove('text-warning');
      }
    });
  });
  
  // Submit review
  document.getElementById('submit-review-btn').addEventListener('click', function() {
    const title = document.getElementById('review-title').value.trim();
    const text = document.getElementById('review-text').value.trim();
    const status = document.getElementById('review-status');
    
    // Validation
    if (selectedRating === 0) {
      status.className = 'alert alert-danger';
      status.textContent = 'Please select a rating';
      status.style.display = 'block';
      return;
    }
    
    if (!title) {
      status.className = 'alert alert-danger';
      status.textContent = 'Please enter a review title';
      status.style.display = 'block';
      return;
    }
    
    if (!text) {
      status.className = 'alert alert-danger';
      status.textContent = 'Please enter your review';
      status.style.display = 'block';
      return;
    }
    
    // Disable button
    this.disabled = true;
    this.textContent = 'Submitting...';
    
    // Submit review
    fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: id,
        productType: type,
        rating: selectedRating,
        reviewTitle: title,
        reviewText: text
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        status.className = 'alert alert-success';
        status.textContent = 'Review submitted successfully! Thank you for your feedback.';
        status.style.display = 'block';
        
        // Reset form
        document.getElementById('review-form').reset();
        selectedRating = 0;
        stars.forEach(s => {
          s.classList.remove('fas', 'text-warning');
          s.classList.add('far');
        });
        
        // Reload reviews after short delay
        setTimeout(() => {
          $('#writeReviewModal').modal('hide');
          loadReviews();
        }, 1500);
      } else {
        status.className = 'alert alert-danger';
        status.textContent = 'Error submitting review. Please try again.';
        status.style.display = 'block';
      }
    })
    .catch(err => {
      console.error('Error:', err);
      status.className = 'alert alert-danger';
      status.textContent = 'Error submitting review. Please try again.';
      status.style.display = 'block';
    })
    .finally(() => {
      this.disabled = false;
      this.textContent = 'Submit Review';
    });
  });
  
  // Reset modal on close
  $('#writeReviewModal').on('hidden.bs.modal', function() {
    document.getElementById('review-form').reset();
    document.getElementById('review-status').style.display = 'none';
    selectedRating = 0;
    stars.forEach(s => {
      s.classList.remove('fas', 'text-warning');
      s.classList.add('far');
    });
  });
  
})();
