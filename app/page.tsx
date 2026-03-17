"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

export default function Home() {
  const [files, setFiles] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("Download");
  const [selectedPlatform, setSelectedPlatform] = useState("YouTube");
  const [videoUrl, setVideoUrl] = useState("");
  const sidebarRef = useRef(null);
  const headerRef = useRef(null);
  const heroTextRef = useRef(null);
  const converterWrapperRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { 
      name: "Download", 
      icon: "⬇️", 
      accept: "" 
    },
    { 
      name: "Documents", 
      icon: "📄", 
      accept: ".pdf,.doc,.docx,.txt",
      titlePrefix: "Document",
      titleSuffix: "Studio",
      subtitle: "Professional document processing & instant conversion",
      formats: ["PDF", "DOC", "DOCX", "TXT", "RTF"],
      gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
    },
    { 
      name: "Images", 
      icon: "🖼️", 
      accept: "image/*",
      titlePrefix: "Image",
      titleSuffix: "Power",
      subtitle: "High-fidelity background removal & format conversion",
      uploadTitle: "Drop Your Image",
      uploadDesc: "Supports Next-Gen formats: WEBP, AVIF, PNG, JPG",
      buttonText: "Select Image",
      formats: ["JPG", "PNG", "WEBP", "GIF", "BMP", "SVG", "ICO", "TIFF"],
      gradient: "linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)"
    },
    { 
      name: "Video", 
      icon: "🎬", 
      accept: "video/*",
      titlePrefix: "Video",
      titleSuffix: "Flow",
      subtitle: "Seamless video detection & lightning-fast conversion",
      uploadTitle: "Drop Your Video",
      uploadDesc: "Supports MP4, WebM, MOV & 50+ other formats",
      buttonText: "Select Video",
      formats: ["MP4", "WebM", "MOV", "AVI", "MKV", "MP3", "WAV"],
      gradient: "linear-gradient(135deg, #0ea5e9 0%, #2dd4bf 100%)"
    },
    { 
      name: "Audio", 
      icon: "🎵", 
      accept: "audio/*",
      titlePrefix: "Audio",
      titleSuffix: "Pulse",
      subtitle: "Lossless audio conversion for every device",
      formats: ["MP3", "WAV", "OGG", "M4A", "FLAC"],
      gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
    },
    { 
      name: "Archive", 
      icon: "📦", 
      accept: ".zip,.rar,.7z",
      titlePrefix: "Archive",
      titleSuffix: "Hub",
      subtitle: "Secure compression & extraction in one click",
      formats: ["ZIP", "RAR", "7Z", "TAR", "GZ"],
      gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)"
    },
  ];

  const platforms = [
    { name: "YouTube", icon: "📺", color: "#FF0000" },
    { name: "Instagram", icon: "📸", color: "#E1306C" },
    { name: "Facebook", icon: "👥", color: "#1877F2" },
    { name: "TikTok", icon: "🎵", color: "#000000" },
  ];

  useEffect(() => {
    // GSAP Entry Animations
    const tl = gsap.timeline();
    tl.from(sidebarRef.current, {
      x: -100,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    })
      .from(
        headerRef.current,
        {
          y: -50,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
        },
        "-=0.7"
      )
      .from(
        heroTextRef.current,
        {
          y: 30,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
        },
        "-=0.7"
      )
      .from(
        converterWrapperRef.current,
        {
          scale: 0.95,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
        },
        "-=0.7"
      );
  }, []);

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;
    const newFiles = Array.from(incomingFiles).map((file) => ({
      name: file.name,
      size: (file.size / 1024).toFixed(1),
      progress: 0,
      status: "idle",
      type: activeCategory,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const simulateConversion = (index: number) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: "converting" } : f))
    );

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress: 100, status: "download", name: f.name.split('.')[0] + '.' + (f.targetFormat || f.name.split('.').pop()) } : f))
      );
    } else {
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress } : f))
      );
    }
  }, 100);
};

const handleFormatChange = (index: number, format: string) => {
  setFiles(prev => prev.map((f, i) => i === index ? { ...f, targetFormat: format } : f));
};

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar" ref={sidebarRef}>
        <div className="logo-area" style={{ marginBottom: '2.5rem' }}>
          <img src="/logo/C_D_logo-removebg-preview.png" alt="C&D Logo" className="logo-img" style={{ filter: 'drop-shadow(0 4px 10px rgba(99, 102, 241, 0.2))' }} />
          <h1 style={{ marginLeft: '12px' }}>C&D Flow</h1>
        </div>
        <nav className="side-nav">
          {categories.map((cat) => (
            <a
              key={cat.name}
              href="#"
              className={activeCategory === cat.name ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                setActiveCategory(cat.name);
              }}
            >
              <span className="icon">{cat.icon}</span> {cat.name}
            </a>
          ))}
        </nav>
        <div className="sidebar-footer" style={{ padding: '1rem' }}>
          <div className="pro-tag" style={{ scale: '0.8', transformOrigin: 'left' }}>PRO</div>
          <p style={{ fontSize: '0.75rem' }}>Unlock all features</p>
          <button className="upgrade-btn" style={{ padding: '0.5rem', fontSize: '0.75rem' }}>Upgrade</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header" ref={headerRef} style={{ padding: '0.5rem 1.5rem', minHeight: '60px' }}>
          <div className="mobile-toggle">☰</div>
          <div className="search-bar" style={{ maxWidth: '300px' }}>
            <input type="text" placeholder="Search..." style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} />
          </div>
          <div className="header-actions">
            <a href="#" className="nav-link" style={{ fontSize: '0.85rem' }}>Pricing</a>
            <a href="#" className="nav-link" style={{ fontSize: '0.85rem' }}>FAQ</a>
            <button className="btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Sign In</button>
            <button className="btn-primary gradient-btn" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Start Converting</button>
          </div>
        </header>

        {/* Hero & Converter Zone */}
        <section className="hero-section">
          {activeCategory === "Download" ? (
            <div className="download-container" style={{ textAlign: 'left', maxWidth: '900px', margin: '0 auto', paddingTop: '1rem' }}>
              <div className="hero-text" ref={heroTextRef} style={{ textAlign: 'left', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ width: '36px', height: '36px', background: 'var(--gradient)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)' }}>
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                   </div>
                   <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Video Downloader</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select platform and paste video URL</p>
                   </div>
                </div>
              </div>

              <div className="downloader-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '1.5rem', boxShadow: 'var(--shadow)' }}>
                <h4 style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '0.9rem' }}>Supported Platforms:</h4>
                <div className="platform-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {platforms.map(p => (
                    <div 
                      key={p.name}
                      onClick={() => setSelectedPlatform(p.name)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        border: '1px solid',
                        borderColor: selectedPlatform === p.name ? p.color + '40' : 'rgba(0,0,0,0.05)',
                        background: selectedPlatform === p.name ? p.color + '08' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1rem', display: 'flex' }}>
                          {p.name === 'YouTube' && <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>}
                          {p.name === 'Instagram' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>}
                          {p.name === 'Facebook' && <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
                          {p.name === 'TikTok' && <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.24-.11-.47-.24-.7-.37V15.51c0 2.97-1.54 5.51-4.66 6.31-2.99.77-6.24-.35-7.72-3.12-1.48-2.77-.54-6.49 2.22-8.02 1.18-.65 2.52-.9 3.83-.86V13.56c-.78-.05-1.58.02-2.3.36-1.04.48-1.74 1.56-1.74 2.7 0 1.48 1.1 2.87 2.6 2.97 1.5.1 3.03-1.03 3.03-2.55V.02z"/></svg>}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</span>
                      </div>
                      {selectedPlatform === p.name && (
                        <div style={{ width: '16px', height: '16px', background: p.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '8px' }}>✓</div>
                      )}
                    </div>
                  ))}
                </div>

                <div 
                  className="url-input-wrapper" 
                  style={{ 
                    display: 'flex', 
                    gap: '0.75rem',
                    background: 'white',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '1rem',
                    padding: '0.4rem',
                    alignItems: 'center'
                  }}
                >
                  <input 
                    type="text" 
                    placeholder={`Paste ${selectedPlatform} video URL here...`}
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    style={{
                      flexGrow: 1,
                      border: 'none',
                      outline: 'none',
                      padding: '0.75rem',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button 
                    className="btn-primary gradient-btn"
                    onClick={() => {
                      if (videoUrl) {
                        const fileName = `${selectedPlatform}_Video_${Math.random().toString(36).substring(7)}.mp4`;
                        const newFile = {
                          name: fileName,
                          size: (Math.random() * 50 + 10).toFixed(1) + ' MB',
                          progress: 0,
                          status: 'idle',
                          type: 'Download'
                        };
                        setFiles(prev => [...prev, newFile]);
                        setVideoUrl("");
                        const newIndex = files.length;
                        setTimeout(() => simulateConversion(newIndex), 500);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 1.5rem',
                      whiteSpace: 'nowrap',
                      fontSize: '0.9rem'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Get Video
                  </button>
                </div>
              </div>

              <div className="recent-files" style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Recent Downloads</h4>
                <div className="file-list">
                  {files.filter(f => f.type === "Download").length === 0 ? (
                    <div className="file-item-empty" style={{ padding: '1rem', fontSize: '0.85rem' }}>No downloads yet</div>
                  ) : (
                    files.filter(f => f.type === "Download").map((file, index) => (
                      <div
                        key={index}
                        className="file-item"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.75rem 1rem",
                          background: "white",
                          border: "1px solid rgba(0,0,0,0.05)",
                          borderRadius: "1rem",
                          marginBottom: "0.5rem",
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "32px", height: "32px", background: "#8B5CF615", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: '1rem' }}>⬇️</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.85rem", maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{file.size}</div>
                          </div>
                        </div>
                        <div className="progress-container" style={{ flexGrow: 1, margin: "0 1.5rem", background: "#f1f1f1", height: "4px", borderRadius: "2px", overflow: "hidden" }}>
                          <div className="progress-bar" style={{ height: "100%", width: file.progress + "%", background: "var(--gradient)", transition: "width 0.3s" }}></div>
                        </div>
                        <button
                          className={`btn-primary ${file.status === "download" ? "gradient-btn" : ""}`}
                          style={{ padding: "0.4rem 1rem", fontSize: "0.75rem", borderRadius: '0.5rem' }}
                          onClick={() => file.status === "idle" ? simulateConversion(files.indexOf(file)) : null}
                        >
                          {file.status === "idle" ? "Fetch" : file.status === "converting" ? "..." : "Save"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="hero-text" ref={heroTextRef} style={{ marginBottom: '1.5rem', paddingTop: '1rem' }}>
                <h2 className="hero-title" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: activeCategory === 'Images' ? '#FF3366' : activeCategory === 'Video' ? '#3366FF' : 'var(--primary)', fontWeight: 800 }}>
                    {categories.find(c => c.name === activeCategory)?.titlePrefix}
                  </span>{" "}
                  <span style={{ fontWeight: 700 }}>{categories.find(c => c.name === activeCategory)?.titleSuffix || activeCategory}</span>
                </h2>
                <p className="hero-subtitle" style={{ fontSize: '1rem', opacity: 0.7 }}>
                  {categories.find(c => c.name === activeCategory)?.subtitle}
                </p>
              </div>

              <div className="converter-wrapper" ref={converterWrapperRef} style={{ maxWidth: '900px', margin: '0 auto' }}>
                <div
                  className="drop-zone"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("drag-over"); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove("drag-over"); }}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("drag-over"); handleFiles(e.dataTransfer.files); }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '1.5px dashed rgba(0,0,0,0.1)',
                    background: 'white',
                    borderRadius: '2rem',
                    padding: '2rem 1.5rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  <div className="drop-zone-content">
                    <div className="upload-icon" style={{ 
                      width: '80px', height: '80px', 
                      background: categories.find(c => c.name === activeCategory)?.gradient || 'var(--gradient)',
                      borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', margin: '0 auto 1.5rem',
                      boxShadow: '0 15px 30px -5px rgba(99, 102, 241, 0.3)',
                      transition: 'transform 0.3s ease'
                    }}>
                      {activeCategory === 'Images' ? (
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      ) : activeCategory === 'Video' ? (
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-2 14.5v-9l6 4.5z"/></svg>
                      ) : (
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>{categories.find(c => c.name === activeCategory)?.uploadTitle || `Upload ${activeCategory}`}</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>{categories.find(c => c.name === activeCategory)?.uploadDesc}</p>
                    <input type="file" id="fileInput" hidden multiple ref={fileInputRef} accept={categories.find(c => c.name === activeCategory)?.accept} onChange={(e) => handleFiles(e.target.files)} />
                    
                    <button className="btn-primary" style={{ 
                      background: categories.find(c => c.name === activeCategory)?.gradient || 'var(--gradient)',
                      padding: '1rem 2.5rem', fontSize: '1rem', fontWeight: 600, borderRadius: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      {categories.find(c => c.name === activeCategory)?.buttonText || `Upload ${activeCategory}`}
                    </button>

                    <div className="format-tags" style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                      {categories.find(c => c.name === activeCategory)?.formats?.map(f => (
                        <span key={f} style={{ padding: '0.3rem 0.75rem', background: '#F3F4F6', borderRadius: '1.5rem', fontSize: '0.7rem', fontWeight: 600, color: '#6B7280', border: '1px solid rgba(0,0,0,0.05)' }}>{f}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="recent-files">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    <span style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%' }}></span>
                    Filtered by: {activeCategory}
                  </h4>
                  <div className="file-list">
                    {files.filter(f => f.type === activeCategory).length === 0 ? (
                      <div className="file-item-empty" style={{ padding: '1rem', fontSize: '0.85rem' }}>No {activeCategory.toLowerCase()} uploaded yet</div>
                    ) : (
                      files.filter(f => f.type === activeCategory).map((file, index) => (
                        <div
                          key={index}
                          className="file-item"
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.8rem 1rem", background: "white", border: "1px solid rgba(0,0,0,0.05)", borderRadius: "1rem", marginBottom: "0.5rem", boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                            <div style={{ width: "36px", height: "36px", background: (categories.find(c => c.name === activeCategory)?.gradient || 'var(--gradient)') + '15', borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: categories.find(c => c.name === activeCategory)?.gradient?.split(' ')[1] || 'var(--primary)', fontSize: '1rem' }}>
                              {categories.find(c => c.name === activeCategory)?.icon || "📄"}
                            </div>
                            <div style={{ maxWidth: '120px' }}>
                              <div style={{ fontWeight: 600, fontSize: "0.85rem", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{file.size} KB</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666' }}>Convert to:</span>
                            <select 
                              value={file.targetFormat || categories.find(c => c.name === activeCategory)?.formats?.[0] || 'PDF'}
                              onChange={(e) => handleFormatChange(files.indexOf(file), e.target.value)}
                              disabled={file.status !== 'idle'}
                              style={{ padding: '0.3rem 0.5rem', borderRadius: '0.5rem', border: '1px solid #ddd', fontSize: '0.8rem', background: '#f9f9f9' }}
                            >
                              {categories.find(c => c.name === activeCategory)?.formats?.map(fmt => (
                                <option key={fmt} value={fmt}>{fmt}</option>
                              ))}
                            </select>
                          </div>

                          <div className="progress-container" style={{ flexGrow: 1, margin: "0 1.5rem", background: "#F1F5F9", height: "4px", borderRadius: "2px", position: "relative", overflow: "hidden" }}>
                            <div className="progress-bar" style={{ position: "absolute", left: 0, top: 0, height: "100%", width: file.progress + "%", background: categories.find(c => c.name === activeCategory)?.gradient || "var(--gradient)", transition: "width 0.3s" }}></div>
                          </div>

                          <button
                            className={`btn-primary ${file.status === "download" ? "gradient-btn" : ""}`}
                            style={{ padding: "0.4rem 1.2rem", fontSize: "0.8rem", borderRadius: '0.6rem', background: file.status === 'download' ? (categories.find(c => c.name === activeCategory)?.gradient || 'var(--gradient)') : '#E2E8F0', color: file.status === 'download' ? 'white' : '#64748B' }}
                            onClick={() => file.status === "idle" ? simulateConversion(files.indexOf(file)) : null}
                          >
                            {file.status === "idle" ? "Convert" : file.status === "converting" ? "..." : "Save"}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
