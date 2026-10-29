
"use strict";

/* =========================================================
   PAPERFORGE — QUESTION PAPER BUILDER
   Frontend application: HTML + CSS + JavaScript
   ========================================================= */

const $ = (id) => document.getElementById(id);

const DRAFT_KEY = "paperforge_draft_v1";
const TEMPLATES_KEY = "paperforge_templates_v1";

let logoData = "";
let zoom = 0.8;
let previewOnly = false;
let saveTimer = null;

/* =========================================================
   1. INITIAL DOCUMENT DATA
   ========================================================= */

function createSamplePaper() {
  return {
    meta: {
      institution: "Bangladesh Army University of Science and Technology",
      department: "Department of Computer Science and Engineering",
      examTitle: "Final Examination, Winter 2026",
      levelTerm: "Level-2 Term-II",
      courseCode: "CSE 2203",
      courseTitle: "Data Structures and Algorithms",
      examTime: "03 (Three) hours",
      fullMarks: "100"
    },

    instructions: [
      "Figures in the margin indicate full marks.",
      "Answer the questions according to the instructions given in each part.",
      "Use separate answer scripts for each PART, if required.",
      "Corresponding course outcomes (COs) are given where applicable."
    ],

    parts: [
      {
        id: makeId(),
        title: "PART-A",
        marks: "50",
        instruction: "Answer any THREE questions.",
        questions: [
          {
            id: makeId(),
            number: "1",
            text: "Explain the difference between an array and a linked list.",
            marks: "10",
            co: "1",
            subs: [
              {
                label: "a)",
                text: "Describe two advantages of linked lists over arrays.",
                marks: "05",
                co: "1"
              },
              {
                label: "b)",
                text: "Write an algorithm to insert a node at the beginning of a singly linked list.",
                marks: "05",
                co: "2"
              }
            ]
          },
          {
            id: makeId(),
            number: "2",
            text: "Explain stack operations and their applications.",
            marks: "10",
            co: "2",
            subs: [
              {
                label: "a)",
                text: "Define stack overflow and stack underflow.",
                marks: "04",
                co: "1"
              },
              {
                label: "b)",
                text: "Convert the infix expression A + B * C into postfix notation.",
                marks: "06",
                co: "2"
              }
            ]
          }
        ]
      },
      {
        id: makeId(),
        title: "PART-B",
        marks: "50",
        instruction: "Answer any TWO questions from this part.",
        questions: [
          {
            id: makeId(),
            number: "3",
            text: "Solve the recurrence relation $T(n)=2T(n/2)+n$ using the Master Theorem.",
            marks: "15",
            co: "3",
            subs: [
              {
                label: "a)",
                text: "Identify a, b, and f(n).",
                marks: "05",
                co: "2"
              },
              {
                label: "b)",
                text: "Derive the asymptotic time complexity.",
                marks: "10",
                co: "3"
              }
            ]
          }
        ]
      }
    ],

    settings: {
      paperSize: "A4",
      orientation: "portrait",
      fontSize: "11",
      margins: "standard"
    }
  };
}

let paperData = createSamplePaper();

/* =========================================================
   2. GENERAL UTILITIES
   ========================================================= */

function makeId() {
  return "item-" + Math.random().toString(36).slice(2, 11);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function plainText(html) {
  const element = document.createElement("div");
  element.innerHTML = html || "";
  return element.textContent || "";
}

function safeFilename(value) {
  return String(value || "question-paper")
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "question-paper";
}

function showToast(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function countQuestions() {
  return paperData.parts.reduce(
    (total, part) => total + part.questions.length,
    0
  );
}

function findQuestion(questionId) {
  for (const part of paperData.parts) {
    const question = part.questions.find(
      item => item.id === questionId
    );

    if (question) return { part, question };
  }

  return null;
}

function findPart(partId) {
  return paperData.parts.find(part => part.id === partId);
}

/* =========================================================
   3. METADATA AND SETTINGS
   ========================================================= */

function readMetadata() {
  Object.keys(paperData.meta).forEach(key => {
    const field = $(key);

    if (field) {
      paperData.meta[key] = field.value;
    }
  });
}

function applyMetadata() {
  Object.entries(paperData.meta).forEach(([key, value]) => {
    const field = $(key);

    if (field) {
      field.value = value ?? "";
    }
  });

  const settings = paperData.settings || {};

  $("paperSize").value = settings.paperSize || "A4";
  $("orientation").value = settings.orientation || "portrait";
  $("fontSize").value = settings.fontSize || "11";
  $("margins").value = settings.margins || "standard";

  updateLogoPreview();
}

function readSettings() {
  paperData.settings = {
    paperSize: $("paperSize").value,
    orientation: $("orientation").value,
    fontSize: $("fontSize").value,
    margins: $("margins").value
  };
}

function updateLogoPreview() {
  const preview = $("logoPreview");

  preview.replaceChildren();

  if (!logoData) {
    preview.textContent = "LOGO";
    return;
  }

  const image = document.createElement("img");
  image.src = logoData;
  image.alt = "Institution logo";

  preview.appendChild(image);
}

/* =========================================================
   4. AUTOSAVE AND PROJECT STORAGE
   ========================================================= */

function saveDraft(showMessage = false) {
  try {
    readMetadata();
    readSettings();

    paperData.logo = logoData;

    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify(paperData)
    );

    $("saveStatus").textContent = "● Changes saved locally";

    if (showMessage) {
      showToast("Draft saved in this browser.");
    }

    return true;
  } catch (error) {
    $("saveStatus").textContent = "● Save unavailable";
    if (showMessage) {
      showToast("Could not save. Browser storage may be full.");
    }

    return false;
  }
}

function scheduleSave() {
  $("saveStatus").textContent = "● Saving changes…";

  clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    saveDraft(false);
  }, 400);
}

function loadDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);

    if (!saved) return false;

    const parsed = JSON.parse(saved);

    if (!parsed.meta || !Array.isArray(parsed.parts)) {
      return false;
    }

    paperData = parsed;

    paperData.settings ||= {
      paperSize: "A4",
      orientation: "portrait",
      fontSize: "11",
      margins: "standard"
    };

    paperData.instructions ||= [];
    paperData.parts ||= [];
    logoData = paperData.logo || "";

    return true;
  } catch (error) {
    console.error("Unable to load draft:", error);
    return false;
  }
}

/* =========================================================
   5. INSTRUCTIONS EDITOR
   ========================================================= */

function renderInstructions() {
  $("instructionsEditor").innerHTML =
    paperData.instructions.map((instruction, index) => `
      <div class="instruction-row">
        <span class="instruction-number">${index + 1}.</span>

        <textarea
          class="instruction-input"
          data-instruction-index="${index}"
          rows="1"
          aria-label="Instruction ${index + 1}"
        >${escapeHTML(instruction)}</textarea>

        <button
          type="button"
          class="remove-btn"
          data-remove-instruction="${index}"
          title="Remove instruction"
        >×</button>
      </div>
    `).join("");
}

function addInstruction() {
  paperData.instructions.push("");

  renderInstructions();
  renderPreview();
  scheduleSave();

  const fields = document.querySelectorAll(
    "[data-instruction-index]"
  );

  fields[fields.length - 1]?.focus();
}

/* =========================================================
   6. QUESTION EDITOR
   ========================================================= */

function renderQuestion(question) {
  return `
    <div class="question-item" data-question="${question.id}">

      <div class="question-top">
        <span class="question-badge">
          Q${escapeHTML(question.number)}
        </span>

        <input
          class="question-number"
          data-question-number="${question.id}"
          aria-label="Question number"
          title="Edit question number"
          value="${escapeHTML(question.number)}"
        >

        <button
          type="button"
          class="icon-action"
          data-move-question="${question.id}"
          title="Move question down"
        >↕</button>

        <button
          type="button"
          class="icon-action"
          data-remove-question="${question.id}"
          title="Remove question"
        >×</button>
      </div>

      <div class="format-toolbar">
        <button type="button" data-format="bold" data-target="${question.id}">
          <b>B</b>
        </button>

        <button type="button" data-format="italic" data-target="${question.id}">
          <i>I</i>
        </button>

        <button type="button" data-format="underline" data-target="${question.id}">
          <u>U</u>
        </button>

        <button type="button" data-math="${question.id}">
          ∑ Math
        </button>

        <button type="button" data-image="${question.id}">
          ▧ Image
        </button>
      </div>

      <div
        class="question-text"
        contenteditable="true"
        data-question-text="${question.id}"
        data-placeholder="Write your question here..."
        aria-label="Question text"
      >${cleanRichText(question.text)}</div>

      <div class="question-meta">
        <label>
          Main question marks
          <input
            data-question-marks="${question.id}"
            value="${escapeHTML(question.marks)}"
            placeholder="10"
          >
        </label>

        <label>
          CO
          <input
            data-question-co="${question.id}"
            value="${escapeHTML(question.co)}"
            placeholder="1"
          >
        </label>

        <label>
          Sub-items
          <input
            readonly
            value="${question.subs.length}"
            aria-label="Number of sub-questions"
          >
        </label>
      </div>

      <div class="subquestions">
        ${question.subs.map((sub, index) =>
          renderSubQuestion(question, sub, index)
        ).join("")}
      </div>

      <button
        type="button"
        class="add-sub-btn"
        data-add-sub="${question.id}"
      >＋ Add sub-question</button>
    </div>
  `;
}

function renderSubQuestion(question, sub, index) {
  const subKey = `${question.id}:${index}`;

  return `
    <div class="subquestion-row" data-sub-row="${subKey}">

      <span class="sub-label">
        ${escapeHTML(sub.label || `${String.fromCharCode(97 + index)})`)}
      </span>

      <div
        class="sub-text"
        contenteditable="true"
        data-sub-text="${subKey}"
        data-placeholder="Sub-question text"
        aria-label="Sub-question text"
      >${cleanRichText(sub.text)}</div>

      <input
        class="sub-meta"
        data-sub-marks="${subKey}"
        value="${escapeHTML(sub.marks)}"
        placeholder="05"
        aria-label="Sub-question marks"
      >

      <input
        class="sub-meta"
        data-sub-co="${subKey}"
        value="${escapeHTML(sub.co)}"
        placeholder="CO"
        aria-label="Course outcome"
      >

      <button
        type="button"
        class="remove-btn"
        data-remove-sub="${subKey}"
        title="Remove sub-question"
      >×</button>
    </div>
  `;
}

/*
 * Sanitize rich text before it is inserted into the editor or preview.
 * Only basic formatting and inline images are supported.
 */
function cleanRichText(value) {
  const template = document.createElement("template");
  template.innerHTML = String(value || "");

  template.content.querySelectorAll(
    "script,style,iframe,object,embed,form,link,meta"
  ).forEach(node => node.remove());

  const allowed = new Set([
    "B", "STRONG", "I", "EM", "U", "BR",
    "P", "DIV", "SPAN", "SUB", "SUP", "IMG",
    "UL", "OL", "LI"
  ]);

  function sanitizeNode(node) {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!allowed.has(child.tagName)) {
          child.replaceWith(
            document.createTextNode(child.textContent || "")
          );
          return;
        }

        [...child.attributes].forEach(attribute => {
          const name = attribute.name.toLowerCase();

          if (name.startsWith("on")) {
            child.removeAttribute(attribute.name);
          }
        });

        if (child.tagName === "IMG") {
          const src = child.getAttribute("src") || "";

          if (
            !src.startsWith("data:image/") &&
            !src.startsWith("blob:")
          ) {
            child.remove();
            return;
          }

          [...child.attributes].forEach(attribute => {
            if (!["src", "alt", "style", "width", "height"].includes(attribute.name)) {
              child.removeAttribute(attribute.name);
            }
          });

          child.style.maxWidth = "100%";
          child.style.height = "auto";
        } else {
          [...child.attributes].forEach(attribute => {
            if (attribute.name !== "style") {
              child.removeAttribute(attribute.name);
            }
          });

          sanitizeNode(child);
        }
      }
    });
  }

  sanitizeNode(template.content);

  return template.innerHTML;
}

function renderPartsEditor() {
  $("partsEditor").innerHTML = paperData.parts.map((part, partIndex) => `
    <section class="part-editor" data-part="${part.id}">

      <div class="part-heading">
        <span class="step">${String.fromCharCode(65 + partIndex % 26)}</span>

        <input
          type="text"
          data-part-title="${part.id}"
          aria-label="Part title"
          value="${escapeHTML(part.title)}"
        >

        <input
          class="part-marks"
          data-part-marks="${part.id}"
          aria-label="Part marks"
          value="${escapeHTML(part.marks)}"
          placeholder="Marks"
        >

        <button
          type="button"
          class="icon-action"
          data-move-part="${part.id}"
          title="Move part down"
        >↕</button>

        <button
          type="button"
          class="icon-action"
          data-remove-part="${part.id}"
          title="Remove part"
        >×</button>
      </div>

      <div class="part-content">
        <textarea
          class="part-instruction"
          data-part-instruction="${part.id}"
          placeholder="Instructions for this part"
        >${escapeHTML(part.instruction)}</textarea>

        ${part.questions.map(renderQuestion).join("")}

        <button
          type="button"
          class="add-question-btn"
          data-add-question="${part.id}"
        >＋ Add main question</button>
      </div>
    </section>
  `).join("");

  $("questionCount").textContent =
    `${countQuestions()} QUESTION${countQuestions() === 1 ? "" : "S"}`;

  renderOutline();
}

function addPart() {
  const part = {
    id: makeId(),
    title: `PART-${String.fromCharCode(65 + paperData.parts.length)}`,
    marks: "",
    instruction: "",
    questions: []
  };

  paperData.parts.push(part);

  renderPartsEditor();
  renderPreview();
  scheduleSave();
}

function addQuestion(partId) {
  const part = findPart(partId);

  if (!part) return;

  const numbers = paperData.parts
    .flatMap(item => item.questions)
    .map(item => Number(item.number))
    .filter(Number.isFinite);

  const nextNumber = Math.max(0, ...numbers) + 1;

  const question = {
    id: makeId(),
    number: String(nextNumber),
    text: "",
    marks: "",
    co: "",
    subs: []
  };

  part.questions.push(question);

  renderPartsEditor();
  renderPreview();
  scheduleSave();

  document.querySelector(
    `[data-question-text="${question.id}"]`
  )?.focus();
}

function addSubQuestion(questionId) {
  const found = findQuestion(questionId);

  if (!found) return;

  const index = found.question.subs.length;

  found.question.subs.push({
    label: `${String.fromCharCode(97 + index)})`,
    text: "",
    marks: "",
    co: ""
  });

  renderPartsEditor();
  renderPreview();
  scheduleSave();
}

function removeQuestion(questionId) {
  const found = findQuestion(questionId);

  if (!found) return;

  found.part.questions = found.part.questions.filter(
    question => question.id !== questionId
  );

  renderPartsEditor();
  renderPreview();
  scheduleSave();
}

function removePart(partId) {
  if (paperData.parts.length <= 1) {
    showToast("At least one part must remain.");
    return;
  }

  paperData.parts = paperData.parts.filter(
    part => part.id !== partId
  );

  renderPartsEditor();
  renderPreview();
  scheduleSave();
}

function removeSubQuestion(key) {
  const [questionId, indexString] = key.split(":");
  const found = findQuestion(questionId);

  if (!found) return;

  found.question.subs.splice(Number(indexString), 1);

  found.question.subs.forEach((sub, index) => {
    sub.label = `${String.fromCharCode(97 + index)})`;
  });

  renderPartsEditor();
  renderPreview();
  scheduleSave();
}

/* =========================================================
   7. SYNCHRONIZE EDITOR CONTENT
   ========================================================= */

function syncRichText() {
  document.querySelectorAll("[data-question-text]").forEach(field => {
    const found = findQuestion(field.dataset.questionText);

    if (found) {
      found.question.text = cleanRichText(field.innerHTML);
    }
  });

  document.querySelectorAll("[data-sub-text]").forEach(field => {
    const [questionId, indexString] = field.dataset.subText.split(":");
    const found = findQuestion(questionId);

    if (found && found.question.subs[Number(indexString)]) {
      found.question.subs[Number(indexString)].text =
        cleanRichText(field.innerHTML);
    }
  });
}

function syncVisibleFields(event) {
  const field = event.target;

  if (field.dataset.partTitle) {
    const part = findPart(field.dataset.partTitle);

    if (part) part.title = field.value;
  }

  if (field.dataset.partMarks) {
    const part = findPart(field.dataset.partMarks);

    if (part) part.marks = field.value;
  }

  if (field.dataset.partInstruction) {
    const part = findPart(field.dataset.partInstruction);

    if (part) part.instruction = field.value;
  }

  if (field.dataset.questionNumber) {
    const found = findQuestion(field.dataset.questionNumber);

    if (found) found.question.number = field.value;

    const badge = field.closest(".question-top")
      ?.querySelector(".question-badge");

    if (badge) badge.textContent = "Q" + field.value;
  }

  if (field.dataset.questionMarks) {
    const found = findQuestion(field.dataset.questionMarks);

    if (found) found.question.marks = field.value;
  }

  if (field.dataset.questionCo) {
    const found = findQuestion(field.dataset.questionCo);

    if (found) found.question.co = field.value;
  }

  if (field.dataset.subMarks || field.dataset.subCo) {
    const key = field.dataset.subMarks || field.dataset.subCo;
    const [questionId, indexString] = key.split(":");
    const found = findQuestion(questionId);
    const sub = found?.question.subs[Number(indexString)];

    if (sub) {
      if (field.dataset.subMarks) sub.marks = field.value;
      if (field.dataset.subCo) sub.co = field.value;
    }
  }

  if (
    field.matches("[data-question-text]") ||
    field.matches("[data-sub-text]")
  ) {
    syncRichText();
  }

  renderPreview();
  renderOutline();
  scheduleSave();
}

/* =========================================================
   8. LIVE PAPER PREVIEW
   ========================================================= */

function renderPaperQuestion(question) {
  const subQuestions = question.subs.map(sub => `
    <div class="paper-sub">
      <span class="paper-sub-label">${escapeHTML(sub.label)}</span>
      <div class="paper-sub-text">${cleanRichText(sub.text)}</div>
      <div class="paper-sub-marks">${sub.marks ? `(${escapeHTML(sub.marks)})` : ""}</div>
      <div class="paper-sub-co">${escapeHTML(sub.co || "")}</div>
    </div>
  `).join("");

  return `
    <div class="paper-question">
      <div class="paper-q-body">
        <div class="paper-q-line">
          <span class="paper-q-number">${escapeHTML(question.number)}.</span>
          <div class="paper-q-text">${cleanRichText(question.text)}</div>
        </div>
        ${subQuestions}
      </div>

      <div class="paper-q-marks">${escapeHTML(question.marks)}</div>
      <div class="paper-q-co">${escapeHTML(question.co)}</div>
    </div>
  `;
}

function renderPreview() {
  readMetadata();

  const meta = paperData.meta;

  const logoHTML = logoData
    ? `<img class="paper-logo" src="${logoData}" alt="Institution logo">`
    : "";

  const instructionsHTML = paperData.instructions.length
    ? `
      <div class="paper-nb-title">N.B.</div>
      <ol class="paper-instructions">
        ${paperData.instructions.map(instruction =>
          `<li>${escapeHTML(instruction)}</li>`
        ).join("")}
      </ol>
    `
    : "";

  const partsHTML = paperData.parts.map(part => `
    <section class="paper-part">
      <div class="paper-part-title">
        ${escapeHTML(part.title)}
        ${part.marks ? ` (Marks: ${escapeHTML(part.marks)})` : ""}
      </div>

      ${part.instruction
        ? `<div class="paper-part-instruction">${escapeHTML(part.instruction)}</div>`
        : ""}

      ${part.questions.map(renderPaperQuestion).join("")}
    </section>
  `).join("");

  $("paperContent").innerHTML = `
    <header class="paper-header">
      ${logoHTML}

      <div class="paper-institution">${escapeHTML(meta.institution)}</div>
      <div class="paper-department">${escapeHTML(meta.department)}</div>

      <div class="paper-exam-title">${escapeHTML(meta.examTitle)}</div>
      <div class="paper-level">${escapeHTML(meta.levelTerm)}</div>

      <div class="paper-metadata">
        <span><b>Course Code:</b> ${escapeHTML(meta.courseCode)}</span>
        <span><b>Full Marks:</b> ${escapeHTML(meta.fullMarks)}</span>
      </div>

      <div class="paper-course-title">
        <b>Course Title:</b> ${escapeHTML(meta.courseTitle)}
      </div>

      <div class="paper-time">
        <span>Time: ${escapeHTML(meta.examTime)}</span>
        <span>Full Marks: ${escapeHTML(meta.fullMarks)}</span>
      </div>
    </header>

    ${instructionsHTML}
    ${partsHTML}
  `;

  applyPreviewSettings();

  $("zoomLabel").textContent = `${Math.round(zoom * 100)}%`;

  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise([$ ("paperContent")]).catch(console.error);
  }
}

function applyPreviewSettings() {
  const paper = $("paper");

  paper.style.transform = `scale(${zoom})`;
  paper.style.fontSize = `${paperData.settings.fontSize || 11}px`;

  if (paperData.settings.paperSize === "Letter") {
    paper.style.width = "612px";
    paper.style.minHeight = "792px";
  } else {
    paper.style.width = "595px";
    paper.style.minHeight = "842px";
  }

  if (paperData.settings.orientation === "landscape") {
    paper.style.width = "842px";
    paper.style.minHeight = "595px";
  }

  const marginValues = {
    narrow: "30px",
    standard: "42px",
    wide: "60px"
  };

  paper.style.padding =
    marginValues[paperData.settings.margins] || "42px";
}

/* =========================================================
   9. DOCUMENT OUTLINE
   ========================================================= */

function renderOutline() {
  $("outline").innerHTML = paperData.parts.map(part => `
    <a href="#" data-outline-part="${part.id}">
      ▪ ${escapeHTML(part.title || "Untitled part")}
    </a>

    ${part.questions.map(question => `
      <a href="#" class="sub" data-outline-question="${question.id}">
        Q${escapeHTML(question.number)} — ${escapeHTML(
          plainText(question.text).slice(0, 28) || "New question"
        )}
      </a>
    `).join("")}
  `).join("");
}

function jumpToItem(element) {
  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

/* =========================================================
   10. FORMULA AND IMAGE INSERTION
   ========================================================= */

function insertMath(questionId) {
  const formula = prompt(
    "Enter a LaTeX formula.\n\n" +
    "Example: \\int_0^\\infty e^{-x}\\,dx = 1\n\n" +
    "Do not include the surrounding dollar signs."
  );

  if (formula === null || !formula.trim()) return;

  const editor = document.querySelector(
    `[data-question-text="${questionId}"]`
  );

  if (!editor) return;

  editor.focus();

  const inserted = document.execCommand(
    "insertText",
    false,
    ` $${formula.trim()}$ `
  );

  if (!inserted) {
    editor.appendChild(
      document.createTextNode(` $${formula.trim()}$ `)
    );
  }

  syncRichText();
  renderPreview();
  scheduleSave();
}

function insertImage(questionId) {
  const input = document.createElement("input");

  input.type = "file";
  input.accept = "image/png,image/jpeg,image/webp,image/gif";

  input.addEventListener("change", () => {
    const file = input.files?.[0];

    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast("Please choose an image smaller than 3 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const editor = document.querySelector(
        `[data-question-text="${questionId}"]`
      );

      if (!editor) return;

      const image = document.createElement("img");
      image.src = reader.result;
      image.alt = "Question diagram";
      image.style.maxWidth = "100%";

      editor.appendChild(document.createTextNode(" "));
      editor.appendChild(image);

      syncRichText();
      renderPreview();
      scheduleSave();
    };

    reader.readAsDataURL(file);
  });

  input.click();
}

function applyFormatting(command, questionId) {
  const editor = document.querySelector(
    `[data-question-text="${questionId}"]`
  );

  if (!editor) return;

  editor.focus();

  document.execCommand(command, false, null);

  syncRichText();
  renderPreview();
  scheduleSave();
}

/* =========================================================
   11. PDF EXPORT
   ========================================================= */

function configurePrint() {
  readMetadata();
  readSettings();
  syncRichText();
  renderPreview();

  const settings = paperData.settings;
  const paper = $("paper");

  const size = settings.paperSize === "Letter" ? "letter" : "A4";
  const orientation = settings.orientation || "portrait";

  const margins = {
    narrow: "12mm",
    standard: "18mm",
    wide: "25mm"
  };

  let style = $("dynamicPrintStyle");

  if (!style) {
    style = document.createElement("style");
    style.id = "dynamicPrintStyle";
    document.head.appendChild(style);
  }

  style.textContent = `
    @page {
      size: ${size} ${orientation};
      margin: ${margins[settings.margins] || "18mm"};
    }

    @media print {
      #paper {
        font-size: ${settings.fontSize || 11}pt !important;
      }
    }
  `;

  paper.style.transform = "none";

  setTimeout(() => {
    window.print();

    setTimeout(() => {
      applyPreviewSettings();
    }, 500);
  }, 150);
}

/* =========================================================
   12. WORD DOCUMENT EXPORT
   ========================================================= */

async function exportWord() {
  readMetadata();
  readSettings();
  syncRichText();

  if (!window.docx) {
    showToast(
      "Word export is loading. Check your internet connection and retry."
    );
    return;
  }

  try {
    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      AlignmentType,
      HeadingLevel,
      ImageRun
    } = window.docx;

    const meta = paperData.meta;
    const children = [];

    function paragraph(text, options = {}) {
      return new Paragraph({
        alignment: options.alignment,
        spacing: options.spacing || { after: 80 },
        children: [
          new TextRun({
            text: String(text ?? ""),
            font: "Times New Roman",
            size: options.size || 22,
            bold: Boolean(options.bold),
            italics: Boolean(options.italics)
          })
        ]
      });
    }

    // Insert the institutional logo when possible.
    if (logoData && logoData.startsWith("data:image/")) {
      try {
        const response = await fetch(logoData);
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();

        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: buffer,
              transformation: {
                width: 65,
                height: 65
              }
            })
          ]
        }));
      } catch (error) {
        console.warn("Logo export skipped:", error);
      }
    }

    children.push(paragraph(meta.institution, {
      alignment: AlignmentType.CENTER,
      bold: true,
      size: 28
    }));

    children.push(paragraph(meta.department, {
      alignment: AlignmentType.CENTER,
      size: 21
    }));

    children.push(paragraph(meta.examTitle, {
      alignment: AlignmentType.CENTER,
      bold: true,
      size: 24,
      spacing: { before: 120, after: 40 }
    }));

    children.push(paragraph(meta.levelTerm, {
      alignment: AlignmentType.CENTER,
      size: 20
    }));

    children.push(paragraph(
      `Course Code: ${meta.courseCode}    Full Marks: ${meta.fullMarks}`,
      { bold: true, size: 20, spacing: { before: 100, after: 40 } }
    ));

    children.push(paragraph(
      `Course Title: ${meta.courseTitle}`,
      { size: 20 }
    ));

    children.push(paragraph(
      `Time: ${meta.examTime}    Full Marks: ${meta.fullMarks}`,
      { bold: true, size: 20, spacing: { before: 100, after: 140 } }
    ));

    if (paperData.instructions.length) {
      children.push(paragraph("N.B.", {
        bold: true,
        size: 21,
        spacing: { before: 100, after: 40 }
      }));

      paperData.instructions.forEach(instruction => {
        children.push(new Paragraph({
          text: plainText(instruction),
          bullet: { indent: 260 },
          spacing: { after: 50 }
        }));
      });
    }

    paperData.parts.forEach(part => {
      children.push(new Paragraph({
        text: `${part.title}${part.marks ? ` (Marks: ${part.marks})` : ""}`,
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 80 }
      }));

      if (part.instruction) {
        children.push(paragraph(part.instruction, {
          alignment: AlignmentType.CENTER,
          italics: true,
          size: 19
        }));
      }

      part.questions.forEach(question => {
        const questionText =
          `${question.number}. ${plainText(question.text)}`;

        children.push(new Paragraph({
          children: [
            new TextRun({
              text: questionText,
              font: "Times New Roman",
              size: 21
            }),
            new TextRun({
              text: question.marks ? `     [${question.marks}]` : "",
              font: "Times New Roman",
              size: 19,
              bold: true
            }),
            new TextRun({
              text: question.co ? `    CO: ${question.co}` : "",
              font: "Times New Roman",
              size: 19
            })
          ],
          spacing: { before: 100, after: 50 }
        }));

        question.subs.forEach((sub, index) => {
          children.push(new Paragraph({
            children: [
              new TextRun({
                text:
                  `    ${sub.label || `${String.fromCharCode(97 + index)})`} ` +
                  `${plainText(sub.text)}` +
                  `${sub.marks ? ` (${sub.marks})` : ""}` +
                  `${sub.co ? `   CO: ${sub.co}` : ""}`,
                font: "Times New Roman",
                size: 20
              })
            ],
            indent: { left: 240 },
            spacing: { after: 60 }
          }));
        });
      });
    });

    const documentFile = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838
            },
            margin: {
              top: 1020,
              right: 1020,
              bottom: 1020,
              left: 1020
            }
          }
        },
        children
      }]
    });

    const blob = await Packer.toBlob(documentFile);

    downloadBlob(
      blob,
      safeFilename(`${meta.courseCode}-${meta.examTitle}`) + ".docx"
    );

    showToast(
      "Word document exported. Review page breaks in Word."
    );
  } catch (error) {
    console.error("Word export failed:", error);

    showToast(
      "Word export failed. Check the browser console for details."
    );
  }
}

/* =========================================================
   13. JSON PROJECT IMPORT AND EXPORT
   ========================================================= */

function exportProject() {
  readMetadata();
  readSettings();
  syncRichText();

  paperData.logo = logoData;

  const blob = new Blob(
    [JSON.stringify(paperData, null, 2)],
    { type: "application/json" }
  );

  downloadBlob(blob, "question-paper-project.json");

  showToast("Project backup downloaded.");
}

function importProjectFile(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);

      if (!imported.meta || !Array.isArray(imported.parts)) {
        throw new Error("Invalid project format");
      }

      if (!imported.parts.length) {
        imported.parts.push({
          id: makeId(),
          title: "PART-A",
          marks: "",
          instruction: "",
          questions: []
        });
      }

      imported.instructions ||= [];
      imported.settings ||= {
        paperSize: "A4",
        orientation: "portrait",
        fontSize: "11",
        margins: "standard"
      };

      imported.parts.forEach(part => {
        part.id ||= makeId();
        part.questions ||= [];

        part.questions.forEach(question => {
          question.id ||= makeId();
          question.text ||= "";
          question.marks ||= "";
          question.co ||= "";
          question.subs ||= [];

          question.subs.forEach(sub => {
            sub.text ||= "";
            sub.marks ||= "";
            sub.co ||= "";
          });
        });
      });

      paperData = imported;
      logoData = imported.logo || "";

      applyMetadata();
      renderAll();
      saveDraft(false);

      showToast("Project imported successfully.");
      showView("editor");
    } catch (error) {
      console.error(error);
      showToast("Invalid project file.");
    }
  };

  reader.readAsText(file);
}

/* =========================================================
   14. REUSABLE TEMPLATES
   ========================================================= */

function getTemplates() {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveTemplate() {
  const name = $("templateName").value.trim();

  if (!name) {
    showToast("Enter a template name.");
    $("templateName").focus();
    return;
  }

  readMetadata();

  const templates = getTemplates();

  templates.push({
    id: makeId(),
    name,
    meta: { ...paperData.meta },
    instructions: [...paperData.instructions],
    logo: logoData
  });

  try {
    localStorage.setItem(
      TEMPLATES_KEY,
      JSON.stringify(templates)
    );

    $("templateName").value = "";

    renderSavedTemplates();
    showToast("Header template saved.");
  } catch (error) {
    showToast("Could not save template. Browser storage may be full.");
  }
}

function renderSavedTemplates() {
  const templates = getTemplates();

  $("savedTemplates").innerHTML = templates.length
    ? templates.map(template => `
      <div class="saved-template">
        <span>${escapeHTML(template.name)}</span>
        <span>
          <button data-apply-template="${template.id}">Apply</button>
          <button data-delete-template="${template.id}">Delete</button>
        </span>
      </div>
    `).join("")
    : `<p class="muted">No saved templates yet.</p>`;
}

function applySavedTemplate(templateId) {
  const template = getTemplates().find(
    item => item.id === templateId
  );

  if (!template) return;

  paperData.meta = {
    ...paperData.meta,
    ...template.meta
  };

  paperData.instructions = [...(template.instructions || [])];
  logoData = template.logo || "";

  applyMetadata();
  renderAll();
  scheduleSave();

  showView("editor");
  showToast("Template applied.");
}

function deleteSavedTemplate(templateId) {
  const templates = getTemplates().filter(
    template => template.id !== templateId
  );

  localStorage.setItem(
    TEMPLATES_KEY,
    JSON.stringify(templates)
  );

  renderSavedTemplates();
  showToast("Template deleted.");
}

function usePreset(type) {
  if (type === "blank") {
    paperData = createSamplePaper();

    paperData.instructions = [];

    paperData.parts = [{
      id: makeId(),
      title: "PART-A",
      marks: "",
      instruction: "",
      questions: []
    }];

    logoData = "";
  } else if (type === "classTest") {
    paperData = createSamplePaper();

    paperData.meta.examTitle = "Class Test";
    paperData.meta.examTime = "01 (One) hour";
    paperData.meta.fullMarks = "20";

    paperData.instructions = [
      "Answer all questions.",
      "Figures in the margin indicate full marks."
    ];

    paperData.parts = [{
      id: makeId(),
      title: "CLASS TEST",
      marks: "20",
      instruction: "Answer all questions.",
      questions: [
        {
          id: makeId(),
          number: "1",
          text: "",
          marks: "10",
          co: "",
          subs: []
        },
        {
          id: makeId(),
          number: "2",
          text: "",
          marks: "10",
          co: "",
          subs: []
        }
      ]
    }];

    logoData = "";
  } else {
    paperData = createSamplePaper();
  }

  applyMetadata();
  renderAll();
  scheduleSave();

  showView("editor");
  showToast("Template loaded.");
}

/* =========================================================
   15. VIEW NAVIGATION
   ========================================================= */

function showView(view) {
  const editor = $("editorView");
  const settings = $("settingsView");
  const templates = $("templatesView");

  editor.classList.toggle("hidden", view !== "editor");
  settings.classList.toggle("hidden", view !== "settings");
  templates.classList.toggle("hidden", view !== "templates");

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === view
    );
  });
}

function renderAll() {
  renderInstructions();
  renderPartsEditor();
  renderPreview();
  renderSavedTemplates();
}

/* =========================================================
   16. RESET DOCUMENT
   ========================================================= */

function resetDocument() {
  if (!confirm("Reset the paper to the original sample document?")) {
    return;
  }

  paperData = createSamplePaper();
  logoData = "";

  applyMetadata();
  renderAll();
  scheduleSave();

  showView("editor");
  showToast("Sample paper restored.");
}

/* =========================================================
   17. EVENT LISTENERS
   ========================================================= */

function bindEvents() {
  // Metadata changes.
  Object.keys(paperData.meta).forEach(key => {
    $(key)?.addEventListener("input", () => {
      readMetadata();
      renderPreview();
      scheduleSave();
    });
  });

  // General settings.
  ["paperSize", "orientation", "fontSize", "margins"].forEach(id => {
    $(id).addEventListener("change", () => {
      readSettings();
      renderPreview();
      scheduleSave();
    });
  });

  // Instruction edits.
  $("instructionsEditor").addEventListener("input", event => {
    const field = event.target.closest("[data-instruction-index]");

    if (!field) return;

    paperData.instructions[Number(field.dataset.instructionIndex)] =
      field.value;

    renderPreview();
    scheduleSave();
  });

  $("instructionsEditor").addEventListener("click", event => {
    const button = event.target.closest("[data-remove-instruction]");

    if (!button) return;

    paperData.instructions.splice(
      Number(button.dataset.removeInstruction),
      1
    );

    renderInstructions();
    renderPreview();
    scheduleSave();
  });

  $("addInstructionBtn").addEventListener(
    "click",
    addInstruction
  );

  // Question and part editor.
  $("partsEditor").addEventListener("input", syncVisibleFields);

  $("partsEditor").addEventListener("focusout", event => {
    if (
      event.target.matches("[data-question-text]") ||
      event.target.matches("[data-sub-text]")
    ) {
      syncRichText();
      renderPreview();
      scheduleSave();
    }
  });

  $("partsEditor").addEventListener("paste", event => {
    if (
      event.target.matches("[data-question-text]") ||
      event.target.matches("[data-sub-text]")
    ) {
      setTimeout(() => {
        syncRichText();
        renderPreview();
        scheduleSave();
      }, 0);
    }
  });

  $("partsEditor").addEventListener("click", event => {
    const button = event.target.closest("button");

    if (!button) return;

    if (button.dataset.addQuestion) {
      addQuestion(button.dataset.addQuestion);
      return;
    }

    if (button.dataset.addSub) {
      addSubQuestion(button.dataset.addSub);
      return;
    }

    if (button.dataset.removeQuestion) {
      removeQuestion(button.dataset.removeQuestion);
      return;
    }

    if (button.dataset.removePart) {
      removePart(button.dataset.removePart);
      return;
    }

    if (button.dataset.removeSub) {
      removeSubQuestion(button.dataset.removeSub);
      return;
    }

    if (button.dataset.format) {
      applyFormatting(
        button.dataset.format,
        button.dataset.target
      );
      return;
    }

    if (button.dataset.math) {
      insertMath(button.dataset.math);
      return;
    }

    if (button.dataset.image) {
      insertImage(button.dataset.image);
      return;
    }

    if (button.dataset.movePart) {
      const index = paperData.parts.findIndex(
        part => part.id === button.dataset.movePart
      );

      if (index >= 0 && index < paperData.parts.length - 1) {
        [
          paperData.parts[index],
          paperData.parts[index + 1]
        ] = [
          paperData.parts[index + 1],
          paperData.parts[index]
        ];

        renderPartsEditor();
        renderPreview();
        scheduleSave();
      }

      return;
    }

    if (button.dataset.moveQuestion) {
      const found = findQuestion(button.dataset.moveQuestion);

      if (!found) return;

      const index = found.part.questions.findIndex(
        question => question.id === button.dataset.moveQuestion
      );

      if (index >= 0 && index < found.part.questions.length - 1) {
        [
          found.part.questions[index],
          found.part.questions[index + 1]
        ] = [
          found.part.questions[index + 1],
          found.part.questions[index]
        ];

        renderPartsEditor();
        renderPreview();
        scheduleSave();
      }
    }
  });

  // Add parts.
  $("addPartBtn").addEventListener("click", addPart);
  $("addPartBottom").addEventListener("click", addPart);

  // Logo upload.
  $("logoInput").addEventListener("change", event => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Choose a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Logo must be smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      logoData = reader.result;
      updateLogoPreview();
      renderPreview();
      scheduleSave();
    };

    reader.readAsDataURL(file);
  });

  $("removeLogoBtn").addEventListener("click", () => {
    logoData = "";
    $("logoInput").value = "";

    updateLogoPreview();
    renderPreview();
    scheduleSave();
  });

  // Save and reset.
  $("saveBtn").addEventListener("click", () => {
    syncRichText();
    saveDraft(true);
  });

  $("resetBtn").addEventListener("click", resetDocument);

  // Export menu.
  $("exportBtn").addEventListener("click", event => {
    event.stopPropagation();
    $("exportMenu").classList.toggle("hidden");
  });

  document.addEventListener("click", event => {
    if (!event.target.closest(".top-actions")) {
      $("exportMenu").classList.add("hidden");
    }
  });

  $("pdfBtn").addEventListener("click", () => {
    $("exportMenu").classList.add("hidden");
    configurePrint();
  });

  $("wordBtn").addEventListener("click", () => {
    $("exportMenu").classList.add("hidden");
    exportWord();
  });

  $("backupBtn").addEventListener("click", () => {
    $("exportMenu").classList.add("hidden");
    exportProject();
  });

  $("importBtn").addEventListener("click", () => {
    $("exportMenu").classList.add("hidden");
    $("projectFile").click();
  });

  $("projectFile").addEventListener("change", event => {
    const file = event.target.files?.[0];

    if (file) {
      importProjectFile(file);
    }

    event.target.value = "";
  });

  // Preview zoom.
  $("zoomIn").addEventListener("click", () => {
    zoom = Math.min(1.1, zoom + 0.05);
    renderPreview();
  });

  $("zoomOut").addEventListener("click", () => {
    zoom = Math.max(0.45, zoom - 0.05);
    renderPreview();
  });

  // Preview-only mode.
  $("previewBtn").addEventListener("click", () => {
    previewOnly = !previewOnly;

    $("editorColumn")?.classList.toggle("hidden", previewOnly);
    document.querySelector(".editor-column")
      .classList.toggle("hidden", previewOnly);

    $("previewBtn").textContent =
      previewOnly ? "Back to editor" : "Preview only";
  });

  // Navigation.
  document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
      showView(button.dataset.view);
    });
  });

  // Templates.
  document.querySelectorAll("[data-template]").forEach(button => {
    button.addEventListener("click", () => {
      usePreset(button.dataset.template);
    });
  });

  $("saveTemplateBtn").addEventListener("click", saveTemplate);

  $("savedTemplates").addEventListener("click", event => {
    const applyButton = event.target.closest("[data-apply-template]");
    const deleteButton = event.target.closest("[data-delete-template]");

    if (applyButton) {
      applySavedTemplate(applyButton.dataset.applyTemplate);
    }

    if (deleteButton) {
      deleteSavedTemplate(deleteButton.dataset.deleteTemplate);
    }
  });

  // Outline navigation.
  $("outline").addEventListener("click", event => {
    const link = event.target.closest("a");

    if (!link) return;

    event.preventDefault();

    const partId = link.dataset.outlinePart;
    const questionId = link.dataset.outlineQuestion;

    if (partId) {
      jumpToItem(document.querySelector(
        `[data-part="${partId}"]`
      ));
    }

    if (questionId) {
      jumpToItem(document.querySelector(
        `[data-question="${questionId}"]`
      ));
    }
  });

  // Save changes before leaving the page.
  window.addEventListener("beforeunload", () => {
    syncRichText();
    saveDraft(false);
  });
}

/* =========================================================
   18. APPLICATION INITIALIZATION
   ========================================================= */

function init() {
  loadDraft();

  logoData = paperData.logo || "";

  applyMetadata();
  renderAll();
  bindEvents();

  $("saveStatus").textContent = "● Autosave enabled";
}

document.addEventListener("DOMContentLoaded", init);
