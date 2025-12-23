import React, { useState } from "react";
import axios from "axios";

export default function Annotator() {
  const [image, setImage] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [fileName, setFileName] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    setFileName(file.name);
    const formData = new FormData();
    formData.append("file", file);
    setImage(URL.createObjectURL(file));

    const res = await axios.post("http://localhost:5000/ocr", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setBoxes(res.data.annotations);
  };

  const handleExport = async () => {
    const img = document.querySelector("img");
    const height = img.naturalHeight;
    const width = img.naturalWidth;

    const res = await axios.post("http://localhost:5000/export", {
      image_name: fileName,
      height,
      width,
      annotations: boxes,
    });

    const blob = new Blob([JSON.stringify(res.data, null, 4)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName.split(".")[0]}_annotations.json`;
    link.click();
  };

  return (
    <div className="w-full max-w-4xl bg-white rounded-2xl shadow p-6">
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="block mb-4"
      />

      {image && (
        <div className="relative inline-block">
          <img src={image} alt="uploaded" className="rounded-lg border" />
          {boxes.map((b, i) => {
            const [x, y, w, h] = b.bbox;
            return (
              <div
                key={i}
                title={b.text}
                className="absolute border-2 border-red-500 bg-red-100 bg-opacity-10"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  width: `${w}px`,
                  height: `${h}px`,
                }}
              />
            );
          })}
        </div>
      )}

      {boxes.length > 0 && (
        <div className="mt-4">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            💾 Export COCO JSON
          </button>
          <p className="text-gray-600 mt-2">Detected {boxes.length} words.</p>
        </div>
      )}
    </div>
  );
}
