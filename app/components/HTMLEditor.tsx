"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  Download,
  Type,
  ImagePlus,
  Trash2,
  Copy,
  Undo2,
  Redo2,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Layers,
  Grid3x3,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from "lucide-react";

// Production-Ready HTML Poster Editor with SOLID Architecture

class HTMLSanitizer {
  static sanitize(html) {
    const temp = document.createElement("div");
    temp.innerHTML = html;

    const dangerous = ["script", "iframe", "object", "embed", "link", "style"];
    dangerous.forEach((tag) => {
      temp.querySelectorAll(tag).forEach((el) => el.remove());
    });

    temp.querySelectorAll("*").forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        if (attr.name.startsWith("on")) {
          el.removeAttribute(attr.name);
        }
      });

      ["href", "src", "action"].forEach((attr) => {
        const val = el.getAttribute(attr);
        if (val && val.toLowerCase().includes("javascript:")) {
          el.removeAttribute(attr);
        }
      });
    });

    return temp.innerHTML;
  }
}

class HTMLParser {
  static parse(html) {
    const sanitized = HTMLSanitizer.sanitize(html);
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitized, "text/html");
    const poster = doc.querySelector(".poster") || doc.body;

    const elements = [];
    Array.from(poster.children).forEach((node, i) => {
      const el = this.parseNode(node, i);
      if (el) elements.push(el);
    });
    return elements;
  }

  static parseNode(el, i) {
    const style = window.getComputedStyle(el);

    const baseStyle = {
      position: el.style.position || style.position || "absolute",
      left: el.style.left || style.left || `${50 + i * 20}px`,
      top: el.style.top || style.top || `${50 + i * 20}px`,
      fontSize: el.style.fontSize || style.fontSize || "16px",
      color: el.style.color || style.color || "#000000",
      fontWeight: el.style.fontWeight || style.fontWeight || "normal",
      textAlign: el.style.textAlign || style.textAlign || "left",
    };

    if (el.style.width) baseStyle.width = el.style.width;
    if (el.style.height) baseStyle.height = el.style.height;
    if (el.style.background) baseStyle.background = el.style.background;

    if (el.tagName === "IMG") {
      return {
        id: `img-${Date.now()}-${i}`,
        type: "image",
        src: el.getAttribute("src") || "",
        alt: el.getAttribute("alt") || "",
        tagName: "img",
        style: {
          ...baseStyle,
          width: el.style.width || "100px",
          height: "auto",
        },
      };
    }

    return {
      id: `text-${Date.now()}-${i}`,
      type: "text",
      content: el.textContent || "",
      tagName: el.tagName.toLowerCase(),
      style: baseStyle,
    };
  }
}

class HTMLExporter {
  static export(elements) {
    const html = elements
      .map((el) => {
        const style = Object.entries(el.style)
          .map(
            ([k, v]) => `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${v}`
          )
          .join("; ");

        if (el.type === "image") {
          return `<img src="${el.src}" alt="${el.alt}" style="${style}" />`;
        }
        return `<${el.tagName} style="${style}">${el.content}</${el.tagName}>`;
      })
      .join("\n    ");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta data-generated-by="editable-html-poster" />
  <title>Exported Poster</title>
  <style>
    body { margin: 0; padding: 0; }
    .poster { width: 720px; height: 720px; position: relative; background: #f3f4f6; overflow: hidden; }
  </style>
</head>
<body>
  <div class="poster">
    ${html}
  </div>
</body>
</html>`;
  }
}

export default function ProductionHTMLEditor() {
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isEditingText, setIsEditingText] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const canvasRef = useRef(null);
  const textEditRef = useRef(null);

  const selectedElement = elements.find((el) => el.id === selectedId);

  const saveHistory = useCallback(
    (newElements, newSelectedId) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({
        elements: JSON.parse(JSON.stringify(newElements)),
        selectedId: newSelectedId,
      });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const parsed = HTMLParser.parse(evt.target.result);
      setElements(parsed);
      setSelectedId(null);
      saveHistory(parsed, null);
    };
    reader.readAsText(file);
  };

  const handlePaste = () => {
    const html = prompt("Paste your HTML:");
    if (html) {
      const parsed = HTMLParser.parse(html);
      setElements(parsed);
      setSelectedId(null);
      saveHistory(parsed, null);
    }
  };

  const handleExport = () => {
    const html = HTMLExporter.export(elements);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "poster.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const addElement = (type) => {
    const newEl =
      type === "text"
        ? {
            id: `text-${Date.now()}`,
            type: "text",
            content: "New Text",
            tagName: "p",
            style: {
              position: "absolute",
              left: "50px",
              top: "50px",
              fontSize: "16px",
              color: "#000000",
            },
          }
        : {
            id: `img-${Date.now()}`,
            type: "image",
            src: "https://via.placeholder.com/150",
            alt: "Image",
            tagName: "img",
            style: {
              position: "absolute",
              left: "50px",
              top: "50px",
              width: "150px",
              height: "auto",
            },
          };

    const newElements = [...elements, newEl];
    setElements(newElements);
    setSelectedId(newEl.id);
    saveHistory(newElements, newEl.id);
  };

  const deleteElement = () => {
    if (!selectedId) return;
    if (confirm("Delete this element?")) {
      const newElements = elements.filter((el) => el.id !== selectedId);
      setElements(newElements);
      setSelectedId(null);
      saveHistory(newElements, null);
    }
  };

  const updateProperty = (prop, val) => {
    if (!selectedId) return;
    const newElements = elements.map((el) => {
      if (el.id === selectedId) {
        if (prop === "content" || prop === "src" || prop === "alt") {
          return { ...el, [prop]: val };
        }
        return { ...el, style: { ...el.style, [prop]: val } };
      }
      return el;
    });
    setElements(newElements);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    const reader = new FileReader();
    reader.onload = (evt) => updateProperty("src", evt.target.result);
    reader.readAsDataURL(file);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const state = history[historyIndex - 1];
      setElements(state.elements);
      setSelectedId(state.selectedId);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const state = history[historyIndex + 1];
      setElements(state.elements);
      setSelectedId(state.selectedId);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleMouseDown = (e, id) => {
    if (isEditingText) return;
    e.stopPropagation();
    setSelectedId(id);
    setIsDragging(true);

    const el = elements.find((e) => e.id === id);
    if (!el) return;

    const left = parseInt(el.style.left) || 0;
    const top = parseInt(el.style.top) || 0;
    setDragOffset({ x: e.clientX - left, y: e.clientY - top });
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging || !selectedId || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      let x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, 670));
      let y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, 670));

      const newElements = elements.map((el) =>
        el.id === selectedId
          ? { ...el, style: { ...el.style, left: `${x}px`, top: `${y}px` } }
          : el
      );
      setElements(newElements);
    };

    const handleUp = () => {
      if (isDragging) {
        setIsDragging(false);
        saveHistory(elements, selectedId);
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, selectedId, dragOffset, elements, saveHistory]);

  const handleDoubleClick = (id) => {
    const el = elements.find((e) => e.id === id);
    if (el && el.type === "text") {
      setSelectedId(id);
      setIsEditingText(true);
    }
  };

  const handleTextBlur = () => {
    if (isEditingText && textEditRef.current && selectedId) {
      updateProperty("content", textEditRef.current.innerText);
      setIsEditingText(false);
      saveHistory(elements, selectedId);
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (isEditingText) return;
      if (e.key === "Delete" && selectedId) deleteElement();
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        (e.key === "y" && (e.ctrlKey || e.metaKey)) ||
        (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId, isEditingText, historyIndex]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="bg-black/30 backdrop-blur-xl border-b border-white/10 px-6 py-3">
        <div className="flex items-center gap-3">
          <Sparkles className="text-purple-400" size={24} />
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Production HTML Editor
          </span>
          <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
            SOLID Architecture
          </span>
        </div>
      </div>

      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-md hover:from-blue-600 hover:to-cyan-600 transition-all text-sm font-medium"
            >
              <Upload size={16} />
              Import
            </button>
            <button
              onClick={handlePaste}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-all text-sm"
            >
              <Copy size={16} />
              Paste
            </button>
            <button
              onClick={handleExport}
              disabled={elements.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-md hover:from-emerald-600 hover:to-teal-600 transition-all text-sm font-medium disabled:opacity-30"
            >
              <Download size={16} />
              Export
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => addElement("text")}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 transition-all text-sm"
            >
              <Type size={16} />
              Text
            </button>
            <button
              onClick={() => addElement("image")}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-md hover:from-orange-600 hover:to-red-600 transition-all text-sm"
            >
              <ImagePlus size={16} />
              Image
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-all disabled:opacity-30"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-all disabled:opacity-30"
            >
              <Redo2 size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded transition-all ${
                showGrid
                  ? "bg-purple-500 text-white"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Grid3x3 size={16} />
            </button>
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs text-gray-400 min-w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          <button
            onClick={deleteElement}
            disabled={!selectedId}
            className="ml-auto p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded transition-all disabled:opacity-30"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".html"
          onChange={handleImport}
          className="hidden"
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <div
            ref={canvasRef}
            className="relative bg-gray-100 shadow-2xl rounded-lg overflow-hidden"
            style={{
              width: "720px",
              height: "720px",
              transform: `scale(${zoom})`,
              transformOrigin: "center",
              backgroundImage: showGrid
                ? "linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)"
                : "none",
              backgroundSize: showGrid ? "20px 20px" : "auto",
            }}
            onClick={() => setSelectedId(null)}
          >
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                  <Sparkles
                    className="mx-auto mb-4 text-purple-300"
                    size={48}
                  />
                  <p className="text-lg font-semibold text-gray-600">
                    Start Creating
                  </p>
                  <p className="text-sm text-gray-500">
                    Import HTML or add elements
                  </p>
                </div>
              </div>
            )}

            {elements.map((el) => (
              <div
                key={el.id}
                style={el.style}
                className={`cursor-move transition-all ${
                  selectedId === el.id
                    ? "ring-2 ring-purple-500"
                    : "hover:ring-2 hover:ring-purple-300/50"
                }`}
                onMouseDown={(e) => handleMouseDown(e, el.id)}
                onDoubleClick={() => handleDoubleClick(el.id)}
              >
                {el.type === "image" ? (
                  <img
                    src={el.src}
                    alt={el.alt}
                    className="max-w-full h-auto rounded pointer-events-none"
                  />
                ) : isEditingText && selectedId === el.id ? (
                  <div
                    ref={textEditRef}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={handleTextBlur}
                    className="outline-none min-w-[50px]"
                    autoFocus
                  >
                    {el.content}
                  </div>
                ) : (
                  <span className="pointer-events-none">{el.content}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="w-80 bg-black/20 backdrop-blur-xl border-l border-white/10 overflow-auto">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Layers className="text-purple-400" size={20} />
              <h3 className="text-lg font-semibold text-white">Properties</h3>
            </div>

            {selectedElement ? (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <label className="block text-xs font-medium mb-2 text-gray-400 uppercase">
                    Type
                  </label>
                  <input
                    type="text"
                    value={selectedElement.type}
                    disabled
                    className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded text-white text-sm"
                  />
                </div>

                {selectedElement.type === "text" && (
                  <>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <label className="block text-xs font-medium mb-2 text-gray-400 uppercase">
                        Content
                      </label>
                      <textarea
                        value={selectedElement.content}
                        onChange={(e) =>
                          updateProperty("content", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded text-white text-sm resize-none"
                        rows={3}
                      />
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <label className="block text-xs font-medium mb-2 text-gray-400 uppercase">
                        Font Size
                      </label>
                      <input
                        type="text"
                        value={selectedElement.style.fontSize}
                        onChange={(e) =>
                          updateProperty("fontSize", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded text-white text-sm"
                      />
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <label className="block text-xs font-medium mb-2 text-gray-400 uppercase">
                        Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={selectedElement.style.color}
                          onChange={(e) =>
                            updateProperty("color", e.target.value)
                          }
                          className="w-16 h-10 rounded"
                        />
                        <input
                          type="text"
                          value={selectedElement.style.color}
                          onChange={(e) =>
                            updateProperty("color", e.target.value)
                          }
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/10 rounded text-white text-sm"
                        />
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <label className="block text-xs font-medium mb-2 text-gray-400 uppercase">
                        Text Align
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateProperty("textAlign", "left")}
                          className={`flex-1 p-2 border rounded ${
                            selectedElement.style.textAlign === "left"
                              ? "bg-purple-500 text-white"
                              : "bg-white/10 text-gray-400"
                          }`}
                        >
                          <AlignLeft size={18} className="mx-auto" />
                        </button>
                        <button
                          onClick={() => updateProperty("textAlign", "center")}
                          className={`flex-1 p-2 border rounded ${
                            selectedElement.style.textAlign === "center"
                              ? "bg-purple-500 text-white"
                              : "bg-white/10 text-gray-400"
                          }`}
                        >
                          <AlignCenter size={18} className="mx-auto" />
                        </button>
                        <button
                          onClick={() => updateProperty("textAlign", "right")}
                          className={`flex-1 p-2 border rounded ${
                            selectedElement.style.textAlign === "right"
                              ? "bg-purple-500 text-white"
                              : "bg-white/10 text-gray-400"
                          }`}
                        >
                          <AlignRight size={18} className="mx-auto" />
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {selectedElement.type === "image" && (
                  <>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <label className="block text-xs font-medium mb-2 text-gray-400 uppercase">
                        Image Source
                      </label>
                      <input
                        type="text"
                        value={selectedElement.src}
                        onChange={(e) => updateProperty("src", e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded text-white text-sm mb-2"
                      />
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                      >
                        Upload Image
                      </button>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <label className="block text-xs font-medium mb-2 text-gray-400 uppercase">
                        Alt Text
                      </label>
                      <input
                        type="text"
                        value={selectedElement.alt}
                        onChange={(e) => updateProperty("alt", e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded text-white text-sm"
                      />
                    </div>
                  </>
                )}

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <label className="block text-xs font-medium mb-2 text-gray-400 uppercase">
                    Position X
                  </label>
                  <input
                    type="text"
                    value={selectedElement.style.left}
                    onChange={(e) => updateProperty("left", e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded text-white text-sm"
                  />
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <label className="block text-xs font-medium mb-2 text-gray-400 uppercase">
                    Position Y
                  </label>
                  <input
                    type="text"
                    value={selectedElement.style.top}
                    onChange={(e) => updateProperty("top", e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded text-white text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Layers className="mx-auto mb-4 text-gray-600" size={48} />
                <p className="text-gray-400 text-sm">
                  Select an element to edit
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-xl border-t border-white/10 px-6 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <span className="text-gray-400">
              <span className="text-purple-400 font-semibold">
                {elements.length}
              </span>{" "}
              elements
            </span>
            <span className="text-gray-400">
              Canvas:{" "}
              <span className="text-cyan-400 font-semibold">720×720px</span>
            </span>
          </div>
          <span className="text-gray-400">
            {selectedId ? `${selectedElement?.type} selected` : "No selection"}
          </span>
        </div>
      </div>
    </div>
  );
}
