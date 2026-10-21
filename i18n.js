/* ------------------------------------------------------------------
   i18n.js - the language of the application.

   TVPaint ships its own localisation files
   (Resources/data/*.tvpaint.loc).  They are the source of truth for
   the wording of the interface, and the "Language" preference of the
   Preferences panel really switches the application to another one:
   the english file gives the id of every string, the file of the
   chosen language gives its translation.
   ------------------------------------------------------------------ */
(function () {
  const doc = document;
  const FILES = {
    English: "english", French: "french", Japanese: "japanese", Chinese: "chinese"
  };
  let EN = null;        // id  -> english text
  let TEXT2ID = null;   // english text -> id
  let TGT = null;       // id  -> text of the chosen language
  let LANG = "English";

  // the format of the file:  $000021129 "Language"
  function parseLoc(txt) {
    const out = {};
    const re = /\$([0-9]{6,10})\s+"((?:\\.|[^"\\])*)"/g;
    let m;
    while ((m = re.exec(txt))) {
      out[m[1]] = m[2]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
    }
    return out;
  }
  async function fetchLoc(file) {
    const r = await fetch("Resources/data/" + file + ".tvpaint.loc");
    if (!r.ok) throw new Error("no localisation file");
    return parseLoc(await r.text());
  }

  /* loads the english file (the reference) and the chosen language */
  async function load(lang) {
    try {
      if (!EN) {
        EN = await fetchLoc("english");
        TEXT2ID = {};
        for (const id in EN) if (!(EN[id] in TEXT2ID)) TEXT2ID[EN[id]] = id;
      }
      const f = FILES[lang];
      TGT = null;
      if (f && f !== "english") {
        try { TGT = await fetchLoc(f); } catch (e) { TGT = null; }
      }
      LANG = lang;
      return true;
    } catch (e) { return false; }
  }

  /* the translation of a string of the interface */
  function T(s) {
    if (s == null || s === "") return s;
    if (!TGT || !TEXT2ID) return s;
    const id = TEXT2ID[String(s)];
    if (!id) return s;
    return TGT[id] || s;
  }

  window.tvpaintT = T;
  window.tvpaintLoadLanguage = load;
  window.tvpaintLanguage = () => LANG;
  window.tvpaintLanguages = () => Object.keys(FILES);
})();
