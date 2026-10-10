import { useState, useEffect } from 'react';
import type { 
  User, Profile, Conversation, Message, StudentMemory, 
  DocumentItem, QuizAttempt, StudyPlan, AnalyticsOverview, ActiveTab 
} from './types';
import { 
  fetchAuthMe, logoutUser, fetchProfile, fetchConversations, createConversation, 
  fetchConversationDetails, updateConversationTitle, deleteConversation, 
  sendMessage, fetchMemories, fetchDocuments, fetchQuizHistory, 
  fetchStudyPlans, fetchAnalytics 
} from './services/api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatWorkspace } from './components/ChatWorkspace';
import { DocumentWorkspace } from './components/DocumentWorkspace';
import { QuizWorkspace } from './components/QuizWorkspace';
import { StudyPlannerWorkspace } from './components/StudyPlannerWorkspace';
import { AnalyticsWorkspace } from './components/AnalyticsWorkspace';
import { MemoryWorkspace } from './components/MemoryWorkspace';
import { InterviewWorkspace } from './components/InterviewWorkspace';
import { ProfileSettingsView } from './components/ProfileSettingsView';
import { AuthModal } from './components/AuthModal';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversationDetails, setActiveConversationDetails] = useState<Conversation | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [mode, setMode] = useState<string>('general');
  const [language, setLanguage] = useState<string>('en');
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [memories, setMemories] = useState<StudentMemory[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDocument, setActiveDocument] = useState<DocumentItem | null>(null);

  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState<boolean>(false);

  // Initial data loading & Auth restoration
  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const currentUser = await fetchAuthMe();
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.preferred_language) setLanguage(currentUser.preferred_language);
      }
    } catch (e) {
      console.error("Auth check notice:", e);
    }
    loadData();
  };

  const loadData = async () => {
    try {
      const [profData, convsData, memsData, docsData, qHist, plansData, analyticsData] = await Promise.all([
        fetchProfile().catch(() => null),
        fetchConversations().catch(() => []),
        fetchMemories().catch(() => []),
        fetchDocuments().catch(() => []),
        fetchQuizHistory().catch(() => []),
        fetchStudyPlans().catch(() => []),
        fetchAnalytics().catch(() => null)
      ]);

      if (profData) {
        setProfile(profData);
        if (profData.preferred_language) setLanguage(profData.preferred_language);
      }
      setMemories(memsData);
      setDocuments(docsData);
      setQuizHistory(qHist);
      setStudyPlans(plansData);
      setAnalytics(analyticsData);

      if (convsData.length > 0) {
        setConversations(convsData);
        selectConversation(convsData[0].id);
      } else {
        handleNewChat();
      }
    } catch (e) {
      console.error("Error loading workspace data:", e);
    }
  };

  const selectConversation = async (id: string) => {
    setActiveConversationId(id);
    try {
      const details = await fetchConversationDetails(id);
      setActiveConversationDetails(details);
      if (details.mode) setMode(details.mode);
    } catch (e) {
      console.error("Error fetching conversation details:", e);
    }
  };

  const handleNewChat = async () => {
    try {
      const newConv = await createConversation("New Study Session", mode);
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setActiveConversationDetails({ ...newConv, messages: [] });
      setActiveTab('chat');
    } catch (e) {
      console.error("Error creating conversation:", e);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const updated = await updateConversationTitle(id, newTitle);
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: updated.title } : c));
      if (activeConversationDetails?.id === id) {
        setActiveConversationDetails(prev => prev ? { ...prev, title: updated.title } : null);
      }
    } catch (e) {
      console.error("Error renaming conversation:", e);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter(c => c.id !== id);
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (e) {
      console.error("Error deleting conversation:", e);
    }
  };

  const handleSendMessage = async (content: string, options?: { documentId?: string; webSearch?: boolean }) => {
    if (!activeConversationId) return;

    try {
      setIsLoadingMessage(true);

      const tempUserMsg: Message = {
        id: `temp_${Date.now()}`,
        conversation_id: activeConversationId,
        user_id: user?.id || 'default_user',
        role: 'user',
        content,
        created_at: new Date().toISOString()
      };

      setActiveConversationDetails(prev => prev ? {
        ...prev,
        messages: [...(prev.messages || []), tempUserMsg]
      } : null);

      const res = await sendMessage(
        activeConversationId,
        content,
        mode,
        language,
        options?.documentId,
        options?.webSearch
      );

      setActiveConversationDetails(prev => prev ? {
        ...prev,
        messages: [...(prev.messages || []).filter(m => m.id !== tempUserMsg.id), res.user_message, res.assistant_message]
      } : null);

      const updatedConvs = await fetchConversations();
      setConversations(updatedConvs);
      const updatedMems = await fetchMemories();
      setMemories(updatedMems);
      const analyticsData = await fetchAnalytics();
      setAnalytics(analyticsData);

    } catch (e) {
      console.error("Error sending message:", e);
      alert("Failed to get response from AI. Please try again.");
    } finally {
      setIsLoadingMessage(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    loadData();
  };

  return (
    <div className="flex h-screen w-screen bg-[#212121] text-[#ececec] overflow-hidden font-sans">
      {/* Left Sidebar with ChatGPT Profile Dropdown */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        activeTab={activeTab}
        user={user}
        isOpen={sidebarOpen}
        onSelectConversation={selectConversation}
        onNewChat={handleNewChat}
        onSelectTab={(tab) => { setActiveTab(tab); setSidebarOpen(false); }}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenLoginModal={() => { setAuthModalMode('login'); setAuthModalOpen(true); }}
        onOpenRegisterModal={() => { setAuthModalMode('register'); setAuthModalOpen(true); }}
        onLogout={handleLogout}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all">
        {/* Top Header */}
        <Header
          mode={mode}
          language={language}
          ttsEnabled={ttsEnabled}
          activeTab={activeTab}
          memoryCount={memories.length}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onModeChange={(m) => setMode(m)}
          onLanguageChange={(l) => setLanguage(l)}
          onToggleTTS={() => setTtsEnabled(!ttsEnabled)}
          onOpenMemoryTab={() => setActiveTab('memory')}
        />

        {/* Tab Workspaces */}
        <main className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          {activeTab === 'chat' && (
            <ChatWorkspace
              messages={activeConversationDetails?.messages || []}
              isLoading={isLoadingMessage}
              mode={mode}
              activeDocument={activeDocument}
              onSendMessage={handleSendMessage}
              onClearActiveDocument={() => setActiveDocument(null)}
              onOpenDocumentModal={() => setActiveTab('documents')}
            />
          )}

          {activeTab === 'interviews' && (
            <InterviewWorkspace
              onInterviewCompleted={loadData}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentWorkspace
              documents={documents}
              onDocumentUploaded={(newDoc) => setDocuments(prev => [newDoc, ...prev])}
              onAskDocument={(doc) => {
                setActiveDocument(doc);
                setActiveTab('chat');
                setMode('document');
              }}
            />
          )}

          {activeTab === 'quizzes' && (
            <QuizWorkspace
              history={quizHistory}
              onQuizCompleted={loadData}
            />
          )}

          {activeTab === 'study_planner' && (
            <StudyPlannerWorkspace
              plans={studyPlans}
              onPlanCreated={loadData}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsWorkspace
              data={analytics}
              onNavigateToTab={(t) => setActiveTab(t)}
            />
          )}

          {activeTab === 'memory' && (
            <MemoryWorkspace
              profile={profile}
              memories={memories}
              onProfileUpdated={loadData}
              onMemoriesUpdated={async () => {
                const m = await fetchMemories();
                setMemories(m);
              }}
            />
          )}

          {activeTab === 'profile_settings' && (
            <ProfileSettingsView
              user={user}
              onProfileUpdated={async () => {
                const updatedUser = await fetchAuthMe();
                if (updatedUser) setUser(updatedUser);
              }}
            />
          )}
        </main>
      </div>

      {/* Auth Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          loadData();
        }}
      />
    </div>
  );
}

export default App;
