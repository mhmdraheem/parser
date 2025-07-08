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
    const totalFiles = jsonFiles.length;

    const company = req.query["company"];
    const reviewers = req.query["totalReviews"];
    const stars = req.query["stars"];
    const website = req.query["website"];
    const booking = req.query["booking"];

    jsonFiles = jsonFiles
      .map((file) => {
        return {
          fileName: file,
          fileData: readFile(file),
        };
      })
      .filter((file) => {
        return !company || (company && file.fileData.business._name.toLowerCase().includes(company.toLowerCase()));
      })
      .filter((file) => {
        return !reviewers || (reviewers && +file.fileData.business.totalReviews >= +reviewers);
      })
      .filter((file) => {
        return !stars || (stars && +convertToEnglish(file.fileData.business.starRating) >= +stars);
      })
      .filter((file) => {
        return !website || (website && file.fileData.business.website);
      })
      .filter((file) => {
        return !booking || (booking && file.fileData.business.booking);
      });

    const ff = jsonFiles.map((file) => file.fileData);
    res.json({ total: totalFiles, ff });
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
