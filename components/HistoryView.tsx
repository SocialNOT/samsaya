
import React from 'react';
import { ChatMessage } from '../types';
import Logo from './Logo';

interface HistoryViewProps {
  messages: ChatMessage[];
  onHistorySelect: (query: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ messages, onHistorySelect }) => {
  // Filter only completed user queries for the history list
  const userQueries = messages.filter(m => m.role === 'user');

  return (
    <div className="h-full overflow-y-auto font-mono text-sm pr-2 pb-20">
      <h3 className="text-xs font-bold uppercase tracking-widest text-skin-muted mb-6 border-b border-skin-border pb-2">
        Audit Trail
      </h3>
      
      {userQueries.length === 0 ? (
        <p className="text-skin-muted italic text-xs">No entries recorded.</p>
      ) : (
        <div className="space-y-4">
          {userQueries.map((msg) => (
            <div 
                key={msg.id} 
                className="relative pl-4 border-l border-skin-border hover:border-skin-accent transition-colors group cursor-pointer"
                onClick={() => onHistorySelect(msg.text)}
                title="Click to re-run inquiry"
            >
              <div className="absolute -left-[3px] top-1 w-[5px] h-[5px] rounded-full bg-skin-border group-hover:bg-skin-accent transition-colors"></div>
              <p className="text-skin-muted text-[10px] mb-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-skin-muted truncate group-hover:text-skin-base transition-all duration-300">
                {msg.text}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-skin-border">
        <h4 className="text-xs text-skin-accent mb-2">System Status</h4>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-skin-muted">
          <span>Model:</span> <span className="text-skin-base">gemini-2.5-flash</span>
          <span>Context:</span> <span className="text-skin-base">Loaded</span>
          <span>Syllabus:</span> <span className="text-skin-base">Active</span>
          <span>Vibe:</span> <span className="text-skin-base">Scholarly</span>
        </div>
      </div>

       {/* Developer Credit & Logo */}
       <div className="mt-16 pt-8 border-t border-skin-border flex flex-col items-center text-center opacity-80 hover:opacity-100 transition-opacity duration-500">
           
           <Logo variant="footer" />

           <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-skin-muted mb-4">
             Coded by Rajib Singh
           </p>

           <div className="flex flex-col gap-2 text-[11px] font-mono text-skin-muted">
             <a href="mailto:admin@ilovesundarban.com" className="hover:text-skin-accent transition-colors flex items-center justify-center gap-2 hover:underline decoration-skin-accent/30 underline-offset-4 group">
               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
               admin@ilovesundarban.com
             </a>
             <a href="tel:+917998300083" className="hover:text-skin-accent transition-colors flex items-center justify-center gap-2 hover:underline decoration-skin-accent/30 underline-offset-4 group">
               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
               +91 7998300083
             </a>
             <a href="https://twitter.com/SocialNOT" target="_blank" rel="noopener noreferrer" className="hover:text-skin-accent transition-colors flex items-center justify-center gap-2 hover:underline decoration-skin-accent/30 underline-offset-4 group">
               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
               @SocialNOT
             </a>
           </div>
        </div>
    </div>
  );
};

export default HistoryView;
