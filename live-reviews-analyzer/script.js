let reviewsData = { reviews: [] }; // Store the reviews data globally
let originalFileName = ''; // Store the original file name
let businessIdentifier = ''; // Store the business identifier

// Function to handle file upload
document.getElementById('fileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
        originalFileName = file.name; // Save the original file name
        businessIdentifier = file.name.replace('.json', ''); // Use the file name as the business identifier
        const reader = new FileReader();
        reader.onload = function (e) {
            reviewsData = JSON.parse(e.target.result);
            localStorage.setItem(businessIdentifier, JSON.stringify(reviewsData)); // Save to localStorage with business identifier
            displayHeader(reviewsData.business);
            createTabs(reviewsData.reviews);
            displayReviews(reviewsData.reviews);
        };
        reader.readAsText(file);
    } else {
        alert('Please upload a valid JSON file.');
    }
});

// Function to save the updated JSON file
document.getElementById('saveButton').addEventListener('click', () => {
    if (businessIdentifier) {
        const savedData = localStorage.getItem(businessIdentifier);
        if (savedData) {
            const reviewsData = JSON.parse(savedData);
            const jsonOutput = JSON.stringify(reviewsData, null, 2);
            const blob = new Blob([jsonOutput], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = originalFileName; // Use the original file name
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            alert('No reviews data available to save.');
        }
    } else {
        alert('No file selected to save.');
    }
});

function displayHeader(business) {    
    // Extract reviews, starRating, and totalReviews from the main object
    const businessName = business._name;
    const starRating = business.starRating;
    const totalReviews = business.totalReviews;

    // Display review summary
    const reviewSummaryElement = document.getElementById('reviewSummary');
    if (reviewSummaryElement) {
    reviewSummaryElement.innerHTML = `
        <div>${businessName}</div>
        <span class="total-reviews">${totalReviews}</span>
        <span class="star">★</span>
        <span class="star-rating">${starRating}</span>
    `;
    }
}

// Function to create tabs for grouping reviews by date
function createTabs(reviews) {
    const tabsContainer = document.getElementById('tabs');
    tabsContainer.innerHTML = ''; // Clear previous content

    const groupedReviews = groupReviewsByDate(reviews);
    const tabKeys = Object.keys(groupedReviews).sort((a, b) => {
        if (a === 'withinYear') return 1; // "Within a year" should be the rightmost tab
        if (b === 'withinYear') return -1;
        return b.localeCompare(a); // Sort year-based tabs in descending order
    });

    tabKeys.forEach((key) => {
        const tab = document.createElement('button');
        const label = key === 'withinYear' ? 'Within this year' : key;
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

// Function to group reviews by date
function groupReviewsByDate(reviews) {
    const groupedReviews = {
        withinYear: []
    };

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

            // Highlight the row if "ignore" is true
            if (review.ignore) {
                row.classList.add('ignore-row');
            }

            // Ignore Checkbox (leftmost column)
            const ignoreCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('ignore-checkbox');
            checkbox.checked = review.ignore || false;
            checkbox.addEventListener('change', () => {
                review.ignore = checkbox.checked;
                if (checkbox.checked) {
                    row.classList.add('ignore-row');
                } else {
                    row.classList.remove('ignore-row');
                }
                // Save the updated reviewsData to localStorage
                localStorage.setItem(businessIdentifier, JSON.stringify(reviewsData));
            });
            ignoreCell.appendChild(checkbox);
            row.appendChild(ignoreCell);

            // Reviewer (Avatar and Name)
            const reviewerCell = document.createElement('td');
            const reviewerLink = document.createElement('a');
            reviewerLink.href = review.reviewer.link || '#';
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

// Function to generate star icons
function generateStars(rating) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        const starClass = i <= rating ? 'star gold' : 'star gray';
        stars.push(`<span class="${starClass}">★</span>`);
    }
    return stars.join('');
}