/* Мэдээлэл хадгалах төхөөрөмж — найзын үнэлгээ, бататгах асуулт, багшийн самбар */
(function () {
  "use strict";

  const CFG = window.APP_CONFIG || {};
  const DEMO = !CFG.SCRIPT_URL;
  const app = document.getElementById("app");
  const LS_DEMO = "unelgee_demo_rows";
  const LS_ME = "unelgee_me";

  // ---------------- Өгөгдөл ----------------
  const TASKS = [
    {
      id: "d1", icon: "🔎", title: "Даалгавар 1 · Судлаач", max: 12,
      criteria: [
        { id: "d1a", text: "Төхөөрөмжийн нэр зөв", hint: "мөр бүрт 1", values: [0, 1, 2, 3, 4, 5, 6] },
        { id: "d1b", text: "Хэмжээ зөв", hint: "мөр бүрт 1", values: [0, 1, 2, 3, 4, 5, 6] }
      ]
    },
    {
      id: "d2", icon: "🧭", title: "Даалгавар 2 · Хайгуулч", max: 11,
      criteria: [
        { id: "d2a", text: "Desktop дээр нэртэйгээ хавтас байна", yesno: 2 },
        { id: "d2b", text: "Хавтас дотор аниме зураг байна", yesno: 2 },
        { id: "d2c", text: "Зургийн хэмжээг зөв бичсэн", yesno: 1 },
        { id: "d2d", text: "Диск, хавтас, хаяг зөв", hint: "тус бүр 1", values: [0, 1, 2, 3] },
        { id: "d2e", text: "C дискний хэмжээг зөв тооцсон", hint: "сул, нийт, ашигласан", values: [0, 1, 2, 3] }
      ]
    },
    {
      id: "d3", icon: "🧮", title: "Даалгавар 3 · Туслагч", max: 5,
      criteria: [
        { id: "d3a", text: "Асуулт 1: бодолт ба хариу зөв", values: [0, 1, 2] },
        { id: "d3b", text: "Асуулт 1: зөвлөгөө өгсөн", values: [0, 1, 2, 3] }
      ]
    }
  ];
  const PEER_MAX = 28;
  const CRIT_IDS = TASKS.flatMap(t => t.criteria.map(c => c.id));

  const QUIZ = [
    {
      q: "Мэдээлэл хадгалах төхөөрөмжид хамааралгүй төхөөрөмжийг сонгоно уу.",
      opts: ["Флаш диск", "Хатуу диск", "Хулгана", "DVD"], ans: 2,
      why: "Хулгана бол оролтын төхөөрөмж. Флаш, хатуу диск, DVD мэдээлэл хадгалдаг."
    },
    {
      q: "Доорх хариултуудаас «Хатуу диск»-нд тохирох хэмжээг сонгоно уу.",
      opts: ["4.7 ГБ", "128 ГБ – 4 ТБ", "4 – 64 ГБ", "700 МБ"], ans: 1,
      why: "Хатуу диск (HDD, SSD) 128 ГБ-аас 4 ТБ хүртэл байдаг. 4–64 ГБ бол RAM, 4.7 ГБ бол DVD, 700 МБ бол CD."
    },
    {
      q: "Зурагт харуулсан C дискний сул зайг тогтооно уу.",
      img: "assets/q3_c_disk.png",
      opts: ["475 GB", "96 GB", "379 GB", "812 GB"], ans: 1,
      why: "«96 GB free of 475 GB» — free-ийн өмнөх тоо сул зай: 96 GB. 475 нь нийт, 379 нь ашигласан, 812 нь D диск."
    },
    {
      q: "Файлын хэмжээг ямар цэснээс орж мэдэх боломжтой вэ?",
      opts: ["Rename", "Properties", "Copy", "New"], ans: 1,
      why: "Файл дээр хулганы баруун товч → Properties → Size мөрөөс хэмжээг харна."
    }
  ];

  // ---------------- Туслах ----------------
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = s => String(s || "").trim().replace(/\s+/g, " ");
  const key = (cls, name) => (norm(cls) + "|" + norm(name)).toLowerCase();
  const level = n => n >= 25 ? "🏆 Маш сайн — Мэдээллийн мастер!" : n >= 20 ? "🥈 Сайн" : n >= 14 ? "👍 Дунд" : "💪 Дахин оролдъё!";
  const shortLevel = n => n >= 25 ? "🏆" : n >= 20 ? "🥈" : n >= 14 ? "👍" : "💪";
  const getMe = () => { try { return JSON.parse(localStorage.getItem(LS_ME)) || {}; } catch (e) { return {}; } };
  const setMe = o => { try { localStorage.setItem(LS_ME, JSON.stringify(Object.assign(getMe(), o))); } catch (e) {} };

  function toast(msg, ms) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), ms || 2600);
  }

  const ONE_CLASS = !(CFG.CLASSES && CFG.CLASSES.length > 1);
  function classField(id, sel) {
    if (ONE_CLASS) {
      const c = (CFG.CLASSES && CFG.CLASSES[0]) || "7-р анги";
      return `<input type="hidden" id="${id}" value="${esc(c)}">`;
    }
    return `<label class="field"><span>Анги</span><select class="select" id="${id}">${classOptions(sel)}</select></label>`;
  }
  const rowCls = () => ONE_CLASS ? "" : "row2";

  function classOptions(sel) {
    const list = CFG.CLASSES && CFG.CLASSES.length ? CFG.CLASSES : ["7-р анги"];
    return list.map(c => `<option value="${esc(c)}" ${c === sel ? "selected" : ""}>${esc(c)}</option>`).join("");
  }

  // ---------------- API ----------------
  const api = {
    async submit(row) {
      row.time = new Date().toISOString();
      if (DEMO) {
        let rows = [];
        try { rows = JSON.parse(localStorage.getItem(LS_DEMO)) || []; } catch (e) {}
        rows.push(row);
        try { localStorage.setItem(LS_DEMO, JSON.stringify(rows)); } catch (e) {}
        return { ok: true };
      }
      const res = await fetch(CFG.SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(row)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Илгээж чадсангүй");
      return data;
    },
    async list() {
      if (DEMO) {
        let rows = [];
        try { rows = JSON.parse(localStorage.getItem(LS_DEMO)) || []; } catch (e) {}
        return { peer: rows.filter(r => r.type === "peer"), quiz: rows.filter(r => r.type === "quiz") };
      }
      const res = await fetch(CFG.SCRIPT_URL + "?action=list&t=" + Date.now());
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Уншиж чадсангүй");
      return data;
    }
  };

  // ---------------- Confetti ----------------
  function confetti() {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = document.getElementById("confetti"), ctx = cv.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
    const colors = ["#F2A65A", "#E2772F", "#7FB3E6", "#2EAD6B", "#F6F4EE", "#B08CFF"];
    const P = Array.from({ length: 160 }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .35,
      vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4,
      s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - .5) * .3,
      c: colors[(Math.random() * colors.length) | 0]
    }));
    let frames = 0;
    (function tick() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      P.forEach(p => {
        p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
      });
      if (++frames < 170) requestAnimationFrame(tick); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })();
  }

  function ring(value, max, color) {
    const r = 80, c = 2 * Math.PI * r, f = max ? value / max : 0;
    return `<div class="ring"><svg width="190" height="190" viewBox="0 0 190 190">
      <circle cx="95" cy="95" r="${r}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="16"/>
      <circle cx="95" cy="95" r="${r}" fill="none" stroke="${color || "#F2A65A"}" stroke-width="16" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c}" class="ring-arc" data-off="${c * (1 - f)}"/></svg>
      <div class="num"><div>${value}<small>/ ${max}</small></div></div></div>`;
  }
  function animateRings() {
    requestAnimationFrame(() => document.querySelectorAll(".ring-arc").forEach(a => {
      a.style.transition = "stroke-dashoffset 1.1s ease"; a.style.strokeDashoffset = a.dataset.off;
    }));
  }

  // ---------------- Нүүр ----------------
  function viewHome() {
    const me = getMe();
    app.className = "container";
    app.innerHTML = `
      <section class="hero">
        <div class="kicker">Мэдээллийн технологи</div>
        <h1>Мэдээлэл хадгалах төхөөрөмж</h1>
        <p class="lead">Найзынхаа ажлыг үнэлж, бататгах асуултад хариулаарай 🚀</p>
      </section>
      <div class="choices">
        <a class="choice" href="#peer">
          <span class="ico o">🤝</span>
          <span><h2>Найзаа үнэлэх</h2><p>Ажлын хуудасны 3 даалгаврыг оноогоор үнэлнэ · 28 оноо</p></span>
          <span class="go">›</span>
        </a>
        <a class="choice" href="#quiz">
          <span class="ico b">🧠</span>
          <span><h2>Бататгах асуулт ${me.quizDone ? '<span class="done-tag">✓ Хариулсан</span>' : ""}</h2><p>4 асуулт · хариулт бүр шууд шалгагдана</p></span>
          <span class="go">›</span>
        </a>
        <a class="choice" href="#board">
          <span class="ico g">📊</span>
          <span><h2>Багшийн самбар</h2><p>Ангийн дүн шууд шинэчлэгдэнэ</p></span>
          <span class="go">›</span>
        </a>
      </div>`;
  }

  // ---------------- Найзын үнэлгээ ----------------
  function viewPeer() {
    const me = getMe();
    const scores = {};
    app.className = "container";
    app.innerHTML = `
      <div class="kicker">🤝 Найзын үнэлгээ</div>
      <h1>Найзынхаа ажлыг үнэл</h1>
      <p class="lead">Найзынхаа дэлгэц, ажлын хуудсыг харж шударгаар оноо тавиарай.</p>
      <div class="card">
        <label class="field"><span>Таны нэр (үнэлж буй)</span>
          <input class="input" id="evaluator" autocomplete="off" placeholder="Жишээ: Бат" value="${esc(me.name || "")}"></label>
        <div class="${rowCls()}">
          <label class="field"><span>Найзын нэр (үнэлүүлж буй)</span>
            <input class="input" id="student" autocomplete="off" placeholder="Жишээ: Сараа"></label>
          ${classField("cls", me.cls)}
        </div>
      </div>
      ${TASKS.map(t => `
        <section class="card task" data-task="${t.id}">
          <div class="task-head"><span class="ico">${t.icon}</span>
            <div><h3>${esc(t.title)}</h3><div class="sub">Дээд оноо ${t.max}</div></div>
            <div class="score" id="sc-${t.id}">— / ${t.max}</div></div>
          ${t.criteria.map(c => `
            <div class="crit" data-crit="${c.id}">
              <p>${esc(c.text)} ${c.hint ? `<small>(${esc(c.hint)})</small>` : ""}</p>
              <div class="scores" role="group" aria-label="${esc(c.text)}">
                ${c.yesno
                  ? `<button type="button" class="sbtn no" data-v="0">✗<small>Үгүй · 0</small></button>
                     <button type="button" class="sbtn yes" data-v="${c.yesno}">✓<small>Тийм · ${c.yesno}</small></button>`
                  : c.values.map(v => `<button type="button" class="sbtn" data-v="${v}">${v}</button>`).join("")}
              </div>
            </div>`).join("")}
        </section>`).join("")}
      <div class="sticky-total"><div class="sticky-inner">
        <div class="total-num"><span id="tot">0</span> <small>/ ${PEER_MAX}</small></div>
        <div class="bar"><i id="totbar"></i></div>
        <button class="btn" id="send" disabled>Илгээх 🚀</button>
      </div></div>`;

    const update = () => {
      let total = 0;
      TASKS.forEach(t => {
        const done = t.criteria.every(c => scores[c.id] != null);
        const sum = t.criteria.reduce((a, c) => a + (scores[c.id] || 0), 0);
        total += sum;
        document.getElementById("sc-" + t.id).textContent = (done ? sum : "—") + " / " + t.max;
      });
      document.getElementById("tot").textContent = total;
      document.getElementById("totbar").style.width = (total / PEER_MAX * 100) + "%";
      document.getElementById("send").disabled = CRIT_IDS.some(id => scores[id] == null);
      return total;
    };

    app.querySelectorAll(".crit").forEach(cr => {
      cr.addEventListener("click", e => {
        const b = e.target.closest(".sbtn"); if (!b) return;
        cr.querySelectorAll(".sbtn").forEach(x => { x.classList.remove("on"); x.setAttribute("aria-pressed", "false"); });
        b.classList.add("on"); b.setAttribute("aria-pressed", "true");
        scores[cr.dataset.crit] = Number(b.dataset.v);
        update();
      });
    });

    document.getElementById("send").addEventListener("click", async e => {
      const evaluator = norm(document.getElementById("evaluator").value);
      const student = norm(document.getElementById("student").value);
      const cls = document.getElementById("cls").value;
      if (!evaluator || !student) { toast("Өөрийн болон найзынхаа нэрийг бичээрэй ✏️"); return; }
      if (evaluator.toLowerCase() === student.toLowerCase()) { toast("Өөрийгөө биш, найзаа үнэлээрэй 😊"); return; }
      const btn = e.currentTarget; btn.disabled = true; btn.textContent = "Илгээж байна…";
      const t1 = scores.d1a + scores.d1b;
      const t2 = scores.d2a + scores.d2b + scores.d2c + scores.d2d + scores.d2e;
      const t3 = scores.d3a + scores.d3b;
      const row = Object.assign({ type: "peer", cls, evaluator, student, t1, t2, t3, total: t1 + t2 + t3 }, scores);
      try {
        await api.submit(row);
        setMe({ name: evaluator, cls });
        viewPeerDone(row);
      } catch (err) {
        btn.disabled = false; btn.textContent = "Илгээх 🚀";
        toast("Илгээж чадсангүй. Интернэтээ шалгаад дахин дарна уу.", 4000);
      }
    });
  }

  function viewPeerDone(row) {
    app.className = "container";
    app.innerHTML = `
      <div class="result">
        <div class="kicker">Амжилттай илгээлээ ✓</div>
        <h1>${esc(row.student)}-ийн оноо</h1>
        ${ring(row.total, PEER_MAX)}
        <div class="level">${level(row.total)}</div>
        <div class="breakdown">
          <div><b>${row.t1}/12</b><span>Судлаач</span></div>
          <div><b>${row.t2}/11</b><span>Хайгуулч</span></div>
          <div><b>${row.t3}/5</b><span>Туслагч</span></div>
        </div>
        <div class="btn-row" style="justify-content:center">
          <a class="btn" href="#quiz">🧠 Бататгах асуулт руу</a>
          <button class="btn ghost" id="again">🤝 Өөр найз үнэлэх</button>
          <a class="btn ghost" href="#home">Нүүр хуудас</a>
        </div>
      </div>`;
    document.getElementById("again").onclick = () => { window.scrollTo(0, 0); viewPeer(); };
    animateRings(); confetti();
  }

  // ---------------- Бататгах асуулт ----------------
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function viewQuizStart() {
    const me = getMe();
    app.className = "container";
    app.innerHTML = `
      <div class="kicker">🧠 Бататгах асуулт</div>
      <h1>4 асуулт · 4 оноо</h1>
      <p class="lead">Хариултаа сонгоход зөв, бурууг шууд харуулна. Анхны оролдлогын оноо тооцогдоно.</p>
      <div class="card">
        <div class="${rowCls()}">
          <label class="field"><span>Таны нэр</span>
            <input class="input" id="qname" autocomplete="off" placeholder="Жишээ: Бат" value="${esc(me.name || "")}"></label>
          ${classField("qcls", me.cls)}
        </div>
        <div class="btn-row"><button class="btn block" id="qgo">Эхлэх ▶</button></div>
      </div>`;
    document.getElementById("qgo").addEventListener("click", () => {
      const name = norm(document.getElementById("qname").value);
      const cls = document.getElementById("qcls").value;
      if (!name) { toast("Нэрээ бичээрэй ✏️"); return; }
      setMe({ name, cls });
      runQuiz(name, cls);
    });
  }

  function runQuiz(name, cls) {
    const answers = []; let i = 0;
    const order = QUIZ.map(q => shuffle(q.opts.map((t, k) => ({ t, k }))));
    const letters = ["А", "Б", "В", "Г"];

    function show() {
      const q = QUIZ[i];
      app.className = "container";
      app.innerHTML = `
        <div class="progress">${QUIZ.map((_, k) => `<i class="${k < i ? "done" : k === i ? "cur" : ""}"></i>`).join("")}</div>
        <div class="q-num">АСУУЛТ ${i + 1} / ${QUIZ.length}</div>
        <h2 class="q-text">${esc(q.q)}</h2>
        ${q.img ? `<img class="q-img" src="${q.img}" alt="This PC цонх: Local Disk (C:) болон (D:) дискний мэдээлэл">` : ""}
        <div class="opts">${order[i].map((o, n) => `
          <button type="button" class="opt" data-k="${o.k}"><span class="letter">${letters[n]}</span><span>${esc(o.t)}</span></button>`).join("")}</div>
        <div class="feedback" id="fb"></div>
        <div class="btn-row"><button class="btn block" id="next" hidden>${i < QUIZ.length - 1 ? "Дараагийн асуулт ›" : "Дүнгээ харах 🎯"}</button></div>`;
      app.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => pick(b)));
      document.getElementById("next").addEventListener("click", () => { i++; i < QUIZ.length ? show() : finish(); });
      app.focus();
    }

    function pick(b) {
      const q = QUIZ[i], k = Number(b.dataset.k), ok = k === q.ans;
      answers[i] = { k, ok };
      app.querySelectorAll(".opt").forEach(x => {
        x.disabled = true;
        if (Number(x.dataset.k) === q.ans) x.classList.add("correct");
      });
      if (!ok) b.classList.add("wrong");
      const fb = document.getElementById("fb");
      fb.className = "feedback show " + (ok ? "ok" : "bad");
      fb.textContent = (ok ? "✅ Зөв! " : "❌ Буруу. ") + q.why;
      const nx = document.getElementById("next"); nx.hidden = false; nx.focus();
    }

    async function finish() {
      const score = answers.filter(a => a.ok).length;
      const row = { type: "quiz", cls, name, score };
      answers.forEach((a, n) => { row["q" + (n + 1)] = QUIZ[n].opts[a.k]; row["ok" + (n + 1)] = a.ok ? 1 : 0; });
      app.className = "container";
      app.innerHTML = `
        <div class="result">
          <div class="kicker" id="qstatus">Илгээж байна…</div>
          <h1>${score === 4 ? "Гайхалтай!" : score >= 3 ? "Сайн байна!" : "Дахин давтаад үзээрэй"}</h1>
          ${ring(score, 4, score >= 3 ? "#2EAD6B" : "#F2A65A")}
          <div class="breakdown" style="grid-template-columns:repeat(4,1fr)">
            ${answers.map((a, n) => `<div><b>${a.ok ? "✅" : "❌"}</b><span>Асуулт ${n + 1}</span></div>`).join("")}
          </div>
          <div class="btn-row" style="justify-content:center"><a class="btn ghost" href="#home">Нүүр хуудас</a></div>
        </div>`;
      animateRings();
      if (score >= 3) confetti();
      const st = document.getElementById("qstatus");
      try {
        await api.submit(row);
        setMe({ quizDone: true });
        st.textContent = "Амжилттай илгээлээ ✓";
      } catch (err) {
        st.innerHTML = 'Илгээж чадсангүй — <button class="btn" id="retry" style="padding:8px 14px;font-size:14px">Дахин илгээх</button>';
        document.getElementById("retry").onclick = async () => {
          try { await api.submit(row); setMe({ quizDone: true }); st.textContent = "Амжилттай илгээлээ ✓"; }
          catch (e) { toast("Интернэтээ шалгаад дахин оролдоно уу.", 3500); }
        };
      }
    }
    show();
  }

  // ---------------- Багшийн самбар ----------------
  let boardTimer = null;
  function viewBoard() {
    if (CFG.BOARD_PIN && sessionStorage.getItem("unelgee_pin") !== CFG.BOARD_PIN) {
      app.className = "container";
      app.innerHTML = `<div class="kicker">📊 Багшийн самбар</div><h1>PIN код</h1>
        <div class="card"><label class="field"><span>Самбарын PIN</span><input class="input" id="pin" type="password" inputmode="numeric"></label>
        <div class="btn-row"><button class="btn block" id="pingo">Нэвтрэх</button></div></div>`;
      const go = () => {
        if (document.getElementById("pin").value === CFG.BOARD_PIN) { sessionStorage.setItem("unelgee_pin", CFG.BOARD_PIN); viewBoard(); }
        else toast("PIN буруу байна");
      };
      document.getElementById("pingo").onclick = go;
      document.getElementById("pin").addEventListener("keydown", e => { if (e.key === "Enter") go(); });
      return;
    }
    let filter = sessionStorage.getItem("unelgee_cls") || "all";
    app.className = "container wide";
    app.innerHTML = `
      <div class="board-head">
        <div><div class="kicker">📊 Багшийн самбар</div><h1>Ангийн дүн</h1></div>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <span class="live"><i></i> <span id="upd">Ачаалж байна…</span></span>
          <select class="select" id="fcls" style="width:auto;padding:10px 14px;font-size:15px"></select>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><b id="s1">0</b><span>Үнэлгээ авсан сурагч</span></div>
        <div class="stat"><b id="s2">–</b><span>Дундаж оноо / 28</span></div>
        <div class="stat"><b id="s3">0</b><span>Асуултад хариулсан</span></div>
        <div class="stat"><b id="s4">–</b><span>Асуултын дундаж / 4</span></div>
      </div>
      <div class="board-grid">
        <section class="card"><h2>🏆 Тэргүүлэгчид</h2>
          <div class="legend"><span><i></i>Судлаач</span><span><i class="d2"></i>Хайгуулч</span><span><i class="d3"></i>Туслагч</span><span>🧠 = бататгах асуулт</span></div>
          <ul class="lb" id="lb"></ul></section>
        <section class="card"><h2>🧠 Асуулт бүрийн зөв хувь</h2><div class="qbars" id="qb" style="margin-top:14px"></div>
          <h2 style="margin-top:24px">📈 Түвшин</h2><div class="qbars" id="lv" style="margin-top:14px"></div></section>
      </div>`;

    const fsel = document.getElementById("fcls");
    fsel.addEventListener("change", () => { filter = fsel.value; sessionStorage.setItem("unelgee_cls", filter); render(lastData); });
    let lastData = { peer: [], quiz: [] };

    function render(data) {
      lastData = data;
      const classes = Array.from(new Set([...(CFG.CLASSES || []), ...data.peer.map(r => r.cls), ...data.quiz.map(r => r.cls)].filter(Boolean)));
      fsel.innerHTML = `<option value="all">Бүх анги</option>` + classes.map(c => `<option value="${esc(c)}" ${c === filter ? "selected" : ""}>${esc(c)}</option>`).join("");
      if (filter !== "all" && !classes.includes(filter)) filter = "all";
      const inCls = r => filter === "all" || r.cls === filter;

      // peer: сүүлийн үнэлгээ; quiz: анхны оролдлого
      const people = new Map();
      const get = (cls, name) => {
        const k = key(cls, name);
        if (!people.has(k)) people.set(k, { name: norm(name), cls, peer: null, quiz: null });
        return people.get(k);
      };
      data.peer.filter(inCls).sort((a, b) => String(a.time).localeCompare(String(b.time)))
        .forEach(r => { get(r.cls, r.student).peer = r; });
      data.quiz.filter(inCls).sort((a, b) => String(a.time).localeCompare(String(b.time)))
        .forEach(r => { const p = get(r.cls, r.name); if (!p.quiz) p.quiz = r; });

      const list = Array.from(people.values()).sort((a, b) =>
        ((b.peer ? +b.peer.total : -1) + (b.quiz ? +b.quiz.score : 0)) - ((a.peer ? +a.peer.total : -1) + (a.quiz ? +a.quiz.score : 0)));
      const peers = list.filter(p => p.peer), quizzes = list.filter(p => p.quiz);
      const avg = (arr, f) => arr.length ? (arr.reduce((s, x) => s + f(x), 0) / arr.length) : null;
      document.getElementById("s1").textContent = peers.length;
      const ap = avg(peers, p => +p.peer.total); document.getElementById("s2").textContent = ap == null ? "–" : ap.toFixed(1);
      document.getElementById("s3").textContent = quizzes.length;
      const aq = avg(quizzes, p => +p.quiz.score); document.getElementById("s4").textContent = aq == null ? "–" : aq.toFixed(1);

      const lb = document.getElementById("lb");
      lb.innerHTML = list.length ? list.map((p, n) => {
        const pr = p.peer;
        const w = v => (v / PEER_MAX * 100).toFixed(1) + "%";
        return `<li>
          <span class="rank">${n + 1}</span>
          <div class="who"><b>${esc(p.name)} ${pr ? shortLevel(+pr.total) : ""}</b>
            <span>${esc(p.cls)}${pr ? " · үнэлсэн: " + esc(pr.evaluator) : " · үнэлгээ хүлээгдэж байна"}</span>
            ${pr ? `<div class="mini"><i style="width:${w(+pr.t1)}"></i><i class="d2" style="width:${w(+pr.t2)}"></i><i class="d3" style="width:${w(+pr.t3)}"></i></div>` : ""}</div>
          <div class="pts">${pr ? +pr.total : "–"}<small>/ 28</small></div>
          <div class="qz">🧠 ${p.quiz ? +p.quiz.score + "/4" : "–"}<small>асуулт</small></div>
        </li>`;
      }).join("") : `<li class="empty" style="display:block">Одоогоор үнэлгээ ирээгүй байна. Сурагчид илгээмэгц энд гарч ирнэ ⏳</li>`;

      document.getElementById("qb").innerHTML = QUIZ.map((q, n) => {
        const okc = quizzes.filter(p => +p.quiz["ok" + (n + 1)] === 1).length;
        const pct = quizzes.length ? Math.round(okc / quizzes.length * 100) : 0;
        return `<div class="qbar"><p>${n + 1}. ${esc(q.q)} — <b>${quizzes.length ? pct + "%" : "–"}</b></p><div class="bar"><i style="width:${pct}%"></i></div></div>`;
      }).join("");

      const bands = [["🏆 Маш сайн (25–28)", t => t >= 25], ["🥈 Сайн (20–24)", t => t >= 20 && t < 25], ["👍 Дунд (14–19)", t => t >= 14 && t < 20], ["💪 Дахин оролдъё (0–13)", t => t < 14]];
      document.getElementById("lv").innerHTML = bands.map(([label, f]) => {
        const c = peers.filter(p => f(+p.peer.total)).length;
        const pct = peers.length ? Math.round(c / peers.length * 100) : 0;
        return `<div class="qbar"><p>${label} — <b>${c} сурагч</b></p><div class="bar"><i style="width:${pct}%;background:linear-gradient(90deg,#F2A65A,#E2772F)"></i></div></div>`;
      }).join("");
    }

    async function refresh() {
      try {
        const data = await api.list();
        render({ peer: data.peer || [], quiz: data.quiz || [] });
        document.getElementById("upd").textContent = "Шинэчлэгдсэн " + new Date().toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      } catch (e) {
        const u = document.getElementById("upd"); if (u) u.textContent = "Холболт тасарсан, дахин оролдож байна…";
      }
    }
    refresh();
    boardTimer = setInterval(refresh, Math.max(3, CFG.REFRESH_SECONDS || 5) * 1000);
  }

  // ---------------- Router ----------------
  function route() {
    if (boardTimer) { clearInterval(boardTimer); boardTimer = null; }
    const h = location.hash.replace(/^#\/?/, "");
    window.scrollTo(0, 0);
    if (h === "peer") viewPeer();
    else if (h === "quiz") viewQuizStart();
    else if (h === "board") viewBoard();
    else viewHome();
  }
  window.addEventListener("hashchange", route);
  route();
})();
