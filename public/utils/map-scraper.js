const SELECTORS = {
  REVIEWS_SCROLLING_PARENT: ".m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde:last-of-type",
  REVIEW_CONTAINER: ".bJzME.Hu9e2e.tTVLSc .jftiEf.fontBodyMedium",
  SELECTED_COMPANY_LINK: ".CdoAJb a",
  REVIEWER_NAME: ".d4r55", // Reviewer name
  REVIEWER_INFO: ".RfnDt", // Reviewer info (optional)
  REVIEW_STARS: ".kvMYJc", // Stars (inside aria-label)
  REVIEW_DATE: ".rsqaWe", // Review date
  REVIEW_TEXT: ".wiI7pd:nth-of-type(1)", // Review text (optional)
  BUSINESS_RESPONSE: ".wiI7pd:nth-of-type(2)", // Business response (optional)
  REVIEWER_AVATAR: "img.NBa7we", // Reviewer avatar
  REVIEWER_PROFILE_LINK: "button.al6Kxe", // Reviewer profile link
  BUSINESS_NAME: "h1.DUwDvf.lfPIob",
  TOTAL_REVIEWS: ".F7nice span:first-child span", // Total reviews count
  STAR_RATING: ".F7nice  ", // Star rating
};

// Function to extract review data from a review container
function extractReviewData(container) {
  const review = {};

  // Reviewer name
  const reviewerNameElement = container.querySelector(SELECTORS.REVIEWER_NAME);
  review.reviewer = {
    name: reviewerNameElement?.textContent.trim() || "Unknown",
  };

  // Reviewer info (optional)
  const reviewerInfoElement = container.querySelector(SELECTORS.REVIEWER_INFO);
  if (reviewerInfoElement?.textContent) {
    const reviewerInfoText = reviewerInfoElement.textContent.trim();
    let items = reviewerInfoText.split("·");
    for (let item of items) {
      if (item.includes("مرشد محلي")) {
        review.reviewer.isLocalGuide = true;
      } else if (item.includes("مراجع")) {
        if (item.includes("واحدة")) {
          review.reviewer.numberOfReviews = 1;
        } else if (item.includes("مراجعتان")) {
          review.reviewer.numberOfReviews = 2;
        } else {
          review.reviewer.numberOfReviews = +item.match(/\d+/)?.[0];
        }
      } else if (item.includes("صور")) {
        if (item.includes("واحدة")) {
          review.reviewer.numberOfPhotos = 1;
        } else if (item.includes("صورتان")) {
          review.reviewer.numberOfPhotos = 2;
        } else {
          review.reviewer.numberOfPhotos = +item.match(/\d+/)?.[0];
        }
      }
    }
  }

  // Rating section
  const starsElement = container.querySelector(SELECTORS.REVIEW_STARS);
  const starsText = starsElement?.getAttribute("aria-label").replace("نجمة واحدة", "1") || "";

  review.review = {
    stars: starsText.match(/\d/)?.[0] || "0",
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
  const avatarElement = container.querySelector(SELECTORS.REVIEWER_AVATAR);
  //   const avatarStyle = avatarElement?.getAttribute("style") || "";
  //   const avatarUrlMatch = avatarStyle.match(/url\(["']?(.*?)["']?\)/);
  review.reviewer.avatar = avatarElement.src;

  // Profile link
  const profileLinkElement = container.querySelector(SELECTORS.REVIEWER_PROFILE_LINK);
  review.reviewer.link = profileLinkElement?.getAttribute("data-href") || "";

  review.ignore = false;
  review.fakeReview = false;
  review.fakeReviewer = false;

  return review;
}

// Function to scroll and extract reviews
async function scrollReviews() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const scrollableElement = document.querySelector(SELECTORS.REVIEWS_SCROLLING_PARENT);
  if (!scrollableElement) return [];

  let lastScrollHeight = scrollableElement.scrollHeight;

  while (true) {
    // Scroll to the bottom of the element
    scrollableElement.scrollTo(0, scrollableElement.scrollHeight);
    await new Promise((resolve) => setTimeout(resolve, 4000)); // Wait for reviews to load
    // Check if we've reached the end of the reviews

    if (scrollableElement.scrollHeight === lastScrollHeight) {
      break;
    }
    lastScrollHeight = scrollableElement.scrollHeight;
    console.log("scrolling");
  }
}

function extractReviews() {
  let reviewsArr = [];
  const reviews = document.querySelectorAll(SELECTORS.REVIEW_CONTAINER);
  reviews.forEach((review) => {
    reviewsArr.push(extractReviewData(review));
  });
  return reviewsArr;
}

function scrapeGeneralInfo() {
  const revs = document.querySelector(".F7nice").children;
  const starRating = revs[0] ? revs[0].textContent.trim() : "0";
  const totalReviews = revs[1] ? revs[1].textContent.trim().replace(/\(|\)/g, "") : "0";

  // Extract business name
  const businessNameElement = document.querySelector(SELECTORS.BUSINESS_NAME);
  const _name = businessNameElement ? businessNameElement.innerText.trim() : "Unknown";

  let link = document.querySelector(SELECTORS.SELECTED_COMPANY_LINK)?.href;
  let _location = document.querySelector(".CsEnBe[data-tooltip='نسخ العنوان'] .rogA2c")?.innerText;
  let website = document.querySelector(".CsEnBe[data-tooltip='فتح الموقع الإلكتروني']")?.href;
  let bookingElem = document.querySelector(".CsEnBe[data-tooltip='فتح رابط الحجز']");
  let booking = bookingElem?.href || bookingElem?.innerText.match(/[a-zA-Z0-9.]+/)[0];
  let phone = document.querySelector(".CsEnBe[data-tooltip='نسخ رقم الهاتف'] .rogA2c")?.innerText;

  return {
    _name, // Business name
    link,
    starRating, // Overall star rating
    totalReviews, // Total number of reviews
    _location,
    website,
    booking,
    phone,
  };
}

// Function to scrape reviews and send data back to the original tab
async function scrapeReviews() {
  let tabList = document.querySelector(".RWPxGd[role='tablist']");
  let reviewsTab = tabList.querySelector("[data-tab-index='1']");
  reviewsTab.click();

  // sort reviews by date
  document.querySelector(".TrU0dc.m91Ig.kdfrQc.WY7ZIb .g88MCb.S9kvJb").click();
  await new Promise((resolve) => setTimeout(resolve, 5000));
  document.querySelectorAll(".fxNQSd")[1].click();

  // Scroll and extract reviews
  await scrollReviews();
  const reviews = extractReviews();

  // Create the main reviews object with metadata
  const reviewsData = {
    reviews, // Array of reviews
  };

  return reviewsData;
}

// scrapeReviews();

// Date parser utility (from utils.js)
function dateParser(date) {
  const dateArr = date.replace("تاريخ التعديل: ", "").replace("قبل", "").trim().split(" ");

  let unit, number;
  if (dateArr.length === 2) {
    number = +convertToEnglish(dateArr[0]);
    unit = dateArr[1];
  } else {
    unit = dateArr[0];
  }

  const mappings = {
    ساعة: { unit: "hour", value: 1 },
    ساعتين: { unit: "hour", value: 2 },
    ساعات: { unit: "hour", value: number },

    يوم: { unit: "day", value: 1 },
    يومين: { unit: "day", value: 2 },
    أيام: { unit: "day", value: number },

    أسبوع: { unit: "week", value: 1 },
    أسبوعين: { unit: "week", value: 2 },
    أسابيع: { unit: "week", value: number },

    شهر: { unit: "month", value: 1 },
    شهرين: { unit: "month", value: 2 },
    أشهر: { unit: "month", value: number },
    شهرًا: { unit: "month", value: number },

    سنة: { unit: "year", value: 1 },
    سنتين: { unit: "year", value: 2 },
    سنوات: { unit: "year", value: number },
  };

  return mappings[unit] || {};
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
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Main function to scrape reviews and download them
async function main() {
  const business = scrapeGeneralInfo();

  const reviews = await scrapeReviews();
  reviews.business = business;

  downloadDataAsJson(reviews, `${reviews.business._name.replaceAll(" ", "_")}.json`);
  console.log("Scraped reviews:", reviews);
}

// Run the main function
// main();
