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
  // --- 1. GET EDITOR CONTEXT ---
  const editorStore = useEditorStore();
  const tabs = editorStore.tabs || [];
  const activeTabId = editorStore.activeTabId;
  const activeTab = tabs.find(t => t.id === activeTabId);
  const allProblems = [...(editorStore.staticProblems || []), ...(editorStore.runtimeProblems || [])];

  // --- 2. UI STATE ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      role: 'assistant',
      content: '👋 **LumoFlow AI Online.**\nI have context of your current file. Ask me to explain code, fix bugs, or generate new logic.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [autopilotMode, setAutopilotMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');

  // --- 3. REFS ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // --- 4. INITIAL CHECKS & AUTO-SCROLL ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const checkConnection = async () => {
      setConnectionStatus('checking');
      try {
        const isOk = await copilotService.testService();
        if (isOk) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
        }
      } catch (e) {
        setConnectionStatus('error');
      }
    };
    checkConnection();
  }, []);

  // --- 5. VOICE SETUP ---
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
    return () => window.speechSynthesis.cancel();
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window && voiceEnabled) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*`#]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- 6. SEND MESSAGE LOGIC ---
  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userText = input.trim();
    setInput('');
    setIsProcessing(true);

    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: userMsgId,
      role: 'user',
      content: userText,
      timestamp: new Date()
    }]);

    copilotService.setContext({
      currentCode: activeTab?.content || '',
      currentFile: activeTab?.fileName || 'untitled.js',
      language: activeTab?.language || 'javascript',
      problems: allProblems.map(p => ({ line: p.line, message: p.message })),
      analysisData: analysisData || {},
      executeCode: () => {
        const runBtn = document.querySelector('.purple-btn.run') as HTMLElement;
        if (runBtn) runBtn.click();
      },
      clearOutput: () => {
        editorStore.clearOutputData();
        editorStore.clearDebugData();
      }
    });

    const assistantId = 'ai-' + Date.now();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }]);

    let accumulatedText = '';

    try {
      await copilotService.streamChat(
        userText,
        (chunk) => {
          accumulatedText += chunk;
          setMessages(prev => prev.map(msg =>
            msg.id === assistantId ? { ...msg, content: accumulatedText } : msg
          ));
        },
        (fullResponse) => {
          setIsProcessing(false);
          if (voiceEnabled) speak(fullResponse);
        }
      );
    } catch (error) {
      console.error("Chat Error:", error);
      setIsProcessing(false);
      setMessages(prev => prev.map(msg =>
        msg.id === assistantId ? { ...msg, content: "⚠️ Connection interrupted. Please check your GitHub token and try again." } : msg
      ));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to render message content with basic markdown
  const renderContent = (content: string, isUser: boolean) => {
    if (!content) return (
      <div style={{ display: 'flex', gap: '4px', padding: '4px 0' }}>
        <div className="typing-dot" style={{ animationDelay: '0s' }}></div>
        <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
        <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
      </div>
    );

    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (!line && i < lines.length - 1) return <br key={i} />;

      let processedLine: React.ReactNode = line;
      let isBullet = false;

      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        isBullet = true;
        processedLine = line.trim().substring(1).trim();
      }

      const parts = String(processedLine).split('**');
      const elements = parts.map((part, index) => {
        if (index % 2 === 1) {
          return <strong key={index} style={{ color: isUser ? '#00f2ff' : '#bc13fe', fontWeight: 'bold' }}>{part}</strong>;
        }
        return part;
      });

      return (
        <div key={i} style={{
          marginBottom: line ? '6px' : '10px',
          display: isBullet ? 'flex' : 'block',
          gap: isBullet ? '10px' : '0',
          lineHeight: '1.6'
        }}>
          {isBullet && <span style={{ color: isUser ? '#00f2ff' : '#bc13fe', fontWeight: 'bold' }}>•</span>}
          <span>{elements}</span>
        </div>
      );
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0c0c0f',
      overflow: 'hidden',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        height: '2px',
        background: 'linear-gradient(90deg, #bc13fe, #00f2ff)',
        opacity: 0.8
      }} />

      {/* HEADER */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(18, 18, 24, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(188, 19, 254, 0.2), rgba(0, 242, 255, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(188, 19, 254, 0.3)'
          }}>
            <i className="fa-solid fa-sparkles" style={{ fontSize: '18px', color: '#bc13fe', filter: 'drop-shadow(0 0 5px rgba(188, 19, 254, 0.5))' }}></i>
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff', letterSpacing: '-0.01em' }}>
              Assistant
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: connectionStatus === 'connected' ? '#00ff88' : (connectionStatus === 'checking' ? '#ffcc00' : '#ff4d4d'),
                boxShadow: connectionStatus === 'connected' ? '0 0 10px #00ff88' : 'none',
                transition: 'all 0.3s ease'
              }}></span>
              {connectionStatus === 'connected' ? (autopilotMode ? 'Autopilot Active' : 'Ready to help') :
                (connectionStatus === 'checking' ? 'Syncing...' : 'Disconnected')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setAutopilotMode(!autopilotMode)}
            style={{
              width: '36px', height: '36px',
              background: autopilotMode ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255,255,255,0.03)',
              color: autopilotMode ? '#00ff88' : 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            title="Toggle Autopilot"
          >
            <i className="fa-solid fa-plane-up"></i>
          </button>

          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              if (voiceEnabled) window.speechSynthesis.cancel();
            }}
            style={{
              width: '36px', height: '36px',
              background: voiceEnabled ? 'rgba(188, 19, 254, 0.15)' : 'rgba(255,255,255,0.03)',
              color: voiceEnabled ? '#bc13fe' : 'rgba(255,255,255,0.4)',
              border: voiceEnabled ? '1px solid rgba(188, 19, 254, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title={voiceEnabled ? "Turn Speaker OFF" : "Turn Speaker ON"}
          >
            <i className={`fa-solid ${voiceEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
          </button>

          <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)', margin: '0 4px' }}></div>

          <button
            onClick={() => setMessages([messages[0]])}
            style={{
              width: '36px', height: '36px', background: 'transparent', color: 'rgba(255,255,255,0.3)',
              border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'color 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#ff4d4d')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
            title="Reset Chat"
          >
            <i className="fa-solid fa-rotate-right"></i>
          </button>
        </div>
      </div>

      {/* MESSAGES FEED */}
      <div className="message-feed" style={{
        flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px'
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: '16px', alignItems: 'flex-start',
              animation: 'messageIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both'
            }}
          >
            <div style={{
              width: '34px', height: '34px', borderRadius: '12px',
              background: msg.role === 'user' ? 'rgba(0, 242, 255, 0.12)' : 'rgba(188, 19, 254, 0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              border: msg.role === 'user' ? '1px solid rgba(0, 242, 255, 0.2)' : '1px solid rgba(188, 19, 254, 0.2)',
              marginTop: '4px'
            }}>
              <i className={`fa-solid ${msg.role === 'user' ? 'fa-user' : 'fa-wand-magic-sparkles'}`}
                style={{ color: msg.role === 'user' ? '#00f2ff' : '#bc13fe', fontSize: '14px' }}></i>
            </div>

            <div style={{
              maxWidth: '85%', display: 'flex', flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                background: msg.role === 'user' ? 'linear-gradient(135deg, #1c1c24 0%, #16161d 100%)' : 'linear-gradient(135deg, #14141b 0%, #0d0d14 100%)',
                padding: '16px 20px',
                borderRadius: msg.role === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: '#fff', fontSize: '14px', lineHeight: '1.7',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)', position: 'relative'
              }}>
                {renderContent(msg.content, msg.role === 'user')}
              </div>
              <div style={{
                fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '8px', fontWeight: '600', letterSpacing: '0.05em'
              }}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div style={{ padding: '24px', background: 'linear-gradient(0deg, #0c0c0f 0%, transparent 100%)', position: 'relative' }}>
        <div style={{
          background: 'rgba(20, 20, 27, 0.98)', padding: '12px 16px', borderRadius: '22px', border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)', display: 'flex', gap: '12px', alignItems: 'flex-end',
          transition: 'all 0.3s ease', backdropFilter: 'blur(20px)'
        }} className="input-container">
          <button
            onClick={toggleListening} disabled={isProcessing}
            style={{
              width: '42px', height: '42px', background: isListening ? '#ff3b30' : 'rgba(255,255,255,0.03)',
              color: isListening ? '#fff' : 'rgba(255,255,255,0.4)',
              border: 'none', borderRadius: '15px', cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: isListening ? '0 0 20px rgba(255, 59, 48, 0.4)' : 'none'
            }}
          >
            <i className={`fa-solid ${isListening ? 'fa-microphone-slash' : 'fa-microphone'}`} style={{ fontSize: '18px' }}></i>
          </button>

          <textarea
            value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Ask AI about your code..." disabled={isProcessing || isListening}
            style={{
              flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', outline: 'none',
              resize: 'none', padding: '11px 0', fontFamily: 'inherit', lineHeight: '1.5', maxHeight: '180px'
            }}
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />

          <button
            onClick={handleSendMessage} disabled={!input.trim() || isProcessing}
            style={{
              width: '42px', height: '42px',
              background: input.trim() && !isProcessing ? 'linear-gradient(135deg, #bc13fe, #7b2cbf)' : 'rgba(255,255,255,0.02)',
              color: input.trim() && !isProcessing ? '#fff' : 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: '15px', cursor: input.trim() && !isProcessing ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease',
              boxShadow: input.trim() && !isProcessing ? '0 8px 25px rgba(188, 19, 254, 0.4)' : 'none'
            }}
          >
            <i className="fa-solid fa-arrow-up" style={{ fontSize: '20px' }}></i>
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '16px', letterSpacing: '0.12em', fontWeight: '700' }}>
          POWERED BY GITHUB COPILOT • LUMOFLOW V2
        </div>
      </div>

      <style>{`
        @keyframes messageIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .message-feed::-webkit-scrollbar { width: 5px; }
        .message-feed::-webkit-scrollbar-track { background: transparent; }
        .message-feed::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .message-feed::-webkit-scrollbar-thumb:hover { background: rgba(188, 19, 254, 0.3); }

        .input-container:focus-within {
          border-color: rgba(188, 19, 254, 0.5) !important;
          background: rgba(24, 24, 34, 1) !important;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.6) !important;
        }
        
        .typing-dot {
            width: 7px; height: 7px; background: #bc13fe; border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out both;
            box-shadow: 0 0 5px #bc13fe;
        }
        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0.3); opacity: 0.3; }
            40% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default InteractionTab;