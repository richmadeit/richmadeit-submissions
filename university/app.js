'use strict';
const cfg = window.RMU_OFFER || {};
const safeHttps = s => { try { const u = new URL(s); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };
const handle = String(cfg.universityInstagram || '').replace(/^@/, '').trim();
const purchase = safeHttps(cfg.checkoutUrl) || (/^[A-Za-z0-9._]{1,30}$/.test(handle) ? 'https://ig.me/m/' + encodeURIComponent(handle) : '');
if (purchase) {
  document.querySelectorAll('.buy').forEach(a => { a.href = purchase; a.textContent = cfg.checkoutUrl ? 'Get the workbook — $49' : 'Message WORKBOOK — $49'; });
  document.getElementById('purchaseHelp').textContent = cfg.checkoutUrl ? 'Use the secure checkout to review the price and terms before paying.' : 'Message WORKBOOK to @' + handle + '. We will confirm payment and how you receive buyer access.';
} else { document.getElementById('launchWarning').hidden = false; }
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
