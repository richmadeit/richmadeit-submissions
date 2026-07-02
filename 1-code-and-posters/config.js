const CONFIG = {
  // ─── SUPABASE (get these from supabase.com after setup) ───────────────────
  SUPABASE_URL: 'https://molqlfdjlmnlkscecngz.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vbHFsZmRqbG1ubGtzY2Vjbmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODEzNjMsImV4cCI6MjA5MzE1NzM2M30._CR9A4H7-E7CYzIWdEO4PgRcCgBcORP2wAZqXrXE4Ec',

  // ─── DASHBOARD PASSWORD ────────────────────────────────────────────────────
  DASHBOARD_PASSWORD: 'richmadeit2024',

  // ─── STRIPE PAYMENT LINKS (PUBLIC — used on intake forms) ─────────────────
  // Created at dashboard.stripe.com → Payment Links (LIVE mode)
  // Test link starts with https://buy.stripe.com/test_...
  // Live link starts with https://buy.stripe.com/...
  STRIPE_LINK_99: 'https://buy.stripe.com/fZucN52fzaoe7UEdn7bMQ00',
  STRIPE_LINK_199: 'https://buy.stripe.com/14AdR9g6p53U7UEcj3bMQ01',
  PRICE_30SEC: 99,
  PRICE_60SEC: 199,

  // ─── FULL MUSIC VIDEO LINKS (create these in Stripe for $397 and $697) ────
  // Until you paste real links here, checkout will tell the user to DM you.
  STRIPE_LINK_397: 'https://buy.stripe.com/9B63cvf2laoe6QAfvfbMQ04',
  STRIPE_LINK_697: 'https://buy.stripe.com/aFacN56vPbsi5Mw2ItbMQ05',
  PRICE_720P: 397,
  PRICE_1080P: 697,

  // ─── INSTAGRAM (for "DM for Full Video" CTA) ──────────────────────────────
  INSTAGRAM_URL: 'https://instagram.com/rich_madeit_',

  // ─── BACKUP PAYMENT HANDLES (used internally for balance collection) ──────
  // After preview delivery, collect remaining balance via these
  CASHAPP: '$richwells9',
  ZELLE: 'richmadeit1@gmail.com',
  APPLEPAY: '3138580435',

  // ─── YOUTUBE ───────────────────────────────────────────────────────────────
  CHANNEL_URL: 'https://www.youtube.com/@Rich_Madeit_',
  MAIN_VIDEO_ID: '9_RsR22ODRo', // Rick Ross featured video

  // Add your YouTube video IDs here (get from the URL: youtu.be/XXXX)
  SIDEBAR_VIDEOS: [
    { id: 'Q16MFXelnpY', title: 'Owen James ft. Shaq – "When I Stand"' },
    { id: '9_RsR22ODRo', title: 'Rick Ross x Shaq – "Minks in Miami" Remix' },
    { id: 'ADD_VIDEO_ID', title: 'Add Your Video Title Here' },
    { id: 'ADD_VIDEO_ID', title: 'Add Your Video Title Here' },
  ],

  // NOTE: Prices are quoted per artist on the call — never publicly listed.
  // Delivery timing is also negotiated per client — set manually when marking as paid.
  // Track actual price and deadline per booking inside the dashboard.
};
