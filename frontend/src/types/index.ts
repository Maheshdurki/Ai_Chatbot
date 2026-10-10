export interface User {
  id: string;
  full_name: string;
  email: string;
  academic_level: string;
  preferred_language: string;
  learning_preferences?: Record<string, any>;
  created_at?: string;
}

export interface AuthResponse {
  id: string;
  full_name: string;
  email: string;
  academic_level: string;
  preferred_language: string;
  access_token: string;
  token_type: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  academic_level: string;
  preferred_language: string;
  learning_preferences: Record<string, any>;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  mode: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message?: string;
  messages?: Message[];
}

export interface StudentMemory {
  id: string;
  user_id: string;
  memory_type: string;
  content: string;
  source_conversation_id?: string;
  confidence: number;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  summary: string;
  created_at: string;
  page_count?: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: string;
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizReviewItem {
  question_id: number;
  question: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  title?: string;
  subject?: string;
  topic?: string;
  score: number;
  total_questions: number;
  percentage: number;
  answers: Record<string, string>;
  completed_at: string;
  review?: QuizReviewItem[];
}

export interface StudyTask {
  id: string;
  study_plan_id: string;
  title: string;
  subject: string;
  scheduled_date: string;
  estimated_minutes: number;
  status: 'pending' | 'completed';
  completed_at?: string;
}

export interface StudyPlan {
  id: string;
  title: string;
  goal: string;
  start_date: string;
  end_date: string;
  tasks: StudyTask[];
  progress_percentage: number;
  created_at: string;
}

export interface AnalyticsOverview {
  total_conversations: number;
  total_messages: number;
  quizzes_completed: number;
  average_quiz_score: number;
  study_tasks_completed: number;
  study_tasks_total: number;
  topic_breakdown: { subject: string; attempts: number; mastery_percentage: number }[];
  weak_subjects: string[];
  recommendations: { title: string; description: string; action_type: string; subject: string }[];
  recent_activity: { activity_type: string; name: string; timestamp: string }[];
}

// --- AI Interview Portal Types ---
export interface InterviewQuestionItem {
  id: string;
  question_order: number;
  question_text: string;
}

export interface InterviewSession {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_role: string;
  interview_type: string;
  selected_skills: string[];
  difficulty: string;
  duration_minutes: number;
  status: string;
  total_questions: number;
  questions: InterviewQuestionItem[];
  started_at: string;
}

export interface InterviewReport {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_role: string;
  interview_type: string;
  difficulty: string;
  status: string;
  overall_score: number | null;
  questions: { id: string; order: number; question: string; user_answer: string }[];
  strengths: string[];
  improvement_areas: string[];
  recommended_topics: string[];
  preparation_plan: Record<string, any>;
  email_status: string;
}

export interface InterviewHistoryItem {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_role: string;
  interview_type: string;
  difficulty: string;
  status: string;
  overall_score: number | null;
  created_at: string;
  completed_at: string | null;
  email_status: string;
}

export type ActiveTab = 'chat' | 'documents' | 'quizzes' | 'study_planner' | 'analytics' | 'memory' | 'interviews' | 'profile_settings';
