import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, BookOpen, Target, Download, Clock } from "lucide-react";
import { format } from "date-fns";

// Mock data for current affairs articles
const mockArticles = [
  {
    id: "1",
    title: "Supreme Court Upholds Right to Privacy in Digital Age",
    summary: "The Supreme Court delivered a landmark judgment reinforcing digital privacy rights, impacting data protection laws and citizen surveillance.",
    content: "Full article content...",
    publishedAt: new Date("2024-01-15"),
    source: { name: "The Hindu", url: "#", official: true },
    subjects: ["Polity", "Science & Technology"],
    gsPaper: [2, 3],
    syllabusTopics: ["Indian Polity>Judiciary>Supreme Court", "Science & Technology>Digital India"],
    examRelevance: { prelims: true, mains: true },
    difficulty: "medium",
    readingTime: 8,
    mcqs: [
      {
        id: "mcq1",
        question: "Which Article of the Constitution recognizes Privacy as a Fundamental Right?",
        options: ["Article 19", "Article 21", "Article 14", "Article 32"],
        answerIndex: 1,
        explanation: "Article 21 (Right to Life and Personal Liberty) has been interpreted to include the right to privacy."
      }
    ],
    mainsPointers: [
      "Analyze the evolution of privacy jurisprudence in India",
      "Discuss the balance between national security and individual privacy rights"
    ]
  },
  {
    id: "2",
    title: "India's Green Hydrogen Mission: Progress and Challenges",
    summary: "Government announces major policy updates for National Green Hydrogen Mission with focus on renewable energy transition.",
    content: "Full article content...",
    publishedAt: new Date("2024-01-14"),
    source: { name: "PIB", url: "#", official: true },
    subjects: ["Environment", "Economy"],
    gsPaper: [3],
    syllabusTopics: ["Environment>Renewable Energy", "Economy>Industrial Policy"],
    examRelevance: { prelims: true, mains: true },
    difficulty: "medium",
    readingTime: 6,
    mcqs: [
      {
        id: "mcq2",
        question: "What is the target for green hydrogen production under the National Green Hydrogen Mission?",
        options: ["5 MMT by 2030", "10 MMT by 2030", "15 MMT by 2030", "20 MMT by 2030"],
        answerIndex: 0,
        explanation: "India aims to produce 5 Million Metric Tonnes of green hydrogen by 2030."
      }
    ],
    mainsPointers: [
      "Examine India's strategy for achieving carbon neutrality through green hydrogen",
      "Assess the economic implications of green hydrogen mission on industrial growth"
    ]
  },
  {
    id: "3",
    title: "QUAD Summit: Strategic Implications for Indo-Pacific",
    summary: "Latest QUAD summit addresses regional security cooperation and economic partnerships in the Indo-Pacific region.",
    content: "Full article content...",
    publishedAt: new Date("2024-01-13"),
    source: { name: "Indian Express", url: "#", official: false },
    subjects: ["International Relations"],
    gsPaper: [2],
    syllabusTopics: ["International Relations>Bilateral Relations", "International Relations>Groupings"],
    examRelevance: { prelims: true, mains: true },
    difficulty: "hard",
    readingTime: 10,
    mcqs: [
      {
        id: "mcq3",
        question: "QUAD comprises which of the following countries?",
        options: ["India, USA, Japan, Australia", "India, USA, Japan, South Korea", "India, USA, Australia, UK", "India, China, Japan, Australia"],
        answerIndex: 0,
        explanation: "QUAD is a strategic dialogue between India, USA, Japan, and Australia."
      }
    ],
    mainsPointers: [
      "Analyze the role of QUAD in maintaining regional balance in Indo-Pacific",
      "Evaluate the challenges and opportunities for India in multilateral partnerships"
    ]
  }
];

const subjects = ["All", "Polity", "Economy", "Environment", "International Relations", "Science & Technology", "History", "Geography"];
const difficulties = ["All", "Easy", "Medium", "Hard"];
const gsPapers = ["All", "GS 1", "GS 2", "GS 3", "GS 4"];

export default function CurrentAffairs() {
  const [articles, setArticles] = useState(mockArticles);
  const [filteredArticles, setFilteredArticles] = useState(mockArticles);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedGsPaper, setSelectedGsPaper] = useState("All");
  const [activeTab, setActiveTab] = useState("daily");

  useEffect(() => {
    let filtered = articles;

    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSubject !== "All") {
      filtered = filtered.filter(article =>
        article.subjects.includes(selectedSubject)
      );
    }

    if (selectedDifficulty !== "All") {
      filtered = filtered.filter(article =>
        article.difficulty.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    if (selectedGsPaper !== "All") {
      const paperNum = parseInt(selectedGsPaper.split(" ")[1]);
      filtered = filtered.filter(article =>
        article.gsPaper.includes(paperNum)
      );
    }

    setFilteredArticles(filtered);
  }, [searchTerm, selectedSubject, selectedDifficulty, selectedGsPaper, articles]);

  const ArticleCard = ({ article }: { article: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-wrap gap-1 mb-2">
            {article.subjects.map((subject: string) => (
              <Badge key={subject} variant="secondary" className="text-xs">
                {subject}
              </Badge>
            ))}
            {article.gsPaper.map((paper: number) => (
              <Badge key={paper} variant="outline" className="text-xs">
                GS {paper}
              </Badge>
            ))}
          </div>
          <Badge 
            variant={article.difficulty === "easy" ? "default" : 
                   article.difficulty === "medium" ? "secondary" : "destructive"}
            className="text-xs"
          >
            {article.difficulty}
          </Badge>
        </div>
        <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
        <CardDescription className="text-sm">{article.summary}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-4">
            <span>{article.source.name}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(article.publishedAt, "dd MMM yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.readingTime} min read
            </span>
          </div>
        </div>
        
        {/* MCQ Preview */}
        {article.mcqs && article.mcqs.length > 0 && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="font-medium text-sm mb-2">Practice Question:</p>
            <p className="text-sm">{article.mcqs[0].question}</p>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {article.mcqs[0].options.map((option: string, index: number) => (
                <Button key={index} variant="ghost" size="sm" className="text-xs justify-start">
                  {String.fromCharCode(65 + index)}. {option}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Mains Pointers */}
        {article.mainsPointers && article.mainsPointers.length > 0 && (
          <div className="mb-4">
            <p className="font-medium text-sm mb-2">Mains Pointers:</p>
            <ul className="text-sm text-muted-foreground">
              {article.mainsPointers.slice(0, 2).map((pointer: string, index: number) => (
                <li key={index} className="mb-1">• {pointer}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <BookOpen className="h-3 w-3 mr-1" />
            Read Full Article
          </Button>
          <Button size="sm" variant="outline">
            <Target className="h-3 w-3 mr-1" />
            Quiz
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Helmet>
        <title>Current Affairs - UPSC Exam Preparation</title>
        <meta name="description" content="Stay updated with curated current affairs for UPSC preparation. Daily briefs, subject-wise articles, practice MCQs, and mains pointers." />
        <meta name="keywords" content="UPSC current affairs, daily news, prelims MCQs, mains answers, GS papers, Indian polity, economy, environment" />
      </Helmet>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Current Affairs</h1>
          <p className="text-muted-foreground">
            Stay updated with UPSC-focused current affairs. Curated articles with syllabus mapping, practice questions, and mains pointers.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="daily">Daily Brief</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Compilation</TabsTrigger>
            <TabsTrigger value="subject">Subject-wise</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted rounded-lg">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedGsPaper} onValueChange={setSelectedGsPaper}>
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="GS Paper" />
                </SelectTrigger>
                <SelectContent>
                  {gsPapers.map(paper => (
                    <SelectItem key={paper} value={paper}>{paper}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Articles Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Compilations</CardTitle>
                <CardDescription>
                  Download subject-wise monthly compilations for systematic revision
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {subjects.slice(1).map(subject => (
                    <div key={subject} className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">{subject}</h3>
                      <p className="text-sm text-muted-foreground mb-3">December 2024</p>
                      <Button size="sm" variant="outline" className="w-full">
                        <Download className="h-3 w-3 mr-1" />
                        Download PDF
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subject" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {subjects.slice(1).map(subject => (
                <Card key={subject} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{subject}</CardTitle>
                    <CardDescription>
                      {filteredArticles.filter(article => article.subjects.includes(subject)).length} articles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Articles
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}