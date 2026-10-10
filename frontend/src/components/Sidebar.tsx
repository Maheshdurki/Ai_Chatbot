import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Plus, Search, Trash2, Edit3, Check, X, 
  FileText, HelpCircle, Calendar, BarChart2, Brain, Sparkles, User, 
  Briefcase, LogIn, UserPlus, LogOut, Settings
} from 'lucide-react';
import type { Conversation, ActiveTab, User as UserType } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeTab: ActiveTab;
  user: UserType | null;
  isOpen: boolean;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onSelectTab: (tab: ActiveTab) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onOpenLoginModal: () => void;
  onOpenRegisterModal: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  activeTab,
  user,
  isOpen,
  onSelectConversation,
  onNewChat,
  onSelectTab,
  onRenameConversation,
  onDeleteConversation,
  onOpenLoginModal,
  onOpenRegisterModal,
  onLogout
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close profile menu on outside click or Escape key press
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartRename = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleConfirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(id);
    setDeletingId(null);
  };

  const getInitials = (name: string) => {
    if (!name) return 'EM';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#171717] border-r border-[#2f2f2f] flex flex-col transition-transform duration-300 md:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* ChatGPT Brand Header */}
      <div className="p-3.5 border-b border-[#2f2f2f] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#10a37f] flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="font-semibold text-[#ececec] text-base leading-tight flex items-center gap-1.5">
              EduMate <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2f2f2f] text-[#10a37f] border border-[#383838]">AI</span>
            </h1>
            <p className="text-[10px] text-[#8e8e8e]">Learning Assistance</p>
          </div>
        </div>
      </div>

      {/* ChatGPT New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full py-2 px-3 rounded-2xl bg-transparent hover:bg-[#2f2f2f] border border-[#383838] text-[#ececec] font-medium text-xs flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#10a37f]" />
            <span>New chat</span>
          </div>
          <Plus className="w-4 h-4 text-[#8e8e8e]" />
        </button>
      </div>

      {/* Main Tab Workspaces List */}
      <div className="px-2 py-1 border-b border-[#2f2f2f] space-y-0.5">
        <button
          onClick={() => onSelectTab('chat')}
          className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-colors ${
            activeTab === 'chat' ? 'bg-[#2f2f2f] text-[#ececec]' : 'text-[#b4b4b4] hover:bg-[#2f2f2f]/60 hover:text-[#ececec]'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-[#10a37f]" />
          <span>Chat Workspace</span>
        </button>

        <button
          onClick={() => onSelectTab('interviews')}
          className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-colors ${
            activeTab === 'interviews' ? 'bg-[#2f2f2f] text-[#ececec]' : 'text-[#b4b4b4] hover:bg-[#2f2f2f]/60 hover:text-[#ececec]'
          }`}
        >
          <Briefcase className="w-4 h-4 text-[#10a37f]" />
          <span>AI Interview Portal</span>
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[#10a37f]/20 text-[#10a37f] font-bold">NEW</span>
        </button>

        <button
          onClick={() => onSelectTab('documents')}
          className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-colors ${
            activeTab === 'documents' ? 'bg-[#2f2f2f] text-[#ececec]' : 'text-[#b4b4b4] hover:bg-[#2f2f2f]/60 hover:text-[#ececec]'
          }`}
        >
          <FileText className="w-4 h-4 text-[#8e8e8e]" />
          <span>Document Library</span>
        </button>

        <button
          onClick={() => onSelectTab('quizzes')}
          className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-colors ${
            activeTab === 'quizzes' ? 'bg-[#2f2f2f] text-[#ececec]' : 'text-[#b4b4b4] hover:bg-[#2f2f2f]/60 hover:text-[#ececec]'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-[#8e8e8e]" />
          <span>Quiz Engine</span>
        </button>

        <button
          onClick={() => onSelectTab('study_planner')}
          className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-colors ${
            activeTab === 'study_planner' ? 'bg-[#2f2f2f] text-[#ececec]' : 'text-[#b4b4b4] hover:bg-[#2f2f2f]/60 hover:text-[#ececec]'
          }`}
        >
          <Calendar className="w-4 h-4 text-[#8e8e8e]" />
          <span>Study Planner</span>
        </button>

        <button
          onClick={() => onSelectTab('analytics')}
          className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-colors ${
            activeTab === 'analytics' ? 'bg-[#2f2f2f] text-[#ececec]' : 'text-[#b4b4b4] hover:bg-[#2f2f2f]/60 hover:text-[#ececec]'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-[#8e8e8e]" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => onSelectTab('memory')}
          className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-colors ${
            activeTab === 'memory' ? 'bg-[#2f2f2f] text-[#ececec]' : 'text-[#b4b4b4] hover:bg-[#2f2f2f]/60 hover:text-[#ececec]'
          }`}
        >
          <Brain className="w-4 h-4 text-[#8e8e8e]" />
          <span>Memory Base</span>
        </button>
      </div>

      {/* Conversation Search & History Section */}
      <div className="px-2 pt-3 pb-2 flex-1 flex flex-col min-h-0">
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8e8e8e]" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#212121] border border-[#383838] rounded-xl text-[#ececec] placeholder-[#8e8e8e] focus:outline-none"
          />
        </div>

        <div className="text-[10px] font-semibold tracking-wider text-[#8e8e8e] uppercase px-2 mb-1">
          Chat History
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {filteredConversations.length === 0 ? (
            <div className="text-xs text-[#8e8e8e] p-4 text-center">
              No previous chats.
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = activeTab === 'chat' && activeConversationId === c.id;
              const isEditing = editingId === c.id;
              const isDeleting = deletingId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectConversation(c.id);
                    onSelectTab('chat');
                  }}
                  className={`group relative p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#2f2f2f] text-[#ececec] font-medium'
                      : 'text-[#b4b4b4] hover:bg-[#2f2f2f]/50 hover:text-[#ececec]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#10a37f]' : 'text-[#8e8e8e]'}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="bg-[#212121] border border-[#10a37f] text-[#ececec] text-xs rounded px-1.5 py-0.5 w-full focus:outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate">{c.title}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <>
                        <button onClick={(e) => handleSaveRename(c.id, e)} className="p-1 hover:text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="p-1 hover:text-rose-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : isDeleting ? (
                      <div className="flex items-center gap-1 bg-[#212121] p-1 rounded border border-rose-500/50">
                        <button onClick={(e) => handleConfirmDelete(c.id, e)} className="p-0.5 text-rose-400 hover:text-rose-300">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeletingId(null); }} className="p-0.5 text-[#8e8e8e]">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button onClick={(e) => handleStartRename(c, e)} className="p-1 text-[#8e8e8e] hover:text-[#ececec]">
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeletingId(c.id); }} className="p-1 text-[#8e8e8e] hover:text-rose-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ChatGPT-Style Profile Dropdown Menu */}
      <div className="relative p-2.5 border-t border-[#2f2f2f] bg-[#171717]" ref={menuRef}>
        {menuOpen && (
          <div className="absolute bottom-full left-2 mb-2 w-60 bg-[#2f2f2f] border border-[#383838] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
            {user ? (
              <div className="space-y-1">
                <div className="px-3 py-2 border-b border-[#383838] mb-1">
                  <div className="font-semibold text-xs text-[#ececec] truncate">{user.full_name}</div>
                  <div className="text-[10px] text-[#8e8e8e] truncate">{user.email}</div>
                </div>

                <button
                  onClick={() => { onSelectTab('profile_settings'); setMenuOpen(false); }}
                  className="w-full p-2 rounded-xl text-left text-xs font-medium text-[#b4b4b4] hover:bg-[#383838] hover:text-[#ececec] flex items-center gap-2.5 transition-colors"
                >
                  <User className="w-4 h-4 text-[#10a37f]" />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => { onSelectTab('profile_settings'); setMenuOpen(false); }}
                  className="w-full p-2 rounded-xl text-left text-xs font-medium text-[#b4b4b4] hover:bg-[#383838] hover:text-[#ececec] flex items-center gap-2.5 transition-colors"
                >
                  <Settings className="w-4 h-4 text-[#10a37f]" />
                  <span>Settings & Preferences</span>
                </button>

                <div className="border-t border-[#383838] pt-1">
                  <button
                    onClick={() => { onLogout(); setMenuOpen(false); }}
                    className="w-full p-2 rounded-xl text-left text-xs font-semibold text-rose-400 hover:bg-rose-950/30 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 p-1">
                <div className="text-xs font-semibold text-[#ececec] px-2 py-1">
                  Welcome to EduMate AI
                </div>
                <button
                  onClick={() => { onOpenLoginModal(); setMenuOpen(false); }}
                  className="w-full p-2 rounded-xl text-left text-xs font-medium bg-[#10a37f] hover:bg-[#0e906f] text-white flex items-center gap-2 transition-colors justify-center font-semibold"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In</span>
                </button>
                <button
                  onClick={() => { onOpenRegisterModal(); setMenuOpen(false); }}
                  className="w-full p-2 rounded-xl text-left text-xs font-medium bg-[#383838] hover:bg-[#4e4e4e] text-[#ececec] flex items-center gap-2 transition-colors justify-center"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sidebar Footer Trigger Button */}
        <div
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-[#2f2f2f] cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#2f2f2f] border border-[#383838] flex items-center justify-center text-[#ececec] font-bold text-xs">
              {user ? getInitials(user.full_name) : <User className="w-4 h-4 text-[#8e8e8e]" />}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-[#ececec] truncate">
                {user ? user.full_name : 'Guest Student'}
              </div>
              <div className="text-[10px] text-[#8e8e8e] truncate">
                {user ? user.email : 'Click to Sign In'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

