import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-72 bg-card border-r border-border overflow-y-auto">
        <h2 className="p-4 font-bold text-lg border-b border-border text-foreground">📘 Chapters</h2>
        <ul>
          {Object.keys(chapters).map((chapter) => (
            <li
              key={chapter}
              onClick={() => setSelectedChapter(chapter)}
              className={`p-3 cursor-pointer hover:bg-accent/50 transition-colors ${
                selectedChapter === chapter ? "bg-primary/10 font-semibold border-r-2 border-primary" : ""
              } text-foreground`}
            >
              {chapter}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-background">
        <h1 className="text-2xl font-bold mb-6 text-foreground">{selectedChapter}</h1>
        {chapters[selectedChapter].map((topic, idx) => (
          <Card key={idx} className="mb-6 shadow-sm border-border hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                {topic.heading}
              </h2>
              {topic?.image &&
              <img
                src={topic.image}
                alt={topic.heading}
                className="my-3 rounded-lg shadow"
              />
              }
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  ⭐ Important: {topic.highlight}
                </p>
              </div>
              <details className="mt-4 cursor-pointer">
                <summary className="font-semibold text-foreground hover:text-primary transition-colors">📚 Know More</summary>
                <ul className="list-disc ml-5 mt-3 space-y-2">
                  {topic.details.map((point, i) => (
                    <li
                      key={i}
                      onClick={() => addNote(point)}
                      className="cursor-pointer hover:text-primary transition-colors text-muted-foreground hover:bg-accent/20 p-2 rounded"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </details>

              {/* Prelims Tip Box */}
              {topic.prelimsTips && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded-r-lg">
                  <h4 className="font-semibold flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Prelims Pointers
                  </h4>
                  <ul className="list-disc ml-5 mt-2 text-sm space-y-1 text-blue-700 dark:text-blue-300">
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
        <Card className="border-2 border-dashed border-primary/50 bg-gradient-to-br from-card to-accent/5">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-foreground mb-4">
              <Star className="text-yellow-500" /> My Memory Notes
            </h3>
            {notes.length === 0 ? (
              <p className="text-muted-foreground">
                Click on any point above to save it here.
              </p>
            ) : (
              <div>
                <ul className="list-disc ml-5 space-y-2">
                  {notes.map((n, i) => (
                    <li key={i} className="text-foreground">{n}</li>
                  ))}
                </ul>

                {/* Export Buttons */}
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={exportNotesToPDF}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> PDF
                  </Button>
                  <Button
                    onClick={exportNotesToDOCX}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> DOCX
                  </Button>
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