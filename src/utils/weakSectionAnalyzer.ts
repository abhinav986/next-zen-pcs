import { supabase } from "@/integrations/supabase/client";

export interface WeakSectionAnalysis {
  topic: string;
  accuracy: number;
  questionsAttempted: number;
  averageTime: number;
  recommendation: string;
  totalCorrect: number;
  totalIncorrect: number;
}

export interface TestPerformanceData {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeTaken?: number;
  topic: string;
  difficulty: string;
}

/**
 * Analyzes user's test attempts to calculate weak sections
 */
export async function calculateWeakSections(
  userId: string, 
  subjectId?: string
): Promise<WeakSectionAnalysis[]> {
  try {
    // Fetch user's test attempts
    let query = supabase
      .from('test_attempts')
      .select(`
        id,
        answers,
        test_name,
        score,
        total_questions,
        time_taken,
        completed_at
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (subjectId) {
      // Filter by subject if provided (assuming test_name contains subject info)
      query = query.ilike('test_name', `%${subjectId}%`);
    }

    const { data: testAttempts, error } = await query;

    if (error) {
      console.error('Error fetching test attempts:', error);
      return [];
    }

    if (!testAttempts || testAttempts.length === 0) {
      return [];
    }

    // Fetch all test questions to compare answers
    const { data: allQuestions, error: questionsError } = await supabase
      .from('test_questions')
      .select('id, topic, correct_answer, difficulty, options');

    if (questionsError) {
      console.error('Error fetching questions:', error);
      return [];
    }

    // Analyze performance data
    const performanceByTopic = new Map<string, {
      correct: number;
      total: number;
      timeTaken: number[];
      difficulty: string[];
    }>();

    // Process each test attempt
    for (const attempt of testAttempts) {
      const answers = attempt.answers as Record<string, string>;
      const avgTimePerQuestion = attempt.time_taken ? attempt.time_taken / attempt.total_questions : 0;

      // Process each answer in the attempt
      for (const [questionId, userAnswer] of Object.entries(answers)) {
        const question = allQuestions?.find(q => q.id === questionId);
        if (!question || !question.topic) continue;

        const topic = question.topic;
        const isCorrect = userAnswer === question.correct_answer;

        if (!performanceByTopic.has(topic)) {
          performanceByTopic.set(topic, {
            correct: 0,
            total: 0,
            timeTaken: [],
            difficulty: []
          });
        }

        const topicData = performanceByTopic.get(topic)!;
        topicData.total++;
        if (isCorrect) topicData.correct++;
        topicData.timeTaken.push(avgTimePerQuestion);
        topicData.difficulty.push(question.difficulty || 'Medium');
      }
    }

    // Calculate weak sections (accuracy < 70%)
    const weakSections: WeakSectionAnalysis[] = [];

    for (const [topic, data] of performanceByTopic.entries()) {
      const accuracy = (data.correct / data.total) * 100;
      const avgTime = data.timeTaken.reduce((sum, time) => sum + time, 0) / data.timeTaken.length;

      // Consider a topic weak if accuracy is below 70%
      if (accuracy < 70) {
        weakSections.push({
          topic,
          accuracy: Math.round(accuracy),
          questionsAttempted: data.total,
          averageTime: Math.round(avgTime * 100) / 100,
          totalCorrect: data.correct,
          totalIncorrect: data.total - data.correct,
          recommendation: generateRecommendation(topic, accuracy, avgTime, data.difficulty)
        });
      }
    }

    // Sort by accuracy (lowest first)
    return weakSections.sort((a, b) => a.accuracy - b.accuracy);

  } catch (error) {
    console.error('Error calculating weak sections:', error);
    return [];
  }
}

/**
 * Generates personalized recommendations based on performance
 */
function generateRecommendation(
  topic: string, 
  accuracy: number, 
  avgTime: number,
  difficulties: string[]
): string {
  const hasHardQuestions = difficulties.includes('Hard');
  const hasMostlyEasy = difficulties.filter(d => d === 'Easy').length > difficulties.length / 2;

  if (accuracy < 40) {
    return `Critical area needing attention. Start with basic concepts in ${topic} and practice fundamentals daily.`;
  } else if (accuracy < 55) {
    return `Significant improvement needed. Focus on understanding core principles of ${topic} and solve more practice questions.`;
  } else if (accuracy < 70) {
    if (avgTime > 2.5) {
      return `Good understanding but slow response time. Practice more ${topic} questions to improve speed and accuracy.`;
    } else if (hasHardQuestions) {
      return `Struggling with advanced concepts. Review complex topics in ${topic} and practice case studies.`;
    } else {
      return `Close to target accuracy. Practice more ${topic} questions and review incorrect answers carefully.`;
    }
  }

  return `Focus on ${topic} practice questions and review missed concepts.`;
}

/**
 * Get topic-wise performance summary
 */
export async function getTopicPerformanceSummary(userId: string, subjectId?: string) {
  const weakSections = await calculateWeakSections(userId, subjectId);
  
  const totalTopicsAttempted = weakSections.length;
  const averageAccuracy = weakSections.length > 0 
    ? Math.round(weakSections.reduce((sum, section) => sum + section.accuracy, 0) / weakSections.length)
    : 0;
  
  const criticalTopics = weakSections.filter(section => section.accuracy < 50).length;
  const improvingTopics = weakSections.filter(section => section.accuracy >= 50 && section.accuracy < 70).length;

  return {
    totalTopicsAttempted,
    averageAccuracy,
    criticalTopics,
    improvingTopics,
    weakSections: weakSections.slice(0, 10) // Top 10 weak sections
  };
}