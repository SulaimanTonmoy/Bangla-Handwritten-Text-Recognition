import React, { useMemo, useRef, useState } from "react";
import axios from "axios";

export default function Annotator() {
  const [image, setImage] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [fileName, setFileName] = useState("");

  // Paint-like drawing state
  const imgRef = useRef(null);
  const overlayRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPt, setStartPt] = useState(null); // {x,y} in display coords
  const [tempRect, setTempRect] = useState(null); // {x,y,w,h} in display coords

  // Scale between natural image pixels and displayed pixels
  const scale = useMemo(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth || !img.naturalHeight) return { sx: 1, sy: 1 };
    const r = img.getBoundingClientRect();
    return { sx: r.width / img.naturalWidth, sy: r.height / img.naturalHeight };
  }, [image, boxes.length, tempRect]);

  const toNatural = (xDisp, yDisp) => ({ x: xDisp / scale.sx, y: yDisp / scale.sy });
  const toDisplay = (xNat, yNat) => ({ x: xNat * scale.sx, y: yNat * scale.sy });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    // Show image immediately
    setImage(URL.createObjectURL(file));

    // Reset state
    setBoxes([]);
    setTempRect(null);
    setStartPt(null);
    setIsDrawing(false);

    const res = await axios.post("http://localhost:5000/ocr", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setBoxes(res.data.annotations || []);
  };

  const handleExport = async () => {
    const img = imgRef.current;
    if (!img) return;

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

  // Delete by index (click a box)
  const deleteBoxAt = (index) => setBoxes((prev) => prev.filter((_, i) => i !== index));

  // Undo last box
  const undoLastBox = () => setBoxes((prev) => prev.slice(0, -1));

  // Drawing helpers
  const getLocalPoint = (e) => {
    const el = overlayRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const handleMouseDown = (e) => {
    if (!image) return;
    if (e.button !== 0) return; // left click only
    const p = getLocalPoint(e);
    if (!p) return;

    setIsDrawing(true);
    setStartPt(p);
    setTempRect({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !startPt) return;
    const p = getLocalPoint(e);
    if (!p) return;

    const x = Math.min(startPt.x, p.x);
    const y = Math.min(startPt.y, p.y);
    const w = Math.abs(p.x - startPt.x);
    const h = Math.abs(p.y - startPt.y);

    setTempRect({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !tempRect) {
      setIsDrawing(false);
      setStartPt(null);
      return;
    }

    setIsDrawing(false);
    setStartPt(null);

    // ignore tiny drags
    if (tempRect.w < 3 || tempRect.h < 3) {
      setTempRect(null);
      return;
    }

    // display -> natural
    const p1 = toNatural(tempRect.x, tempRect.y);
    const p2 = toNatural(tempRect.x + tempRect.w, tempRect.y + tempRect.h);

    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);

    const label = window.prompt("Enter the correct text for this box:", "");
    const newBox = {
    bbox: [x, y, w, h],
    text: (label ?? "").trim(),
    confidence: 1.0,
    };
  


    setBoxes((prev) => [...prev, newBox]);
    setTempRect(null);
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg p-8">
      {/* Upload Section */}
      <div className="flex flex-col items-center gap-4">
        <label className="w-full">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="block w-full text-sm text-gray-700
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-lg file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100
                       border border-gray-300 rounded-lg p-2"
          />
        </label>

        
      </div>

      {/* Image + Boxes */}
      {image && (
        <div className="mt-6 flex justify-center">
          <div className="relative inline-block select-none">
            <img
              ref={imgRef}
              src={image}
              alt="uploaded"
              className="rounded-lg border block max-w-full h-auto"
              draggable={false}
              onLoad={() => setTempRect(null)}
            />

            {/* Overlay */}
            <div
              ref={overlayRef}
              className="absolute inset-0 z-10"
              style={{ cursor: "crosshair" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Existing boxes */}
              {boxes.map((b, i) => {
                const [x, y, w, h] = b.bbox;
                const p = toDisplay(x, y);
                return (
                  <div
                    key={i}
                    title="Click to delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBoxAt(i);
                    }}
                    className="absolute border-2 border-red-500 bg-red-100 bg-opacity-10"
                    style={{
                      left: `${p.x}px`,
                      top: `${p.y}px`,
                      width: `${w * scale.sx}px`,
                      height: `${h * scale.sy}px`,
                      cursor: "pointer",
                    }}
                  />
                );
              })}

              {/* Drag preview */}
              {tempRect && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-10 pointer-events-none"
                  style={{
                    left: `${tempRect.x}px`,
                    top: `${tempRect.y}px`,
                    width: `${tempRect.w}px`,
                    height: `${tempRect.h}px`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {boxes.length > 0 && (
        <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              💾 Export COCO JSON
            </button>

            <button
              onClick={undoLastBox}
              className="px-5 py-2.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
            >
              ↩️ Undo
            </button>
          </div>

          <p className="text-gray-600">Detected {boxes.length} words/boxes.</p>
        </div>
      )}
    </div>
  );
}

