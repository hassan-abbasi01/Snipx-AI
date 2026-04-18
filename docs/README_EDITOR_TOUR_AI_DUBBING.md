# Editor Tour, AI Dubbing, and Merge Videos README

## Purpose
Yeh README un users/devs ke liye hai jo Editor page ka onboarding tour aur AI Dubbing module ka matlab jaldi samajhna chahte hain.

## Editor Tour (1/6 se 6/6) ka Matlab
Editor tour total 6 cards dikhata hai. Isme intro aur ending bhi step count mein aate hain.

### Step 1/6: Welcome
- User ko batata hai ke complete editor workflow kya hoga.
- Goal: user ko context dena before editing.

### Step 2/6: Upload
- User video upload karta hai.
- Supported common formats (jaise MP4, MOV, AVI).
- Goal: workflow start point.

### Step 3/6: Edit (AI-Powered Editing)
- AI transcription
- Subtitle generation
- Filler word removal
- Trim/Crop
- Goal: raw video ko editable/professional output ki taraf le jana.

### Step 4/6: Audio Enhancement
- Volume control
- Noise reduction
- Audio clarity enhancement
- Live audio levels
- Goal: clear aur clean sound output.

### Step 5/6: Export
- Quality select (jaise 4K/HD/720p)
- Format select (jaise MP4/MOV/AVI)
- Goal: final output generate/download/share karna.

### Step 6/6: Finish
- Tour complete message.
- User ko signal deta hai ke ab wo full workflow independently use kar sakta hai.

## AI Dubbing Module Kya Hai
AI Dubbing ka kaam video ki speech ko doosri language mein convert karna hai.

### Core Use
- Same video ko multiple languages mein publish karna
- Audience reach barhana
- Manual dubbing time reduce karna

### Backend Pipeline (Simple)
1. Audio transcribe hoti hai
2. Text target language mein translate hota hai
3. Dubbed voice generate hoti hai
4. Nayi voice original video timing ke sath sync hoti hai

### User Options
- Source language: Auto-detect ya manual
- Target language: required
- Mix original audio: optional (low volume)

## Merge Videos Feature Kya Hai
Merge Videos ka kaam 2 videos ko sequence mein jor kar ek single output video banana hai.

### Core Use
- Intro + main content ko ek file mein combine karna
- Part 1 + Part 2 ko continuous final video banana
- Alag clips ko publish-ready single video mein convert karna

### Editor Flow (User Side)
1. Pehle current video upload karo (main video)
2. Quick actions mein Merge Videos button click karo
3. Dusri video select/upload karo (video to merge)
4. Merge Position choose karo:
   - Before: New video pehle, current video baad mein
   - After: Current video pehle, new video baad mein
5. Merge Videos button click karo
6. Merged output automatically preview mein load ho jata hai

### Important Behavior
- Merge tab tabhi kaam karega jab current video already uploaded ho
- Backend ko kam az kam 2 video IDs chahiye hoti hain
- Merge ke baad naya merged video_id generate hota hai
- UI merged file ko preview mein replace kar deti hai

### Backend/API (Simple)
- Frontend call: POST /api/videos/merge
- Request body: video_ids array (2+ ids)
- Backend MoviePy se concatenate karta hai
- Final MP4 save hoti hai aur DB mein new merged record banta hai

### Practical Notes
- Dono videos same account/user ki honi chahiye
- Long/high-res videos merge mein zyada time le sakti hain
- Merge ke baad export/download normal flow se hi hota hai

## Subtitle vs Dubbing (Quick Difference)
- Subtitles: screen par text show hota hai
- Dubbing: audio track hi translated voice se replace/mix hoti hai

## Merge vs Dubbing (Quick Difference)
- Merge Videos: do clips ko timeline order mein jorta hai
- AI Dubbing: existing video ki language/voice audio convert karti hai
- Dono alag features hain: ek sequencing hai, doosra language audio transformation

## Typical User Flow
1. Video upload karo
2. Edit tools use karo (optional)
3. AI Dubbing open karo
4. Source/Target language choose karo
5. Start Dubbing click karo
6. Process complete hone ke baad dubbed output use/download karo

## Typical Merge Flow
1. Main video upload karo
2. Merge Videos open karo
3. Second video upload karo
4. Before/After choose karo
5. Merge Videos click karo
6. Merged preview load hone ke baad export/download karo

## Notes for Other Module Integration
- Tour UX onboarding ke liye hai, processing feature nahi.
- AI Dubbing actual processing feature hai (language conversion of audio).
- Merge Videos sequencing feature hai (multiple clips ko single file banana).
- Agar onboarding dobara dikhani ho to tour reset option Help section mein diya ja sakta hai.

## One-Line Summary
Editor tour flow samjhata hai, AI Dubbing language voice conversion karti hai, aur Merge Videos multiple clips ko ek final single video mein combine karta hai.
