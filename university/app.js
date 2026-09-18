'use strict';
const cfg = window.RMU_OFFER || {};
const safeHttps = s => { try { const u = new URL(s); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };
// Contact links are ordinary anchors in the HTML, so they also work without JavaScript.
if (safeHttps(cfg.buyerLoginUrl)) { const a = document.getElementById('buyerLogin'); a.href = safeHttps(cfg.buyerLoginUrl); a.hidden = false; }
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-copy]'); if (!b) return;
  const source = document.getElementById(b.dataset.copy); const text = source.textContent;
  try { await navigator.clipboard.writeText(text); b.textContent = 'Copied ✓'; }
  catch {
    const details = source.closest('details'); if (details) details.open = true;
    let box = source.parentNode.querySelector('textarea.copyFallback');
    if (!box) { box = document.createElement('textarea'); box.className = 'copyFallback'; box.readOnly = true; box.setAttribute('aria-label','Prompt to select and copy'); source.after(box); }
    box.value = text; box.focus(); box.select(); box.setSelectionRange(0,text.length);
    b.textContent = 'Text selected — hold to copy';
  }
});
function filterLessons() {
  const q = document.getElementById('search').value.trim().toLowerCase(); const c = document.getElementById('category').value; let n = 0;
  document.querySelectorAll('.lesson').forEach(el => { const show = (!q || el.dataset.search.toLowerCase().includes(q)) && (c === 'all' || c === el.dataset.category); el.hidden = !show; if(show)n++; });
  document.getElementById('lessonCount').textContent = n + (n === 1 ? ' lesson' : ' lessons') + ' available'; document.getElementById('noResults').hidden = n !== 0;
}
document.getElementById('search').addEventListener('input', filterLessons);
document.getElementById('category').addEventListener('change', filterLessons);
