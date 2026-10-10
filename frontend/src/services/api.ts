import type { 
  User, AuthResponse, Profile, Conversation, Message, StudentMemory, DocumentItem, 
  Quiz, QuizAttempt, StudyPlan, AnalyticsOverview,
  InterviewSession, InterviewReport, InterviewHistoryItem
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('edumate_token');
  if (token) {
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  }
  return { 'Content-Type': 'application/json' };
}

// --- Auth Services ---
export async function registerUser(full_name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name, email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(err.detail || 'Registration failed');
  }
  const data: AuthResponse = await res.json();
  localStorage.setItem('edumate_token', data.access_token);
  return data;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Login failed');
  }
  const data: AuthResponse = await res.json();
  localStorage.setItem('edumate_token', data.access_token);
  return data;
}

export async function logoutUser(): Promise<void> {
  localStorage.removeItem('edumate_token');
  await fetch(`${API_BASE}/auth/logout`, { method: 'POST' }).catch(() => {});
}

export async function fetchAuthMe(): Promise<User | null> {
  const token = localStorage.getItem('edumate_token');
  if (!token) return null;
  const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
  if (!res.ok) {
    localStorage.removeItem('edumate_token');
    return null;
  }
  return res.json();
}

export async function changeUserPassword(current_password: string, new_password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/users/me/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ current_password, new_password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to change password' }));
    throw new Error(err.detail || 'Failed to change password');
  }
}

// --- Profile & Existing Services ---
export async function fetchProfile(): Promise<Profile> {
  const res = await fetch(`${API_BASE}/profile`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function updateProfile(data: Partial<Profile>): Promise<Profile> {
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/conversations`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

export async function createConversation(title: string = 'New Study Session', mode: string = 'general'): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title, mode })
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function fetchConversationDetails(id: string): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/conversations/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch conversation details');
  return res.json();
}

export async function updateConversationTitle(id: string, title: string): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title })
  });
  if (!res.ok) throw new Error('Failed to update conversation');
  return res.json();
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to delete conversation');
}

export async function sendMessage(
  conversationId: string, 
  content: string, 
  mode: string = 'general', 
  language: string = 'en',
  documentId?: string,
  webSearch?: boolean
): Promise<{ user_message: Message; assistant_message: Message }> {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content, mode, language, document_id: documentId, web_search: webSearch })
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function fetchMemories(): Promise<StudentMemory[]> {
  const res = await fetch(`${API_BASE}/memories`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch memories');
  return res.json();
}

export async function addMemory(content: string, memory_type: string = 'preference'): Promise<StudentMemory> {
  const res = await fetch(`${API_BASE}/memories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content, memory_type })
  });
  if (!res.ok) throw new Error('Failed to add memory');
  return res.json();
}

export async function deleteMemory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/memories/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to delete memory');
}

export async function clearAllMemories(): Promise<void> {
  const res = await fetch(`${API_BASE}/memories`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to clear memories');
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('edumate_token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers,
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload document');
  return res.json();
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_BASE}/documents`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function generateQuiz(
  subject: string, 
  topic: string, 
  difficulty: string = 'medium', 
  numQuestions: number = 5,
  questionType: string = 'multiple-choice'
): Promise<Quiz> {
  const res = await fetch(`${API_BASE}/quizzes/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ subject, topic, difficulty, num_questions: numQuestions, question_type: questionType })
  });
  if (!res.ok) throw new Error('Failed to generate quiz');
  return res.json();
}

export async function submitQuiz(quizId: string, answers: Record<string, string>): Promise<QuizAttempt> {
  const res = await fetch(`${API_BASE}/quizzes/${quizId}/submit`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ answers })
  });
  if (!res.ok) throw new Error('Failed to submit quiz');
  return res.json();
}

export async function fetchQuizHistory(): Promise<QuizAttempt[]> {
  const res = await fetch(`${API_BASE}/quizzes/history`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch quiz history');
  return res.json();
}

export async function generateStudyPlan(
  goal: string, 
  subjects: string[], 
  examDate: string, 
  hoursPerDay: number = 2.0
): Promise<StudyPlan> {
  const res = await fetch(`${API_BASE}/study-plans/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ goal, subjects, exam_date: examDate, available_hours_per_day: hoursPerDay })
  });
  if (!res.ok) throw new Error('Failed to generate study plan');
  return res.json();
}

export async function fetchStudyPlans(): Promise<StudyPlan[]> {
  const res = await fetch(`${API_BASE}/study-plans`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch study plans');
  return res.json();
}

export async function updateStudyTaskStatus(taskId: string, status: string): Promise<void> {
  const res = await fetch(`${API_BASE}/study-tasks/${taskId}?status=${status}`, { 
    method: 'PATCH', 
    headers: getAuthHeaders() 
  });
  if (!res.ok) throw new Error('Failed to update task status');
}

export async function fetchAnalytics(): Promise<AnalyticsOverview> {
  const res = await fetch(`${API_BASE}/analytics/overview`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch analytics overview');
  return res.json();
}

// --- AI Interview Portal API Services ---
export async function createInterview(data: {
  candidate_name: string;
  candidate_email: string;
  job_role: string;
  interview_type: string;
  selected_skills: string[];
  difficulty: string;
  duration_minutes: number;
  num_questions?: number;
  language?: string;
}): Promise<InterviewSession> {
  const res = await fetch(`${API_BASE}/interviews/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create interview session');
  return res.json();
}

export async function submitInterviewAnswer(interviewId: string, questionId: string, answerText: string): Promise<void> {
  const res = await fetch(`${API_BASE}/interviews/${interviewId}/answer`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ question_id: questionId, answer_text: answerText })
  });
  if (!res.ok) throw new Error('Failed to submit interview answer');
}

export async function finishInterview(interviewId: string): Promise<InterviewReport> {
  const res = await fetch(`${API_BASE}/interviews/${interviewId}/finish`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to finish interview and evaluate results');
  return res.json();
}

export async function fetchInterviews(): Promise<InterviewHistoryItem[]> {
  const res = await fetch(`${API_BASE}/interviews`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch interview history');
  return res.json();
}

export async function fetchInterviewReport(interviewId: string): Promise<InterviewReport> {
  const res = await fetch(`${API_BASE}/interviews/${interviewId}/report`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch interview report');
  return res.json();
}

export async function retryInterviewEmail(interviewId: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/interviews/${interviewId}/retry-email`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to retry result email');
  return res.json();
}
