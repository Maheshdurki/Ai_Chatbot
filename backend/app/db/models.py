import uuid
import json
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, ForeignKey, DateTime, Index
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"

class User(Base):
    __tablename__ = "users"

    id = Column(String(255), primary_key=True, default=lambda: generate_id("usr"))
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    academic_level = Column(String(100), default="Undergraduate")
    preferred_language = Column(String(50), default="en")
    learning_preferences_json = Column(Text, default="{}")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    memories = relationship("StudentMemory", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(255), primary_key=True, default=lambda: generate_id("conv"))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    mode = Column(String(100), default="general")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    archived_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    summaries = relationship("ConversationSummary", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(255), primary_key=True, default=lambda: generate_id("msg"))
    conversation_id = Column(String(255), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

class ConversationSummary(Base):
    __tablename__ = "conversation_summaries"

    id = Column(String(255), primary_key=True, default=lambda: generate_id("sum"))
    conversation_id = Column(String(255), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    summary = Column(Text, nullable=False)
    covered_message_range = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="summaries")

class StudentMemory(Base):
    __tablename__ = "student_memories"

    id = Column(String(255), primary_key=True, default=lambda: generate_id("mem"))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    memory_type = Column(String(100), default="preference")
    content = Column(Text, nullable=False)
    source_conversation_id = Column(String(255), nullable=True)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="memories")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(255), primary_key=True, default=lambda: generate_id("doc"))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(500), nullable=False)
    file_type = Column(String(100), default="pdf")
    storage_path = Column(String(1000), default="")
    processing_status = Column(String(100), default="completed")
    summary = Column(Text, default="")
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(255), primary_key=True, default=lambda: generate_id("chk"))
    document_id = Column(String(255), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_text = Column(Text, nullable=False)
    page_number = Column(Integer, default=1)
    chunk_index = Column(Integer, default=0)
    metadata_json = Column(Text, default="{}")

    document = relationship("Document", back_populates="chunks")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String(255), primary_key=True, default=lambda: generate_id("quiz"))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    subject = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=False)
    difficulty = Column(String(100), default="medium")
    question_data_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="quizzes")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String(255), primary_key=True, default=lambda: generate_id("att"))
    quiz_id = Column(String(255), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(255), nullable=False)
    answers_json = Column(Text, nullable=False)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)

    quiz = relationship("Quiz", back_populates="attempts")

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(String(255), primary_key=True, default=lambda: generate_id("plan"))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    goal = Column(Text, default="")
    start_date = Column(String(100), nullable=False)
    end_date = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="study_plans")
    tasks = relationship("StudyTask", back_populates="study_plan", cascade="all, delete-orphan")

class StudyTask(Base):
    __tablename__ = "study_tasks"

    id = Column(String(255), primary_key=True, default=lambda: generate_id("task"))
    study_plan_id = Column(String(255), ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    subject = Column(String(255), nullable=False)
    scheduled_date = Column(String(100), nullable=False)
    estimated_minutes = Column(Integer, default=30)
    status = Column(String(50), default="pending")
    completed_at = Column(DateTime, nullable=True)

    study_plan = relationship("StudyPlan", back_populates="tasks")

# --- AI Interview Portal Entities ---

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String(255), primary_key=True, default=lambda: generate_id("itv"))
    user_id = Column(String(255), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    candidate_name = Column(String(255), nullable=False)
    candidate_email = Column(String(255), nullable=False, index=True)
    job_role = Column(String(255), nullable=False)
    interview_type = Column(String(100), default="Technical")
    selected_skills_json = Column(Text, default="[]")
    difficulty = Column(String(50), default="Intermediate")
    duration_minutes = Column(Integer, default=30)
    language = Column(String(50), default="en")
    status = Column(String(50), default="in_progress")  # in_progress, completed, expired
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    overall_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="interviews")
    questions = relationship("InterviewQuestion", back_populates="interview", cascade="all, delete-orphan")
    answers = relationship("InterviewAnswer", back_populates="interview", cascade="all, delete-orphan")
    result = relationship("InterviewResult", back_populates="interview", uselist=False, cascade="all, delete-orphan")
    email_logs = relationship("InterviewEmailLog", back_populates="interview", cascade="all, delete-orphan")

class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(String(255), primary_key=True, default=lambda: generate_id("iq"))
    interview_id = Column(String(255), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(100), default="technical")
    question_order = Column(Integer, default=1)

    interview = relationship("Interview", back_populates="questions")

class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id = Column(String(255), primary_key=True, default=lambda: generate_id("ia"))
    interview_id = Column(String(255), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(255), ForeignKey("interview_questions.id", ondelete="CASCADE"), nullable=False)
    answer_text = Column(Text, nullable=False)
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("Interview", back_populates="answers")

class InterviewResult(Base):
    __tablename__ = "interview_results"

    id = Column(String(255), primary_key=True, default=lambda: generate_id("ires"))
    interview_id = Column(String(255), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, unique=True)
    overall_score = Column(Float, nullable=False)
    strengths_json = Column(Text, default="[]")
    improvement_areas_json = Column(Text, default="[]")
    detailed_feedback_json = Column(Text, default="[]")
    recommended_topics_json = Column(Text, default="[]")
    preparation_plan_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("Interview", back_populates="result")

class InterviewEmailLog(Base):
    __tablename__ = "interview_email_logs"

    id = Column(String(255), primary_key=True, default=lambda: generate_id("elog"))
    interview_id = Column(String(255), ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    recipient_email = Column(String(255), nullable=False)
    delivery_status = Column(String(50), default="pending")  # pending, sent, failed
    attempt_count = Column(Integer, default=1)
    last_attempt_at = Column(DateTime, default=datetime.utcnow)
    error_summary = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)

    interview = relationship("Interview", back_populates="email_logs")
