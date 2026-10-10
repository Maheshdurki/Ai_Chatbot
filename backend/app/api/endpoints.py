import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Header
from sqlalchemy.orm import Session

from app.db.database import get_db_session
from app.db.models import User, Conversation, Message, StudentMemory, Document, DocumentChunk, Quiz, QuizAttempt, StudyPlan, StudyTask, Interview, InterviewEmailLog
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.schemas.schemas import (
    UserRegisterRequest, UserLoginRequest, UserAuthResponse, ChangePasswordRequest,
    ProfileUpdate, ProfileResponse,
    ChatMessageCreate, MessageResponse,
    ConversationCreate, ConversationResponse, ConversationUpdate,
    StudentMemoryCreate, StudentMemoryResponse,
    QuizGenerateRequest, QuizResponse, QuizSubmitRequest, QuizAttemptResponse,
    StudyPlanGenerateRequest, StudyPlanResponse, StudyTaskResponse,
    AnalyticsOverviewResponse,
    InterviewCreateRequest, InterviewAnswerSubmitRequest, InterviewResponse, InterviewReportResponse
)
from app.services.ai_service import generate_ai_response
from app.services.memory_service import MemoryService
from app.services.document_service import DocumentService
from app.services.quiz_service import QuizService
from app.services.study_service import StudyService
from app.services.analytics_service import AnalyticsService
from app.services.interview_service import InterviewService
from app.services.email_service import EmailService

router = APIRouter()

# --- Auth Helper Dependency ---
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db_session)) -> User:
    """Authenticates the user via JWT Header or returns default user."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user = db.query(User).filter(User.id == payload["sub"]).first()
            if user:
                return user
                
    # Fallback default active user
    user = db.query(User).filter(User.id == "default_user").first()
    if not user:
        user = User(
            id="default_user",
            full_name="Alex Learner",
            email="alex@edumate.ai",
            password_hash=hash_password("password123"),
            academic_level="Undergraduate",
            preferred_language="en"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

# --- Health Check ---
@router.get("/health")
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat(), "service": "EduMate AI Backend with MySQL 8 & Auth"}

# --- Authentication Endpoints ---
@router.post("/api/auth/register", response_model=UserAuthResponse)
def register(body: UserRegisterRequest, db: Session = Depends(get_db_session)):
    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")
        
    user = User(
        full_name=body.full_name,
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        academic_level="Undergraduate",
        preferred_language="en"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email})
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "academic_level": user.academic_level,
        "preferred_language": user.preferred_language,
        "access_token": token,
        "token_type": "bearer"
    }

@router.post("/api/auth/login", response_model=UserAuthResponse)
def login(body: UserLoginRequest, db: Session = Depends(get_db_session)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password credentials.")
        
    token = create_access_token({"sub": user.id, "email": user.email})
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "academic_level": user.academic_level,
        "preferred_language": user.preferred_language,
        "access_token": token,
        "token_type": "bearer"
    }

@router.post("/api/auth/logout")
def logout():
    return {"status": "logged_out", "message": "Session terminated successfully."}

@router.get("/api/auth/me")
def get_auth_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "academic_level": current_user.academic_level,
        "preferred_language": current_user.preferred_language,
        "learning_preferences": json.loads(current_user.learning_preferences_json or "{}")
    }

# --- Profile Endpoints ---
@router.get("/api/profile", response_model=ProfileResponse)
@router.get("/api/users/me", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "academic_level": current_user.academic_level,
        "preferred_language": current_user.preferred_language,
        "learning_preferences": json.loads(current_user.learning_preferences_json or "{}"),
        "created_at": current_user.created_at.isoformat()
    }

@router.patch("/api/profile", response_model=ProfileResponse)
@router.patch("/api/users/me", response_model=ProfileResponse)
def update_profile(body: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db_session)):
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.academic_level is not None:
        current_user.academic_level = body.academic_level
    if body.preferred_language is not None:
        current_user.preferred_language = body.preferred_language
        
    if body.learning_preferences is not None:
        current_prefs = json.loads(current_user.learning_preferences_json or "{}")
        current_prefs.update(body.learning_preferences)
        current_user.learning_preferences_json = json.dumps(current_prefs)
        
    db.commit()
    db.refresh(current_user)
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "academic_level": current_user.academic_level,
        "preferred_language": current_user.preferred_language,
        "learning_preferences": json.loads(current_user.learning_preferences_json or "{}"),
        "created_at": current_user.created_at.isoformat()
    }

@router.post("/api/users/me/change-password")
def change_password(body: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db_session)):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
        
    current_user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"status": "success", "message": "Password updated successfully."}

# --- Conversations & Chat ---
@router.get("/api/conversations", response_model=List[ConversationResponse])
def get_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db_session)):
    convs = db.query(Conversation).filter(Conversation.user_id == current_user.id, Conversation.archived_at.is_(None)).order_by(Conversation.updated_at.desc()).all()
    res = []
    for c in convs:
        last_msg = db.query(Message).filter(Message.conversation_id == c.id).order_by(Message.created_at.desc()).first()
        msg_count = db.query(Message).filter(Message.conversation_id == c.id).count()
        res.append({
            "id": c.id,
            "user_id": c.user_id,
            "title": c.title,
            "mode": c.mode,
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat(),
            "message_count": msg_count,
            "last_message": last_msg.content if last_msg else None
        })
    return res

@router.post("/api/conversations", response_model=ConversationResponse)
def create_conversation(body: ConversationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db_session)):
    conv = Conversation(
        user_id=current_user.id,
        title=body.title or "New Study Session",
        mode=body.mode or "general"
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return {
        "id": conv.id,
        "user_id": current_user.id,
        "title": conv.title,
        "mode": conv.mode,
        "created_at": conv.created_at.isoformat(),
        "updated_at": conv.updated_at.isoformat(),
        "message_count": 0,
        "last_message": None
    }

@router.get("/api/conversations/{conversation_id}")
def get_conversation_details(conversation_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db_session)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages_rows = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()
    messages = []
    for m in messages_rows:
        messages.append({
            "id": m.id,
            "conversation_id": m.conversation_id,
            "user_id": m.user_id,
            "role": m.role,
            "content": m.content,
            "metadata": json.loads(m.metadata_json or "{}"),
            "created_at": m.created_at.isoformat()
        })
        
    return {
        "id": conv.id,
        "user_id": conv.user_id,
        "title": conv.title,
        "mode": conv.mode,
        "created_at": conv.created_at.isoformat(),
        "updated_at": conv.updated_at.isoformat(),
        "messages": messages
    }

@router.patch("/api/conversations/{conversation_id}", response_model=ConversationResponse)
def update_conversation(conversation_id: str, body: ConversationUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db_session)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    if body.title is not None:
        conv.title = body.title
    if body.mode is not None:
        conv.mode = body.mode
    conv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(conv)
    return {
        "id": conv.id,
        "user_id": conv.user_id,
        "title": conv.title,
        "mode": conv.mode,
        "created_at": conv.created_at.isoformat(),
        "updated_at": conv.updated_at.isoformat()
    }

@router.delete("/api/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db_session)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return {"status": "deleted", "id": conversation_id}

@router.post("/api/conversations/{conversation_id}/messages")
async def send_message(conversation_id: str, body: ChatMessageCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db_session)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    user_msg = Message(
        conversation_id=conversation_id,
        user_id=current_user.id,
        role="user",
        content=body.content,
        metadata_json="{}"
    )
    db.add(user_msg)
    
    if conv.title in ["New Study Session", "New Chat"]:
        conv.title = body.content[:35] + ("..." if len(body.content) > 35 else "")
    conv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user_msg)

    # Memory auto extract
    MemoryService.auto_extract_memories_if_applicable(current_user.id, body.content, conversation_id)
    MemoryService.summarize_conversation_if_needed(conversation_id)
    
    history = MemoryService.get_recent_conversation_messages(conversation_id, limit=15)
    memories_raw = MemoryService.get_user_memories(current_user.id)
    memories = [m["content"] for m in memories_raw]
    
    doc_context = None
    if body.document_id:
        doc_context = DocumentService.get_document_context(body.document_id, body.content)

    profile_dict = {
        "academic_level": current_user.academic_level,
        "preferred_language": current_user.preferred_language,
        "learning_preferences": json.loads(current_user.learning_preferences_json or "{}")
    }

    assistant_reply = await generate_ai_response(
        messages=history,
        mode=body.mode or conv.mode,
        language=body.language or current_user.preferred_language,
        memories=memories,
        profile=profile_dict,
        document_context=doc_context
    )

    assist_msg = Message(
        conversation_id=conversation_id,
        user_id=current_user.id,
        role="assistant",
        content=assistant_reply,
        metadata_json=json.dumps({"mode": body.mode})
    )
    db.add(assist_msg)
    db.commit()
    db.refresh(assist_msg)

    return {
        "user_message": {
            "id": user_msg.id,
            "conversation_id": conversation_id,
            "role": "user",
            "content": user_msg.content,
            "created_at": user_msg.created_at.isoformat()
        },
        "assistant_message": {
            "id": assist_msg.id,
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": assist_msg.content,
            "created_at": assist_msg.created_at.isoformat()
        }
    }

# --- Student Memories ---
@router.get("/api/memories", response_model=List[StudentMemoryResponse])
def get_memories(current_user: User = Depends(get_current_user)):
    return MemoryService.get_user_memories(current_user.id)

@router.post("/api/memories", response_model=StudentMemoryResponse)
def add_memory(body: StudentMemoryCreate, current_user: User = Depends(get_current_user)):
    return MemoryService.add_user_memory(current_user.id, body.content, body.memory_type, body.source_conversation_id)

@router.delete("/api/memories/{memory_id}")
def delete_memory(memory_id: str, current_user: User = Depends(get_current_user)):
    success = MemoryService.delete_user_memory(memory_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"status": "deleted", "id": memory_id}

@router.delete("/api/memories")
def clear_all_memories(current_user: User = Depends(get_current_user)):
    count = MemoryService.clear_all_user_memories(current_user.id)
    return {"status": "cleared", "count": count}

# --- Document Library & Q&A ---
@router.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    contents = await file.read()
    doc = DocumentService.process_and_save_document(current_user.id, file.filename, contents)
    return doc

@router.get("/api/documents")
def get_documents(current_user: User = Depends(get_current_user)):
    return DocumentService.get_user_documents(current_user.id)

# --- Quizzes & Practice ---
@router.post("/api/quizzes/generate", response_model=QuizResponse)
async def generate_quiz(body: QuizGenerateRequest, current_user: User = Depends(get_current_user)):
    return await QuizService.generate_quiz(
        user_id=current_user.id,
        subject=body.subject,
        topic=body.topic,
        difficulty=body.difficulty,
        num_questions=body.num_questions,
        question_type=body.question_type
    )

@router.post("/api/quizzes/{quiz_id}/submit", response_model=QuizAttemptResponse)
def submit_quiz(quiz_id: str, body: QuizSubmitRequest, current_user: User = Depends(get_current_user)):
    try:
        return QuizService.evaluate_quiz_submission(quiz_id, current_user.id, body.answers)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/api/quizzes/history")
def get_quiz_history(current_user: User = Depends(get_current_user)):
    return QuizService.get_quiz_history(current_user.id)

# --- Study Planner ---
@router.post("/api/study-plans/generate", response_model=StudyPlanResponse)
def generate_study_plan(body: StudyPlanGenerateRequest, current_user: User = Depends(get_current_user)):
    return StudyService.generate_study_plan(
        user_id=current_user.id,
        goal=body.goal,
        subjects=body.subjects,
        exam_date=body.exam_date,
        available_hours_per_day=body.available_hours_per_day
    )

@router.get("/api/study-plans", response_model=List[StudyPlanResponse])
def get_study_plans(current_user: User = Depends(get_current_user)):
    return StudyService.get_user_study_plans(current_user.id)

@router.patch("/api/study-tasks/{task_id}", response_model=StudyTaskResponse)
def update_study_task(task_id: str, status: str):
    try:
        return StudyService.update_task_status(task_id, status)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# --- Learning Analytics ---
@router.get("/api/analytics/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(current_user: User = Depends(get_current_user)):
    return AnalyticsService.get_overview(current_user.id)

# --- AI Interview Portal Endpoints ---
@router.post("/api/interviews/create", response_model=InterviewResponse)
async def create_interview(body: InterviewCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db_session)):
    return await InterviewService.create_interview(
        db=db,
        user_id=current_user.id,
        candidate_name=body.candidate_name,
        candidate_email=body.candidate_email,
        job_role=body.job_role,
        interview_type=body.interview_type,
        selected_skills=body.selected_skills,
        difficulty=body.difficulty,
        duration_minutes=body.duration_minutes,
        num_questions=body.num_questions,
        language=body.language
    )

@router.post("/api/interviews/{interview_id}/answer")
def submit_interview_answer(interview_id: str, body: InterviewAnswerSubmitRequest, db: Session = Depends(get_db_session)):
    return InterviewService.submit_answer(db, interview_id, body.question_id, body.answer_text)

@router.post("/api/interviews/{interview_id}/finish")
async def finish_interview(interview_id: str, db: Session = Depends(get_db_session)):
    try:
        return await InterviewService.finish_and_evaluate_interview(db, interview_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/api/interviews")
def get_interviews(current_user: User = Depends(get_current_user), db: Session = Depends(get_db_session)):
    return InterviewService.get_user_interviews(db, current_user.id)

@router.get("/api/interviews/{interview_id}/report", response_model=InterviewReportResponse)
def get_interview_report(interview_id: str, db: Session = Depends(get_db_session)):
    try:
        return InterviewService.get_interview_report(db, interview_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/api/interviews/{interview_id}/retry-email")
def retry_interview_email(interview_id: str, db: Session = Depends(get_db_session)):
    report = InterviewService.get_interview_report(db, interview_id)
    email_res = EmailService.send_interview_result_email(
        candidate_name=report["candidate_name"],
        candidate_email=report["candidate_email"],
        job_role=report["job_role"],
        interview_type=report["interview_type"],
        overall_score=report["overall_score"] or 75.0,
        strengths=report["strengths"],
        improvement_areas=report["improvement_areas"],
        recommended_topics=report["recommended_topics"],
        prep_plan=report["preparation_plan"]
    )
    return {"status": email_res.get("status", "sent"), "interview_id": interview_id}
