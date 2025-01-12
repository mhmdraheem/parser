// Selectors for extracting review data
const SELECTORS = {
  REVIEW_CONTAINER: '.bwb7ce', // Container for each review
  REVIEWER_NAME: '.Vpc5Fe', // Reviewer name
  REVIEWER_INFO: '.GSM50', // Reviewer info (optional)
  REVIEW_RATING: '.k0Ysuc', // Rating section
  REVIEW_STARS: '.dHX2k', // Stars (inside aria-label)
  REVIEW_DATE: '.y3Ibjb', // Review date
  REVIEW_TEXT: '.OA1nbd', // Review text (optional)
  BUSINESS_RESPONSE: '.KmCjbd' // Business response (optional)
};

document.getElementById('fileInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    // Check file size (e.g., limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size exceeds 10MB. Please upload a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const htmlContent = e.target.result;
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // Extract reviews
      const reviews = [];
      const reviewContainers = doc.querySelectorAll(SELECTORS.REVIEW_CONTAINER);

      reviewContainers.forEach(container => {
        const review = {};

        review.reviewer = {};
        const reviewerNameElement = container.querySelector(SELECTORS.REVIEWER_NAME);
        review.reviewer.name = reviewerNameElement?.textContent.trim() || 'Unknown';
        
        const reviewerInfoElement = container.querySelector(SELECTORS.REVIEWER_INFO);
        if (reviewerInfoElement?.textContent) {
          const reviewerInfoText = reviewerInfoElement.textContent.trim();
          
          let items = reviewerInfoText.split("·");
          for(item of items) {
            
            if(item.includes('مرشد محلي')) {
              review.reviewer.isLocalGuide = true;
            } else if(item.includes("مراجع")) {
              if(item.includes("واحدة")) {
                review.reviewer.numberOfReviews = 1;
              } else if(item.includes("مراجعتان")) {
                review.reviewer.numberOfReviews = 2;
              } else {
                review.reviewer.numberOfReviews = +item.match(/\d+/)?.[0];
              }
            } else if(item.includes("صور")) {
              if(item.includes("واحدة")) {
                review.reviewer.numberOfPhotos = 1;
              } else if(item.includes("صورتان")) {
                review.reviewer.numberOfPhotos = 2;
              } else {
                review.reviewer.numberOfPhotos = +item.match(/\d+/)?.[0];
              }
            }
          }

          review.reviewer.text = reviewerInfoText;
        }

        // Rating section
        review.review = {};
        const ratingElement = container.querySelector(SELECTORS.REVIEW_RATING);
        if (ratingElement) {
          const starsElement = ratingElement.querySelector(SELECTORS.REVIEW_STARS);
          const starsText = starsElement?.getAttribute('aria-label') || '';
          review.review.stars = starsText.match(/\d+\.\d+/)?.[0];

          const reviewDateElement = ratingElement.querySelector(SELECTORS.REVIEW_DATE);
          
          if(reviewDateElement) {
            let dateTxt = reviewDateElement?.textContent.trim() || 'Unknown';
            review.since = dateParser(dateTxt);
            review.since.text = dateTxt;
          }
        }

        // Review text (optional)
        const reviewTextElement = container.querySelector(SELECTORS.REVIEW_TEXT);
        review.review.text = reviewTextElement?.textContent.trim();

        // Business response (optional)
        const businessResponseElement = container.querySelector(SELECTORS.BUSINESS_RESPONSE);
        review.review.response = businessResponseElement?.textContent.trim();
        
        reviews.push(review);
      });

      // Calculate stats
      const stats = extractReviewStats(reviews);
      displayStats(stats);

      // Show labels
      document.querySelectorAll('.chart-label').forEach(label => {
        label.style.display = 'block';
      });

      // Show link to full JSON
      const jsonOutput = JSON.stringify(reviews, null, 2);
      const jsonLink = document.getElementById('jsonLink');
      jsonLink.href = URL.createObjectURL(new Blob([jsonOutput], { type: 'application/json' }));
      jsonLink.style.display = 'block';
    };
    reader.readAsText(file);
  }
});