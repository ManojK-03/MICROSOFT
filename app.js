(function () {
  "use strict";

  var C = window.SITE_CONFIG || {};
  var CAP = Number(C.capacity) || 40;
  var LINKS = C.links || {};
  var API = (C.apiUrl || "").trim();

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var state = { count: null, source: "none" };
  var saved = false;

  function isPlaceholder(u) { return !u || /REPLACE/i.test(u); }

  /* Links from config */
  $$("[data-link]").forEach(function (a) {
    var u = LINKS[a.getAttribute("data-link")];
    if (u) a.setAttribute("href", u);
  });
  if (isPlaceholder(LINKS.form) && $("#formAlt")) $("#formAlt").hidden = true;
  if (C.contactEmail && $("#contactMail")) $("#contactMail").textContent = C.contactEmail;

  /* Mobile menu */
  var menuBtn = $("#menuBtn"), nav = $("#nav");
  menuBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  $$("a", nav).forEach(function (a) {
    a.addEventListener("click", function () { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); });
  });

  /* Seat grid */
  $$("[data-grid]").forEach(function (g) {
    for (var i = 0; i < CAP; i++) {
      var c = document.createElement("i");
      c.style.setProperty("--i", String(i));
      g.appendChild(c);
    }
  });

  function derived() {
    var known = typeof state.count === "number";
    return { known: known, count: state.count, remaining: known ? Math.max(0, CAP - state.count) : null, full: known && state.count >= CAP };
  }
  function setAll(key, text) { $$('[data-bind="' + key + '"]').forEach(function (el) { el.textContent = text; }); }

  function render() {
    var d = derived();
    setAll("count", d.known ? String(d.count) : "–");
    setAll("remaining", d.known ? String(d.remaining) : "–");
    setAll("status", d.full ? "Full" : "Open");
    $$("[data-status]").forEach(function (el) { el.classList.toggle("is-full", d.full); });
    $$("[data-grid]").forEach(function (g) {
      $$("i", g).forEach(function (c, i) { c.classList.toggle("on", d.known && i < d.count); });
      g.setAttribute("aria-label", d.known ? d.count + " of " + CAP + " seats taken" : "Seat map, live count unavailable");
    });
    var rail = $("#rail");
    var pct = d.known ? Math.min(100, Math.round(d.count / CAP * 100)) : 0;
    rail.firstElementChild.style.setProperty("--p", pct + "%");
    rail.setAttribute("aria-valuenow", String(d.known ? d.count : 0));
    setAll("note", state.source === "live" ? "Live count from registrations."
      : state.source === "manual" ? "Count updated by the organizers."
      : "Live count is not available right now. The organizers confirm seats.");
    var btn = $("#submitBtn");
    if (!saved) {
      btn.disabled = d.full;
      btn.textContent = d.full ? "Registration full" : "Register now";
    }
    if (d.full && !saved) showFull();
  }

  /* Notices */
  function notice(kind, title, body, actions) {
    var box = $("#formStatus");
    box.textContent = "";
    var n = document.createElement("div");
    n.className = "notice " + kind;
    var t = document.createElement("strong"); t.textContent = title;
    var p = document.createElement("p"); p.textContent = body;
    n.appendChild(t); n.appendChild(p);
    var acts = (actions || []).filter(function (a) { return !isPlaceholder(LINKS[a.link]); });
    if (acts.length) {
      var row = document.createElement("div"); row.className = "acts";
      acts.forEach(function (a) {
        var el = document.createElement("a");
        el.className = "btn btn-sm " + (a.ghost ? "btn-ghost" : "btn-primary");
        el.textContent = a.label;
        el.href = LINKS[a.link];
        el.target = "_blank"; el.rel = "noopener";
        row.appendChild(el);
      });
      n.appendChild(row);
    }
    box.appendChild(n);
  }
  function showFull() {
    notice("warn", "All " + CAP + " seats are taken", "Join the community chat to hear when the next batch opens.", [{ label: "Join the community", link: "community", ghost: true }]);
  }

  /* Validation */
  var FREE_MAIL = /@(gmail|googlemail|yahoo|ymail|outlook|hotmail|live|icloud|proton|protonmail)\./i;
  var rules = {
    name: function (v) { return v.trim().length >= 2 ? "" : "Enter your full name."; },
    email: function (v) {
      v = v.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid college email, like name@college.edu.";
      if (FREE_MAIL.test(v)) return "Use your college email address, not a personal one.";
      return "";
    },
    college: function (v) { return v.trim().length >= 3 ? "" : "Enter your college name."; },
    year: function (v) { return v ? "" : "Choose your year of study."; },
    branch: function (v) { return v.trim().length >= 2 ? "" : "Enter your branch or department."; }
  };
  var form = $("#regForm");
  function fieldEl(name) { return $("#f-" + name); }
  function checkField(name) {
    var el = fieldEl(name), msg = rules[name](el.value);
    $("#err-" + name).textContent = msg;
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    return msg;
  }
  function selectedInterests() { return $$('input[name="interests"]:checked', form).map(function (i) { return i.value; }); }
  function checkInterests() {
    var ok = selectedInterests().length > 0;
    $("#err-interests").textContent = ok ? "" : "Pick at least one interest.";
    return ok ? "" : "x";
  }
  Object.keys(rules).forEach(function (n) {
    fieldEl(n).addEventListener("blur", function () { checkField(n); });
    fieldEl(n).addEventListener("input", function () { if (fieldEl(n).getAttribute("aria-invalid") === "true") checkField(n); });
  });
  $$('input[name="interests"]', form).forEach(function (i) {
    i.addEventListener("change", function () { if ($("#err-interests").textContent) checkInterests(); });
  });
  function validateAll() {
    var firstBad = null;
    Object.keys(rules).forEach(function (n) { if (checkField(n) && !firstBad) firstBad = fieldEl(n); });
    if (checkInterests() && !firstBad) firstBad = $('input[name="interests"]', form);
    return firstBad;
  }

  /* Backend (Google Apps Script web app) */
  function apiUrl(query) { return API + (API.indexOf("?") > -1 ? "&" : "?") + query; }

  function loadCount() {
    if (!API) { useFallback(); return; }
    fetch(apiUrl("action=count&t=" + Date.now()), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && typeof j.count === "number") { state.count = j.count; state.source = "live"; render(); }
        else if (state.source !== "live") useFallback();
      })
      .catch(function () { if (state.source !== "live") useFallback(); });
  }
  function useFallback() {
    if (typeof C.manualRegistered === "number") { state.count = C.manualRegistered; state.source = "manual"; }
    else { state.count = null; state.source = "none"; }
    render();
  }

  function register(data) {
    if (!API) return Promise.resolve({ status: "unsaved" });
    return fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .catch(function () { return { status: "error" }; });
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var bad = validateAll();
    if (bad) { bad.focus(); notice("error", "Check the highlighted fields", "Fix the messages shown under each field, then register again.", []); return; }
    if (derived().full) { render(); return; }
    var btn = $("#submitBtn");
    btn.disabled = true; btn.textContent = "Saving…";
    var data = {
      name: fieldEl("name").value.trim(), email: fieldEl("email").value.trim(), college: fieldEl("college").value.trim(),
      year: fieldEl("year").value, branch: fieldEl("branch").value.trim(), interests: selectedInterests(),
      website: $("#f-website") ? $("#f-website").value : ""
    };
    register(data).then(function (res) {
      var status = res && res.status;
      if (typeof (res && res.count) === "number") { state.count = res.count; state.source = "live"; }
      if (status === "saved") {
        saved = true; render(); btn.disabled = true; btn.textContent = "Registered";
        notice("success", "You are registered", "Your details are saved with the organizers. Join the community chat for onboarding updates.", [{ label: "Join the community", link: "community" }]);
      } else if (status === "duplicate") {
        saved = true; render(); btn.disabled = true; btn.textContent = "Already registered";
        notice("success", "You have already registered", "This email already holds a seat. Join the community chat for updates.", [{ label: "Join the community", link: "community" }]);
      } else if (status === "full") {
        state.count = CAP; state.source = "live"; render();
      } else if (status === "unsaved") {
        btn.disabled = false; btn.textContent = "Register now";
        notice("warn", "One more step to reserve your seat", "Your details look good. Finish on the official registration form to hold your seat.", [{ label: "Open registration form", link: "form" }, { label: "Join the community", link: "community", ghost: true }]);
      } else {
        btn.disabled = false; btn.textContent = "Register now";
        notice("error", "Your registration was not saved", "Something went wrong while saving. Try again in a moment, or use the official registration form.", [{ label: "Open registration form", link: "form" }]);
      }
    });
  });

  /* Copy contact email */
  var copyBtn = $("#copyMail");
  if (copyBtn) copyBtn.addEventListener("click", function () {
    var b = this, el = $("#contactMail");
    function select() { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    try { navigator.clipboard.writeText(el.textContent).catch(select); } catch (e) { select(); }
    b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1600);
  });

  render();
  loadCount();
  if (API) setInterval(function () { if (!document.hidden) loadCount(); }, 30000);
})();
