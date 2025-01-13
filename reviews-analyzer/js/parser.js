// Selectors for extracting review data
const SELECTORS = {
  REVIEW_CONTAINER: '.bwb7ce', // Container for each review
  REVIEWER_NAME: '.Vpc5Fe', // Reviewer name
  REVIEWER_INFO: '.GSM50', // Reviewer info (optional)
  REVIEW_RATING: '.k0Ysuc', // Rating section
  REVIEW_STARS: '.dHX2k', // Stars (inside aria-label)
  REVIEW_DATE: '.y3Ibjb', // Review date
  REVIEW_TEXT: '.OA1nbd', // Review text (optional)
  BUSINESS_RESPONSE: '.KmCjbd', // Business response (optional)
  TOTAL_REVIEWS: '.CJQ04 .RDApEe.YrbPuc', // Total reviews count
  STAR_RATING: '.CJQ04 .yi40Hd.YrbPuc' // Star rating
};

document.getElementById('fileInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const htmlContent = e.target.result;
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // Extract total number of reviews
      const totalReviewsElement = doc.querySelector(SELECTORS.TOTAL_REVIEWS);
      const totalReviews = totalReviewsElement ? totalReviewsElement.textContent.trim() : '0';

      // Extract star rating
      const starRatingElement = doc.querySelector(SELECTORS.STAR_RATING);
      const starRating = starRatingElement ? starRatingElement.textContent.trim() : '0';

      // Generate a unique key for this file (e.g., using file name or timestamp)
      const fileKey = `reviews_${file.name}`;

      // Check if the file has already been processed
      if (localStorage.getItem(fileKey)) {
        console.log('File already processed. Using existing data.');
        const jsonOutput = localStorage.getItem(fileKey);
        const jsonLink = document.getElementById('jsonLink');
        jsonLink.href = URL.createObjectURL(new Blob([jsonOutput], { type: 'application/json' }));
        jsonLink.style.display = 'inline';

        const reviewsLink = document.getElementById('reviewsLink');
        reviewsLink.href = `reviews.html?file=${fileKey}`; // Add file parameter
        reviewsLink.style.display = 'inline';
        return; // Skip reprocessing
      }

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

        // Avatar image
        const avatarElement = container.querySelector('.wSokxc');
        const avatarStyle = avatarElement?.getAttribute('style') || '';
        const avatarUrlMatch = avatarStyle.match(/url\(["']?(.*?)["']?\)/); // Extract URL from style
        review.reviewer.avatar = avatarUrlMatch ? avatarUrlMatch[1] : '';

        // Profile link
        const profileLinkElement = container.querySelector('.yC3ZMb');
        review.reviewer.link = profileLinkElement?.href || '';

        review.ignore = false;

        reviews.push(review);
      });

      // Create the main reviews object with metadata
      const reviewsData = {
        reviews, // Array of reviews
        starRating, // Overall star rating
        totalReviews // Total number of reviews
      };

      // Save the main reviews object to localStorage
      localStorage.setItem(fileKey, JSON.stringify(reviewsData));

      // Show links
      const jsonOutput = JSON.stringify(reviewsData, null, 2);
      const jsonLink = document.getElementById('jsonLink');
      jsonLink.href = URL.createObjectURL(new Blob([jsonOutput], { type: 'application/json' }));
      jsonLink.style.display = 'inline';

      const reviewsLink = document.getElementById('reviewsLink');
      reviewsLink.href = `reviews.html?file=${fileKey}`; // Add file parameter
      reviewsLink.style.display = 'inline';
    };
    reader.readAsText(file);
  }
});