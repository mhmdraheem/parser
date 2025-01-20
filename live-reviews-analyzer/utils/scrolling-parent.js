function isScrollable(element) {
    const hasScrollableContent = element.scrollHeight > element.clientHeight;
    const overflowYStyle = window.getComputedStyle(element).overflowY;
    const isOverflowHidden = overflowYStyle.indexOf("hidden") !== -1;
  
    return hasScrollableContent && !isOverflowHidden;
  }
  
  function findScrollableParent(element) {
    if (!element || element === document.body) {
      return null;
    }
  
    // Check if the current element is scrollable
    if (isScrollable(element)) {
      return element;
    }
  
    return findScrollableParent(element.parentElement);
  }
  
  const specificDiv = document.querySelector(".jftiEf.fontBodyMedium.t2Acle.FwTFEc.azD0p"); // Replace with your specific div
  const scrollableParent = findScrollableParent(specificDiv);
  
  if (scrollableParent) {
    console.log("Scrollable parent found:", scrollableParent);
    console.log(scrollableParent.classList);
    
  } else {
    console.log("No scrollable parent found.");
  }