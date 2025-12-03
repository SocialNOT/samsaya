import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, Attachment } from '../types';
import { streamChatResponse, transcribeAudio, generateSpeech, decodeAudioData } from '../services/geminiService';

interface ChatConsoleProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  requestedQuery?: string;
  onQueryHandled?: () => void;
}

const SUGGESTED_INQUIRIES = [
    "What is the definition of Saṃśaya in Nyāya Sūtra?",
    "How does Dharmakīrti critique the Nyāya view of Doubt?",
    "Compare 'Vicikitsā' in Buddhism with 'Saṃśaya' in Nyāya.",
    "Explain the role of 'Tarka' in resolving doubt."
];

const ChatConsole: React.FC<ChatConsoleProps> = ({ messages, setMessages, requestedQuery, onQueryHandled }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Toggles
  const [useThinking, setUseThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // We use a dummy div at the end of the list to scroll to
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingMimeTypeRef = useRef<string>('audio/webm');

  const scrollToBottom = () => {
    // Scroll smoothly to the bottom ref
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (requestedQuery && !isLoading && onQueryHandled) {
      executeMessage(requestedQuery, []);
      onQueryHandled();
    }
  }, [requestedQuery]);

  const executeMessage = async (text: string, msgAttachments: Attachment[]) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: text,
      timestamp: new Date(),
      attachments: msgAttachments
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setAttachments([]); // Clear attachments after sending

    const modelMsgId = crypto.randomUUID();
    const modelMsg: ChatMessage = {
      id: modelMsgId,
      role: 'model',
      text: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, modelMsg]);

    try {
      await streamChatResponse(
        messages, 
        text, 
        msgAttachments,
        { useThinking, useSearch },
        (chunkText) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === modelMsgId ? { ...msg, text: chunkText } : msg
            )
          );
        }
      );
    } catch (error) {
      setMessages(prev => 
        prev.map(msg => 
            msg.id === modelMsgId 
            ? { ...msg, text: "[System Error: Unable to query the repository. Verify API Key and connection.]", isStreaming: false } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setMessages(prev => 
        prev.map(msg => 
            msg.id === modelMsgId ? { ...msg, isStreaming: false } : msg
        )
      );
    }
  };

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    executeMessage(input, attachments);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Attachments ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        // Extract base64 data (remove data:image/png;base64, prefix)
        const base64Data = result.split(',')[1];
        const mimeType = result.split(';')[0].split(':')[1];
        
        setAttachments(prev => [...prev, {
          mimeType,
          data: base64Data,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // --- STT ---
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Determine supported mime type
        let mimeType = 'audio/webm'; // Fallback
        if (typeof MediaRecorder.isTypeSupported === 'function') {
             if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
             else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
             else if (MediaRecorder.isTypeSupported('audio/wav')) mimeType = 'audio/wav';
        }
        
        recordingMimeTypeRef.current = mimeType;
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: recordingMimeTypeRef.current });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const result = reader.result as string;
            const base64Audio = result.split(',')[1];
            try {
              setIsLoading(true);
              const text = await transcribeAudio(base64Audio, recordingMimeTypeRef.current);
              setInput(prev => (prev ? prev + " " + text : text));
            } catch (err) {
              console.error("Transcription failed", err);
              alert("Could not transcribe audio. Please try again.");
            } finally {
              setIsLoading(false);
            }
          };
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Mic permission denied", err);
        alert("Microphone permission required for speech-to-text.");
      }
    }
  };

  // --- TTS ---
  const handleListen = async (text: string) => {
    try {
      const audioData = await generateSpeech(text);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await decodeAudioData(audioData, audioContext);
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
    } catch (err) {
      console.error("TTS Error", err);
    }
  };

  // --- Message Actions ---
  const handleTranslate = (text: string) => {
    executeMessage(`Please translate the following text to Bengali (or Sanskrit if appropriate): "${text}"`, []);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      if (messages[messages.length - 1].role === 'model') {
        setMessages(prev => prev.slice(0, -1));
      }
      executeMessage(lastUserMsg.text, lastUserMsg.attachments || []);
    }
  };

  const handleShare = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Gemini-Saṃśaya Research',
          text: text,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      handleCopy(text);
      alert('Copied to clipboard');
    }
  };

  return (
    <div className="flex flex-col h-full bg-skin-fill/50 relative">
      {/* Grid Lines Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[size:40px_40px] text-skin-muted"></div>

      {/* Toolbar */}
      <div className="flex items-center justify-center px-4 py-2 bg-skin-fill-panel/80 border-b border-skin-border gap-12 z-20 shrink-0">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative">
            <input type="checkbox" checked={useThinking} onChange={(e) => setUseThinking(e.target.checked)} className="sr-only peer" />
            <div className="w-8 h-4 bg-skin-fill-element rounded-full peer-checked:bg-skin-accent transition-colors opacity-80"></div>
            <div className="absolute left-0 top-0 w-4 h-4 bg-skin-muted rounded-full peer-checked:bg-white peer-checked:translate-x-full transition-transform"></div>
          </div>
          <span className={`text-xs font-mono uppercase tracking-widest ${useThinking ? 'text-skin-accent' : 'text-skin-muted'} group-hover:text-skin-base transition-colors`}>Deep Think</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative">
            <input type="checkbox" checked={useSearch} onChange={(e) => setUseSearch(e.target.checked)} className="sr-only peer" />
            <div className="w-8 h-4 bg-skin-fill-element rounded-full peer-checked:bg-skin-accent transition-colors opacity-80"></div>
            <div className="absolute left-0 top-0 w-4 h-4 bg-skin-muted rounded-full peer-checked:bg-white peer-checked:translate-x-full transition-transform"></div>
          </div>
          <span className={`text-xs font-mono uppercase tracking-widest ${useSearch ? 'text-skin-accent' : 'text-skin-muted'} group-hover:text-skin-base transition-colors`}>Web Grounding</span>
        </label>
      </div>

      {/* Output Display */}
      {/* min-h-0 is critical for nested flex scrolling */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 pb-8 space-y-6 md:space-y-8 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-skin-muted opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" strokeLinejoin="miter" className="mb-4">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            <p className="font-mono text-sm tracking-widest mb-8">AWAITING INQUIRY</p>

            {/* Suggested Inquiries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                 {SUGGESTED_INQUIRIES.map((query, idx) => (
                     <button 
                        key={idx}
                        onClick={() => executeMessage(query, [])}
                        className="text-left p-4 rounded border border-skin-border hover:border-skin-accent bg-skin-fill-panel/50 hover:bg-skin-fill-panel transition-all group"
                     >
                        <p className="text-sm font-serif text-skin-base group-hover:text-skin-accent">{query}</p>
                     </button>
                 ))}
            </div>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} relative z-10`}>
             <div className="flex items-center gap-2 mb-1 opacity-50">
                <span className="text-[10px] font-mono uppercase tracking-widest text-skin-muted">
                    {msg.role === 'user' ? 'Scholar' : 'Saṃśaya-Mīmāṃsaka'}
                </span>
                <span className="text-[10px] text-skin-muted">
                    {msg.timestamp.toLocaleTimeString()}
                </span>
             </div>

            <div 
              className={`max-w-[90%] md:max-w-[85%] p-4 border ${
                msg.role === 'user' 
                  ? 'bg-skin-fill-element border-skin-border text-skin-base' 
                  : 'bg-skin-fill-panel/90 border-skin-accent/30 text-skin-base shadow-sm'
              }`}
            >
              {/* Attachments Display */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {msg.attachments.map((att, idx) => (
                    att.mimeType.startsWith('image/') ? (
                      <img key={idx} src={`data:${att.mimeType};base64,${att.data}`} alt="attachment" className="h-20 w-auto rounded border border-skin-border" />
                    ) : (
                      <div key={idx} className="bg-skin-fill p-2 rounded border border-skin-border text-xs font-mono text-skin-muted">
                        {att.name || 'File'}
                      </div>
                    )
                  ))}
                </div>
              )}

              <div className="text-base leading-relaxed break-words">
                <ReactMarkdown
                  components={{
                    p: ({node, ...props}) => <p className="mb-4 font-serif leading-relaxed last:mb-0" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-xl font-mono font-bold text-skin-accent mt-6 mb-3 border-b border-skin-border pb-1" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-lg font-mono font-bold text-skin-accent mt-5 mb-2" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-md font-mono font-bold text-skin-accent/80 mt-4 mb-2" {...props} />,
                    code: ({node, className, children, ...props}) => {
                         const match = /language-(\w+)/.exec(className || '')
                         const isInline = !match && !String(children).includes('\n')
                         if (isInline) {
                             return <code className="font-mono text-skin-accent bg-skin-fill px-1 py-0.5 rounded text-sm border border-skin-border whitespace-pre-wrap break-all" {...props}>{children}</code>
                         }
                         return <code className="font-mono text-sm block bg-skin-fill p-2 rounded border border-skin-border my-2 overflow-x-auto text-skin-accent whitespace-pre" {...props}>{children}</code>
                    },
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-skin-accent pl-4 italic my-4 text-skin-muted bg-skin-fill/30 p-3 rounded-r border-y border-r border-skin-border/50" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-1 marker:text-skin-accent" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-1 marker:text-skin-accent" {...props} />,
                    li: ({node, ...props}) => <li className="pl-1" {...props} />,
                    a: ({node, ...props}) => <a className="text-skin-accent hover:underline decoration-skin-accent/50 cursor-pointer" {...props} />,
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
                {msg.isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-skin-accent animate-pulse align-middle"></span>}
              </div>
              
              {/* Action Bar */}
              {msg.role === 'model' && !msg.isStreaming && (
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-skin-border/50">
                    <button onClick={() => handleTranslate(msg.text)} className="text-skin-muted hover:text-skin-accent transition-colors" title="Translate">
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                    </button>
                    <button onClick={() => handleListen(msg.text)} className="text-skin-muted hover:text-skin-accent transition-colors" title="Listen (TTS)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                    </button>
                    <button onClick={() => handleCopy(msg.text)} className="text-skin-muted hover:text-skin-accent transition-colors" title="Copy">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                    <button onClick={handleRegenerate} className="text-skin-muted hover:text-skin-accent transition-colors" title="Regenerate">
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                    </button>
                    <button onClick={() => handleShare(msg.text)} className="text-skin-muted hover:text-skin-accent transition-colors" title="Share">
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {/* Scroll anchor */}
        <div ref={bottomRef}></div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-skin-border bg-skin-fill-panel relative z-20 shrink-0">
        
        {/* Attachment Preview */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 px-2 overflow-x-auto">
             {attachments.map((att, idx) => (
                <div key={idx} className="relative group">
                    {att.mimeType.startsWith('image/') ? (
                         <img src={`data:${att.mimeType};base64,${att.data}`} alt="preview" className="h-12 w-auto rounded border border-skin-border" />
                    ) : (
                        <div className="h-12 w-20 flex items-center justify-center bg-skin-fill-element border border-skin-border text-[10px] text-skin-muted font-mono p-1 break-all overflow-hidden">
                            {att.name}
                        </div>
                    )}
                    <button onClick={() => removeAttachment(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                </div>
             ))}
          </div>
        )}

        <div className="flex gap-2 max-w-4xl mx-auto items-end">
          
          {/* File Upload Button */}
          <button 
             onClick={() => fileInputRef.current?.click()}
             className="h-14 w-10 flex items-center justify-center text-skin-muted hover:text-skin-accent transition-colors"
             title="Attach File"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect}
                accept="image/*,text/*,application/pdf"
             />
          </button>

          {/* Text Area */}
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter inquiry..."
              className="w-full bg-skin-fill-element border border-skin-border text-skin-base p-4 pr-12 font-serif text-lg focus:outline-none focus:border-skin-accent focus:ring-1 focus:ring-skin-accent/20 resize-none h-16 shadow-inner transition-all rounded-sm"
              disabled={isLoading}
            />
            {/* Mic Button Inside Input */}
            <button
               onClick={toggleRecording}
               className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${isRecording ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-skin-muted hover:text-skin-accent'}`}
               title="Speak to Input"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   {isRecording ? (
                        <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" stroke="none" />
                   ) : (
                        <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></>
                   )}
               </svg>
            </button>
          </div>
          
          {/* Send Button */}
          <button 
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && attachments.length === 0)}
            className="h-16 px-6 bg-skin-fill-panel border border-skin-border hover:bg-skin-fill hover:border-skin-accent hover:text-skin-accent text-skin-muted transition-all font-mono uppercase text-sm tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center rounded-sm"
          >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-skin-accent border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <span>Inquire</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatConsole;
