from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional

# --- Authentication Schemas ---
class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserAuthResponse(BaseModel):
    id: str
    full_name: str
    email: str
    academic_level: str
    preferred_language: str
    access_token: str
    token_type: str = "bearer"

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

# --- Profile Schemas ---
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    academic_level: Optional[str] = None
    preferred_language: Optional[str] = None
    learning_preferences: Optional[Dict[str, Any]] = None

class ProfileResponse(BaseModel):
    id: str
    full_name: str
    email: str
    academic_level: str
    preferred_language: str
    learning_preferences: Dict[str, Any]
    created_at: str

# --- Chat & Conversations Schemas ---
class ChatMessageCreate(BaseModel):
    content: str
    mode: Optional[str] = "general"
    language: Optional[str] = "en"
    document_id: Optional[str] = None
    web_search: Optional[bool] = False

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    user_id: str
    role: str
    content: str
    metadata: Dict[str, Any]
    created_at: str

class ConversationCreate(BaseModel):
    title: Optional[str] = "New Study Session"
    mode: Optional[str] = "general"

class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    mode: str
    created_at: str
    updated_at: str
    message_count: Optional[int] = 0
    last_message: Optional[str] = None

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    mode: Optional[str] = None

class StudentMemoryCreate(BaseModel):
    memory_type: str = "preference"
    content: str
    source_conversation_id: Optional[str] = None

class StudentMemoryResponse(BaseModel):
    id: str
    user_id: str
    memory_type: str
    content: str
    source_conversation_id: Optional[str]
    confidence: float
    created_at: str

class QuizGenerateRequest(BaseModel):
    subject: str
    topic: str
    difficulty: str = "medium"
    num_questions: int = 5
    question_type: str = "multiple-choice"

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str

class QuizResponse(BaseModel):
    id: str
    title: str
    subject: str
    topic: str
    difficulty: str
    questions: List[QuizQuestion]
    created_at: str

class QuizSubmitRequest(BaseModel):
    answers: Dict[str, str]

class QuizAttemptResponse(BaseModel):
    id: str
    quiz_id: str
    score: int
    total_questions: int
    percentage: float
    answers: Dict[str, str]
    completed_at: str
    review: List[Dict[str, Any]]

class StudyPlanGenerateRequest(BaseModel):
    goal: str
    subjects: List[str]
    exam_date: str
    available_hours_per_day: float = 2.0

class StudyTaskResponse(BaseModel):
    id: str
    study_plan_id: str
    title: str
    subject: str
    scheduled_date: str
    estimated_minutes: int
    status: str
    completed_at: Optional[str] = None

class StudyPlanResponse(BaseModel):
    id: str
    title: str
    goal: str
    start_date: str
    end_date: str
    tasks: List[StudyTaskResponse]
    progress_percentage: float
    created_at: str

class AnalyticsOverviewResponse(BaseModel):
    total_conversations: int
    total_messages: int
    quizzes_completed: int
    average_quiz_score: float
    study_tasks_completed: int
    study_tasks_total: int
    topic_breakdown: List[Dict[str, Any]]
    weak_subjects: List[str]
    recommendations: List[Dict[str, str]]
    recent_activity: List[Dict[str, Any]]

# --- AI Interview Portal Schemas ---
class InterviewCreateRequest(BaseModel):
    candidate_name: str
    candidate_email: EmailStr
    job_role: str
    interview_type: str = "Technical"
    selected_skills: List[str] = []
    difficulty: str = "Intermediate"
    duration_minutes: int = 30
    num_questions: int = 5
    language: str = "en"

class InterviewAnswerSubmitRequest(BaseModel):
    question_id: str
    answer_text: str

class InterviewResponse(BaseModel):
    id: str
    candidate_name: str
    candidate_email: str
    job_role: str
    interview_type: str
    selected_skills: List[str]
    difficulty: str
    duration_minutes: int
    status: str
    total_questions: int
    questions: List[Dict[str, Any]]
    started_at: str

class InterviewReportResponse(BaseModel):
    id: str
    candidate_name: str
    candidate_email: str
    job_role: str
    interview_type: str
    difficulty: str
    status: str
    overall_score: Optional[float]
    questions: List[Dict[str, Any]]
    strengths: List[str]
    improvement_areas: List[str]
    recommended_topics: List[str]
    preparation_plan: Dict[str, Any]
    email_status: str
