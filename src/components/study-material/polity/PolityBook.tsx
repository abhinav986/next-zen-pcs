import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Star, Lightbulb, Download, Bookmark, Play, CheckCircle, Menu, X, Languages } from "lucide-react";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { chapters } from "./constants";
import { useIsMobile } from "@/hooks/use-mobile";

// ==================== ENRICHED UPSC CONTENT (same as before) ====================
// ... keep the chapters object here ...

const PolityBook = () => {
  const isMobile = useIsMobile();
  const [selectedChapter, setSelectedChapter] = useState(
    "Chapter 1: Making of the Constitution"
  );
  const [notes, setNotes] = useState([]);
  const [completedChapters, setCompletedChapters] = useState(new Set());
  const [showBookmarks, setShowBookmarks] = useState(!isMobile);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [isHindi, setIsHindi] = useState(false);

  const addNote = (point) => {
    if (!notes.includes(point)) {
      setNotes([...notes, point]);
    }
  };

  const markChapterComplete = (chapter) => {
    setCompletedChapters(prev => new Set([...prev, chapter]));
  };

  const removeNote = (index) => {
    setNotes(notes.filter((_, i) => i !== index));
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

  // Helper function to get Hindi chapter titles
  const getChapterTitleHindi = (chapter: string) => {
    const hindiTitles = {
      "Chapter 1: Making of the Constitution": "अध्याय 1: संविधान का निर्माण",
      "Chapter 2: Preamble & Salient Features": "अध्याय 2: प्रस्तावना और मुख्य विशेषताएं",
      "Chapter 3: Fundamental Rights": "अध्याय 3: मौलिक अधिकार",
      "Chapter 4: DPSPs & Fundamental Duties": "अध्याय 4: राज्य नीति निदेशक सिद्धांत और मौलिक कर्तव्य"
    };
    return hindiTitles[chapter] || chapter;
  };

  return (
    <div className="flex h-full relative">
      {/* Mobile Menu Button */}
      {isMobile && (
        <Button
          onClick={() => setShowSidebar(!showSidebar)}
          className="fixed top-5 left-4 z-50 rounded-full h-12 w-12 shadow-lg"
          size="icon"
          variant="outline"
        >
          {showSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      )}

      {/* Language Toggle Button */}
      <Button
        onClick={() => setIsHindi(!isHindi)}
        className={`fixed z-50 rounded-full shadow-lg ${
          isMobile 
            ? "top-5 right-24 w-10 h-10" 
            : "top-5 right-20 h-12 w-12"
        }`}
        size="icon"
        variant="outline"
      >
        <Languages className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
      </Button>

      {/* Floating Bookmarks Button */}
      <Button
        onClick={() => setShowBookmarks(!showBookmarks)}
        className={`fixed z-50 rounded-full h-12 w-12 shadow-lg ${
          isMobile 
            ? "top-5 right-4 w-10 h-10" 
            : "top-5 right-6"
        }`}
        size="icon"
        variant={showBookmarks ? "default" : "outline"}
      >
        <Bookmark className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
      </Button>

      {/* Bookmarks Panel */}
      {showBookmarks && (
        <div className={`fixed bg-card border border-border rounded-lg shadow-xl z-40 overflow-hidden ${
          isMobile 
            ? "top-20 left-4 right-4 max-h-80" 
            : "top-20 right-6 w-80 max-h-96"
        }`}>
          <div className="p-4 border-b border-border bg-primary/5">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              {isHindi ? `मेरे बुकमार्क (${notes.length})` : `My Bookmarks (${notes.length})`}
            </h3>
          </div>
          <div className="overflow-y-auto max-h-60 p-2">
            {notes.length === 0 ? (
              <p className="text-muted-foreground text-sm p-4 text-center">
                {isHindi ? "अभी तक कोई बुकमार्क नहीं। पॉइंट्स को सेव करने के लिए उन पर क्लिक करें।" : "No bookmarks yet. Click on points to save them."}
              </p>
            ) : (
              <div className="space-y-2">
                {notes.map((note, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-accent/20 rounded text-sm">
                    <span className="flex-1 text-foreground">{note}</span>
                    <Button
                      onClick={() => removeNote(i)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {notes.length > 0 && (
            <div className="p-3 border-t border-border bg-muted/20">
              <div className="flex gap-2">
                <Button onClick={exportNotesToPDF} size="sm" className="flex-1">
                  <Download className="h-3 w-3 mr-1" /> PDF
                </Button>
                <Button onClick={exportNotesToDOCX} size="sm" variant="outline" className="flex-1">
                  <Download className="h-3 w-3 mr-1" /> DOCX
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chapter Playlist Sidebar */}
      <div className={`bg-gradient-to-b from-card to-muted/20 border-r border-border overflow-y-auto transition-all duration-300 ${
        isMobile 
          ? showSidebar 
            ? "fixed inset-y-0 left-0 w-80 z-30" 
            : "hidden"
          : "w-80"
      }`}>
        <div className="p-4 border-b border-border bg-primary/5">
          <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {isHindi ? "भारतीय राजव्यवस्था प्लेलिस्ट" : "Indian Polity Playlist"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {Object.keys(chapters).length} {isHindi ? "अध्याय" : "chapters"} • {completedChapters.size} {isHindi ? "पूर्ण" : "completed"}
          </p>
        </div>
        
        <div className="p-2">
          {Object.keys(chapters).map((chapter, index) => {
            const isSelected = selectedChapter === chapter;
            const isCompleted = completedChapters.has(chapter);
            
            return (
              <div
                key={chapter}
                onClick={() => setSelectedChapter(chapter)}
                className={`group p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? "bg-primary/10 border border-primary/20 shadow-sm" 
                    : "hover:bg-accent/30 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted 
                      ? "bg-green-500 text-white" 
                      : isSelected 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground group-hover:bg-accent"
                  }`}>
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium text-sm leading-tight ${
                      isSelected ? "text-primary" : "text-foreground"
                    }`}>
                      {isHindi ? getChapterTitleHindi(chapter).replace(/अध्याय \d+:\s*/, "") : chapter.replace("Chapter ", "").replace(/^\d+:\s*/, "")}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {chapters[chapter].length} {isHindi ? "विषय" : "topics"}
                    </p>
                  </div>
                  
                  {isSelected && (
                    <Play className="h-4 w-4 text-primary animate-pulse" />
                  )}
                </div>
                
                {isSelected && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        markChapterComplete(chapter);
                      }}
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      disabled={isCompleted}
                    >
                      {isCompleted ? (isHindi ? "✓ पूर्ण" : "✓ Completed") : (isHindi ? "पूर्ण चिह्नित करें" : "Mark Complete")}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-border bg-muted/10">
          <div className="text-center">
            <div className="text-sm font-medium text-foreground">{isHindi ? "प्रगति" : "Progress"}</div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedChapters.size / Object.keys(chapters).length) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round((completedChapters.size / Object.keys(chapters).length) * 100)}% {isHindi ? "पूर्ण" : "complete"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto bg-background ${
        isMobile ? "p-4 pt-20" : "p-6"
      }`}>
        <div className="max-w-4xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isHindi ? getChapterTitleHindi(selectedChapter) : selectedChapter}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{chapters[selectedChapter].length} {isHindi ? "विषय" : "topics"}</span>
              <span>•</span>
              <span>{isHindi ? "अनुमानित पठन:" : "Estimated reading:"} {Math.ceil(chapters[selectedChapter].length * 3)} {isHindi ? "मिनट" : "minutes"}</span>
            </div>
          </div>
          {chapters[selectedChapter].map((topic, idx) => (
            <Card key={idx} className="mb-8 shadow-sm border-border hover:shadow-lg transition-all duration-200 group">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold flex items-center gap-3 text-foreground mb-4 group-hover:text-primary transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  {isHindi ? (topic.headingHindi || topic.heading) : topic.heading}
                </h2>
                {topic?.image && (
                  <div className="my-4">
                    <img
                      src={topic.image}
                      alt={topic.heading}
                      className="rounded-xl shadow-md w-full max-w-md mx-auto"
                    />
                  </div>
                )}
                
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800 mb-6">
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                        {isHindi ? "मुख्य बिंदु" : "Key Point"}
                      </h4>
                      <p className="text-amber-700 dark:text-amber-300">
                        {isHindi ? (topic.highlightHindi || topic.highlight) : topic.highlight}
                      </p>
                    </div>
                  </div>
                </div>
                
                <details className="mt-6 cursor-pointer bg-accent/20 rounded-lg" open>
                  <summary className="font-semibold text-foreground hover:text-primary transition-colors p-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {isHindi ? `विस्तृत नोट्स (${topic.details.length} बिंदु)` : `Detailed Notes (${topic.details.length} points)`}
                  </summary>
                  <div className="px-4 pb-4">
                    <div className="grid gap-3 mt-3">
                      {(isHindi ? (topic.detailsHindi || topic.details) : topic.details).map((point, i) => (
                        <div
                          key={i}
                          onClick={() => addNote(point)}
                          className="group cursor-pointer hover:bg-primary/5 p-3 rounded-lg border border-transparent hover:border-primary/20 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <Bookmark className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                            <span className="text-foreground group-hover:text-primary transition-colors leading-relaxed">
                              {point}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>

                {/* Prelims Tip Box */}
                {topic.prelimsTips && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-l-4 border-blue-500 rounded-r-xl">
                    <h4 className="font-semibold flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-3">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      {isHindi ? "प्रीलिम्स रणनीति सुझाव" : "Prelims Strategy Tips"}
                    </h4>
                    <div className="space-y-2">
                      {(isHindi ? (topic.prelimsTipsHindi || topic.prelimsTips) : topic.prelimsTips).map((tip, i) => (
                        <div key={i} onClick={() => addNote(tip)} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                          <span className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
};

export default PolityBook;