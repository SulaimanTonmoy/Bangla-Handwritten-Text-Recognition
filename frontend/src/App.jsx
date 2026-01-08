import React from "react";
import Annotator from "./components/Annotator";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="bg-blue-600 text-white shadow">
        <div className="max-w-6xl mx-auto px-6 py-4 text-xl font-semibold">
          Bangla Annotator
        </div>
      </div>

    <main className="flex-1 w-full px-6 py-8 flex justify-center items-start">
      <div className="w-full max-w-6xl">
        <Annotator />
     </div>
    </main>


      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-6 mt-10">
        © 2025 Bangla Annotator. All rights reserved.
      </footer>
    </div>
  );
}


