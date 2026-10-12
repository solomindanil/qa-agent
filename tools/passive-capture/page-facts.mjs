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
      paddingLeft: s.paddingLeft, paddingRight: s.paddingRight, display: s.display };
  };
  // Only rgb()/rgba() and the keyword transparent are understood. Any other computed colour (oklch, lab, color())
  // is unsupported: the walk stops there instead of treating it as transparent.
  const alphaOf = (c) => {
    const t = (c || '').trim(); if (t === 'transparent') return 0;
    const m = /^rgba?\(([^)]+)\)$/.exec(t); if (!m) return null;
    const v = m[1].split(/[ ,/]+/).filter(Boolean); const a = v.length > 3 ? Number(v[3]) : 1;
    return Number.isNaN(a) ? null : a;
  };
  // Effective opacity: the product of the opacity of an element and all its ancestors (opacity does not inherit, it composites).
  const opacityMemo = new Map();
  const opacityUp = (el) => {
    if (!el) return 1; if (opacityMemo.has(el)) return opacityMemo.get(el);
    const o = Number(style(el).opacity) * opacityUp(el.parentElement); opacityMemo.set(el, o); return o;
  };
  const round3 = (n) => Math.round(n * 1000) / 1000;
  const shown = (s) => s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0;
  const pseudoImage = (el, positioned) => ['::before', '::after'].some((p) => {
    const s = getComputedStyle(el, p);
    return s.content !== 'none' && s.backgroundImage !== 'none' && shown(s) && (!positioned || s.position === 'absolute' || s.position === 'fixed');
  });
  // Layers that paint an image under or over text without being its ancestor: replaced elements, elements with a background image or
  // gradient, and elements whose ::before or ::after paints one. Outermost svg only; hidden ones are left out, but not one made transparent
  // only by an ancestor's opacity: a reveal wrapper shows it together with the text it holds.
  const PAINTS = new Set(['img', 'video', 'canvas', 'picture', 'svg', 'iframe', 'object', 'embed']);
  const layers = [...document.body.querySelectorAll('*')].filter((el) => {
    const tag = el.tagName.toLowerCase();
    if (!(el instanceof HTMLElement) && !(tag === 'svg' && !el.parentElement?.closest('svg'))) return false;
    if (!PAINTS.has(tag) && style(el).backgroundImage === 'none' && !pseudoImage(el, false)) return false;
    return shown(style(el)) && el.getClientRects().length > 0;
  }).slice(0, maxElements).map((el) => ({ el, r: el.getBoundingClientRect() }));
  const overlap = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  // A layer inside the element that holds the background colour (or anywhere, when the white page background is assumed) and under
  // at least half of the text box, neither the text's ancestor nor its descendant, so the colour found may not be what is behind it.
  const underLayer = (el, host) => {
    const r = el.getBoundingClientRect(); const half = (r.width * r.height) / 2;
    return half > 0 && layers.some((l) => !el.contains(l.el) && !l.el.contains(el) && (host === null || host.contains(l.el)) && overlap(l.r, r) >= half);
  };
  const solid = (el, host, color, assumed) => {
    if (underLayer(el, host)) return { kind: 'layer' };
    const o = host ? opacityUp(host) : 1;
    return { kind: 'solid', color, ...(assumed ? { assumed: true } : {}), ...(o < 1 ? { opacity: round3(o) } : {}) };
  };
  // An ancestor's positioned ::before/::after with a background image (a gradient overlay) paints above that ancestor's colour.
  const background = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const s = style(e);
      if (s.backgroundImage && s.backgroundImage !== 'none') return { kind: 'image' };
      if (pseudoImage(e, true)) return { kind: 'layer' };
      const a = alphaOf(s.backgroundColor);
      if (a === null) return { kind: 'unsupported', color: s.backgroundColor };
      if (a >= 0.99) return solid(el, e, s.backgroundColor, false);
      if (a > 0) return { kind: 'translucent', color: s.backgroundColor };
    }
    return solid(el, null, 'rgb(255, 255, 255)', true);
  };
  // Context of a text of at most two characters with no letter or digit (a possible separator): whether letter or digit text sits
  // beside it in its parent or inside it, and whether it is the whole visible text of the nearest control or table cell around it.
  const ALNUM = /[\p{L}\p{N}]/u;
  const WHOLE = 'button,a[href],summary,label,td,th,dd,output,[role=button],[role=link],[role=tab],[role=menuitem],[role=cell],[role=gridcell],[role=columnheader],[role=rowheader]';
  const glyphOf = (el, own) => {
    if (ALNUM.test(own) || [...own].length > 2) return undefined;
    const peers = [...el.childNodes, ...(el.parentElement?.childNodes ?? [])].some((n) => n !== el && ALNUM.test(n.textContent ?? ''));
    const context = el.closest(WHOLE);
    return { peers, whole: context !== null && !ALNUM.test(context.textContent ?? '') };
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

  const ariaName = (el) => {
    if (el.getAttribute('aria-label')?.trim()) return { text: clean(el.getAttribute('aria-label')), source: 'aria-label' };
    const by = el.getAttribute('aria-labelledby');
    if (by) { const t = clean(by.split(/\s+/).map((id) => document.getElementById(id)?.textContent).join(' ')); if (t) return { text: t, source: 'aria-labelledby' }; }
    return null;
  };
  const labelOf = (el) => {
    const aria = ariaName(el); if (aria) return aria;
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
    const opacity = opacityUp(el); const glyph = glyphOf(el, own);
    elements.push({ sel: selector(el), tag: el.tagName.toLowerCase(), sig: signature(el), parentSig: signature(el.parentElement),
      text: own.slice(0, 160), rect: box(el), style: looks(el), bg: background(el), disabled: isDisabled(el), inactive: inactive(el),
      ...(opacity < 1 ? { opacity: round3(opacity) } : {}), ...(glyph ? { glyph } : {}) });
  }
  const TEXT_INPUT = /^(text|email|password|search|tel|url|number|date|datetime-local|month|time|week)$/;
  const NOT_FIELD = /^(hidden|submit|button|reset|image)$/;
  // Cross-page field width is compared relative to the field's form, or to its parent outside a form.
  const containerWidth = (el) => Math.round((el.closest('form') ?? el.parentElement)?.getBoundingClientRect().width ?? 0);
  // Declared constraints of a field, read from attributes and their reflections only: never its value, default value or checked
  // state. Undeclared ones are undefined and dropped when the facts are written; min, max, step and pattern stay as written (the
  // worklist decides what the browser applies), capped in length.
  const attr = (el, name, max) => { const v = el.getAttribute(name); return v === null ? undefined : v.slice(0, max); };
  const constraintsOf = (el) => ({ required: el.required || undefined, readonly: el.readOnly || undefined, multiple: el.multiple || undefined,
    minlength: el.minLength >= 0 ? el.minLength : undefined, maxlength: el.maxLength >= 0 ? el.maxLength : undefined, min: attr(el, 'min', 40), max: attr(el, 'max', 40),
    step: attr(el, 'step', 40), pattern: attr(el, 'pattern', 200), accept: attr(el, 'accept', 200), autocomplete: attr(el, 'autocomplete', 100), inputmode: attr(el, 'inputmode', 40) });
  const fields = [...document.querySelectorAll('input,select,textarea')].filter((el) => !(el.tagName === 'INPUT' && NOT_FIELD.test(el.type)) && isVisible(el)).map((el) => ({
    sel: selector(el), tag: el.tagName.toLowerCase(), type: el.type, textLike: el.tagName !== 'INPUT' || TEXT_INPUT.test(el.type),
    sig: signature(el), parentSig: signature(el.parentElement),
    id: el.id || null, name: el.getAttribute('name'), placeholder: el.getAttribute('placeholder'), label: labelOf(el), form: formIndex(el),
    rect: box(el), containerW: containerWidth(el), style: looks(el), disabled: isDisabled(el), inactive: inactive(el),
    options: el.tagName === 'SELECT' ? [...el.options].slice(0, 60).map((o) => ({ text: clean(o.text), fontSize: style(o).fontSize })) : undefined,
    constraints: constraintsOf(el),
  }));
  // A file input often sits hidden behind a styled button or label; it is not a field above, so it is only counted.
  const fileInputsNotShown = [...document.querySelectorAll('input[type=file]')].filter((el) => !isVisible(el)).length;
  const controls = [...document.querySelectorAll('button,[role=button],input[type=submit],input[type=button],input[type=reset],input[type=image],a[href]')].filter(isVisible).slice(0, maxElements).map((el) => ({
    sel: selector(el), tag: el.tagName.toLowerCase(), type: el.getAttribute('type'), sig: signature(el), name: controlName(el), form: formIndex(el),
    rect: box(el), style: looks(el), disabled: isDisabled(el), inactive: inactive(el),
  }));

  // Structure facts for focus, choice grouping and images. Only attributes, roles and boxes are read: no alt text, value
  // or key press. "Rendered" keeps transparent or tiny elements, which focus and assistive technology still reach.
  const rendered = (el) => { const s = style(el); return s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length > 0; };
  const tabindexOf = (el) => { const n = Number.parseInt(el.getAttribute('tabindex') ?? '', 10); return Number.isNaN(n) ? null : n; };
  const FOCUSABLE = 'a[href],area[href],button,input,select,textarea,summary,iframe,[tabindex],[contenteditable]:not([contenteditable="false"])';
  // A focusable in a fixed or sticky layer (itself or its nearest such ancestor, the root) is pinned: its box at scroll 0 has no
  // place among document-flow boxes, but it has one among the other focusables of the same layer (a native modal is fixed).
  const pinnedOf = (el) => { for (let e = el; e; e = e.parentElement) { const p = style(e).position; if (p === 'fixed' || p === 'sticky') return { position: p, root: selector(e) }; } return null; };
  const focusables = [...document.querySelectorAll(FOCUSABLE)].filter(rendered).slice(0, maxElements).map((el) => { const pinned = pinnedOf(el); return {
    sel: selector(el), tag: el.tagName.toLowerCase(), tabindex: tabindexOf(el), rect: box(el), dir: style(el).direction, disabled: isDisabled(el), inactive: inactive(el),
    ...(pinned ? { pinned } : {}) }; });
  const groupNameSource = (c) => {
    const aria = ariaName(c); if (aria) return aria.source;
    const legend = c.tagName === 'FIELDSET' ? [...c.children].find((x) => x.tagName === 'LEGEND') : null;
    if (legend && clean(legend.textContent)) return 'legend';
    return c.getAttribute('title')?.trim() ? 'title' : 'none';
  };
  // The nearest named fieldset or role=group/radiogroup that holds every member; else the nearest unnamed one.
  const GROUPING = 'fieldset,[role=group],[role=radiogroup]';
  const grouping = (members) => {
    let unnamed = null;
    for (let c = members[0].parentElement?.closest(GROUPING); c; c = c.parentElement?.closest(GROUPING)) {
      if (!members.every((m) => c.contains(m))) continue;
      const kind = c.tagName === 'FIELDSET' ? 'fieldset' : c.getAttribute('role'); const source = groupNameSource(c);
      if (source !== 'none') return { container: kind, nameSource: source };
      unnamed ??= kind;
    }
    return { container: unnamed, nameSource: 'none' };
  };
  const formOf = (el) => (el.form ? forms.indexOf(el.form) : -1);
  const choiceSets = new Map();
  for (const el of document.querySelectorAll('input[type=radio],input[type=checkbox]')) {
    const name = el.getAttribute('name'); if (!name || !rendered(el) || el.closest('[aria-hidden="true"]')) continue;
    const key = `${el.type}|${formOf(el)}|${name}`; if (!choiceSets.has(key)) choiceSets.set(key, []); choiceSets.get(key).push(el);
  }
  const choiceGroups = [...choiceSets.values()].filter((m) => m.length > 1).slice(0, maxElements).map((m) => ({
    type: m[0].type, name: m[0].getAttribute('name').slice(0, 80), form: formOf(m[0]), count: m.length, sel: selector(m[0]), ...grouping(m),
    disabled: m.every(isDisabled), inactive: m.every(inactive) }));
  const altState = (el) => (!el.hasAttribute('alt') ? 'absent' : el.getAttribute('alt').trim() ? 'text' : 'empty');
  // Load state without storing the source. 'failed' only for a completed image with a source and no decoded size; an image
  // not complete at capture (lazy or in flight), one without a source and an svg source (may lack an intrinsic size) stay unassessed.
  const loadState = (el) => {
    if (el.naturalWidth > 0) return 'loaded';
    if (!el.complete) return 'pending';
    if (!el.currentSrc) return 'no-src';
    return /^data:image\/svg\+xml|\.svg(?:[?#]|$)/i.test(el.currentSrc) ? 'svg' : 'failed';
  };
  const images = [...document.querySelectorAll('img')].filter(rendered).slice(0, maxElements).map((el) => ({
    sel: selector(el), alt: altState(el), role: (el.getAttribute('role') ?? '').trim().toLowerCase().split(/\s+/)[0] || null,
    ariaHidden: el.closest('[aria-hidden="true"]') !== null, nameSource: ariaName(el)?.source ?? (el.getAttribute('title')?.trim() ? 'title' : 'none'), load: loadState(el),
    inactive: inactive(el) }));
  return {
    url: location.href, title: document.title, viewport: { w: vw, h: vh }, scroll: { x: scrollX, y: scrollY },
    activeContext: { nativeModal: nativeModal ? selector(nativeModal) : null, openModalCount: openModals.length, ambiguousModal: openModals.length > 1,
      inertRoots: [...document.querySelectorAll('[inert]')].slice(0, 20).map(selector),
      ariaModalDeclared: [...document.querySelectorAll('[aria-modal="true"]')].filter(isVisible).slice(0, 20).map(selector) },
    formCount: forms.length,
    truncated: elements.length >= maxElements, elements, fields, fileInputsNotShown, controls, focusables, choiceGroups, images,
  };
}
