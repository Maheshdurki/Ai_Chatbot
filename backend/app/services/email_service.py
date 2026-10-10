import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Dict, Any, Optional
from app.config import (
    SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, 
    SMTP_SENDER_EMAIL, SMTP_SENDER_NAME
)

class EmailService:

    @staticmethod
    def send_interview_result_email(
        candidate_name: str,
        candidate_email: str,
        job_role: str,
        interview_type: str,
        overall_score: float,
        strengths: list,
        improvement_areas: list,
        recommended_topics: list,
        prep_plan: dict
    ) -> Dict[str, Any]:
        """Sends a formatted HTML result email to the candidate."""
        
        subject = f"Your AI Interview Results: {job_role} — EduMate AI"
        
        strengths_html = "".join([f"<li>{s}</li>" for s in strengths]) if strengths else "<li>Solid fundamental understanding.</li>"
        improvements_html = "".join([f"<li>{i}</li>" for i in improvement_areas]) if improvement_areas else "<li>Keep practicing advanced scenarios.</li>"
        topics_html = "".join([f"<li>{t}</li>" for t in recommended_topics]) if recommended_topics else "<li>Review core algorithms and system architecture.</li>"

        score_color = "#10b981" if overall_score >= 70 else "#f59e0b" if overall_score >= 50 else "#ef4444"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }}
            .card {{ background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 24px; max-width: 600px; margin: 0 auto; }}
            .header {{ text-align: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px; }}
            .brand {{ color: #8b5cf6; font-size: 24px; font-weight: bold; }}
            .score-badge {{ font-size: 36px; font-weight: 800; color: {score_color}; text-align: center; margin: 16px 0; }}
            .section-title {{ color: #cbd5e1; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 20px; }}
            ul {{ padding-left: 20px; color: #94a3b8; font-size: 14px; line-height: 1.6; }}
            .footer {{ text-align: center; font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #334155; padding-top: 12px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="brand">EduMate AI</div>
              <h2 style="color: #f1f5f9; margin: 8px 0 0 0;">AI Interview Performance Report</h2>
            </div>
            
            <p>Dear <strong>{candidate_name}</strong>,</p>
            <p>Thank you for completing your mock interview for the position of <strong>{job_role}</strong> ({interview_type} Interview).</p>
            
            <div className="score-container" style="text-align: center; background: #0f172a; padding: 16px; border-radius: 12px;">
              <div style="font-size: 12px; color: #94a3b8;">OVERALL INTERVIEW SCORE</div>
              <div class="score-badge">{overall_score}%</div>
            </div>

            <div class="section-title">Key Strengths</div>
            <ul>{strengths_html}</ul>

            <div class="section-title">Areas for Improvement</div>
            <ul>{improvements_html}</ul>

            <div class="section-title">Recommended Topics to Study</div>
            <ul>{topics_html}</ul>

            <div class="footer">
              Sent automatically by EduMate AI Platform • <a href="http://localhost:5173" style="color: #8b5cf6;">View full interactive report</a>
            </div>
          </div>
        </body>
        </html>
        """

        # SMTP Sending Logic
        host = SMTP_HOST or os.getenv("SMTP_HOST", "")
        port = int(SMTP_PORT or os.getenv("SMTP_PORT", "587"))
        username = SMTP_USERNAME or os.getenv("SMTP_USERNAME", "")
        password = SMTP_PASSWORD or os.getenv("SMTP_PASSWORD", "")
        sender = SMTP_SENDER_EMAIL or os.getenv("SMTP_SENDER_EMAIL", "noreply@edumate.ai")

        if host and username and password:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{SMTP_SENDER_NAME} <{sender}>"
                msg["To"] = candidate_email
                msg.attach(MIMEText(html_body, "html"))

                with smtplib.SMTP(host, port, timeout=15) as server:
                    server.starttls()
                    server.login(username, password)
                    server.sendmail(sender, [candidate_email], msg.as_string())
                    
                return {"status": "sent", "timestamp": datetime.utcnow().isoformat()}
            except Exception as e:
                print(f"[Email Error] SMTP Delivery failed: {e}")
                return {"status": "failed", "error": str(e)}
        else:
            print(f"[Email Service] SMTP not configured. Result email generated for {candidate_email} (Simulated Success).")
            return {"status": "sent", "simulated": True, "timestamp": datetime.utcnow().isoformat()}
