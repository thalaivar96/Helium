document.addEventListener("DOMContentLoaded", () => {
  const DRAFT_KEY = "helium-editor-draft";

  const themeSelect = document.getElementById("theme-select");
  const subjectEl = document.getElementById("chapter-subject");
  const titleEl = document.getElementById("chapter-title");
  const pathPreviewEl = document.getElementById("file-path-preview");
  const saveStatusEl = document.getElementById("save-status");
  const editorEl = document.getElementById("md-editor");
  const previewEl = document.getElementById("preview-container");
  const workspaceEl = document.getElementById("workspace");

  const loadSelect = document.getElementById("load-existing-select");
  const openFileInput = document.getElementById("open-file-input");
  const newDraftBtn = document.getElementById("new-draft-btn");
  const copyRegistryBtn = document.getElementById("copy-registry-btn");
  const downloadMdBtn = document.getElementById("download-md-btn");

  const mathModal = document.getElementById("mathlive-modal");
  const mathField = document.getElementById("mathlive-field");
  const mathRawBox = document.getElementById("mathlive-latex-raw");
  const openMathBtn = document.getElementById("open-mathlive-btn");
  const insertMathBtn = document.getElementById("insert-mathlive-btn");
  const toggleVkBtn = document.getElementById("toggle-vk-btn");

  const tableModal = document.getElementById("table-modal");
  const openTableBtn = document.getElementById("open-table-btn");
  const insertTableBtn = document.getElementById("insert-table-btn");

  /* --- Theme Sync --- */
  themeSelect.value = document.documentElement.getAttribute("data-theme") || "light";
  themeSelect.addEventListener("change", e => {
    const selected = e.target.value;
    document.documentElement.setAttribute("data-theme", selected);
    localStorage.setItem("helium-theme", selected);
  });

  /* --- Helpers --- */
  function slugify(text) {
    return (
      text
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "untitled"
    );
  }

  function getChapterMeta() {
    const subject = subjectEl.value;
    const title = titleEl.value.trim() || "Untitled Chapter";
    const slug = slugify(title);
    const subjectSlug = subject.toLowerCase();
    return {
      subject,
      title,
      slug,
      id: `${subjectSlug}/${slug}`,
      file: `notes/${subjectSlug}/${slug}.md`
    };
  }

  function updatePathPreview() {
    pathPreviewEl.textContent = getChapterMeta().file;
  }

  function insertAtCursor(before, after = "", defaultText = "") {
    const start = editorEl.selectionStart;
    const end = editorEl.selectionEnd;
    const selected = editorEl.value.slice(start, end) || defaultText;
    const replacement = `${before}${selected}${after}`;

    editorEl.setRangeText(replacement, start, end, "select");
    if (!editorEl.value.slice(start, end) && !selected) {
      const caret = start + before.length;
      editorEl.setSelectionRange(caret, caret);
    } else {
      editorEl.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    }
    editorEl.focus();
    schedulePreviewAndSave();
  }

  /* --- Live Preview Pipeline (Matches Helium Reader) --- */
  function renderMarkdownWithLatex(markdownText) {
    const normalized = markdownText.replace(/\r\n/g, "\n");
    const codeBlocks = [];
    const mathBlocks = [];

    let text = normalized.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, match => {
      const idx = codeBlocks.length;
      codeBlocks.push(match);
      return `CODETOKEN${idx}END`;
    });

    text = text.replace(/(?<!\\)\$\$([\s\S]+?)(?<!\\)\$\$/g, match => {
      const idx = mathBlocks.length;
      mathBlocks.push(match);
      return `MATHTOKEN${idx}END`;
    });

    text = text.replace(/(?<!\\)\\\[([\s\S]+?)(?<!\\)\\\]/g, match => {
      const idx = mathBlocks.length;
      mathBlocks.push(match);
      return `MATHTOKEN${idx}END`;
    });

    const enforceDisplayStyle = inner =>
      inner.trimStart().startsWith("\\displaystyle")
        ? inner
        : `\\displaystyle ${inner}`;

    text = text.replace(/(?<!\\)\$([^\n$]+?)(?<!\\)\$/g, (_, inner) => {
      const idx = mathBlocks.length;
      mathBlocks.push(`$${enforceDisplayStyle(inner)}$`);
      return `MATHTOKEN${idx}END`;
    });

    text = text.replace(/(?<!\\)\\\(([^\n]+?)(?<!\\)\\\)/g, (_, inner) => {
      const idx = mathBlocks.length;
      mathBlocks.push(`\\(${enforceDisplayStyle(inner)}\\)`);
      return `MATHTOKEN${idx}END`;
    });

    text = text.replace(/CODETOKEN(\d+)END/g, (_, idx) => codeBlocks[idx]);
    let html = marked.parse(text);

    const escapeHtml = str =>
      str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    html = html.replace(/MATHTOKEN(\d+)END/g, (_, idx) =>
      escapeHtml(mathBlocks[idx])
    );

    return html;
  }

  function renderPreview() {
    previewEl.innerHTML = renderMarkdownWithLatex(editorEl.value);

    previewEl.querySelectorAll("table").forEach(table => {
      const wrapper = document.createElement("div");
      wrapper.className = "table-wrapper";
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });

    if (typeof renderMathInElement === "function") {
      renderMathInElement(previewEl, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false
      });
    }
  }

  function saveDraft() {
    const payload = {
      subject: subjectEl.value,
      title: titleEl.value,
      content: editorEl.value
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    saveStatusEl.textContent = "Draft saved locally";
  }

  let debounceTimer = null;
  function schedulePreviewAndSave() {
    saveStatusEl.textContent = "Editing...";
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      renderPreview();
      saveDraft();
    }, 90);
  }

  /* --- Initialize Draft or Default Template --- */
  function loadDefaultTemplate() {
    subjectEl.value = "Physics";
    titleEl.value = "New Chapter";
    editorEl.value = [
      "# New Chapter",
      "",
      "## 1. Key Formulas",
      "State the governing relation for $x$:",
      "",
      "$$E = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q}{r^2}$$",
      "",
      "> **Note:** Summarize key boundary conditions or sign conventions here.",
      ""
    ].join("\n");
    updatePathPreview();
    renderPreview();
  }

  const savedDraft = localStorage.getItem(DRAFT_KEY);
  if (savedDraft) {
    try {
      const parsed = JSON.parse(savedDraft);
      subjectEl.value = parsed.subject || "Physics";
      titleEl.value = parsed.title || "";
      editorEl.value = parsed.content || "";
      updatePathPreview();
      renderPreview();
    } catch {
      loadDefaultTemplate();
    }
  } else {
    loadDefaultTemplate();
  }

  subjectEl.addEventListener("change", () => {
    updatePathPreview();
    saveDraft();
  });

  titleEl.addEventListener("input", () => {
    updatePathPreview();
    saveDraft();
  });

  editorEl.addEventListener("input", schedulePreviewAndSave);

  // Support Tab indentation inside the Markdown textarea
  editorEl.addEventListener("keydown", e => {
    if (e.key === "Tab") {
      e.preventDefault();
      insertAtCursor("  ");
    }
  });

  /* --- View Mode Switcher (Split / Write / Preview) --- */
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      workspaceEl.className = `editor-workspace view-${btn.dataset.view}`;
    });
  });

  /* --- Formatting Toolbar Actions --- */
  const ACTION_MAP = {
    h1: () => insertAtCursor("# ", "", "Section Title"),
    h2: () => insertAtCursor("## ", "", "Topic Heading"),
    h3: () => insertAtCursor("### ", "", "Subtopic"),
    bold: () => insertAtCursor("**", "**", "important term"),
    italic: () => insertAtCursor("*", "*", "emphasis"),
    quote: () => insertAtCursor("> **Note:** ", "", "Key observation or convention."),
    list: () => insertAtCursor("- ", "", "Key point"),
    "inline-math": () => insertAtCursor("$", "$", "\\frac{a}{b}"),
    "block-math": () => insertAtCursor("\n$$\n", "\n$$\n", "F = ma"),
    chem: () => insertAtCursor("\n$$\n\\ce{", "}\n$$\n", "A + B <=> C")
  };

  document.querySelectorAll(".tool-btn[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const fn = ACTION_MAP[btn.dataset.action];
      if (fn) fn();
    });
  });

  document.querySelectorAll(".tool-btn[data-snippet]").forEach(btn => {
    btn.addEventListener("click", () => {
      insertAtCursor(btn.dataset.snippet);
    });
  });

  /* --- Populate Existing Chapters Dropdown --- */
  if (typeof CHAPTERS_CONFIG !== "undefined") {
    CHAPTERS_CONFIG.forEach(group => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group.subject;
      group.chapters.forEach(ch => {
        const opt = document.createElement("option");
        opt.value = JSON.stringify({ subject: group.subject, title: ch.title, file: ch.file });
        opt.textContent = ch.title;
        optgroup.appendChild(opt);
      });
      loadSelect.appendChild(optgroup);
    });
  }

  loadSelect.addEventListener("change", async e => {
    if (!e.target.value) return;
    const item = JSON.parse(e.target.value);
    try {
      const res = await fetch(item.file);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      editorEl.value = await res.text();
      subjectEl.value = item.subject;
      titleEl.value = item.title;
      updatePathPreview();
      renderPreview();
      saveDraft();
    } catch (err) {
      alert(`Could not load "${item.file}" (${err.message}). If opening via file://, use "Open .md" or run a local HTTP server.`);
    }
    loadSelect.value = "";
  });

  /* --- Open Local .md File --- */
  openFileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      editorEl.value = ev.target.result;
      const baseName = file.name.replace(/\.(md|markdown|txt)$/i, "");
      titleEl.value = baseName.replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      updatePathPreview();
      renderPreview();
      saveDraft();
    };
    reader.readAsText(file);
    openFileInput.value = "";
  });

  /* --- New Draft --- */
  newDraftBtn.addEventListener("click", () => {
    if (confirm("Replace the current editor content with a blank chapter template?")) {
      loadDefaultTemplate();
      saveDraft();
    }
  });

  /* --- Download .md --- */
  downloadMdBtn.addEventListener("click", () => {
    const meta = getChapterMeta();
    const blob = new Blob([editorEl.value], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.slug}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  /* --- Copy js/chapters.js Entry --- */
  copyRegistryBtn.addEventListener("click", async () => {
    const meta = getChapterMeta();
    const entry = JSON.stringify(
      { id: meta.id, title: meta.title, file: meta.file },
      null,
      2
    );
    try {
      await navigator.clipboard.writeText(entry);
      const original = copyRegistryBtn.textContent;
      copyRegistryBtn.textContent = "Copied";
      setTimeout(() => {
        copyRegistryBtn.textContent = original;
      }, 1600);
    } catch {
      prompt("Copy this entry into js/chapters.js:", entry);
    }
  });

  /* --- Modal Utilities --- */
  function closeModal(modalEl) {
    modalEl.hidden = true;
    if (modalEl === mathModal && window.mathVirtualKeyboard) {
      window.mathVirtualKeyboard.hide();
    }
  }

  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.close);
      if (target) closeModal(target);
    });
  });

  [mathModal, tableModal].forEach(modal => {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal(modal);
    });
  });

  /* --- MathLive Visual Equation Modal --- */
  openMathBtn.addEventListener("click", () => {
    const start = editorEl.selectionStart;
    const end = editorEl.selectionEnd;
    const selected = editorEl.value
      .slice(start, end)
      .trim()
      .replace(/^\$\$|\$\$$/g, "")
      .replace(/^\$|\$$/g, "")
      .trim();

    mathField.value = selected || "";
    mathRawBox.value = mathField.value;
    mathModal.hidden = false;
    setTimeout(() => mathField.focus(), 40);
  });

  mathField.addEventListener("input", () => {
    mathRawBox.value = mathField.getValue("latex");
  });

  mathRawBox.addEventListener("input", () => {
    mathField.value = mathRawBox.value;
  });

  toggleVkBtn.addEventListener("click", () => {
    if (!window.mathVirtualKeyboard) return;
    if (window.mathVirtualKeyboard.visible) {
      window.mathVirtualKeyboard.hide();
    } else {
      mathField.focus();
      window.mathVirtualKeyboard.show();
    }
  });

  insertMathBtn.addEventListener("click", () => {
    const latex = (mathField.getValue("latex") || mathRawBox.value).trim();
    if (!latex) {
      closeModal(mathModal);
      return;
    }
    const mode = document.querySelector('input[name="math-wrap-mode"]:checked').value;
    closeModal(mathModal);
    if (mode === "block") {
      insertAtCursor(`\n$$\n${latex}\n$$\n`);
    } else {
      insertAtCursor(`$${latex}$`);
    }
  });

  /* --- Visual Table Builder Modal --- */
  openTableBtn.addEventListener("click", () => {
    tableModal.hidden = false;
  });

  insertTableBtn.addEventListener("click", () => {
    const cols = Math.max(1, Math.min(8, parseInt(document.getElementById("table-cols").value, 10) || 3));
    const rows = Math.max(1, Math.min(20, parseInt(document.getElementById("table-rows").value, 10) || 3));
    const align = document.getElementById("table-align").value;

    const alignToken =
      align === "center" ? ":---:" : align === "right" ? "---:" : ":---";

    const header = `| ${Array.from({ length: cols }, (_, i) => `Header ${i + 1}`).join(" | ")} |`;
    const separator = `| ${Array.from({ length: cols }, () => alignToken).join(" | ")} |`;
    const bodyRows = Array.from({ length: rows }, () =>
      `| ${Array.from({ length: cols }, () => "Cell").join(" | ")} |`
    );

    const tableMd = `\n${[header, separator, ...bodyRows].join("\n")}\n`;
    closeModal(tableModal);
    insertAtCursor(tableMd);
  });
});