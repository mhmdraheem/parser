const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files from the "public" folder
app.use(express.static("public"));

// Endpoint to get the list of JSON files
app.get("/get-json-files", (req, res) => {
  const folderPath = path.join(__dirname, "json/no_website");
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Unable to read directory" });
    }

    // Filter only JSON files
    let jsonFiles = files.filter((file) => file.endsWith(".json"));

    jsonFiles.sort((a, b) => {
      // Extract the numeric part of the file name (assuming the format is "X_file.json")
      const numA = parseInt(a.split("_")[0], 10);
      const numB = parseInt(b.split("_")[0], 10);

      // Compare the numeric parts
      return numA - numB;
    });

    // filter by min reviews
    const minReviews = 50;
    jsonFiles = jsonFiles.filter((file) => {
      const data = readFile(file);
      return data.reviews.length >= minReviews;
    });

    // filter by min rating
    const minRating = 4.5;
    jsonFiles = jsonFiles.filter((file) => {
      const data = readFile(file);
      console.log(convertToEnglish(data.business.starRating));

      return convertToEnglish(data.business.starRating) >= minRating;
    });

    const response = jsonFiles.map((file) => {
      const data = readFile(file);
      return { file, name: file.concat(`[${data.business.starRating} ${data.business.totalReviews}]`) };
    });

    res.json(response);
  });
});

function readFile(file) {
  const filePath = path.join(__dirname, "json/no_website/", file);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

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
    .join("")
    .replaceAll("٫", ".");
}

// Serve the JSON files
app.get("/json/no_website/:filename", (req, res) => {
  const filePath = path.join(__dirname, "json/no_website", req.params.filename);
  res.sendFile(filePath);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

function filterByReviewers(business, min) {}
