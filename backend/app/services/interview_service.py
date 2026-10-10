import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import Interview, InterviewQuestion, InterviewAnswer, InterviewResult, InterviewEmailLog, User
from app.services.ai_service import generate_structured_json, generate_ai_response
from app.services.email_service import EmailService

class InterviewService:

    @staticmethod
    async def create_interview(
        db: Session,
        user_id: str,
        candidate_name: str,
        candidate_email: str,
        job_role: str,
        interview_type: str = "Technical",
        selected_skills: List[str] = None,
        difficulty: str = "Intermediate",
        duration_minutes: int = 30,
        num_questions: int = 5,
        language: str = "en"
    ) -> Dict[str, Any]:
        if not selected_skills:
            selected_skills = ["General Knowledge"]
            
        skills_str = ", ".join(selected_skills)
        prompt = (
            f"Generate an interview question set for candidate '{candidate_name}' applying for job role '{job_role}'. "
            f"Interview Type: {interview_type}. Skills: {skills_str}. Difficulty: {difficulty}. "
            f"Number of questions: {num_questions}."
        )
        schema_desc = """
        {
          "questions": [
            {
              "id": 1,
              "question": "Question text here..."
            }
          ]
        }
        """
        
        ai_data = await generate_structured_json(prompt, schema_desc)
        questions_raw = []
        if ai_data and "questions" in ai_data and isinstance(ai_data["questions"], list):
            questions_raw = [q["question"] for q in ai_data["questions"]]
        else:
            # High quality fallback questions
            questions_raw = [
                f"Can you introduce yourself and explain your core experience relevant to the {job_role} role?",
                f"In the context of {skills_str}, how do you approach designing scalable and maintainable solutions?",
                f"Describe a complex technical challenge you encountered when working with {selected_skills[0] if selected_skills else 'software'} and how you resolved it.",
                f"What best practices do you follow to ensure code quality, testability, and error handling?",
                f"Where do you see the future of {job_role} heading, and how do you continuously upgrade your skills?"
            ]

        # Save to MySQL
        interview = Interview(
            user_id=user_id,
            candidate_name=candidate_name,
            candidate_email=candidate_email,
            job_role=job_role,
            interview_type=interview_type,
            selected_skills_json=json.dumps(selected_skills),
            difficulty=difficulty,
            duration_minutes=duration_minutes,
            language=language,
            status="in_progress",
            started_at=datetime.utcnow()
        )
        db.add(interview)
        db.commit()
        db.refresh(interview)

        question_objs = []
        for idx, q_text in enumerate(questions_raw):
            q_obj = InterviewQuestion(
                interview_id=interview.id,
                question_text=q_text,
                question_type=interview_type.lower(),
                question_order=idx + 1
            )
            db.add(q_obj)
            question_objs.append(q_obj)
            
        db.commit()

        return {
            "id": interview.id,
            "candidate_name": candidate_name,
            "candidate_email": candidate_email,
            "job_role": job_role,
            "interview_type": interview_type,
            "selected_skills": selected_skills,
            "difficulty": difficulty,
            "duration_minutes": duration_minutes,
            "status": "in_progress",
            "total_questions": len(question_objs),
            "questions": [{"id": q.id, "question_order": q.question_order, "question_text": q.question_text} for q in question_objs],
            "started_at": interview.started_at.isoformat()
        }

    @staticmethod
    def submit_answer(db: Session, interview_id: str, question_id: str, answer_text: str) -> Dict[str, Any]:
        ans = InterviewAnswer(
            interview_id=interview_id,
            question_id=question_id,
            answer_text=answer_text,
            submitted_at=datetime.utcnow()
        )
        db.add(ans)
        db.commit()
        db.refresh(ans)
        return {"id": ans.id, "question_id": question_id, "submitted_at": ans.submitted_at.isoformat()}

    @staticmethod
    async def finish_and_evaluate_interview(db: Session, interview_id: str) -> Dict[str, Any]:
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            raise ValueError("Interview session not found")
            
        questions = db.query(InterviewQuestion).filter(InterviewQuestion.interview_id == interview_id).order_by(InterviewQuestion.question_order).all()
        answers = db.query(InterviewAnswer).filter(InterviewAnswer.interview_id == interview_id).all()
        
        ans_map = {a.question_id: a.answer_text for a in answers}
        qa_pairs = []
        for q in questions:
            user_ans = ans_map.get(q.id, "No answer submitted.")
            qa_pairs.append(f"Question {q.question_order}: {q.question_text}\nCandidate Answer: {user_ans}")
            
        qa_summary = "\n\n".join(qa_pairs)
        
        prompt = (
            f"Evaluate this candidate's interview performance for the role of '{interview.job_role}'. "
            f"Interview Type: {interview.interview_type}. Difficulty: {interview.difficulty}.\n\n"
            f"--- CANDIDATE Q&A SESSION ---\n{qa_summary}\n--- END SESSION ---"
        )
        schema_desc = """
        {
          "overall_score": 85.0,
          "strengths": ["Strong domain knowledge", "Clear communication"],
          "improvement_areas": ["Needs deeper complexity analysis"],
          "recommended_topics": ["System Design", "Concurrency"],
          "preparation_plan": {"week_1": "Focus on data structures", "week_2": "Mock system design sessions"}
        }
        """
        
        ai_eval = await generate_structured_json(prompt, schema_desc)
        
        if not ai_eval or "overall_score" not in ai_eval:
            # Fallback evaluation score calculation
            answered_count = len(ans_map)
            total_q = max(1, len(questions))
            score = round((answered_count / total_q) * 80.0 + 10.0, 1)
            ai_eval = {
                "overall_score": score,
                "strengths": ["Demonstrated enthusiasm and practical orientation", "Structured answer presentation"],
                "improvement_areas": ["Provide more concrete real-world metrics", "Deepen algorithmic efficiency discussion"],
                "recommended_topics": [interview.job_role, "Core Architecture", "Problem Solving"],
                "preparation_plan": {"recommendation": "Review high-frequency interview questions and conduct 2 mock sessions."}
            }
            
        overall_score = float(ai_eval.get("overall_score", 75.0))
        
        # Save InterviewResult
        result = InterviewResult(
            interview_id=interview_id,
            overall_score=overall_score,
            strengths_json=json.dumps(ai_eval.get("strengths", [])),
            improvement_areas_json=json.dumps(ai_eval.get("improvement_areas", [])),
            detailed_feedback_json=json.dumps(ai_eval),
            recommended_topics_json=json.dumps(ai_eval.get("recommended_topics", [])),
            preparation_plan_json=json.dumps(ai_eval.get("preparation_plan", {}))
        )
        db.add(result)
        
        interview.status = "completed"
        interview.completed_at = datetime.utcnow()
        interview.overall_score = overall_score
        db.commit()

        # Trigger Email Delivery
        email_res = EmailService.send_interview_result_email(
            candidate_name=interview.candidate_name,
            candidate_email=interview.candidate_email,
            job_role=interview.job_role,
            interview_type=interview.interview_type,
            overall_score=overall_score,
            strengths=ai_eval.get("strengths", []),
            improvement_areas=ai_eval.get("improvement_areas", []),
            recommended_topics=ai_eval.get("recommended_topics", []),
            prep_plan=ai_eval.get("preparation_plan", {})
        )

        email_log = InterviewEmailLog(
            interview_id=interview_id,
            recipient_email=interview.candidate_email,
            delivery_status=email_res.get("status", "sent"),
            sent_at=datetime.utcnow() if email_res.get("status") == "sent" else None,
            error_summary=email_res.get("error")
        )
        db.add(email_log)
        db.commit()

        return {
            "interview_id": interview_id,
            "overall_score": overall_score,
            "strengths": ai_eval.get("strengths", []),
            "improvement_areas": ai_eval.get("improvement_areas", []),
            "recommended_topics": ai_eval.get("recommended_topics", []),
            "preparation_plan": ai_eval.get("preparation_plan", {}),
            "email_status": email_res.get("status", "sent"),
            "completed_at": interview.completed_at.isoformat()
        }

    @staticmethod
    def get_user_interviews(db: Session, user_id: str) -> List[Dict[str, Any]]:
        interviews = db.query(Interview).filter(Interview.user_id == user_id).order_by(Interview.created_at.desc()).all()
        res = []
        for itv in interviews:
            email_log = db.query(InterviewEmailLog).filter(InterviewEmailLog.interview_id == itv.id).order_by(InterviewEmailLog.last_attempt_at.desc()).first()
            res.append({
                "id": itv.id,
                "candidate_name": itv.candidate_name,
                "candidate_email": itv.candidate_email,
                "job_role": itv.job_role,
                "interview_type": itv.interview_type,
                "difficulty": itv.difficulty,
                "status": itv.status,
                "overall_score": itv.overall_score,
                "created_at": itv.created_at.isoformat(),
                "completed_at": itv.completed_at.isoformat() if itv.completed_at else None,
                "email_status": email_log.delivery_status if email_log else "not_sent"
            })
        return res

    @staticmethod
    def get_interview_report(db: Session, interview_id: str) -> Dict[str, Any]:
        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            raise ValueError("Interview not found")
            
        result = db.query(InterviewResult).filter(InterviewResult.interview_id == interview_id).first()
        questions = db.query(InterviewQuestion).filter(InterviewQuestion.interview_id == interview_id).all()
        answers = db.query(InterviewAnswer).filter(InterviewAnswer.interview_id == interview_id).all()
        email_log = db.query(InterviewEmailLog).filter(InterviewEmailLog.interview_id == interview_id).first()

        ans_map = {a.question_id: a.answer_text for a in answers}
        q_list = [{"id": q.id, "order": q.question_order, "question": q.question_text, "user_answer": ans_map.get(q.id, "No answer submitted")} for q in questions]

        return {
            "id": interview.id,
            "candidate_name": interview.candidate_name,
            "candidate_email": interview.candidate_email,
            "job_role": interview.job_role,
            "interview_type": interview.interview_type,
            "difficulty": interview.difficulty,
            "status": interview.status,
            "overall_score": interview.overall_score,
            "questions": q_list,
            "strengths": json.loads(result.strengths_json) if result else [],
            "improvement_areas": json.loads(result.improvement_areas_json) if result else [],
            "recommended_topics": json.loads(result.recommended_topics_json) if result else [],
            "preparation_plan": json.loads(result.preparation_plan_json) if result else {},
            "email_status": email_log.delivery_status if email_log else "not_sent"
        }
