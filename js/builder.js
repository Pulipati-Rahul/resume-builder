(function () {
    const STORAGE_KEY = "resumeData_v3";
    
    const $ = (id) => document.getElementById(id);
    
    const state = {
        name: '', email: '', phone: '', linkedin: '', github: '', website: '', location: '',
        summary: '', photo: '', template: 'modern',
        skills: [],
        experience: [],     // [{title, company, duration, location, description}]
        education: [],      // [{college, degree, year, percentage}]
        projects: [],       // [{name, description, tech}]
        languages: [],      // [{language, level}]
        certifications: [], // [{name, issuer, year}]
        hobbies: []
    };

    let saveTimer = null;
    let pendingConfirmAction = null;

    // UI References
    const refs = {
        // Inputs
        name: $('name'), email: $('email'), phone: $('phone'),
        linkedin: $('linkedin'), github: $('github'), website: $('website'), location: $('location'),
        summary: $('summaryInput'), summaryCount: $('summaryCount'),
        photoInput: $('photoInput'), photoUploadArea: $('photoUploadArea'), 
        photoPreviewThumb: $('photoPreviewThumb'), photoPreviewWrapper: $('photoPreviewWrapper'),
        uploadPlaceholder: $('uploadPlaceholder'), removePhotoBtn: $('removePhotoBtn'),
        
        skillInput: $('skillInput'), addSkill: $('addSkill'), skillsList: $('skillsList'),
        
        expTitle: $('expTitle'), expCompany: $('expCompany'), expDuration: $('expDuration'),
        expLocation: $('expLocation'), expDescription: $('expDescription'), addExperience: $('addExperience'),
        experienceList: $('experienceList'),
        
        collegeInput: $('collegeInput'), degreeInput: $('degreeInput'), yearInput: $('yearInput'),
        percentageInput: $('percentageInput'), addEducation: $('addEducation'), educationList: $('educationList'),
        
        projectInput: $('projectInput'), projectDesc: $('projectDesc'), projectTech: $('projectTech'),
        addProject: $('addProject'), projectList: $('projectList'),
        
        languageInput: $('languageInput'), languageLevel: $('languageLevel'),
        addLanguage: $('addLanguage'), languageList: $('languageList'),
        
        certInput: $('certInput'), certIssuer: $('certIssuer'), certYear: $('certYear'),
        addCert: $('addCert'), certList: $('certList'),
        
        hobbyInput: $('hobbyInput'), addHobby: $('addHobby'), hobbyList: $('hobbyList'),
        
        // Preview
        resumePreview: $('resumePreview'),
        previewName: $('previewName'), previewEmail: $('previewEmail'), previewPhone: $('previewPhone'),
        previewLinkedin: $('previewLinkedin'), previewGithub: $('previewGithub'),
        previewWebsite: $('previewWebsite'), previewLocation: $('previewLocation'), contactInfo: $('contactInfo'),
        previewSummary: $('previewSummary'), profilePreview: $('profilePreview'),
        previewSkills: $('previewSkills'), previewExperience: $('previewExperience'),
        previewEducation: $('previewEducation'), previewProjects: $('previewProjects'),
        previewLanguages: $('previewLanguages'), previewCertifications: $('previewCertifications'),
        previewHobbies: $('previewHobbies'),
        
        // Sections
        summarySection: $('summarySection'), skillsSection: $('skillsSection'),
        experienceSection: $('experienceSection'), educationSection: $('educationSection'),
        projectsSection: $('projectsSection'), languagesSection: $('languagesSection'),
        certificationsSection: $('certificationsSection'), hobbiesSection: $('hobbiesSection'),

        // Others
        resumeScore: $('resumeScore'), scoreRingFill: $('scoreRingFill'),
        jobDescription: $('jobDescription'), checkATS: $('checkATS'), atsResult: $('atsResult'),
        toastContainer: $('toastContainer'),
        confirmModal: $('confirmModal'), confirmMessage: $('confirmMessage'),
        confirmCancel: $('confirmCancel'), confirmDelete: $('confirmDelete'),
        loadingSpinner: $('loadingSpinner'),
        downloadBtn: $('downloadBtn'), mobileDownloadBtn: $('mobileDownloadBtn'),
        templateBtns: document.querySelectorAll('.template-btn'),
        importBtn: $('importBtn'), exportBtn: $('exportBtn'), resetBtn: $('resetBtn'),
        importFileInput: $('importFileInput'),
        
        // Mobile & layout
        mobileMenuToggle: $('mobileMenuToggle'), topActions: $('topActions'),
        tabBtns: document.querySelectorAll('.tab-btn'),
        sidebarPanel: $('sidebarPanel'), previewPanel: $('previewPanel'),
        sectionHeaders: document.querySelectorAll('.section-header')
    };

    // --- UTILS ---
    function showToast(message, type = 'info', duration = 3000) {
        if (!refs.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        refs.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(state, parsed);
            }
        } catch (e) {
            console.error('Failed to load state', e);
        }
    }

    function saveState() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }, 500);
    }

    function showFieldError(field, message) {
        if (!field) return;
        field.classList.add('error');
        let error = field.nextElementSibling;
        if (!error || !error.classList.contains('error-message')) {
            error = document.createElement('div');
            error.className = 'error-message';
            field.parentNode.insertBefore(error, field.nextSibling);
        }
        error.textContent = message;
        error.classList.add('show');
    }

    function clearFieldError(field) {
        if (!field) return;
        field.classList.remove('error');
        const error = field.nextElementSibling;
        if (error && error.classList.contains('error-message')) {
            error.classList.remove('show');
        }
    }

    function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
    function validatePhone(phone) { const d = phone.replace(/\D/g, ""); return d.length >= 7 && d.length <= 15; }
    
    function validateField(field, rules) {
        const val = (field.value || '').trim();
        if (rules.required && !val) { showFieldError(field, "This field is required"); return false; }
        if (val && rules.email && !validateEmail(val)) { showFieldError(field, "Invalid email"); return false; }
        if (val && rules.phone && !validatePhone(val)) { showFieldError(field, "Invalid phone"); return false; }
        clearFieldError(field);
        return true;
    }

    function validateForm(showMessage) {
        const v1 = validateField(refs.name, { required: true });
        const v2 = validateField(refs.email, { required: true, email: true });
        const v3 = validateField(refs.phone, { phone: true });
        const isValid = v1 && v2 && v3;
        if (!isValid && showMessage) showToast("Please fix the highlighted fields", "error");
        return isValid;
    }

    function showConfirmModal(message, onConfirm) {
        pendingConfirmAction = onConfirm;
        refs.confirmMessage.textContent = message;
        refs.confirmModal.classList.remove('hidden');
    }

    function hideConfirmModal() {
        pendingConfirmAction = null;
        refs.confirmModal.classList.add('hidden');
    }

    // --- SYNC & RENDER ---
    function syncInputsFromState() {
        refs.name.value = state.name; refs.email.value = state.email; refs.phone.value = state.phone;
        refs.linkedin.value = state.linkedin; refs.github.value = state.github;
        refs.website.value = state.website; refs.location.value = state.location;
        refs.summary.value = state.summary; refs.summaryCount.textContent = state.summary.length;
        
        if (state.photo) {
            refs.photoPreviewThumb.src = state.photo;
            refs.photoPreviewWrapper.style.display = 'block';
            refs.uploadPlaceholder.style.display = 'none';
        } else {
            refs.photoPreviewThumb.removeAttribute('src');
            refs.photoPreviewWrapper.style.display = 'none';
            refs.uploadPlaceholder.style.display = 'block';
        }
    }

    function updateStateFromInputs() {
        state.name = refs.name.value.trim(); state.email = refs.email.value.trim();
        state.phone = refs.phone.value.trim(); state.linkedin = refs.linkedin.value.trim();
        state.github = refs.github.value.trim(); state.website = refs.website.value.trim();
        state.location = refs.location.value.trim(); state.summary = refs.summary.value.trim();
        refs.summaryCount.textContent = state.summary.length;
        saveState();
        renderPreview();
        updateScore();
    }

    function renderPreview() {
        refs.previewName.textContent = state.name || "Your Name";
        
        // Contact Info
        const contacts = [];
        if (state.email) contacts.push(`<span class="contact-item">${state.email}</span>`);
        if (state.phone) contacts.push(`<span class="contact-item">${state.phone}</span>`);
        if (state.linkedin) contacts.push(`<span class="contact-item">${state.linkedin}</span>`);
        if (state.github) contacts.push(`<span class="contact-item">${state.github}</span>`);
        if (state.website) contacts.push(`<span class="contact-item">${state.website}</span>`);
        if (state.location) contacts.push(`<span class="contact-item">${state.location}</span>`);
        
        refs.contactInfo.innerHTML = contacts.join('<span class="contact-sep"> | </span>');
        
        // Summary
        refs.previewSummary.textContent = state.summary || "Your professional summary will appear here.";
        refs.summarySection.style.display = state.summary ? 'block' : 'none';

        // Photo
        if (state.photo) {
            refs.profilePreview.src = state.photo;
            refs.profilePreview.style.display = state.template === 'ats' ? 'none' : 'block';
        } else {
            refs.profilePreview.style.display = 'none';
        }

        renderSkills();
        renderExperience();
        renderEducation();
        renderProjects();
        renderLanguages();
        renderCertifications();
        renderHobbies();
        applyTemplate(state.template);
    }

    function createDeletableCard(title, subtitle, onDelete) {
        const d = document.createElement('div');
        d.className = 'item-card';
        d.innerHTML = `<div class="item-card-content"><strong>${title}</strong>${subtitle ? `<span>${subtitle}</span>` : ''}</div><button class="delete-btn inline-delete" type="button">✕</button>`;
        d.querySelector('.delete-btn').addEventListener('click', (e) => { e.stopPropagation(); showConfirmModal(`Delete "${title}"?`, onDelete); });
        return d;
    }
    
    function createTag(text, onDelete) {
        const d = document.createElement('span');
        d.className = 'tag';
        d.innerHTML = `${text}<button class="delete-btn inline-delete" type="button">✕</button>`;
        d.querySelector('.delete-btn').addEventListener('click', (e) => { e.stopPropagation(); showConfirmModal(`Delete "${text}"?`, onDelete); });
        return d;
    }

    function renderSkills() {
        refs.skillsList.innerHTML = ''; refs.previewSkills.innerHTML = '';
        state.skills.forEach((s, i) => {
            refs.skillsList.appendChild(createTag(s, () => { state.skills.splice(i,1); saveState(); renderPreview(); updateScore(); }));
            const p = document.createElement('span'); p.className = 'skill-pill'; p.textContent = s;
            refs.previewSkills.appendChild(p);
        });
        refs.skillsSection.style.display = state.skills.length ? 'block' : 'none';
    }

    function renderExperience() {
        refs.experienceList.innerHTML = ''; refs.previewExperience.innerHTML = '';
        state.experience.forEach((e, i) => {
            refs.experienceList.appendChild(createDeletableCard(e.title, e.company, () => { state.experience.splice(i,1); saveState(); renderPreview(); updateScore(); }));
            const d = document.createElement('div'); d.className = 'exp-entry';
            d.innerHTML = `
                <div class="exp-header"><strong class="exp-title">${e.title}</strong><span class="exp-duration">${e.duration}</span></div>
                <div class="exp-company">${e.company}${e.location ? ` · ${e.location}` : ''}</div>
                ${e.description ? `<p class="exp-desc">${e.description}</p>` : ''}
            `;
            refs.previewExperience.appendChild(d);
        });
        refs.experienceSection.style.display = state.experience.length ? 'block' : 'none';
    }

    function renderEducation() {
        refs.educationList.innerHTML = ''; refs.previewEducation.innerHTML = '';
        state.education.forEach((e, i) => {
            refs.educationList.appendChild(createDeletableCard(e.degree, e.college, () => { state.education.splice(i,1); saveState(); renderPreview(); updateScore(); }));
            const d = document.createElement('div'); d.className = 'edu-entry';
            d.innerHTML = `
                <div class="edu-header"><strong>${e.degree}</strong><span class="edu-year">${e.year}</span></div>
                <div class="edu-college">${e.college}</div>
                ${e.percentage ? `<div class="edu-score">${e.percentage}</div>` : ''}
            `;
            refs.previewEducation.appendChild(d);
        });
        refs.educationSection.style.display = state.education.length ? 'block' : 'none';
    }

    function renderProjects() {
        refs.projectList.innerHTML = ''; refs.previewProjects.innerHTML = '';
        state.projects.forEach((p, i) => {
            refs.projectList.appendChild(createDeletableCard(p.name, p.tech, () => { state.projects.splice(i,1); saveState(); renderPreview(); updateScore(); }));
            const d = document.createElement('div'); d.className = 'project-entry';
            d.innerHTML = `
                <strong class="project-name">${p.name}</strong>
                ${p.description ? `<p class="project-desc">${p.description}</p>` : ''}
                ${p.tech ? `<span class="project-tech">${p.tech}</span>` : ''}
            `;
            refs.previewProjects.appendChild(d);
        });
        refs.projectsSection.style.display = state.projects.length ? 'block' : 'none';
    }

    function renderLanguages() {
        refs.languageList.innerHTML = ''; refs.previewLanguages.innerHTML = '';
        state.languages.forEach((l, i) => {
            refs.languageList.appendChild(createDeletableCard(l.language, l.level, () => { state.languages.splice(i,1); saveState(); renderPreview(); updateScore(); }));
            const d = document.createElement('div'); d.className = 'lang-entry';
            d.innerHTML = `<span class="lang-name">${l.language}</span><span class="lang-level">${l.level}</span>`;
            refs.previewLanguages.appendChild(d);
        });
        refs.languagesSection.style.display = state.languages.length ? 'block' : 'none';
    }

    function renderCertifications() {
        refs.certList.innerHTML = ''; refs.previewCertifications.innerHTML = '';
        state.certifications.forEach((c, i) => {
            refs.certList.appendChild(createDeletableCard(c.name, c.issuer, () => { state.certifications.splice(i,1); saveState(); renderPreview(); updateScore(); }));
            const d = document.createElement('div'); d.className = 'cert-entry';
            d.innerHTML = `<strong>${c.name}</strong><span class="cert-meta">${c.issuer} ${c.year ? `· ${c.year}` : ''}</span>`;
            refs.previewCertifications.appendChild(d);
        });
        refs.certificationsSection.style.display = state.certifications.length ? 'block' : 'none';
    }

    function renderHobbies() {
        refs.hobbyList.innerHTML = ''; refs.previewHobbies.innerHTML = '';
        state.hobbies.forEach((h, i) => {
            refs.hobbyList.appendChild(createTag(h, () => { state.hobbies.splice(i,1); saveState(); renderPreview(); updateScore(); }));
            const p = document.createElement('span'); p.className = 'skill-pill'; p.textContent = h;
            refs.previewHobbies.appendChild(p);
        });
        refs.hobbiesSection.style.display = state.hobbies.length ? 'block' : 'none';
    }

    function applyTemplate(name) {
        state.template = name;
        const cl = Array.from(refs.resumePreview.classList).filter(c => c.endsWith('-template'));
        refs.resumePreview.classList.remove(...cl);
        refs.resumePreview.classList.add(`${name}-template`);
        refs.templateBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.template === name);
        });
        saveState();
        if (refs.profilePreview) {
            refs.profilePreview.style.display = state.photo && name !== 'ats' ? 'block' : 'none';
        }
    }

    // --- SCORE & ATS ---
    function calculateScore() {
        const c = [
            state.name, validateEmail(state.email)?1:0, validatePhone(state.phone)?1:0, state.linkedin,
            state.summary, state.skills.length, state.experience.length, state.education.length, state.projects.length
        ];
        return Math.round((c.filter(Boolean).length / c.length) * 100);
    }

    function updateScore() {
        const score = calculateScore();
        refs.resumeScore.textContent = `${score}%`;
        const circ = 2 * Math.PI * 52; // 326.73
        refs.scoreRingFill.style.strokeDashoffset = circ * (1 - score / 100);
    }

    function analyzeAts() {
        const jd = (refs.jobDescription.value || '').toLowerCase();
        if (!jd) { showToast("Paste a job description first", "warning"); return; }
        const rWords = new Set(refs.resumePreview.innerText.toLowerCase().split(/[^a-z0-9+#.]+/).filter(w => w.length > 2));
        const kWords = Array.from(new Set(jd.split(/[^a-z0-9+#.]+/).filter(w => w.length > 3)));
        if (!kWords.length) { refs.atsResult.textContent = "Add more detail to the job description."; return; }
        const matched = kWords.filter(w => rWords.has(w)).length;
        const score = Math.round((matched / kWords.length) * 100);
        refs.atsResult.innerHTML = `<strong>ATS Match: ${score}%</strong><br>Found ${matched} out of ${kWords.length} keywords.`;
    }

    // --- ACTIONS ---
    function handlePhotoUpload(file) {
        if (!file || !file.type.startsWith('image/')) { showToast("Please upload a valid image", "error"); return; }
        const reader = new FileReader();
        reader.onload = e => {
            state.photo = e.target.result;
            syncInputsFromState();
            renderPreview();
            saveState();
            showToast("Photo updated", "success");
        };
        reader.readAsDataURL(file);
    }

    function removePhoto() {
        state.photo = '';
        syncInputsFromState();
        renderPreview();
        saveState();
        showToast("Photo removed", "info");
    }

    async function downloadPdf() {
        if (!validateForm(true)) return;
        if (typeof html2pdf === "undefined") { showToast("PDF library loading...", "error"); return; }
        
        refs.loadingSpinner.classList.remove('hidden');
        
        // Wait for images
        const imgs = Array.from(refs.resumePreview.querySelectorAll('img')).filter(i => i.src && !i.complete);
        await Promise.all(imgs.map(i => new Promise(res => { i.onload = res; i.onerror = res; })));
        
        const prevStyle = refs.resumePreview.getAttribute('style') || '';
        refs.resumePreview.classList.add('exporting');
        refs.resumePreview.style.width = '210mm';
        refs.resumePreview.style.minHeight = '297mm';
        refs.resumePreview.style.margin = '0';
        refs.resumePreview.style.border = 'none';
        refs.resumePreview.style.borderRadius = '0';
        refs.resumePreview.style.boxShadow = 'none';
        refs.resumePreview.style.padding = state.template === 'ats' ? '14mm' : '18mm';
        
        try {
            await html2pdf().set({
                margin: 0,
                filename: `ResumeForge-${state.name.replace(/\s+/g,'_') || 'resume'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            }).from(refs.resumePreview).save();
            showToast("PDF downloaded successfully", "success");
        } catch (e) {
            console.error(e);
            showToast("Error generating PDF", "error");
        } finally {
            refs.resumePreview.setAttribute('style', prevStyle);
            refs.resumePreview.classList.remove('exporting');
            refs.loadingSpinner.classList.add('hidden');
        }
    }

    function exportJSON() {
        const blob = new Blob([JSON.stringify(state, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `ResumeForge_Export_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Resume data exported", "success");
    }

    function importJSON(e) {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);
                Object.assign(state, data);
                syncInputsFromState();
                renderPreview();
                updateScore();
                saveState();
                showToast("Resume data imported", "success");
            } catch(err) { showToast("Invalid JSON file", "error"); }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function resetAll() {
        showConfirmModal("Are you sure you want to reset all data? This cannot be undone.", () => {
            localStorage.removeItem(STORAGE_KEY);
            Object.keys(state).forEach(k => { state[k] = Array.isArray(state[k]) ? [] : ''; });
            state.template = 'modern';
            syncInputsFromState();
            renderPreview();
            updateScore();
            showToast("All data reset", "info");
        });
    }

    // --- BIND EVENTS ---
    function bindEvents() {
        // Inputs
        ['name','email','phone','linkedin','github','website','location'].forEach(id => {
            refs[id].addEventListener('input', updateStateFromInputs);
        });
        
        refs.summary.addEventListener('input', () => {
            if (refs.summary.value.length > 500) refs.summary.value = refs.summary.value.substring(0, 500);
            updateStateFromInputs();
        });

        // Add Handlers
        refs.addSkill.addEventListener('click', () => {
            const v = refs.skillInput.value.trim();
            if(!v) return;
            if(state.skills.includes(v)){ showToast("Skill already added","warning"); return; }
            state.skills.push(v); refs.skillInput.value = ''; saveState(); renderPreview(); updateScore();
        });
        
        refs.addExperience.addEventListener('click', () => {
            const t = refs.expTitle.value.trim(), c = refs.expCompany.value.trim();
            if(!t || !c) { showToast("Title and Company required","warning"); return; }
            state.experience.push({ title: t, company: c, duration: refs.expDuration.value.trim(), location: refs.expLocation.value.trim(), description: refs.expDescription.value.trim() });
            refs.expTitle.value=''; refs.expCompany.value=''; refs.expDuration.value=''; refs.expLocation.value=''; refs.expDescription.value='';
            saveState(); renderPreview(); updateScore(); showToast("Experience added", "success");
        });

        refs.addEducation.addEventListener('click', () => {
            const c = refs.collegeInput.value.trim(), d = refs.degreeInput.value.trim();
            if(!c || !d) { showToast("College and Degree required","warning"); return; }
            state.education.push({ college: c, degree: d, year: refs.yearInput.value.trim(), percentage: refs.percentageInput.value.trim() });
            refs.collegeInput.value=''; refs.degreeInput.value=''; refs.yearInput.value=''; refs.percentageInput.value='';
            saveState(); renderPreview(); updateScore(); showToast("Education added", "success");
        });

        refs.addProject.addEventListener('click', () => {
            const n = refs.projectInput.value.trim();
            if(!n) { showToast("Project name required","warning"); return; }
            state.projects.push({ name: n, description: refs.projectDesc.value.trim(), tech: refs.projectTech.value.trim() });
            refs.projectInput.value=''; refs.projectDesc.value=''; refs.projectTech.value='';
            saveState(); renderPreview(); updateScore(); showToast("Project added", "success");
        });

        refs.addLanguage.addEventListener('click', () => {
            const l = refs.languageInput.value.trim();
            if(!l) return;
            state.languages.push({ language: l, level: refs.languageLevel.value });
            refs.languageInput.value='';
            saveState(); renderPreview(); updateScore();
        });

        refs.addCert.addEventListener('click', () => {
            const n = refs.certInput.value.trim();
            if(!n) return;
            state.certifications.push({ name: n, issuer: refs.certIssuer.value.trim(), year: refs.certYear.value.trim() });
            refs.certInput.value=''; refs.certIssuer.value=''; refs.certYear.value='';
            saveState(); renderPreview(); updateScore();
        });

        refs.addHobby.addEventListener('click', () => {
            const h = refs.hobbyInput.value.trim();
            if(!h) return;
            if(state.hobbies.includes(h)) return;
            state.hobbies.push(h); refs.hobbyInput.value='';
            saveState(); renderPreview(); updateScore();
        });

        // Photo Upload
        refs.photoInput.addEventListener('change', e => handlePhotoUpload(e.target.files[0]));
        refs.photoUploadArea.addEventListener('click', () => { if(!state.photo) refs.photoInput.click(); });
        refs.removePhotoBtn.addEventListener('click', e => { e.stopPropagation(); removePhoto(); });
        
        // Drag and drop photo
        refs.photoUploadArea.addEventListener('dragover', e => { e.preventDefault(); refs.photoUploadArea.style.borderColor = 'var(--primary)'; });
        refs.photoUploadArea.addEventListener('dragleave', e => { e.preventDefault(); refs.photoUploadArea.style.borderColor = 'var(--border)'; });
        refs.photoUploadArea.addEventListener('drop', e => {
            e.preventDefault(); refs.photoUploadArea.style.borderColor = 'var(--border)';
            if(e.dataTransfer.files && e.dataTransfer.files[0]) handlePhotoUpload(e.dataTransfer.files[0]);
        });

        // Templates
        refs.templateBtns.forEach(btn => btn.addEventListener('click', () => applyTemplate(btn.dataset.template)));

        // Modals & Actions
        refs.confirmCancel.addEventListener('click', hideConfirmModal);
        refs.confirmDelete.addEventListener('click', () => { if(pendingConfirmAction) pendingConfirmAction(); hideConfirmModal(); });
        refs.downloadBtn.addEventListener('click', downloadPdf);
        refs.mobileDownloadBtn.addEventListener('click', downloadPdf);
        refs.checkATS.addEventListener('click', analyzeAts);
        
        refs.exportBtn.addEventListener('click', exportJSON);
        refs.importBtn.addEventListener('click', () => refs.importFileInput.click());
        refs.importFileInput.addEventListener('change', importJSON);
        refs.resetBtn.addEventListener('click', resetAll);

        // Section Accordions
        refs.sectionHeaders.forEach(h => {
            h.addEventListener('click', () => {
                const box = h.parentElement;
                box.classList.toggle('collapsed');
                const icon = h.querySelector('.toggle-icon');
                if(icon) icon.style.transform = box.classList.contains('collapsed') ? 'rotate(-90deg)' : 'rotate(0)';
            });
        });

        // Mobile Tabs
        refs.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                refs.tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if(btn.dataset.tab === 'edit') {
                    refs.sidebarPanel.style.display = 'flex';
                    refs.previewPanel.style.display = 'none';
                } else {
                    refs.sidebarPanel.style.display = 'none';
                    refs.previewPanel.style.display = 'flex';
                }
            });
        });

        // Mobile Menu
        refs.mobileMenuToggle.addEventListener('click', () => {
            refs.topActions.classList.toggle('open');
        });
        
        // Enter key handling for inputs
        const bindEnter = (input, btn) => { input.addEventListener('keypress', e => { if(e.key === 'Enter'){ e.preventDefault(); btn.click(); }}); };
        bindEnter(refs.skillInput, refs.addSkill);
        bindEnter(refs.hobbyInput, refs.addHobby);
    }

    function initFromQueryString() {
        const urlParams = new URLSearchParams(window.location.search);
        const t = urlParams.get('template');
        if (t) state.template = t;
    }

    // --- INIT ---
    document.addEventListener('DOMContentLoaded', () => {
        loadState();
        initFromQueryString();
        syncInputsFromState();
        bindEvents();
        
        // Mobile initial state (handled by CSS media queries, but ensure correct display)
        if(window.innerWidth <= 768) {
            refs.previewPanel.style.display = 'none';
        }
        
        renderPreview();
        updateScore();
        
        // Make sure all sections are initially expanded (no collapsed class)
        refs.sectionHeaders.forEach(h => {
            const icon = h.querySelector('.toggle-icon');
            if(icon) icon.style.transform = 'rotate(0)';
        });
    });

})();
