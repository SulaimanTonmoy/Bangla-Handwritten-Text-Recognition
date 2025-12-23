import React, { useState } from 'react';
import axios from 'axios';

const ImageUpload = () => {
  const [file, setFile] = useState(null);
  const [annotations, setAnnotations] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select an image to upload!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Upload image to the backend
      const uploadResponse = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // OCR processing
      const ocrResponse = await axios.post('http://localhost:5000/ocr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Save the annotations to the state
      setAnnotations(ocrResponse.data.annotations);

      // Optionally export the annotations in a desired format (e.g., COCO)
      const exportResponse = await axios.post('http://localhost:5000/export', {
        image_name: uploadResponse.data.file_name,
        annotations: ocrResponse.data.annotations,
        height: 500, // Example, you should dynamically fetch the image height/width
        width: 500,
      });

      console.log('Annotations Exported:', exportResponse.data);
    } catch (err) {
      setError('Error in OCR processing');
      console.error('Error uploading or processing image:', err);
    }
  };

  return (
    <div className="upload-container">
      <h1>Upload Image for OCR</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload and Process</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {annotations && (
        <div>
          <h2>OCR Annotations:</h2>
          <pre>{JSON.stringify(annotations, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
