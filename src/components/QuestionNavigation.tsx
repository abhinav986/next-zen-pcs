import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

interface QuestionNavigationProps {
  totalQuestions: number;
  currentQuestion: number;
  answeredQuestions: Set<number>;
  onQuestionSelect: (questionIndex: number) => void;
  className?: string;
}

export const QuestionNavigation = ({
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  onQuestionSelect,
  className = ""
}: QuestionNavigationProps) => {
  const getQuestionStatus = (index: number) => {
    if (answeredQuestions.has(index)) {
      return "answered";
    }
    if (index < currentQuestion) {
      return "skipped";
    }
    return "not-attempted";
  };

  const getStatusIcon = (index: number) => {
    const status = getQuestionStatus(index);
    switch (status) {
      case "answered":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "skipped":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (index: number) => {
    const status = getQuestionStatus(index);
    if (index === currentQuestion) {
      return "bg-primary text-primary-foreground";
    }
    
    switch (status) {
      case "answered":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "skipped":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      default:
        return "bg-muted text-muted-foreground hover:bg-muted/80";
    }
  };

  const answeredCount = answeredQuestions.size;
  const skippedCount = currentQuestion - answeredCount;
  const notAttemptedCount = totalQuestions - currentQuestion - 1;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Question Navigator</CardTitle>
        
        {/* Summary */}
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Answered: {answeredCount}
          </Badge>
          <Badge variant="outline" className="text-amber-600 border-amber-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Skipped: {skippedCount}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground border-muted">
            <Circle className="h-3 w-3 mr-1" />
            Not Attempted: {notAttemptedCount}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 sm:gap-2">
          {Array.from({ length: totalQuestions }, (_, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className={`h-8 w-8 sm:h-10 sm:w-10 p-0 text-xs ${getStatusColor(index)}`}
              onClick={() => onQuestionSelect(index)}
            >
              <span className="sr-only">
                Question {index + 1} - {getQuestionStatus(index)}
              </span>
              <div className="flex flex-col items-center justify-center">
                <span className="text-xs font-medium leading-none">{index + 1}</span>
                <div className="mt-0.5 hidden sm:block">
                  {getStatusIcon(index)}
                </div>
              </div>
            </Button>
          ))}
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p className="hidden sm:block">Click on any question number to navigate directly to that question.</p>
          <p className="sm:hidden">Tap question numbers to navigate.</p>
        </div>
      </CardContent>
    </Card>
  );
};