const SELECTORS = {
  SCROLLING_PARENT: ".m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde",
  REVIEW_CONTAINER: ".jftiEf.fontBodyMedium.t2Acle.FwTFEc.azD0p",
};

const businessName = "المحامي الدكتور علي الربيعي وشركة اتحاد العصر AsrLawGroup";

async function scrollAndExtractReviews() {
  const scrollableElement = document.querySelector(SELECTORS.SCROLLING_PARENT);
  if (!scrollableElement) return [];

  let reviews = [];
  let lastScrollHeight = scrollableElement.scrollHeight;

  while (true) {
    // Scroll to the bottom of the element
    scrollableElement.scrollTo(0, scrollableElement.scrollHeight);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if we've reached the end of the reviews
    if (scrollableElement.scrollHeight === lastScrollHeight) {
      // Extract reviews
      const reviewContainers = document.querySelectorAll(SELECTORS.REVIEW_CONTAINER);
      reviewContainers.forEach((container, index) => {
        if (container.textContent.includes(businessName)) {
          console.log(`Found at index ${index} of ${reviewContainers.length}`);
        }
        reviews.push(container);
      });
      break;
    }
    lastScrollHeight = scrollableElement.scrollHeight;
  }
}

scrollAndExtractReviews();
