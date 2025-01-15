let reviewsData = { reviews: [] }; // Store the reviews data globally
let originalFileName = ''; // Store the original file name
let businessIdentifier = ''; // Store the business identifier

// Global counters for ignore, fake reviews, and fake reviewers
let globalIgnoreCounter = 0;
let globalFakeReviewCounter = 0;
let globalFakeReviewerCounter = 0;

// Tab-level counters for ignore, fake reviews, and fake reviewers
let tabIgnoreCounter = 0;
let tabFakeReviewCounter = 0;
let tabFakeReviewerCounter = 0;

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
            displayOverallPercentages(reviewsData.reviews);
            displayGlobalStarDistribution(reviewsData.reviews);
            createTabs(reviewsData.reviews);
            displayReviews(reviewsData.reviews);

            // Initialize global counters
            updateGlobalCounters();
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

// Function to show the overlay
function showOverlay() {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'flex'; // Show the overlay
}

// Function to hide the overlay
function hideOverlay() {
    const overlay = document.getElementById('overlay');
    overlay.style.display = 'none'; // Hide the overlay
}

// Add event listeners for the overlay
document.getElementById('showStatsButton').addEventListener('click', showOverlay);
document.getElementById('closeOverlay').addEventListener('click', hideOverlay);

// Close the overlay if the user clicks outside of it
window.addEventListener('click', (event) => {
    const overlay = document.getElementById('overlay');
    if (event.target === overlay) {
        hideOverlay();
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
    displayTabPercentages(reviews);
    displayTabStarDistribution(reviews);

    const reviewsBody = document.getElementById('reviewsBody');
    reviewsBody.innerHTML = ''; // Clear previous content

    // Reset tab-level counters
    tabIgnoreCounter = 0;
    tabFakeReviewCounter = 0;
    tabFakeReviewerCounter = 0;

    if (reviews && reviews.length > 0) {
        reviews.forEach((review, index) => {
            const row = document.createElement('tr');

            // Add a class for local guides
            if (review.reviewer.isLocalGuide) {
                row.classList.add('local-guide');
            }

            // Highlight the row if either "ignore", "fakeReview", or "fakeReviewer" is true
            if (review.ignore || review.fakeReview || review.fakeReviewer) {
                row.classList.add('ignore-row');
            }

            // Ignore Checkbox
            const ignoreCell = document.createElement('td');
            const ignoreCheckbox = document.createElement('input');
            ignoreCheckbox.type = 'checkbox';
            ignoreCheckbox.classList.add('ignore-checkbox');
            ignoreCheckbox.checked = review.ignore || false;
            ignoreCheckbox.addEventListener('change', () => {
                review.ignore = ignoreCheckbox.checked;
                updateRowHighlight(row, review);
                updateGlobalCounters(); // Update global counters
                updateTabCounters(reviews); // Update tab-level counters
                localStorage.setItem(businessIdentifier, JSON.stringify(reviewsData));
            });
            ignoreCell.appendChild(ignoreCheckbox);
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

            // Fake Review Checkbox
            const fakeReviewCell = document.createElement('td');
            const fakeReviewCheckbox = document.createElement('input');
            fakeReviewCheckbox.type = 'checkbox';
            fakeReviewCheckbox.classList.add('fake-review-checkbox');
            fakeReviewCheckbox.checked = review.fakeReview || false;
            fakeReviewCheckbox.addEventListener('change', () => {
                review.fakeReview = fakeReviewCheckbox.checked;
                updateRowHighlight(row, review);
                updateGlobalCounters(); // Update global counters
                updateTabCounters(reviews); // Update tab-level counters
                localStorage.setItem(businessIdentifier, JSON.stringify(reviewsData));
            });
            fakeReviewCell.appendChild(fakeReviewCheckbox);
            row.appendChild(fakeReviewCell);

            // Fake Reviewer Checkbox
            const fakeReviewerCell = document.createElement('td');
            const fakeReviewerCheckbox = document.createElement('input');
            fakeReviewerCheckbox.type = 'checkbox';
            fakeReviewerCheckbox.classList.add('fake-reviewer-checkbox');
            fakeReviewerCheckbox.checked = review.fakeReviewer || false;
            fakeReviewerCheckbox.addEventListener('change', () => {
                review.fakeReviewer = fakeReviewerCheckbox.checked;
                updateRowHighlight(row, review);
                updateGlobalCounters(); // Update global counters
                updateTabCounters(reviews); // Update tab-level counters
                localStorage.setItem(businessIdentifier, JSON.stringify(reviewsData));
            });
            fakeReviewerCell.appendChild(fakeReviewerCheckbox);
            row.appendChild(fakeReviewerCell);

            reviewsBody.appendChild(row);

            // Update tab-level counters based on existing data
            if (review.ignore) tabIgnoreCounter++;
            if (review.fakeReview) tabFakeReviewCounter++;
            if (review.fakeReviewer) tabFakeReviewerCounter++;
        });
    } else {
        reviewsBody.innerHTML = `<tr><td colspan="7">No reviews found.</td></tr>`;
    }

    // Update tab-level counters display
    updateTabCounters(reviews);
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

// Function to update global counters
function updateGlobalCounters() {
    // Reset global counters
    globalIgnoreCounter = 0;
    globalFakeReviewCounter = 0;
    globalFakeReviewerCounter = 0;

    // Iterate through all reviews to calculate the global counters
    reviewsData.reviews.forEach(review => {
        if (review.ignore) globalIgnoreCounter++;
        if (review.fakeReview) globalFakeReviewCounter++;
        if (review.fakeReviewer) globalFakeReviewerCounter++;
    });

    // Update the UI for global counters
    document.querySelector('.ignore-counter').textContent = `Ignore: ${globalIgnoreCounter}`;
    document.querySelector('.fake-review-counter').textContent = `Fake Reviews: ${globalFakeReviewCounter}`;
    document.querySelector('.fake-reviewer-counter').textContent = `Fake Reviewers: ${globalFakeReviewerCounter}`;
}

// Function to update tab-level counters
function updateTabCounters(reviews) {
    // Reset tab-level counters
    tabIgnoreCounter = 0;
    tabFakeReviewCounter = 0;
    tabFakeReviewerCounter = 0;

    // Iterate through the current tab's reviews to calculate the tab-level counters
    reviews.forEach(review => {
        if (review.ignore) tabIgnoreCounter++;
        if (review.fakeReview) tabFakeReviewCounter++;
        if (review.fakeReviewer) tabFakeReviewerCounter++;
    });

    // Update the UI for tab-level counters
    document.querySelector('.tab-ignore-counter').textContent = `Ignore (Tab): ${tabIgnoreCounter}`;
    document.querySelector('.tab-fake-review-counter').textContent = `Fake Reviews (Tab): ${tabFakeReviewCounter}`;
    document.querySelector('.tab-fake-reviewer-counter').textContent = `Fake Reviewers (Tab): ${tabFakeReviewerCounter}`;
}

// Helper function to update row highlighting
function updateRowHighlight(row, review) {
    if (review.ignore || review.fakeReview || review.fakeReviewer) {
        row.classList.add('ignore-row');
    } else {
        row.classList.remove('ignore-row');
    }
}

// Rest of the functions (e.g., calculateLocalGuidePercentage, displayOverallPercentages, etc.) remain unchanged...

function calculateLocalGuidePercentage(reviews) {
    const localGuides = reviews.filter(review => review.reviewer.isLocalGuide).length;
    const nonLocalGuides = reviews.length - localGuides;
    const localGuidePercentage = ((localGuides / reviews.length) * 100).toFixed(2);
    const nonLocalGuidePercentage = ((nonLocalGuides / reviews.length) * 100).toFixed(2);
    return { localGuidePercentage, nonLocalGuidePercentage };
}

function calculateLocalGuidePercentagePerTab(reviews) {
    const localGuides = reviews.filter(review => review.reviewer.isLocalGuide).length;
    const nonLocalGuides = reviews.length - localGuides;
    const localGuidePercentage = ((localGuides / reviews.length) * 100).toFixed(2);
    const nonLocalGuidePercentage = ((nonLocalGuides / reviews.length) * 100).toFixed(2);
    return { localGuidePercentage, nonLocalGuidePercentage };
}

function calculateSingleReviewPercentage(reviews) {
    const singleReviewers = reviews.filter(review => review.reviewer.numberOfReviews === 1).length;
    const singleReviewPercentage = ((singleReviewers / reviews.length) * 100).toFixed(2);
    return singleReviewPercentage;
}

function calculateSingleReviewPercentageByType(reviews) {
    const localGuides = reviews.filter(review => review.reviewer.isLocalGuide);
    const nonLocalGuides = reviews.filter(review => !review.reviewer.isLocalGuide);
    const singleReview = reviews.filter(review => review.reviewer.numberOfReviews === 1);

    const singleReviewLocalGuides = localGuides.filter(review => review.reviewer.numberOfReviews === 1).length;
    const singleReviewNonLocalGuides = nonLocalGuides.filter(review => review.reviewer.numberOfReviews === 1).length;

    let localGuidePercentage = 0.00, nonLocalGuidePercentage = 0.00;
    if(singleReview.length !== 0) {
        localGuidePercentage = ((singleReviewLocalGuides / singleReview.length) * 100).toFixed(2);
        nonLocalGuidePercentage = ((singleReviewNonLocalGuides / singleReview.length) * 100).toFixed(2);
    }

    return { localGuidePercentage, nonLocalGuidePercentage };
}

function calculateSingleReviewPercentagePerTab(reviews) {
    const singleReviewers = reviews.filter(review => review.reviewer.numberOfReviews === 1).length;
    const singleReviewPercentage = ((singleReviewers / reviews.length) * 100).toFixed(2);
    return singleReviewPercentage;
}

function calculateSingleReviewPercentageByTypePerTab(reviews) {
    const localGuides = reviews.filter(review => review.reviewer.isLocalGuide);
    const nonLocalGuides = reviews.filter(review => !review.reviewer.isLocalGuide);
    const singleReview = reviews.filter(review => review.reviewer.numberOfReviews === 1);

    const singleReviewLocalGuides = localGuides.filter(review => review.reviewer.numberOfReviews === 1).length;
    const singleReviewNonLocalGuides = nonLocalGuides.filter(review => review.reviewer.numberOfReviews === 1).length;

    let localGuidePercentage = 0.00, nonLocalGuidePercentage = 0.00;
    if(singleReview.length !== 0) {
        localGuidePercentage = ((singleReviewLocalGuides / singleReview.length) * 100).toFixed(2);
        nonLocalGuidePercentage = ((singleReviewNonLocalGuides / singleReview.length) * 100).toFixed(2);
    }
    
    return { localGuidePercentage, nonLocalGuidePercentage };
}

function displayOverallPercentages(reviews) {
    const { localGuidePercentage, nonLocalGuidePercentage } = calculateLocalGuidePercentage(reviews);
    const singleReviewPercentage = calculateSingleReviewPercentage(reviews);
    const { localGuidePercentage: singleLocal, nonLocalGuidePercentage: singleNonLocal } = calculateSingleReviewPercentageByType(reviews);

    const summaryStats = document.querySelector('.summary-stats');
    summaryStats.innerHTML += `
        <div>${localGuidePercentage}% local || ${nonLocalGuidePercentage}% non-local</div>
        <div>${singleReviewPercentage}% Single reviewers => ${singleLocal}% local || ${singleNonLocal}% non-local</div>    
    `;
}

function displayTabPercentages(reviews) {
    const { localGuidePercentage, nonLocalGuidePercentage } = calculateLocalGuidePercentagePerTab(reviews);
    const singleReviewPercentage = calculateSingleReviewPercentagePerTab(reviews);
    const { localGuidePercentage: singleLocal, nonLocalGuidePercentage: singleNonLocal } = calculateSingleReviewPercentageByTypePerTab(reviews);

    const tabStats = document.querySelector("#tabStats");
    if(tabStats) {
        tabStats.remove();
    }

    const statsElement = document.querySelector('.stats');
    statsElement.innerHTML = `
        <div>${localGuidePercentage}% local || ${nonLocalGuidePercentage}% non-local</div>
        <div>${singleReviewPercentage}% Single reviewers => ${singleLocal}% local || ${singleNonLocal}% non-local</div>    
    `;
}

function calculateStarDistribution(reviews) {
    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
        const stars = Math.floor(parseFloat(review.review.stars));
        if (stars >= 1 && stars <= 5) {
            starCounts[stars]++;
        }
    });

    const totalReviews = reviews.length;
    const starPercentages = {};
    for (let star in starCounts) {
        starPercentages[star] = ((starCounts[star] / totalReviews) * 100).toFixed(2);
    }

    return starPercentages;
}

function calculateStarDistributionPerTab(reviews) {
    return calculateStarDistribution(reviews); // Reuse the global function for tab-level data
}

function displayGlobalStarDistribution(reviews) {
    const starPercentages = calculateStarDistribution(reviews);
    const globalStarDistElement = document.querySelector('.global-star-distibution');
    globalStarDistElement.innerHTML += `
        <div>
            5<span class="star">★</span>(${starPercentages[5]}%), 
            4<span class="star">★</span>(${starPercentages[4]}%), 
            3<span class="star">★</span>(${starPercentages[3]}%), 
            2<span class="star">★</span>(${starPercentages[2]}%), 
            1<span class="star">★</span>(${starPercentages[1]}%)
        </div>
    `;
}

function displayTabStarDistribution(reviews) {
    const starPercentages = calculateStarDistributionPerTab(reviews);
    const starDistElement = document.querySelector('.star-distibution');
    starDistElement.innerHTML = `
        <div>
            5<span class="star">★</span>(${starPercentages[5]}%), 
            4<span class="star">★</span>(${starPercentages[4]}%), 
            3<span class="star">★</span>(${starPercentages[3]}%), 
            2<span class="star">★</span>(${starPercentages[2]}%), 
            1<span class="star">★</span>(${starPercentages[1]}%)
        </div>
    `;
}