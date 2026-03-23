"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { removeBackground } from "@imgly/background-removal";

export default function Home() {
  const [files, setFiles] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("Download");
  const [selectedPlatform, setSelectedPlatform] = useState("YouTube");
  const [videoUrl, setVideoUrl] = useState("");
  const [previewData, setPreviewData] = useState<{ original: string; result: string; isOpen: boolean } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Download section state
  const [dlLoading, setDlLoading] = useState(false);
  const [dlError, setDlError] = useState("");
  const [dlResult, setDlResult] = useState<any>(null);
  // Per-button download loading state: maps media index to progress 0-100 or -1 for error
  const [dlProgress, setDlProgress] = useState<Record<number, number>>({});

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
    
    // Only animate if refs are present
    if (sidebarRef.current) {
      tl.from(sidebarRef.current, {
        x: -100,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });
    }

    if (headerRef.current) {
      tl.from(
        headerRef.current,
        {
          y: -50,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
        },
        "-=0.7"
      );
    }

    if (heroTextRef.current) {
      tl.from(
        heroTextRef.current,
        {
          y: 30,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
        },
        "-=0.7"
      );
    }

    if (converterWrapperRef.current) {
      tl.from(
        converterWrapperRef.current,
        {
          scale: 0.95,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
        },
        "-=0.7"
      );
    }
  }, []);

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;
    const newFiles = Array.from(incomingFiles).map((file) => ({
      file: file, // Store the actual file object
      name: file.name,
      size: (file.size / 1024).toFixed(1),
      progress: 0,
      status: "idle",
      type: activeCategory,
      targetFormat: activeCategory === 'Images' ? 'PNG' : activeCategory === 'Video' ? 'MP4' : 'PDF'
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleConversion = async (index: number) => {
    const fileItem = files[index];
    if (!fileItem || !fileItem.file) return;

    // Handle background removal first if selected
    if (fileItem.type === 'Images' && fileItem.removeBg) {
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: "converting", progress: 20 } : f))
      );

      try {
        // Run AI background removal on the client
        const resultBlob = await removeBackground(fileItem.file, {
          model: 'isnet_quint8',
          output: {
            format: 'image/png',
            quality: 0.8
          },
          progress: (label: string, p: number) => {
             setFiles((prev) =>
              prev.map((f, i) => (i === index ? { ...f, progress: 20 + (p * 70) } : f))
            );
          }
        });

        const resultUrl = URL.createObjectURL(resultBlob);
        const originalUrl = URL.createObjectURL(fileItem.file);

        setFiles((prev) =>
          prev.map((f, i) => (i === index ? { ...f, progress: 100, status: "download", name: f.name.split('.')[0] + '_no_bg.png' } : f))
        );

        // Show preview automatically
        setPreviewData({
          original: originalUrl,
          result: resultUrl,
          isOpen: true
        });

        // Trigger automatic download
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = resultUrl;
        const newFileName = fileItem.name.split('.')[0] + '_no_bg.png';
        link.download = newFileName;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          // Don't revoke resultUrl immediately so the preview image can still see it
        }, 100);

        return;
      } catch (error) {
        console.error("AI Background removal failed:", error);
      }
    }

    // Standard conversion logic
    if (fileItem.type !== 'Images') {
      simulateSimulation(index);
      return;
    }

    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: "converting", progress: 30 } : f))
    );

    const formData = new FormData();
    formData.append('image', fileItem.file);
    formData.append('targetFormat', fileItem.targetFormat || 'PNG');

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Conversion failed');

      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress: 80 } : f))
      );

      const blob = await response.blob();
      
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress: 100, status: "download" } : f))
      );

      // Trigger automatic download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const newName = fileItem.name.split('.')[0] + '.' + (fileItem.targetFormat?.toLowerCase() || 'png');
      link.setAttribute('download', newName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error during conversion:", error);
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: "idle", progress: 0 } : f))
      );
      alert("Conversion failed. Please try again.");
    }
  };

  const simulateSimulation = (index: number) => {
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

  // ──────────────────────────────────────────────
  // Platform URL validation helpers
  // ──────────────────────────────────────────────
  const platformDomains: Record<string, string[]> = {
    YouTube:   ["youtube.com", "youtu.be"],
    Instagram: ["instagram.com"],
    Facebook:  ["facebook.com", "fb.watch"],
    TikTok:    ["tiktok.com"],
  };

  const isValidUrlForPlatform = (url: string, platform: string): boolean => {
    try {
      const hostname = new URL(url).hostname.replace("www.", "");
      return (platformDomains[platform] || []).some((d) => hostname === d || hostname.endsWith("." + d));
    } catch {
      return false;
    }
  };

  const fetchDownload = async () => {
    setDlError("");
    setDlResult(null);

    if (!videoUrl.trim()) {
      setDlError("Please paste a video URL first.");
      return;
    }

    if (!isValidUrlForPlatform(videoUrl.trim(), selectedPlatform)) {
      setDlError(
        `Invalid URL for ${selectedPlatform}. Please paste a valid ${selectedPlatform} video link. ` +
        `(Expected domains: ${(platformDomains[selectedPlatform] || []).join(", ")})`
      );
      return;
    }

    setDlLoading(true);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl.trim() }),
      });
      const data = await res.json();

      if (data.error || !data.medias || data.medias.length === 0) {
        setDlError(
          data.message ||
          "Could not fetch this video. The link may be private, expired, or unsupported."
        );
      } else {
        setDlResult(data);
      }
    } catch {
      setDlError("Network error. Please check your connection and try again.");
    } finally {
      setDlLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes) return "";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDuration = (ms: number): string => {
    if (!ms) return "";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  /**
   * Client-side download: the browser fetches the video URL directly using the user's
   * own IP address. This bypasses cloud server (Vercel) IP blocks imposed by YouTube's CDN.
   */
  const handleVideoDownload = async (mediaUrl: string, filename: string, idx: number) => {
    setDlProgress(prev => ({ ...prev, [idx]: 0 }));
    try {
      const response = await fetch(mediaUrl, {
        headers: {
          'Accept': '*/*',
        }
      });

      if (!response.ok) {
        throw new Error(`Server responded ${response.status}`);
      }

      // Stream with progress tracking
      const contentLength = Number(response.headers.get('content-length') || 0);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const chunks: Uint8Array<ArrayBuffer>[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          if (contentLength > 0) {
            setDlProgress(prev => ({ ...prev, [idx]: Math.round((received / contentLength) * 100) }));
          } else {
            // Pulse animation when content-length is unknown
            setDlProgress(prev => ({ ...prev, [idx]: Math.min((prev[idx] || 0) + 5, 90) }));
          }
        }
      }

      // Combine chunks and trigger save
      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      setDlProgress(prev => ({ ...prev, [idx]: 100 }));
      setTimeout(() => setDlProgress(prev => { const n = { ...prev }; delete n[idx]; return n; }), 2000);

    } catch (err: any) {
      console.error('[ClientDownload] Failed:', err);
      // Fallback: open in new tab so user can right-click save
      window.open(mediaUrl, '_blank', 'noopener,noreferrer');
      setDlProgress(prev => { const n = { ...prev }; delete n[idx]; return n; });
    }
  };

  const handleFormatChange = (index: number, format: string) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, targetFormat: format } : f));
  };

  const toggleRemoveBg = (index: number) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, removeBg: !f.removeBg } : f));
  };

  return (
    <div className="app-container">
      {/* Sidebar Backdrop */}
      <div 
        className={`sidebar-backdrop ${isSidebarOpen ? 'show' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`} ref={sidebarRef}>
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
                setIsSidebarOpen(false);
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
          <div className="mobile-toggle" onClick={() => setIsSidebarOpen(true)}>☰</div>
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
              {/* Section Header */}
              <div className="hero-text" ref={heroTextRef} style={{ textAlign: 'left', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '36px', height: '36px', background: 'var(--gradient)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Video Downloader</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select platform, paste URL, and download in any quality</p>
                  </div>
                </div>
              </div>

              {/* Platform + URL Input Card */}
              <div className="downloader-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
                <h4 style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '0.9rem' }}>1. Select Platform:</h4>
                <div className="platform-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {platforms.map(p => (
                    <div
                      key={p.name}
                      onClick={() => { setSelectedPlatform(p.name); setDlError(""); setDlResult(null); }}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        border: '2px solid',
                        borderColor: selectedPlatform === p.name ? p.color : 'rgba(0,0,0,0.06)',
                        background: selectedPlatform === p.name ? p.color + '0d' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        boxShadow: selectedPlatform === p.name ? `0 4px 16px ${p.color}22` : 'none'
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
                        <div style={{ width: '18px', height: '18px', background: p.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '9px', fontWeight: 800 }}>✓</div>
                      )}
                    </div>
                  ))}
                </div>

                <h4 style={{ marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem' }}>2. Paste Video URL:</h4>
                <div
                  className="url-input-wrapper"
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    background: '#f8fafc',
                    border: '1.5px solid rgba(0,0,0,0.08)',
                    borderRadius: '1rem',
                    padding: '0.4rem',
                    alignItems: 'center'
                  }}
                >
                  <input
                    type="text"
                    placeholder={`Paste ${selectedPlatform} video URL here...`}
                    value={videoUrl}
                    onChange={(e) => { setVideoUrl(e.target.value); setDlError(""); }}
                    onKeyDown={(e) => e.key === 'Enter' && fetchDownload()}
                    style={{
                      flexGrow: 1,
                      border: 'none',
                      outline: 'none',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      background: 'transparent'
                    }}
                  />
                  <button
                    className="btn-primary gradient-btn"
                    onClick={fetchDownload}
                    disabled={dlLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.5rem',
                      whiteSpace: 'nowrap',
                      fontSize: '0.9rem',
                      opacity: dlLoading ? 0.7 : 1,
                      cursor: dlLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {dlLoading ? (
                      <>
                        <span className="dl-spinner"></span>
                        Fetching...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Get Video
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Card */}
              {dlError && (
                <div className="dl-error-card" style={{ marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ fontSize: '1.4rem', lineHeight: 1 }}>⚠️</div>
                    <div>
                      <p style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.95rem' }}>Could Not Fetch Video</p>
                      <p style={{ fontSize: '0.85rem', opacity: 0.85, lineHeight: 1.5 }}>{dlError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Preview & Download Result Card */}
              {dlResult && (
                <div className="dl-result-card" style={{ marginTop: '1.25rem' }}>
                  {/* Preview Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>Video Found — Confirm &amp; Download</h4>
                  </div>

                  {/* Thumbnail + Meta */}
                  <div className="dl-preview-body">
                    {dlResult.thumbnail && (
                      <div className="dl-thumb-wrap">
                        <img
                          src={dlResult.thumbnail}
                          alt={dlResult.title || 'Video thumbnail'}
                          className="dl-thumb"
                        />
                        {dlResult.duration && (
                          <span className="dl-duration-badge">
                            {formatDuration(dlResult.duration)}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="dl-meta">
                      <p className="dl-title">{dlResult.title || 'Untitled Video'}</p>
                      {dlResult.author && (
                        <p className="dl-author">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          {dlResult.author}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <span className="dl-platform-badge" style={{ background: platforms.find(p => p.name === selectedPlatform)?.color || 'var(--primary)' }}>
                          {selectedPlatform}
                        </span>
                        {dlResult.source && dlResult.source !== selectedPlatform.toLowerCase() && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>via {dlResult.source}</span>
                        )}
                      </div>

                      {/* Download Quality Buttons */}
                      <h5 style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Choose Quality:</h5>
                      <div className="dl-download-grid">
                        {dlResult.medias.map((media: any, idx: number) => {
                          const isAudio = media.type === 'audio';
                          const label = isAudio
                            ? `🎵 Audio — ${media.quality?.toUpperCase() || 'MP3'}`
                            : `⬇️ ${media.quality?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Video'}`;
                          const size = media.data_size ? formatBytes(media.data_size) : '';
                          const ext = (media.extension || (isAudio ? 'mp3' : 'mp4')).toLowerCase();
                          const extLabel = ext.toUpperCase();
                          const safeBase = (dlResult.title || selectedPlatform)
                            .replace(/[^\w\s\-]/g, '')
                            .trim()
                            .replace(/\s+/g, '_')
                            .substring(0, 60) || 'video';
                          const safeQuality = (media.quality || (isAudio ? 'audio' : 'video')).replace(/[^a-z0-9]/gi, '_');
                          const downloadFilename = `${safeBase}_${safeQuality}.${ext}`;

                          const isDownloading = dlProgress[idx] !== undefined && dlProgress[idx] < 100;
                          const isDone = dlProgress[idx] === 100;
                          return (
                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <button
                                onClick={() => !isDownloading && handleVideoDownload(media.url, downloadFilename, idx)}
                                disabled={isDownloading}
                                className={`dl-quality-btn ${isAudio ? 'dl-quality-btn--audio' : 'dl-quality-btn--video'}`}
                                style={{
                                  flex: 1,
                                  cursor: isDownloading ? 'not-allowed' : 'pointer',
                                  border: 'none',
                                  textAlign: 'left',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  opacity: isDownloading ? 0.85 : 1
                                }}
                              >
                                {/* Progress bar fill */}
                                {isDownloading && (
                                  <div style={{
                                    position: 'absolute', inset: 0, left: 0,
                                    width: `${dlProgress[idx]}%`,
                                    background: isAudio ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                                    transition: 'width 0.3s ease',
                                    zIndex: 0
                                  }} />
                                )}
                                <span className="dl-quality-label" style={{ position: 'relative', zIndex: 1 }}>
                                  {isDone ? '✅ Saved!' : isDownloading ? `⬇️ ${dlProgress[idx]}%…` : label}
                                </span>
                                <span className="dl-quality-meta" style={{ position: 'relative', zIndex: 1 }}>
                                  {!isDownloading && extLabel && <span className="dl-quality-ext">{extLabel}</span>}
                                  {!isDownloading && size && <span>{size}</span>}
                                </span>
                              </button>
                              {/* Fallback: open direct URL in new tab */}
                              <a 
                                href={media.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                title="Open direct link in new tab"
                                style={{
                                  padding: '0.6rem 0.75rem',
                                  borderRadius: '0.65rem',
                                  background: '#f1f5f9',
                                  color: '#64748b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1.5px solid rgba(0,0,0,0.05)',
                                  flexShrink: 0,
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    marginTop: '1.25rem', 
                    padding: '0.85rem 1rem', 
                    background: '#f0fdf4', 
                    border: '1px solid #bbf7d0', 
                    borderRadius: '1rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{ fontSize: '1.1rem' }}>💡</div>
                    <p style={{ fontSize: '0.73rem', color: '#166534', lineHeight: 1.5 }}>
                      Downloads happen directly in your browser. If a button fails, click the <strong>↗️</strong> icon to open the video in a new tab, then right-click → <strong>&quot;Save Video As&quot;</strong>.
                    </p>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <>
              <div className="hero-text" ref={heroTextRef} style={{ marginBottom: '1.5rem', paddingTop: '1rem' }}>
                <h2 className="section-title">
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
                              disabled={file.status !== 'idle' || file.removeBg}
                              style={{ padding: '0.3rem 0.5rem', borderRadius: '0.5rem', border: '1px solid #ddd', fontSize: '0.8rem', background: '#f9f9f9', opacity: file.removeBg ? 0.5 : 1 }}
                            >
                              {categories.find(c => c.name === activeCategory)?.formats?.map(fmt => (
                                <option key={fmt} value={fmt}>{fmt}</option>
                              ))}
                            </select>
                          </div>

                          {activeCategory === 'Images' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: '#666' }}>
                                <input 
                                  type="checkbox" 
                                  checked={!!file.removeBg} 
                                  onChange={() => toggleRemoveBg(files.indexOf(file))}
                                  disabled={file.status !== 'idle'}
                                />
                                AI Remove BG
                              </label>
                            </div>
                          )}

                          <div className="progress-container" style={{ flexGrow: 1, margin: "0 1.5rem", background: "#F1F5F9", height: "4px", borderRadius: "2px", position: "relative", overflow: "hidden" }}>
                            <div className="progress-bar" style={{ position: "absolute", left: 0, top: 0, height: "100%", width: file.progress + "%", background: categories.find(c => c.name === activeCategory)?.gradient || "var(--gradient)", transition: "width 0.3s" }}></div>
                          </div>

                          <button
                            className={`btn-primary ${file.status === "download" ? "gradient-btn" : ""}`}
                            style={{ padding: "0.4rem 1.2rem", fontSize: "0.8rem", borderRadius: '0.6rem', background: file.status === 'download' ? (categories.find(c => c.name === activeCategory)?.gradient || 'var(--gradient)') : '#E2E8F0', color: file.status === 'download' ? 'white' : '#64748B' }}
                            onClick={() => file.status === "idle" ? handleConversion(files.indexOf(file)) : null}
                          >
                            {file.status === "idle" ? (file.removeBg ? "Process" : "Convert") : file.status === "converting" ? "..." : "Saved"}
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

      {/* Preview Modal */}
      {previewData?.isOpen && (
        <div className="preview-modal-overlay">
          <div className="preview-modal-card">
            <button 
              onClick={() => setPreviewData(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: '#f1f1f1', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', zIndex: 10 }}
            >×</button>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 className="section-title" style={{ fontSize: '1.6rem' }}>AI Preview</h2>
              <p style={{ color: 'var(--text-muted)' }}>Comparing original image with AI-processed result</p>
            </div>
            <div className="preview-modal-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '0.9rem', color: '#666' }}>Original Image</p>
                <div className="preview-image-container" style={{ background: '#f8fafc', borderRadius: '1.5rem', overflow: 'hidden', height: '350px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={previewData.original} alt="Original" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '0.9rem', color: '#666' }}>Processed Result</p>
                <div className="preview-image-container" style={{ 
                  background: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uPBAp8B927cf8BuS88SXBjTHSAbgw4Y8IAZ6V9S8H98IBIAdAn7U9XAAAAAElFTkSuQmCC")', 
                  borderRadius: '1.5rem', overflow: 'hidden', height: '350px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <img src={previewData.result} alt="Result" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
              <button 
                className="btn-primary gradient-btn" 
                onClick={() => setPreviewData(null)}
                style={{ padding: '0.8rem 3rem', borderRadius: '1rem', fontWeight: 600 }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
