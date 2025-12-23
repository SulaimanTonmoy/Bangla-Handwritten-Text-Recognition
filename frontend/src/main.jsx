// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client'; // Use 'react-dom/client' for React 18+
import App from './App'; // Import your App component

// Create the root and render the app
const root = ReactDOM.createRoot(document.getElementById('app')); // Create root
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

