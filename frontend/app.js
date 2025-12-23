// Select elements from the DOM
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const ocrResults = document.getElementById("ocrResults");
const jsonResults = document.getElementById("jsonResults");
const ocrImage = document.getElementById("ocrImage");
const noResultsMessage = document.getElementById("noResultsMessage");
const downloadJsonBtn = document.getElementById("downloadJsonBtn");
const canvas = document.getElementById("ocrCanvas");
const ctx = canvas.getContext("2d");

// Store the current image and annotations
let currentImage = null;
let annotations = [];

// Handle Upload and OCR Processing
uploadBtn.addEventListener("click", async () => {
  const files = fileInput.files;
  if (files.length === 0) {
    alert("Please choose at least one image to upload.");
    return;
  }

  // Show loading text in button
  uploadBtn.textContent = "Processing...";

  const combinedResult = [];

  for (let file of files) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Send the image to backend for OCR processing
      const response = await fetch("http://localhost:5000/ocr", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      combinedResult.push(result);

      // Hide "No Results" message
      noResultsMessage.classList.add("hidden");

      // Display image with bounding boxes
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = function () {
        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Draw bounding boxes on canvas
        result.annotations.forEach((annotation) => {
          const [x, y, width, height] = annotation.bbox;
          ctx.beginPath();
          ctx.rect(x, y, width, height);
          ctx.lineWidth = 3;
          ctx.strokeStyle = "red";
          ctx.stroke();
        });

        // Show OCR results and image
        ocrImage.classList.remove("hidden");
      };

      // Show OCR results in JSON format
      jsonResults.textContent = JSON.stringify(combinedResult, null, 2);
      ocrResults.classList.remove("hidden");

      // Enable JSON download button
      downloadJsonBtn.onclick = function () {
        const blob = new Blob([JSON.stringify(combinedResult, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "combined_ocr_results.json";
        a.click();
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error("Error:", error);
    }
  }

  // Reset the button text
  uploadBtn.textContent = "Upload and Process";
});
