window.RMU_LESSONS = [
  {
    "id": "show-me-romantic-performance",
    "title": "Show Me: Romantic Performance",
    "category": "Performance",
    "duration": "30 seconds",
    "summary": "Build a believable romantic scene by keeping the singer emotionally connected to the second artist.",
    "teaches": [
      "Give each reference image one clear role.",
      "Keep the singer focused on their partner instead of the camera.",
      "Use slow camera movement to support the emotion."
    ],
    "prompt": "Create a realistic 30-second romantic music-video scene in 4:3 using @Image1 as the lead singer, @Image2 as the listener, and @Audio1 as the exact 30-second song excerpt.\n\nThese are two separate people. Preserve each person's likeness, complexion, hair, build, and wardrobe. Never merge or switch their identities.\n\nThe lead sings directly to the listener with visible lip-sync at normal 1x speed. Keep the singer's mouth unobstructed. The listener responds through eye contact and subtle expressions without mouthing the lead vocal.\n\nPlace them in an intimate lounge with warm amber lighting and deep burgundy curtains. Coordinate evening outfits and keep the setting and positions coherent across shots. Alternate a moving two-shot, singer close-up, over-the-shoulder view, and listener reaction. Time cuts to the phrasing of the attached song. Use gentle camera motion, realistic skin texture, and natural hands.\n\nUse @Audio1 continuously and unchanged. No repeated or reordered lyrics, speed changes, added dialogue, or new music. No subtitles, overlays, duplicate characters, or identity drift.",
    "video": "show-me-lesson.mp4",
    "poster": "show-me-lesson.jpg"
  },
  {
    "id": "make-the-bars-visible",
    "title": "Make the Bars Visible",
    "category": "Storytelling",
    "duration": "15 seconds",
    "summary": "Turn important lyric ideas into locations, actions, and visual details instead of showing a generic performance.",
    "teaches": [
      "Choose two or three lyric ideas that can be shown visually.",
      "Match the environment to the meaning of the verse.",
      "Keep the performer present while the visuals explain the bars."
    ],
    "prompt": "Create a realistic 15-second rap performance based on @audio1. Identify the strongest visual ideas in the lyrics and express them through the location, background action, and camera movement. Keep @image1 as the same artist in every shot. Open with a strong performance close-up, reveal one environment detail connected to the lyrics, then end with a moving wider shot that keeps the artist dominant. Preserve identity, natural gestures, accurate mouth movement, and believable city lighting.",
    "video": "make-bars-visible.mp4",
    "poster": "make-bars-visible.jpg"
  },
  {
    "id": "one-master-prompt-many-clips",
    "title": "Freddie: Master Performance & Camera Flow",
    "category": "Workflow",
    "duration": "4 cuts per 15-second segment",
    "summary": "Reuse one master prompt across a full performance while keeping the artist, microphone, rooftop, lighting, and audio consistent.",
    "video": "freddie-one-prompt.mp4",
    "poster": "freddie-one-prompt-poster.jpg",
    "toolUrl": "https://hailuoai.pxf.io/c/7573968/3866417/51611",
    "teaches": [
      "Assign one job to every reference: artist, microphone, setting, and audio.",
      "Lock the repeatable details once, then vary four camera moves in each segment.",
      "Build a longer performance from consistent 15-second sections instead of rewriting the setup every time.",
      "Use motivated camera moves and preserve performance continuity across cuts. This master uses four cuts per segment."
    ],
    "prompt": "RICHMADEIT PERFORMANCE — ROOFTOP HELIPAD MASTER PROMPT\n\nUse @Image1 as the locked artist identity. Preserve the same face shape, features, skin tone, hairstyle, build, and styled outfit across every generation.\n\nUse @Image2 as the locked handheld microphone reference. Preserve its design, color, and gold accent details. No microphone stand. The performer holds it naturally throughout.\n\nUse @Image3 as the locked rooftop helipad setting: glowing gold RICHMADEIT ring embedded in the concrete, city skyline, safety railing, night atmosphere, and drifting haze. Keep this location and lighting consistent across every generation.\n\nUse @Audio1 as the exact 15-second soundtrack for this segment. Match the vocal with precise, natural lip-sync for the full clip. Do not replace, repeat, reorder, speed up, slow down, or add audio.\n\nCreate one cinematic 15-second music-video performance with FOUR DISTINCT CUTS. Keep the camera moving in every cut. Select four different moves from: slow push-in, orbit left, orbit right, crane up, crane down, low-angle hero push-in, high-angle look-down, tracking shot, handheld sway, whip-pan reveal, dolly-out reveal, arc shot, over-the-shoulder-to-face reveal, or drone-style rise. Do not repeat a camera move within this clip. In later segments, vary the selection and order so the performance stays fresh while the artist and world remain consistent.\n\nThe performer moves confidently across the open helipad—walking, pivoting, stepping toward or away from camera, holding grounded moments, and using natural gestures that follow the music. Raise the microphone closer during emphasized vocals and relax it lower during softer or instrumental moments. Keep visible singing at normal 1× speed with realistic jaw, mouth, breath, head, and shoulder movement. Maintain engaged eye contact during connective moments. Wind subtly moves hair and clothing.\n\nUse cool blue-white ambient light from the night sky and city, contrasted with warm gold rim light from the illuminated helipad ring. Use shallow cinematic depth of field, creamy bokeh, soft highlight halation, subtle 35mm film grain, moody blue-and-charcoal color, and natural skin texture.\n\nFormat: 4:3. Ultra-photorealistic. No static shots, identity drift, duplicate artist, wardrobe changes, microphone changes, location changes, plastic skin, spotty rendering, warped hands, captions, subtitles, generated text, or added logos."
  }
];
