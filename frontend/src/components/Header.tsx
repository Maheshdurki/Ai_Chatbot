import React from 'react';
import { 
  Menu, Globe, Volume2, VolumeX, Brain, ChevronDown, 
  Lightbulb, Code, Calculator, GraduationCap, Briefcase, Search, FileText, Sparkles
} from 'lucide-react';
import type { ActiveTab } from '../types';

interface HeaderProps {
  mode: string;
  language: string;
  ttsEnabled: boolean;
  activeTab: ActiveTab;
  memoryCount: number;
  onToggleSidebar: () => void;
  onModeChange: (mode: string) => void;
  onLanguageChange: (lang: string) => void;
  onToggleTTS: () => void;
  onOpenMemoryTab: () => void;
}

const MODES = [
  { id: 'general', label: 'EduMate 4.0 (General)', icon: Sparkles, desc: 'Everyday intelligent study helper' },
  { id: 'concept', label: 'Concept Explainer', icon: Lightbulb, desc: 'Intuitive analogies & simple breakdowns' },
  { id: 'coding', label: 'Coding & Algorithm Tutor', icon: Code, desc: 'Code logic, debugging & complexity analysis' },
  { id: 'math', label: 'Mathematics Solver', icon: Calculator, desc: 'Step-by-step LaTeX formulas & calculus' },
  { id: 'exam', label: 'Exam Prep & Cheatsheets', icon: GraduationCap, desc: 'High-yield exam summaries & practice' },
  { id: 'interview', label: 'AI Interview Practice', icon: Briefcase, desc: 'STAR technique & real-time evaluations' },
  { id: 'research', label: 'Research Assistant', icon: Search, desc: 'Evidence-backed summaries & citations' },
  { id: 'document', label: 'Document & PDF Tutor', icon: FileText, desc: 'Interactive Q&A on study files' },
];

export const Header: React.FC<HeaderProps> = ({
  mode,
  language,
  ttsEnabled,
  activeTab,
  memoryCount,
  onToggleSidebar,
  onModeChange,
  onLanguageChange,
  onToggleTTS,
  onOpenMemoryTab,
}) => {
  const activeModeObj = MODES.find(m => m.id === mode) || MODES[0];

  return (
    <header className="h-14 bg-[#212121] border-b border-[#2f2f2f] px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-[#b4b4b4] hover:text-[#ececec] md:hidden rounded-lg hover:bg-[#2f2f2f] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* ChatGPT Model Selector Dropdown */}
        {activeTab === 'chat' && (
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#2f2f2f] text-[#ececec] text-sm font-semibold transition-colors">
              <span>{activeModeObj.label.split('(')[0]}</span>
              <ChevronDown className="w-4 h-4 text-[#8e8e8e] group-hover:text-[#ececec]" />
            </button>

            <div className="absolute top-full left-0 mt-1 w-72 bg-[#171717] border border-[#383838] rounded-2xl shadow-2xl p-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1">
              <div className="text-[11px] font-semibold text-[#8e8e8e] px-3 py-1.5 uppercase tracking-wider">
                Model & Learning Mode
              </div>
              <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                {MODES.map((m) => {
                  const MIcon = m.icon;
                  const isSelected = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => onModeChange(m.id)}
                      className={`w-full p-2.5 rounded-xl text-left text-xs flex items-start gap-3 transition-colors ${
                        isSelected ? 'bg-[#2f2f2f] text-[#ececec] font-medium' : 'text-[#b4b4b4] hover:bg-[#2f2f2f]/60 hover:text-[#ececec]'
                      }`}
                    >
                      <MIcon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-[#10a37f]' : 'text-[#8e8e8e]'}`} />
                      <div>
                        <div className="font-semibold text-[#ececec] text-xs">{m.label}</div>
                        <div className="text-[11px] text-[#8e8e8e] mt-0.5">{m.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Header Toolbar */}
      <div className="flex items-center gap-2">
        {/* Persistent Memory Status Pill */}
        <button
          onClick={onOpenMemoryTab}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2f2f2f] border border-[#383838] text-[#ececec] text-xs hover:bg-[#383838] transition-colors"
          title="Click to view student memory facts"
        >
          <Brain className="w-3.5 h-3.5 text-[#10a37f]" />
          <span className="text-[11px] font-medium">{memoryCount} Memories</span>
        </button>

        {/* Language Selector */}
        <div className="flex items-center gap-1 bg-[#2f2f2f] border border-[#383838] rounded-xl px-2 py-1 text-xs text-[#ececec]">
          <Globe className="w-3.5 h-3.5 text-[#8e8e8e]" />
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-transparent text-[#ececec] text-xs px-1 focus:outline-none cursor-pointer"
          >
            <option value="en" className="bg-[#171717]">English 🇺🇸</option>
            <option value="te" className="bg-[#171717]">Telugu 🇮🇳</option>
            <option value="hi" className="bg-[#171717]">Hindi 🇮🇳</option>
          </select>
        </div>

        {/* Text To Speech Audio Toggle */}
        <button
          onClick={onToggleTTS}
          className={`p-2 rounded-xl border transition-colors ${
            ttsEnabled
              ? 'bg-[#10a37f]/20 text-[#10a37f] border-[#10a37f]/40'
              : 'bg-[#2f2f2f] text-[#8e8e8e] border-[#383838] hover:text-[#ececec]'
          }`}
          title={ttsEnabled ? 'Speech Output Enabled' : 'Speech Output Muted'}
        >
          {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

