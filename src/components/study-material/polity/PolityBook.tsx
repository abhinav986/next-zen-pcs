import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Star, Lightbulb, Download } from "lucide-react";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { chapters } from "./constants";

// ==================== ENRICHED UPSC CONTENT (same as before) ====================
// ... keep the chapters object here ...

const PolityBook = () => {
  const [selectedChapter, setSelectedChapter] = useState(
    "Chapter 1: Making of the Constitution"
  );
  const [notes, setNotes] = useState([]);

  const addNote = (point) => {
    if (!notes.includes(point)) {
      setNotes([...notes, point]);
    }
  };

  // ✅ Export Notes to PDF
  const exportNotesToPDF = () => {
    if (notes.length === 0) {
      alert("No notes saved yet!");
      return;
    }
    const doc = new jsPDF();
    doc.setFont("times", "normal");
    doc.setFontSize(14);
    doc.text("📘 My UPSC Polity Notes", 10, 10);
    doc.setFontSize(12);

    notes.forEach((note, idx) => {
      doc.text(`${idx + 1}. ${note}`, 10, 20 + idx * 10);
    });

    doc.save("UPSC-Polity-Notes.pdf");
  };

  // ✅ Export Notes to DOCX
  const exportNotesToDOCX = async () => {
    if (notes.length === 0) {
      alert("No notes saved yet!");
      return;
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "📘 My UPSC Polity Notes",
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            ...notes.map(
              (note, idx) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${idx + 1}. ${note}`,
                      size: 24,
                    }),
                  ],
                })
            ),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "UPSC-Polity-Notes.docx");
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 bg-gray-100 border-r overflow-y-auto">
        <h2 className="p-4 font-bold text-lg border-b">📘 Indian Polity</h2>
        <ul>
          {Object.keys(chapters).map((chapter) => (
            <li
              key={chapter}
              onClick={() => setSelectedChapter(chapter)}
              className={`p-3 cursor-pointer hover:bg-blue-200 ${
                selectedChapter === chapter ? "bg-blue-300 font-bold" : ""
              }`}
            >
              {chapter}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-2xl font-bold mb-4">{selectedChapter}</h1>
        {chapters[selectedChapter].map((topic, idx) => (
          <Card key={idx} className="mb-6 shadow-lg rounded-2xl">
            <CardContent className="p-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                {topic.heading}
              </h2>
              <img
                src={topic.image}
                alt={topic.heading}
                className="my-3 rounded-lg shadow"
              />
              <p className="bg-yellow-100 p-2 rounded-lg font-medium">
                ⭐ Important: {topic.highlight}
              </p>
              <details className="mt-3 cursor-pointer">
                <summary className="font-semibold">Know More</summary>
                <ul className="list-disc ml-5 mt-2">
                  {topic.details.map((point, i) => (
                    <li
                      key={i}
                      onClick={() => addNote(point)}
                      className="cursor-pointer hover:text-blue-600"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </details>

              {/* Prelims Tip Box */}
              {topic.prelimsTips && (
                <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Prelims Pointers
                  </h4>
                  <ul className="list-disc ml-5 mt-1 text-sm">
                    {topic.prelimsTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Global Memory Notes */}
        <Card className="border-2 border-dashed border-blue-400">
          <CardContent className="p-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Star className="text-yellow-500" /> My Memory Notes
            </h3>
            {notes.length === 0 ? (
              <p className="text-gray-500 mt-2">
                Click on any point above to save it here.
              </p>
            ) : (
              <div>
                <ul className="list-disc ml-5 mt-2">
                  {notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>

                {/* ✅ Export Buttons */}
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={exportNotesToPDF}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 shadow hover:bg-blue-600"
                  >
                    <Download className="w-4 h-4" /> Download as PDF
                  </button>
                  <button
                    onClick={exportNotesToDOCX}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 shadow hover:bg-green-600"
                  >
                    <Download className="w-4 h-4" /> Download as DOCX
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PolityBook;