/* Generates reports/prefs-strings.md from reports/loc-entries.json */
const fs = require('fs');
const path = require('path');
const E = require('../reports/loc-entries.json');
const MAP = new Map(E.map(x => [x.id, x]));

function get(id) { return MAP.get(id); }
function txt(id) { const x = MAP.get(id); return x ? x.text.replace(/\r/g, '\\r').replace(/\n/g, '\\n') : '<<MISSING ' + id + '>>'; }
function raw(id) { const x = MAP.get(id); return x ? x.text : ''; }

/* ---------- classification ---------- */
const OVERRIDE = require('./roles.js');
function kind(id) {
  const t = raw(id);
  if (!t) return { tag: 'MISSING' };
  if (t.includes('§')) {
    const before = t.split('§')[0];
    return { tag: 'HELP', note: 'contains § — tooltip title "' + before.replace(/\n/g, '\\n') + '" + body' };
  }
  const ov = OVERRIDE[id];
  if (ov === 'CAPTION') return { tag: 'CAPTION', note: 'short control caption' };
  if (ov === 'TOOLTIP') return { tag: 'TOOLTIP', note: 'help text for the preceding caption' };
  if (ov === 'LABEL') return { tag: 'LABEL', note: 'label / list item / message' };
  const words = t.split(/\s+/).length;
  const isSentence = /[.!?:]$/.test(t.trim()) && words >= 6 && t.length > 40;
  if (isSentence) return { tag: 'TOOLTIP', note: 'sentence-style help text (no §)' };
  if (words <= 4 && t.length <= 40) return { tag: 'CAPTION', note: 'short control caption' };
  return { tag: 'LABEL', note: 'label / list item' };
}

function listBlock(title, page, idsIn, extra) {
  const ids = idsIn.slice().sort();
  let out = '';
  out += '\n### ' + title + '\n\n';
  out += '- **Page / tab:** ' + page + '\n';
  out += '- **ID range:** ' + ids[0] + ' … ' + ids[ids.length - 1] + '  (' + ids.length + ' entries, listed in ascending ID order)\n';
  if (extra) out += extra + '\n';
  out += '\n| id | text | role |\n|---|---|---|\n';
  for (const id of ids) {
    const k = kind(id);
    out += '| `' + id + '` | ' + txt(id).replace(/\|/g, '\\|') + ' | **' + k.tag + '** — ' + k.note + ' |\n';
  }
  return out;
}

let R = '';
R += '# TVPaint Animation 12 Pro — Preferences & Shortcuts string inventory\n\n';
R += 'Source: `C:\\Program Files\\TVPaint Developpement\\TVPaint Animation 12 Pro Demo\\Resources\\data\\english.tvpaint.loc`\n\n';
R += 'Parsed with `tools/parse-loc.js` → `reports/loc-entries.json` (**9196** entries, 9196 unique IDs, UTF-8, CRLF line endings, 386 `#---` separator lines that chop the file into 373 visual blocks).\n\n';

/* ---------------- section 1 ---------------- */
R += '## 1. How the file is organised\n\n';
R += '### 1.1 Physical format\n\n';
R += '```\n$000021129 "Language"\n$000021140 "SubPixel Coordinates§\\n\\nIf checked, coordinates are got in a\\nresolution bigger than pixel resolution.\\n…"\n```\n\n';
R += '* One entry per line: `$` + **10-digit zero-padded ID** + space + `"` + text + `"`.\n';
R += '* The text is **raw UTF-8**; `§` (U+00A7) is TVPaint\'s own *tooltip separator*, and `\\n` is a **literal two-character escape** inside the string (not a real newline). **2 715** literal `\\n` escapes occur across the file. Exactly **one** entry (`011084005`) contains a stray **CR (0x0D) byte** in the middle of its text — a formatting bug in the shipped file; it is shown as `\\r` below.\n';
R += '* IDs are NOT globally sorted — the file is a concatenation of ~373 `#---`-separated blocks, and inside a block the IDs are usually ascending but the *blocks* themselves are scattered through the file. The **ID value itself** is the reliable key: the same text appears under several IDs when it is used in several panels.\n';
R += '* Other ID prefixes in the file are unrelated panels (FX effects `000040xxx`/`000041xxx`/`000044xxx`, export dialogs `000030xxx`, action/menu `000020xxx`, Timesheet `012103xxx`, …). Only the ranges listed in §2/§3 belong to Preferences/Shortcuts.\n\n';
R += '### 1.2 ID-space map for Preferences + Shortcuts\n\n';
R += '| ID range | What it is |\n|---|---|\n';
R += '| `000021100` | **Preferences dialog title** (`Preferences`) |\n';
R += '| `000021110`–`000021117` | Legacy/alternate preference **category names**: `Interface`, `General`, `Display`, `Memory&Cache`, `Sound`, `OK`, `Cancel`, `Startup` |\n';
R += '| `000021120`–`000021122` | Dialog tooltips: category list / OK / Cancel |\n';
R += '| `000021129`–`000021159` | **General page** content (Language, Keyboard Shortcuts, Temp/Papers/Plugins/Mixers/Brush directories, Tablet/SubPixel) |\n';
R += '| `000021160`–`000021199` | **Display page** content (Tool Display, gamma, LUT, DirectDraw, RGB) |\n';
R += '| `000021200`–`000021298` | **Interface page** content (color scheme, cursor, file requester, project window, thumbnails, highlight) + **Undo / Memory&Cache** block |\n';
R += '| `000021299`–`000021395` | Interface/Theme option labels + their `§` tooltips (`Border`, `Mirror`, `Highlight`, cursor shapes) |\n';
R += '| `000021400`–`000021599` | Colour-picker panel (NOT Preferences) |\n';
R += '| `000021700`–`000021930` | Display-settings / Gradient / Grid panels (NOT Preferences) |\n';
R += '| `000121130`–`000121190` | **Drawing / Save / Timeline / Interface drawer** option groups (Animated Strokes, Barbecue, Save Alarm, Resampling, Drawers) |\n';
R += '| `000121240`–`000121350` | Interface (`Use TVPaint Menu`), **Sound page** (Scrub, Sampling Rate), **Startup page** (Starting Project Settings) |\n';
R += '| `000019900`–`000019999` | **Shortcuts dialog**: title, buttons, tooltips, key-name lists, tablet buttons |\n';
R += '| `010019919`, `011019920`–`011019921` | Shortcuts dialog: `Export shortcuts`, `Predefined keymaps`, `Reset to default` |\n';
R += '| `010083000`–`010083011` | **Default config / colour-scheme** save dialog |\n';
R += '| `011021118`–`011021129` | **Preferences tree node labels** (Save, Network, Drawing, General, Timeline, Clip, Thumbnail, Default config, General, Theme, Panels) |\n';
R += '| `011021140`–`011021213` | **Save / Drawing / Timeline option groups** (Save Alarm Options, Multi-Backup, Wintab, Undo layer opacity, Scroll lock panels, XSheet, drag&drop pop-up) |\n';
R += '| `011021235`, `011021275` | File-requester owner, tooltip-display hint |\n';
R += '| `011021400`–`011021446` | **Network page** (Proxy: Scheme/Host/Port/Authentication + proxy/auth method lists) |\n';
R += '| `011060150`–`011060189` | **Theme page** (Notes/Help/Notification colours, Resolution scaling, Icon set, Locked windows visibility, colour-space, `Shortcut Panel:` theme colours) |\n';
R += '| `011060280`–`011060286` | Shortcuts panel legend (`Colors:`, `Search Results`, `Shortcut Function Bound to Key`) |\n';
R += '| `012021202`–`012021205` | **Panels page** (Multi-screen panels, Panels in the taskbar) |\n';
R += '| `012043814`–`012043820`, `012102150`–`012102156` | Import / Export custom settings (buttons live on the General page) |\n';
R += '| `012060000`–`012060016` | Theme/Panels page items (Camera profile curves, `Base panels`, `Reset default positions`) |\n';
R += '| `012104009`–`012104010` | Transformation Tools Preview Quality (Drawing page) |\n';
R += '| `012104312`–`012104314` | **Paths page** (`Paths`, `Plugin Folders`) |\n';
R += '| `105121320`–`105121327` | **Startup configuration** (General page) |\n';
R += '| `110121326`–`110121335` | **Default config page** (default layer, pre/post behaviour, uncompacted timeline) |\n';
R += '| `110121326`–`110121327`, `117101726` | Default-config items |\n';
R += '| `009521133`–`009521140`, `010521141`–`010521144` | Multi-Backup + Wintab/Stylus options |\n';
R += '| `011074027`–`011074063` | Flips-panel *shortcut* fields (NOT the Shortcuts dialog) |\n';
R += '| `000020404`, `000020626` | Menu-function names that open these dialogs |\n\n';

R += '### 1.3 How the pages map to the tree\n\n';
R += 'The live 12.1.0 dialog (captured in `shots/dlg-preferences.png`, tree cropped in `shots/tree-crop3.png`) shows this tree:\n\n';
R += '```\nGeneral              (selected → page title "General")\nSave\nDrawing\nTimeline  ⊙\n  General\n  Clip\n  Thumbnail\n  Default config\nInterface ⊙\n  General\n  Theme\n  Panels\nSound\nPaths\n```\n\n';
R += 'Matching the tree labels to IDs:\n\n';
R += '| Tree label | ID | note |\n|---|---|---|\n';
R += '| General (root) | `000021111` *or* `011021122` | two candidates; see §2.1 |\n';
R += '| Save | `011021118` | |\n';
R += '| Network | `011021119` | not visible in the 12.1.0 tree (likely a child of *Save*) |\n';
R += '| Drawing | `011021120` | |\n';
R += '| Timeline | `011021123` | |\n';
R += '| Timeline ▸ General | `011021122` | |\n';
R += '| Timeline ▸ Clip | `011021124` | |\n';
R += '| Timeline ▸ Thumbnail | `011021125` | |\n';
R += '| Timeline ▸ Default config | `011021126` | |\n';
R += '| Interface | `000021110` | |\n';
R += '| Interface ▸ General | `011021127` | |\n';
R += '| Interface ▸ Theme | `011021128` | |\n';
R += '| Interface ▸ Panels | `011021129` | |\n';
R += '| Sound | `000021114` | |\n';
R += '| Paths | `012104312` | |\n\n';
R += '**Full list of page names the Preferences tree contains:** `General` (root), `Save`, `Network`, `Drawing`, `Timeline` (+`General`, `Clip`, `Thumbnail`, `Default config`), `Interface` (+`General`, `Theme`, `Panels`), `Sound`, `Paths`.\n\n';

/* ---------------- section 2 ---------------- */
R += '## 2. Preferences panel — complete block inventory\n\n';
R += 'Each block lists the IDs in ascending order. **Role** column:\n\n';
R += '* `CAPTION` — short control caption (button, checkbox, combo entry, list item).\n';
R += '* `HELP` — the entry contains `§`. TVPaint convention: the text **before** `§` is the tooltip title and the text after `§` is the tooltip body. Several captions therefore exist **twice**: once as a bare caption and once as a `§` entry whose prefix repeats the caption.\n';
R += '* `TOOLTIP` — sentence-style help text with no `§` separator.\n';
R += '* `LABEL` — a value/list item that is neither a short caption nor a sentence.\n\n';

const B = [];
function blk(o) { B.push(o); }

/* 2.1 dialog chrome */
blk({
  title: '2.1 Preferences dialog chrome, category list, OK/Cancel',
  page: 'Preferences (the dialog itself)',
  ids: ['000021100', '000021110', '000021111', '000021112', '000021113', '000021114', '000021115', '000021116', '000021117', '000021120', '000021121', '000021122'],
  extra: '- Note: `000021112` `Display` and `000021113` `Memory&Cache` are **not** nodes of the 12.1.0 tree — they are the older v10/v11 Preferences category names kept in the binary for compatibility.\n- `000021120` `Choose a setting category` = tooltip of the tree/list; `000021121` = OK tooltip; `000021122` = Cancel tooltip.'
});
/* 2.2 tree labels */
blk({
  title: '2.2 Preferences tree node labels',
  page: 'Preferences tree',
  ids: ['011021118', '011021119', '011021120', '011021122', '011021123', '011021124', '011021125', '011021126', '011021127', '011021128', '011021129'],
  extra: '- `011021121` does **not** exist in the file (gap in the sequence).\n- `General` appears 3× (`011021122`, `011021127`, `000021111`) because three different tree nodes are called "General".'
});
/* 2.3 General page */
blk({
  title: '2.3 General page — language, shortcuts button, directories, memory, undo, cache, startup',
  page: 'Preferences ▸ General',
  ids: ['000021129', '000021153', '000021134', '000021135', '000021148', '000021136', '000021137', '000021149', '000021150',
    '000021141', '000021155', '000021156', '000021142', '000021157', '000021158', '000021143', '000021151', '000021152',
    '000021145', '000021146', '000021147', '000021159', '000021144',
    '000021130', '000021131', '000021132', '000021133', '000021286', '000021287', '000021289',
    '000021280', '000021281', '000021282', '000021283', '000021284', '000021285', '000021290', '000021291', '000021292', '000021293', '000021298',
    '000021295', '000021296', '000021297',
    '105121320', '105121321', '105121322', '105121324', '105121325', '105121326', '105121327',
    '012102150', '012102151', '012102152', '012102153', '012102154', '012102155', '012102156',
    '012043814', '012043815', '012043816', '012043817', '012043818', '012043819', '012043820',
    '011060173', '011060174', '011060175'],
  extra: '- This is the page shown in `shots/dlg-preferences.png` (Language / Keyboard Shortcuts / Temp Directory / Physical Memory / Undo+Undo Size / Cache usage+Cache size / Startup configuration / Open last project on startup / Export+Import Custom Settings / George Alert: tv_WriteTextFile).\n- The five directory rows (Temp / Papers / Plugins / Mixers / Brush) and their `Set` buttons live here; the `Paths` page re-uses the same IDs for the Papers/Plugins/Mixers/Brush rows.'
});
/* 2.4 Display page */
blk({
  title: '2.4 Display page — tool display, gamma/LUT, DirectDraw, brush display',
  page: 'Preferences ▸ Display',
  ids: ['000021160', '000021161', '000021162', '000021163', '000021164', '000021165', '000021166', '000021167', '000021168',
    '000021169', '000021170', '000021171', '000021172', '000021173', '000021174', '000021175', '000021176', '000021177',
    '000021178', '000021179', '000021180', '000021181', '000021182', '000021183', '000021184', '000021185', '000021186',
    '000021187', '000021188', '000021189', '000021190', '000021191', '000021192', '000021193', '000021194', '000021195',
    '000021196', '000021197', '000021198', '000021199'],
  extra: '- `000021164` `Surface displayed`, `000021166` `Display mode`, `000021169` `Display`, `000021170` `Display device` are *group titles*; the values that follow them (`Always`/`Never`/`Custom`, `Best`/`Fast`, `For preview`/`For projects`) are the radio/combo choices.\n- `000021198` is a **mixed** entry: the first two lines are the caption ("Real-time output vs re-draw\\nwhen mouse is released."), the `§` then introduces the body.'
});
/* 2.5 Interface > General */
blk({
  title: '2.5 Interface ▸ General — colour scheme, cursor, file requester, project window, thumbnails',
  page: 'Preferences ▸ Interface ▸ General',
  ids: ['000021200', '000021214', '000021215', '000021216', '000021217', '000021218', '000021221', '000021222', '000021223',
    '000021250', '000021251', '000021252', '000021253', '000021254',
    '000021224', '000021225', '000021226', '000021227', '000021228', '000021229', '000021230', '000021255', '000021256',
    '000021231', '000021232', '000021257',
    '000021234', '000021235', '011021235', '000021236', '000021259', '000021260',
    '000021241', '000021242', '000021265',
    '000021243', '000021244', '000021266',
    '000021245', '000021246', '000021247', '000021248',
    '000021270', '000021267',
    '000121240', '000121241',
    '000021299', '000021303', '000021307', '000021380',
    '000021390', '000021391', '000021392', '000021393', '000021394', '000021395'],
  extra: '- `000021214`–`000021218` are the colour-scheme choices (`Default`, `Custom`, `Classic`, `Mirage`, `White`).\n- `000021227`–`000021230` and `000021390`–`000021395` are the cursor shape choices (the latter are the legacy `Cross`/`Arrow`/`Triangle 1..4` set).\n- `000021231` `Panel` / `000021232` `Magnet` are the *cursor over panels* choices.\n- `000021390`–`000021395` (`Cross`, `Arrow`, `Triangle 1`–`Triangle 4`) are the **legacy** cursor-shape choices, sitting next to `000021299` `Border` / `000021303` `Mirror` (the interface-theme checkboxes).'
});
/* 2.6 Interface > Theme */
blk({
  title: '2.6 Interface ▸ Theme — interface colours, resolution scaling, icon set, locked windows, colour space',
  page: 'Preferences ▸ Interface ▸ Theme',
  ids: ['011060150', '011060151', '011060152', '011060153', '011060154', '011060155', '011060156', '011060157', '011060158',
    '011060159', '011060160', '011060161', '011060162', '011060163', '011060164', '011060165', '011060166', '011060167',
    '011060168', '011060169', '011060170', '011060171', '011060172',
    '011060183', '011060184', '011060185', '011060186',
    '000060150', '000060151', '000060152', '000060153', '000060154', '000060155', '000060156', '000060157', '000060158',
    '000060159', '000060160', '000060161', '000060162', '000060163', '000060164', '000060165', '000060166', '000060167',
    '000060168', '000060169', '000060170', '000060171', '000060172', '000060173', '000060174', '000060175', '000060176',
    '000060177', '000060178', '000060179', '000060180', '000060181', '000060182', '000060183', '000060184', '000060185',
    '000060186', '000060187', '000060188', '000060189', '000060190', '000060191', '000060192', '000060193', '000060194',
    '000060195', '000060196',
    '012060000', '012060001', '012060002', '012060003', '012060010', '012060011', '012060012', '012060013', '012060014', '012060015', '012060016',
    '000021222', '000021223'],
  extra: '- `000060150`–`000060196` is the **full colour-scheme slot list** (Desktop Background, Panel Outline, Gadget Default, Menu Shortcut, Layout Background, Layer handles …). These are the labels of the swatches on the Theme page.\n- `011060183`–`011060186` are theme slots that colour the **Shortcuts panel** itself (`Shortcut Panel: Normal Text`, `: Selection`, `: Search Results`, `: Function Bound to a Key`) — they belong to the Theme page but are named after the Shortcuts panel.'
});
/* 2.7 Interface > Panels */
blk({
  title: '2.7 Interface ▸ Panels — multi-screen panels, taskbar, base panels',
  page: 'Preferences ▸ Interface ▸ Panels',
  ids: ['012021202', '012021203', '012021204', '012021205', '012060004', '012060005', '012060006'],
  extra: '- `012060004` `Base panels` / `012060005` `Reset default positions` + `012060006` tooltip.'
});
/* 2.8 Drawing page */
blk({
  title: '2.8 Drawing page — animated strokes, barbecue, smoothness, stencil, cut/delete modes, resampling, tablet, undo-opacity, scroll-lock, XSheet',
  page: 'Preferences ▸ Drawing',
  ids: ['000121130', '000121131', '000121132', '000121137', '000121138', '000121141', '000121142', '000121143',
    '000121153', '000121154', '000121160', '000121161', '000121162', '000121163', '000121164', '000121165',
    '009521139', '009521140', '010521141', '010521142', '010521143', '010521144',
    '011021151', '011021152', '011021180', '011021181', '011021200', '011021201', '011021212', '011021213',
    '011021165', '012104009', '012104010', '000021138', '000021139', '000021140'],
  extra: '- `000121160`/`000121161` are the two pen-eraser modes (the captions for the radio pair are *not* in the file — only the two help sentences are).\n- `009521139` `Wintab` / `009521140` `Use Wintab library§` and `010521141`–`010521144` `Stylus Only` are the tablet options (Android note).\n- `011021165` `"Hide tool preview" checked in preferences` is a **warning message**, not a caption.'
});
/* 2.9 Save page */
blk({
  title: '2.9 Save page — save alarm, TVPP compression, multi-backup',
  page: 'Preferences ▸ Save',
  ids: ['000121133', '000121134', '000121135', '000121136', '000121139', '000121140',
    '009521133', '009521134', '011021140', '011021145', '011021146', '011021147', '011021148', '011021149', '011021150', '011021153',
    '011074104', '011074105', '011074106', '011074107'],
  extra: '- `000121135` `  minutes` has **two leading spaces** (suffix of a spinbox).\n- `011021140` `Save Alarm Options§…` documents the three radio values `Inactivated` / `Warn me!` / `Auto Save`; the radio captions themselves are `011074104` `Deactivate`, `011074105` `Warn me!`, `011074106` `Auto Save` (and `011074107` `Disable alarm until next save` is the 4th state). These IDs live in the *Flips* region of the file but belong to the Save page.'
});
/* 2.10 Timeline pages */
blk({
  title: '2.10 Timeline ▸ General — time code, drawers, large/vertical timeline, XSheet, drag & drop pop-up',
  page: 'Preferences ▸ Timeline ▸ General',
  ids: ['000022832', '000022833', '000022834',
    '000121180', '000121182', '000121183', '000121184', '000121185', '000121186', '000121187', '000121188', '000121189', '000121190',
    '011021202', '011021203', '011021204', '011021205', '011021206'],
  extra: '- `011021202` `If checked, toggles the XSheet Layer tab.` is the **tooltip**, and it sits *before* its caption `011021203` `Display XSheet tab` — an inverted caption/tooltip pair.\n- `011021206` `Work in progress !` is a stub message for that feature.'
});
blk({
  title: '2.11 Timeline ▸ Clip and Timeline ▸ Thumbnail',
  page: 'Preferences ▸ Timeline ▸ Clip / Thumbnail',
  ids: ['000021273', '000021274', '000021275', '000021276', '000021277', '000021278', '000021243', '000021244', '000021266'],
  extra: '- `000021273` `Clip Thumbnails` + `000021274` `Play on mouse hover` + `000021275` tooltip = Clip sub-page.\n- `000021276` `Images / Instances Thumbnails` + `000021277` `Differentiate Empty Instances` + `000021278` `Put an X Mark on Empty Instances` = Thumbnail sub-page.\n- `000021243`/`000021244`/`000021266` is the *Interface*-page thumbnail option (same wording, different ID) — kept here because it belongs to the thumbnail family.'
});
blk({
  title: '2.12 Timeline ▸ Default config — default layer, pre/post behaviour, uncompacted timeline',
  page: 'Preferences ▸ Timeline ▸ Default config',
  ids: ['010083000', '010083001', '010083002', '010083003', '010083004', '010083005', '010083006', '010083007', '010083008', '010083009', '010083010', '010083011',
    '110121326', '110121327', '110121328', '110121329', '110121330', '110121331', '110121332', '110121333', '110121334', '117101726'],
  extra: '- `010083000`–`010083011` is the **"Default config" colour-scheme save dialog** (`Default config`, scheme names, `Save color scheme`, `Name`, `Save to`, `OK`, `Cancel`).\n- `110121326`–`110121334` are the default-layer parameters (`Default layer:`, `Auto break instance`, `Auto create frame`, `Pre behavior`, `Post behavior`, `On new project, lock first layer position`, `"Apply changes" flag enabled on load`).'
});
/* 2.13 Sound page */
blk({
  title: '2.13 Sound page — scrub mode, sampling rate, project sound, automatic sound panel',
  page: 'Preferences ▸ Sound',
  ids: ['000121300', '000121301', '000121302', '000121304', '000121305', '000121306', '000121308', '000121309', '000121310', '000121311', '000121312', '000121313', '000121314', '000121315', '000121316'],
  extra: '- `000121306` `  secs` has **two leading spaces** (spinbox suffix).'
});
/* 2.14 Paths page */
blk({
  title: '2.14 Paths page — plugin folders',
  page: 'Preferences ▸ Paths',
  ids: ['012104312', '012104313', '012104314'],
  extra: '- The five directory rows that the live Paths/General page shows reuse the General-page IDs `000021136`–`000021159` (Temp/Papers/Plugins/Mixers/Brush Directory) — there is no second copy of those captions.'
});
/* 2.15 Network page */
blk({
  title: '2.15 Network page — proxy settings',
  page: 'Preferences ▸ Network',
  ids: ['011021400', '011021401', '011021402', '011021403', '011021404', '011021405', '011021406', '011021407',
    '011021430', '011021431', '011021432', '011021433', '011021434', '011021435',
    '011021440', '011021441', '011021442', '011021443', '011021444', '011021445', '011021446'],
  extra: '- `011021430`–`011021435` = proxy scheme choices (`http`, `http 1.0`, `socks4`, `socks4a`, `socks5`, `socks5 hostname`).\n- `011021440`–`011021446` = authentication method choices (`Basic`, `Digest`, `Negociate`, `NTLM`, `Digest IE`, `NTLM WB`, `Only`).'
});
/* 2.16 startup */
blk({
  title: '2.16 Startup page — starting project settings / template',
  page: 'Preferences ▸ Startup (and the `Startup configuration` group on General)',
  ids: ['000121320', '000121321', '000121322', '000121323', '000121324', '000121325', '000121330', '000121331', '000121340', '000121350'],
  extra: '- `000121340` is the long `§` help text that explains the four radio values (`Last Project Settings`, `Startup Panel`, `Template`, `Load Last Opened Project`).'
});
/* 2.17 misc */
blk({
  title: '2.17 Miscellaneous preference-related entries that do not fit a page',
  page: 'various',
  ids: ['000021092', '011084004', '011084005', '011084006', '000020404', '000020626', '000028465', '011028495', '011070057', '011074027', '011074028', '011074033', '011074034', '011074052', '011074053', '011074056', '011074057', '011074058', '011074059', '011030098', '011030155'],
  extra: '- `000021092` `- keyboard shortcut not available - ` is the placeholder shown when a function has no key.\n- `011084004`–`011084006` are the **Clear Undo history** confirmation (`Clear Undo history`, the confirmation sentence, `Clear it !`). `011084005` is the **only** entry in the file with a stray CR byte before its `\\n` escape (see note 3 in §5).\n- `000028465` `Preferences...` and `011028495` `Shortcuts...` are the **Edit-menu entries** that open the two dialogs.\n- `000020404` `Interface: Configure Keyboard` and `000020626` `Interface: Open Preferences Panel` are the *function names* that can be bound to a key.\n- `011070057` `Keyboard Shortcuts` is a tab of the "Bin"/search panel, not the dialog.\n- `0110740xx` are the Flips-panel shortcut fields (a different feature that happens to assign keys).\n- `011030098` `Assign a shortcut` / `011030155` `Assign` belong to the layer-preset and preset-editor panels.'
});
/* 2.18 shared */
blk({
  title: '2.18 Shared control captions used by the Preferences pages',
  page: 'Preferences (shared)',
  ids: ['000021115', '000021116', '000021222', '000021223', '000021146', '000021135', '000021137', '000121300', '000121301', '000121302', '000021303'],
  extra: '- `OK`/`Cancel` for the dialog; `Apply`/`Reset` for the colour scheme; `Set`/`Set...` for the directory pickers; `Never`/`Scrub`/`Always` for the sound scrub mode; `Border`/`Mirror` for the interface theme toggles.'
});

for (const b of B) R += listBlock(b.title, b.page, b.ids, b.extra);

/* ---------------- section 3 ---------------- */
R += '\n## 3. Shortcuts panel — complete block inventory\n\n';

const S = [];
S.push({
  title: '3.1 Shortcuts dialog chrome — title, buttons, popup menus, legend',
  page: 'Edit ▸ Shortcuts…  ("Configure Keyboard Shortcuts")',
  ids: ['000019900', '000019901', '000019902', '000019903', '000019904', '000019905', '000019906', '000019907', '000019908', '000019909', '000019910', '000019911'],
  extra: '- Live capture `shots/live-shortcuts-dialog.png`: title bar `Configure Keyboard Shortcuts`; top-left combo `File`; top-right `Search` field; bottom bar `Assign` | `Unassign`; bottom-right `OK` | `Cancel`; legend `Colors: [Search Results] [Shortcut Function Bound to Key]`.'
});
S.push({
  title: '3.2 Shortcuts dialog tooltips (the `§` help texts)',
  page: 'Edit ▸ Shortcuts…',
  ids: ['000019912', '000019913', '000019914', '000019916', '000019917', '000019918'],
  extra: '- Each of these starts with the **caption** it documents, then `§`, then the body. `000019912` `Assign§…` explains the Ctrl-click multi-assign; `000019913` `Unassign§…`; `000019914` `Keymap File popup§…`; `000019916` `Result§…`; `000019917` `Keyboard keys§…`; `000019918` `TVPaint Animation Function§…`.\n- There is **no** `000019915` in the file.'
});
S.push({
  title: '3.3 Keymap file / export / predefined keymaps',
  page: 'Edit ▸ Shortcuts…',
  ids: ['000019919', '010019919', '011019920', '011019921'],
  extra: '- `000019919` `Export to a text file` and `010019919` `Export shortcuts` are the export button + its tooltip.\n- `011019920` `Predefined keymaps` = the combo that holds `Fauxtoshop.cfg` etc. (`Resources/Default Config/keymaps/`).\n- `011019921` `Reset to default` = the keymap reset action.'
});
S.push({
  title: '3.4 Key names shown in the "Keyboard keys" column',
  page: 'Edit ▸ Shortcuts…',
  ids: ['000019950', '000019951', '000019952', '000019953', '000019954', '000019955', '000019956', '000019957', '000019958', '000019959', '000019960', '000019961', '000019962', '000019963', '000019964', '000019965', '000019966', '000019967', '000019968', '000019969', '000019972'],
  extra: '- Modifier names: `Shift`, `Ctrl`, `Alt`, `Cmd`.\n- **Duplicates:** `Tab` is `000019958` *and* `000019967`; `Space` is `000019957` *and* `000019968`.\n- `000019969` `MMB` = middle mouse button; `000019972` `Cmd` = ⌘.'
});
S.push({
  title: '3.5 Tablet buttons assignable in the Shortcuts dialog',
  page: 'Edit ▸ Shortcuts…',
  ids: ['000019975', '000019976', '000019977', '000019978', '000019979', '000019980', '000019981', '000019982'],
  extra: '- `Tablet Left 1..4`, `Tablet Right 1..4`.'
});
S.push({
  title: '3.6 Shortcuts panel legend and its theme colours',
  page: 'Edit ▸ Shortcuts…  /  Preferences ▸ Interface ▸ Theme',
  ids: ['011060280', '011060285', '011060286', '011060183', '011060184', '011060185', '011060186'],
  extra: '- `011060280` `Colors: ` is the legend prefix (trailing space); `011060285` `Search Results`; `011060286` `Shortcut Function Bound to Key`.\n- `011060183`–`011060186` are the four **theme swatch labels** for the Shortcuts panel (`Shortcut Panel: Normal Text`, `: Selection`, `: Search Results`, `: Function Bound to a Key`) — they live on the Theme page but colour the Shortcuts panel.'
});
for (const b of S) R += listBlock(b.title, b.page, b.ids, b.extra);

/* 3.7 the function catalogue */
R += '\n### 3.7 The list of assignable TVPaint functions (the right-hand tree of the Shortcuts dialog)\n\n';
R += 'The Shortcuts dialog\'s right pane is a tree of **function categories**, each holding the functions that can be bound to a key. The category names are **not** separate strings — they are the `Category: Function` prefixes of the ~1 000 action strings in the `000020xxx` / `011020xxx` / `012020xxx` / `010520xxx` / `010120xxx` ranges. The complete list of category prefixes found in the file (85 of them) is:\n\n';
const cats = new Map();
for (const x of E) {
  const t = x.text.trim();
  const i = t.indexOf(': ');
  if (i > 0 && i < 30) { if (!cats.has(t.slice(0, i))) cats.set(t.slice(0, i), []); cats.get(t.slice(0, i)).push(x.id); }
}
R += '| category prefix | # actions | ID range |\n|---|---|---|\n';
for (const [k, v] of [...cats.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  R += '| `' + k + '` | ' + v.length + ' | `' + v[0] + '` … `' + v[v.length - 1] + '` |\n';
}
R += '\nThe categories visible in the live capture (`shots/live-shortcuts-dialog.png`) are: `Animator Panel`, `Audio`, `Bookmarks`, `Brush`, `Camera`, `Chalking`, `Clipboard`, `Color Panel`, `Color`, `Correction`, `Display`, `Drawing Mode`, `File Export`, `File Import`, `Flips`, `FX Stack`, `Grab Tools Panel`, `Grab`, `Gradient`, `Guidelines`, `Howard Winshurst Brushes`, `Image Buffer`, `Image`, `ImageMarks`, `Interface`, `Layer Preset`, `Layer`, `Mark In/Out`, `Nature`, `Paintbrushes`.\n\n';
R += '> **Important finding:** the entries `Animator Panel`, `Chalking`, `Correction`, `Grab Tools Panel`, `Howard Winshurst Brushes`, `Nature`, `Paintbrushes` **do not exist anywhere in the .loc file** (nor as ASCII/UTF-16 in `TVPaint Animation 12 Pro Demo.exe` / `Loader.dll`). They are the names of the **shipped custom-panel toolboxes** in `Resources/custompanels/`:\n';
R += '> `AnimatorPanel.bin`, `Chalks_v1.bin`, `Correction.bin`, `GrabTools.bin`, `Howard_ Wimshurst_Brushes_v1.bin`, `Nature_v1.bin`, `PaintBrushes_v1.bin`.\n';
R += '> So the Shortcuts tree mixes *built-in action categories* (localised) with *custom-panel toolbox names* (hard-coded/derived from the resource files). The `.loc` file only carries the first kind.\n\n';
R += 'The left pane of the dialog shows **key → function** pairs such as `A  Zoom: Shake`, `B  Brush: Toggle CutBrush`, `Shift D  Tools: Open Preferences Panel` — those are rendered from the same `Category: Function` strings plus the key names of §3.4.\n\n';

/* ---------------- section 4 ---------------- */
R += '## 4. Every string in the file matching the requested keyword list\n\n';
const words = ['preference', 'preferences', 'shortcut', 'keyboard', 'keymap', 'assign', 'unassign', 'undo size', 'cache', 'startup', 'temp dir', 'physical memory', 'theme', 'panel', 'language', 'sound', 'path', 'draw', 'timeline', 'clip', 'thumbnail', 'default config', 'general', 'interface'];
const re = new RegExp('(' + words.map(w => w.replace(/ /g, '\\s+')).join('|') + ')', 'i');
const hits = E.filter(x => re.test(x.text));
R += '**' + hits.length + '** of the 9 196 entries match. Entries already fully listed in §2/§3 are marked **[listed above]**; everything else is printed here so nothing is missed.\n\n';
R += 'Keywords (case-insensitive): `preference`, `preferences`, `shortcut`, `keyboard`, `keymap`, `assign`, `unassign`, `undo size`, `cache`, `startup`, `temp dir`, `physical memory`, `theme`, `panel`, `language`, `sound`, `path`, `draw`, `timeline`, `clip`, `thumbnail`, `default config`, `general`, `interface`.\n\n';

const inBlock = new Set();
for (const b of B.concat(S)) for (const id of b.ids) inBlock.add(id);

R += '| id | text |\n|---|---|\n';
for (const x of hits) {
  const mark = inBlock.has(x.id) ? ' **[listed above]**' : '';
  R += '| `' + x.id + '`' + mark + ' | ' + x.text.replace(/\n/g, '\\n').replace(/\|/g, '\\|') + ' |\n';
}

/* ---------------- section 5 ---------------- */
R += '\n## 5. Notes, anomalies and things that were surprising\n\n';
R += '1. **`§` is the tooltip separator.** In TVPaint a tooltip entry is `Caption§\\n\\nBody text`. Many captions therefore exist twice: a bare caption ID *and* a `§` ID whose prefix repeats the caption (e.g. `000019901` `Assign` and `000019912` `Assign§\\n\\nClick on the keystroke…`). Tooltips that have no caption of their own are stored as plain sentences (`000021198`, `000021260`, `000021292`).\n';
R += '2. **Caption→tooltip order is not consistent.** Usually the caption has the lower ID and the tooltip the higher one (e.g. `000121137` `Barbecue` caption → `000121138` help; `011021200` `Scroll lock panels` caption → `011021201` help), but the XSheet pair is **inverted**: `011021202` `If checked, toggles the XSheet Layer tab.` (the help text) comes *before* `011021203` `Display XSheet tab` (the caption). Do not assume caption-first when pairing IDs.\n';
R += '3. **One entry contains a stray CR byte** — `011084005` reads `This will clear the Undo/Redo stack.\\r\\nYou won\'t be able to Undo/Redo all the action in the current list.` (a `0x0D` immediately before the `\\n` escape). Every other entry in the file uses plain `\\n` escapes and never a real line break.\n';
R += '4. **Real user-visible wording oddities worth reproducing verbatim:**\n';
R += '   * `000021198` `Real-time output vs re-draw\\nwhen mouse is released.` — the caption itself contains a hard line break.\n';
R += '   * `000121135` `  minutes` and `000121306` `  secs` and `011060280` `Colors: ` — leading/trailing spaces are significant (spinbox suffixes).\n';
R += '   * `000021188` `Works  with a 16bits pixels depth only` — **double space** after "Works".\n';
R += '   * `000021296` `Are you sure you want to use OpenGL ?` — space before `?`.\n';
R += '   * `000021199` `use RGB refresh mode…` — lower-case start.\n';
R += '   * `000021221` `Color scheme`, `000021222` `Apply`, `000021223` `Reset` — note `Apply`/`Reset` are reused by the colour-scheme *and* the Default-config dialog.\n';
R += '   * `000021293` `Size of your cache§\\n\\nDisplays the current size\\nod the cache.` — typo **"od"** (should be "of") is in the shipped file.\n';
R += '   * `000021292` `…directly effects the real-time preview playback` — "effects" instead of "affects".\n';
R += '   * `011021442` `Negociate` (one "c") — misspelling shipped in all localisations.\n';
R += '5. **Duplicate text under different IDs** is normal and intentional: `General` ×3, `Display` ×many, `Save`, `Drawing`, `Timeline`, `Clip`, `Sound`, `Interface`, `Undo`, `Tab` ×2, `Space` ×2, `Undo Size` (`000021133`), `Cache size` (`000021285`) and `Cache usage` (`000021280`).\n';
R += '6. **The `000021112` `Display` / `000021113` `Memory&Cache` / `000021117` `Startup` category names are NOT in the 12.1.0 tree.** They are leftovers from the older TVPaint 11 Preferences dialog (tabs: Interface / General / Display / Memory&Cache / Sound / Startup). The 12.1.0 tree uses `0110211xx` labels instead. `000021110` `Interface` and `000021114` `Sound` are shared by both generations.\n';
R += '7. **The `Network` node (`011021119`) has no content block of its own that is clearly labelled** — its only obvious content is the Proxy block `011021400`–`011021446`. It is not visible in the 12.1.0 demo tree.\n';
R += '8. **`Paths` (`012104312`) is nearly empty** — only `Plugin Folders` + `All the places to search for plugins.` The five directory rows reuse the General-page IDs (`000021136`–`000021159`).\n';
R += '9. **The Shortcuts tree mixes localised and non-localised labels** — see §3.7. The custom-panel names come from `Resources/custompanels/*.bin`, so they cannot be rebuilt from the `.loc` file alone.\n';
R += '10. **The `000021xxx` and `011021xxx` spaces both carry Preference text.** The `0000xxxxx` pool is the legacy string pool, the `0110xxxxx` pool is the current one the 12.1.0 UI draws, and the two overlap in *meaning* without sharing IDs — e.g. `000021165` `Hide tool preview (for all tools!)` (caption) vs `011021165` `"Hide tool preview" checked in preferences` (the warning raised when that option is on); `000021143` `Mixers Directory` (caption) vs `011021151` `Mixers directory` + `011021152` its tooltip.\n';
R += '11. **The file is not sorted.** Any tooling that reads it must sort by ID itself; and any tooling that maps "ID → string" must expect the same ID to be reused in a different context (e.g. `011021122` `General` is a *tree node*, `000021111` `General` is a *category list entry*).\n';
R += '12. The `Resources/Default Config/keymaps/Fauxtoshop.cfg` file maps keys → internal command names (`A=SelectShapePolygone`, `Shift A=ToggleToolPanel`, …). Those command names are **not** the `.loc` strings; the `.loc` gives the human-readable `Category: Function` labels the same commands are displayed with.\n';

const out = path.join(__dirname, '..', 'reports', 'prefs-strings.md');
fs.writeFileSync(out, R, 'utf8');
console.log('wrote', out, R.length, 'chars', R.split('\n').length, 'lines');
