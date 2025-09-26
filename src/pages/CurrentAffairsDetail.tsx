import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, BookOpen, Target, Calendar, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import currentAffairsData from "@/data/currentAffairsData.json";

export default function CurrentAffairsDetail() {
  const { id } = useParams();
  
  const article = currentAffairsData.find(item => item.id === id);
  
  if (!article) {
    return <Navigate to="/current-affairs" replace />;
  }

  const { details } = article;

  return (
    <>
      <Helmet>
        <title>{article.title} - Current Affairs - UPSC Preparation</title>
        <meta name="description" content={article.summary} />
        <meta name="keywords" content="UPSC, current affairs, prelims, mains, GS papers" />
      </Helmet>

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/current-affairs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Current Affairs
            </Button>
          </Link>
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
                <p className="text-muted-foreground">{details.background.summary}</p>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm"><strong>Location:</strong> {details.background.location}</span>
                  </div>
                  {details.background.related_conflict && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm"><strong>Related Event:</strong> {details.background.related_conflict}</span>
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
                        <li key={index} className="text-sm text-muted-foreground">• {objective}</li>
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
                        <li key={index} className="text-sm text-muted-foreground">• {outcome}</li>
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
                        <li key={index} className="text-sm text-muted-foreground">• {component}</li>
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
                          <li key={index} className="text-sm text-muted-foreground">• {milestone}</li>
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
                      <li key={index} className="text-sm text-muted-foreground">• {point}</li>
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
                      <li key={index} className="text-sm text-muted-foreground">• {challenge}</li>
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