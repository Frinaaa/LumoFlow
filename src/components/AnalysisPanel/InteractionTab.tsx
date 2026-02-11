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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Hi! I\'m your **LumoFlow AI**. Ask me anything or use the mic to chat!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

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
          if (!accumulatedText) {
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

  const applyEdit = (code: string, msgId: string) => {
    if (!activeTab) return;
    editorStore.updateTabContent(activeTab.id, code);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, applied: true } : m));
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
              <button onClick={() => applyEdit(code, msgId)} disabled={isApplied}
                style={{ background: isApplied ? '#00ff88' : '#bc13fe', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>
                {isApplied ? '✓ APPLIED' : 'APPLY TO FILE'}
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0e0e0f' }}>
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
        {(isProcessing || isTranscribing) && (
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
        <div style={{ display: 'flex', alignItems: 'center', background: '#0e0e0f', borderRadius: '25px', padding: '5px 15px', gap: '10px', border: isRecording ? '1px solid #bc13fe' : '1px solid #333' }}>
          <button
            onClick={toggleVoice}
            disabled={isProcessing || isTranscribing}
            style={{
              background: isRecording ? '#bc13fe' : 'none',
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
            <span style={{ color: '#bc13fe', fontSize: '12px', fontWeight: 'bold', minWidth: '40px' }}>
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
        @keyframes micPulse { 0% { box-shadow: 0 0 0 0 rgba(188, 19, 254, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(188, 19, 254, 0); } 100% { box-shadow: 0 0 0 0 rgba(188, 19, 254, 0); } }
        .dot-blink { width: 6px; height: 6px; background: #bc13fe; border-radius: 50%; animation: blink 1s infinite; }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default InteractionTab;