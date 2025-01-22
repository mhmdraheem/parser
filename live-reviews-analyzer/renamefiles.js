const fs = require("fs");
const path = require("path");

// Folder containing the files to rename
const folderPath = path.join(__dirname, "json/no_website");

// Read the files in the folder
fs.readdir(folderPath, (err, files) => {
  if (err) {
    console.error("Unable to read directory:", err);
    return;
  }

  // Filter only JSON files (if needed)
  const jsonFiles = files.filter((file) => file.endsWith(".json"));

  // Rename each file with an index
  jsonFiles.forEach((fileName, index) => {
    const oldFilePath = path.join(folderPath, fileName);
    const newFileName = `${index + 1}_${fileName.replace("(", "").replace(")", "")}`; // Add index to the file name
    const newFilePath = path.join(folderPath, newFileName);

    // Rename the file
    fs.rename(oldFilePath, newFilePath, (err) => {
      if (err) {
        console.error(`Error renaming ${fileName}:`, err);
      } else {
        console.log(`Renamed: ${fileName} -> ${newFileName}`);
      }
    });
  });
});
