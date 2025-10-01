import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, BookOpen, Target, Calendar, MapPin, Bookmark, BookmarkCheck, Star, Download, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import currentAffairsData from "@/data/currentAffairsData.json";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { useIsMobile } from "@/hooks/use-mobile";

export default function CurrentAffairsDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarkedPoints, setBookmarkedPoints] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const article = currentAffairsData.find(item => item.id === id);
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    checkBookmarkStatus();
    loadBookmarkedPoints();
  }, [id, isAuthenticated]);

  const checkBookmarkStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('current_affairs_bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('article_id', id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setIsBookmarked(true);
        setBookmarkId(data.id);
      }
    } catch (error: any) {
      console.error('Error checking bookmark status:', error);
    }
  };

  // Load bookmarked points
  const loadBookmarkedPoints = async () => {
    if (!isAuthenticated) {
      const localBookmarks = JSON.parse(localStorage.getItem(`current-affairs-${id}-bookmarks`) || '[]');
      setBookmarkedPoints(localBookmarks);
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('content')
        .eq('user_id', user.id)
        .eq('subject_id', 'current_affairs')
        .eq('chapter_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setBookmarkedPoints(data?.map(b => b.content) || []);
    } catch (error) {
      console.error('Error loading bookmarked points:', error);
    }
  };

  // Add a point to bookmarks
  const addBookmark = async (point: string) => {
    if (bookmarkedPoints.includes(point)) return;

    if (!isAuthenticated) {
      const localBookmarks = JSON.parse(localStorage.getItem(`current-affairs-${id}-bookmarks`) || '[]');
      const updated = [...localBookmarks, point];
      localStorage.setItem(`current-affairs-${id}-bookmarks`, JSON.stringify(updated));
      setBookmarkedPoints(updated);
      toast({
        title: "Bookmark saved",
        description: "Added to your bookmarks",
      });
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to bookmark",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('user_bookmarks')
        .insert({
          user_id: user.id,
          subject_id: 'current_affairs',
          chapter_id: id!,
          content: point
        });
      
      if (error) throw error;
      
      loadBookmarkedPoints();
      toast({
        title: "Bookmark saved",
        description: "Added to your bookmarks",
      });
    } catch (error) {
      console.error('Error saving bookmark:', error);
    }
  };

  // Remove a bookmark
  const removeBookmark = async (point: string, index: number) => {
    if (!isAuthenticated) {
      const localBookmarks = JSON.parse(localStorage.getItem(`current-affairs-${id}-bookmarks`) || '[]');
      const updated = localBookmarks.filter((_: string, i: number) => i !== index);
      localStorage.setItem(`current-affairs-${id}-bookmarks`, JSON.stringify(updated));
      setBookmarkedPoints(updated);
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('subject_id', 'current_affairs')
        .eq('chapter_id', id)
        .eq('content', point);
      
      if (error) throw error;
      
      loadBookmarkedPoints();
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  // Export bookmarks to PDF
  const exportBookmarksToPDF = () => {
    if (bookmarkedPoints.length === 0) {
      toast({
        title: "No bookmarks",
        description: "Add some bookmarks first",
        variant: "destructive",
      });
      return;
    }
    const doc = new jsPDF();
    doc.setFont("times", "normal");
    doc.setFontSize(14);
    doc.text(`Current Affairs Bookmarks - ${article?.title}`, 10, 10);
    doc.setFontSize(12);

    bookmarkedPoints.forEach((note, idx) => {
      const yPos = 20 + idx * 10;
      if (yPos > 280) return; // Prevent overflow
      doc.text(`${idx + 1}. ${note.substring(0, 80)}`, 10, yPos);
    });

    doc.save(`Current-Affairs-${id}-Bookmarks.pdf`);
  };

  // Export bookmarks to DOCX
  const exportBookmarksToDOCX = async () => {
    if (bookmarkedPoints.length === 0) {
      toast({
        title: "No bookmarks",
        description: "Add some bookmarks first",
        variant: "destructive",
      });
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
                  text: `Current Affairs Bookmarks - ${article?.title}`,
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            ...bookmarkedPoints.map(
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
    saveAs(blob, `Current-Affairs-${id}-Bookmarks.docx`);
  };

  const toggleBookmark = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to bookmark articles",
          variant: "destructive",
        });
        return;
      }

      if (isBookmarked && bookmarkId) {
        const { error } = await supabase
          .from('current_affairs_bookmarks')
          .delete()
          .eq('id', bookmarkId);

        if (error) throw error;

        setIsBookmarked(false);
        setBookmarkId(null);
        toast({
          title: "Bookmark removed",
          description: "Article removed from bookmarks",
        });
      } else {
        const { data, error } = await supabase
          .from('current_affairs_bookmarks')
          .insert([
            { user_id: user.id, article_id: id }
          ])
          .select()
          .single();

        if (error) throw error;

        setIsBookmarked(true);
        setBookmarkId(data.id);
        toast({
          title: "Bookmarked",
          description: "Article saved to bookmarks",
        });
      }
    } catch (error: any) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (!article) {
    return <Navigate to="/current-affairs" replace />;
  }

  const { details } = article;

  // Helper to render clickable text that can be bookmarked
  const BookmarkableText = ({ text }: { text: string }) => (
    <span
      onClick={() => addBookmark(text)}
      className="cursor-pointer hover:bg-accent/30 px-1 rounded transition-colors"
      title="Click to bookmark"
    >
      {text}
    </span>
  );

  return (
    <>
      {/* Floating Bookmarks Button */}
      {!isMobile && (
        <Button
          onClick={() => setShowBookmarks(!showBookmarks)}
          className="fixed top-5 right-6 z-50 rounded-full h-12 w-12 shadow-lg bg-card border-2"
          size="icon"
          variant="outline"
        >
          <Bookmark className="h-5 w-5" fill={showBookmarks ? "currentColor" : "none"} />
        </Button>
      )}

      {isMobile && (
        <Button
          onClick={() => setShowBookmarks(!showBookmarks)}
          className="fixed bottom-4 right-4 z-50 rounded-full h-14 w-14 shadow-xl hover:scale-110 transition-all duration-300 bg-secondary text-secondary-foreground hover:bg-secondary/80"
          size="icon"
        >
          <Bookmark className="h-6 w-6" fill={showBookmarks ? "currentColor" : "none"} />
        </Button>
      )}

      {/* Bookmarks Panel */}
      {showBookmarks && (
        <div className={`fixed bg-card border border-border rounded-lg shadow-2xl z-40 overflow-hidden ${
          isMobile 
            ? "bottom-24 left-4 right-4 max-h-[calc(100vh-12rem)]" 
            : "top-20 right-6 w-80 max-h-96"
        }`}>
          <div className="p-4 border-b border-border bg-primary/5 flex justify-between items-center">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              My Bookmarks ({bookmarkedPoints.length})
            </h3>
            <Button
              onClick={() => setShowBookmarks(false)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-y-auto max-h-60 p-2">
            {bookmarkedPoints.length === 0 ? (
              <p className="text-muted-foreground text-sm p-4 text-center">
                No bookmarks yet. Click on any point to save it.
              </p>
            ) : (
              <div className="space-y-2">
                {bookmarkedPoints.map((note, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-accent/20 rounded text-sm">
                    <span className="flex-1 text-foreground">{note}</span>
                    <Button
                      onClick={() => removeBookmark(note, i)}
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
          {bookmarkedPoints.length > 0 && (
            <div className="p-3 border-t border-border bg-muted/20">
              <div className="flex gap-2">
                <Button onClick={exportBookmarksToPDF} size="sm" className="flex-1">
                  <Download className="h-3 w-3 mr-1" /> PDF
                </Button>
                <Button onClick={exportBookmarksToDOCX} size="sm" variant="outline" className="flex-1">
                  <Download className="h-3 w-3 mr-1" /> DOCX
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Back Button and Bookmark */}
        <div className="mb-6 flex justify-between items-center">
          <Link to="/current-affairs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Current Affairs
            </Button>
          </Link>
          <Button 
            variant={isBookmarked ? "default" : "outline"}
            size="sm"
            onClick={toggleBookmark}
            disabled={loading}
          >
            {isBookmarked ? (
              <>
                <BookmarkCheck className="h-4 w-4 mr-2" />
                Bookmarked
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4 mr-2" />
                Bookmark
              </>
            )}
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{details.topic}</h1>
          {details.image && (
            <img 
              src={details.image} 
              alt={details.topic}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Background */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  <BookmarkableText text={details.background.summary} />
                </p>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm"><strong>Location:</strong> <BookmarkableText text={details.background.location} /></span>
                  </div>
                  {details.background.related_conflict && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm"><strong>Related Event:</strong> <BookmarkableText text={details.background.related_conflict} /></span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Exercise Details */}
            {details.exercise_details && (
              <Card>
                <CardHeader>
                  <CardTitle>{details.exercise_details.name} - Exercise Details</CardTitle>
                  <CardDescription>{details.exercise_details.scope}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Objectives:</h4>
                    <ul className="space-y-1">
                      {details.exercise_details.objectives.map((objective, index) => (
                        <li key={index} className="text-sm text-muted-foreground">• <BookmarkableText text={objective} /></li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Participants:</h4>
                    <p className="text-sm text-muted-foreground">{details.exercise_details.participants}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Expected Outcomes:</h4>
                    <ul className="space-y-1">
                      {details.exercise_details.expected_outcomes.map((outcome, index) => (
                        <li key={index} className="text-sm text-muted-foreground">• <BookmarkableText text={outcome} /></li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sudarshan Chakra */}
            {details.sudarshan_chakra && (
              <Card>
                <CardHeader>
                  <CardTitle>Sudarshan Chakra Program</CardTitle>
                  <CardDescription>{details.sudarshan_chakra.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Timeline:</h4>
                    <div className="grid gap-2">
                      <p className="text-sm"><strong>Phase 1:</strong> {details.sudarshan_chakra.timeline.phase1}</p>
                      <p className="text-sm"><strong>Phase 2:</strong> {details.sudarshan_chakra.timeline.phase2}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Components:</h4>
                    <ul className="space-y-1">
                      {details.sudarshan_chakra.components.map((component, index) => (
                        <li key={index} className="text-sm text-muted-foreground">• <BookmarkableText text={component} /></li>
                      ))}
                    </ul>
                  </div>
                  {details.sudarshan_chakra.related_projects && (
                    <div>
                      <h4 className="font-semibold mb-2">Related Projects:</h4>
                      <div className="space-y-2">
                        {Object.entries(details.sudarshan_chakra.related_projects).map(([project, description]) => (
                          <div key={project}>
                            <strong className="text-sm">{project.replace(/_/g, ' ')}:</strong>
                            <p className="text-sm text-muted-foreground">{description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {details.sudarshan_chakra.recent_milestones && (
                    <div>
                      <h4 className="font-semibold mb-2">Recent Milestones:</h4>
                      <ul className="space-y-1">
                        {details.sudarshan_chakra.recent_milestones.map((milestone, index) => (
                          <li key={index} className="text-sm text-muted-foreground">• <BookmarkableText text={milestone} /></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Strategic Significance */}
            {details.strategic_significance && (
              <Card>
                <CardHeader>
                  <CardTitle>Strategic Significance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {details.strategic_significance.map((point, index) => (
                      <li key={index} className="text-sm text-muted-foreground">• <BookmarkableText text={point} /></li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Challenges */}
            {details.challenges && (
              <Card>
                <CardHeader>
                  <CardTitle>Challenges</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {details.challenges.map((challenge, index) => (
                      <li key={index} className="text-sm text-muted-foreground">• <BookmarkableText text={challenge} /></li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Future Outlook */}
            {details.future_outlook && (
              <Card>
                <CardHeader>
                  <CardTitle>Future Outlook</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(details.future_outlook).map(([key, value]) => (
                    <div key={key}>
                      <strong className="text-sm capitalize">{key.replace(/_/g, ' ')}:</strong>
                      <p className="text-sm text-muted-foreground">{value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* UPSC Relevance */}
            {details.upsc_relevance && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    UPSC Relevance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {details.upsc_relevance.gs_paper2 && (
                    <div>
                      <Badge variant="outline" className="mb-2">GS Paper 2</Badge>
                      <p className="text-sm text-muted-foreground">{details.upsc_relevance.gs_paper2}</p>
                    </div>
                  )}
                  {details.upsc_relevance.gs_paper3 && (
                    <div>
                      <Badge variant="outline" className="mb-2">GS Paper 3</Badge>
                      <p className="text-sm text-muted-foreground">{details.upsc_relevance.gs_paper3}</p>
                    </div>
                  )}
                  {details.upsc_relevance.essay_ethics && (
                    <div>
                      <Badge variant="outline" className="mb-2">Essay & Ethics</Badge>
                      <ul className="space-y-1">
                        {details.upsc_relevance.essay_ethics.map((topic, index) => (
                          <li key={index} className="text-sm text-muted-foreground">• {topic}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sample Questions */}
            {details.sample_questions && (
              <Card>
                <CardHeader>
                  <CardTitle>Sample Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {details.sample_questions.prelims && (
                    <div>
                      <h4 className="font-semibold mb-2">Prelims</h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">{details.sample_questions.prelims.question}</p>
                        <div className="space-y-1">
                          {details.sample_questions.prelims.options.map((option, index) => (
                            <p key={index} className="text-xs text-muted-foreground">{option}</p>
                          ))}
                        </div>
                        <p className="text-xs mt-2 font-medium">
                          Answer: {details.sample_questions.prelims.answer.map(a => `Option ${a}`).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                  {details.sample_questions.mains && (
                    <div>
                      <h4 className="font-semibold mb-2">Mains</h4>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">{details.sample_questions.mains.question}</p>
                        {details.sample_questions.mains.structured_answer && (
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <p><strong>Introduction:</strong> {details.sample_questions.mains.structured_answer.introduction}</p>
                            {details.sample_questions.mains.structured_answer.body && (
                              <div className="space-y-1">
                                <p><strong>Body:</strong></p>
                                {Object.entries(details.sample_questions.mains.structured_answer.body).map(([key, value]) => (
                                  <p key={key} className="ml-2">• {value}</p>
                                ))}
                              </div>
                            )}
                            <p><strong>Conclusion:</strong> {details.sample_questions.mains.structured_answer.conclusion}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sources */}
            {details.sources && (
              <Card>
                <CardHeader>
                  <CardTitle>Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {details.sources.map((source, index) => (
                      <a 
                        key={index} 
                        href={source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Source {index + 1}
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </>
  );
}