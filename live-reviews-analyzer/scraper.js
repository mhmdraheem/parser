const SELECTORS = {
    SCROLLING_PARENT: ".AVvGRc", // Scrollable container for reviews
    REVIEW_CONTAINER: '.bwb7ce', // Container for each review
    REVIEWER_NAME: '.Vpc5Fe', // Reviewer name
    REVIEWER_INFO: '.GSM50', // Reviewer info (optional)
    REVIEW_STARS: '.dHX2k', // Stars (inside aria-label)
    REVIEW_DATE: '.y3Ibjb', // Review date
    REVIEW_TEXT: '.OA1nbd', // Review text (optional)
    BUSINESS_RESPONSE: '.KmCjbd', // Business response (optional)
    AVATAR: '.wSokxc', // Reviewer avatar
    PROFILE_LINK: '.yC3ZMb', // Reviewer profile link
    BUSINESS_NAME: '.SPZz6b span',
    TOTAL_REVIEWS: '.CJQ04 .RDApEe.YrbPuc', // Total reviews count
    STAR_RATING: '.CJQ04 .yi40Hd.YrbPuc' // Star rating
};

// Function to extract review data from a review container
function extractReviewData(container) {
    const review = {};

    // Reviewer name
    const reviewerNameElement = container.querySelector(SELECTORS.REVIEWER_NAME);
    review.reviewer = {
        name: reviewerNameElement?.textContent.trim() || 'Unknown'
    };

    // Reviewer info (optional)
    const reviewerInfoElement = container.querySelector(SELECTORS.REVIEWER_INFO);
    if (reviewerInfoElement?.textContent) {
        const reviewerInfoText = reviewerInfoElement.textContent.trim();
        let items = reviewerInfoText.split("·");
        for (let item of items) {
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
    }

    // Rating section
    const starsElement = container.querySelector(SELECTORS.REVIEW_STARS);
    const starsText = starsElement?.getAttribute('aria-label') || '';
    review.review = {
        stars: starsText.match(/\d+\.\d+/)?.[0] || '0'
    };

    // Review date
    const reviewDateElement = container.querySelector(SELECTORS.REVIEW_DATE);
    if (reviewDateElement) {
        review.since = dateParser(reviewDateElement.textContent.trim());
        review.since.text = reviewDateElement.textContent.trim();
    }

    // Review text (optional)
    const reviewTextElement = container.querySelector(SELECTORS.REVIEW_TEXT);
    review.review.text = reviewTextElement?.textContent.trim();

    // Business response (optional)
    const businessResponseElement = container.querySelector(SELECTORS.BUSINESS_RESPONSE);
    review.review.response = businessResponseElement?.textContent.trim();

    // Avatar image
    const avatarElement = container.querySelector(SELECTORS.AVATAR);
    const avatarStyle = avatarElement?.getAttribute('style') || '';
    const avatarUrlMatch = avatarStyle.match(/url\(["']?(.*?)["']?\)/);
    review.reviewer.avatar = avatarUrlMatch ? avatarUrlMatch[1] : '';

    // Profile link
    const profileLinkElement = container.querySelector(SELECTORS.PROFILE_LINK);
    review.reviewer.link = profileLinkElement?.href || '';

    review.ignore = false;

    return review;
}

// Function to scroll and extract reviews
async function scrollAndExtractReviews() {
    const scrollableElement = document.querySelector(SELECTORS.SCROLLING_PARENT);
    if (!scrollableElement) return [];

    let reviews = [];
    let lastScrollHeight = scrollableElement.scrollHeight;

    while (true) {
        // Scroll to the bottom of the element
        scrollableElement.scrollTo(0, scrollableElement.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for reviews to load

        // Check if we've reached the end of the reviews
        if (scrollableElement.scrollHeight === lastScrollHeight) {
            // Extract reviews
            const reviewContainers = document.querySelectorAll(SELECTORS.REVIEW_CONTAINER);
            reviewContainers.forEach(container => {
                const review = extractReviewData(container);
                reviews.push(review);
            });

            break;
        }
        lastScrollHeight = scrollableElement.scrollHeight;
    }

    return reviews;
}

// Function to scrape reviews and send data back to the original tab
async function scrapeReviews() {
    // Extract total number of reviews
    const totalReviewsElement = document.querySelector(SELECTORS.TOTAL_REVIEWS);
    const totalReviews = totalReviewsElement ? totalReviewsElement.textContent.trim() : '0';

    // Extract business name
    const businessNameElement = document.querySelector(SELECTORS.BUSINESS_NAME);
    const _name = businessNameElement ? businessNameElement.textContent.trim() : 'Unknown';

    // Extract star rating
    const starRatingElement = document.querySelector(SELECTORS.STAR_RATING);
    const starRating = starRatingElement ? starRatingElement.textContent.trim() : '0';

    // Scroll and extract reviews
    const reviews = await scrollAndExtractReviews();

    // Create the main reviews object with metadata
    const reviewsData = {
        reviews, // Array of reviews
        business: {
            _name, // Business name
            starRating, // Overall star rating
            totalReviews // Total number of reviews
        }
    };

    console.log(reviewsData);   
    return reviewsData;
}

// scrapeReviews();

// Date parser utility (from utils.js)
function dateParser(date) {
    const dateArr = date.replace("قبل", '').trim().split(" ");

    let unit, number;
    if (dateArr.length === 2) {
        number = +convertToEnglish(dateArr[0]);
        unit = dateArr[1];
    } else {
        unit = dateArr[0];
    }

    const mappings = {
        "ساعة": { unit: "hour", value: 1 },
        "ساعتين": { unit: "hour", value: 2 },
        "ساعات": { unit: "hour", value: number },

        "يوم": { unit: "day", value: 1 },
        "يومين": { unit: "day", value: 2 },
        "أيام": { unit: "day", value: number },

        "أسبوع": { unit: "week", value: 1 },
        "أسبوعين": { unit: "week", value: 2 },
        "أسابيع": { unit: "week", value: number },

        "شهر": { unit: "month", value: 1 },
        "شهرين": { unit: "month", value: 2 },
        "أشهر": { unit: "month", value: number },
        "شهرًا": { unit: "month", value: number },

        "سنة": { unit: "year", value: 1 },
        "سنتين": { unit: "year", value: 2 },
        "سنوات": { unit: "year", value: number },
    };

    return mappings[unit];
}

// Function to convert Arabic numerals to English (from utils.js)
function convertToEnglish(text) {
    return text
        .split("")
        .map((char) => {
            const charCode = char.charCodeAt(0);
            if (charCode >= 1632 && charCode <= 1641) {
                // Convert Arabic numeral to English numeral
                return String.fromCharCode(charCode - 1584);
            }
            return char; // Leave non-Arabic characters unchanged
        })
        .join("");
}

// Function to download data as a JSON file
function downloadDataAsJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Main function to scrape reviews and download them
async function main() {
    const reviews = await scrapeReviews();
    downloadDataAsJson(reviews, `${reviews.business._name.replaceAll(' ', '_')}.json`);
    console.log('Scraped reviews:', reviews);
}

// Run the main function
main();