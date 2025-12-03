
import React, { useState, useEffect } from 'react';
import SyllabusView from './components/SyllabusView';
import HistoryView from './components/HistoryView';
import ChatConsole from './components/ChatConsole';
import Logo from './components/Logo';
import { ChatMessage, Theme, ThemeMode } from './types';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mobileTab, setMobileTab] = useState<'syllabus' | 'console' | 'history'>('console');
  const [requestedQuery, setRequestedQuery] = useState<string>('');
  
  // Theme State
  const [theme, setTheme] = useState<Theme>('scholarly');
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  useEffect(() => {
    // Inject data attributes for CSS variables
    document.body.setAttribute('data-theme', theme);
    document.body.setAttribute('data-mode', mode);
  }, [theme, mode]);

  const handleQueryRequest = (query: string) => {
    setRequestedQuery(query);
    setMobileTab('console');
  };

  const handleQueryHandled = () => {
    setRequestedQuery('');
  };

  const toggleMode = () => {
    setMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-skin-fill text-skin-base overflow-hidden transition-colors duration-300">
      
      {/* Header / Top Bar */}
      <header className="h-14 border-b border-skin-border flex items-center justify-center relative px-6 bg-skin-fill z-30 shrink-0">
        
        {/* Centered Logo Group */}
        <div className="flex items-center gap-6">
           <Logo variant="header" />
           
           {/* Theme Controls (Beside Logo) */}
           <div className="flex items-center gap-2 border-l border-skin-border pl-6 h-6">
              
              {/* Theme Selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className="p-1.5 rounded hover:bg-skin-fill-element text-skin-muted hover:text-skin-accent transition-colors"
                  title="Select Theme"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
                </button>
                
                {/* Theme Menu */}
                {showThemeMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)}></div>
                    <div className="absolute top-8 left-0 w-32 bg-skin-fill-panel border border-skin-border rounded shadow-lg z-50 py-1">
                      <button onClick={() => {setTheme('scholarly'); setShowThemeMenu(false)}} className={`w-full text-left px-3 py-2 text-xs font-mono uppercase tracking-wide hover:bg-skin-fill-element ${theme === 'scholarly' ? 'text-skin-accent' : 'text-skin-muted'}`}>Scholarly</button>
                      <button onClick={() => {setTheme('minimalist'); setShowThemeMenu(false)}} className={`w-full text-left px-3 py-2 text-xs font-mono uppercase tracking-wide hover:bg-skin-fill-element ${theme === 'minimalist' ? 'text-skin-accent' : 'text-skin-muted'}`}>Minimalist</button>
                      <button onClick={() => {setTheme('manuscript'); setShowThemeMenu(false)}} className={`w-full text-left px-3 py-2 text-xs font-mono uppercase tracking-wide hover:bg-skin-fill-element ${theme === 'manuscript' ? 'text-skin-accent' : 'text-skin-muted'}`}>Manuscript</button>
                    </div>
                  </>
                )}
              </div>

              {/* Mode Toggle */}
              <button 
                onClick={toggleMode}
                className="p-1.5 rounded hover:bg-skin-fill-element text-skin-muted hover:text-skin-accent transition-colors"
                title={mode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                 {mode === 'dark' ? (
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                 ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                 )}
              </button>
           </div>
        </div>

        {/* Version Info (Absolute Right) */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-mono text-skin-muted uppercase tracking-widest hidden md:block">
          Research Console v1.0.0 • Nyāya-Buddhist Studies
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 h-full overflow-hidden relative">
        
        {/* Left Panel: Syllabus */}
        <aside className={`${mobileTab === 'syllabus' ? 'block' : 'hidden'} md:block md:col-span-3 border-r border-skin-border bg-skin-fill-panel/50 p-6 overflow-hidden h-full`}>
          <SyllabusView onQuerySelect={handleQueryRequest} />
        </aside>

        {/* Center: Console */}
        <section className={`${mobileTab === 'console' ? 'block' : 'hidden'} md:block md:col-span-6 flex flex-col h-full border-r border-skin-border`}>
          <ChatConsole 
            messages={messages} 
            setMessages={setMessages} 
            requestedQuery={requestedQuery}
            onQueryHandled={handleQueryHandled}
          />
        </section>

        {/* Right Panel: History */}
        <aside className={`${mobileTab === 'history' ? 'block' : 'hidden'} md:block md:col-span-3 bg-skin-fill-panel/50 p-6 overflow-hidden h-full`}>
          <HistoryView messages={messages} onHistorySelect={handleQueryRequest} />
        </aside>

      </main>

      {/* Mobile Nav Footer */}
      <footer className="md:hidden h-16 border-t border-skin-border bg-skin-fill-panel flex justify-around items-center px-4 shrink-0">
         <button 
            onClick={() => setMobileTab('syllabus')} 
            className={`p-2 flex flex-col items-center gap-1 ${mobileTab === 'syllabus' ? 'text-skin-accent' : 'text-skin-muted'}`}
         >
            <span className="text-xs uppercase font-mono tracking-widest">Syllabus</span>
         </button>
         <button 
            onClick={() => setMobileTab('console')} 
            className={`p-2 flex flex-col items-center gap-1 ${mobileTab === 'console' ? 'text-skin-accent' : 'text-skin-muted'}`}
         >
            <span className="text-xs uppercase font-mono tracking-widest">Console</span>
         </button>
         <button 
            onClick={() => setMobileTab('history')} 
            className={`p-2 flex flex-col items-center gap-1 ${mobileTab === 'history' ? 'text-skin-accent' : 'text-skin-muted'}`}
         >
             <span className="text-xs uppercase font-mono tracking-widest">History</span>
         </button>
      </footer>
    </div>
  );
}

export default App;
