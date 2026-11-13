document.addEventListener("DOMContentLoaded", () => {
  const navEl = document.getElementById("chapter-nav");
  const noteEl = document.getElementById("note-container");
  const pagerEl = document.getElementById("chapter-pager");
  const searchInput = document.getElementById("search-input");
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const menuToggle = document.getElementById("menu-toggle");
  const themeSelect = document.getElementById("theme-select");
  const printBtn = document.getElementById("print-btn");

  const allChapters = CHAPTERS_CONFIG.flatMap(group =>
    group.chapters.map(ch => ({ ...ch, subject: group.subject }))
  );

  const ICON_ARROW_LEFT = `
    <svg class="pager-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>`;

  const ICON_ARROW_RIGHT = `
    <svg class="pager-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>`;

  /* --- Theme Selection (Light / Cosmic Black / Warm Amber CRT) --- */
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  themeSelect.value = currentTheme;

  themeSelect.addEventListener("change", e => {
    const selected = e.target.value;
    document.documentElement.setAttribute("data-theme", selected);
    localStorage.setItem("helium-theme", selected);
  });

  /* --- Print / PDF Export --- */
  printBtn.addEventListener("click", () => window.print());

  /* --- Mobile Navigation Drawer --- */
  const closeDrawer = () => {
    sidebar.classList.remove("open");
    backdrop.classList.remove("show");
  };

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    backdrop.classList.toggle("show");
  });

  backdrop.addEventListener("click", closeDrawer);

  /* --- Sidebar Rendering & Search --- */
  function renderSidebar(filterText = "") {
    const query = filterText.trim().toLowerCase();
    navEl.innerHTML = "";

    CHAPTERS_CONFIG.forEach(group => {
      const matched = group.chapters.filter(
        ch =>
          ch.title.toLowerCase().includes(query) ||
          group.subject.toLowerCase().includes(query)
      );
      if (matched.length === 0) return;

      const groupDiv = document.createElement("div");
      groupDiv.className = "subject-group";

      const titleEl = document.createElement("div");
      titleEl.className = "subject-title";
      titleEl.textContent = group.subject;
      groupDiv.appendChild(titleEl);

      matched.forEach(ch => {
        const link = document.createElement("a");
        link.href = `#${ch.id}`;
        link.className = "chapter-link";
        link.dataset.id = ch.id;
        link.textContent = ch.title;
        link.addEventListener("click", closeDrawer);
        groupDiv.appendChild(link);
      });

      navEl.appendChild(groupDiv);
    });

    highlightActiveLink();
  }

  searchInput.addEventListener("input", e => renderSidebar(e.target.value));

  function highlightActiveLink() {
    const activeId = getActiveChapterId();
    document.querySelectorAll(".chapter-link").forEach(link => {
      link.classList.toggle("active", link.dataset.id === activeId);
    });
  }

  function getActiveChapterId() {
    const hash = window.location.hash.replace(/^#/, "");
    const exists = allChapters.some(c => c.id === hash);
    return exists ? hash : (allChapters[0]?.id || "");
  }

  /* --- Safe Markdown & LaTeX Pipeline --- */
  function renderMarkdownWithLatex(markdownText) {
    const normalized = markdownText.replace(/\r\n/g, "\n");
    const codeBlocks = [];
    const mathBlocks = [];

    // Preserve code blocks before scanning for math delimiters
    let text = normalized.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, match => {
      const idx = codeBlocks.length;
      codeBlocks.push(match);
      return `CODETOKEN${idx}END`;
    });

    // Preserve display math ($$...$$ and \[...\])
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

    // Preserve inline math ($...$ and \(...\)) and enforce \displaystyle
    // so numerators and denominators do not shrink
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

    // Restore code blocks and parse Markdown
    text = text.replace(/CODETOKEN(\d+)END/g, (_, idx) => codeBlocks[idx]);
    let html = marked.parse(text);

    // Restore math blocks with HTML entity escaping for < and >
    const escapeHtml = str =>
      str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    html = html.replace(/MATHTOKEN(\d+)END/g, (_, idx) =>
      escapeHtml(mathBlocks[idx])
    );

    return html;
  }

  /* --- Chapter Loader --- */
  async function loadChapter() {
    if (allChapters.length === 0) {
      noteEl.innerHTML = "<p>No chapters are currently registered in <code>js/chapters.js</code>.</p>";
      return;
    }

    const chapterId = getActiveChapterId();
    const index = allChapters.findIndex(c => c.id === chapterId);
    const chapter = allChapters[index];

    highlightActiveLink();
    document.title = `${chapter.title} — Helium`;
    noteEl.innerHTML = `<p class="loading">Loading ${chapter.title}...</p>`;

    try {
      const res = await fetch(chapter.file);
      if (!res.ok) throw new Error(`HTTP ${res.status} (${chapter.file})`);
      const md = await res.text();

      noteEl.innerHTML = renderMarkdownWithLatex(md);

      // Wrap tables so they center horizontally while remaining scrollable on narrow screens
      noteEl.querySelectorAll("table").forEach(table => {
        const wrapper = document.createElement("div");
        wrapper.className = "table-wrapper";
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      });

      if (typeof renderMathInElement === "function") {
        renderMathInElement(noteEl, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true }
          ],
          throwOnError: false
        });
      }

      const prev = allChapters[index - 1];
      const next = allChapters[index + 1];
      pagerEl.innerHTML = `
        ${prev ? `<a class="pager-btn" href="#${prev.id}">${ICON_ARROW_LEFT}<span>${prev.title}</span></a>` : `<span></span>`}
        ${next ? `<a class="pager-btn" href="#${next.id}"><span>${next.title}</span>${ICON_ARROW_RIGHT}</a>` : `<span></span>`}
      `;

      window.scrollTo({ top: 0, behavior: "instant" });
    } catch (err) {
      noteEl.innerHTML = `
        <div class="error-box">
          <strong>Unable to load chapter source:</strong> <code>${chapter.file}</code><br />
          <small>${err.message}</small>
          <p><strong>Notice:</strong> Local browser security policies block <code>fetch()</code> requests over the <code>file://</code> protocol. Serve the directory via a local HTTP server (e.g., <code>python3 -m http.server</code>) or deploy to GitHub Pages.</p>
        </div>
      `;
      pagerEl.innerHTML = "";
    }
  }

  window.addEventListener("hashchange", loadChapter);

  renderSidebar();
  loadChapter();
});