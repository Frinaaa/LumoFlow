import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../editor/stores/editorStore';
import { copilotService } from '../../services/CopilotService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const InteractionTab: React.FC<{ analysisData: any }> = ({ analysisData }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 **Welcome to LumoFlow AI.**\nI can see your code and help you build faster. What are we working on?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const editorStore = useEditorStore();
  const activeTab = (editorStore.tabs || []).find(t => t.id === editorStore.activeTabId);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userText = input.trim();
    const assistantId = 'ai-' + Date.now();

    setInput('');
    setIsProcessing(true);

    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date()
    }]);

    // Prepare context
    copilotService.setContext({
      currentCode: activeTab?.content || '',
      currentFile: activeTab?.fileName || 'untitled.js',
      language: activeTab?.language || 'javascript',
      problems: (editorStore.problems || []).map((p: any) => ({ line: p.line, message: p.message })),
      analysisData: analysisData || {}
    });

    let accumulatedText = '';
    try {
      await copilotService.streamChat(
        userText,
        (chunk) => {
          if (!accumulatedText) {
            // First chunk received: add the assistant bubble
            setMessages(prev => [...prev, {
              id: assistantId,
              role: 'assistant',
              content: '',
              timestamp: new Date()
            }]);
          }
          accumulatedText += chunk;
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: accumulatedText } : m));
        },
        () => setIsProcessing(false)
      );
    } catch (err) {
      console.error("AI Error:", err);
      setIsProcessing(false);
    }
  };

  const renderContent = (content: string) => {
    // Basic Markdown support (bolding and lines)
    return content.split('\n').map((line, i) => (
      <div key={i} style={{ marginBottom: line.trim() ? '4px' : '10px' }}>
        {line.split('**').map((part, index) => (
          index % 2 === 1 ? <strong key={index} style={{ color: '#bc13fe' }}>{part}</strong> : part
        ))}
      </div>
    ));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0e0e0f' }}>
      {/* Premium Header */}
      <div style={{
        padding: '12px 16px',
        background: '#151518',
        borderBottom: '1px solid #222',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isProcessing ? '#bc13fe' : '#00ff88',
            boxShadow: isProcessing ? '0 0 10px #bc13fe' : '0 0 10px #00ff88',
            animation: isProcessing ? 'pulse 1.5s infinite' : 'none'
          }}></div>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#888', letterSpacing: '0.5px' }}>LUMO AI ASSISTANT</span>
        </div>
        <button
          onClick={() => setMessages([messages[0]])}
          style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}
          title="Reset Chat"
        >
          <i className="fa-solid fa-rotate-right"></i>
        </button>
      </div>

      {/* Message Feed */}
      <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {messages.map((msg, i) => (
          <div key={msg.id} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '16px',
              fontSize: '13px',
              lineHeight: '1.5',
              background: msg.role === 'user' ? '#bc13fe' : '#1c1c1f',
              color: msg.role === 'user' ? '#fff' : '#ececec',
              border: msg.role === 'assistant' ? '1px solid #333' : 'none',
              borderBottomLeftRadius: msg.role === 'assistant' ? '2px' : '16px',
              borderBottomRightRadius: msg.role === 'user' ? '2px' : '16px',
              whiteSpace: 'pre-wrap',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}>
              {renderContent(msg.content)}
              {isProcessing && i === messages.length - 1 && msg.role === 'assistant' && !msg.content && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div className="dot-blink" style={{ animationDelay: '0s' }}></div>
                  <div className="dot-blink" style={{ animationDelay: '0.2s' }}></div>
                  <div className="dot-blink" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isProcessing && messages[messages.length - 1].role === 'user' && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
            <div style={{ padding: '12px 16px', borderRadius: '16px', background: '#1c1c1f', border: '1px solid #333', borderBottomLeftRadius: '2px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div className="dot-blink" style={{ animationDelay: '0s' }}></div>
                <div className="dot-blink" style={{ animationDelay: '0.2s' }}></div>
                <div className="dot-blink" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Bar */}
      <div style={{ padding: '20px', background: '#151518', borderTop: '1px solid #222' }}>
        <div style={{
          display: 'flex',
          background: '#0a0a0c',
          borderRadius: '24px',
          padding: '6px 16px',
          border: '1px solid #333',
          alignItems: 'center',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
        }}>
          <input
            style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none', padding: '10px 0', fontSize: '14px' }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask Lumo anything..."
          />
          <button
            style={{
              background: '#bc13fe',
              border: 'none',
              color: '#fff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: input.trim() ? 1 : 0.3,
              transition: 'all 0.2s'
            }}
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
          >
            <i className={`fa-solid ${isProcessing ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
        @keyframes blink { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
        .dot-blink { width: 6px; height: 6px; background: #bc13fe; border-radius: 50%; animation: blink 1s infinite; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default InteractionTab;