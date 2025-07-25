let reviewsData = { reviews: [] }; // Store the reviews data globally
let originalFileName = ""; // Store the original file name
let businessIdentifier = ""; // Store the business identifier

// Global counters for ignore, fake reviews, and fake reviewers
let globalIgnoreCounter = 0;
let globalFakeReviewCounter = 0;
let globalFakeReviewerCounter = 0;

// Tablevel counters for ignore, fake reviews, and fake reviewers
let tabIgnoreCounter = 0;
let tabFakeReviewCounter = 0;
let tabFakeReviewerCounter = 0;

// Function to load the JSON file based on the query parameter
function loadJsonFile() {
  const urlParams = new URLSearchParams(window.location.search);
  const fileName = urlParams.get("file");

  if (fileName) {
    // Set the tab title to the file name
    document.title = fileName.replace(".json", "");

    const request = new XMLHttpRequest();
    request.open("GET", `./json/no_website/${fileName}`, false);
    request.send(null);

    if (request.status === 200) {
      reviewsData = JSON.parse(request.responseText);
      localStorage.setItem("reviewsData", JSON.stringify(reviewsData));
      displayHeader(reviewsData.business);
      displayOverallPercentages(reviewsData.reviews);
      createTabs(reviewsData.reviews);
    } else {
      console.error("Failed to load JSON file:", fileName);
    }
  }
}

window.onload = loadJsonFile;

// Function to save the updated JSON file
document.getElementById("saveButton").addEventListener("click", () => {
  if (businessIdentifier) {
    const savedData = localStorage.getItem(businessIdentifier);
    if (savedData) {
      const reviewsData = JSON.parse(savedData);
      const jsonOutput = JSON.stringify(reviewsData, null, 2);
      const blob = new Blob([jsonOutput], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalFileName; // Use the original file name
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert("No reviews data available to save.");
    }
  } else {
    alert("No file selected to save.");
  }
});

// Function to display business info
function displayHeader(business) {
  const businessName = business._name;
  const starRating = business.starRating;
  const totalReviews = business.totalReviews;

  const businessInfo = document.getElementById("businessInfo");
  businessInfo.classList.add("visible");

  let businessNameElem = businessInfo.querySelector(".business-name");
  businessNameElem.textContent = businessName;
  businessNameElem.href = business.link;

  businessInfo.querySelector(".star-rating").textContent = starRating;
  businessInfo.querySelector(".total-reviews").textContent = `${totalReviews}`;

  document.querySelector(".contact-info .location").textContent = business._location;
  if (business.website) {
    const website = document.querySelector(".contact-info .website");
    website.textContent = "website: " + business.website;
    website.href = business.website;
  }

  if (business.booking) {
    const booking = document.querySelector(".contact-info .booking");
    booking.textContent = "booking: " + business.booking;
    booking.href = business.booking;
  }

  if (business.phone) {
    const phone = document.querySelector(".contact-info .phone");
    phone.textContent = "phone: " + business.phone;
  }
}

// Function to create tabs for grouping reviews by date
function createTabs(reviews) {
  const tabsContainer = document.getElementById("tabs");
  tabsContainer.innerHTML = ""; // Clear previous content

  const groupedReviews = groupReviewsByDate(reviews);
  const tabKeys = Object.keys(groupedReviews).sort((a, b) => {
    if (a === "withinYear") return 1; // "Within a year" should be the rightmost tab
    if (b === "withinYear") return -1;

    let numberA = a.match(/\d+/g)[0];
    let numberB = b.match(/\d+/g)[0];
    return numberB - numberA; // Sort year-based tabs in descending order
  });

  tabKeys.forEach((key) => {
    const tab = document.createElement("button");
    const label = key === "withinYear" ? "Within this year" : key;
    tab.textContent = `${label} (${groupedReviews[key].length})`;
    tab.classList.add("tab");
    tab.addEventListener("click", () => {
      // Remove the "active" class from all tabs
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      // Add the "active" class to the clicked tab
      tab.classList.add("active");
      displayReviews(groupedReviews[key]);
    });
    tabsContainer.appendChild(tab);
  });

  // Display the first tab by default and mark it as active
  const firstTab = tabsContainer.querySelector(".tab:last-child");
  if (firstTab) {
    firstTab.classList.add("active");
  }
  displayReviews(groupedReviews[tabKeys[tabKeys.length - 1]]);
}

// Function to group reviews by date
function groupReviewsByDate(reviews) {
  const groupedReviews = {
    withinYear: [],
  };

  const now = new Date(); // Current date for reference

  reviews.forEach((review) => {
    const since = review.since;
    if (!since) {
      groupedReviews.withinYear.push(review);
      return;
    }

    if (since.unit === "year") {
      const key = `${since.value} year${since.value > 1 ? "s" : ""} ago`;
      if (!groupedReviews[key]) {
        groupedReviews[key] = [];
      }
      groupedReviews[key].push(review);
    } else {
      groupedReviews.withinYear.push(review);
    }
  });

  // Sort the "withinYear" group by date (newest to oldest)
  groupedReviews.withinYear.sort((a, b) => {
    const dateA = calculateReviewDate(a.since, now);
    const dateB = calculateReviewDate(b.since, now);
    return dateB - dateA; // Sort in descending order (newest first)
  });

  return groupedReviews;
}

// Helper function to calculate the approximate review date based on the since object
function calculateReviewDate(since, now) {
  if (!since) return now; // If no date is available, treat it as the current date

  const { unit, value } = since;
  const date = new Date(now); // Clone the current date

  switch (unit) {
    case "hour":
      date.setHours(date.getHours() - value);
      break;
    case "day":
      date.setDate(date.getDate() - value);
      break;
    case "week":
      date.setDate(date.getDate() - value * 7);
      break;
    case "month":
      date.setMonth(date.getMonth() - value);
      break;
    case "year":
      date.setFullYear(date.getFullYear() - value);
      break;
    default:
      // If the unit is unknown, treat it as the current date
      break;
  }

  return date;
}

// Function to display reviews in the table
function displayReviews(reviews) {
  displayTabPercentages(reviews);

  const reviewsBody = document.getElementById("reviewsBody");
  reviewsBody.innerHTML = ""; // Clear previous content

  // Reset tab-level counters
  tabIgnoreCounter = 0;
  tabFakeReviewCounter = 0;
  tabFakeReviewerCounter = 0;
  const images = [];

  if (reviews && reviews.length > 0) {
    reviews.forEach((review, index) => {
      const row = document.createElement("tr");

      // Add a class for local guides
      if (review.reviewer.isLocalGuide) {
        row.classList.add("local-guide");
      }

      // Highlight the row if either "ignore", "fakeReview", or "fakeReviewer" is true
      if (review.ignore || review.fakeReview || review.fakeReviewer) {
        row.classList.add("ignore-row");
      }

      // Reviewer (Avatar and Name)
      const reviewerCell = document.createElement("td");
      const reviewerLink = document.createElement("a");
      reviewerLink.href = review.reviewer.link || "#";
      reviewerLink.target = "_blank";
      reviewerLink.classList.add("reviewer-link");
      reviewerLink.innerHTML = `
                <img alt="Avatar" src=${review.reviewer.avatar} || "https://placehold.co/50x50"} class="avatar">
                <div>
                    ${review.reviewer.name}
                    ${
                      review.reviewer.numberOfReviews
                        ? `<span class="review-count">(${review.reviewer.numberOfReviews})</span>`
                        : ""
                    }
                </div>
                ${review.reviewer.isLocalGuide ? '<div class="local-guide-text">مرشد محلي</div>' : ""}
            `;
      reviewerCell.appendChild(reviewerLink);
      row.appendChild(reviewerCell);
      // images.push({ link: reviewerLink, url: review.reviewer.avatar || "https://placehold.co/50x50}" });

      // Stars
      const starsCell = document.createElement("td");
      const starsContainer = document.createElement("div");
      starsContainer.classList.add("stars-container");
      starsContainer.innerHTML = `
                <div class="stars">${generateStars(parseFloat(review.review.stars))}</div>
                <div class="review-date">${review.since?.text || "N/A"}</div>
            `;
      starsCell.appendChild(starsContainer);
      row.appendChild(starsCell);

      // Review
      const reviewCell = document.createElement("td");
      reviewCell.textContent = review.review.text || "N/A";
      row.appendChild(reviewCell);

      // Business Response
      const responseCell = document.createElement("td");
      responseCell.textContent = review.review.response || "N/A";
      row.appendChild(responseCell);

      // Ignore Checkbox
      const ignoreCell = document.createElement("td");
      const ignoreCheckbox = document.createElement("input");
      ignoreCheckbox.type = "checkbox";
      ignoreCheckbox.classList.add("ignore-checkbox");
      ignoreCheckbox.checked = review.ignore || false;
      ignoreCheckbox.addEventListener("change", () => {
        review.ignore = ignoreCheckbox.checked;
        updateRowHighlight(row, review);
        updateGlobalCounters(); // Update global counters
        updateTabCounters(reviews); // Update tab-level counters
        localStorage.setItem(businessIdentifier, JSON.stringify(reviewsData));
      });
      ignoreCell.appendChild(ignoreCheckbox);
      row.appendChild(ignoreCell);

      // Fake Review Checkbox
      const fakeReviewCell = document.createElement("td");
      const fakeReviewCheckbox = document.createElement("input");
      fakeReviewCheckbox.type = "checkbox";
      fakeReviewCheckbox.classList.add("fake-review-checkbox");
      fakeReviewCheckbox.checked = review.fakeReview || false;
      fakeReviewCheckbox.addEventListener("change", () => {
        review.fakeReview = fakeReviewCheckbox.checked;
        updateRowHighlight(row, review);
        updateGlobalCounters(); // Update global counters
        updateTabCounters(reviews); // Update tab-level counters
        localStorage.setItem(businessIdentifier, JSON.stringify(reviewsData));
      });
      fakeReviewCell.appendChild(fakeReviewCheckbox);
      row.appendChild(fakeReviewCell);

      // Fake Reviewer Checkbox
      const fakeReviewerCell = document.createElement("td");
      const fakeReviewerCheckbox = document.createElement("input");
      fakeReviewerCheckbox.type = "checkbox";
      fakeReviewerCheckbox.classList.add("fake-reviewer-checkbox");
      fakeReviewerCheckbox.checked = review.fakeReviewer || false;
      fakeReviewerCheckbox.addEventListener("change", () => {
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

  // downloadImages(images);
  // Update tab-level counters display
  updateTabCounters(reviews);
}

// function downloadImages(images) {
//   let delay = 0;
//   images.forEach((image) => {
//     delay += 5000;
//     setTimeout(() => {
//       image.link.querySelector("img").src = image.url;
//     }, delay);
//   });
// }

// Function to generate star icons
function generateStars(rating) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const starClass = i <= rating ? "star gold" : "star gray";
    stars.push(`<span class="${starClass}">★</span>`);
  }
  return stars.join("");
}

// Function to update global counters
function updateGlobalCounters() {
  const reviews = reviewsData.reviews;
  // Reset global counters
  globalIgnoreCounter = 0;
  globalFakeReviewCounter = 0;
  globalFakeReviewerCounter = 0;

  // Iterate through all reviews to calculate the global counters
  reviews.forEach((review) => {
    if (review.ignore) globalIgnoreCounter++;
    if (review.fakeReview) globalFakeReviewCounter++;
    if (review.fakeReviewer) globalFakeReviewerCounter++;
  });

  const fakeReviewsCard = document.querySelector("#globalStats .fake-reviews-card");
  updateFakeReviewsCard(fakeReviewsCard, reviews, true);
}

// Function to update tab-level counters
function updateTabCounters(reviews) {
  // Reset tab-level counters
  tabIgnoreCounter = 0;
  tabFakeReviewCounter = 0;
  tabFakeReviewerCounter = 0;

  // Iterate through the current tab's reviews to calculate the tab-level counters
  reviews.forEach((review) => {
    if (review.ignore) tabIgnoreCounter++;
    if (review.fakeReview) tabFakeReviewCounter++;
    if (review.fakeReviewer) tabFakeReviewerCounter++;
  });

  const fakeReviewsCard = document.querySelector("#tabStats .fake-reviews-card");
  updateFakeReviewsCard(fakeReviewsCard, reviews, false);
}

// Helper function to update row highlighting
function updateRowHighlight(row, review) {
  if (review.ignore || review.fakeReview || review.fakeReviewer) {
    row.classList.add("ignore-row");
  } else {
    row.classList.remove("ignore-row");
  }
}

// Function to calculate local guide percentage
function calculateLocalGuidePercentage(reviews) {
  const localGuides = reviews.filter((review) => review.reviewer.isLocalGuide).length;
  const nonLocalGuides = reviews.length - localGuides;
  const localGuidePercentage = ((localGuides / reviews.length) * 100).toFixed(0);
  const nonLocalGuidePercentage = ((nonLocalGuides / reviews.length) * 100).toFixed(0);
  return { localGuides, localGuidePercentage, nonLocalGuides, nonLocalGuidePercentage };
}

// Function to calculate single review percentage
function calculateSingleReviewPercentage(reviews) {
  const singleReviewers = reviews.filter((review) => review.reviewer.numberOfReviews === 1).length;
  const singleReviewPercentage = ((singleReviewers / reviews.length) * 100).toFixed(0);
  return { singleReviewers, singleReviewPercentage };
}

// Function to calculate star distribution
function calculateStarDistribution(reviews) {
  const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((review) => {
    const stars = Math.floor(parseFloat(review.review.stars));
    if (stars >= 1 && stars <= 5) {
      starCounts[stars]++;
    }
  });

  const totalReviews = reviews.length;
  const starPercentages = {};
  for (let star in starCounts) {
    starPercentages[star] = ((starCounts[star] / totalReviews) * 100).toFixed(0);
  }

  return { starPercentages, starCounts };
}

// Function to display star distribution
function displayStarDistribution(starItems, reviews) {
  const stars = calculateStarDistribution(reviews);

  starItems.forEach((item, index) => {
    const percent = item.querySelector(".star-distribution .percent");
    const count = item.querySelector(".stat-value .count");
    const starLabel = item.querySelector(".stat-label");
    const star = 5 - index; // 5 stars, 4 stars, ..., 1 star
    percent.textContent = `${stars.starPercentages[star]}%`;
    count.textContent = `(${stars.starCounts[star]})`;
    starLabel.textContent = `${star} stars`;
  });
}

// Function to display overall percentages
function displayOverallPercentages(reviews) {
  const starItems = document.querySelectorAll("#globalStats .star-distribution-card .stat-item");
  displayStarDistribution(starItems, reviewsData.reviews);

  const { localGuides, localGuidePercentage, nonLocalGuides, nonLocalGuidePercentage } =
    calculateLocalGuidePercentage(reviews);
  const { singleReviewers, singleReviewPercentage } = calculateSingleReviewPercentage(reviews);

  if (localGuidePercentage < 40) {
    // window.close();
  }

  // Update Local Guides Card
  const localGuidesCard = document.querySelector("#globalStats .local-guides-card");
  localGuidesCard.querySelectorAll(".stat-item")[0].querySelector(".percent").textContent = `${localGuidePercentage}%`;
  localGuidesCard.querySelectorAll(".stat-item")[0].querySelector(".count").textContent = `(${localGuides})`;

  localGuidesCard
    .querySelectorAll(".stat-item")[1]
    .querySelector(".percent").textContent = `${nonLocalGuidePercentage}%`;
  localGuidesCard.querySelectorAll(".stat-item")[1].querySelector(".count").textContent = `(${nonLocalGuides})`;

  localGuidesCard
    .querySelectorAll(".stat-item")[2]
    .querySelector(".percent").textContent = `${singleReviewPercentage}%`;
  localGuidesCard.querySelectorAll(".stat-item")[2].querySelector(".count").textContent = `(${singleReviewers})`;

  updateGlobalCounters();
}

// Function to display tab percentages
function displayTabPercentages(reviews) {
  const starItems = document.querySelectorAll("#tabStats .star-distribution-card .stat-item");
  displayStarDistribution(starItems, reviews);

  const { localGuides, localGuidePercentage, nonLocalGuides, nonLocalGuidePercentage } =
    calculateLocalGuidePercentage(reviews);
  const { singleReviewers, singleReviewPercentage } = calculateSingleReviewPercentage(reviews);

  // Update Local Guides Card
  const localGuidesCard = document.querySelector("#tabStats .local-guides-card");
  localGuidesCard.querySelectorAll(".stat-item")[0].querySelector(".percent").textContent = `${localGuidePercentage}%`;
  localGuidesCard.querySelectorAll(".stat-item")[0].querySelector(".count").textContent = `(${localGuides})`;

  localGuidesCard
    .querySelectorAll(".stat-item")[1]
    .querySelector(".percent").textContent = `${nonLocalGuidePercentage}%`;
  localGuidesCard.querySelectorAll(".stat-item")[1].querySelector(".count").textContent = `(${nonLocalGuides})`;

  localGuidesCard
    .querySelectorAll(".stat-item")[2]
    .querySelector(".percent").textContent = `${singleReviewPercentage}%`;
  localGuidesCard.querySelectorAll(".stat-item")[2].querySelector(".count").textContent = `(${singleReviewers})`;

  const fakeReviewsCard = document.querySelector("#tabStats .fake-reviews-card");
  updateFakeReviewsCard(fakeReviewsCard, reviews, false);
}

function updateFakeReviewsCard(fakeReviewsCard, reviews, global) {
  const fakeReviews = global ? globalFakeReviewCounter : tabFakeReviewCounter;
  fakeReviewsCard.querySelector(".fake-reviews").innerHTML = `(${fakeReviews})`;
  fakeReviewsCard.querySelector(".fake-reviews").previousElementSibling.innerHTML =
    ((fakeReviews / reviews.length) * 100).toFixed(0) + "%";

  const fakeReviewer = global ? globalFakeReviewerCounter : tabFakeReviewerCounter;
  fakeReviewsCard.querySelector(".fake-reviewers").innerHTML = `(${fakeReviewer})`;
  fakeReviewsCard.querySelector(".fake-reviewers").previousElementSibling.innerHTML =
    ((fakeReviewer / reviews.length) * 100).toFixed(0) + "%";

  const ignore = global ? globalIgnoreCounter : tabIgnoreCounter;
  fakeReviewsCard.querySelector(".ignored-reviews").innerHTML = `(${ignore})`;
  fakeReviewsCard.querySelector(".ignored-reviews").previousElementSibling.innerHTML =
    ((ignore / reviews.length) * 100).toFixed(0) + "%";
}

// Add event listener to toggle global stats visibility
document.querySelectorAll(".toggle-button").forEach((elem) => {
  elem.addEventListener("click", function () {
    const stats = this.nextElementSibling;
    stats.classList.toggle("hidden");
  });
});
