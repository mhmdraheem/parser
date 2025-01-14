const SELECTORS = {
    SCROLLING_PARENT: ".AVvGRc",
    REVIEW_CONTAINER: '.bwb7ce'
}

// Function to scroll and extract reviews
async function scrollAndExtractReviews(startElement) {
    // const scrollableElement = findScrollableParent(startElement); // Find the scrollable parent
    const scrollableElement = document.querySelector(SELECTORS.SCROLLING_PARENT);
    if (!scrollableElement) return;

    let reviews = new Set();
    let lastScrollHeight = scrollableElement.scrollHeight;

    while (true) {
        // Scroll to the bottom of the element
        scrollableElement.scrollTo(0, scrollableElement.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 4000)); // Wait for reviews to load
        
        // Check if we've reached the end of the reviews
        if (scrollableElement.scrollHeight === lastScrollHeight) {
            const reviewElements = document.querySelectorAll('.bwb7ce');
            reviews.add(reviewElements);
            break;
        }
        lastScrollHeight = scrollableElement.scrollHeight;
    }

    // Log the reviews
    const reviewArray = Array.from(reviews);
    console.log('Total reviews extracted:', reviewArray.length);
    console.log(reviewArray);
}

// Example usage
// Replace 'YOUR_START_ELEMENT_SELECTOR' with the selector for the element inside the scrollable container
const startElement = document.querySelector('.bwb7ce');
if (startElement) {
    scrollAndExtractReviews(startElement);
} else {
    console.error('Start element not found!');
}

/*
// Function to check if an element is scrollable
function isScrollable(element) {
    const style = window.getComputedStyle(element);
    return (
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        element.scrollHeight > element.clientHeight
    );
}

// Function to find the scrollable parent element
function findScrollableParent(startElement) {
    let currentElement = startElement;

    while (currentElement) {
        if (isScrollable(currentElement)) {
            console.log('Scrollable element found:', currentElement);
            return currentElement;
        }
        currentElement = currentElement.parentElement; // Move up to the parent element
    }

    console.error('No scrollable parent element found!');
    return null;
}
*/