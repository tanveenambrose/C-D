// GSAP Entry Animations
document.addEventListener('DOMContentLoaded', () => {
    gsap.from('.sidebar', {
        x: -100,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    });

    gsap.from('.header', {
        y: -50,
        opacity: 0,
        duration: 1,
        delay: 0.3,
        ease: 'power3.out'
    });

    gsap.from('.hero-text', {
        y: 30,
        opacity: 0,
        duration: 1,
        delay: 0.5,
        ease: 'power3.out'
    });

    gsap.from('.converter-wrapper', {
        scale: 0.95,
        opacity: 0,
        duration: 1,
        delay: 0.7,
        ease: 'power3.out'
    });
});

// Drag & Drop Interactions
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    handleFiles(files);
});

fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
});

function handleFiles(files) {
    if (files.length > 0) {
        // Clear empty message
        fileList.innerHTML = '';
        
        Array.from(files).forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem;
                background: #fdfdfd;
                border: 1px solid rgba(0,0,0,0.05);
                border-radius: 1rem;
                margin-bottom: 0.5rem;
            `;
            
            fileItem.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 40px; height: 40px; background: #8B5CF615; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
                        📄
                    </div>
                    <div>
                        <div style="font-weight: 600; font-size: 0.9rem;">${file.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                </div>
                <div class="progress-container" style="flex-grow: 1; margin: 0 2rem; background: #eee; height: 6px; border-radius: 3px; position: relative; overflow: hidden;">
                    <div class="progress-bar" style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: var(--gradient); transition: width 0.3s;"></div>
                </div>
                <button class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.8rem;" onclick="simulateConversion(this)">Convert</button>
            `;
            
            fileList.appendChild(fileItem);
        });
    }
}

function simulateConversion(btn) {
    const progressBar = btn.parentElement.querySelector('.progress-bar');
    btn.disabled = true;
    btn.innerText = 'Converting...';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            btn.innerText = 'Download';
            btn.classList.add('gradient-btn');
            btn.disabled = false;
        }
        progressBar.style.width = progress + '%';
    }, 200);
}
