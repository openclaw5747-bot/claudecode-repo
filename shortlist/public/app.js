const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const view = $('#view');
let status = null;

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/api/login') { renderLogin(); throw new Error(data.error || 'Sign in first.'); }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 3500);
}

/** Runs an async action with the button showing it's busy, and reports errors. */
async function busy(button, label, fn) {
  const old = button?.innerHTML;
  if (button) { button.disabled = true; button.innerHTML = `<span class="spinner"></span> ${esc(label)}`; }
  try { return await fn(); }
  catch (err) { toast(err.message); }
  finally { if (button && button.isConnected) { button.disabled = false; button.innerHTML = old; } }
}

const ukDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const sponsorChip = (s) => {
  if (!s) return '';
  if (s.match === 'exact') return `<span class="chip good" title="${esc(`${s.name}: ${s.routes.join(', ')} (${s.ratings.join(', ')})`)}">Licensed visa sponsor</span>`;
  return `<span class="chip" title="${esc(s.candidates.map((c) => c.name).join('; '))}">Possible sponsor match</span>`;
};
const flagChips = (flags = []) => flags.map((f) => `<span class="chip ${/no sponsorship|inside ir35/i.test(f) ? 'bad' : /offers sponsorship|outside ir35/i.test(f) ? 'good' : ''}">${esc(f)}</span>`).join(' ');

// --- Router ---
const routes = {
  jobs: renderJobs, board: renderBoard, app: renderApplication, profile: renderProfile, sponsors: renderSponsors, settings: renderSettings,
};
async function router() {
  const [, name = 'jobs', arg] = location.hash.split('/');
  $$('#nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#/${name}` || (name === 'app' && a.getAttribute('href') === '#/board')));
  if (!status) status = await api('/api/status').catch(() => null);
  if (status?.needsPassword && !status.signedIn) return renderLogin();
  view.innerHTML = '<p class="muted">Loading…</p>';
  try { await (routes[name] || renderJobs)(arg); }
  catch (err) { view.innerHTML = `<div class="notice bad">${esc(err.message)}</div>`; }
}
addEventListener('hashchange', router);
router();

function renderLogin() {
  view.innerHTML = `<form class="card stack" style="max-width:360px;margin:60px auto">
    <h1>Sign in</h1><div><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" autofocus></div>
    <button class="primary">Sign in</button></form>`;
  $('form', view).onsubmit = async (e) => {
    e.preventDefault();
    await busy($('button', view), 'Signing in', async () => {
      await api('/api/login', { method: 'POST', body: { password: $('#pw').value } });
      status = null;
      router();
    });
  };
}

// --- Find jobs ---
let lastSearch = { postings: [], params: null, selected: null };

async function renderJobs() {
  const profile = await api('/api/profile');
  const p = lastSearch.params || { keywords: profile.headline || '', location: profile.town || '', miles: 10, minSalary: '', sort: 'date', sponsorsOnly: false };
  view.innerHTML = `
    <h1>Find jobs</h1>
    <p class="lede">${status.sources.length ? `Searches ${esc(status.sources.join(' and '))} at once.` : 'No job board is set up yet (see <a href="#/settings">Settings</a>), but you can paste any advert below.'} Each employer is checked against the Home Office register of licensed visa sponsors.</p>
    <form class="card search" id="search">
      <div class="field"><label for="kw">Job title or keywords</label><input id="kw" value="${esc(p.keywords)}" placeholder="e.g. junior software engineer" required></div>
      <div class="field"><label for="loc">Town, city or postcode</label><input id="loc" value="${esc(p.location)}" placeholder="e.g. Manchester or M1"></div>
      <div class="field"><label for="miles">Within</label><select id="miles">${[5, 10, 15, 25, 50].map((m) => `<option value="${m}" ${+p.miles === m ? 'selected' : ''}>${m} miles</option>`).join('')}</select></div>
      <div class="field"><label for="min">Minimum salary (£ a year)</label><input id="min" inputmode="numeric" value="${esc(p.minSalary)}" placeholder="e.g. 30000"></div>
      <div class="field"><label for="sort">Sort by</label><select id="sort"><option value="date">Newest</option><option value="salary" ${p.sort === 'salary' ? 'selected' : ''}>Highest pay</option></select></div>
      <button class="primary">Search</button>
      <label class="row small" style="grid-column:1/-1;margin:0;color:var(--fg)"><input type="checkbox" id="sponsorsOnly" ${p.sponsorsOnly ? 'checked' : ''}> Only employers on the visa sponsor register (and not saying "no sponsorship")</label>
    </form>
    <div id="errors"></div>
    <div class="results"><div class="list" id="list"></div><div id="detail"></div></div>
    <h2>Or paste a posting</h2>
    <div class="card stack"><textarea id="paste" rows="5" placeholder="Paste the whole job advert here (from any site: LinkedIn, Indeed, NHS Jobs, Civil Service Jobs, a company's careers page…)"></textarea>
    <div><button id="pasteGo" class="primary">Start an application</button></div></div>`;

  $('#search').onsubmit = (e) => {
    e.preventDefault();
    lastSearch.params = { keywords: $('#kw').value, location: $('#loc').value, miles: $('#miles').value, minSalary: $('#min').value.replace(/[^\d]/g, ''), sort: $('#sort').value, sponsorsOnly: $('#sponsorsOnly').checked };
    busy($('#search button'), 'Searching', search);
  };
  $('#pasteGo').onclick = (e) => busy(e.target, 'Starting', async () => {
    const app = await api('/api/applications', { method: 'POST', body: { pasted: $('#paste').value } });
    location.hash = `#/app/${app.id}`;
  });
  drawResults();
  if (!lastSearch.params) drawSaved();
}

async function search() {
  const p = lastSearch.params;
  const q = new URLSearchParams({ keywords: p.keywords, location: p.location, miles: p.miles, sort: p.sort });
  if (p.minSalary) q.set('minSalary', p.minSalary);
  if (p.sponsorsOnly) q.set('sponsorsOnly', '1');
  const data = await api(`/api/jobs?${q}`);
  lastSearch.postings = data.postings;
  lastSearch.selected = data.postings[0]?.id || null;
  $('#errors').innerHTML = data.errors.length ? `<div class="notice warn" style="margin-top:12px">${data.errors.map(esc).join('<br>')}</div>` : '';
  drawResults();
}

async function drawSaved() {
  const saved = await api('/api/jobs/saved');
  if (!saved.length || lastSearch.params) return;
  lastSearch.postings = saved;
  lastSearch.selected = saved[0].id;
  drawResults('Saved postings');
}

function drawResults(heading) {
  const list = $('#list');
  if (!list) return;
  const { postings, selected } = lastSearch;
  if (!postings.length) {
    list.innerHTML = lastSearch.params ? '<div class="empty">Nothing found. Try broader keywords or a wider area.</div>' : '';
    $('#detail').innerHTML = '';
    return;
  }
  list.innerHTML = (heading ? `<h2 style="margin-top:0">${heading}</h2>` : `<p class="muted small">${postings.length} postings</p>`) + postings.map((p) => `
    <div class="card posting ${p.id === selected ? 'selected' : ''}" data-id="${esc(p.id)}" tabindex="0">
      <h3>${esc(p.title)}</h3>
      <div class="muted small">${esc(p.employer || 'Employer not named')} · ${esc(p.location || '')}</div>
      <div class="row small" style="margin-top:6px">${p.salaryText ? `<b>${esc(p.salaryText)}</b>` : '<span class="muted">Salary not given</span>'} ${sponsorChip(p.sponsor)} ${flagChips(p.flags)}
      ${p.saved ? '<span class="chip">Saved</span>' : ''} ${p.applied ? '<span class="chip good">Application started</span>' : ''}</div>
      <div class="muted small" style="margin-top:4px">${esc(p.source)}${p.posted ? ` · posted ${ukDate(p.posted)}` : ''}${p.closes ? ` · closes ${ukDate(p.closes)}` : ''}</div>
    </div>`).join('');
  $$('.posting', list).forEach((el) => {
    const pick = () => { lastSearch.selected = el.dataset.id; drawResults(heading); };
    el.onclick = pick;
    el.onkeydown = (e) => { if (e.key === 'Enter') pick(); };
  });
  const p = postings.find((x) => x.id === selected) || postings[0];
  const s = p.sponsor;
  $('#detail').innerHTML = `<div class="card detail stack">
    <div><h2 style="margin:0">${esc(p.title)}</h2><div class="muted">${esc(p.employer || '')} · ${esc(p.location || '')}</div></div>
    <div class="row">${p.salaryText ? `<b>${esc(p.salaryText)}</b>` : ''} ${p.contract ? `<span class="chip">${esc(p.contract)}</span>` : ''} ${flagChips(p.flags)}</div>
    ${s?.match === 'exact' ? `<div class="notice good"><b>${esc(s.name)}</b> is on the register of licensed sponsors: ${esc(s.routes.join(', '))} (${esc(s.ratings.join(', '))})${s.towns.length ? `, ${esc(s.towns.join(', '))}` : ''}.</div>`
      : s?.match === 'possible' ? `<div class="notice warn">Not an exact match on the sponsor register. Similar names: ${esc(s.candidates.map((c) => c.name).join('; '))}.</div>`
      : p.employer ? '<div class="notice">Not found on the visa sponsor register (agencies often post for clients that are).</div>' : ''}
    <div class="row"><button class="primary" id="apply">Start an application</button>
      <button id="save">${p.saved ? 'Unsave' : 'Save'}</button><button id="dismiss">Not for me</button>
      <a class="button" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Open on ${esc(p.source)}</a></div>
    <div class="description">${esc(p.description)}${p.descriptionIsFull ? '' : '\n\n<span class="muted">This is a preview. The full advert is fetched when you start an application (Reed), or paste it in (Adzuna).</span>'}</div>
  </div>`;
  $('#apply').onclick = (e) => busy(e.target, 'Starting', async () => {
    const app = await api('/api/applications', { method: 'POST', body: { posting: p } });
    location.hash = `#/app/${app.id}`;
  });
  $('#save').onclick = (e) => busy(e.target, 'Saving', async () => {
    await api(p.saved ? '/api/jobs/unsave' : '/api/jobs/save', { method: 'POST', body: p.saved ? { id: p.id } : { posting: p } });
    p.saved = !p.saved;
    drawResults(heading);
  });
  $('#dismiss').onclick = (e) => busy(e.target, 'Hiding', async () => {
    await api('/api/jobs/dismiss', { method: 'POST', body: { id: p.id } });
    lastSearch.postings = postings.filter((x) => x.id !== p.id);
    lastSearch.selected = lastSearch.postings[0]?.id;
    drawResults(heading);
  });
}

// --- Board ---
async function renderBoard() {
  const apps = await api('/api/applications');
  const applied = apps.filter((a) => a.appliedAt);
  const responded = apps.filter((a) => ['Interview', 'Offer'].includes(a.status));
  view.innerHTML = `
    <div class="row spread"><div><h1>Applications</h1><p class="lede">Drag a card to move it along. ${apps.length ? `${applied.length} sent, ${responded.length} at interview or offer${applied.length ? ` (${Math.round((100 * responded.length) / applied.length)}%)` : ''}.` : ''}</p></div>
    <a class="button primary" href="#/jobs">Find jobs</a></div>
    ${apps.length ? '' : '<div class="card empty">No applications yet. Find a job, or paste a posting, to start one.</div>'}
    <div class="board">${status.statuses.map((s) => {
      const col = apps.filter((a) => a.status === s);
      return `<div class="column" data-status="${s}"><h3>${s}<span>${col.length}</span></h3>${col.map((a) => `
        <a class="ticket" draggable="true" data-id="${a.id}" href="#/app/${a.id}">
          <b>${esc(a.title)}</b><span class="muted small">${esc(a.employer)}</span>
          <div class="row small" style="margin-top:4px;gap:4px">${a.score != null ? `<span class="chip ${a.score >= 70 ? 'good' : a.score >= 45 ? 'warn' : 'bad'}">${Math.round(a.score)}% match</span>` : ''}${a.sponsor?.match === 'exact' ? '<span class="chip good">Sponsor</span>' : ''}</div>
          <div class="muted small">${a.closes && !a.appliedAt ? `Closes ${ukDate(a.closes)}` : a.appliedAt ? `Applied ${ukDate(a.appliedAt)}` : `Updated ${ukDate(a.updatedAt)}`}</div>
        </a>`).join('')}</div>`;
    }).join('')}</div>`;
  $$('.ticket').forEach((t) => { t.ondragstart = (e) => e.dataTransfer.setData('text/plain', t.dataset.id); });
  $$('.column').forEach((col) => {
    col.ondragover = (e) => { e.preventDefault(); col.classList.add('over'); };
    col.ondragleave = () => col.classList.remove('over');
    col.ondrop = async (e) => {
      e.preventDefault();
      col.classList.remove('over');
      const id = e.dataTransfer.getData('text/plain');
      try { await api(`/api/applications/${id}`, { method: 'PATCH', body: { status: col.dataset.status } }); renderBoard(); }
      catch (err) { toast(err.message); }
    };
  });
}

// --- One application ---
let docTab = 'cv';

async function renderApplication(id) {
  const app = await api(`/api/applications/${id}`);
  const p = app.posting;
  const a = app.analysis;
  const d = app.documents;
  const icon = { met: '<span style="color:var(--good)">✔</span>', partial: '<span style="color:var(--warn)">◐</span>', gap: '<span style="color:var(--bad)">✖</span>' };
  view.innerHTML = `
    <p><a href="#/board">← Applications</a></p>
    <div class="row spread"><div><h1>${esc(p.title || a?.title || 'New application')}</h1><div class="muted">${esc(p.employer || a?.employer || '')}${p.location ? ` · ${esc(p.location)}` : ''}${p.salaryText ? ` · ${esc(p.salaryText)}` : ''}</div></div>
    <div class="row"><select id="status" aria-label="Status">${status.statuses.map((s) => `<option ${s === app.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
    <button class="danger" id="delete">Delete</button></div></div>
    <div class="row" style="margin:10px 0 16px">${sponsorChip(p.sponsor)} ${flagChips(p.flags)} ${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" class="small">Original advert ↗</a>` : ''}</div>
    <div class="app">
      <div class="stack">
        <div class="card stack">
          <div class="row spread"><h2 style="margin:0">How you match</h2><button id="analyse">${a ? 'Match again' : 'Match against my profile'}</button></div>
          ${a ? `<div class="row"><div class="score">${Math.round(a.score)}%</div><p class="grow" style="margin:0">${esc(a.summary)}</p></div>
            ${a.ukNotes.length ? `<div class="notice warn"><b>UK points to check</b><ul>${a.ukNotes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>` : ''}
            <div>${a.requirements.map((r) => `<div class="req"><div>${icon[r.status]}</div><div>${esc(r.requirement)} ${r.essential ? '' : '<span class="chip">desirable</span>'}${r.evidence ? `<div class="ev">${esc(r.evidence)}</div>` : ''}</div></div>`).join('')}</div>`
            : `<p class="muted">${status.ai ? 'Reads the posting against your profile: each requirement, whether you meet it, and the evidence.' : 'Set up an AI model in Settings to match postings and write documents.'}</p>`}
        </div>
        <div class="card stack">
          <h2 style="margin:0">The posting</h2>
          ${p.descriptionIsFull ? '' : '<div class="notice warn">This is only the preview the job board gives. Paste the full advert below for a better match and better documents.</div>'}
          <textarea id="desc" rows="14">${esc(p.description)}</textarea>
          <div><button id="saveDesc">Save the posting</button></div>
        </div>
        <div class="card stack"><h2 style="margin:0">Notes</h2><textarea id="notes" rows="4" placeholder="Private notes: who you spoke to, interview dates, salary discussed…">${esc(app.notes)}</textarea>
          <details class="small muted"><summary>History</summary>${app.history.map((h) => `<div>${ukDate(h.at)} – ${esc(h.what)}</div>`).join('')}</details></div>
      </div>
      <div class="card stack" id="docs">
        <div class="row spread"><h2 style="margin:0">Your documents</h2>
          <div class="row"><select id="tone" aria-label="Tone">${['professional', 'confident', 'enthusiastic', 'concise'].map((t) => `<option ${d?.tone === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
          <button class="primary" id="write">${d ? 'Rewrite' : 'Write CV, cover letter and email'}</button></div></div>
        ${d ? `<div class="row"><input id="instruction" class="grow" placeholder="Ask for a change, e.g. “shorter cover letter” or “lead with the React project”"><button id="refine">Rewrite with this</button>${app.hasVersions ? '<button id="undo">Undo</button>' : ''}</div>
          ${d.issues.length ? `<div class="notice bad"><b>Check before sending</b><ul>${d.issues.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>` : '<div class="notice good">Every skill, role and figure in these documents comes from your profile.</div>'}
          ${d.gaps.length ? `<div class="notice warn"><b>Asked for but not claimed</b> (not in your profile)<ul>${d.gaps.map((g) => `<li>${esc(g)}</li>`).join('')}</ul></div>` : ''}
          <div class="tabs">${[['cv', 'CV'], ['letter', 'Cover letter'], ['email', 'Email']].map(([k, l]) => `<button data-tab="${k}" class="${docTab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
          <div id="docBody"></div>`
        : `<p class="muted">Writes a two-page British CV, a cover letter and a covering email for this job, using only what's in your <a href="#/profile">profile</a>. Anything the advert asks for that you don't have is listed, never made up.</p>`}
      </div>
    </div>`;

  $('#status').onchange = async (e) => { await api(`/api/applications/${id}`, { method: 'PATCH', body: { status: e.target.value } }).catch((err) => toast(err.message)); toast(`Moved to ${e.target.value}`); };
  $('#delete').onclick = async () => { if (confirm('Delete this application and its documents?')) { await api(`/api/applications/${id}`, { method: 'DELETE' }); location.hash = '#/board'; } };
  $('#analyse').onclick = (e) => busy(e.target, 'Reading the posting', async () => { await api(`/api/applications/${id}/analyse`, { method: 'POST' }); renderApplication(id); });
  $('#saveDesc').onclick = (e) => busy(e.target, 'Saving', async () => { await api(`/api/applications/${id}`, { method: 'PATCH', body: { description: $('#desc').value } }); toast('Saved. Match again to use it.'); });
  let notesTimer;
  $('#notes').oninput = () => { clearTimeout(notesTimer); notesTimer = setTimeout(() => api(`/api/applications/${id}`, { method: 'PATCH', body: { notes: $('#notes').value } }).catch((err) => toast(err.message)), 600); };
  const write = (button, instruction) => busy(button, 'Writing (this can take a minute)', async () => {
    await api(`/api/applications/${id}/tailor`, { method: 'POST', body: { tone: $('#tone').value, instruction } });
    renderApplication(id);
  });
  $('#write').onclick = (e) => write(e.target);
  if (!d) return;
  $('#refine').onclick = (e) => write(e.target, $('#instruction').value.trim());
  $('#undo')?.addEventListener('click', (e) => busy(e.target, 'Going back', async () => { await api(`/api/applications/${id}/undo`, { method: 'POST' }); renderApplication(id); }));
  $$('.tabs button').forEach((b) => { b.onclick = () => { docTab = b.dataset.tab; $$('.tabs button').forEach((x) => x.classList.toggle('on', x === b)); drawDoc(id, d); }; });
  drawDoc(id, d);
}

function drawDoc(id, d) {
  const body = $('#docBody');
  const saveDocs = (documents, button) => busy(button, 'Saving', async () => { await api(`/api/applications/${id}`, { method: 'PATCH', body: { documents } }); toast('Saved'); });
  if (docTab === 'cv') {
    const cv = d.cv;
    body.innerHTML = `<div class="row" style="margin-bottom:10px"><a class="button" href="/print/${id}/cv" target="_blank">Open for printing / PDF</a><button id="editCv">Edit</button></div>
      <div class="paper"><div style="font-size:1.35rem;font-weight:700">${esc(cv.name)}</div>${cv.headline ? `<div>${esc(cv.headline)}</div>` : ''}<div class="small" style="color:#555">${cv.contact.map(esc).join(' · ')}</div>
      <h4>Personal statement</h4><p>${esc(cv.statement)}</p>
      <h4>Key skills</h4><p>${cv.keySkills.map(esc).join(' · ')}</p>
      <h4>Employment history</h4>${cv.experience.map((e) => `<div><b>${esc(e.title)}</b>, ${esc(e.employer)} <span style="color:#666;float:right">${esc(e.dates)}</span><ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>`).join('')}
      ${cv.projects.length ? `<h4>Projects</h4>${cv.projects.map((p) => `<p><b>${esc(p.name)}</b>: ${esc(p.description)}</p>`).join('')}` : ''}
      <h4>Education</h4>${cv.education.map((e) => `<p><b>${esc(e.qualification)}</b>${e.grade ? ` (${esc(e.grade)})` : ''}, ${esc(e.institution)}</p>`).join('')}
      <h4>References</h4><p>${esc(cv.references)}</p></div>`;
    $('#editCv').onclick = () => {
      body.innerHTML = `<div class="stack"><div><label>Personal statement</label><textarea id="st" rows="4">${esc(cv.statement)}</textarea></div>
        <div><label>Key skills (one per line)</label><textarea id="sk" rows="5">${esc(cv.keySkills.join('\n'))}</textarea></div>
        ${cv.experience.map((e, i) => `<div><label>${esc(e.title)}, ${esc(e.employer)}: bullets, one per line</label><textarea data-i="${i}" class="bul" rows="5">${esc(e.bullets.join('\n'))}</textarea></div>`).join('')}
        <div class="row"><button class="primary" id="saveCv">Save</button><button id="cancel">Cancel</button></div></div>`;
      $('#cancel').onclick = () => drawDoc(id, d);
      $('#saveCv').onclick = async (e) => {
        cv.statement = $('#st').value;
        cv.keySkills = $('#sk').value.split('\n').map((s) => s.trim()).filter(Boolean);
        $$('.bul').forEach((t) => { cv.experience[t.dataset.i].bullets = t.value.split('\n').map((s) => s.trim()).filter(Boolean); });
        await saveDocs({ cv }, e.target);
        drawDoc(id, d);
      };
    };
  } else if (docTab === 'letter') {
    const l = d.coverLetter;
    body.innerHTML = `<div class="row" style="margin-bottom:10px"><a class="button" href="/print/${id}/letter" target="_blank">Open for printing / PDF</a></div>
      <div class="stack"><div class="grid"><div><label>Greeting</label><input id="gr" value="${esc(l.greeting)}"></div><div><label>Sign-off</label><input id="so" value="${esc(l.signOff)}"></div></div>
      <p class="small muted">UK convention: “Dear Hiring Manager” ends “Yours faithfully”; a named person (“Dear Ms Patel”) ends “Yours sincerely”.</p>
      <div><label>Letter (a blank line between paragraphs)</label><textarea id="lt" rows="16">${esc(l.paragraphs.join('\n\n'))}</textarea></div>
      <div><button class="primary" id="saveL">Save</button></div></div>`;
    $('#saveL').onclick = (e) => {
      l.greeting = $('#gr').value; l.signOff = $('#so').value;
      l.paragraphs = $('#lt').value.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
      saveDocs({ coverLetter: l }, e.target);
    };
  } else {
    const m = d.email;
    body.innerHTML = `<div class="stack"><div><label>To</label><input id="to" value="${esc(m.to)}" placeholder="The address in the advert"></div>
      <div><label>Subject</label><input id="sj" value="${esc(m.subject)}"></div>
      <div><label>Message</label><textarea id="bd" rows="12">${esc(m.body)}</textarea></div>
      <p class="small muted">Attach the CV and cover letter PDFs (from the other tabs) before sending.</p>
      <div class="row"><button class="primary" id="mail">Open in my email app</button><button id="copy">Copy message</button><button id="saveM">Save</button></div></div>`;
    const read = () => ({ to: $('#to').value, subject: $('#sj').value, body: $('#bd').value });
    $('#mail').onclick = () => { const x = read(); location.href = `mailto:${encodeURIComponent(x.to)}?subject=${encodeURIComponent(x.subject)}&body=${encodeURIComponent(x.body)}`; };
    $('#copy').onclick = async () => { await navigator.clipboard.writeText(read().body); toast('Copied'); };
    $('#saveM').onclick = (e) => { Object.assign(m, read()); saveDocs({ email: m }, e.target); };
  }
}

// --- Profile ---
const SECTIONS = {
  experience: { title: 'Employment history', add: 'Add a job', fields: [['title', 'Job title'], ['employer', 'Employer'], ['location', 'Town or city'], ['start', 'Start (YYYY-MM)'], ['end', 'End (YYYY-MM, empty if current)'], ['achievements', 'What you did and achieved, one per line (include real numbers where you have them)', 'lines']] },
  education: { title: 'Education', add: 'Add a qualification', fields: [['qualification', 'Qualification, e.g. BSc (Hons) Computer Science, A levels, GCSEs'], ['institution', 'University, college or school'], ['grade', 'Grade, e.g. 2:1, First, AAB, 9 GCSEs grades 9–6'], ['start', 'Start (YYYY-MM)'], ['end', 'End (YYYY-MM)'], ['details', 'Modules, dissertation, prizes', 'text']] },
  certifications: { title: 'Certifications and training', add: 'Add a certification', fields: [['name', 'Name'], ['issuer', 'Issued by'], ['year', 'Year']] },
  projects: { title: 'Projects', add: 'Add a project', fields: [['name', 'Name'], ['url', 'Link'], ['description', 'What it is, what you built, the outcome', 'text']] },
};

const FIELD_NAMES = { name: 'name', email: 'email', phone: 'phone', town: 'town', postcode: 'postcode', linkedin: 'LinkedIn', website: 'website', headline: 'headline', statement: 'about you', noticePeriod: 'notice period', clearance: 'clearance', drivingLicence: 'driving licence' };
const COUNTED = { skills: ['skill', 'skills'], languages: ['language', 'languages'], experience: ['job', 'jobs'], education: ['qualification', 'qualifications'], certifications: ['certification', 'certifications'], projects: ['project', 'projects'] };
// "email" → "email"; "2 experience" → "2 jobs"; "1 languages" → "1 language"
const addedLabel = (a) => {
  const m = /^(\d+) (\w+)$/.exec(a);
  return m ? `${m[1]} ${COUNTED[m[2]]?.[+m[1] === 1 ? 0 : 1] || m[2]}` : FIELD_NAMES[a] || a;
};
const readBase64 = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(',')[1] || '');
  r.onerror = () => reject(new Error(`Couldn't read ${file.name}.`));
  r.readAsDataURL(file);
});

/** `imported` is a profile read from a CV or LinkedIn that hasn't been saved yet. */
async function renderProfile(arg, imported) {
  const p = imported?.profile || await api('/api/profile');
  const input = (key, label, opts = '') => `<div class="field"><label for="f-${key}">${label}</label><input id="f-${key}" data-key="${key}" value="${esc(p[key])}" ${opts}></div>`;
  view.innerHTML = `
    <h1>Your profile</h1>
    <p class="lede">Everything your CVs and cover letters are written from. The AI uses only what is here, so the more real detail (results, numbers, tools), the better the documents. A UK CV leaves out your photo, date of birth and marital status, so there's nowhere to put them.</p>
    <div class="card stack" id="import">
      <div><h2 style="margin:0">Fill this in from your CV</h2>
      <p class="muted" style="margin:4px 0 0">Upload your CV and the AI copies it into the profile below for you to check. What you've already typed is kept; new jobs and qualifications are added.</p></div>
      <div class="grid">
        <div><label for="cvFile">Your CV (PDF, Word or text)</label><input id="cvFile" type="file" accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"></div>
        <div><label for="liUrl">LinkedIn profile address (optional)</label><input id="liUrl" type="url" inputmode="url" placeholder="linkedin.com/in/your-name" value="${esc(p.linkedin)}"></div>
        <div><label for="liFile">LinkedIn profile as a PDF (optional)</label><input id="liFile" type="file" accept=".pdf,application/pdf"></div>
      </div>
      <details class="small muted"><summary>Why a PDF from LinkedIn, and how to get one</summary>
        <p style="margin-top:6px">LinkedIn doesn't let other apps read profiles from a link, so your address is saved and put on your CVs, and the profile itself comes from LinkedIn's own export. On linkedin.com, open your profile, click <b>Resources</b> (or <b>More</b>), then <b>Save to PDF</b>, and choose that file here.</p></details>
      <div class="row"><button type="button" class="primary" id="importGo" ${status.ai ? '' : 'title="Set up an AI model in Settings to read files"'}>Fill in my profile</button>
        <span class="small muted">${status.ai ? `Read by ${esc(status.ai)}.` : 'Reading files needs an AI model (see <a href="#/settings">Settings</a>); a LinkedIn address alone works without one.'}</span></div>
    </div>
    ${imported ? `<div class="notice warn" id="importNotice"><b>Not saved yet.</b> Read from ${imported.read.length ? esc(imported.read.join(' and ')) : 'your LinkedIn address'}${imported.added.length ? `, adding ${esc(imported.added.map(addedLabel).join(', '))}` : ', but nothing new was found'}. Check everything below, fix anything it got wrong, then <b>Save profile</b>.</div>` : ''}
    <form id="profile" class="stack">
      <div class="card stack"><h2 style="margin-top:0">About you</h2>
        <div class="grid">${input('name', 'Full name')}${input('headline', 'Headline, e.g. Junior Software Engineer')}${input('email', 'Email', 'type="email"')}${input('phone', 'Phone')}
        ${input('town', 'Town or city')}${input('postcode', 'Postcode area (not shown on the CV)')}${input('linkedin', 'LinkedIn')}${input('website', 'Website or GitHub')}</div>
        <div><label for="f-statement">About you, in your own words (the AI writes each personal statement from this)</label><textarea id="f-statement" data-key="statement" rows="4">${esc(p.statement)}</textarea></div>
        <div class="grid"><div><label for="f-skills">Skills, one per line</label><textarea id="f-skills" data-list="skills" rows="8">${esc((p.skills || []).join('\n'))}</textarea></div>
        <div><label for="f-languages">Languages, one per line (e.g. “Polish (native)”)</label><textarea id="f-languages" data-list="languages" rows="8">${esc((p.languages || []).join('\n'))}</textarea></div></div>
      </div>
      <div class="card stack"><h2 style="margin-top:0">Working in the UK</h2>
        <div class="grid">
          <div class="field"><label for="f-rightToWork">Right to work</label><select id="f-rightToWork" data-key="rightToWork">${['', 'British or Irish citizen', 'EU Settlement Scheme: settled status', 'EU Settlement Scheme: pre-settled status', 'Indefinite leave to remain', 'Graduate visa', 'Skilled Worker visa (current sponsor)', 'Needs visa sponsorship', 'Other (see statement)'].map((o) => `<option ${p.rightToWork === o ? 'selected' : ''} value="${esc(o)}">${o || 'Not stated'}</option>`).join('')}</select></div>
          ${input('noticePeriod', 'Notice period, e.g. 1 month')}
          ${input('clearance', 'Security clearance, e.g. SC (active), BPSS')}
          <label class="row" style="color:var(--fg);align-self:end"><input type="checkbox" id="f-drivingLicence" ${p.drivingLicence ? 'checked' : ''}> Full UK driving licence</label>
        </div>
        <div>${input('references', 'References')}</div>
      </div>
      ${Object.entries(SECTIONS).map(([key, s]) => `<div class="card"><h2 style="margin-top:0">${s.title}</h2><div id="sec-${key}"></div><button type="button" data-add="${key}">${s.add}</button></div>`).join('')}
      <div class="row" style="position:sticky;bottom:0;background:var(--bg);padding:10px 0"><button class="primary" id="saveProfile">Save profile</button><span class="muted small" id="strength"></span></div>
    </form>`;

  const lists = Object.fromEntries(Object.keys(SECTIONS).map((k) => [k, structuredClone(p[k] || [])]));
  const drawSection = (key) => {
    $(`#sec-${key}`).innerHTML = lists[key].map((item, i) => `<div class="repeat"><div class="grid">${SECTIONS[key].fields.map(([f, label, kind]) => kind
      ? `<div style="grid-column:1/-1"><label>${label}</label><textarea data-sec="${key}" data-i="${i}" data-f="${f}" data-kind="${kind}" rows="4">${esc(kind === 'lines' ? (item[f] || []).join('\n') : item[f])}</textarea></div>`
      : `<div><label>${label}</label><input data-sec="${key}" data-i="${i}" data-f="${f}" value="${esc(item[f])}"></div>`).join('')}</div>
      <div class="row" style="margin-top:8px"><button type="button" class="link danger" data-remove="${key}" data-i="${i}">Remove</button></div></div>`).join('');
  };
  Object.keys(SECTIONS).forEach(drawSection);
  const view$ = $('#profile');
  view$.addEventListener('input', (e) => {
    const t = e.target;
    if (!t.dataset.sec) return;
    lists[t.dataset.sec][t.dataset.i][t.dataset.f] = t.dataset.kind === 'lines' ? t.value.split('\n').map((s) => s.trim()).filter(Boolean) : t.value;
  });
  view$.addEventListener('click', (e) => {
    const t = e.target;
    if (t.dataset.add) { lists[t.dataset.add].push({}); drawSection(t.dataset.add); }
    if (t.dataset.remove) { lists[t.dataset.remove].splice(+t.dataset.i, 1); drawSection(t.dataset.remove); }
  });
  const strength = () => {
    const checks = [p.name, p.email, p.phone, p.town, p.statement, (p.skills || []).length >= 5, lists.experience.length, lists.experience.some((e) => (e.achievements || []).length >= 3), lists.education.length, p.rightToWork];
    $('#strength').textContent = `Profile ${Math.round((100 * checks.filter(Boolean).length) / checks.length)}% complete`;
  };
  strength();
  $('#importGo').onclick = (e) => busy(e.target, 'Reading your CV (this can take a minute)', async () => {
    const files = [];
    for (const input of [$('#cvFile'), $('#liFile')]) {
      const file = input.files[0];
      if (!file) continue;
      if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} is larger than 10 MB.`);
      files.push({ name: file.name, data: await readBase64(file) });
    }
    const result = await api('/api/profile/import', { method: 'POST', body: { files, linkedin: $('#liUrl').value } });
    await renderProfile(arg, result);
    $('#importNotice').scrollIntoView({ block: 'center' });
  });
  view$.onsubmit = (e) => {
    e.preventDefault();
    const body = { ...lists };
    $$('[data-key]', view$).forEach((el) => { body[el.dataset.key] = el.value.trim(); });
    $$('[data-list]', view$).forEach((el) => { body[el.dataset.list] = el.value.split('\n').map((s) => s.trim()).filter(Boolean); });
    body.drivingLicence = $('#f-drivingLicence').checked;
    busy($('#saveProfile'), 'Saving', async () => { Object.assign(p, await api('/api/profile', { method: 'PUT', body })); Object.keys(SECTIONS).forEach((k) => { lists[k] = p[k]; drawSection(k); }); strength(); $('#importNotice')?.remove(); toast('Profile saved'); });
  };
}

// --- Sponsors ---
async function renderSponsors() {
  view.innerHTML = `<h1>Visa sponsors</h1>
    <p class="lede">If you need a Skilled Worker visa, an employer must hold a sponsor licence. This searches the Home Office register of licensed sponsors, downloaded from GOV.UK and refreshed daily.</p>
    <form class="card row" id="sf"><input id="sq" class="grow" placeholder="Company name, e.g. Deliveroo" autofocus><button class="primary">Search</button></form>
    <p class="small muted" id="meta"></p><div id="sr" class="stack"></div>`;
  $('#sf').onsubmit = (e) => {
    e.preventDefault();
    busy($('#sf button'), 'Searching', async () => {
      const data = await api(`/api/sponsors?q=${encodeURIComponent($('#sq').value)}`);
      $('#meta').textContent = `${data.meta.organisations.toLocaleString('en-GB')} organisations in ${data.meta.file}`;
      $('#sr').innerHTML = data.results.length ? data.results.map((r) => `<div class="card"><b>${esc(r.name)}</b> <span class="muted">${esc(r.towns.join(', '))}</span><div class="row small" style="margin-top:4px">${r.routes.map((x) => `<span class="chip good">${esc(x)}</span>`).join(' ')} ${r.ratings.map((x) => `<span class="chip">${esc(x)}</span>`).join(' ')}</div></div>`).join('')
        : '<div class="empty">No licensed sponsor by that name. Try a shorter name; the register uses the legal company name.</div>';
    });
  };
}

// --- Settings ---
async function renderSettings() {
  status = await api('/api/status');
  const ok = (v) => (v ? '<span class="chip good">Set up</span>' : '<span class="chip bad">Not set up</span>');
  view.innerHTML = `<h1>Settings</h1>
    <p class="lede">Shortlist reads its settings from environment variables (or a <code>.env</code> file next to <code>server.js</code>). Change them and restart.</p>
    <div class="stack">
      <div class="card"><div class="row spread"><h2 style="margin:0">AI model</h2>${ok(status.ai)}</div>
        <p>${status.ai ? `Using <b>${esc(status.ai)}</b>.` : 'None yet.'} Set <code>ANTHROPIC_API_KEY</code> to use Claude, or <code>AI_PROVIDER=ollama</code> and <code>OLLAMA_MODEL</code> for a local model through Ollama, so your profile never leaves your machine.</p></div>
      <div class="card"><div class="row spread"><h2 style="margin:0">Job boards</h2>${ok(status.sources.length)}</div>
        <p>${status.sources.length ? `Searching <b>${esc(status.sources.join(', '))}</b>.` : ''} Both are free: <a href="https://www.reed.co.uk/developers/jobseeker" target="_blank" rel="noopener">Reed</a> (<code>REED_API_KEY</code>) and <a href="https://developer.adzuna.com/" target="_blank" rel="noopener">Adzuna</a> (<code>ADZUNA_APP_ID</code>, <code>ADZUNA_APP_KEY</code>). For NHS Jobs, Civil Service Jobs, LinkedIn or anywhere else, paste the advert on Find jobs.</p></div>
      <div class="card"><div class="row spread"><h2 style="margin:0">Visa sponsor register</h2>${ok(status.sponsors)}</div>
        <p>${status.sponsors ? `${status.sponsors.organisations.toLocaleString('en-GB')} organisations, from <code>${esc(status.sponsors.file)}</code>.` : 'Downloads from GOV.UK on first use.'}</p></div>
      <div class="card stack"><h2 style="margin:0">Your data</h2><p>Everything is in <code>data/shortlist.json</code> on this computer. Download it as a backup, or load one back.</p>
        <div class="row"><a class="button" href="/api/export">Download everything</a><label class="button" style="margin:0;color:var(--fg)">Load a backup<input type="file" id="imp" accept="application/json" hidden></label>
        ${status.needsPassword ? '<button id="logout">Sign out</button>' : ''}</div></div>
    </div>`;
  $('#imp').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file || !confirm('Replace everything in Shortlist with this backup?')) return;
    try { await api('/api/import', { method: 'POST', body: JSON.parse(await file.text()) }); toast('Backup loaded'); }
    catch (err) { toast(err.message); }
  };
  $('#logout')?.addEventListener('click', async () => { await api('/api/logout', { method: 'POST' }); status = null; router(); });
}
