/* Interactive QA pipeline + trace viewer. All data below is an illustrative, anonymised replay. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- Pipeline stages ---------- */
  const STAGES = [
    {
      step: '01', title: 'PR & Docker env', subtitle: 'GitHub Actions + Compose',
      duration: { pass: '1m 15s', defect: '1m 15s' }, status: { pass: 'passed', defect: 'passed' },
      badge: 'STAGE 01 · EPHEMERAL ENVIRONMENT', file: '.github/workflows/qa-gate.yml',
      desc: 'Every pull request boots its own isolated stack with Docker Compose — seeded database, cache, API and Playwright workers — so tests never fight over shared staging data.',
      bullets: [
        'Deterministic database seed before any test runs',
        'Suite split by NUnit category into parallel jobs on GitHub Actions runners',
        'Outdated runs on the same branch are cancelled to save CI minutes'
      ],
      code: `name: QA quality gate
on:
  pull_request:
    branches: [main, develop]

concurrency:
  group: qa-\${{ github.head_ref }}
  cancel-in-progress: true

jobs:
  e2e:
    timeout-minutes: 30
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        suite: [Auth, Editor, Billing, Analytics]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: 8.0.x
      - name: Boot ephemeral Docker stack
        run: docker compose -f docker-compose.ci.yml up -d --wait
      - name: Build and install browsers
        run: |
          dotnet build tests/E2E
          pwsh tests/E2E/bin/Debug/net8.0/playwright.ps1 install --with-deps chromium
      - name: Run \${{ matrix.suite }} tests
        run: >
          dotnet test tests/E2E --no-build
          --filter "Category=\${{ matrix.suite }}"
          --settings ci.runsettings
          --logger "trx;LogFileName=\${{ matrix.suite }}.trx"`
    },
    {
      step: '02', title: 'Web E2E', subtitle: 'Playwright + C# · POM',
      duration: { pass: '18m 40s', defect: '19m 12s' }, status: { pass: 'passed', defect: 'failed' },
      badge: 'STAGE 02 · PLAYWRIGHT .NET', file: 'tests/E2E/Infrastructure/BaseTest.cs',
      desc: 'The suite that took regression from a full day of manual work to about 30 minutes. Playwright for .NET in C# with NUnit and a strict Page Object Model. Auth state is prepared once, and every failing test leaves a trace behind.',
      bullets: [
        'Auth state saved once and reused, not repeated through the UI in every test',
        'User-facing locators first (roles, labels), data-testid where the UI gives nothing better',
        'Trace with screenshots and DOM snapshots kept for every failure, so nobody has to reproduce blind'
      ],
      code: `using Microsoft.Playwright;
using Microsoft.Playwright.NUnit;
using NUnit.Framework;
using NUnit.Framework.Interfaces;

namespace E2E.Infrastructure;

[Parallelizable(ParallelScope.Self)]
public abstract class BaseTest : PageTest
{
    public override BrowserNewContextOptions ContextOptions() => new()
    {
        BaseURL = TestSettings.BaseUrl,
        StorageStatePath = ".auth/user.json",   // logged in once, reused everywhere
    };

    [OneTimeSetUp]
    public void UseTestIds() => Playwright.Selectors.SetTestIdAttribute("data-testid");

    [SetUp]
    public async Task StartTrace() =>
        await Context.Tracing.StartAsync(new() { Screenshots = true, Snapshots = true, Sources = true });

    [TearDown]
    public async Task KeepTraceOnFailure()
    {
        var failed = TestContext.CurrentContext.Result.Outcome.Status == TestStatus.Failed;
        await Context.Tracing.StopAsync(new()
        {
            Path = failed ? Path.Combine("traces", $"{TestContext.CurrentContext.Test.Name}.zip") : null
        });
    }
}`
    },
    {
      step: '03', title: 'Mobile flows', subtitle: 'Maestro · Android & iOS',
      duration: { pass: '6m 40s', defect: '6m 40s' }, status: { pass: 'passed', defect: 'passed' },
      badge: 'STAGE 03 · MAESTRO', file: 'maestro/flows/onboarding.yaml',
      desc: 'Critical mobile journeys checked on every build. Building mobile apps myself shapes what I cover here: deep links, permission prompts, and what happens when the network drops mid-flow.',
      bullets: [
        'Declarative YAML flows that wait out animations and slow network loads',
        'Onboarding, paywall and publishing flows covered end to end',
        'Runs headless against an Android emulator in CI'
      ],
      code: `appId: com.example.app
tags:
  - smoke
  - mobile-release
---
- launchApp:
    clearState: true
- tapOn: "Continue with Email"
- inputText: "qa+shard1@example.com"
- tapOn:
    id: "auth-submit-btn"
- assertVisible: "Create your first page"
- tapOn:
    id: "template-creator"
- tapOn: "Publish page"
- assertVisible:
    text: "Your page is live!"`
    },
    {
      step: '04', title: 'Quality gate', subtitle: 'Merged report + PR comment',
      duration: { pass: '1m 10s', defect: '0m 58s' }, status: { pass: 'passed', defect: 'blocked' },
      badge: 'STAGE 04 · REPORTING', file: '.github/scripts/post-qa-summary.js',
      desc: 'TRX results and trace files from every parallel job are collected into one artifact, and a summary goes straight onto the pull request. If web or mobile tests fail, the merge is blocked.',
      bullets: [
        'From the PR comment straight to the trace.zip of any failed test',
        'Required status check: a red gate means no merge',
        'Duration and flake trends tracked over time, not just per run'
      ],
      code: `// Runs in actions/github-script: read every job's TRX file and post the gate result
const s = await summariseTrx('./results/**/*.trx');
const ok = s.status === 'passed';

const body = \`
### QA gate: \${ok ? '✅ passed' : '❌ blocked'}
| Suite | Passed | Failed | Flaky | Duration |
| :-- | :-: | :-: | :-: | :-: |
| Web E2E (Playwright) | \${s.web.passed} | \${s.web.failed} | \${s.web.flaky} | \${s.web.duration} |
| Mobile (Maestro) | \${s.mobile.passed} | \${s.mobile.failed} | — | \${s.mobile.duration} |

[Open trace viewer](\${process.env.TRACE_URL})
\`;

await github.rest.issues.createComment({ ...context.repo, issue_number: pr, body });
if (!ok) process.exit(1);`
    }
  ];

  /* ---------- Trace viewer specs ---------- */
  const SPECS = [
    {
      file: 'PublishPageTests.cs', suite: 'Web E2E · Chromium · Editor', duration: '1,420ms',
      source: `// Pages/PageEditor.cs — page object
public class PageEditor(IPage page)
{
    private ILocator AddBlock => page.GetByTestId("add-link-block");
    private ILocator UrlInput => page.GetByLabel("Destination URL");
    private ILocator Publish  => page.GetByRole(AriaRole.Button, new() { Name = "Publish" });
    public  ILocator Toast    => page.GetByRole(AriaRole.Status);

    public Task OpenAsync() => page.GotoAsync("/editor");

    public async Task PublishLinkAsync(string url)
    {
        await AddBlock.ClickAsync();
        await UrlInput.FillAsync(url);
        await Publish.ClickAsync();
    }
}

// Tests/PublishPageTests.cs
[Category("Editor")]
public class PublishPageTests : BaseTest
{
    [Test]
    public async Task PublishingALink_ShowsConfirmation()
    {
        var editor = new PageEditor(Page);
        await editor.OpenAsync();
        await editor.PublishLinkAsync("https://markolosic.github.io");
        await Expect(editor.Toast).ToContainTextAsync("Published");
    }
}`,
      steps: [
        { action: 'Page.GotoAsync("/editor")', locator: 'document', time: 180, url: 'https://staging.example/editor', view: 'editor',
          net: `GET /api/v2/page/profile → 200 OK (64ms)
Response: { "id": "usr_9921", "handle": "@demo", "blocks": 3 }
Console: [info] Hydration completed in 42ms` },
        { action: 'GetByTestId("add-link-block").ClickAsync()', locator: 'GetByTestId("add-link-block")', time: 95, url: 'https://staging.example/editor?drawer=new', view: 'drawer',
          net: `POST /api/v2/analytics/event → 202 Accepted (18ms)
Payload: { "event": "block_drawer_opened", "source": "toolbar" }` },
        { action: 'GetByLabel("Destination URL").FillAsync(url)', locator: 'GetByLabel("Destination URL")', time: 62, url: 'https://staging.example/editor?drawer=new', view: 'filled',
          net: `GET /api/v2/metadata/preview?url=https://markolosic.github.io → 200 OK (112ms)
Response: { "title": "Marko Lošić — QA Engineer", "valid": true }` },
        { action: 'GetByRole(AriaRole.Button, new() { Name = "Publish" }).ClickAsync()', locator: 'GetByRole(AriaRole.Button, new() { Name = "Publish" })', time: 410, url: 'https://staging.example/editor', view: 'publish', dynamic: true,
          net: `PUT /api/v2/page/publish → 200 OK (310ms)
Response: { "published": true, "version": 14, "cdnPurged": true }
Console: [log] Published state synced to edge`,
          netDefect: `PUT /api/v2/page/publish → 500 Internal Server Error (389ms)
Response: { "error": "ERR_CACHE_LOCK_TIMEOUT", "message": "Failed to acquire cache lock" }
Console: [error] Uncaught (in promise) PublishError: HTTP 500` },
        { action: 'Expect(Toast).ToContainTextAsync("Published")', locator: 'GetByRole(AriaRole.Status)', time: 673, url: 'https://staging.example/editor', view: 'publish', dynamic: true,
          net: `✓ Assertion passed
<div role="status">Changes published!</div> contains "Published" (14ms)`,
          netDefect: `Microsoft.Playwright.PlaywrightException : Locator expected to contain text 'Published'
But was: 'Failed to publish changes (Error 500)'
Call log:
  - Expect "ToContainTextAsync" with timeout 5000ms
  - waiting for GetByRole(AriaRole.Status)
  - locator resolved to <div role="status" class="toast-error">Failed to publish changes (Error 500)</div>
  - unexpected value "Failed to publish changes (Error 500)"` }
      ]
    },
    {
      file: 'SessionSecurityTests.cs', suite: 'Security · API + web', duration: '940ms',
      source: `[Test, Category("Security")]
public async Task ExpiredToken_IsRejectedOnProtectedMutation()
{
    await Page.GotoAsync("/settings/security");

    var res = await Request.PostAsync("/api/v2/user/email", new()
    {
        Headers = new Dictionary<string, string> { ["Authorization"] = "Bearer expired_token" },
        DataObject = new { email = "attacker@example.com" }
    });

    Assert.That(res.Status, Is.EqualTo(401));
}`,
      steps: [
        { action: 'Page.GotoAsync("/settings/security")', locator: 'GetByRole(AriaRole.Heading, new() { Name = "Security" })', time: 210, url: 'https://staging.example/settings/security', view: 'security',
          net: `GET /settings/security → 200 OK
Strict-Transport-Security: max-age=63072000; includeSubDomains
X-Frame-Options: DENY` },
        { action: 'Request.PostAsync("/api/v2/user/email")  [expired token]', locator: 'Authorization: Bearer <expired>', time: 115, url: 'https://staging.example/api/v2/user/email', view: 'security401',
          net: `POST /api/v2/user/email → 401 Unauthorized (29ms)
Response: { "error": "token_expired" }
OWASP A07: Identification and Authentication Failures → covered` }
      ]
    },
    {
      file: 'onboarding.yaml', suite: 'Maestro · Android emulator', duration: '3,110ms',
      source: `# Maestro flow
appId: com.example.app
---
- launchApp:
    clearState: true
- tapOn: "Continue with Email"
- inputText: "qa+shard1@example.com"
- tapOn:
    id: "auth-submit-btn"
- assertVisible: "Create your first page"`,
      steps: [
        { action: 'launchApp (clearState: true)', locator: 'com.example.app', time: 1240, url: 'android://pixel-7-api-34/onboarding', view: 'mobile',
          net: `Device: emulator-5554 (Pixel 7, API 34)
Cold start 1.2s · com.example.app in focus` },
        { action: 'tapOn(id: "auth-submit-btn") + assertVisible', locator: 'id: "auth-submit-btn"', time: 870, url: 'android://pixel-7-api-34/home', view: 'mobileHome',
          net: `POST /api/v2/mobile/session → 200 OK (94ms)
UI hierarchy: TextView["Create your first page"] visible=true` }
      ]
    }
  ];

  /* ---------- State ---------- */
  const state = { scenario: 'pass', stage: 1, spec: 0, step: 3, tab: 'network', running: false, runAt: -1 };
  /* Language: English lives in the data above, Serbian in sr.js; blog/common.js sets <html lang> */
  const SRD = window.PL_SR;
  const isSr = () => document.documentElement.lang === 'sr' && !!SRD;
  const UI_EN = {
    stage: 'STAGE', running: 'running…', inspecting: '● Inspecting', inspect: 'Inspect →', runtime: 'Stage runtime',
    run: 'Run pipeline', runAgain: 'Run again', runningBtn: 'Running…', copy: 'Copy', copied: 'Copied ✓',
    badge: { passed: '✓ Pass', failed: '✕ 1 defect', blocked: '⚠ Blocked', running: '● Running', queued: 'Queued' },
    runningStage: (step, title) => `Running stage ${step} · ${title}…`,
    statusPass: 'Workflow #1842 · all checks passed in 27m 45s · ready to merge',
    statusDefect: 'Workflow #1843 · 1 defect caught in Web E2E · merge blocked',
    allPassed: '3 passed', somePassed: '2 passed · 1 failed', step: 'Step'
  };
  const ui = () => isSr() ? SRD.ui : UI_EN;
  const stageText = i => isSr() ? { ...STAGES[i], ...SRD.stages[i] } : STAGES[i];
  let hasRun = false;
  const isFail = st => st.dynamic && state.scenario === 'defect';
  const defaultStep = spec => {
    const f = spec.steps.findIndex(isFail);
    return f >= 0 ? f : spec.steps.length - 1;
  };
  const stageStatus = i => {
    if (!state.running) return STAGES[i].status[state.scenario];
    if (i < state.runAt) return STAGES[i].status[state.scenario];
    return i === state.runAt ? 'running' : 'queued';
  };

  /* ---------- Pipeline ---------- */
  function renderStatus() {
    const el = $('#pl-status');
    el.classList.toggle('is-running', state.running);
    if (state.running) {
      const s = STAGES[state.runAt];
      el.innerHTML = `<i class="pl-dot"></i><span>${esc(ui().runningStage(s.step, stageText(state.runAt).title))}</span>`;
    } else if (state.scenario === 'pass') {
      el.innerHTML = `<i class="pl-dot ok"></i><span>${ui().statusPass}</span>`;
    } else {
      el.innerHTML = `<i class="pl-dot bad"></i><span>${ui().statusDefect}</span>`;
    }
  }
  function renderStages() {
    const u = ui();
    $('#pl-stages').innerHTML = STAGES.map((s0, i) => {
      const s = stageText(i);
      const st = stageStatus(i), sel = i === state.stage;
      const time = st === 'queued' ? '—' : st === 'running' ? u.running : s.duration[state.scenario];
      return `<button type="button" class="pl-stage is-${st}${sel ? ' is-selected' : ''}" data-i="${i}" aria-pressed="${sel}">
        <span class="pl-stage-top"><span>${u.stage} ${s.step}</span><span class="pl-badge ${st}">${u.badge[st]}</span></span>
        <span class="pl-stage-title">${esc(s.title)}</span>
        <span class="pl-stage-sub">${esc(s.subtitle)}</span>
        <span class="pl-stage-foot"><span>⏱ ${time}</span><span>${sel ? u.inspecting : u.inspect}</span></span>
      </button>`;
    }).join('');
  }
  function renderDetail() {
    const s = stageText(state.stage);
    $('#pl-d-badge').textContent = s.badge;
    $('#pl-d-time').textContent = `${ui().runtime}: ${s.duration[state.scenario]}`;
    $('#pl-d-title').textContent = `${s.title} — ${s.subtitle}`;
    $('#pl-d-desc').textContent = s.desc;
    $('#pl-d-bullets').innerHTML = s.bullets.map(b => `<li>${esc(b)}</li>`).join('');
    $('#pl-d-file').textContent = s.file;
    $('#pl-d-code').textContent = s.code;
  }

  /* ---------- Trace viewer ---------- */
  function renderTrace() {
    const failed = state.scenario === 'defect';
    const pill = $('#pl-suite-pill');
    pill.textContent = failed ? ui().somePassed : ui().allPassed;
    pill.className = 'pl-pill ' + (failed ? 'pl-bad' : 'pl-ok');

    $('#pl-specs').innerHTML = SPECS.map((sp, i) => {
      const bad = sp.steps.some(isFail);
      return `<button type="button" class="pl-spec${i === state.spec ? ' is-selected' : ''}" data-spec="${i}" aria-pressed="${i === state.spec}">
        <span style="min-width:0"><span class="pl-spec-name"><i class="pl-dot ${bad ? 'bad' : 'ok'}"></i><span>${esc(sp.file)}</span></span>
        <span class="pl-spec-suite">${esc(isSr() ? SRD.suites[i] : sp.suite)}</span></span>
        <span class="pl-spec-time">${sp.duration}</span>
      </button>`;
    }).join('');

    const spec = SPECS[state.spec];
    $('#pl-active-spec').textContent = spec.file;
    const total = $('#pl-tl-total');
    total.textContent = spec.duration;
    total.className = 'pl-mono ' + (spec.steps.some(isFail) ? 'pl-bad' : 'pl-ok');

    $('#pl-tl').innerHTML = spec.steps.map((st, i) =>
      `<button type="button" data-step="${i}" style="flex-grow:${st.time}" class="${isFail(st) ? 'is-failed' : i === state.step ? 'is-active' : ''}" aria-label="${ui().step} ${i + 1}: ${esc(st.action)}"></button>`
    ).join('');

    $('#pl-steps').innerHTML = spec.steps.map((st, i) => {
      const bad = isFail(st), sel = i === state.step;
      return `<button type="button" class="pl-act${sel ? ' is-selected' : ''}${bad ? ' is-failed' : ''}" data-step="${i}" aria-pressed="${sel}">
        <span class="pl-act-l"><span class="${bad ? 'pl-bad' : 'pl-ok'}">${bad ? '✕' : '✓'}</span><span>${esc(st.action)}</span></span>
        <span class="pl-act-t">${st.time.toLocaleString('en-US')}ms</span>
      </button>`;
    }).join('');

    renderSnapshot();
    renderTab();
  }

  function snapshot(st, bad) {
    const foot = (l, r, cls = 'pl-ok') => `<div class="pl-snap-foot"><span>${l}</span><span class="${cls}">${r}</span></div>`;
    switch (st.view) {
      case 'editor':
        return `<div class="pl-snap-h"><span>Page editor — @demo</span><span class="pl-chip ok">200</span></div>
          <div class="pl-box"><small class="pl-muted">Blocks (3)</small>Portfolio · Blog · Contact</div>
          <div class="pl-box target"><div class="pl-box-row"><span>+ Add link block</span><span class="pl-chip info">NEXT</span></div></div>
          ${foot('Hydrated in 42ms', 'Page ready')}`;
      case 'drawer':
        return `<div class="pl-snap-h"><span>New link block</span><span class="pl-mono pl-muted">drawer=new</span></div>
          <div class="pl-box"><small class="pl-muted">Destination URL</small><span class="pl-fake-input">https://</span></div>
          ${foot('Drawer opened from toolbar', 'Event tracked')}`;
      case 'filled':
        return `<div class="pl-snap-h"><span>New link block</span><span class="pl-chip ok">VALID</span></div>
          <div class="pl-box target"><small class="pl-muted">Destination URL</small><span class="pl-fake-input filled">https://markolosic.github.io</span></div>
          <div class="pl-box"><small class="pl-muted">Link preview</small>Marko Lošić — QA Engineer</div>
          ${foot('Preview fetched in 112ms', 'Input validated')}`;
      case 'publish':
        return bad
          ? `<div class="pl-snap-h"><span>Page editor — @demo</span><span class="pl-chip bad">HTTP 500</span></div>
            <div class="pl-box bad"><div class="pl-box-row"><div><small class="pl-bad">[role="status"] toast</small>"Failed to publish changes (Error 500)"</div><span class="pl-chip bad">FAILED</span></div></div>
            ${foot('Captured: trace.zip · screenshots · DOM snapshots', 'Merge blocked', 'pl-bad')}`
          : `<div class="pl-snap-h"><span>Page editor — @demo</span><span class="pl-chip ok">200</span></div>
            <div class="pl-box ok"><div class="pl-box-row"><div><small class="pl-ok">✓ [role="status"] toast</small>"Changes published!"</div><span class="pl-chip ok">MATCHED</span></div></div>
            ${foot('Edge cache purged', 'Snapshot verified')}`;
      case 'security':
        return `<div class="pl-snap-h"><span>Settings · Security</span><span class="pl-chip ok">200</span></div>
          <div class="pl-box pl-headers"><div><span>Strict-Transport-Security</span><span class="pl-ok">✓</span></div><div><span>X-Frame-Options: DENY</span><span class="pl-ok">✓</span></div><div><span>Session cookie: HttpOnly; Secure</span><span class="pl-ok">✓</span></div></div>
          ${foot('Security headers present', 'Session active')}`;
      case 'security401':
        return `<div class="pl-snap-h"><span>POST /api/v2/user/email</span><span class="pl-chip ok">401 EXPECTED</span></div>
          <div class="pl-box ok"><small class="pl-ok">✓ Expired token rejected</small>Email change refused · nothing written</div>
          ${foot('OWASP A07 check', 'Access control holds')}`;
      case 'mobile':
      case 'mobileHome': {
        const home = st.view === 'mobileHome';
        return `<div class="pl-snap-h"><span>Android emulator · Pixel 7</span><span class="pl-mono pl-ok">UI matched</span></div>
          <div class="pl-phone">${home
            ? '<b>Create your first page</b><span>Pick a template</span><span class="go">Creator template</span>'
            : '<b>Welcome</b><span>Continue with Google</span><span class="go">Continue with Email</span>'}</div>
          ${foot(home ? 'Session created in 94ms' : 'Cold start 1.2s', home ? 'Onboarding verified' : 'App in focus')}`;
      }
    }
    return '';
  }
  function renderSnapshot() {
    const st = SPECS[state.spec].steps[state.step];
    $('#pl-snap-loc').textContent = st.locator;
    $('#pl-snap-url').textContent = st.url;
    $('#pl-snap').innerHTML = snapshot(st, isFail(st));
  }

  function colorLines(text) {
    return text.split('\n').map(l => {
      const e = esc(l);
      if (/error|exception|→ 5\d\d|timed out|but was|unexpected value/i.test(l)) return `<span class="pl-bad">${e}</span>`;
      if (/→ [234]\d\d|✓|→ pass|→ covered/.test(l)) return `<span class="pl-ok">${e}</span>`;
      return e;
    }).join('\n');
  }
  function renderTab() {
    document.querySelectorAll('.pl-tabs [role="tab"]').forEach(b => {
      const on = b.dataset.tab === state.tab;
      b.setAttribute('aria-selected', on);
      b.tabIndex = on ? 0 : -1;
    });
    const panel = $('#pl-tabpanel');
    panel.setAttribute('aria-labelledby', 'pl-tab-' + state.tab);
    const spec = SPECS[state.spec], st = spec.steps[state.step];
    if (state.tab === 'network') {
      panel.innerHTML = `<pre>${colorLines(isFail(st) ? st.netDefect : st.net)}</pre>`;
    } else if (state.tab === 'source') {
      panel.innerHTML = `<pre>${esc(spec.source)}</pre>`;
    }
  }

  /* ---------- Interaction ---------- */
  function setScenario(sc) {
    if (state.running) return;
    state.scenario = sc;
    $('#pl-pass').setAttribute('aria-pressed', sc === 'pass');
    $('#pl-defect').setAttribute('aria-pressed', sc === 'defect');
    state.step = defaultStep(SPECS[state.spec]);
    renderAll();
  }
  function renderAll() {
    renderStatus(); renderStages(); renderDetail(); renderTrace();
    if (!state.running) $('#pl-run-label').textContent = hasRun ? ui().runAgain : ui().run;
    $('#pl-copy').textContent = ui().copy;
  }
  function lock(on) {
    ['#pl-pass', '#pl-defect', '#pl-run'].forEach(s => { $(s).disabled = on; });
    $('#pl-run-label').textContent = on ? ui().runningBtn : ui().runAgain;
    if (!on) hasRun = true;
  }
  async function run() {
    if (state.running) return;
    state.running = true;
    lock(true);
    for (let i = 0; i < STAGES.length; i++) {
      state.runAt = i;
      renderStatus(); renderStages();
      await sleep(reduced ? 150 : 750);
    }
    state.running = false;
    state.runAt = -1;
    if (state.scenario === 'defect') { state.stage = 1; state.spec = 0; state.step = defaultStep(SPECS[0]); }
    lock(false);
    renderAll();
  }

  $('#pl-pass').addEventListener('click', () => setScenario('pass'));
  $('#pl-defect').addEventListener('click', () => setScenario('defect'));
  $('#pl-run').addEventListener('click', run);
  $('#pl-stages').addEventListener('click', e => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    state.stage = +b.dataset.i;
    renderStages(); renderDetail();
  });
  $('#pl-specs').addEventListener('click', e => {
    const b = e.target.closest('[data-spec]');
    if (!b) return;
    state.spec = +b.dataset.spec;
    state.step = defaultStep(SPECS[state.spec]);
    renderTrace();
  });
  const pickStep = e => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    state.step = +b.dataset.step;
    renderTrace();
  };
  $('#pl-steps').addEventListener('click', pickStep);
  $('#pl-tl').addEventListener('click', pickStep);
  const tabs = $('.pl-tabs');
  tabs.addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    state.tab = b.dataset.tab;
    renderTab();
  });
  tabs.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const order = ['network', 'source'];
    const i = (order.indexOf(state.tab) + (e.key === 'ArrowRight' ? 1 : order.length - 1)) % order.length;
    state.tab = order[i];
    renderTab();
    $('#pl-tab-' + state.tab).focus();
  });

  const copyBtn = $('#pl-copy');
  copyBtn.addEventListener('click', async () => {
    const text = STAGES[state.stage].code;
    try { await navigator.clipboard.writeText(text); }
    catch (err) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (_) {} ta.remove();
    }
    copyBtn.textContent = ui().copied;
    setTimeout(() => { copyBtn.textContent = ui().copy; }, 1600);
  });

  document.querySelectorAll('.card.glow').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  renderAll();
  new MutationObserver(renderAll).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
