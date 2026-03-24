"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { removeBackground } from "@imgly/background-removal";
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

// Document Tools List (ilovepdf style)
const pdfTools = [
  { id: 'merge', title: 'Merge PDF', desc: 'Combine PDFs in the order you want with the easiest PDF merger available.', color: '#E2574C', accept: '.pdf', uploadTitle: 'Select PDFs to merge', buttonText: 'Select PDFs', formats: ['PDF'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg> },
  { id: 'split', title: 'Split PDF', desc: 'Separate one page or a whole set for easy conversion into independent PDF files.', color: '#F18F2E', accept: '.pdf', uploadTitle: 'Select PDF to split', buttonText: 'Select PDF', formats: ['ZIP', 'PDF'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg> },
  { id: 'compress', title: 'Compress PDF', desc: 'Reduce file size while optimizing for maximal PDF quality.', color: '#4CAF50', accept: '.pdf', uploadTitle: 'Select PDF to compress', buttonText: 'Select PDF', formats: ['PDF'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg> },
  { id: 'pdf-to-word', title: 'PDF to Word', desc: 'Easily convert your PDF files into easy to edit DOC and DOCX documents.', color: '#2B579A', accept: '.pdf', uploadTitle: 'Select PDF to Word', buttonText: 'Select PDF', formats: ['DOCX'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15v-6M15 15v-6M9 12h6"/></svg> },
  { id: 'pdf-to-ppt', title: 'PDF to PowerPoint', desc: 'Turn your PDF files into easy to edit PPT and PPTX slideshows.', color: '#D24726', accept: '.pdf', uploadTitle: 'Select PDF to PowerPoint', buttonText: 'Select PDF', formats: ['PPTX'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
  { id: 'pdf-to-excel', title: 'PDF to Excel', desc: 'Pull data straight from PDFs into Excel spreadsheets in a few short seconds.', color: '#217346', accept: '.pdf', uploadTitle: 'Select PDF to Excel', buttonText: 'Select PDF', formats: ['XLSX'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/></svg> },
  { id: 'word-to-pdf', title: 'Word to PDF', desc: 'Make DOC and DOCX files easy to read by converting them to PDF.', color: '#E2574C', accept: '.doc,.docx', uploadTitle: 'Select Word files', buttonText: 'Select Word files', formats: ['PDF'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg> },
  { id: 'pdf-to-jpg', title: 'PDF to JPG', desc: 'Convert each PDF page into a JPG or extract all images contained in a PDF.', color: '#FFB800', accept: '.pdf', uploadTitle: 'Select PDF to JPG', buttonText: 'Select PDF', formats: ['JPG', 'PNG'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
  { id: 'jpg-to-pdf', title: 'JPG to PDF', desc: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.', color: '#E2574C', accept: '.jpg,.jpeg,.png,.webp', uploadTitle: 'Select Images', buttonText: 'Select Images', formats: ['PDF'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
  { id: 'edit', title: 'Edit PDF', desc: 'Add text, images, shapes or freehand annotations to a PDF document. Edit the size, font, and color.', color: '#9C27B0', accept: '.pdf', uploadTitle: 'Select PDF to edit', buttonText: 'Select PDF', formats: ['PDF'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
  { id: 'watermark', title: 'Watermark', desc: 'Stamp an image or text over your PDF in seconds.', color: '#5C5C5C', accept: '.pdf', uploadTitle: 'Select PDF to watermark', buttonText: 'Select PDF', formats: ['PDF'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg> },
  { id: 'protect', title: 'Protect PDF', desc: 'Encrypt PDF documents with a password to prevent unauthorized access.', color: '#00BCD4', accept: '.pdf', uploadTitle: 'Select PDF to encrypt', buttonText: 'Select PDF', formats: ['PDF'], icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
];

export default function Home() {
  const [files, setFiles] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("Download");
  const [activeDocumentTool, setActiveDocumentTool] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState("YouTube");
  const [videoUrl, setVideoUrl] = useState("");
  const [previewData, setPreviewData] = useState<{ original: string; result: string; isOpen: boolean } | null>(null);
  const [docPreview, setDocPreview] = useState<{ fileName: string; contentTitle: string; contentBody: string; downloadUrl: string; isOpen: boolean } | null>(null);
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
      documentTool: activeCategory === 'Documents' ? activeDocumentTool : null,
      targetFormat: activeCategory === 'Images' ? 'PNG' : activeCategory === 'Video' ? 'MP4' : (activeDocumentTool ? pdfTools.find(t => t.id === activeDocumentTool)?.formats[0] : 'PDF') || 'PDF'
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

    // Document active tool logic (Client-Side)
    if (fileItem.type === 'Documents' && activeDocumentTool) {
      if (activeDocumentTool === 'split') {
        try {
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: "converting", progress: 20 } : f));
          
          const arrayBuffer = await fileItem.file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          const numberOfPages = pdfDoc.getPageCount();

          if (numberOfPages <= 1) {
            alert("This PDF only has 1 page, cannot split.");
            setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: "idle", progress: 0 } : f));
            return;
          }

          setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 50 } : f));

          const zip = new JSZip();
          const baseName = fileItem.name.replace(/\.[^/.]+$/, "");

          // Extract each page into a separate PDF
          for (let p = 0; p < numberOfPages; p++) {
            const newPdf = await PDFDocument.create();
            const [copiedPage] = await newPdf.copyPages(pdfDoc, [p]);
            newPdf.addPage(copiedPage);
            const pdfBytes = await newPdf.save();
            zip.file(`${baseName}_page_${p + 1}.pdf`, pdfBytes);
            
            // visually update progress incrementally
            if (p % 5 === 0) {
               setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 50 + Math.floor((p / numberOfPages) * 30) } : f));
            }
          }

          setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 85 } : f));

          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const zipUrl = URL.createObjectURL(zipBlob);
          
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 100, status: 'download' } : f));
          
          const link = document.createElement('a');
          link.href = zipUrl;
          link.setAttribute('download', `${baseName}_split.zip`);
          document.body.appendChild(link);
          link.click();
          setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(zipUrl); }, 5000);
          
          return;
        } catch (err: any) {
          console.error("PDF Split Error:", err);
          alert("Failed to split PDF: " + (err.message || "Unknown error"));
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: "idle", progress: 0 } : f));
          return;
        }
      }

      if (activeDocumentTool === 'watermark') {
        try {
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: "converting", progress: 20 } : f));
          
          const arrayBuffer = await fileItem.file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          const pages = pdfDoc.getPages();
          
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 50 } : f));

          // Simple text watermark
          const { rgb, degrees } = await import('pdf-lib');
          for (const page of pages) {
            const { width, height } = page.getSize();
            page.drawText('WATERMARKED', {
              x: width / 2 - 180,
              y: height / 2 - 50,
              size: 60,
              color: rgb(0.8, 0.2, 0.2),
              opacity: 0.3,
              rotate: degrees(45)
            });
          }
          
          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
          
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 100, status: 'download' } : f));
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileItem.name.replace(/\.[^/.]+$/, "_watermarked.pdf"));
          document.body.appendChild(link);
          link.click();
          setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 5000);
          return;
        } catch (err: any) {
          console.error("Watermark Error:", err);
          alert("Failed to add Watermark: " + (err.message || "Unknown error"));
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: "idle", progress: 0 } : f));
          return;
        }
      }

      if (activeDocumentTool === 'word-to-pdf') {
        try {
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: "converting", progress: 20 } : f));
          const arrayBuffer = await fileItem.file.arrayBuffer();
          
          // dynamic import to avoid SSR 'window not defined' errors
          const mammoth = (await import('mammoth')).default || await import('mammoth');
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 50 } : f));
          
          const result = await mammoth.convertToHtml({ arrayBuffer });
          const html = `<html><body style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">${result.value}</body></html>`;
          
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 75 } : f));

          const html2pdf = (await import('html2pdf.js')).default;
          const element = document.createElement('div');
          element.innerHTML = html;
          
          const opt = {
            margin: 0.5,
            filename: fileItem.name.replace(/\.docx?$/i, '.pdf'),
            image: { type: 'jpeg' as 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as 'portrait' }
          };
          
          // html2pdf returns a promise that resolves when saving is complete
          await html2pdf().set(opt).from(element).save();
          
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 100, status: 'download' } : f));
          return;
        } catch (err: any) {
          console.error("Word to PDF Error:", err);
          alert('Failed to convert Word to PDF: ' + err.message);
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: "idle", progress: 0 } : f));
          return;
        }
      }

      if (activeDocumentTool === 'excel-to-pdf') {
        try {
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: "converting", progress: 20 } : f));
          const arrayBuffer = await fileItem.file.arrayBuffer();
          const XLSX = await import('xlsx');
          
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const htmlOutput = XLSX.utils.sheet_to_html(worksheet);
          
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 60 } : f));

          const html2pdf = (await import('html2pdf.js')).default;
          const element = document.createElement('div');
          element.innerHTML = `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>${firstSheetName}</h2>${htmlOutput}</div>`;
          
          const tables = element.getElementsByTagName('table');
          for(let i=0; i<tables.length; i++) {
            tables[i].style.borderCollapse = 'collapse';
            tables[i].style.width = '100%';
            tables[i].border = '1';
            tables[i].cellPadding = '5';
          }
          
          const opt = {
            margin: 0.5,
            filename: fileItem.name.replace(/\.xlsx?$/i, '.pdf'),
            image: { type: 'jpeg' as 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' as 'landscape' }
          };
          
          await html2pdf().set(opt).from(element).save();
          
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 100, status: 'download' } : f));
          return;
        } catch (err: any) {
          console.error("Excel to PDF Error:", err);
          alert('Failed to convert Excel to PDF: ' + err.message);
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: "idle", progress: 0 } : f));
          return;
        }
      }

      if (activeDocumentTool === 'jpg-to-pdf') {
        try {
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: "converting", progress: 20 } : f));
          
          const arrayBuffer = await fileItem.file.arrayBuffer();
          const pdfDoc = await PDFDocument.create();
          
          let image;
          if (fileItem.file.type === 'image/jpeg' || fileItem.name.toLowerCase().endsWith('.jpg') || fileItem.name.toLowerCase().endsWith('.jpeg')) {
             image = await pdfDoc.embedJpg(arrayBuffer);
          } else {
             image = await pdfDoc.embedPng(arrayBuffer);
          }
          
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 60 } : f));

          const page = pdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
          
          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
          
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 100, status: 'download' } : f));
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileItem.name.replace(/\.[^/.]+$/, ".pdf"));
          document.body.appendChild(link);
          link.click();
          setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 5000);
          return;
        } catch (err: any) {
          console.error("JPG to PDF Error:", err);
          alert('Failed to convert Image to PDF: ' + err.message);
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: "idle", progress: 0 } : f));
          return;
        }
      }

      if (activeDocumentTool === 'pdf-to-word') {
        try {
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: "converting", progress: 20 } : f));

          const formData = new FormData();
          formData.append('file', fileItem.file, fileItem.name);

          setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 50 } : f));

          const response = await fetch('/api/pdf-to-docx', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            throw new Error(errJson.error || `Server error: ${response.status}`);
          }

          setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 90 } : f));

          const blob = await response.blob();
          const newName = fileItem.name.replace(/\.pdf$/i, '.docx');
          const url = URL.createObjectURL(blob);

          setFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 100, status: 'download' } : f));

          // Trigger download with correct filename
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', newName);
          document.body.appendChild(link);
          link.click();
          setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 5000);

          return;

        } catch (err: any) {
          console.error("PDF to Word Error:", err);
          alert('Failed to convert PDF to Word: ' + err.message);
          setFiles(prev => prev.map((f, i) => i === index ? { ...f, status: "idle", progress: 0 } : f));
          return;
        }
      }

      simulateSimulation(index);
      return;
    }

    // Standard fallback logic
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
      setTimeout(() => {
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 5000);

    } catch (error) {
      console.error("Error during conversion:", error);
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: "idle", progress: 0 } : f))
      );
      alert("Conversion failed. Please try again.");
    }
  };

  const simulateSimulation = (index: number) => {
    // Capture file info immediately (before any async state updates) to avoid stale closure inside setInterval
    const fileItem = files[index];
    const ext = fileItem?.targetFormat?.toLowerCase() || fileItem?.name?.split('.').pop()?.toLowerCase() || 'bin';
    const newName = (fileItem?.name?.split('.')[0] || 'file') + '_simulated.' + ext;

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
          prev.map((f, i) => (i === index ? { ...f, progress: 100, status: "download", name: newName } : f))
        );

        let dummyContent = `This is a simulated ${ext.toUpperCase()} output file.\nDeep document parsing requires a backend API.`;
        let mimeType = 'text/plain';

        if (['doc', 'docx'].includes(ext)) {
           dummyContent = `<html><body style="font-family: Arial, sans-serif; padding: 40px;"><h2>Simulated PDF to Word Conversion</h2><p>This is a simulated DOC output for <b>${fileItem?.name}</b>.</p></body></html>`;
           mimeType = 'application/msword';
        } else if (['xls', 'xlsx'].includes(ext)) {
           dummyContent = `<html><body><table><tr><th>Simulated Excel Conversion</th></tr><tr><td>File: ${fileItem?.name}</td></tr></table></body></html>`;
           mimeType = 'application/vnd.ms-excel';
        }

        const blob = new Blob([dummyContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', newName);
        document.body.appendChild(link);
        link.click();
        setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 5000);
      } else {
        setFiles((prev) =>
          prev.map((f, i) => (i === index ? { ...f, progress } : f))
        );
      }
    }, 100);
  };

  const handleMergePdfs = async () => {
    const docs = files.filter(f => f.type === 'Documents');
    if (docs.length < 2) {
      alert("Please select at least 2 PDFs to merge.");
      return;
    }

    try {
      setFiles(prev => prev.map(f => f.type === 'Documents' ? { ...f, status: "converting", progress: 20 } : f));
      
      const mergedPdf = await PDFDocument.create();
      
      for (let i = 0; i < docs.length; i++) {
        const fileItem = docs[i];
        const arrayBuffer = await fileItem.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        
        setFiles(prev => prev.map(f => f.type === 'Documents' ? { ...f, progress: 20 + Math.floor(((i + 1) / docs.length) * 60) } : f));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setFiles(prev => prev.map(f => f.type === 'Documents' ? { ...f, progress: 100, status: 'download' } : f));

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `merged_document_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 5000);

    } catch (err: any) {
      console.error("PDF Merge Error:", err);
      alert("Failed to merge PDFs. Are you sure they are valid PDF files?");
      setFiles(prev => prev.map(f => f.type === 'Documents' ? { ...f, status: "idle", progress: 0 } : f));
    }
  };

  const handleDeleteFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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

  // Build proxy URL that streams through the server
  const buildProxyUrl = (directUrl: string, quality: string, ext: string, title: string): string => {
    const safeTitle = (title || 'video')
      .replace(/[^\w\d\-_]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .substring(0, 50);
    const safeQuality = (quality || 'video').replace(/[^a-z0-9]/gi, '_');
    const filename = `${safeTitle}_${safeQuality}.${ext || 'mp4'}`;
    const params = new URLSearchParams({
      url: directUrl,
    });
    // Appending filename to the URL path ensures browsers save it with the correct extension
    return `/api/proxy-download/${encodeURIComponent(filename)}?${params.toString()}`;
  };

  const handleFormatChange = (index: number, format: string) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, targetFormat: format } : f));
  };

  const toggleRemoveBg = (index: number) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, removeBg: !f.removeBg } : f));
  };

  const activeToolData = activeDocumentTool ? pdfTools.find(t => t.id === activeDocumentTool) : null;
  const currentCategory = categories.find(c => c.name === activeCategory);
  const displayTitle = activeToolData?.uploadTitle || currentCategory?.uploadTitle || `Upload ${activeCategory}`;
  const displayDesc = activeToolData?.desc || currentCategory?.uploadDesc;
  const displayAccept = activeToolData?.accept || currentCategory?.accept;
  const displayButtonText = activeToolData?.buttonText || currentCategory?.buttonText || `Upload ${activeCategory}`;
  const displayFormats = activeToolData?.formats || currentCategory?.formats || [];
  const primaryBg = activeToolData ? activeToolData.color : (currentCategory?.gradient || 'var(--gradient)');

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
                setActiveDocumentTool(null);
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

                          return (
                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <a
                                href={media.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`dl-quality-btn ${isAudio ? 'dl-quality-btn--audio' : 'dl-quality-btn--video'}`}
                                style={{ flex: 1 }}
                                title="Open video to download manually"
                              >
                                <span className="dl-quality-label">{label}</span>
                                <span className="dl-quality-meta">
                                  {extLabel && <span className="dl-quality-ext">{extLabel}</span>}
                                  {size && <span>{size}</span>}
                                </span>
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
          ) : activeCategory === 'Documents' && !activeDocumentTool ? (
            <>
              <div className="hero-text" ref={heroTextRef} style={{ marginBottom: '1.5rem', paddingTop: '1rem' }}>
                <h2 className="section-title">
                  <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Document</span>{" "}
                  <span style={{ fontWeight: 700 }}>Studio</span>
                </h2>
                <p className="hero-subtitle" style={{ fontSize: '1rem', opacity: 0.7 }}>
                  Every tool you need to work with PDFs in one place
                </p>
              </div>

              <div className="pdf-tools-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                maxWidth: '1100px',
                margin: '0 auto',
                paddingBottom: '2rem'
              }}>
                {pdfTools.map(tool => (
                  <div key={tool.id} onClick={() => setActiveDocumentTool(tool.id)} style={{
                    background: 'white',
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = tool.color + '40'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)'; }}
                  >
                    <div style={{ color: tool.color, marginBottom: '0.25rem' }}>
                      {tool.icon}
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{tool.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{tool.desc}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {activeDocumentTool && (
                <div style={{ marginBottom: '1rem' }}>
                  <button onClick={() => setActiveDocumentTool(null)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    Back to all PDF tools
                  </button>
                </div>
              )}
              
              <div className="hero-text" ref={heroTextRef} style={{ marginBottom: '1.5rem', paddingTop: '1rem' }}>
                <h2 className="section-title">
                  <span style={{ color: activeDocumentTool ? pdfTools.find(t => t.id === activeDocumentTool)?.color : (activeCategory === 'Images' ? '#FF3366' : activeCategory === 'Video' ? '#3366FF' : 'var(--primary)'), fontWeight: 800 }}>
                    {activeDocumentTool ? pdfTools.find(t => t.id === activeDocumentTool)?.title.split(' ')[0] : categories.find(c => c.name === activeCategory)?.titlePrefix}
                  </span>{" "}
                  <span style={{ fontWeight: 700 }}>
                    {activeDocumentTool ? pdfTools.find(t => t.id === activeDocumentTool)?.title.split(' ').slice(1).join(' ') : (categories.find(c => c.name === activeCategory)?.titleSuffix || activeCategory)}
                  </span>
                </h2>
                <p className="hero-subtitle" style={{ fontSize: '1rem', opacity: 0.7 }}>
                  {activeDocumentTool ? pdfTools.find(t => t.id === activeDocumentTool)?.desc : categories.find(c => c.name === activeCategory)?.subtitle}
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
                      background: primaryBg,
                      borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', margin: '0 auto 1.5rem',
                      boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.15)',
                      transition: 'transform 0.3s ease'
                    }}>
                      {activeToolData ? (
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>
                      ) : activeCategory === 'Images' ? (
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      ) : activeCategory === 'Video' ? (
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-2 14.5v-9l6 4.5z"/></svg>
                      ) : (
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>{displayTitle}</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>{displayDesc}</p>
                    <input type="file" id="fileInput" hidden multiple ref={fileInputRef} accept={displayAccept} onChange={(e) => handleFiles(e.target.files)} />
                    
                    <button className="btn-primary" style={{ 
                      background: primaryBg,
                      padding: '1rem 2.5rem', fontSize: '1rem', fontWeight: 600, borderRadius: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto',
                      border: 'none', color: 'white'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      {displayButtonText}
                    </button>

                    <div className="format-tags" style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                      {displayFormats.map(f => (
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
                    {files.filter(f => f.type === activeCategory && (activeCategory !== 'Documents' || f.documentTool === activeDocumentTool)).length === 0 ? (
                      <div className="file-item-empty" style={{ padding: '1rem', fontSize: '0.85rem' }}>No files uploaded yet</div>
                    ) : (
                      files.filter(f => f.type === activeCategory && (activeCategory !== 'Documents' || f.documentTool === activeDocumentTool)).map((file, index) => (
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
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666' }}>{displayFormats.length === 1 && displayFormats[0] === 'PDF' && ['merge', 'split', 'compress', 'watermark', 'protect', 'edit'].includes(activeDocumentTool || '') ? 'Output:' : 'Convert to:'}</span>
                            <select 
                              value={file.targetFormat || displayFormats[0] || 'PDF'}
                              onChange={(e) => handleFormatChange(files.indexOf(file), e.target.value)}
                              disabled={file.status !== 'idle' || file.removeBg || displayFormats.length <= 1}
                              style={{ padding: '0.3rem 0.5rem', borderRadius: '0.5rem', border: '1px solid #ddd', fontSize: '0.8rem', background: '#f9f9f9', opacity: (file.removeBg || displayFormats.length <= 1) ? 0.7 : 1, cursor: displayFormats.length <= 1 ? 'not-allowed' : 'pointer' }}
                            >
                              {displayFormats.map(fmt => (
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
                            <div className="progress-bar" style={{ position: "absolute", left: 0, top: 0, height: "100%", width: file.progress + "%", background: primaryBg, transition: "width 0.3s" }}></div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {activeDocumentTool !== 'merge' && (
                              <button
                                className={`btn-primary ${file.status === "download" ? "gradient-btn" : ""}`}
                                style={{ padding: "0.4rem 1.2rem", fontSize: "0.8rem", borderRadius: '0.6rem', background: file.status === 'download' ? primaryBg : '#E2E8F0', color: file.status === 'download' ? 'white' : '#64748B', border: 'none' }}
                                onClick={() => file.status === "idle" ? handleConversion(files.indexOf(file)) : null}
                              >
                                {file.status === "idle" ? (file.removeBg || activeDocumentTool ? "Process" : "Convert") : file.status === "converting" ? "..." : "Saved"}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteFile(files.indexOf(file))}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '0.4rem', marginLeft: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                              title="Remove file"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {activeDocumentTool === 'merge' && files.filter(f => f.type === activeCategory).length > 1 && (
                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                      <button 
                         className="btn-primary"
                         style={{ background: primaryBg, padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: '1rem', border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}
                         onClick={handleMergePdfs}
                      >
                         Merge {files.filter(f => f.type === activeCategory).length} PDFs Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* Document Preview Modal */}
      {docPreview?.isOpen && (
        <div className="preview-modal-overlay">
          <div className="preview-modal-card" style={{ maxWidth: '600px' }}>
            <button 
              onClick={() => {
                setDocPreview(null);
                if (docPreview.downloadUrl) window.URL.revokeObjectURL(docPreview.downloadUrl);
              }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: '#f1f1f1', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', zIndex: 10 }}
            >×</button>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 className="section-title" style={{ fontSize: '1.6rem' }}>Document Preview</h2>
              <p style={{ color: 'var(--text-muted)' }}>{docPreview.contentTitle}</p>
            </div>
            
            <div className="preview-modal-content" style={{ padding: '2rem', background: '#f8fafc', borderRadius: '1.5rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>{docPreview.fileName}</h3>
              <p style={{ color: '#64748b', lineHeight: 1.6 }}>
                {docPreview.contentBody}
              </p>
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button 
                className="btn-primary gradient-btn" 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = docPreview.downloadUrl;
                  link.setAttribute('download', docPreview.fileName);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                style={{ padding: '0.8rem 3rem', borderRadius: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Word File
              </button>
            </div>
          </div>
        </div>
      )}

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
