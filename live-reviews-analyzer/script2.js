var request = new XMLHttpRequest();
request.open("GET", "شركة_المحامي_أحمد_عبدالله_التويجري.json", false);
request.send(null)
reviewsData = JSON.parse(request.responseText);
localStorage.setItem(businessIdentifier, JSON.stringify(reviewsData)); // Save to localStorage with business identifier
displayHeader(reviewsData.business);
displayOverallPercentages(reviewsData.reviews);
createTabs(reviewsData.reviews);
displayReviews(reviewsData.reviews);