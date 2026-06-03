(function () {
    const STORAGE_KEY = "resumeData_v2";
    const LEGACY_STORAGE_KEY = "resumeData_v1";

    const $ = (id) => document.getElementById(id);

    const refs = {
        name: $("name"),
        email: $("email"),
        phone: $("phone"),
        linkedin: $("linkedin"),
        github: $("github"),
        photoInput: $("photoInput"),
        summary: $("summaryInput"),
        skillInput: $("skillInput"),
        addSkill: $("addSkill"),
        skillsList: $("skillsList"),
        projectInput: $("projectInput"),
        addProject: $("addProject"),
        projectList: $("projectList"),
        college: $("collegeInput"),
        degree: $("degreeInput"),
        year: $("yearInput"),
        percentage: $("percentageInput"),
        addEducation: $("addEducation"),
        educationList: $("educationList"),
        experienceInput: $("experienceInput"),
        addExperience: $("addExperience"),
        experienceList: $("experienceList"),
        previewName: $("previewName"),
        previewEmail: $("previewEmail"),
        previewPhone: $("previewPhone"),
        previewLinkedin: $("previewLinkedin"),
        previewGithub: $("previewGithub"),
        previewSummary: $("previewSummary"),
        previewSkills: $("previewSkills"),
        previewProjects: $("previewProjects"),
        previewEducation: $("previewEducation"),
        previewExperience: $("previewExperience"),
        profilePreview: $("profilePreview"),
        resumeScore: $("resumeScore"),
        jobDescription: $("jobDescription"),
        checkATS: $("checkATS"),
        atsResult: $("atsResult"),
        confirmModal: $("confirmModal"),
        confirmMessage: $("confirmMessage"),
        confirmCancel: $("confirmCancel"),
        confirmDelete: $("confirmDelete"),
        loadingSpinner: $("loadingSpinner"),
        downloadBtn: document.querySelector(".download-btn"),
        resumePreview: document.querySelector(".resume-preview"),
        templateButtons: document.querySelectorAll(".template-btn")
    };

    const state = {
        name: "",
        email: "",
        phone: "",
        linkedin: "",
        github: "",
        summary: "",
        photo: "",
        template: "modern",
        skills: [],
        projects: [],
        education: [],
        experience: []
    };

    let saveTimer = null;
    let pendingDelete = null;

    function normalizeText(value) {
        return String(value || "").trim();
    }

    function escapeStorageRead(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || "null");
        } catch (error) {
            console.warn("Unable to parse saved resume data:", error);
            return null;
        }
    }

    function loadState() {
        const saved = escapeStorageRead(STORAGE_KEY) || escapeStorageRead(LEGACY_STORAGE_KEY) || {};

        state.name = saved.name || localStorage.getItem("resumeName") || "";
        state.email = saved.email || localStorage.getItem("resumeEmail") || "";
        state.phone = saved.phone || localStorage.getItem("resumePhone") || "";
        state.linkedin = saved.linkedin || localStorage.getItem("resumeLinkedin") || "";
        state.github = saved.github || localStorage.getItem("resumeGithub") || "";
        state.summary = saved.summary || "";
        state.photo = saved.photo || "";
        state.template = saved.template || "modern";
        state.skills = Array.isArray(saved.skills) ? saved.skills.filter(Boolean) : [];
        state.projects = Array.isArray(saved.projects) ? saved.projects.filter(Boolean) : [];
        state.education = Array.isArray(saved.education) ? saved.education.filter(Boolean) : [];
        state.experience = Array.isArray(saved.experience) ? saved.experience.filter(Boolean) : [];
    }

    function saveState(immediate) {
        clearTimeout(saveTimer);
        const write = () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            showSaveIndicator();
        };

        if (immediate) {
            write();
        } else {
            saveTimer = setTimeout(write, 350);
        }
    }

    function showSaveIndicator() {
        let indicator = document.querySelector(".save-indicator");
        if (!indicator) {
            indicator = document.createElement("div");
            indicator.className = "save-indicator";
            indicator.textContent = "Saved";
            document.body.appendChild(indicator);
        }

        indicator.classList.add("visible");
        clearTimeout(indicator.hideTimer);
        indicator.hideTimer = setTimeout(() => indicator.classList.remove("visible"), 1200);
    }

    function showToast(message, type = "info", duration = 2600) {
        const container = $("toastContainer");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("removing");
            setTimeout(() => toast.remove(), 350);
        }, duration);
    }

    function showFieldError(field, message) {
        if (!field) return;

        field.classList.add("error");
        let error = field.nextElementSibling;
        if (!error || !error.classList.contains("error-message")) {
            error = document.createElement("div");
            error.className = "error-message";
            field.parentNode.insertBefore(error, field.nextSibling);
        }

        error.textContent = message;
        error.classList.add("show");
    }

    function clearFieldError(field) {
        if (!field) return;

        field.classList.remove("error");
        const error = field.nextElementSibling;
        if (error && error.classList.contains("error-message")) {
            error.textContent = "";
            error.classList.remove("show");
        }
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePhone(phone) {
        const digits = phone.replace(/\D/g, "");
        return digits.length >= 7 && digits.length <= 15;
    }

    function validateField(field, rules) {
        const value = normalizeText(field.value);

        if (rules.required && !value) {
            showFieldError(field, rules.requiredMessage || "This field is required");
            return false;
        }

        if (value && rules.email && !validateEmail(value)) {
            showFieldError(field, "Enter a valid email address");
            return false;
        }

        if (value && rules.phone && !validatePhone(value)) {
            showFieldError(field, "Enter a valid phone number");
            return false;
        }

        clearFieldError(field);
        return true;
    }

    function validateForm(showMessage) {
        const checks = [
            validateField(refs.name, { required: true, requiredMessage: "Name is required" }),
            validateField(refs.email, { required: true, email: true, requiredMessage: "Email is required" }),
            validateField(refs.phone, { phone: true })
        ];

        const isValid = checks.every(Boolean);
        if (!isValid && showMessage) {
            showToast("Please fix the highlighted fields", "error");
        }

        return isValid;
    }

    function syncInputsFromState() {
        refs.name.value = state.name;
        refs.email.value = state.email;
        refs.phone.value = state.phone;
        refs.linkedin.value = state.linkedin;
        refs.github.value = state.github;
        refs.summary.value = state.summary;

        if (state.photo) {
            refs.profilePreview.src = state.photo;
            refs.profilePreview.style.display = state.template === "ats" ? "none" : "block";
        } else {
            refs.profilePreview.removeAttribute("src");
            refs.profilePreview.style.display = "none";
        }
    }

    function updateStateFromPersonalInputs() {
        state.name = refs.name.value.trim();
        state.email = refs.email.value.trim();
        state.phone = refs.phone.value.trim();
        state.linkedin = refs.linkedin.value.trim();
        state.github = refs.github.value.trim();
        state.summary = refs.summary.value.trim();
    }

    function renderText(target, value, fallback) {
        target.textContent = value || fallback;
    }

    function createDeleteButton(label, onDelete) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "delete-btn inline-delete";
        button.textContent = "x";
        button.setAttribute("aria-label", label);
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            showConfirmModal(label + "?", onDelete);
        });
        return button;
    }

    function renderSkills() {
        refs.skillsList.innerHTML = "";
        refs.previewSkills.innerHTML = "";

        state.skills.forEach((skill, index) => {
            const chip = document.createElement("span");
            chip.className = "tag";
            chip.textContent = skill;
            chip.appendChild(createDeleteButton(`Delete skill ${skill}`, () => {
                state.skills.splice(index, 1);
                renderAll();
                saveState(true);
                showToast("Skill deleted", "info");
            }));
            refs.skillsList.appendChild(chip);

            const previewChip = document.createElement("span");
            previewChip.className = "skill-pill";
            previewChip.textContent = skill;
            refs.previewSkills.appendChild(previewChip);
        });
    }

    function renderProjects() {
        refs.projectList.innerHTML = "";
        refs.previewProjects.innerHTML = "";

        state.projects.forEach((project, index) => {
            const chip = document.createElement("span");
            chip.className = "tag";
            chip.textContent = project;
            chip.appendChild(createDeleteButton(`Delete project ${project}`, () => {
                state.projects.splice(index, 1);
                renderAll();
                saveState(true);
                showToast("Project deleted", "info");
            }));
            refs.projectList.appendChild(chip);

            const card = document.createElement("div");
            card.className = "project-item";
            card.textContent = project;
            refs.previewProjects.appendChild(card);
        });
    }

    function renderEducation() {
        refs.educationList.innerHTML = "";
        refs.previewEducation.innerHTML = "";

        state.education.forEach((education, index) => {
            const label = [education.degree, education.college].filter(Boolean).join(" - ");
            const chip = document.createElement("span");
            chip.className = "tag";
            chip.textContent = label || "Education";
            chip.appendChild(createDeleteButton(`Delete education ${label || ""}`.trim(), () => {
                state.education.splice(index, 1);
                renderAll();
                saveState(true);
                showToast("Education deleted", "info");
            }));
            refs.educationList.appendChild(chip);

            const card = document.createElement("div");
            card.className = "project-item";

            const title = document.createElement("strong");
            title.textContent = education.college;
            card.appendChild(title);

            [education.degree, education.year, education.percentage].filter(Boolean).forEach((line) => {
                card.appendChild(document.createElement("br"));
                card.appendChild(document.createTextNode(line));
            });

            refs.previewEducation.appendChild(card);
        });
    }

    function renderExperience() {
        refs.experienceList.innerHTML = "";
        refs.previewExperience.innerHTML = "";

        state.experience.forEach((experience, index) => {
            const chip = document.createElement("span");
            chip.className = "tag";
            chip.textContent = experience;
            chip.appendChild(createDeleteButton(`Delete experience ${experience}`, () => {
                state.experience.splice(index, 1);
                renderAll();
                saveState(true);
                showToast("Experience deleted", "info");
            }));
            refs.experienceList.appendChild(chip);

            const card = document.createElement("div");
            card.className = "project-item";
            const strong = document.createElement("strong");
            strong.textContent = experience;
            card.appendChild(strong);
            refs.previewExperience.appendChild(card);
        });
    }

    function calculateScore() {
        const checks = [
            state.name,
            validateEmail(state.email) ? state.email : "",
            validatePhone(state.phone) ? state.phone : "",
            state.linkedin,
            state.github,
            state.summary,
            state.skills.length,
            state.projects.length,
            state.education.length,
            state.experience.length
        ];

        return Math.round((checks.filter(Boolean).length / checks.length) * 100);
    }

    function updateScore() {
        refs.resumeScore.textContent = calculateScore() + "%";
    }

    function renderPreview() {
        renderText(refs.previewName, state.name, "Your Name");
        renderText(refs.previewEmail, state.email, "Email");
        renderText(refs.previewPhone, state.phone, "Phone");
        renderText(refs.previewLinkedin, state.linkedin, "LinkedIn");
        renderText(refs.previewGithub, state.github, "GitHub");
        renderText(refs.previewSummary, state.summary, "Your professional summary will appear here.");

        if (state.photo) {
            refs.profilePreview.src = state.photo;
            refs.profilePreview.style.display = state.template === "ats" ? "none" : "block";
        } else {
            refs.profilePreview.removeAttribute("src");
            refs.profilePreview.style.display = "none";
        }
    }

    function renderAll() {
        renderPreview();
        renderSkills();
        renderProjects();
        renderEducation();
        renderExperience();
        applyTemplate(state.template);
        updateScore();
    }

    function showConfirmModal(message, callback) {
        pendingDelete = callback;
        refs.confirmMessage.textContent = message;
        refs.confirmModal.classList.remove("hidden");
    }

    function hideConfirmModal() {
        pendingDelete = null;
        refs.confirmModal.classList.add("hidden");
    }

    function addSkill() {
        const skill = normalizeText(refs.skillInput.value);
        if (!skill) {
            showFieldError(refs.skillInput, "Enter a skill");
            showToast("Please enter a skill", "warning");
            return;
        }

        if (state.skills.some((item) => item.toLowerCase() === skill.toLowerCase())) {
            showFieldError(refs.skillInput, "This skill is already added");
            return;
        }

        clearFieldError(refs.skillInput);
        state.skills.push(skill);
        refs.skillInput.value = "";
        renderAll();
        saveState(true);
        showToast("Skill added", "success");
    }

    function addProject() {
        const project = normalizeText(refs.projectInput.value);
        if (!project) {
            showFieldError(refs.projectInput, "Enter a project");
            showToast("Please enter a project", "warning");
            return;
        }

        clearFieldError(refs.projectInput);
        state.projects.push(project);
        refs.projectInput.value = "";
        renderAll();
        saveState(true);
        showToast("Project added", "success");
    }

    function addEducation() {
        const education = {
            college: normalizeText(refs.college.value),
            degree: normalizeText(refs.degree.value),
            year: normalizeText(refs.year.value),
            percentage: normalizeText(refs.percentage.value)
        };

        const validCollege = validateField(refs.college, { required: true, requiredMessage: "College name is required" });
        const validDegree = validateField(refs.degree, { required: true, requiredMessage: "Degree is required" });

        if (!validCollege || !validDegree) {
            showToast("Please fill the required education fields", "warning");
            return;
        }

        state.education.push(education);
        refs.college.value = "";
        refs.degree.value = "";
        refs.year.value = "";
        refs.percentage.value = "";
        [refs.college, refs.degree, refs.year, refs.percentage].forEach(clearFieldError);
        renderAll();
        saveState(true);
        showToast("Education added", "success");
    }

    function addExperience() {
        const experience = normalizeText(refs.experienceInput.value);
        if (!experience) {
            showFieldError(refs.experienceInput, "Enter experience details");
            showToast("Please enter experience details", "warning");
            return;
        }

        clearFieldError(refs.experienceInput);
        state.experience.push(experience);
        refs.experienceInput.value = "";
        renderAll();
        saveState(true);
        showToast("Experience added", "success");
    }

    function handlePhotoUpload() {
        const file = refs.photoInput.files && refs.photoInput.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            refs.photoInput.value = "";
            showToast("Please upload an image file", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            state.photo = event.target.result;
            renderPreview();
            saveState(true);
            showToast("Photo added to preview", "success");
        };
        reader.onerror = () => showToast("Unable to read the image", "error");
        reader.readAsDataURL(file);
    }

    function applyTemplate(template) {
        const selected = template || "modern";
        const classesToRemove = Array.from(refs.resumePreview.classList).filter((className) => className.endsWith("-template"));

        refs.resumePreview.classList.remove(...classesToRemove);
        refs.resumePreview.classList.add(`${selected}-template`);
        state.template = selected;

        refs.templateButtons.forEach((button) => {
            const isActive = button.textContent.trim().toLowerCase() === selected;
            button.classList.toggle("active", isActive);
        });

        if (refs.profilePreview) {
            refs.profilePreview.style.display = state.photo && selected !== "ats" ? "block" : "none";
        }
    }

    function handleTemplateClick(button) {
        const template = button.textContent.trim().toLowerCase();
        applyTemplate(template);
        saveState(true);
    }

    function analyzeAts() {
        const jd = normalizeText(refs.jobDescription.value).toLowerCase();
        if (!jd) {
            refs.atsResult.textContent = "";
            showFieldError(refs.jobDescription, "Paste a job description first");
            showToast("Paste a job description first", "warning");
            return;
        }

        clearFieldError(refs.jobDescription);

        const resumeWords = new Set(
            refs.resumePreview.innerText
                .toLowerCase()
                .split(/[^a-z0-9+#.]+/)
                .filter((word) => word.length > 2)
        );

        const keywords = Array.from(new Set(
            jd.split(/[^a-z0-9+#.]+/).filter((word) => word.length > 3)
        ));

        if (!keywords.length) {
            refs.atsResult.textContent = "Add more detail to the job description.";
            return;
        }

        const matched = keywords.filter((word) => resumeWords.has(word)).length;
        const score = Math.round((matched / keywords.length) * 100);
        refs.atsResult.textContent = `ATS Match Score: ${score}%`;
    }

    function setLoading(isLoading) {
        refs.loadingSpinner.classList.toggle("hidden", !isLoading);
        refs.downloadBtn.disabled = isLoading;
    }

    function waitForImages(root) {
        const images = Array.from(root.querySelectorAll("img")).filter((image) => image.src && !image.complete);
        return Promise.all(images.map((image) => new Promise((resolve) => {
            image.onload = resolve;
            image.onerror = resolve;
        })));
    }

    async function downloadPdf() {
        updateStateFromPersonalInputs();
        renderPreview();

        if (!validateForm(true)) return;

        if (typeof html2pdf === "undefined") {
            showToast("PDF library is still loading. Try again in a moment.", "error");
            return;
        }

        setLoading(true);
        await waitForImages(refs.resumePreview);

        const previousStyle = refs.resumePreview.getAttribute("style") || "";
        refs.resumePreview.classList.add("exporting");
        refs.resumePreview.style.width = "210mm";
        refs.resumePreview.style.minHeight = "297mm";
        refs.resumePreview.style.margin = "0";
        refs.resumePreview.style.border = "none";
        refs.resumePreview.style.borderRadius = "0";
        refs.resumePreview.style.boxShadow = "none";
        refs.resumePreview.style.padding = state.template === "ats" ? "14mm" : "18mm";

        try {
            await html2pdf()
                .set({
                    margin: 0,
                    filename: `ResumeForge-${state.template}-resume.pdf`,
                    image: { type: "jpeg", quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, logging: false },
                    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
                    pagebreak: { mode: ["avoid-all", "css", "legacy"] }
                })
                .from(refs.resumePreview)
                .save();
            showToast("PDF downloaded successfully", "success");
        } catch (error) {
            console.error("PDF export error:", error);
            showToast("Error generating PDF. Please try again.", "error");
        } finally {
            refs.resumePreview.setAttribute("style", previousStyle);
            refs.resumePreview.classList.remove("exporting");
            setLoading(false);
        }
    }

    function bindPersonalField(field, key, rules) {
        field.addEventListener("input", () => {
            state[key] = field.value.trim();
            renderPreview();
            updateScore();
            if (rules) validateField(field, rules);
            saveState(false);
        });

        if (rules) {
            field.addEventListener("blur", () => validateField(field, rules));
        }
    }

    function bindEnterToAdd(input, handler) {
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                handler();
            }
        });
    }

    function bindEvents() {
        bindPersonalField(refs.name, "name", { required: true, requiredMessage: "Name is required" });
        bindPersonalField(refs.email, "email", { required: true, email: true, requiredMessage: "Email is required" });
        bindPersonalField(refs.phone, "phone", { phone: true });
        bindPersonalField(refs.linkedin, "linkedin");
        bindPersonalField(refs.github, "github");
        bindPersonalField(refs.summary, "summary");

        refs.addSkill.addEventListener("click", addSkill);
        refs.addProject.addEventListener("click", addProject);
        refs.addEducation.addEventListener("click", addEducation);
        refs.addExperience.addEventListener("click", addExperience);
        refs.photoInput.addEventListener("change", handlePhotoUpload);
        refs.checkATS.addEventListener("click", analyzeAts);
        refs.downloadBtn.addEventListener("click", downloadPdf);

        refs.templateButtons.forEach((button) => {
            button.addEventListener("click", () => handleTemplateClick(button));
        });

        refs.confirmCancel.addEventListener("click", hideConfirmModal);
        refs.confirmDelete.addEventListener("click", () => {
            if (pendingDelete) pendingDelete();
            hideConfirmModal();
        });

        bindEnterToAdd(refs.skillInput, addSkill);
        bindEnterToAdd(refs.projectInput, addProject);
        bindEnterToAdd(refs.experienceInput, addExperience);
        [refs.college, refs.degree, refs.year, refs.percentage].forEach((input) => bindEnterToAdd(input, addEducation));
    }

    function initFromQueryString() {
        const search = window.location && window.location.search ? window.location.search : "";
        const template = new URLSearchParams(search).get("template");
        if (template) {
            state.template = template.trim().toLowerCase();
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        loadState();
        initFromQueryString();
        syncInputsFromState();
        bindEvents();
        renderAll();
        console.log("ResumeForge Builder Loaded");
    });
})();
