function extractReviewStats(reviews) {
  const totalReviews = reviews.length;

  // 1. Calculate Star Percentages
  const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((review) => {
    const stars = Math.floor(parseFloat(review.review.stars)); // Convert "1.0" to 1
    if (stars >= 1 && stars <= 5) {
      starCounts[stars]++;
    }
  });

  const starPercentages = {};
  for (let star = 1; star <= 5; star++) {
    starPercentages[`${star} star`] = ((starCounts[star] / totalReviews) * 100).toFixed(2) + "%";
  }

  // 2. Calculate Reviewer Percentages
  let unknown = 0;
  let oneReview = 0;
  let twoReviews = 0;
  let moreThanTwoReviews = 0;

  reviews.forEach((review) => {
    const numberOfReviews = review.reviewer.numberOfReviews;
    if (numberOfReviews === undefined) {
      unknown++;
    } else if (numberOfReviews === 1) {
      oneReview++;
    } else if (numberOfReviews === 2) {
      twoReviews++;
    } else if (numberOfReviews > 2) {
      moreThanTwoReviews++;
    }
  });

  const reviewerPercentages = {
    unknown: ((unknown / totalReviews) * 100).toFixed(2) + "%",
    oneReview: ((oneReview / totalReviews) * 100).toFixed(2) + "%",
    twoReviews: ((twoReviews / totalReviews) * 100).toFixed(2) + "%",
    moreThanTwoReviews: ((moreThanTwoReviews / totalReviews) * 100).toFixed(2) + "%",
  };

  // 3. Calculate Local Guide Percentages
  let localGuides = 0;
  let nonLocalGuides = 0;

  reviews.forEach((review) => {
    if (review.reviewer.isLocalGuide) {
      localGuides++;
    } else {
      nonLocalGuides++;
    }
  });

  const localGuidePercentages = {
    localGuides: ((localGuides / totalReviews) * 100).toFixed(2) + "%",
    nonLocalGuides: ((nonLocalGuides / totalReviews) * 100).toFixed(2) + "%",
  };

  // Return the final result
  return {
    starPercentages,
    reviewerPercentages,
    localGuidePercentages,
  };
}

function displayStats(stats) {
  const statsDiv = document.getElementById('stats');

  // Clear previous content
  statsDiv.innerHTML = `
    <div class="chart-container">
      <h3>Star Percentages</h3>
      <canvas id="starChart"></canvas>
    </div>
    <div class="chart-container">
      <h3>Reviewer Percentages</h3>
      <canvas id="reviewerChart"></canvas>
    </div>
    <div class="chart-container">
      <h3>Local Guide Percentages</h3>
      <canvas id="localGuideChart"></canvas>
    </div>
  `;

  // Star Percentages Bar Chart
  const starCtx = document.getElementById('starChart').getContext('2d');
  new Chart(starCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(stats.starPercentages),
      datasets: [{
        label: 'Percentage',
        data: Object.values(stats.starPercentages).map(p => parseFloat(p)),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
        ],
        borderColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Percentage (%)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Stars'
          }
        }
      },
      plugins: {
        legend: {
          display: false, // Hide legend for bar charts
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.raw}%`;
            }
          }
        }
      }
    }
  });

  // Reviewer Percentages Bar Chart
  const reviewerCtx = document.getElementById('reviewerChart').getContext('2d');
  new Chart(reviewerCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(stats.reviewerPercentages),
      datasets: [{
        label: 'Percentage',
        data: Object.values(stats.reviewerPercentages).map(p => parseFloat(p)),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
        ],
        borderColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Percentage (%)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Reviewer Categories'
          }
        }
      },
      plugins: {
        legend: {
          display: false, // Hide legend for bar charts
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.raw}%`;
            }
          }
        }
      }
    }
  });

  // Local Guide Percentages Bar Chart
  const localGuideCtx = document.getElementById('localGuideChart').getContext('2d');
  new Chart(localGuideCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(stats.localGuidePercentages),
      datasets: [{
        label: 'Percentage',
        data: Object.values(stats.localGuidePercentages).map(p => parseFloat(p)),
        backgroundColor: [
          '#FF6384', '#36A2EB'
        ],
        borderColor: [
          '#FF6384', '#36A2EB'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Percentage (%)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Local Guide Categories'
          }
        }
      },
      plugins: {
        legend: {
          display: false, // Hide legend for bar charts
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.raw}%`;
            }
          }
        }
      }
    }
  });
}