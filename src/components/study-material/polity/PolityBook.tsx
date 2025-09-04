import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Star, Lightbulb, Download, Bookmark, Play, CheckCircle, Menu, X, Languages, Table, Info, Target, TestTube } from "lucide-react";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { chapters } from "./constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams, Link } from "react-router-dom";

// ==================== ENRICHED UPSC CONTENT (same as before) ====================
// ... keep the chapters object here ...

const PolityBook = () => {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedChapter, setSelectedChapter] = useState(
    searchParams.get('chapter') || "Chapter 1: Making of the Constitution"
  );
  const [notes, setNotes] = useState([]);
  const [completedChapters, setCompletedChapters] = useState(new Set());
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isHindi, setIsHindi] = useState(false);

  // Update URL when chapter changes
  useEffect(() => {
    if (selectedChapter !== "Chapter 1: Making of the Constitution") {
      setSearchParams({ chapter: selectedChapter });
    } else {
      setSearchParams({});
    }
  }, [selectedChapter, setSearchParams]);

  // Handle URL changes
  useEffect(() => {
    const chapterParam = searchParams.get('chapter');
    if (chapterParam && chapters[chapterParam] && chapterParam !== selectedChapter) {
      setSelectedChapter(chapterParam);
    }
  }, [searchParams]);

  // Auto-manage bookmark visibility on mobile when sidebar toggles
  const toggleSidebar = () => {
    if (isMobile) {
      if (!showSidebar) {
        // Opening sidebar - close bookmarks
        setShowBookmarks(false);
        setShowSidebar(true);
      } else {
        // Closing sidebar - open bookmarks
        setShowSidebar(false);
        setShowBookmarks(true);
      }
    } else {
      setShowSidebar(!showSidebar);
    }
  };

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
      {/* Mobile Backdrop - Only for sidebar */}
      {isMobile && showSidebar && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
          onClick={() => {
            setShowSidebar(false);
          }}
        />
      )}

      {/* Mobile Floating Action Buttons */}
      {isMobile && (
        <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-between items-end">
          {/* Menu Button */}
          <Button
            onClick={toggleSidebar}
            className="rounded-full h-14 w-14 shadow-xl bg-primary text-primary-foreground hover:scale-110 transition-all duration-300"
            size="icon"
          >
            {showSidebar ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>

          {/* Action Buttons Stack */}
          <div className="flex flex-col gap-3">
            {/* Language Toggle */}
            <Button
              onClick={() => setIsHindi(!isHindi)}
              className="rounded-full h-12 w-12 shadow-lg bg-card hover:bg-accent hover:scale-105 transition-all duration-300"
              size="icon"
              variant="outline"
            >
              <Languages className="h-5 w-5" />
            </Button>
            
            {/* Bookmarks Button */}
            <Button
              onClick={() => setShowBookmarks(!showBookmarks)}
              className="rounded-full h-14 w-14 shadow-xl hover:scale-110 transition-all duration-300 bg-secondary text-secondary-foreground hover:bg-secondary/80"
              size="icon"
            >
              <Bookmark className="h-6 w-6" fill={showBookmarks ? "currentColor" : "none"} />
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Floating Buttons */}
      {!isMobile && (
        <>
          <Button
            onClick={() => setIsHindi(!isHindi)}
            className="fixed top-5 right-20 z-50 rounded-full h-12 w-12 shadow-lg bg-card"
            size="icon"
            variant="outline"
          >
            <Languages className="h-5 w-5" />
          </Button>

          <Button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className="fixed top-5 right-6 z-50 rounded-full h-12 w-12 shadow-lg bg-card border-2"
            size="icon"
            variant="outline"
          >
            <Bookmark className="h-5 w-5" fill={showBookmarks ? "currentColor" : "none"} />
          </Button>
        </>
      )}

      {/* Bookmarks Panel */}
      {showBookmarks && (
        <div className={`fixed bg-card border border-border rounded-lg shadow-2xl z-40 overflow-hidden ${
          isMobile 
            ? "bottom-32 left-4 right-4 max-h-[calc(100vh-18rem)]" 
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
            ? "fixed inset-y-0 left-0 w-[90vw] max-w-sm z-30 rounded-r-xl" 
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
                  <div className="mt-2 pt-2 border-t border-border/50 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          markChapterComplete(chapter);
                        }}
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        disabled={isCompleted}
                      >
                        {isCompleted ? (isHindi ? "✓ पूर्ण" : "✓ Completed") : (isHindi ? "पूर्ण चिह्नित करें" : "Mark Complete")}
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="secondary"
                        className="flex-1 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link to={`/polity-test?chapter=${encodeURIComponent(chapter)}`}>
                          <TestTube className="h-3 w-3 mr-1" />
                          {isHindi ? "अभ्यास" : "Practice"}
                        </Link>
                      </Button>
                    </div>
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
        isMobile ? "p-4 pt-4 pb-24" : "p-6"
      }`}>
        <div className="max-w-4xl">
          <div className="mb-6">
            <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} mb-2`}>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-foreground leading-tight`}>
                {isHindi ? getChapterTitleHindi(selectedChapter) : selectedChapter}
              </h1>
              <Button
                asChild
                size={isMobile ? "default" : "sm"}
                className={`flex items-center gap-2 ${isMobile ? 'w-full justify-center' : ''}`}
              >
                <Link to={`/polity-test?chapter=${encodeURIComponent(selectedChapter)}`}>
                  <TestTube className="h-4 w-4" />
                  {isHindi ? "अध्याय परीक्षा" : "Chapter Test"}
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{chapters[selectedChapter].length} {isHindi ? "विषय" : "topics"}</span>
              <span>•</span>
              <span>{isHindi ? "अनुमानित पठन:" : "Estimated reading:"} {Math.ceil(chapters[selectedChapter].length * 3)} {isHindi ? "मिनट" : "minutes"}</span>
            </div>
          </div>
          {chapters[selectedChapter].map((topic, idx) => (
            <Card key={idx} className={`mb-6 shadow-sm border-border hover:shadow-lg transition-all duration-200 group ${isMobile ? 'rounded-xl' : ''}`}>
              <CardContent className={isMobile ? "p-4" : "p-6"}>
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold flex items-center gap-3 text-foreground mb-4 group-hover:text-primary transition-colors leading-tight`}>
                  <div className={`flex-shrink-0 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-primary/10 rounded-lg flex items-center justify-center`}>
                    <BookOpen className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-primary`} />
                  </div>
                  <span className="flex-1">
                    {isHindi ? (topic.headingHindi || topic.heading) : topic.heading}
                  </span>
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

                {topic?.highlight && 
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
                }
                
                {topic?.details?.length && 
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
                }

                {/* Tables Section */}
                {topic.tables && (
                  <div className="mt-6 space-y-4">
                    {topic.tables.map((table, tableIdx) => (
                      <div key={tableIdx} className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                        <h4 className="font-semibold flex items-center gap-2 text-purple-800 dark:text-purple-200 mb-3">
                          <Table className="w-5 h-5" />
                          {table.title}
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-purple-300 dark:border-purple-700">
                                {table?.columns?.map((column, colIdx) => (
                                  <th key={colIdx} className="text-left p-2 font-semibold text-purple-800 dark:text-purple-200">
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {table?.rows?.map((row, rowIdx) => (
                                <tr 
                                  key={rowIdx} 
                                  onClick={() => addNote(`${table.title}: ${row.join(" - ")}`)}
                                  className="border-b border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/20 cursor-pointer transition-colors"
                                >
                                  {row.map((cell, cellIdx) => (
                                    <td key={cellIdx} className="p-2 text-purple-700 dark:text-purple-300">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fun Facts Section */}
                {topic.funFacts && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <h4 className="font-semibold flex items-center gap-2 text-green-800 dark:text-green-200 mb-3">
                      <Info className="w-5 h-5" />
                      {isHindi ? "दिलचस्प तथ्य" : "Fun Facts"}
                    </h4>
                    <div className="space-y-2">
                      {(isHindi ? (topic.funFactsHindi || topic.funFacts) : topic.funFacts).map((fact, i) => (
                        <div 
                          key={i} 
                          onClick={() => addNote(fact)}
                          className="flex items-start gap-2 p-2 rounded hover:bg-green-100 dark:hover:bg-green-900/20 cursor-pointer transition-colors"
                        >
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0 mt-2"></div>
                          <span className="text-sm text-green-700 dark:text-green-300 leading-relaxed">{fact}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mains Points Section */}
                {topic.mainsPoints && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                    <h4 className="font-semibold flex items-center gap-2 text-orange-800 dark:text-orange-200 mb-3">
                      <Target className="w-5 h-5" />
                      {isHindi ? "मुख्य परीक्षा के मुख्य बिंदु" : "Mains Key Points"}
                    </h4>
                    <div className="space-y-2">
                      {(isHindi ? (topic.mainsPointsHindi || topic.mainsPoints) : topic.mainsPoints).map((point, i) => (
                        <div 
                          key={i}
                          onClick={() => addNote(point)}
                          className="flex items-start gap-2 p-2 rounded hover:bg-orange-100 dark:hover:bg-orange-900/20 cursor-pointer transition-colors"
                        >
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                          <span className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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