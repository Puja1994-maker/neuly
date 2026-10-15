const slugs = [
  'vanderbilt', 'vanderbilt_nichq', 'nichq_vanderbilt',
  'swan', 'scared', 'gad-7', 'gad7', 'cast', 'aq-child', 'aq_child', 'q-chat', 'qchat', 'q_chat',
  'adhd_checklist'
];
const base = 'https://demo.neuly.ai';
for (const s of slugs) {
  const url = `${base}/screeners/${s}`;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const text = await res.text();
    const title = text.match(/<title>([^<]+)/i)?.[1] ?? '';
    const hasQuestion = /question|radio|Not at all|Somewhat/i.test(text);
    console.log(res.status, s, title.slice(0, 60), hasQuestion ? 'html-question-hint' : '');
  } catch (e) {
    console.log('ERR', s, e.message);
  }
}
