import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, Volume2, Sparkles, User, HelpCircle } from 'lucide-react';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
  ttsEnabled?: boolean;
  onSendFollowUp?: (text: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onSendFollowUp
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = message.content.replace(/[`*#$]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getFollowUpSuggestions = (content: string) => {
    if (isUser) return [];
    const text = content.toLowerCase();
    if (text.includes('code') || text.includes('python') || text.includes('function')) {
      return ["Explain this line by line", "Give me a practice exercise on this", "What is the time complexity?"];
    }
    if (text.includes('math') || text.includes('formula') || text.includes('equation')) {
      return ["Show another step-by-step example", "What are the common pitfalls?", "Generate a practice quiz on this"];
    }
    return ["Can you explain this with a real-world analogy?", "Summarize into 3 key bullet points", "Create a quiz on this topic"];
  };

  const suggestions = getFollowUpSuggestions(message.content);

  return (
    <div className={`py-5 px-4 sm:px-6 w-full max-w-3xl mx-auto flex gap-4 ${
      isUser ? 'justify-end' : 'justify-start'
    }`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="shrink-0 pt-0.5">
          <div className="w-7 h-7 rounded-full bg-[#10a37f] flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Message Content Container */}
      <div className={`min-w-0 space-y-2 ${isUser ? 'max-w-[82%]' : 'flex-1'}`}>
        {/* User Message Bubble */}
        {isUser ? (
          <div className="bg-[#2f2f2f] text-[#ececec] px-4 py-2.5 rounded-3xl border border-[#383838] text-sm leading-relaxed whitespace-pre-wrap ml-auto">
            {message.content}
          </div>
        ) : (
          /* Assistant Response Text */
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[#ececec]">
                EduMate AI
              </div>

              <div className="flex items-center gap-1 opacity-80 hover:opacity-100">
                <button
                  onClick={handleSpeak}
                  className="p-1 text-[#8e8e8e] hover:text-[#ececec] rounded transition-colors"
                  title="Read aloud"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopy}
                  className="p-1 text-[#8e8e8e] hover:text-[#ececec] rounded transition-colors"
                  title="Copy response"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-sm text-[#ececec] leading-relaxed overflow-hidden">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="relative group my-3 rounded-2xl overflow-hidden border border-[#383838] bg-[#171717]">
                        <div className="px-4 py-2 bg-[#212121] border-b border-[#383838] flex items-center justify-between text-xs text-[#8e8e8e]">
                          <span className="font-mono text-[11px] text-[#10a37f] font-semibold">{match[1]}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                            className="flex items-center gap-1 text-[11px] hover:text-[#ececec]"
                          >
                            <Copy className="w-3 h-3" /> Copy Code
                          </button>
                        </div>
                        <pre className="p-4 overflow-x-auto text-xs font-mono text-[#ececec] leading-normal bg-[#171717]">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code className="bg-[#2f2f2f] px-1.5 py-0.5 rounded-lg text-[#10a37f] font-mono text-xs" {...props}>
                        {children}
                      </code>
                    );
                  },
                  table({ children }: any) {
                    return (
                      <div className="overflow-x-auto my-3">
                        <table className="min-w-full divide-y divide-[#383838] text-xs text-[#ececec] border border-[#383838] rounded-xl overflow-hidden">
                          {children}
                        </table>
                      </div>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Follow-up Suggestion Chips */}
            {suggestions.length > 0 && onSendFollowUp && (
              <div className="pt-2 flex flex-wrap gap-2">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendFollowUp(s)}
                    className="px-3 py-1 rounded-full bg-[#2f2f2f] hover:bg-[#383838] text-xs text-[#b4b4b4] hover:text-[#ececec] border border-[#383838] transition-colors flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3 h-3 text-[#10a37f]" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="shrink-0 pt-0.5">
          <div className="w-7 h-7 rounded-full bg-[#2f2f2f] border border-[#383838] flex items-center justify-center text-[#ececec]">
            <User className="w-3.5 h-3.5" />
          </div>
        </div>
      )}
    </div>
  );
};

