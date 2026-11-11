(() => {
  'use strict';
  const lesson = JSON.parse(document.getElementById('lesson-data').textContent);
  const slides = [...document.querySelectorAll('.slide')];
  const links = [...document.querySelectorAll('.sidebar a')];
  const prev = document.getElementById('previous');
  const next = document.getElementById('next');
  const progress = document.getElementById('progress');
  const status = document.getElementById('page-status');
  const toc = document.getElementById('toc');
  let current = 0;
  function show(index, focus = true) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    links.forEach((a, i) => i === current ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    prev.disabled = current === 0; next.disabled = current === slides.length - 1;
    progress.value = current + 1;
    status.textContent = `${current + 1} / ${slides.length}`;
    if (location.hash !== `#slide-${current + 1}`) history.replaceState(null, '', `#slide-${current + 1}`);
    if (focus) { slides[current].querySelector('h1,h2').focus({preventScroll: true}); window.scrollTo(0, 0); }
    if (matchMedia('(max-width:720px)').matches) toc.open = false;
  }
  function fromHash(focus = false) {
    const match = /^#slide-(\d+)$/.exec(location.hash);
    const n = match ? Number(match[1]) : 1;
    show(Number.isFinite(n) ? n - 1 : 0, focus);
  }
  links.forEach((a, i) => a.addEventListener('click', e => { e.preventDefault(); show(i); }));
  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    const destination = {ArrowRight:current + 1, ArrowLeft:current - 1, Home:0, End:slides.length - 1}[e.key];
    if (destination !== undefined) { e.preventDefault(); show(destination); }
  });
  window.addEventListener('hashchange', () => fromHash(true));
  if (!matchMedia('(max-width:720px)').matches) toc.open = true;
  fromHash();

  const verbSelect = document.getElementById('demo-verb');
  const formSelect = document.getElementById('demo-form');
  const output = document.getElementById('demo-result');
  const step = document.getElementById('demo-step');
  const demoSource = document.getElementById('demo-source');
  function prepareDemo() {
    const verb = lesson.verbs.find(v => v.id === verbSelect.value);
    delete output.dataset.reading;
    output.replaceChildren();
    output.textContent = `辭書形：${verb.dictionary}（${verb.reading}），${verb.group_name}。`;
    step.textContent = '先確認分類，再選擇規則。按「顯示變化」查看結果。';
    demoSource.href = `docs/wiki/verbs/${verb.id}.html`;
    demoSource.textContent = `查看${verb.dictionary}的 Wiki 依據`;
  }
  function revealDemo() {
    const verb = lesson.verbs.find(v => v.id === verbSelect.value);
    const form = verb.forms[formSelect.value];
    let shared = 0;
    while (shared < Math.min(verb.reading.length, form.reading.length) && verb.reading[shared] === form.reading[shared]) shared++;
    const keep = document.createElement('span'); keep.className = 'keep'; keep.textContent = form.reading.slice(0, shared);
    const change = document.createElement('span'); change.className = 'ending'; change.textContent = form.reading.slice(shared);
    const result = document.createElement('span'); result.className = 'morph'; result.lang = 'ja'; result.append(keep, change);
    output.replaceChildren(result);
    const labels = {masu:'ます形',nai:'ない形',te:'て形',ta:'た形'};
    step.textContent = `${verb.dictionary} → ${form.text}（${form.reading}）。${labels[formSelect.value]}；${verb.note} 顏色標出字面保留／變化部分。`;
    output.dataset.reading = form.reading;
  }
  verbSelect.addEventListener('change', prepareDemo); formSelect.addEventListener('change', prepareDemo);
  document.getElementById('demo-reveal').addEventListener('click', revealDemo);
  prepareDemo();

  const answers = new Map();
  function score() {
    document.getElementById('quiz-score').textContent = `已作答 ${answers.size} / ${lesson.quiz.length}，答對 ${[...answers.values()].filter(Boolean).length} 題。`;
  }
  lesson.quiz.forEach(q => {
    document.getElementById(`check-${q.id}`).addEventListener('click', () => {
      const chosen = document.querySelector(`input[name="${q.id}"]:checked`);
      const feedback = document.getElementById(`feedback-${q.id}`);
      if (!chosen) { feedback.className = 'feedback'; feedback.textContent = '請先選擇一個答案。'; return; }
      const correct = Number(chosen.value) === q.correct;
      answers.set(q.id, correct);
      feedback.className = `feedback ${correct ? 'correct' : 'incorrect'}`;
      feedback.textContent = `${correct ? '答對了。' : '再比較一下。'}正確答案：${q.options[q.correct]}。${q.explanation}`;
      score();
    });
  });
  document.getElementById('quiz-reset').addEventListener('click', () => {
    document.querySelectorAll('.quiz-grid input').forEach(input => { input.checked = false; });
    document.querySelectorAll('.feedback').forEach(p => { p.textContent = ''; p.className = 'feedback'; });
    answers.clear(); score();
  });
  score();
})();
