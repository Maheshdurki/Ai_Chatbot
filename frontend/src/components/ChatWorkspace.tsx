import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Paperclip, Mic, MicOff, Globe, Sparkles, 
  BookOpen, Code, Calculator, FileText, X, Briefcase 
} from 'lucide-react';
import type { Message, DocumentItem } from '../types';
import { MessageItem } from './MessageItem';

interface ChatWorkspaceProps {
  messages: Message[];
  isLoading: boolean;
  mode: string;
  activeDocument: DocumentItem | null;
  onSendMessage: (content: string, options?: { documentId?: string; webSearch?: boolean }) => void;
  onClearActiveDocument: () => void;
  onOpenDocumentModal: () => void;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  messages,
  isLoading,
  activeDocument,
  onSendMessage,
  onClearActiveDocument,
  onOpenDocumentModal,
}) => {
  const [input, setInput] = useState('');
  const [webSearch, setWebSearch] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Web Speech API initialization
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported by your browser. Please try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim(), {
      documentId: activeDocument?.id,
      webSearch
    });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePresetClick = (presetText: string) => {
    setInput(presetText);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#212121] relative overflow-hidden">
      {/* Messages Stream / ChatGPT Hero Empty State */}
      <div className="flex-1 overflow-y-auto pb-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-8">
            <div className="w-12 h-12 rounded-full bg-[#10a37f] flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-[#ececec]">
                What can I help with today?
              </h2>
              <p className="text-sm text-[#8e8e8e]">
                EduMate AI is powered by multi-turn memory & real-time learning assistance.
              </p>
            </div>

            {/* ChatGPT Prompt Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pt-2">
              <button
                onClick={() => handlePresetClick("Explain how neural networks process data with an intuitive analogy.")}
                className="p-4 rounded-2xl bg-[#212121] border border-[#383838] hover:bg-[#2f2f2f] transition-colors text-xs space-y-1 group"
              >
                <div className="font-semibold text-[#ececec] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#10a37f]" />
                  <span>Learn a Concept</span>
                </div>
                <p className="text-[#8e8e8e] text-[11px] line-clamp-2">
                  "Explain how neural networks process data with an intuitive analogy."
                </p>
              </button>

              <button
                onClick={() => handlePresetClick("Debug this Python code and analyze its time & space complexity:")}
                className="p-4 rounded-2xl bg-[#212121] border border-[#383838] hover:bg-[#2f2f2f] transition-colors text-xs space-y-1 group"
              >
                <div className="font-semibold text-[#ececec] flex items-center gap-2">
                  <Code className="w-4 h-4 text-[#10a37f]" />
                  <span>Coding & Algorithms</span>
                </div>
                <p className="text-[#8e8e8e] text-[11px] line-clamp-2">
                  "Debug this Python code and analyze its time & space complexity..."
                </p>
              </button>

              <button
                onClick={() => handlePresetClick("Solve this derivative step by step with LaTeX formatting: d/dx (x^3 * sin(x))")}
                className="p-4 rounded-2xl bg-[#212121] border border-[#383838] hover:bg-[#2f2f2f] transition-colors text-xs space-y-1 group"
              >
                <div className="font-semibold text-[#ececec] flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#10a37f]" />
                  <span>Math Solver</span>
                </div>
                <p className="text-[#8e8e8e] text-[11px] line-clamp-2">
                  "Solve this derivative step by step: d/dx (x^3 * sin(x))"
                </p>
              </button>

              <button
                onClick={() => handlePresetClick("Start a mock technical interview for a Software Engineer position.")}
                className="p-4 rounded-2xl bg-[#212121] border border-[#383838] hover:bg-[#2f2f2f] transition-colors text-xs space-y-1 group"
              >
                <div className="font-semibold text-[#ececec] flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#10a37f]" />
                  <span>AI Interview Practice</span>
                </div>
                <p className="text-[#8e8e8e] text-[11px] line-clamp-2">
                  "Start a mock technical interview for a Software Engineer position."
                </p>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#2f2f2f]">
            {messages.map((m) => (
              <MessageItem
                key={m.id}
                message={m}
                ttsEnabled={false}
                onSendFollowUp={(text) => onSendMessage(text)}
              />
            ))}

            {/* Loading Pulse State */}
            {isLoading && (
              <div className="py-5 px-4 sm:px-6 w-full max-w-3xl mx-auto flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#10a37f] flex items-center justify-center text-white animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs text-[#8e8e8e] flex items-center gap-2">
                  <span className="font-medium text-[#ececec]">EduMate AI is thinking...</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10a37f] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10a37f] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10a37f] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ChatGPT Floating Input Composer Section */}
      <div className="p-3 sm:p-4 bg-[#212121]">
        <div className="max-w-3xl mx-auto space-y-2">
          
          {/* Active Document Attachment Badge */}
          {activeDocument && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#2f2f2f] border border-[#383838] text-xs text-[#ececec]">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-[#10a37f]" />
                <span className="truncate">Active Context: <strong>{activeDocument.filename}</strong></span>
              </div>
              <button onClick={onClearActiveDocument} className="p-0.5 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ChatGPT Rounded Composer Container */}
          <div className="relative rounded-3xl bg-[#2f2f2f] border border-[#383838] focus-within:border-[#555] shadow-xl transition-colors p-3 flex flex-col gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message EduMate AI..."
              rows={2}
              className="w-full bg-transparent text-sm text-[#ececec] placeholder-[#8e8e8e] focus:outline-none resize-none px-1"
            />

            {/* Bottom Toolbar Controls */}
            <div className="flex items-center justify-between pt-1 border-t border-[#383838]">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenDocumentModal}
                  className="p-1.5 rounded-xl text-[#8e8e8e] hover:text-[#ececec] hover:bg-[#383838] text-xs flex items-center gap-1 transition-colors"
                  title="Attach document/notes for Q&A"
                >
                  <Paperclip className="w-4 h-4" />
                  <span className="hidden sm:inline">Attach Doc</span>
                </button>

                <button
                  onClick={toggleListening}
                  className={`p-1.5 rounded-xl text-xs flex items-center gap-1 transition-colors ${
                    isListening ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'text-[#8e8e8e] hover:text-[#ececec] hover:bg-[#383838]'
                  }`}
                  title="Voice input speech to text"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice'}</span>
                </button>

                <button
                  onClick={() => setWebSearch(!webSearch)}
                  className={`p-1.5 rounded-xl text-xs flex items-center gap-1 transition-colors ${
                    webSearch ? 'bg-[#10a37f]/20 text-[#10a37f] border border-[#10a37f]/40' : 'text-[#8e8e8e] hover:text-[#ececec] hover:bg-[#383838]'
                  }`}
                  title="Toggle Web Search context"
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Web Search</span>
                </button>
              </div>

              {/* ChatGPT Circular Send Button */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  input.trim() && !isLoading
                    ? 'bg-white text-black hover:bg-[#e3e3e3] cursor-pointer'
                    : 'bg-[#383838] text-[#676767] cursor-not-allowed'
                }`}
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-[11px] text-center text-[#8e8e8e] pt-1">
            EduMate AI can make mistakes. Verify important info.
          </div>
        </div>
      </div>
    </div>
  );
};

