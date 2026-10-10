import { useState, useEffect } from 'react';
import { 
  Briefcase, Sparkles, Trophy, CheckCircle2, AlertCircle, Mail, 
  Send, FileText, Plus, Tag 
} from 'lucide-react';
import type { InterviewSession, InterviewReport, InterviewHistoryItem } from '../types';
import { 
  createInterview, submitInterviewAnswer, finishInterview, 
  fetchInterviews, fetchInterviewReport, retryInterviewEmail 
} from '../services/api';

interface InterviewWorkspaceProps {
  onInterviewCompleted?: () => void;
}

const JOB_ROLES = [
  "Python Developer", "Full-Stack Developer", "Frontend Developer", 
  "Backend Developer", "Java Developer", "Data Analyst", "AI Engineer", "Software Engineer"
];

const SKILL_OPTIONS = [
  "Python", "JavaScript", "React", "Django", "FastAPI", "SQL & MySQL", 
  "Data Structures & Algorithms", "OOP", "Operating Systems", "Computer Networks", "DBMS", "System Design"
];

export const InterviewWorkspace: React.FC<InterviewWorkspaceProps> = ({ onInterviewCompleted }) => {
  const [view, setView] = useState<'dashboard' | 'config' | 'session' | 'report'>('dashboard');
  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);
  
  // Configuration Form State
  const [candidateName, setCandidateName] = useState('Alex Learner');
  const [candidateEmail, setCandidateEmail] = useState('alex@edumate.ai');
  const [jobRole, setJobRole] = useState('Python Developer');
  const [interviewType, setInterviewType] = useState('Technical');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Python", "SQL & MySQL", "Data Structures & Algorithms"]);
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [customSkillInput, setCustomSkillInput] = useState('');

  // Active Session State
  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answerInput, setAnswerInput] = useState('');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(30 * 60);

  // Evaluation & Loading State
  const [activeReport, setActiveReport] = useState<InterviewReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailRetrying, setEmailRetrying] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await fetchInterviews();
      setHistory(data);
    } catch (e) {
      console.error("Failed to load interview history:", e);
    }
  };

  // Timer countdown hook for active session
  useEffect(() => {
    if (view !== 'session' || timeLeftSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [view, timeLeftSeconds]);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(prev => prev.filter(s => s !== skill));
    } else {
      setSelectedSkills(prev => [...prev, skill]);
    }
  };

  const handleAddCustomSkill = () => {
    if (customSkillInput.trim() && !selectedSkills.includes(customSkillInput.trim())) {
      setSelectedSkills(prev => [...prev, customSkillInput.trim()]);
      setCustomSkillInput('');
    }
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !candidateEmail.trim() || !jobRole.trim()) {
      alert("Please fill in candidate name, email, and job role.");
      return;
    }

    try {
      setIsProcessing(true);
      const session = await createInterview({
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        job_role: jobRole,
        interview_type: interviewType,
        selected_skills: selectedSkills,
        difficulty,
        duration_minutes: durationMinutes,
        num_questions: 5
      });
      setActiveSession(session);
      setCurrentQIdx(0);
      setAnswerInput('');
      setTimeLeftSeconds(durationMinutes * 60);
      setView('session');
    } catch (e) {
      alert("Failed to initialize interview session.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextOrFinishQuestion = async () => {
    if (!activeSession) return;
    const currentQ = activeSession.questions[currentQIdx];
    if (currentQ && answerInput.trim()) {
      try {
        await submitInterviewAnswer(activeSession.id, currentQ.id, answerInput.trim());
      } catch (e) {
        console.error("Answer submission warning:", e);
      }
    }

    setAnswerInput('');

    if (currentQIdx < activeSession.questions.length - 1) {
      setCurrentQIdx(prev => prev + 1);
    } else {
      // Final question submitted - trigger finish and evaluation
      handleFinishInterview();
    }
  };

  const handleFinishInterview = async () => {
    if (!activeSession) return;
    try {
      setIsProcessing(true);
      const report = await finishInterview(activeSession.id);
      setActiveReport(report);
      setView('report');
      loadHistory();
      if (onInterviewCompleted) onInterviewCompleted();
    } catch (e) {
      alert("Failed to process interview evaluation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewReport = async (interviewId: string) => {
    try {
      setIsProcessing(true);
      const report = await fetchInterviewReport(interviewId);
      setActiveReport(report);
      setView('report');
    } catch (e) {
      alert("Failed to load interview report.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryEmail = async (interviewId: string) => {
    try {
      setEmailRetrying(true);
      const res = await retryInterviewEmail(interviewId);
      alert(`Result email delivery status: ${res.status.toUpperCase()}`);
      loadHistory();
      if (activeReport && activeReport.id === interviewId) {
        setActiveReport(prev => prev ? { ...prev, email_status: res.status } : null);
      }
    } catch (e) {
      alert("Failed to retry email delivery.");
    } finally {
      setEmailRetrying(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-900 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-violet-400" />
            AI Mock Interview Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Practice role-specific mock interviews with real-time evaluation, scoring out of 100, and automated HTML email delivery.
          </p>
        </div>

        {view !== 'dashboard' && (
          <button
            onClick={() => setView('dashboard')}
            className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            ← Back to Dashboard
          </button>
        )}
      </div>

      {/* VIEW 1: DASHBOARD */}
      {view === 'dashboard' && (
        <div className="space-y-6">
          {/* Hero Action Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-900/60 via-indigo-900/40 to-slate-900 border border-violet-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" /> AI Candidate Evaluation Engine
              </div>
              <h3 className="text-xl font-bold text-slate-100">Ready for your next Technical Interview?</h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Configure your job role, skill set, and difficulty. Get evaluated by AI on technical correctness, problem-solving, and communication.
              </p>
            </div>

            <button
              onClick={() => setView('config')}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-violet-600/30 transition-all shrink-0 active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Interview</span>
            </button>
          </div>

          {/* History Table */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" />
              Previous Interview Reports ({history.length})
            </h3>

            {history.length === 0 ? (
              <div className="text-xs text-slate-500 p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800">
                No past interview attempts. Click "Start New Interview" to begin!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Role & Type</th>
                      <th className="p-3">Difficulty</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Email Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-semibold text-slate-200">
                          {h.candidate_name}
                          <div className="text-[10px] text-slate-500">{h.candidate_email}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-violet-300">{h.job_role}</span>
                          <div className="text-[10px] text-slate-400">{h.interview_type}</div>
                        </td>
                        <td className="p-3 capitalize">{h.difficulty}</td>
                        <td className="p-3">
                          {h.overall_score !== null ? (
                            <span className={`font-bold ${h.overall_score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {h.overall_score}%
                            </span>
                          ) : (
                            <span className="text-slate-500">In Progress</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            h.email_status === 'sent' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                          }`}>
                            {h.email_status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleViewReport(h.id)}
                            className="py-1 px-2.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-[11px] font-medium"
                          >
                            Report
                          </button>
                          <button
                            onClick={() => handleRetryEmail(h.id)}
                            disabled={emailRetrying}
                            className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                            title="Resend evaluation report email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: CONFIGURATION SCREEN */}
      {view === 'config' && (
        <form onSubmit={handleStartInterview} className="max-w-3xl mx-auto p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6 shadow-xl">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Interview Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Candidate Full Name *</label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Candidate Email (for Result Report) *</label>
              <input
                type="email"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Job Role *</label>
              <select
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
              >
                {JOB_ROLES.map((role, idx) => (
                  <option key={idx} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Interview Type *</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value="Technical">Technical Interview</option>
                <option value="HR">HR & Behavioral Interview</option>
                <option value="Coding">Coding & Algorithm Interview</option>
                <option value="System Design">System Design Interview</option>
                <option value="AI/ML">AI & Machine Learning Interview</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Interview Duration</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
          </div>

          {/* Technical Skills Tag Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Technical Skills / Focus Topics</label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill, idx) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1 border ${
                      isSelected
                        ? 'bg-violet-600 text-white border-violet-500 font-semibold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                placeholder="Add custom topic (e.g. Microservices)..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Add Topic
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-violet-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isProcessing ? 'Generating Questions...' : 'Begin AI Interview Session'}</span>
          </button>
        </form>
      )}

      {/* VIEW 3: ACTIVE SESSION */}
      {view === 'session' && activeSession && (
        <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100">{activeSession.job_role} Interview</h3>
              <p className="text-xs text-slate-400">Candidate: {activeSession.candidate_name}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-rose-400 font-mono font-bold bg-rose-950/60 border border-rose-500/30 px-3 py-1 rounded-full">
                ⏱ {formatTimer(timeLeftSeconds)}
              </div>
              <div className="text-xs text-violet-300 font-bold bg-violet-950/60 border border-violet-500/30 px-3 py-1 rounded-full">
                Q {currentQIdx + 1} / {activeSession.total_questions}
              </div>
            </div>
          </div>

          {/* Question Text */}
          {(() => {
            const q = activeSession.questions[currentQIdx];
            if (!q) return null;

            return (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Question {q.question_order}</span>
                  <h4 className="text-sm font-semibold text-slate-100 leading-relaxed">
                    {q.question_text}
                  </h4>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">Your Response:</label>
                  <textarea
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Type your response or use voice input..."
                    rows={6}
                    className="w-full p-3 text-xs bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 focus:outline-none focus:border-violet-500 leading-relaxed resize-none"
                  />
                </div>
              </div>
            );
          })()}

          {/* Submit & Next Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                if (confirm("End interview early and generate evaluation?")) handleFinishInterview();
              }}
              className="py-1.5 px-4 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-medium"
            >
              End Interview Early
            </button>

            <button
              onClick={handleNextOrFinishQuestion}
              disabled={isProcessing}
              className="py-2.5 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/20 transition-all flex items-center gap-2"
            >
              <span>{currentQIdx === activeSession.questions.length - 1 ? 'Finish & Submit Report' : 'Next Question →'}</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 4: EVALUATION REPORT */}
      {view === 'report' && activeReport && (
        <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6 shadow-2xl">
          <div className="text-center space-y-2 border-b border-slate-800 pb-4">
            <div className="w-16 h-16 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center mx-auto text-violet-400">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-100">AI Evaluation Report</h3>
            <p className="text-xs text-slate-400">{activeReport.candidate_name} • {activeReport.job_role}</p>

            <div className="inline-block p-4 rounded-2xl bg-slate-900 border border-slate-800 mt-2">
              <div className={`text-4xl font-extrabold ${
                (activeReport.overall_score || 0) >= 70 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {activeReport.overall_score}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Overall Interview Performance Score</div>
            </div>
          </div>

          {/* Email Status Notification Banner */}
          <div className="p-3 rounded-2xl bg-violet-950/40 border border-violet-500/30 flex items-center justify-between text-xs text-violet-300">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-violet-400" />
              <span>Result Email Status: <strong>{activeReport.email_status.toUpperCase()}</strong> ({activeReport.candidate_email})</span>
            </div>
            <button
              onClick={() => handleRetryEmail(activeReport.id)}
              disabled={emailRetrying}
              className="py-1 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-medium"
            >
              Resend Email
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Key Strengths
              </h4>
              <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                {activeReport.strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Areas for Improvement
              </h4>
              <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                {activeReport.improvement_areas.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Question & Candidate Answer Breakdown</h4>
            {activeReport.questions.map((q, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="font-semibold text-slate-200">Q{q.order}: {q.question}</div>
                <div className="p-2.5 rounded-xl bg-slate-950 text-slate-300 border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-semibold block">Candidate Answer:</span>
                  {q.user_answer}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setView('dashboard')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
          >
            Back to Interview Portal
          </button>
        </div>
      )}
    </div>
  );
};
