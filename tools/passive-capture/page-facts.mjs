// Runs inside the page (serialised by Playwright): must not reference anything outside its own body.
// Read-only: no clicks, typing, navigation or scrolling. Returns layout, style, name and active-context facts for one state.
export function extractPageFacts(limits) {
  const maxElements = limits?.maxElements ?? 3000;
  const vw = innerWidth; const vh = innerHeight;
  const style = (el) => getComputedStyle(el);
  const isVisible = (el) => {
    const r = el.getBoundingClientRect(); const s = style(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0;
  };
  const selector = (el) => {
    const parts = []; let e = el;
    while (e && e.nodeType === 1 && parts.length < 6) {
      if (e.id) { parts.unshift(`#${CSS.escape(e.id)}`); break; }
      let p = e.tagName.toLowerCase();
      if (e.classList.length) p += '.' + [...e.classList].slice(0, 2).map((c) => CSS.escape(c)).join('.');
      const parent = e.parentElement;
      if (parent) { const same = [...parent.children].filter((c) => c.tagName === e.tagName); if (same.length > 1) p += `:nth-of-type(${same.indexOf(e) + 1})`; }
      parts.unshift(p); e = e.parentElement;
    }
    return parts.join(' > ');
  };
  const STATE_CLASS = /^(ng-|active|disabled|selected|hover|focus|show|open|is-|has-)/;
  const signature = (el) => (el ? `${el.tagName.toLowerCase()}.${[...el.classList].filter((c) => !STATE_CLASS.test(c)).sort().join('.')}` : '');
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const looks = (el) => {
    const s = style(el);
    return { textAlign: s.textAlign, fontFamily: s.fontFamily, fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color,
      paddingLeft: s.paddingLeft, paddingRight: s.paddingRight };
  };
  // Only rgb()/rgba() and the keyword transparent are understood. Any other computed colour (oklch, lab, color())
  // is unsupported: the walk stops there instead of treating it as transparent.
  const alphaOf = (c) => {
    const t = (c || '').trim(); if (t === 'transparent') return 0;
    const m = /^rgba?\(([^)]+)\)$/.exec(t); if (!m) return null;
    const v = m[1].split(/[ ,/]+/).filter(Boolean); const a = v.length > 3 ? Number(v[3]) : 1;
    return Number.isNaN(a) ? null : a;
  };
  const background = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const s = style(e);
      if (s.backgroundImage && s.backgroundImage !== 'none') return { kind: 'image' };
      const a = alphaOf(s.backgroundColor);
      if (a === null) return { kind: 'unsupported', color: s.backgroundColor };
      if (a >= 0.99) return { kind: 'solid', color: s.backgroundColor };
      if (a > 0) return { kind: 'translucent', color: s.backgroundColor };
    }
    return { kind: 'solid', color: 'rgb(255, 255, 255)', assumed: true };
  };
  const isDisabled = (el) => Boolean(el.closest('[disabled],[aria-disabled="true"],fieldset[disabled]'));

  // Active context: only demonstrably inactive content is excluded from own detectors — inside an [inert] subtree, or
  // outside the single open native modal <dialog>. This is a selection policy, not a claim about visual occlusion. An
  // aria-modal declaration is recorded but not trusted; fixed layers and non-modal dialogs exclude nothing. A modal
  // escapes the inertness of its ancestors (explicit [inert] on or inside it still applies). With several open modals
  // the blocking one cannot be derived from DOM order, so no modal-based exclusion is made and the case is reported.
  const openModals = [...document.querySelectorAll('dialog[open]')].filter((d) => { try { return d.matches(':modal'); } catch { return false; } });
  const nativeModal = openModals.length === 1 ? openModals[0] : null;
  const inactive = (el) => {
    if (nativeModal !== null && !nativeModal.contains(el)) return true;
    const inertRoot = el.closest('[inert]'); if (inertRoot === null) return false;
    // The escape comes from the nearest open MODAL ancestor, not the nearest dialog (a non-modal dialog may be nested).
    const host = openModals.filter((d) => d.contains(el)).reduce((inner, d) => (inner === null || inner.contains(d) ? d : inner), null);
    return !(host !== null && !host.contains(inertRoot));
  };

  const labelOf = (el) => {
    if (el.getAttribute('aria-label')?.trim()) return { text: clean(el.getAttribute('aria-label')), source: 'aria-label' };
    const by = el.getAttribute('aria-labelledby');
    if (by) { const t = clean(by.split(/\s+/).map((id) => document.getElementById(id)?.textContent).join(' ')); if (t) return { text: t, source: 'aria-labelledby' }; }
    if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l && clean(l.textContent)) return { text: clean(l.textContent), source: 'label-for' }; }
    const wrap = el.closest('label'); if (wrap && clean(wrap.textContent)) return { text: clean(wrap.textContent), source: 'label-wrap' };
    if (el.getAttribute('title')?.trim()) return { text: clean(el.getAttribute('title')), source: 'title' };
    return { text: '', source: 'none' };
  };
  const controlName = (el) => {
    const l = labelOf(el); if (l.source !== 'none' && l.source !== 'label-wrap') return l;
    const fallback = l.source === 'label-wrap' ? l : { text: '', source: 'none' };
    if (el.tagName === 'INPUT') {
      if (el.type === 'image') { const alt = clean(el.getAttribute('alt')); return alt ? { text: alt, source: 'alt' } : fallback; }
      if (el.value?.trim()) return { text: clean(el.value), source: 'value' };
      // The native default name applies only when the value attribute is absent; an explicit blank value is nameless.
      if ((el.type === 'submit' || el.type === 'reset') && !el.hasAttribute('value')) return { text: el.type === 'submit' ? 'Submit' : 'Reset', source: 'native-default' };
      return fallback;
    }
    const own = clean(el.innerText || ''); if (own) return { text: own.slice(0, 80), source: 'text' };
    const img = el.querySelector('img[alt]'); if (img && clean(img.getAttribute('alt'))) return { text: clean(img.getAttribute('alt')), source: 'img-alt' };
    return fallback;
  };
  const forms = [...document.forms];
  const formIndex = (el) => { const f = el.closest('form'); return f ? forms.indexOf(f) : -1; };

  const elements = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  for (let el = walker.currentNode; el && elements.length < maxElements; el = walker.nextNode()) {
    if (!(el instanceof HTMLElement) || !isVisible(el)) continue;
    const own = clean([...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' '));
    if (!own) continue;
    elements.push({ sel: selector(el), tag: el.tagName.toLowerCase(), sig: signature(el), parentSig: signature(el.parentElement),
      text: own.slice(0, 160), rect: box(el), style: looks(el), bg: background(el), disabled: isDisabled(el), inactive: inactive(el) });
  }
  const TEXT_INPUT = /^(text|email|password|search|tel|url|number|date|datetime-local|month|time|week)$/;
  const NOT_FIELD = /^(hidden|submit|button|reset|image)$/;
  const fields = [...document.querySelectorAll('input,select,textarea')].filter((el) => !(el.tagName === 'INPUT' && NOT_FIELD.test(el.type)) && isVisible(el)).map((el) => ({
    sel: selector(el), tag: el.tagName.toLowerCase(), type: el.type, textLike: el.tagName !== 'INPUT' || TEXT_INPUT.test(el.type),
    id: el.id || null, name: el.getAttribute('name'), placeholder: el.getAttribute('placeholder'), label: labelOf(el), form: formIndex(el),
    rect: box(el), style: looks(el), disabled: isDisabled(el), inactive: inactive(el),
    options: el.tagName === 'SELECT' ? [...el.options].slice(0, 60).map((o) => ({ text: clean(o.text), fontSize: style(o).fontSize })) : undefined,
  }));
  const controls = [...document.querySelectorAll('button,[role=button],input[type=submit],input[type=button],input[type=reset],input[type=image],a[href]')].filter(isVisible).slice(0, maxElements).map((el) => ({
    sel: selector(el), tag: el.tagName.toLowerCase(), type: el.getAttribute('type'), sig: signature(el), name: controlName(el), form: formIndex(el),
    rect: box(el), style: looks(el), disabled: isDisabled(el), inactive: inactive(el),
  }));
  return {
    url: location.href, title: document.title, viewport: { w: vw, h: vh }, scroll: { x: scrollX, y: scrollY },
    activeContext: { nativeModal: nativeModal ? selector(nativeModal) : null, openModalCount: openModals.length, ambiguousModal: openModals.length > 1,
      inertRoots: [...document.querySelectorAll('[inert]')].slice(0, 20).map(selector),
      ariaModalDeclared: [...document.querySelectorAll('[aria-modal="true"]')].filter(isVisible).slice(0, 20).map(selector) },
    formCount: forms.length,
    truncated: elements.length >= maxElements, elements, fields, controls,
  };
}
