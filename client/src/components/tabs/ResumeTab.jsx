import React, { useRef, useEffect, useState } from 'react';

const ResumeTab = ({ optimizationData, isOptimizing, triggerHaptic }) => {
  const resumePreviewRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.85);

  useEffect(() => {
    if (optimizationData && containerRef.current) {
      const updateScale = () => {
        const containerWidth = containerRef.current.offsetWidth - 24;
        const resumeWidth = 850; 
        const newScale = containerWidth / resumeWidth;
        setScale(Math.min(Math.max(newScale * 0.9, 0.5), 1)); 
      };
      updateScale();
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }
  }, [optimizationData]);

  // 🚀 THE "FORCE NAVIGATE" EXPORT (PURE WEB)
  const handleExport = async () => {
    if (!optimizationData?.resume_html) return;
    if (triggerHaptic) { try { triggerHaptic(); } catch (e) {} }

    const btn = document.getElementById('dl-btn');
    if (btn) {
      btn.innerText = "Generating...";
      btn.disabled = true;
    }

    try {
      // 🔗 1. Ensure Library
      if (!window.html2pdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => handleExport();
        document.head.appendChild(script);
        return;
      }

      const element = resumePreviewRef.current;
      const opt = {
        margin: 0,
        filename: 'SkillSync_Resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // 💥 THE FORCE HACK: Convert to Data URL and Redirect
      // Some mobile browsers allow navigation to a PDF string when link.click() fails
      const pdfDataUrl = await window.html2pdf().set(opt).from(element).outputPdf('dataurlstring');
      
      // Attempt 1: Window Open
      const newTab = window.open(pdfDataUrl, '_blank');
      
      // Attempt 2: If Window Open fails, try location replace
      if (!newTab) {
        window.location.href = pdfDataUrl;
      }

    } catch (err) {
      console.error('❌ Export Error:', err);
      alert("Please try long-pressing the resume to save as image or take a screenshot.");
    } finally {
      if (btn) {
        btn.innerText = "Export";
        btn.disabled = false;
      }
    }
  };

  if (isOptimizing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-280px)] animate-fade-in text-center p-6">
        <div className="size-24 rounded-full neu-flat flex items-center justify-center relative mb-8">
          <span className="material-symbols-outlined text-[48px] text-primary animate-pulse">auto_fix_high</span>
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        </div>
        <h3 className="text-xl font-black text-text-main dark:text-white mb-2 italic">Architecting Your Path</h3>
      </div>
    );
  }

  if (!optimizationData) {
    return <div className="p-20 text-center text-text-light italic">No Resume Data. Upload first!</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10 px-2 lg:max-w-4xl lg:mx-auto" ref={containerRef}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col text-left">
          <h2 className="text-2xl font-black text-text-main dark:text-white leading-tight">Resume Lab</h2>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Build Complete</p>
        </div>
        <button
          id="dl-btn"
          onClick={handleExport}
          className="px-6 py-3 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-[0_10px_20px_rgba(226,185,110,0.3)] active:scale-95 transition-all"
        >
          Export
        </button>
      </div>

      <div className="w-full rounded-[2.5rem] neu-flat p-4 overflow-hidden relative h-[560px] lg:h-[calc(100vh-240px)]">
        <div className="w-full h-full overflow-x-auto overflow-y-auto no-scrollbar flex items-start justify-start">
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: '850px',
              minWidth: '850px',
              backgroundColor: 'white',
              minHeight: '1100px',
            }}
            className="rounded shadow-xl"
          >
            <div
              ref={resumePreviewRef}
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: optimizationData.resume_html }}
            />
          </div>
        </div>
      </div>
      
      <p className="text-[10px] text-text-light italic px-4 text-center">
        Tip: If the download menu doesn't appear, you can take a screenshot of the preview above.
      </p>
    </div>
  );
};

export default ResumeTab;
