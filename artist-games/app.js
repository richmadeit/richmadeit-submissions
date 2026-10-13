(() => {
  const config = window.OFFER_CONFIG || {};
  const video = document.getElementById('presenter-video');
  if (config.presenterVideo) {
    document.getElementById('presenter-source').src = config.presenterVideo;
    if (config.presenterCaptions) {
      const captions = document.createElement('track');
      captions.kind = 'captions'; captions.label = 'English'; captions.srclang = 'en';
      captions.src = config.presenterCaptions; video.append(captions);
    }
    video.load();
  }
  document.querySelectorAll('.payment-link').forEach(link => {
    if (config.paymentUrl) {
      link.href = config.paymentUrl;
      link.target = '_blank'; link.rel = 'noopener';
    } else { link.setAttribute('aria-disabled', 'true'); link.addEventListener('click', e => e.preventDefault()); }
  });
  document.querySelectorAll('.calendar-link').forEach(link => { if (config.calendlyUrl) link.href = config.calendlyUrl; });
  if (config.bookingMode === 'calendly-paid') {
    document.querySelectorAll('.payment-link').forEach(link => { link.href = config.calendlyUrl; link.textContent = 'Book my 20-minute session — $25 ↗'; });
    document.getElementById('booking-fine').textContent = 'Choose your time and pay $25 through Stripe during booking. Your session is reserved once payment is complete.';
  }
  const toggle = document.getElementById('transcript-toggle');
  const transcript = document.getElementById('transcript');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open)); transcript.hidden = open;
    toggle.innerHTML = `${open ? 'Read' : 'Close'} the explanation <span aria-hidden="true">${open ? '+' : '−'}</span>`;
  });
  document.querySelectorAll('video').forEach(item => item.addEventListener('play', () => { document.querySelectorAll('video').forEach(other => { if (other !== item) other.pause(); }); }));
})();
