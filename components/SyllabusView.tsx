
import React from 'react';
import { SYLLABUS } from '../constants';
import Logo from './Logo';

interface SyllabusViewProps {
  onQuerySelect: (query: string) => void;
}

const SyllabusView: React.FC<SyllabusViewProps> = ({ onQuerySelect }) => {
  return (
    <div className="h-full overflow-y-auto pr-2 pb-20 font-serif">
      <div className="mb-6 border-b border-skin-border pb-4">
        <h2 className="text-xl font-semibold text-skin-accent mb-1">{SYLLABUS.project_title}</h2>
        <p className="text-skin-muted text-sm italic">Core Concept: {SYLLABUS.core_concept}</p>
      </div>

      <div className="space-y-8">
        {/* Primary Sources EN */}
        <section>
          <h3 className="text-sm font-mono uppercase tracking-widest text-skin-muted mb-3 border-l-2 border-skin-accent pl-3">
            Primary Sources (English)
          </h3>
          <div className="space-y-3 pl-4 border-l border-skin-border ml-[1px]">
            {SYLLABUS.primary_sources_en.map((source, idx) => (
              <div 
                key={idx} 
                className="group cursor-pointer p-2 -ml-2 rounded hover:bg-skin-fill-element transition-all border border-transparent hover:border-skin-border"
                onClick={() => onQuerySelect(`Analyze the text "${source.text}"${source.section ? ` section ${source.section}` : ''}, specifically focusing on ${source.concept_focus}.`)}
                title="Click to analyze source"
              >
                <div className="flex items-center justify-between">
                    <p className="text-skin-base font-medium group-hover:text-skin-accent transition-colors">
                      {source.text} {source.section && <span className="text-skin-muted text-sm">({source.section})</span>}
                    </p>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 text-skin-muted transition-opacity"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                </div>
                <p className="text-xs text-skin-muted mt-1 font-mono">{source.concept_focus}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Primary Sources BN */}
        <section>
          <h3 className="text-sm font-mono uppercase tracking-widest text-skin-muted mb-3 border-l-2 border-skin-accent pl-3">
            Primary Sources (Bengali)
          </h3>
          <div className="space-y-3 pl-4 border-l border-skin-border ml-[1px]">
            {SYLLABUS.primary_sources_bn.map((source, idx) => (
              <div 
                key={idx} 
                className="group cursor-pointer p-2 -ml-2 rounded hover:bg-skin-fill-element transition-all border border-transparent hover:border-skin-border"
                onClick={() => onQuerySelect(`Explain the significance of "${source.text}" by ${source.author} in the context of Nyāya philosophy.`)}
                title="Click to analyze source"
              >
                 <div className="flex items-center justify-between">
                    <p className="text-skin-base font-medium group-hover:text-skin-accent transition-colors">
                      {source.text}
                    </p>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 text-skin-muted transition-opacity"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                 </div>
                <p className="text-xs text-skin-muted mt-1">{source.author}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Secondary Sources - Interactive */}
        <section>
          <h3 className="text-sm font-mono uppercase tracking-widest text-skin-muted mb-3 border-l-2 border-skin-accent pl-3">
            Secondary Sources
          </h3>
          <div className="space-y-4 pl-4 border-l border-skin-border ml-[1px]">
            {SYLLABUS.secondary_sources.map((source, idx) => (
              <div 
                key={idx} 
                className="group cursor-pointer p-2 -ml-2 rounded hover:bg-skin-fill-element transition-all border border-transparent hover:border-skin-border"
                onClick={() => onQuerySelect(`Please summarize ${source.author}'s contributions to the topic of '${source.focus}', citing relevant works.`)}
                title="Click to generate research summary"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-skin-accent font-medium group-hover:text-skin-base transition-colors underline decoration-dotted decoration-skin-muted group-hover:decoration-skin-accent/50 underline-offset-4">
                    {source.author}
                  </p>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 text-skin-muted transition-opacity"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                </div>
                {source.works && (
                  <p className="text-xs text-skin-muted italic mb-1">
                    {source.works.join(", ")}
                  </p>
                )}
                <p className="text-xs text-skin-muted font-mono">{source.focus}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Key Terms */}
        <section>
           <h3 className="text-sm font-mono uppercase tracking-widest text-skin-muted mb-3 border-l-2 border-skin-accent pl-3">
            Key Terminology
          </h3>
          <div className="flex flex-wrap gap-2 pl-4">
            {SYLLABUS.key_terms.map((term, idx) => (
              <button 
                key={idx} 
                onClick={() => onQuerySelect(`Define the term "${term}" within the context of Indian Epistemology.`)}
                className="px-2 py-1 bg-skin-fill-element border border-skin-border text-xs text-skin-accent font-mono rounded-sm hover:bg-skin-accent hover:text-skin-fill transition-colors cursor-pointer"
                title={`Define ${term}`}
              >
                {term}
              </button>
            ))}
          </div>
        </section>

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
    </div>
  );
};

export default SyllabusView;
