window.RMU_LESSONS = [
  {
    id: "show-me-romantic-performance",
    title: "Show Me: Romantic Performance",
    category: "Performance",
    duration: "30 seconds",
    summary: "Build a believable romantic scene by keeping the singer emotionally connected to the second artist.",
    teaches: [
      "Give each reference image one clear role.",
      "Keep the singer focused on their partner instead of the camera.",
      "Use slow camera movement to support the emotion."
    ],
    prompt: "Create a 30-second romantic AI music-video performance using @image1 as the lead singer, @image2 as the second artist, @image3 as the location reference, and @audio1 as the master song timing. Keep the lead singer emotionally focused on the second artist. Begin with a moving two-shot, transition to a close reaction, and finish with a wider reveal of the location. Preserve both identities, natural hands, consistent clothing, clear singing mouth movement, and smooth motivated camera motion."
  },
  {
    id: "make-the-bars-visible",
    title: "Make the Bars Visible",
    category: "Storytelling",
    duration: "15 seconds",
    summary: "Turn important lyric ideas into locations, actions, and visual details instead of showing a generic performance.",
    teaches: [
      "Choose two or three lyric ideas that can be shown visually.",
      "Match the environment to the meaning of the verse.",
      "Keep the performer present while the visuals explain the bars."
    ],
    prompt: "Create a realistic 15-second rap performance based on @audio1. Identify the strongest visual ideas in the lyrics and express them through the location, background action, and camera movement. Keep @image1 as the same artist in every shot. Open with a strong performance close-up, reveal one environment detail connected to the lyrics, then end with a moving wider shot that keeps the artist dominant. Preserve identity, natural gestures, accurate mouth movement, and believable city lighting."
  },
  {
    id: "six-cut-camera-flow",
    title: "Six-Cut Camera Flow",
    category: "Camera",
    duration: "15 seconds",
    summary: "Plan six connected angles so a short performance feels active without becoming random or hard to follow.",
    teaches: [
      "Change angle or distance with a reason.",
      "Carry body position and motion across each cut.",
      "Keep the camera moving while protecting facial consistency."
    ],
    prompt: "Create one continuous 15-second AI music video with six connected shots using @image1 for the artist and @audio1 for exact vocal timing. Use a moving medium-wide opener, an over-the-shoulder angle, a lateral tracking shot, a reaction close-up, a low-to-eye-level rise, and a smooth widening finish. Preserve movement direction, artist identity, clothing, lighting, and location continuity. Avoid abrupt zooms, duplicate subjects, frozen camera work, and random mouth movement during vocal pauses."
  },
  {
    id: "one-master-prompt-many-clips",
    title: "Freddie: One Master Prompt, Many Clips",
    category: "Workflow",
    duration: "15-second segments",
    summary: "Reuse one master prompt across a full performance while keeping the artist, microphone, rooftop, lighting, and audio consistent.",
    video: "freddie-one-prompt.mp4",
    poster: "freddie-one-prompt-poster.jpg",
    toolUrl: "https://hailuoai.pxf.io/c/7573968/3866417/51611",
    teaches: [
      "Assign one job to every reference: artist, microphone, setting, and audio.",
      "Lock the repeatable details once, then vary four camera moves in each segment.",
      "Build a longer performance from consistent 15-second sections instead of rewriting the setup every time."
    ],
    prompt: "RICHMADEIT PERFORMANCE — ROOFTOP HELIPAD MASTER PROMPT\n\nUse @Image1 as the locked artist identity. Preserve the same face shape, features, skin tone, hairstyle, build, and styled outfit across every generation.\n\nUse @Image2 as the locked handheld microphone reference. Preserve its design, color, and gold accent details. No microphone stand. The performer holds it naturally throughout.\n\nUse @Image3 as the locked rooftop helipad setting: glowing gold RICHMADEIT ring embedded in the concrete, city skyline, safety railing, night atmosphere, and drifting haze. Keep this location and lighting consistent across every generation.\n\nUse @Audio1 as the exact 15-second soundtrack for this segment. Match the vocal with precise, natural lip-sync for the full clip. Do not replace, repeat, reorder, speed up, slow down, or add audio.\n\nCreate one cinematic 15-second music-video performance with FOUR DISTINCT CUTS. Keep the camera moving in every cut. Select four different moves from: slow push-in, orbit left, orbit right, crane up, crane down, low-angle hero push-in, high-angle look-down, tracking shot, handheld sway, whip-pan reveal, dolly-out reveal, arc shot, over-the-shoulder-to-face reveal, or drone-style rise. Do not repeat a camera move within this clip. In later segments, vary the selection and order so the performance stays fresh while the artist and world remain consistent.\n\nThe performer moves confidently across the open helipad—walking, pivoting, stepping toward or away from camera, holding grounded moments, and using natural gestures that follow the music. Raise the microphone closer during emphasized vocals and relax it lower during softer or instrumental moments. Keep visible singing at normal 1× speed with realistic jaw, mouth, breath, head, and shoulder movement. Maintain engaged eye contact during connective moments. Wind subtly moves hair and clothing.\n\nUse cool blue-white ambient light from the night sky and city, contrasted with warm gold rim light from the illuminated helipad ring. Use shallow cinematic depth of field, creamy bokeh, soft highlight halation, subtle 35mm film grain, moody blue-and-charcoal color, and natural skin texture.\n\nFormat: 4:3. Ultra-photorealistic. No static shots, identity drift, duplicate artist, wardrobe changes, microphone changes, location changes, plastic skin, spotty rendering, warped hands, captions, subtitles, generated text, or added logos."
  }
];
