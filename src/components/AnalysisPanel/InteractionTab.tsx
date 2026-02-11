import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../editor/stores/editorStore';
import { copilotService } from '../../services/CopilotService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  applied?: boolean;
}

const InteractionTab: React.FC<{ analysisData: any }> = ({ analysisData }) => {
  // Load messages from localStorage or use default
  const getInitialMessages = (): Message[] => {
    try {
      const saved = localStorage.getItem('lumoflow_chat_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }

    // Default welcome message
    return [{
      id: '1',
      role: 'assistant',
      content: '👋 **LumoFlow AI Online.**\nI can edit your files and listen to your voice. Click the mic to record!',
      timestamp: new Date()
    }];
  };

  const [messages, setMessages] = useState<Message[]>(getInitialMessages());
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const editorStore = useEditorStore();
  const activeTab = (editorStore.tabs || []).find(t => t.id === editorStore.activeTabId);
  const activeTabRef = useRef<any>(null);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('lumoflow_chat_messages', JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // --- VOICE RECORDING (MediaRecorder) ---
  // --- VOICE RECORDING (Corrected startRecording) ---
  const startRecording = async () => {
    try {
      console.log("🎤 Mic started...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream); // Default browser mimeType is usually best
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        console.log("🎤 Processing audio...");

        // Cleanup Mic
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const reader = new FileReader();

        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          const base64Audio = base64Data.split(',')[1];

          setIsTranscribing(true); // Show loading state

          try {
            // 1. Send to Backend to convert Speech -> Text
            const text = await (window as any).api.transcribeAudio(base64Audio);

            if (text && text !== '__TRANSCRIPTION_FAILED__') {
              const cleanText = text.trim();

              // 2. Put Text in Input Box (Visual Feedback)
              setInput(cleanText);

              // 3. AUTO-SEND to Copilot (The "Pilot" part)
              console.log("🚀 Auto-sending to Copilot:", cleanText);
              handleSend(cleanText);
            } else {
              alert("Could not hear audio. Please check your API Key.");
            }
          } catch (e) {
            console.error(e);
          } finally {
            setIsTranscribing(false);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Mic Error", e);
      setIsRecording(false);
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const toggleVoice = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  // ── AI CHAT ──
  const handleSend = async (messageOverride?: string) => {
    const textToSend = (messageOverride || input).trim();
    if (!textToSend || isProcessing) return;

    const assistantId = 'ai-' + Date.now();
    setInput('');
    setIsProcessing(true);

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    }]);

    // Show thinking messages
    const thinkingMessages = [
      '🤔 Analyzing your code...',
      '🔍 Understanding the context...',
      '💡 Formulating solution...',
      '⚙️ Processing request...',
      '🧠 Thinking...'
    ];

    let thinkingIndex = 0;
    setThinkingMessage(thinkingMessages[0]);

    const thinkingInterval = setInterval(() => {
      thinkingIndex = (thinkingIndex + 1) % thinkingMessages.length;
      setThinkingMessage(thinkingMessages[thinkingIndex]);
    }, 1500);

    copilotService.setContext({
      currentCode: activeTabRef.current?.content || '',
      currentFile: activeTabRef.current?.fileName || 'untitled.js',
      language: activeTabRef.current?.language || 'javascript',
      problems: (editorStore.problems || []).map((p: any) => ({ line: p.line, message: p.message })),
      analysisData: analysisData || {}
    });

    let accumulatedText = '';
    try {
      await copilotService.streamChat(
        textToSend,
        (chunk) => {
          // Clear thinking message when first chunk arrives
          if (!accumulatedText) {
            clearInterval(thinkingInterval);
            setThinkingMessage(null);

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
        () => {
          clearInterval(thinkingInterval);
          setThinkingMessage(null);
          setIsProcessing(false);
        }
      );
    } catch (err) {
      console.error("AI Error:", err);
      clearInterval(thinkingInterval);
      setThinkingMessage(null);
      setIsProcessing(false);
    }
  };

  const previewEdit = (newCode: string) => {
    // Dispatch an event that CodeEditor.tsx listens to
    const event = new CustomEvent('preview-code-diff', {
      detail: {
        code: newCode
      }
    });
    window.dispatchEvent(event);
  };

  const renderContent = (content: string, msgId: string, isApplied?: boolean) => {
    const parts = content.split(/```([\s\S]*?)```/);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        const lines = part.trim().split('\n');
        const lang = lines[0];
        const code = lines.slice(1).join('\n');
        return (
          <div key={i} style={{ margin: '15px 0', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: '#25252a', padding: '6px 12px', fontSize: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#888', textTransform: 'uppercase' }}>{lang || 'code'}</span>
              <button
                onClick={() => previewEdit(code)}
                style={{
                  background: '#bc13fe',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <i className="fa-solid fa-code-compare"></i> PREVIEW CHANGES
              </button>

            </div>
            <pre style={{ margin: 0, padding: '12px', background: '#0a0a0c', fontSize: '12px', overflowX: 'auto', color: '#bc13fe' }}>
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      return (
        <div key={i} style={{ marginBottom: part.trim() ? '4px' : '10px' }}>
          {part.split('\n').map((line, li) => (
            <div key={li} style={{ marginBottom: '4px' }}>
              {line.split('**').map((subpart, index) => (
                index % 2 === 1 ? <strong key={index} style={{ color: '#bc13fe' }}>{subpart}</strong> : subpart
              ))}
            </div>
          ))}
        </div>
      );
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleResetChat = () => {
    const defaultMessage: Message = {
      id: '1',
      role: 'assistant',
      content: '👋 **LumoFlow AI Online.**\nI can edit your files and listen to your voice. Click the mic to record!',
      timestamp: new Date()
    };
    setMessages([defaultMessage]);
    localStorage.setItem('lumoflow_chat_messages', JSON.stringify([defaultMessage]));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0e0e0f' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: '#151518', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: (isProcessing || isTranscribing) ? '#bc13fe' : '#00f2ff', boxShadow: (isProcessing || isTranscribing) ? '0 0 10px #bc13fe' : '0 0 10px #00ff88', animation: (isProcessing || isTranscribing) ? 'pulse 1.5s infinite' : 'none' }}></div>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#888', letterSpacing: '0.5px' }}>LUMO AI ASSISTANT</span>
        </div>
        <button onClick={handleResetChat} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }} title="Reset Chat">
          <i className="fa-solid fa-rotate-right"></i>
        </button>
      </div>

      {/* Messages */}
      <div className="custom-scroll" ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{
              padding: '12px 16px', borderRadius: '16px', fontSize: '13px', lineHeight: '1.5',
              background: msg.role === 'user' ? '#bc13fe' : '#1c1c1f',
              color: msg.role === 'user' ? '#fff' : '#e0e0e0',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)', border: '1px solid #333'
            }}>
              {renderContent(msg.content, msg.id, msg.applied)}
            </div>
            <div style={{ fontSize: '9px', color: '#555', marginTop: '6px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}

        {/* Thinking Message */}
        {thinkingMessage && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '16px',
              fontSize: '13px',
              lineHeight: '1.5',
              background: '#1c1c1f',
              color: '#bc13fe',
              boxShadow: '0 4px 15px rgba(188, 19, 254, 0.2)',
              border: '1px solid #bc13fe',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontStyle: 'italic'
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div className="dot-blink" style={{ animationDelay: '0s', background: '#bc13fe' }}></div>
                <div className="dot-blink" style={{ animationDelay: '0.2s', background: '#bc13fe' }}></div>
                <div className="dot-blink" style={{ animationDelay: '0.4s', background: '#bc13fe' }}></div>
              </div>
              {thinkingMessage}
            </div>
          </div>
        )}

        {(isProcessing || isTranscribing) && !thinkingMessage && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 16px' }}>
            <div className="dot-blink" style={{ animationDelay: '0s' }}></div>
            <div className="dot-blink" style={{ animationDelay: '0.2s' }}></div>
            <div className="dot-blink" style={{ animationDelay: '0.4s' }}></div>
            {isTranscribing && <span style={{ fontSize: '10px', color: '#888', marginLeft: '5px' }}>Transcribing...</span>}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '15px', background: '#151518', borderTop: '1px solid #222' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#0e0e0f', borderRadius: '25px', padding: '5px 15px', gap: '10px', border: isRecording ? '1px solid #ff4444' : '1px solid #333' }}>
          <button
            onClick={toggleVoice}
            disabled={isProcessing || isTranscribing}
            style={{
              background: isRecording ? '#ff4444' : 'none',
              border: 'none', color: isRecording ? '#fff' : '#888',
              width: '32px', height: '32px', borderRadius: '50%',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: isRecording ? 'micPulse 1.5s infinite' : 'none',
              transition: 'all 0.2s',
              opacity: (isProcessing || isTranscribing) ? 0.3 : 1
            }}
            title={isRecording ? `Recording ${formatTime(recordingTime)} - Click to stop` : "Voice Input"}
          >
            <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
          </button>

          {isRecording && (
            <span style={{ color: '#ff4444', fontSize: '12px', fontWeight: 'bold', minWidth: '40px' }}>
              {formatTime(recordingTime)}
            </span>
          )}

          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isRecording && handleSend()}
            placeholder={isRecording ? "🔴 Recording... Click stop when done" : "Ask Lumo anything..."}
            style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none', padding: '10px 0', fontSize: '14px' }}
            disabled={isRecording || isProcessing || isTranscribing}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing || isRecording || isTranscribing}
            style={{
              background: '#bc13fe', border: 'none', color: '#fff',
              width: '32px', height: '32px', borderRadius: '50%',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: (!input.trim() || isRecording || isProcessing || isTranscribing) ? 0.3 : 1, transition: 'all 0.2s'
            }}
          >
            <i className={`fa-solid ${isProcessing ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
        @keyframes blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes micPulse { 0% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(255, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0); } }
        .dot-blink { width: 6px; height: 6px; background: #bc13fe; border-radius: 50%; animation: blink 1s infinite; }
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(121, 121, 121, 0.4); border-radius: 0; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(100, 100, 100, 0.7); }
      `}</style>
    </div>
  );
};

export default InteractionTab;