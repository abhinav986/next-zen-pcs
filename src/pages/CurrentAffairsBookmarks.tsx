import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookmarkX, BookOpen, Loader2 } from "lucide-react";
import currentAffairsData from "@/data/currentAffairsData.json";

export default function CurrentAffairsBookmarks() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('current_affairs_bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Match bookmarks with article data
      const bookmarkedArticles = data?.map(bookmark => {
        const article = currentAffairsData.find(a => a.id === bookmark.article_id);
        return article ? { ...article, bookmarkId: bookmark.id } : null;
      }).filter(Boolean);

      setBookmarks(bookmarkedArticles || []);
    } catch (error: any) {
      console.error('Error fetching bookmarks:', error);
      toast({
        title: "Error",
        description: "Failed to load bookmarks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (bookmarkId: string, articleTitle: string) => {
    try {
      const { error } = await supabase
        .from('current_affairs_bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;

      setBookmarks(bookmarks.filter(b => b.bookmarkId !== bookmarkId));
      toast({
        title: "Bookmark removed",
        description: `Removed "${articleTitle}" from bookmarks`,
      });
    } catch (error: any) {
      console.error('Error removing bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to remove bookmark",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Bookmarked Current Affairs - UPSC Prep</title>
        <meta name="description" content="Your bookmarked current affairs articles for UPSC preparation" />
      </Helmet>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bookmarked Current Affairs</h1>
          <p className="text-muted-foreground">
            Access all your saved current affairs articles in one place
          </p>
        </div>

        {bookmarks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookmarkX className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No bookmarks yet</h3>
              <p className="text-muted-foreground mb-4">
                Start bookmarking current affairs articles to access them quickly
              </p>
              <Link to="/current-affairs">
                <Button>
                  Browse Current Affairs
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((article: any) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  {article.image && (
                    <img 
                      src={article.image} 
                      alt={article.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
                  <CardDescription className="text-sm">{article.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Link to={article.url} className="flex-1">
                      <Button size="sm" className="w-full">
                        <BookOpen className="h-3 w-3 mr-1" />
                        Read Article
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => removeBookmark(article.bookmarkId, article.title)}
                    >
                      <BookmarkX className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
