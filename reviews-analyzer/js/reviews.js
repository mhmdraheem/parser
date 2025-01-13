// Retrieve the file key from the URL (e.g., ?file=reviews_filename)
const urlParams = new URLSearchParams(window.location.search);
const fileKey = urlParams.get('file');

// Retrieve the main reviews object from localStorage
const reviewsData = fileKey ? JSON.parse(localStorage.getItem(fileKey)) : null;

// Extract reviews, starRating, and totalReviews from the main object
const reviews = reviewsData?.reviews || [];
const starRating = reviewsData?.starRating || '0';
const totalReviews = reviewsData?.totalReviews || '0';

// Display review summary
const reviewSummaryElement = document.getElementById('reviewSummary');
if (reviewSummaryElement) {
  reviewSummaryElement.innerHTML = `
    <span class="total-reviews">${totalReviews}</span>
    <span class="star">★</span>
    <span class="star-rating">${starRating}</span>
  `;
}

// Function to generate star icons
function generateStars(rating) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const starClass = i <= rating ? 'star gold' : 'star gray';
    stars.push(`<span class="${starClass}">★</span>`);
  }
  return stars.join('');
}

// Function to save reviews to localStorage
function saveReviews() {
  localStorage.setItem(fileKey, JSON.stringify(reviewsData));
}

// Function to group reviews by date
function groupReviewsByDate(reviews) {
  const groupedReviews = {
    withinYear: [] // Renamed to camelCase
  };

  // Group reviews by year
  reviews.forEach((review) => {
    const since = review.since;
    if (!since) {
      groupedReviews.withinYear.push(review);
      return;
    }

    if (since.unit === 'year') {
      const key = `${since.value} year${since.value > 1 ? 's' : ''} ago`;
      if (!groupedReviews[key]) {
        groupedReviews[key] = [];
      }
      groupedReviews[key].push(review);
    } else {
      groupedReviews.withinYear.push(review);
    }
  });

  return groupedReviews;
}

// Function to display reviews in the table
function displayReviews(reviews) {
  const reviewsBody = document.getElementById('reviewsBody');
  reviewsBody.innerHTML = ''; // Clear previous content

  if (reviews && reviews.length > 0) {
    reviews.forEach((review, index) => {
      const row = document.createElement('tr');

      // Add a class for local guides
      if (review.reviewer.isLocalGuide) {
        row.classList.add('local-guide');
      }

      // Apply red-row style if the review is marked as "Ignore"
      if (review.ignore) {
        row.classList.add('ignore-row');
      }

      // Ignore Checkbox (leftmost column)
      const ignoreCell = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.classList.add('ignore-checkbox');
      checkbox.checked = review.ignore || false; // Use "ignore" instead of "authentic"
      checkbox.addEventListener('change', () => {
        reviews[index].ignore = checkbox.checked; // Use "ignore" instead of "authentic"
        saveReviews(); // Save updated reviews to localStorage

        // Toggle red background when checked
        if (checkbox.checked) {
          row.classList.add('ignore-row');
        } else {
          row.classList.remove('ignore-row');
        }
      });
      ignoreCell.appendChild(checkbox);
      row.appendChild(ignoreCell); // Add as the first cell

      // Reviewer (Avatar and Name)
      const reviewerCell = document.createElement('td');
      const reviewerLink = document.createElement('a');
      reviewerLink.href = review.reviewer.link;
      reviewerLink.target = "_blank";
      reviewerLink.classList.add('reviewer-link');
      reviewerLink.innerHTML = `
        <img src="${review.reviewer.avatar || 'https://placehold.co/50x50'}" alt="Avatar" class="avatar">
        <div>
          ${review.reviewer.name}
          ${review.reviewer.numberOfReviews ? `<span class="review-count">(${review.reviewer.numberOfReviews})</span>` : ''}
        </div>
        ${review.reviewer.isLocalGuide ? '<div class="local-guide-text">مرشد محلي</div>' : ''}
      `;
      reviewerCell.appendChild(reviewerLink);
      row.appendChild(reviewerCell);

      // Stars
      const starsCell = document.createElement('td');
      const starsContainer = document.createElement('div');
      starsContainer.classList.add('stars-container');
      starsContainer.innerHTML = `
        <div class="stars">${generateStars(parseFloat(review.review.stars))}</div>
        <div class="review-date">${review.since?.text || 'N/A'}</div>
      `;
      starsCell.appendChild(starsContainer);
      row.appendChild(starsCell);

      // Review
      const reviewCell = document.createElement('td');
      reviewCell.textContent = review.review.text || 'N/A';
      row.appendChild(reviewCell);

      // Business Response
      const responseCell = document.createElement('td');
      responseCell.textContent = review.review.response || 'N/A';
      row.appendChild(responseCell);

      reviewsBody.appendChild(row);
    });
  } else {
    reviewsBody.innerHTML = `<tr><td colspan="5">No reviews found.</td></tr>`;
  }
}

// Function to create tabs
function createTabs(groupedReviews) {
  const tabsContainer = document.getElementById('tabs');
  tabsContainer.innerHTML = ''; // Clear previous content

  // Get all keys (tab labels) and sort them
  const tabKeys = Object.keys(groupedReviews).sort((a, b) => {
    if (a === 'withinYear') return 1; // "Within a year" should be the rightmost tab
    if (b === 'withinYear') return -1;
    return b.localeCompare(a); // Sort year-based tabs in descending order
  });

  // Create tabs
  tabKeys.forEach((key) => {
    const tab = document.createElement('button');
    const label = key === 'withinYear' ? 'Within this year' : key; // Display "Within a year" in the UI
    tab.textContent = `${label} (${groupedReviews[key].length})`;
    tab.classList.add('tab');
    tab.addEventListener('click', () => {
      // Remove the "active" class from all tabs
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      // Add the "active" class to the clicked tab
      tab.classList.add('active');
      displayReviews(groupedReviews[key]);
    });
    tabsContainer.appendChild(tab);
  });

  // Display the first tab by default and mark it as active
  const firstTab = tabsContainer.querySelector('.tab:last-child');
  if (firstTab) {
    firstTab.classList.add('active');
  }
  displayReviews(groupedReviews[tabKeys[tabKeys.length - 1]]);
}

// Group reviews by date and create tabs
if (reviews && reviews.length > 0) {
  
  const groupedReviews = groupReviewsByDate(reviews);
  createTabs(groupedReviews);
} else {
  document.getElementById('reviewsBody').innerHTML = `<tr><td colspan="5">No reviews found.</td></tr>`;
}