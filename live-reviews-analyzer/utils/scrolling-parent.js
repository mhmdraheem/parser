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
      console.log("Scrollable parent found ", element, element.classList);
    }
  
    return findScrollableParent(element.parentElement);
  }
  
  const specificDiv = document.querySelector(".jftiEf.fontBodyMedium"); // Replace with your specific div
  const scrollableParent = findScrollableParent(specificDiv);

  console.log("Done.");