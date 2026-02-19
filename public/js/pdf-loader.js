/**
 * PDF Loader Utility
 * Shared script for loading PDF collections from PrepperZero API
 */

async function loadPDFs(category, containerId) {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  try {
    const res = await fetch(`/api/pdfs/${category}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const pdfs = await res.json();
    grid.innerHTML = "";

    if (!pdfs.length) {
      grid.style.display = "flex";
      grid.style.justifyContent = "center";
      grid.style.alignItems = "center";
      grid.style.minHeight = "400px";
      
      grid.innerHTML = `
        <div class="pz-card" style="max-width: 500px; text-align: center; padding: var(--pz-space-2xl);">
          <div class="pz-icon" style="width: 80px; height: 80px; margin: 0 auto var(--pz-space-lg); background: var(--pz-accent); opacity: 0.15; border-radius: 50%;"></div>
          <h2 style="color: var(--pz-text); margin-bottom: var(--pz-space-md);">No PDFs Found</h2>
          <p style="color: var(--pz-muted); margin-bottom: var(--pz-space-xl);">This ${category} collection is currently empty. PDFs will appear here once they are added to the library.</p>
          <a href="library.html" class="pz-button" style="display: inline-block;">← Back to Library</a>
        </div>
      `;
      grid.setAttribute("role", "status");
      grid.setAttribute("aria-live", "polite");
      return;
    }

    grid.setAttribute("role", "region");
    grid.setAttribute("aria-label", `${category} PDF collection`);

    pdfs.forEach(filename => {
      const name = filename.replace(/\.pdf$/i, "");
      const url = `/files-root/${category}/${filename}`;

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${name}</h3>
        <a href="${url}" target="_blank" rel="noopener noreferrer">Open PDF<span class="sr-only"> (opens in new window)</span></a>
      `;
      grid.appendChild(card);
    });

  } catch (err) {
    grid.innerHTML = `<p class="muted">Error loading PDFs. Please check your connection.</p>`;
    grid.setAttribute("role", "alert");
    console.error(`Failed to load ${category} PDFs:`, err);
  }
}
