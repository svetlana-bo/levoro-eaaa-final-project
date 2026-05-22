import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const courseIds = ['60195f4e-6c89-4812-a5dc-20e1288b7dad','53010acd-1eb1-475d-ac9b-e0c9fe11ef49'];

const { data: courses } = await supabase.from('courses').select('id,display_id,title,thumbnail_url').in('id', courseIds);
const { data: lessons } = await supabase.from('lessons').select('id,course_id,title,video_url,audio_url,content,content_blocks,exercises').in('course_id', courseIds);

const urlRegex = /https?:\/\/[^\s"'<>)]+\.(?:png|jpe?g|gif|webp|svg|mp3|mp4|webm|mov|wav|m4a|ogg|pdf)/gi;

const findings = []; // {courseTitle, lessonTitle, location, url}

for (const c of courses) {
  if (c.thumbnail_url) findings.push({course: c.title, lesson: '(course thumbnail)', location: 'thumbnail_url', url: c.thumbnail_url});
}

for (const l of lessons) {
  const c = courses.find(x => x.id === l.course_id);
  const ctitle = c?.title || '?';
  if (l.video_url) findings.push({course: ctitle, lesson: l.title, location: 'video_url', url: l.video_url});
  if (l.audio_url) findings.push({course: ctitle, lesson: l.title, location: 'audio_url', url: l.audio_url});
  const blob = JSON.stringify(l.content_blocks || '') + JSON.stringify(l.exercises || '') + (l.content || '');
  const matches = blob.match(urlRegex) || [];
  for (const u of new Set(matches)) {
    findings.push({course: ctitle, lesson: l.title, location: 'block', url: u});
  }
}

// Dedupe
const seen = new Set();
const unique = findings.filter(f => { const k = f.url; if (seen.has(k)) return false; seen.add(k); return true; });

// Check each URL with HEAD
const results = [];
for (const f of unique) {
  try {
    const r = await fetch(f.url, { method: 'HEAD' });
    results.push({...f, status: r.status, ok: r.ok});
  } catch (e) {
    results.push({...f, status: 'ERR', ok: false, err: String(e)});
  }
}

const broken = results.filter(r => !r.ok);
console.log(`Total unique media URLs: ${results.length}`);
console.log(`Broken: ${broken.length}\n`);
console.log('=== BROKEN MEDIA ===');
for (const b of broken) {
  console.log(`[${b.status}] ${b.course} :: ${b.lesson} :: ${b.location}`);
  console.log(`   ${b.url}\n`);
}

// Group by host
const hosts = {};
for (const b of broken) { const h = new URL(b.url).host; hosts[h] = (hosts[h]||0)+1; }
console.log('Broken by host:', hosts);
