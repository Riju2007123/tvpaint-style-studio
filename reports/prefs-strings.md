# TVPaint Animation 12 Pro — Preferences & Shortcuts string inventory

Source: `C:\Program Files\TVPaint Developpement\TVPaint Animation 12 Pro Demo\Resources\data\english.tvpaint.loc`

Parsed with `tools/parse-loc.js` → `reports/loc-entries.json` (**9196** entries, 9196 unique IDs, UTF-8, CRLF line endings, 386 `#---` separator lines that chop the file into 373 visual blocks).

## 1. How the file is organised

### 1.1 Physical format

```
$000021129 "Language"
$000021140 "SubPixel Coordinates§\n\nIf checked, coordinates are got in a\nresolution bigger than pixel resolution.\n…"
```

* One entry per line: `$` + **10-digit zero-padded ID** + space + `"` + text + `"`.
* The text is **raw UTF-8**; `§` (U+00A7) is TVPaint's own *tooltip separator*, and `\n` is a **literal two-character escape** inside the string (not a real newline). **2 715** literal `\n` escapes occur across the file. Exactly **one** entry (`011084005`) contains a stray **CR (0x0D) byte** in the middle of its text — a formatting bug in the shipped file; it is shown as `\r` below.
* IDs are NOT globally sorted — the file is a concatenation of ~373 `#---`-separated blocks, and inside a block the IDs are usually ascending but the *blocks* themselves are scattered through the file. The **ID value itself** is the reliable key: the same text appears under several IDs when it is used in several panels.
* Other ID prefixes in the file are unrelated panels (FX effects `000040xxx`/`000041xxx`/`000044xxx`, export dialogs `000030xxx`, action/menu `000020xxx`, Timesheet `012103xxx`, …). Only the ranges listed in §2/§3 belong to Preferences/Shortcuts.

### 1.2 ID-space map for Preferences + Shortcuts

| ID range | What it is |
|---|---|
| `000021100` | **Preferences dialog title** (`Preferences`) |
| `000021110`–`000021117` | Legacy/alternate preference **category names**: `Interface`, `General`, `Display`, `Memory&Cache`, `Sound`, `OK`, `Cancel`, `Startup` |
| `000021120`–`000021122` | Dialog tooltips: category list / OK / Cancel |
| `000021129`–`000021159` | **General page** content (Language, Keyboard Shortcuts, Temp/Papers/Plugins/Mixers/Brush directories, Tablet/SubPixel) |
| `000021160`–`000021199` | **Display page** content (Tool Display, gamma, LUT, DirectDraw, RGB) |
| `000021200`–`000021298` | **Interface page** content (color scheme, cursor, file requester, project window, thumbnails, highlight) + **Undo / Memory&Cache** block |
| `000021299`–`000021395` | Interface/Theme option labels + their `§` tooltips (`Border`, `Mirror`, `Highlight`, cursor shapes) |
| `000021400`–`000021599` | Colour-picker panel (NOT Preferences) |
| `000021700`–`000021930` | Display-settings / Gradient / Grid panels (NOT Preferences) |
| `000121130`–`000121190` | **Drawing / Save / Timeline / Interface drawer** option groups (Animated Strokes, Barbecue, Save Alarm, Resampling, Drawers) |
| `000121240`–`000121350` | Interface (`Use TVPaint Menu`), **Sound page** (Scrub, Sampling Rate), **Startup page** (Starting Project Settings) |
| `000019900`–`000019999` | **Shortcuts dialog**: title, buttons, tooltips, key-name lists, tablet buttons |
| `010019919`, `011019920`–`011019921` | Shortcuts dialog: `Export shortcuts`, `Predefined keymaps`, `Reset to default` |
| `010083000`–`010083011` | **Default config / colour-scheme** save dialog |
| `011021118`–`011021129` | **Preferences tree node labels** (Save, Network, Drawing, General, Timeline, Clip, Thumbnail, Default config, General, Theme, Panels) |
| `011021140`–`011021213` | **Save / Drawing / Timeline option groups** (Save Alarm Options, Multi-Backup, Wintab, Undo layer opacity, Scroll lock panels, XSheet, drag&drop pop-up) |
| `011021235`, `011021275` | File-requester owner, tooltip-display hint |
| `011021400`–`011021446` | **Network page** (Proxy: Scheme/Host/Port/Authentication + proxy/auth method lists) |
| `011060150`–`011060189` | **Theme page** (Notes/Help/Notification colours, Resolution scaling, Icon set, Locked windows visibility, colour-space, `Shortcut Panel:` theme colours) |
| `011060280`–`011060286` | Shortcuts panel legend (`Colors:`, `Search Results`, `Shortcut Function Bound to Key`) |
| `012021202`–`012021205` | **Panels page** (Multi-screen panels, Panels in the taskbar) |
| `012043814`–`012043820`, `012102150`–`012102156` | Import / Export custom settings (buttons live on the General page) |
| `012060000`–`012060016` | Theme/Panels page items (Camera profile curves, `Base panels`, `Reset default positions`) |
| `012104009`–`012104010` | Transformation Tools Preview Quality (Drawing page) |
| `012104312`–`012104314` | **Paths page** (`Paths`, `Plugin Folders`) |
| `105121320`–`105121327` | **Startup configuration** (General page) |
| `110121326`–`110121335` | **Default config page** (default layer, pre/post behaviour, uncompacted timeline) |
| `110121326`–`110121327`, `117101726` | Default-config items |
| `009521133`–`009521140`, `010521141`–`010521144` | Multi-Backup + Wintab/Stylus options |
| `011074027`–`011074063` | Flips-panel *shortcut* fields (NOT the Shortcuts dialog) |
| `000020404`, `000020626` | Menu-function names that open these dialogs |

### 1.3 How the pages map to the tree

The live 12.1.0 dialog (captured in `shots/dlg-preferences.png`, tree cropped in `shots/tree-crop3.png`) shows this tree:

```
General              (selected → page title "General")
Save
Drawing
Timeline  ⊙
  General
  Clip
  Thumbnail
  Default config
Interface ⊙
  General
  Theme
  Panels
Sound
Paths
```

Matching the tree labels to IDs:

| Tree label | ID | note |
|---|---|---|
| General (root) | `000021111` *or* `011021122` | two candidates; see §2.1 |
| Save | `011021118` | |
| Network | `011021119` | not visible in the 12.1.0 tree (likely a child of *Save*) |
| Drawing | `011021120` | |
| Timeline | `011021123` | |
| Timeline ▸ General | `011021122` | |
| Timeline ▸ Clip | `011021124` | |
| Timeline ▸ Thumbnail | `011021125` | |
| Timeline ▸ Default config | `011021126` | |
| Interface | `000021110` | |
| Interface ▸ General | `011021127` | |
| Interface ▸ Theme | `011021128` | |
| Interface ▸ Panels | `011021129` | |
| Sound | `000021114` | |
| Paths | `012104312` | |

**Full list of page names the Preferences tree contains:** `General` (root), `Save`, `Network`, `Drawing`, `Timeline` (+`General`, `Clip`, `Thumbnail`, `Default config`), `Interface` (+`General`, `Theme`, `Panels`), `Sound`, `Paths`.

## 2. Preferences panel — complete block inventory

Each block lists the IDs in ascending order. **Role** column:

* `CAPTION` — short control caption (button, checkbox, combo entry, list item).
* `HELP` — the entry contains `§`. TVPaint convention: the text **before** `§` is the tooltip title and the text after `§` is the tooltip body. Several captions therefore exist **twice**: once as a bare caption and once as a `§` entry whose prefix repeats the caption.
* `TOOLTIP` — sentence-style help text with no `§` separator.
* `LABEL` — a value/list item that is neither a short caption nor a sentence.


### 2.1 Preferences dialog chrome, category list, OK/Cancel

- **Page / tab:** Preferences (the dialog itself)
- **ID range:** 000021100 … 000021122  (12 entries, listed in ascending ID order)
- Note: `000021112` `Display` and `000021113` `Memory&Cache` are **not** nodes of the 12.1.0 tree — they are the older v10/v11 Preferences category names kept in the binary for compatibility.
- `000021120` `Choose a setting category` = tooltip of the tree/list; `000021121` = OK tooltip; `000021122` = Cancel tooltip.

| id | text | role |
|---|---|---|
| `000021100` | Preferences | **CAPTION** — short control caption |
| `000021110` | Interface | **CAPTION** — short control caption |
| `000021111` | General | **CAPTION** — short control caption |
| `000021112` | Display | **CAPTION** — short control caption |
| `000021113` | Memory&Cache | **CAPTION** — short control caption |
| `000021114` | Sound | **CAPTION** — short control caption |
| `000021115` | OK | **CAPTION** — short control caption |
| `000021116` | Cancel | **CAPTION** — short control caption |
| `000021117` | Startup | **CAPTION** — short control caption |
| `000021120` | Choose a setting category | **TOOLTIP** — help text for the preceding caption |
| `000021121` | Exit and save the settings | **TOOLTIP** — help text for the preceding caption |
| `000021122` | Exit without saving the settings | **TOOLTIP** — help text for the preceding caption |

### 2.2 Preferences tree node labels

- **Page / tab:** Preferences tree
- **ID range:** 011021118 … 011021129  (11 entries, listed in ascending ID order)
- `011021121` does **not** exist in the file (gap in the sequence).
- `General` appears 3× (`011021122`, `011021127`, `000021111`) because three different tree nodes are called "General".

| id | text | role |
|---|---|---|
| `011021118` | Save | **CAPTION** — short control caption |
| `011021119` | Network | **CAPTION** — short control caption |
| `011021120` | Drawing | **CAPTION** — short control caption |
| `011021122` | General | **CAPTION** — short control caption |
| `011021123` | Timeline | **CAPTION** — short control caption |
| `011021124` | Clip | **CAPTION** — short control caption |
| `011021125` | Thumbnail | **CAPTION** — short control caption |
| `011021126` | Default config | **CAPTION** — short control caption |
| `011021127` | General | **CAPTION** — short control caption |
| `011021128` | Theme | **CAPTION** — short control caption |
| `011021129` | Panels | **CAPTION** — short control caption |

### 2.3 General page — language, shortcuts button, directories, memory, undo, cache, startup

- **Page / tab:** Preferences ▸ General
- **ID range:** 000021129 … 105121327  (68 entries, listed in ascending ID order)
- This is the page shown in `shots/dlg-preferences.png` (Language / Keyboard Shortcuts / Temp Directory / Physical Memory / Undo+Undo Size / Cache usage+Cache size / Startup configuration / Open last project on startup / Export+Import Custom Settings / George Alert: tv_WriteTextFile).
- The five directory rows (Temp / Papers / Plugins / Mixers / Brush) and their `Set` buttons live here; the `Paths` page re-uses the same IDs for the Papers/Plugins/Mixers/Brush rows.

| id | text | role |
|---|---|---|
| `000021129` | Language | **CAPTION** — short control caption |
| `000021130` | Undo | **CAPTION** — short control caption |
| `000021131` | Disable | **CAPTION** — short control caption |
| `000021132` | Enable | **CAPTION** — short control caption |
| `000021133` | Undo Size | **CAPTION** — short control caption |
| `000021134` | Keyboard Shortcuts | **CAPTION** — short control caption |
| `000021135` | Configure... | **CAPTION** — short control caption |
| `000021136` | Temp Directory | **CAPTION** — short control caption |
| `000021137` | Set... | **CAPTION** — short control caption |
| `000021141` | Papers Directory | **CAPTION** — short control caption |
| `000021142` | Plugins Directory | **CAPTION** — short control caption |
| `000021143` | Mixers Directory | **CAPTION** — short control caption |
| `000021144` | To use this change, please restart TVPaint Animation | **TOOLTIP** — help text for the preceding caption |
| `000021145` | Brush Directory | **CAPTION** — short control caption |
| `000021146` | Set | **CAPTION** — short control caption |
| `000021147` | Brush Directory | **CAPTION** — short control caption |
| `000021148` | Click here to edit your keyboard shortcuts | **TOOLTIP** — help text for the preceding caption |
| `000021149` | Click here to choose your temporary file directory§\n\nClick on the set button\nNavigate to the directory you wish to use as the Temp Dir\nClick OK | **HELP** — contains § — tooltip title "Click here to choose your temporary file directory" + body |
| `000021150` | temp directory | **LABEL** — label / list item / message |
| `000021151` | Mixers directory | **CAPTION** — short control caption |
| `000021152` | Click here to choose your mixers directory§\n\nClick on the set button\nNavigate to the directory you wish to use as the mixers Dir\nClick OK | **HELP** — contains § — tooltip title "Click here to choose your mixers directory" + body |
| `000021153` | Choose Language | **CAPTION** — short control caption |
| `000021155` | Papers directory | **CAPTION** — short control caption |
| `000021156` | Click here to choose your papers directory§\n\nClick on the set button\nNavigate to the directory you wish to use as the papers Dir\nClick OK | **HELP** — contains § — tooltip title "Click here to choose your papers directory" + body |
| `000021157` | Plugins directory | **CAPTION** — short control caption |
| `000021158` | Click here to choose your plugins directory§\n\nClick on the set button\nNavigate to the directory you wish to use as the plugins Dir\nClick OK | **HELP** — contains § — tooltip title "Click here to choose your plugins directory" + body |
| `000021159` | Click here to choose your brush directory§\n\nClick on the set button\nNavigate to the directory you wish to use as the brush Dir\nClick OK | **HELP** — contains § — tooltip title "Click here to choose your brush directory" + body |
| `000021280` | Cache usage | **CAPTION** — short control caption |
| `000021281` | Physical Memory | **CAPTION** — short control caption |
| `000021282` | Auto | **CAPTION** — short control caption |
| `000021283` | Automatic | **CAPTION** — short control caption |
| `000021284` | Manual | **CAPTION** — short control caption |
| `000021285` | Cache size | **CAPTION** — short control caption |
| `000021286` | Disable the undo§\n\nturn off the undo mode. | **HELP** — contains § — tooltip title "Disable the undo" + body |
| `000021287` | Enable the undo§\n\nTurn on the undo mode | **HELP** — contains § — tooltip title "Enable the undo" + body |
| `000021289` | Choose how much memory to allocate for undo buffer§\n\nThe more memory allocated\nto the undo buffer, the more \nlevels of undo will be possible. | **HELP** — contains § — tooltip title "Choose how much memory to allocate for undo buffer" + body |
| `000021290` | The amount of memory in your computer | **TOOLTIP** — help text for the preceding caption |
| `000021291` | Sets cache amount automatically§\n\nAutomatically sets the amount of\nmemory used for the undo buffer. | **HELP** — contains § — tooltip title "Sets cache amount automatically" + body |
| `000021292` | Allows user to choose how much RAM is used for cache.\nThis setting directly effects the real-time preview playback | **LABEL** — label / list item |
| `000021293` | Size of your cache§\n\nDisplays the current size\nod the cache. | **HELP** — contains § — tooltip title "Size of your cache" + body |
| `000021295` | Use OpenGL | **CAPTION** — short control caption |
| `000021296` | OpenGL support is experimental\nand has some known bugs, especially on\ndual screen configuration and some\ngraphics cards.\n\nAre you sure you want to use OpenGL ? | **TOOLTIP** — sentence-style help text (no §) |
| `000021297` | Activate OpenGL§\n\nCheck the box to activate\nOpenGL support.\n\nActivate OpenGL increases the\npower of TVPaint Animation by\nusing your graphic CPU\nfor display and keep your CPU\nfree for all calculs. | **HELP** — contains § — tooltip title "Activate OpenGL" + body |
| `000021298` | Clear the cache | **CAPTION** — short control caption |
| `011060173` | George Alert: tv_WriteTextFile | **CAPTION** — short control caption |
| `011060174` | When disabled, you won't get a warning pop-up when scripts will modify files on your computer. | **TOOLTIP** — help text for the preceding caption |
| `011060175` | If you deactivate this option, you will no longer be warned \nwhen a script will try to modify files on your computer.\n\nAre you sure you want to continue ? | **TOOLTIP** — help text for the preceding caption |
| `012043814` | Import Custom Settings | **CAPTION** — short control caption |
| `012043815` | Import Settings | **CAPTION** — short control caption |
| `012043816` | Import the selected custom settings from\n a .tvpsettings file. Shortcuts and FX\n Stacks presets will be added to their \nrespective preset lists. Custom Panels,\n Palettes and Mixers will be added or \nwill replace already exisiting ones if \nthey bear the same name. Imported Layer \nPresets and Color Groups will replace the\n existing ones. | **TOOLTIP** — sentence-style help text (no §) |
| `012043817` | Import Settings | **CAPTION** — short control caption |
| `012043818` | Importing Settings... | **LABEL** — label / list item / message |
| `012043819` | Warning: already existing elements of the same name will be replaced. \nLayer Presets and Color Groups will also be replaced. | **TOOLTIP** — help text for the preceding caption |
| `012043820` | Warning:\nThe following elements have been altered in the .tvpsettings file: | **TOOLTIP** — help text for the preceding caption |
| `012102150` | Export All Custom Settings | **CAPTION** — short control caption |
| `012102151` | Export Settings | **CAPTION** — short control caption |
| `012102152` | Clicking on this button allows you to export all your custom settings -Shortcuts, Palettes, Custom Panels, FX Stack etc.- in a dedicated folder, which lets you to reimport them quickly later on. | **TOOLTIP** — sentence-style help text (no §) |
| `012102153` | Layer Presets | **LABEL** — label / list item / message |
| `012102154` | Export Settings | **CAPTION** — short control caption |
| `012102155` | Enter a valid export path to be able to click on the OK button. | **TOOLTIP** — help text for the preceding caption |
| `012102156` | Exporting settings... | **LABEL** — label / list item / message |
| `105121320` | Startup configuration | **CAPTION** — short control caption |
| `105121321` | Remember last used configuration | **CAPTION** — short control caption |
| `105121322` | Open Startup Panel | **CAPTION** — short control caption |
| `105121324` | Open last project on startup | **CAPTION** — short control caption |
| `105121325` | Always keep the same configuration | **CAPTION** — short control caption |
| `105121326` | Reset configuration | **CAPTION** — short control caption |
| `105121327` | Resetting the configuration will also delete your Custom Panels.\nYou will need to restart the software.\nProceed? | **TOOLTIP** — sentence-style help text (no §) |

### 2.4 Display page — tool display, gamma/LUT, DirectDraw, brush display

- **Page / tab:** Preferences ▸ Display
- **ID range:** 000021160 … 000021199  (40 entries, listed in ascending ID order)
- `000021164` `Surface displayed`, `000021166` `Display mode`, `000021169` `Display`, `000021170` `Display device` are *group titles*; the values that follow them (`Always`/`Never`/`Custom`, `Best`/`Fast`, `For preview`/`For projects`) are the radio/combo choices.
- `000021198` is a **mixed** entry: the first two lines are the caption ("Real-time output vs re-draw\nwhen mouse is released."), the `§` then introduces the body.

| id | text | role |
|---|---|---|
| `000021160` | Tool Display | **TOOLTIP** — help text for the preceding caption |
| `000021161` | Always | **TOOLTIP** — help text for the preceding caption |
| `000021162` | Never | **CAPTION** — short control caption |
| `000021163` | Custom | **CAPTION** — short control caption |
| `000021164` | Surface displayed | **CAPTION** — short control caption |
| `000021165` | Hide tool preview (for all tools!) | **CAPTION** — short control caption |
| `000021166` | Display mode | **CAPTION** — short control caption |
| `000021167` | Best | **CAPTION** — short control caption |
| `000021168` | Fast | **CAPTION** — short control caption |
| `000021169` | Display | **CAPTION** — short control caption |
| `000021170` | Display device | **CAPTION** — short control caption |
| `000021171` | For preview | **CAPTION** — short control caption |
| `000021172` | For projects | **CAPTION** — short control caption |
| `000021173` | View option | **CAPTION** — short control caption |
| `000021174` | Auto pan | **CAPTION** — short control caption |
| `000021175` | Fast refresh | **CAPTION** — short control caption |
| `000021176` | LUT | **CAPTION** — short control caption |
| `000021177` | Gamma | **CAPTION** — short control caption |
| `000021178` | Offset | **CAPTION** — short control caption |
| `000021179` | Gain | **CAPTION** — short control caption |
| `000021180` | Apply gamma settings | **CAPTION** — short control caption |
| `000021181` | Output refresh | **CAPTION** — short control caption |
| `000021182` | Real-time | **CAPTION** — short control caption |
| `000021183` | DirectDraw | **CAPTION** — short control caption |
| `000021184` | Use RGB | **CAPTION** — short control caption |
| `000021185` | Brush display mode | **CAPTION** — short control caption |
| `000021186` | Maximum brush size display in Custom mode | **CAPTION** — short control caption |
| `000021187` | Hide the brush while drawing | **CAPTION** — short control caption |
| `000021188` | Works  with a 16bits pixels depth only | **TOOLTIP** — help text for the preceding caption |
| `000021189` | Which display device for the preview output | **TOOLTIP** — help text for the preceding caption |
| `000021190` | Which display device for the current project output | **TOOLTIP** — help text for the preceding caption |
| `000021191` | Auto panning when you reach a project corner | **CAPTION** — short control caption |
| `000021192` | AntiAliasing disable on the project window | **CAPTION** — short control caption |
| `000021193` | Red | **CAPTION** — short control caption |
| `000021194` | Green | **CAPTION** — short control caption |
| `000021195` | Blue | **CAPTION** — short control caption |
| `000021196` | Apply the gamma settings on the whole interface | **CAPTION** — short control caption |
| `000021197` | Lock | **CAPTION** — short control caption |
| `000021198` | Real-time output vs re-draw\nwhen mouse is released.§\nIn real-time mode the toaster output\nis constantly updated. In non real-time mode\nthe output is updated when the mouse\nbutton is released. | **HELP** — contains § — tooltip title "Real-time output vs re-draw\nwhen mouse is released." + body |
| `000021199` | use RGB refresh mode for DirectDraw display instead of YUV | **CAPTION** — short control caption |

### 2.5 Interface ▸ General — colour scheme, cursor, file requester, project window, thumbnails

- **Page / tab:** Preferences ▸ Interface ▸ General
- **ID range:** 000021200 … 011021235  (56 entries, listed in ascending ID order)
- `000021214`–`000021218` are the colour-scheme choices (`Default`, `Custom`, `Classic`, `Mirage`, `White`).
- `000021227`–`000021230` and `000021390`–`000021395` are the cursor shape choices (the latter are the legacy `Cross`/`Arrow`/`Triangle 1..4` set).
- `000021231` `Panel` / `000021232` `Magnet` are the *cursor over panels* choices.
- `000021390`–`000021395` (`Cross`, `Arrow`, `Triangle 1`–`Triangle 4`) are the **legacy** cursor-shape choices, sitting next to `000021299` `Border` / `000021303` `Mirror` (the interface-theme checkboxes).

| id | text | role |
|---|---|---|
| `000021200` | Color | **CAPTION** — short control caption |
| `000021214` | Default | **CAPTION** — short control caption |
| `000021215` | Custom | **CAPTION** — short control caption |
| `000021216` | Classic | **CAPTION** — short control caption |
| `000021217` | Mirage | **CAPTION** — short control caption |
| `000021218` | White | **CAPTION** — short control caption |
| `000021221` | Color scheme | **CAPTION** — short control caption |
| `000021222` | Apply | **CAPTION** — short control caption |
| `000021223` | Reset | **CAPTION** — short control caption |
| `000021224` | Cursor | **CAPTION** — short control caption |
| `000021225` | Over projects | **CAPTION** — short control caption |
| `000021226` | Over windows | **CAPTION** — short control caption |
| `000021227` | Cross (legacy) | **CAPTION** — short control caption |
| `000021228` | Arrow (legacy) | **CAPTION** — short control caption |
| `000021229` | Point | **CAPTION** — short control caption |
| `000021230` | Circle | **CAPTION** — short control caption |
| `000021231` | Panel | **CAPTION** — short control caption |
| `000021232` | Magnet | **CAPTION** — short control caption |
| `000021234` | File requester | **CAPTION** — short control caption |
| `000021235` | System | **CAPTION** — short control caption |
| `000021236` | Replace existing file(s) | **CAPTION** — short control caption |
| `000021241` | Project window | **CAPTION** — short control caption |
| `000021242` | Always behind Panel | **CAPTION** — short control caption |
| `000021243` | Images / Instances Thumbnails | **CAPTION** — short control caption |
| `000021244` | Always Show by Default | **CAPTION** — short control caption |
| `000021245` | Pen 1 | **CAPTION** — short control caption |
| `000021246` | Pen 2 | **CAPTION** — short control caption |
| `000021247` | Pen 3 | **CAPTION** — short control caption |
| `000021248` | Pen 4 | **CAPTION** — short control caption |
| `000021250` | Set a button type§\n\nSelect the type of button\nyou wish to modify. | **HELP** — contains § — tooltip title "Set a button type" + body |
| `000021251` | Use a preset color§\n\nChoose from a selection of\npreset color schemes for TVPaint Animation. | **HELP** — contains § — tooltip title "Use a preset color" + body |
| `000021252` | Click here to choose a new color§\n\nClick this button to select\nthe new color for the selected\nbutton type. Once clicked, select\nfrom any color currently on the screen. | **HELP** — contains § — tooltip title "Click here to choose a new color" + body |
| `000021253` | Apply this color configuration | **TOOLTIP** — help text for the preceding caption |
| `000021254` | Reset the color configuration\nto the defaults. | **TOOLTIP** — help text for the preceding caption |
| `000021255` | Set your cursor style while drawing§\n\nThis allows the user to change\nthe shape of the cursor used for drawing. | **HELP** — contains § — tooltip title "Set your cursor style while drawing" + body |
| `000021256` | Set your cursor while over the windows | **TOOLTIP** — help text for the preceding caption |
| `000021257` | Windows snap together when they are close | **CAPTION** — short control caption |
| `000021259` | Choose the file requester system (TVPaint Animation or Windows)§\n\nTVPaint Animation's file requestor allows the user to right click\non images, video clips and animations for instant veiwing.\nThe windows requestor allows for the creation of \nsub directories and is more commonly used in other applications. | **HELP** — contains § — tooltip title "Choose the file requester system (TVPaint Animation or Windows)" + body |
| `000021260` | Never confirm when you erase/rewrite a file§\n\nYou will never have a requestor\npop up to confirm that you are \nabout to over-write an existing file. | **HELP** — contains § — tooltip title "Never confirm when you erase/rewrite a file" + body |
| `000021265` | If On, Panels will be always in front of the project window | **TOOLTIP** — help text for the preceding caption |
| `000021266` | Click here if you want to have your layer thumbnails always displayed by default | **TOOLTIP** — help text for the preceding caption |
| `000021267` | Set the Highlight of the Interface§\n\nSet the value in the box or use the\nmini-slider on the right to ajust the\nhighlight of the interface. | **HELP** — contains § — tooltip title "Set the Highlight of the Interface" + body |
| `000021270` | Highlight | **CAPTION** — short control caption |
| `000021299` | Border | **CAPTION** — short control caption |
| `000021303` | Mirror | **CAPTION** — short control caption |
| `000021307` | Active/Deactive the border option§\n\nCheck the box to active the border\naround each element of the interface. | **HELP** — contains § — tooltip title "Active/Deactive the border option" + body |
| `000021380` | Active/Deactive the Mirror option§\n\nCheck the box in order to\ninvert the highlight effect\nof the interface. | **HELP** — contains § — tooltip title "Active/Deactive the Mirror option" + body |
| `000021390` | Cross | **CAPTION** — short control caption |
| `000021391` | Arrow | **CAPTION** — short control caption |
| `000021392` | Triangle 1 | **CAPTION** — short control caption |
| `000021393` | Triangle 2 | **CAPTION** — short control caption |
| `000021394` | Triangle 3 | **CAPTION** — short control caption |
| `000021395` | Triangle 4 | **CAPTION** — short control caption |
| `000121240` | Use TVPaint Menu | **CAPTION** — short control caption |
| `000121241` | (macOS users)\nUse the TVPaint Main Menu inside the software window\nin addition to macOS' Menu. | **TOOLTIP** — sentence-style help text (no §) |
| `011021235` | TVPaint Animation | **CAPTION** — short control caption |

### 2.6 Interface ▸ Theme — interface colours, resolution scaling, icon set, locked windows, colour space

- **Page / tab:** Preferences ▸ Interface ▸ Theme
- **ID range:** 000021222 … 012060016  (87 entries, listed in ascending ID order)
- `000060150`–`000060196` is the **full colour-scheme slot list** (Desktop Background, Panel Outline, Gadget Default, Menu Shortcut, Layout Background, Layer handles …). These are the labels of the swatches on the Theme page.
- `011060183`–`011060186` are theme slots that colour the **Shortcuts panel** itself (`Shortcut Panel: Normal Text`, `: Selection`, `: Search Results`, `: Function Bound to a Key`) — they belong to the Theme page but are named after the Shortcuts panel.

| id | text | role |
|---|---|---|
| `000021222` | Apply | **CAPTION** — short control caption |
| `000021223` | Reset | **CAPTION** — short control caption |
| `000060150` | Desktop Background | **CAPTION** — short control caption |
| `000060151` | Panel Outline | **CAPTION** — short control caption |
| `000060152` | Panel Outline Light | **CAPTION** — short control caption |
| `000060153` | Panel Outline Dark | **CAPTION** — short control caption |
| `000060154` | Panel Background | **CAPTION** — short control caption |
| `000060155` | Panel Drag Bar | **CAPTION** — short control caption |
| `000060156` | Panel Drag Bar Selected | **CAPTION** — short control caption |
| `000060157` | Panel Title | **CAPTION** — short control caption |
| `000060158` | Panel System 1 | **CAPTION** — short control caption |
| `000060159` | Panel System 2 | **CAPTION** — short control caption |
| `000060160` | Gadget Text Inside | **CAPTION** — short control caption |
| `000060161` | Gadget Text Outside | **CAPTION** — short control caption |
| `000060162` | Gadget Text Selectable | **CAPTION** — short control caption |
| `000060163` | Gadget Text Background | **CAPTION** — short control caption |
| `000060164` | Gadget Default | **CAPTION** — short control caption |
| `000060165` | Gadget Default Selected | **CAPTION** — short control caption |
| `000060166` | Gadget Default Invert | **CAPTION** — short control caption |
| `000060167` | Gadget Action | **CAPTION** — short control caption |
| `000060168` | Gadget Action Selected | **CAPTION** — short control caption |
| `000060169` | Gadget Dialog | **CAPTION** — short control caption |
| `000060170` | Gadget Dialog Selected | **CAPTION** — short control caption |
| `000060171` | Gadget Drag | **CAPTION** — short control caption |
| `000060172` | Gadget Drag Selected | **CAPTION** — short control caption |
| `000060173` | Gadget Stat | **CAPTION** — short control caption |
| `000060174` | Gadget Stat Selected | **CAPTION** — short control caption |
| `000060175` | Gadget Slider | **CAPTION** — short control caption |
| `000060176` | Gadget Slider Selected | **CAPTION** — short control caption |
| `000060177` | Gadget Tabs | **CAPTION** — short control caption |
| `000060178` | Gadget Tabs Selected | **CAPTION** — short control caption |
| `000060179` | Gadget Tabs Over | **CAPTION** — short control caption |
| `000060180` | Gadget Tabs Text | **CAPTION** — short control caption |
| `000060181` | Gadget Tabs Text Selected | **CAPTION** — short control caption |
| `000060182` | Gadget Separator Dark | **CAPTION** — short control caption |
| `000060183` | Gadget Separator Light | **CAPTION** — short control caption |
| `000060184` | Menu Shortcut | **CAPTION** — short control caption |
| `000060185` | Layout Background | **CAPTION** — short control caption |
| `000060186` | Background Default | **CAPTION** — short control caption |
| `000060187` | Background Current | **CAPTION** — short control caption |
| `000060188` | Background Other | **CAPTION** — short control caption |
| `000060189` | Gadget Custom | **CAPTION** — short control caption |
| `000060190` | Gadget Custom Selected | **CAPTION** — short control caption |
| `000060191` | Gadget Border | **CAPTION** — short control caption |
| `000060192` | Gadget Text Background 2 | **CAPTION** — short control caption |
| `000060193` | Layer: Handle Grabbed | **CAPTION** — short control caption |
| `000060194` | Layer: Empty Instance Mark | **CAPTION** — short control caption |
| `000060195` | Layer: Handle Color 1 | **CAPTION** — short control caption |
| `000060196` | Layer: Handle Color 2 | **CAPTION** — short control caption |
| `011060150` | Notes Background | **CAPTION** — short control caption |
| `011060151` | Help Background | **CAPTION** — short control caption |
| `011060152` | Help Text | **CAPTION** — short control caption |
| `011060153` | Notification Background | **CAPTION** — short control caption |
| `011060154` | Notification Text | **CAPTION** — short control caption |
| `011060155` | Resolution scaling | **CAPTION** — short control caption |
| `011060156` | Icon set | **CAPTION** — short control caption |
| `011060157` | Locked windows visibility | **CAPTION** — short control caption |
| `011060158` | Power | **CAPTION** — short control caption |
| `011060159` | None | **CAPTION** — short control caption |
| `011060160` | Blur | **CAPTION** — short control caption |
| `011060161` | Mosaic | **CAPTION** — short control caption |
| `011060162` | Background | **CAPTION** — short control caption |
| `011060163` | Lighter | **CAPTION** — short control caption |
| `011060164` | Darker | **CAPTION** — short control caption |
| `011060165` | Empty | **CAPTION** — short control caption |
| `011060166` | Sets the visibility of locked windows.§\n\nYou can apply a blur, a mosaic, set the background lighter, darker or empty, or don't do the distintion | **HELP** — contains § — tooltip title "Sets the visibility of locked windows." + body |
| `011060167` | Adjust the visibility's power | **CAPTION** — short control caption |
| `011060168` | You need to restart TVPaint to use the new color scheme. | **TOOLTIP** — help text for the preceding caption |
| `011060169` | Flat | **CAPTION** — short control caption |
| `011060170` | Gives a flat aspect to the interface | **TOOLTIP** — help text for the preceding caption |
| `011060171` | Load a custom color space | **CAPTION** — short control caption |
| `011060172` | Save this color space | **CAPTION** — short control caption |
| `011060183` | Shortcut Panel: Normal Text | **CAPTION** — short control caption |
| `011060184` | Shortcut Panel: Selection | **CAPTION** — short control caption |
| `011060185` | Shortcut Panel: Search Results | **CAPTION** — short control caption |
| `011060186` | Shortcut Panel: Function Bound to a Key | **CAPTION** — short control caption |
| `012060000` | Camera time profile (Preview) | **CAPTION** — short control caption |
| `012060001` | Camera profile curve | **CAPTION** — short control caption |
| `012060002` | Camera profile handle | **CAPTION** — short control caption |
| `012060003` | Camera profile active handle | **CAPTION** — short control caption |
| `012060010` | Selected keys | **CAPTION** — short control caption |
| `012060011` | Key to overwrite | **CAPTION** — short control caption |
| `012060012` | Rigging : speed curve | **CAPTION** — short control caption |
| `012060013` | Rigging : Curve points | **CAPTION** — short control caption |
| `012060014` | Rigging : active curve points | **CAPTION** — short control caption |
| `012060015` | Rigging : Change current pose | **CAPTION** — short control caption |
| `012060016` | Rigging : Change selected pose | **CAPTION** — short control caption |

### 2.7 Interface ▸ Panels — multi-screen panels, taskbar, base panels

- **Page / tab:** Preferences ▸ Interface ▸ Panels
- **ID range:** 012021202 … 012060006  (7 entries, listed in ascending ID order)
- `012060004` `Base panels` / `012060005` `Reset default positions` + `012060006` tooltip.

| id | text | role |
|---|---|---|
| `012021202` | Multi-screen panels | **CAPTION** — short control caption |
| `012021203` | Drag'n drop the panels accross multiple screens | **CAPTION** — short control caption |
| `012021204` | Please restart the software to apply your modifications. | **TOOLTIP** — help text for the preceding caption |
| `012021205` | Panels in the taskbar | **CAPTION** — short control caption |
| `012060004` | Base panels | **CAPTION** — short control caption |
| `012060005` | Reset default positions | **CAPTION** — short control caption |
| `012060006` | Will reset positions for all default panels (timeline, color picker, etc...) to the default one from the original configuration. | **TOOLTIP** — help text for the preceding caption |

### 2.8 Drawing page — animated strokes, barbecue, smoothness, stencil, cut/delete modes, resampling, tablet, undo-opacity, scroll-lock, XSheet

- **Page / tab:** Preferences ▸ Drawing
- **ID range:** 000021138 … 012104010  (36 entries, listed in ascending ID order)
- `000121160`/`000121161` are the two pen-eraser modes (the captions for the radio pair are *not* in the file — only the two help sentences are).
- `009521139` `Wintab` / `009521140` `Use Wintab library§` and `010521141`–`010521144` `Stylus Only` are the tablet options (Android note).
- `011021165` `"Hide tool preview" checked in preferences` is a **warning message**, not a caption.

| id | text | role |
|---|---|---|
| `000021138` | Tablet | **CAPTION** — short control caption |
| `000021139` | SubPixel | **CAPTION** — short control caption |
| `000021140` | SubPixel Coordinates§\n\nIf checked, coordinates are got in a\nresolution bigger than pixel resolution.\nProblem can appear with some displays\nconfigurations or graphics tablets.\nThis option is recommended for free drawing. | **HELP** — contains § — tooltip title "SubPixel Coordinates" + body |
| `000121130` | Animated Strokes | **CAPTION** — short control caption |
| `000121131` | Change the current frame during drawing with CTRL | **CAPTION** — short control caption |
| `000121132` | When this option is activated and the CTRL key\nis pressed during drawing, each time the current brush is\napplied on the frame, it will be drawn on the next frame.\nWhen the last frame of the layer is reached, the process\nstarts again on the first frame. | **TOOLTIP** — help text for the preceding caption |
| `000121137` | Barbecue | **CAPTION** — short control caption |
| `000121138` | Burn my CPU and drain my battery to enhance my creativity. | **TOOLTIP** — help text for the preceding caption |
| `000121141` | Boost line smoothness | **CAPTION** — short control caption |
| `000121142` | Add some extra smoothness to your lines.\n\nThis option may impact performance when using some heavy brushes. | **TOOLTIP** — help text for the preceding caption |
| `000121143` | Prevent drawing on the stencil(s) | **CAPTION** — short control caption |
| `000121153` | Default cut mode | **CAPTION** — short control caption |
| `000121154` | Default delete mode | **CAPTION** — short control caption |
| `000121160` | The pen eraser is a freehand eraser. | **TOOLTIP** — help text for the preceding caption |
| `000121161` | The pen eraser is the same brush, but set to 'erase' mode. | **TOOLTIP** — help text for the preceding caption |
| `000121162` | Resampling Algorithm | **CAPTION** — short control caption |
| `000121163` | Legacy | **CAPTION** — short control caption |
| `000121164` | New | **CAPTION** — short control caption |
| `000121165` | The legacy resampling algorithm offers better performances during resize, rotation and transformation operations on low-end hardware.\nThe new algorithm offers better quality overall on high-end hardware. | **TOOLTIP** — help text for the preceding caption |
| `009521139` | Wintab | **CAPTION** — short control caption |
| `009521140` | Use Wintab library§ | **HELP** — contains § — tooltip title "Use Wintab library" + body |
| `010521141` | Stylus Only | **CAPTION** — short control caption |
| `010521142` | Stylus Only§\n\nIf checked, only the stylus can be used.\nFingers are not recognize anymore.\n\n(A finger triple-click allow to inactivate this option.) | **HELP** — contains § — tooltip title "Stylus Only" + body |
| `010521143` | (Only Android >= 4.X) | **TOOLTIP** — help text for the preceding caption |
| `010521144` | A finger triple-click disables this option. | **TOOLTIP** — help text for the preceding caption |
| `011021151` | Wintab | **CAPTION** — short control caption |
| `011021152` | Ink | **CAPTION** — short control caption |
| `011021165` | "Hide tool preview" checked in preferences | **TOOLTIP** — help text for the preceding caption |
| `011021180` | Undo layer opacity  | **CAPTION** — short control caption |
| `011021181` | If you uncheck this, the future changes of layer opacity will not be undoable | **TOOLTIP** — help text for the preceding caption |
| `011021200` | Scroll lock panels | **CAPTION** — short control caption |
| `011021201` | If you check this, the locked panels in the bins will also scroll | **TOOLTIP** — help text for the preceding caption |
| `011021212` | Double click to rename instance | **CAPTION** — short control caption |
| `011021213` | If you check this, you can rename an instance by double clicking on it. | **TOOLTIP** — help text for the preceding caption |
| `012104009` | Transformation Tools Preview Quality | **CAPTION** — short control caption |
| `012104010` | Change the preview quality of the Transform and Perspective tools to allow for better performances. This won't affect the final result quality, which depends on the AAliasing algorithm chosen in said tools. | **TOOLTIP** — help text for the preceding caption |

### 2.9 Save page — save alarm, TVPP compression, multi-backup

- **Page / tab:** Preferences ▸ Save
- **ID range:** 000121133 … 011074107  (20 entries, listed in ascending ID order)
- `000121135` `  minutes` has **two leading spaces** (suffix of a spinbox).
- `011021140` `Save Alarm Options§…` documents the three radio values `Inactivated` / `Warn me!` / `Auto Save`; the radio captions themselves are `011074104` `Deactivate`, `011074105` `Warn me!`, `011074106` `Auto Save` (and `011074107` `Disable alarm until next save` is the 4th state). These IDs live in the *Flips* region of the file but belong to the Save page.

| id | text | role |
|---|---|---|
| `000121133` | Save Alarm | **CAPTION** — short control caption |
| `000121134` | Activate/Inactivate the save alarm§\n\nThe save alarm reminds you to save at regular time intervals | **HELP** — contains § — tooltip title "Activate/Inactivate the save alarm" + body |
| `000121135` |  minutes | **CAPTION** — short control caption |
| `000121136` | Set the time in minutes that a project is allowed to be unsaved.§\n\nIf your project is still unsaved after this time, the save alarm will be activated. | **HELP** — contains § — tooltip title "Set the time in minutes that a project is allowed to be unsaved." + body |
| `000121139` | TVPP Compression | **CAPTION** — short control caption |
| `000121140` | Compress project's data while saving in .tvpp format. | **TOOLTIP** — help text for the preceding caption |
| `009521133` | Multi-Backup | **CAPTION** — short control caption |
| `009521134` | Set how many project backup files will be stored on the disk\n\nEach time the current project is saved, the previous\nsaved project file is renamed to conserve a backup file.\nThe number of backup files stored on the disk depends\non this option.\n\nThe format of the backup files name is:\nname_of_the_file.tvpp.YearMonthDay.HourMinutSecond\n(Example: MyProject.tvpp.20090717.150136) | **TOOLTIP** — help text for the preceding caption |
| `011021140` | Save Alarm Options§\n\n1) Inactivated : Inactivates Save Alarm.\n2) Warn me! : Save Alarm will ask you if you want to save.\n3) Auto Save : Will save automatically without any warning. | **HELP** — contains § — tooltip title "Save Alarm Options" + body |
| `011021145` | Sub-folder, in the same folder as the project file | **CAPTION** — short control caption |
| `011021146` | Same folder as project file | **CAPTION** — short control caption |
| `011021147` | Custom folder... | **CAPTION** — short control caption |
| `011021148` | Set Multi-Backup Directory | **CAPTION** — short control caption |
| `011021149` | Set the directory for the Multi-Backup option | **TOOLTIP** — help text for the preceding caption |
| `011021150` | Multi-Backup Directory | **CAPTION** — short control caption |
| `011021153` | Backup the current save too | **CAPTION** — short control caption |
| `011074104` | Deactivate | **CAPTION** — short control caption |
| `011074105` | Warn me! | **CAPTION** — short control caption |
| `011074106` | Auto Save | **CAPTION** — short control caption |
| `011074107` | Disable alarm until next save | **CAPTION** — short control caption |

### 2.10 Timeline ▸ General — time code, drawers, large/vertical timeline, XSheet, drag & drop pop-up

- **Page / tab:** Preferences ▸ Timeline ▸ General
- **ID range:** 000022832 … 011021206  (18 entries, listed in ascending ID order)
- `011021202` `If checked, toggles the XSheet Layer tab.` is the **tooltip**, and it sits *before* its caption `011021203` `Display XSheet tab` — an inverted caption/tooltip pair.
- `011021206` `Work in progress !` is a stub message for that feature.

| id | text | role |
|---|---|---|
| `000022832` | Display Time Code | **CAPTION** — short control caption |
| `000022833` | Display Time Code instead of frame numbers in the Timeline | **TOOLTIP** — help text for the preceding caption |
| `000022834` | Timeline | **CAPTION** — short control caption |
| `000121180` | Drawers | **CAPTION** — short control caption |
| `000121182` | Left | **CAPTION** — short control caption |
| `000121183` | Enable the Left Drawer | **TOOLTIP** — help text for the preceding caption |
| `000121184` | Right | **CAPTION** — short control caption |
| `000121185` | Enable the Right Drawer | **TOOLTIP** — help text for the preceding caption |
| `000121186` | Large Timeline | **CAPTION** — short control caption |
| `000121187` | With this option checked, the Timeline uses all\nthe width of the software window. In the contrary case,\nthe Timeline uses all the space available between the Left\nand Right drawers. | **TOOLTIP** — help text for the preceding caption |
| `000121188` | Vertical Timeline | **CAPTION** — short control caption |
| `000121189` | With this option checked, the Timeline becomes\nvertical, docked to the Right Drawer. | **TOOLTIP** — help text for the preceding caption |
| `000121190` | Instance Handle Size | **CAPTION** — short control caption |
| `011021202` | If checked, toggles the XSheet Layer tab. | **TOOLTIP** — help text for the preceding caption |
| `011021203` | Display XSheet tab | **CAPTION** — short control caption |
| `011021204` | Pop-up for drag and dropping images | **CAPTION** — short control caption |
| `011021205` | Sets the behavior when drag and dropping images in the timeline.§\n\nIf checked, a pop-up will appear when drag and dropping images and you will be able to choose between Move, Copy and Insert.\n\nIf unchecked, you will need to hold Ctrl to copy images and Shift to insert images. If no key is hold, images will be moved. | **HELP** — contains § — tooltip title "Sets the behavior when drag and dropping images in the timeline." + body |
| `011021206` | Work in progress ! | **LABEL** — label / list item / message |

### 2.11 Timeline ▸ Clip and Timeline ▸ Thumbnail

- **Page / tab:** Preferences ▸ Timeline ▸ Clip / Thumbnail
- **ID range:** 000021243 … 000021278  (9 entries, listed in ascending ID order)
- `000021273` `Clip Thumbnails` + `000021274` `Play on mouse hover` + `000021275` tooltip = Clip sub-page.
- `000021276` `Images / Instances Thumbnails` + `000021277` `Differentiate Empty Instances` + `000021278` `Put an X Mark on Empty Instances` = Thumbnail sub-page.
- `000021243`/`000021244`/`000021266` is the *Interface*-page thumbnail option (same wording, different ID) — kept here because it belongs to the thumbnail family.

| id | text | role |
|---|---|---|
| `000021243` | Images / Instances Thumbnails | **CAPTION** — short control caption |
| `000021244` | Always Show by Default | **CAPTION** — short control caption |
| `000021266` | Click here if you want to have your layer thumbnails always displayed by default | **TOOLTIP** — help text for the preceding caption |
| `000021273` | Clip Thumbnails | **CAPTION** — short control caption |
| `000021274` | Play on mouse hover | **CAPTION** — short control caption |
| `000021275` | Enable this to have the clip playing automatically inside the thumbnail, when you hover it in the project view. | **TOOLTIP** — help text for the preceding caption |
| `000021276` | Images / Instances Thumbnails | **CAPTION** — short control caption |
| `000021277` | Differentiate Empty Instances | **CAPTION** — short control caption |
| `000021278` | Put an X Mark on Empty Instances | **CAPTION** — short control caption |

### 2.12 Timeline ▸ Default config — default layer, pre/post behaviour, uncompacted timeline

- **Page / tab:** Preferences ▸ Timeline ▸ Default config
- **ID range:** 010083000 … 117101726  (22 entries, listed in ascending ID order)
- `010083000`–`010083011` is the **"Default config" colour-scheme save dialog** (`Default config`, scheme names, `Save color scheme`, `Name`, `Save to`, `OK`, `Cancel`).
- `110121326`–`110121334` are the default-layer parameters (`Default layer:`, `Auto break instance`, `Auto create frame`, `Pre behavior`, `Post behavior`, `On new project, lock first layer position`, `"Apply changes" flag enabled on load`).

| id | text | role |
|---|---|---|
| `010083000` | Default config | **CAPTION** — short control caption |
| `010083001` | TVPaint Animation | **CAPTION** — short control caption |
| `010083002` | TVPaint Animation Pro | **CAPTION** — short control caption |
| `010083003` | White | **CAPTION** — short control caption |
| `010083004` | Casa | **CAPTION** — short control caption |
| `010083005` | Aura | **CAPTION** — short control caption |
| `010083006` | Mirage | **CAPTION** — short control caption |
| `010083007` | Save color scheme | **CAPTION** — short control caption |
| `010083008` | Name | **CAPTION** — short control caption |
| `010083009` | Save to | **CAPTION** — short control caption |
| `010083010` | OK | **CAPTION** — short control caption |
| `010083011` | Cancel | **CAPTION** — short control caption |
| `110121326` | Default layer: | **CAPTION** — short control caption |
| `110121327` | Auto break instance | **CAPTION** — short control caption |
| `110121328` | Auto create frame | **CAPTION** — short control caption |
| `110121329` | Pre behavior | **CAPTION** — short control caption |
| `110121330` | Post behavior | **CAPTION** — short control caption |
| `110121331` | On new project, lock first layer position | **CAPTION** — short control caption |
| `110121332` | Sets the parameters for the default layer that is present when you open TVPaint Animation.§\n\nIt is possible to change the Autobreak instance, Auto create frame, Pre and Post behavior, and Lock position parameters. | **HELP** — contains § — tooltip title "Sets the parameters for the default layer that is present when you open TVPaint Animation." + body |
| `110121333` | Change this parameter | **TOOLTIP** — help text for the preceding caption |
| `110121334` | "Apply changes" flag enabled on load | **CAPTION** — short control caption |
| `117101726` | Uncompacted timeline at opening | **CAPTION** — short control caption |

### 2.13 Sound page — scrub mode, sampling rate, project sound, automatic sound panel

- **Page / tab:** Preferences ▸ Sound
- **ID range:** 000121300 … 000121316  (15 entries, listed in ascending ID order)
- `000121306` `  secs` has **two leading spaces** (spinbox suffix).

| id | text | role |
|---|---|---|
| `000121300` | Never | **CAPTION** — short control caption |
| `000121301` | Scrub | **CAPTION** — short control caption |
| `000121302` | Always | **CAPTION** — short control caption |
| `000121304` | Scrub Duration | **CAPTION** — short control caption |
| `000121305` | Set the duration of the Scrub in second. | **TOOLTIP** — help text for the preceding caption |
| `000121306` |  secs | **CAPTION** — short control caption |
| `000121308` | Scrub Mode | **CAPTION** — short control caption |
| `000121309` | Set the mode of the Scrub.§\n\nNever : never play the sound track\nScrub : play the sound track only during a scrub\nAlways : always play the sound track | **HELP** — contains § — tooltip title "Set the mode of the Scrub." + body |
| `000121310` | Sampling Rate | **CAPTION** — short control caption |
| `000121311` | Set the Sampling Rate.§\n\nAll of the imported sound tracks in TVPaint\nwill be converted to this sampling rate. | **HELP** — contains § — tooltip title "Set the Sampling Rate." + body |
| `000121312` | Hz | **CAPTION** — short control caption |
| `000121313` | Play project sound in clip | **CAPTION** — short control caption |
| `000121314` | Play project sound while the clip is playing | **CAPTION** — short control caption |
| `000121315` | Sound when export is complete | **CAPTION** — short control caption |
| `000121316` | Automatic sound panel | **CAPTION** — short control caption |

### 2.14 Paths page — plugin folders

- **Page / tab:** Preferences ▸ Paths
- **ID range:** 012104312 … 012104314  (3 entries, listed in ascending ID order)
- The five directory rows that the live Paths/General page shows reuse the General-page IDs `000021136`–`000021159` (Temp/Papers/Plugins/Mixers/Brush Directory) — there is no second copy of those captions.

| id | text | role |
|---|---|---|
| `012104312` | Paths | **CAPTION** — short control caption |
| `012104313` | Plugin Folders | **CAPTION** — short control caption |
| `012104314` | All the places to search for plugins. | **TOOLTIP** — help text for the preceding caption |

### 2.15 Network page — proxy settings

- **Page / tab:** Preferences ▸ Network
- **ID range:** 011021400 … 011021446  (21 entries, listed in ascending ID order)
- `011021430`–`011021435` = proxy scheme choices (`http`, `http 1.0`, `socks4`, `socks4a`, `socks5`, `socks5 hostname`).
- `011021440`–`011021446` = authentication method choices (`Basic`, `Digest`, `Negociate`, `NTLM`, `Digest IE`, `NTLM WB`, `Only`).

| id | text | role |
|---|---|---|
| `011021400` | Proxy | **CAPTION** — short control caption |
| `011021401` | Scheme | **CAPTION** — short control caption |
| `011021402` | Host | **CAPTION** — short control caption |
| `011021403` | Port | **CAPTION** — short control caption |
| `011021404` | Authentication | **CAPTION** — short control caption |
| `011021405` | User | **CAPTION** — short control caption |
| `011021406` | Password | **CAPTION** — short control caption |
| `011021407` | Test it! | **CAPTION** — short control caption |
| `011021430` | http | **CAPTION** — short control caption |
| `011021431` | http 1.0 | **CAPTION** — short control caption |
| `011021432` | socks4 | **CAPTION** — short control caption |
| `011021433` | socks4a | **CAPTION** — short control caption |
| `011021434` | socks5 | **CAPTION** — short control caption |
| `011021435` | socks5 hostname | **CAPTION** — short control caption |
| `011021440` | Basic | **CAPTION** — short control caption |
| `011021441` | Digest | **CAPTION** — short control caption |
| `011021442` | Negociate | **CAPTION** — short control caption |
| `011021443` | NTLM | **CAPTION** — short control caption |
| `011021444` | Digest IE | **CAPTION** — short control caption |
| `011021445` | NTLM WB | **CAPTION** — short control caption |
| `011021446` | Only | **CAPTION** — short control caption |

### 2.16 Startup page — starting project settings / template

- **Page / tab:** Preferences ▸ Startup (and the `Startup configuration` group on General)
- **ID range:** 000121320 … 000121350  (10 entries, listed in ascending ID order)
- `000121340` is the long `§` help text that explains the four radio values (`Last Project Settings`, `Startup Panel`, `Template`, `Load Last Opened Project`).

| id | text | role |
|---|---|---|
| `000121320` | Starting Project Settings | **CAPTION** — short control caption |
| `000121321` | Last Project Settings | **CAPTION** — short control caption |
| `000121322` | Startup Panel | **CAPTION** — short control caption |
| `000121323` | Template | **CAPTION** — short control caption |
| `000121324` | Load Last Opened Project | **CAPTION** — short control caption |
| `000121325` | Last used configuration | **CAPTION** — short control caption |
| `000121330` | Template | **CAPTION** — short control caption |
| `000121331` | None | **CAPTION** — short control caption |
| `000121340` | Select the starting project settings (Width/Height/Fields/FrameRate/...).§\n\nWhen the software starts, the first project settings can\nbe one of them:\n* Last Project Settings: Set the starting project settings\nto the settings of the last current project before quitting.\n* Startup Panel: Open the Startup Panel before starting the\nsoftware.\n* Template: A popup menu appears below to choose a Template\nto start with.\n* Load Last Opened Project: With this option, it is the last\nproject which will be load again at startup, and not only their\nsettings. | **HELP** — contains § — tooltip title "Select the starting project settings (Width/Height/Fields/FrameRate/...)." + body |
| `000121350` | Select the template to use for the starting project.§\n\nWhen the starting project setting is set on Template, this menu\nallows to choose all the different available templates. | **HELP** — contains § — tooltip title "Select the template to use for the starting project." + body |

### 2.17 Miscellaneous preference-related entries that do not fit a page

- **Page / tab:** various
- **ID range:** 000020404 … 011084006  (21 entries, listed in ascending ID order)
- `000021092` `- keyboard shortcut not available - ` is the placeholder shown when a function has no key.
- `011084004`–`011084006` are the **Clear Undo history** confirmation (`Clear Undo history`, the confirmation sentence, `Clear it !`). `011084005` is the **only** entry in the file with a stray CR byte before its `\n` escape (see note 3 in §5).
- `000028465` `Preferences...` and `011028495` `Shortcuts...` are the **Edit-menu entries** that open the two dialogs.
- `000020404` `Interface: Configure Keyboard` and `000020626` `Interface: Open Preferences Panel` are the *function names* that can be bound to a key.
- `011070057` `Keyboard Shortcuts` is a tab of the "Bin"/search panel, not the dialog.
- `0110740xx` are the Flips-panel shortcut fields (a different feature that happens to assign keys).
- `011030098` `Assign a shortcut` / `011030155` `Assign` belong to the layer-preset and preset-editor panels.

| id | text | role |
|---|---|---|
| `000020404` | Interface: Configure Keyboard | **CAPTION** — short control caption |
| `000020626` | Interface: Open Preferences Panel | **CAPTION** — short control caption |
| `000021092` | - keyboard shortcut not available -  | **LABEL** — label / list item |
| `000028465` | Preferences... | **CAPTION** — short control caption |
| `011028495` | Shortcuts... | **CAPTION** — short control caption |
| `011030098` | Assign a shortcut | **CAPTION** — short control caption |
| `011030155` | Assign | **CAPTION** — short control caption |
| `011070057` | Keyboard Shortcuts | **CAPTION** — short control caption |
| `011074027` | Shortcut | **CAPTION** — short control caption |
| `011074028` | Assign... | **CAPTION** — short control caption |
| `011074033` | Shortcut left | **CAPTION** — short control caption |
| `011074034` | Shortcut right | **CAPTION** — short control caption |
| `011074052` | Assign a shortcut for this flip. | **TOOLTIP** — help text for the preceding caption |
| `011074053` | The shortcut for this flip. | **TOOLTIP** — help text for the preceding caption |
| `011074056` | Assign a key for the right direction. | **TOOLTIP** — help text for the preceding caption |
| `011074057` | Assign a key for the left direction. | **TOOLTIP** — help text for the preceding caption |
| `011074058` | The shortcut for the right direction of the flip. | **TOOLTIP** — sentence-style help text (no §) |
| `011074059` | The shortcut for the left direction of the flip. | **TOOLTIP** — sentence-style help text (no §) |
| `011084004` | Clear Undo history | **CAPTION** — short control caption |
| `011084005` | This will clear the Undo/Redo stack.\r\nYou won't be able to Undo/Redo all the action in the current list. | **TOOLTIP** — help text for the preceding caption |
| `011084006` | Clear it ! | **CAPTION** — short control caption |

### 2.18 Shared control captions used by the Preferences pages

- **Page / tab:** Preferences (shared)
- **ID range:** 000021115 … 000121302  (11 entries, listed in ascending ID order)
- `OK`/`Cancel` for the dialog; `Apply`/`Reset` for the colour scheme; `Set`/`Set...` for the directory pickers; `Never`/`Scrub`/`Always` for the sound scrub mode; `Border`/`Mirror` for the interface theme toggles.

| id | text | role |
|---|---|---|
| `000021115` | OK | **CAPTION** — short control caption |
| `000021116` | Cancel | **CAPTION** — short control caption |
| `000021135` | Configure... | **CAPTION** — short control caption |
| `000021137` | Set... | **CAPTION** — short control caption |
| `000021146` | Set | **CAPTION** — short control caption |
| `000021222` | Apply | **CAPTION** — short control caption |
| `000021223` | Reset | **CAPTION** — short control caption |
| `000021303` | Mirror | **CAPTION** — short control caption |
| `000121300` | Never | **CAPTION** — short control caption |
| `000121301` | Scrub | **CAPTION** — short control caption |
| `000121302` | Always | **CAPTION** — short control caption |

## 3. Shortcuts panel — complete block inventory


### 3.1 Shortcuts dialog chrome — title, buttons, popup menus, legend

- **Page / tab:** Edit ▸ Shortcuts…  ("Configure Keyboard Shortcuts")
- **ID range:** 000019900 … 000019911  (12 entries, listed in ascending ID order)
- Live capture `shots/live-shortcuts-dialog.png`: title bar `Configure Keyboard Shortcuts`; top-left combo `File`; top-right `Search` field; bottom bar `Assign` | `Unassign`; bottom-right `OK` | `Cancel`; legend `Colors: [Search Results] [Shortcut Function Bound to Key]`.

| id | text | role |
|---|---|---|
| `000019900` | Configure Keyboard Shortcuts | **CAPTION** — short control caption |
| `000019901` | Assign | **CAPTION** — short control caption |
| `000019902` | Unassign | **CAPTION** — short control caption |
| `000019903` | Clear KeyMap | **CAPTION** — short control caption |
| `000019904` | Default KeyMap | **CAPTION** — short control caption |
| `000019905` | Load KeyMap | **CAPTION** — short control caption |
| `000019906` | Save KeyMap | **CAPTION** — short control caption |
| `000019907` | File | **CAPTION** — short control caption |
| `000019908` | Cannot open KeyMap | **LABEL** — label / list item / message |
| `000019909` | Search | **CAPTION** — short control caption |
| `000019910` | Cancel | **CAPTION** — short control caption |
| `000019911` | OK | **CAPTION** — short control caption |

### 3.2 Shortcuts dialog tooltips (the `§` help texts)

- **Page / tab:** Edit ▸ Shortcuts…
- **ID range:** 000019912 … 000019918  (6 entries, listed in ascending ID order)
- Each of these starts with the **caption** it documents, then `§`, then the body. `000019912` `Assign§…` explains the Ctrl-click multi-assign; `000019913` `Unassign§…`; `000019914` `Keymap File popup§…`; `000019916` `Result§…`; `000019917` `Keyboard keys§…`; `000019918` `TVPaint Animation Function§…`.
- There is **no** `000019915` in the file.

| id | text | role |
|---|---|---|
| `000019912` | Assign§\n\nClick on the keystroke on the left side\nand then on the function on the right side\nand then click this button to assign it.\n\nHolding the CTRL key while doing this will allow you to assign several functions to a single shortcut. | **HELP** — contains § — tooltip title "Assign" + body |
| `000019913` | Unassign§\n\nClick on the keystroke on the left side\nand then click this button to assign it | **HELP** — contains § — tooltip title "Unassign" + body |
| `000019914` | Keymap File popup§\n\nAllows the user to select, load\nand save keymaps. | **HELP** — contains § — tooltip title "Keymap File popup" + body |
| `000019916` | Result§\n\nShows the currently selected key\nor function and if it is assigned. | **HELP** — contains § — tooltip title "Result" + body |
| `000019917` | Keyboard keys§\n\nThese are the individual keys\non the keyboard. | **HELP** — contains § — tooltip title "Keyboard keys" + body |
| `000019918` | TVPaint Animation Function§\n\nThese are the functions that\ncan be assigned to the keys | **HELP** — contains § — tooltip title "TVPaint Animation Function" + body |

### 3.3 Keymap file / export / predefined keymaps

- **Page / tab:** Edit ▸ Shortcuts…
- **ID range:** 000019919 … 011019921  (4 entries, listed in ascending ID order)
- `000019919` `Export to a text file` and `010019919` `Export shortcuts` are the export button + its tooltip.
- `011019920` `Predefined keymaps` = the combo that holds `Fauxtoshop.cfg` etc. (`Resources/Default Config/keymaps/`).
- `011019921` `Reset to default` = the keymap reset action.

| id | text | role |
|---|---|---|
| `000019919` | Export to a text file | **CAPTION** — short control caption |
| `010019919` | Export shortcuts | **CAPTION** — short control caption |
| `011019920` | Predefined keymaps | **CAPTION** — short control caption |
| `011019921` | Reset to default | **CAPTION** — short control caption |

### 3.4 Key names shown in the "Keyboard keys" column

- **Page / tab:** Edit ▸ Shortcuts…
- **ID range:** 000019950 … 000019972  (21 entries, listed in ascending ID order)
- Modifier names: `Shift`, `Ctrl`, `Alt`, `Cmd`.
- **Duplicates:** `Tab` is `000019958` *and* `000019967`; `Space` is `000019957` *and* `000019968`.
- `000019969` `MMB` = middle mouse button; `000019972` `Cmd` = ⌘.

| id | text | role |
|---|---|---|
| `000019950` | Shift | **CAPTION** — short control caption |
| `000019951` | Ctrl | **CAPTION** — short control caption |
| `000019952` | Alt | **CAPTION** — short control caption |
| `000019953` | Up | **CAPTION** — short control caption |
| `000019954` | Down | **CAPTION** — short control caption |
| `000019955` | Left | **CAPTION** — short control caption |
| `000019956` | Right | **CAPTION** — short control caption |
| `000019957` | Space | **CAPTION** — short control caption |
| `000019958` | Tab | **CAPTION** — short control caption |
| `000019959` | Home | **CAPTION** — short control caption |
| `000019960` | End | **CAPTION** — short control caption |
| `000019961` | Insert | **CAPTION** — short control caption |
| `000019962` | Page Up | **CAPTION** — short control caption |
| `000019963` | Page Down | **CAPTION** — short control caption |
| `000019964` | Escape | **CAPTION** — short control caption |
| `000019965` | Backspace | **CAPTION** — short control caption |
| `000019966` | Del | **CAPTION** — short control caption |
| `000019967` | Tab | **CAPTION** — short control caption |
| `000019968` | Space | **CAPTION** — short control caption |
| `000019969` | MMB | **CAPTION** — short control caption |
| `000019972` | Cmd | **CAPTION** — short control caption |

### 3.5 Tablet buttons assignable in the Shortcuts dialog

- **Page / tab:** Edit ▸ Shortcuts…
- **ID range:** 000019975 … 000019982  (8 entries, listed in ascending ID order)
- `Tablet Left 1..4`, `Tablet Right 1..4`.

| id | text | role |
|---|---|---|
| `000019975` | Tablet Left 1 | **CAPTION** — short control caption |
| `000019976` | Tablet Left 2 | **CAPTION** — short control caption |
| `000019977` | Tablet Left 3 | **CAPTION** — short control caption |
| `000019978` | Tablet Left 4 | **CAPTION** — short control caption |
| `000019979` | Tablet Right 1 | **CAPTION** — short control caption |
| `000019980` | Tablet Right 2 | **CAPTION** — short control caption |
| `000019981` | Tablet Right 3 | **CAPTION** — short control caption |
| `000019982` | Tablet Right 4 | **CAPTION** — short control caption |

### 3.6 Shortcuts panel legend and its theme colours

- **Page / tab:** Edit ▸ Shortcuts…  /  Preferences ▸ Interface ▸ Theme
- **ID range:** 011060183 … 011060286  (7 entries, listed in ascending ID order)
- `011060280` `Colors: ` is the legend prefix (trailing space); `011060285` `Search Results`; `011060286` `Shortcut Function Bound to Key`.
- `011060183`–`011060186` are the four **theme swatch labels** for the Shortcuts panel (`Shortcut Panel: Normal Text`, `: Selection`, `: Search Results`, `: Function Bound to a Key`) — they live on the Theme page but colour the Shortcuts panel.

| id | text | role |
|---|---|---|
| `011060183` | Shortcut Panel: Normal Text | **CAPTION** — short control caption |
| `011060184` | Shortcut Panel: Selection | **CAPTION** — short control caption |
| `011060185` | Shortcut Panel: Search Results | **CAPTION** — short control caption |
| `011060186` | Shortcut Panel: Function Bound to a Key | **CAPTION** — short control caption |
| `011060280` | Colors:  | **CAPTION** — short control caption |
| `011060285` | Search Results | **CAPTION** — short control caption |
| `011060286` | Shortcut Function Bound to Key | **CAPTION** — short control caption |

### 3.7 The list of assignable TVPaint functions (the right-hand tree of the Shortcuts dialog)

The Shortcuts dialog's right pane is a tree of **function categories**, each holding the functions that can be bound to a key. The category names are **not** separate strings — they are the `Category: Function` prefixes of the ~1 000 action strings in the `000020xxx` / `011020xxx` / `012020xxx` / `010520xxx` / `010120xxx` ranges. The complete list of category prefixes found in the file (85 of them) is:

| category prefix | # actions | ID range |
|---|---|---|
| `320 kbps` | 1 | `012104163` … `012104163` |
| `4444 / 4444 XQ` | 1 | `012104162` … `012104162` |
| `Audio` | 7 | `000020760` … `000020759` |
| `Auto Fit§\n\nLMB ` | 1 | `000022356` … `000022356` |
| `Benchmark` | 5 | `000001410` … `000001415` |
| `Bookmarks` | 7 | `000020820` … `000020826` |
| `Brush` | 36 | `000020039` … `000020026` |
| `Camera` | 14 | `012020700` … `012020713` |
| `Can't move layer` | 2 | `012002853` … `012002854` |
| `Chooses the source ` | 1 | `011060011` … `011060011` |
| `Clip` | 4 | `000003138` … `000029651` |
| `Clipboard` | 4 | `000020000` … `000020004` |
| `Color` | 22 | `000020200` … `011020202` |
| `Color Panel` | 9 | `011020709` … `011020717` |
| `CTG Layer ` | 1 | `011085106` … `011085106` |
| `Custom Brush` | 1 | `000003139` … `000003139` |
| `Cutting tool` | 4 | `009581120` … `009581123` |
| `Display` | 15 | `000020850` … `011020855` |
| `Drawing Mode` | 29 | `000020930` … `000020979` |
| `Email ` | 1 | `000030253` … `000030253` |
| `English version` | 1 | `000000010` … `000000010` |
| `Error` | 4 | `011063126` … `011074211` |
| `Error ` | 1 | `011072024` … `011072024` |
| `File ` | 1 | `000002961` … `000002961` |
| `File Export` | 4 | `000020430` … `000020433` |
| `File Import` | 5 | `000020420` … `010020425` |
| `File malformed ` | 1 | `012104046` … `012104046` |
| `Filter` | 28 | `000020490` … `000020517` |
| `Filter ` | 4 | `000026300` … `000027700` |
| `Filters` | 3 | `000020590` … `000020592` |
| `For other programs` | 3 | `000020434` … `000020424` |
| `FX Stack` | 3 | `000020955` … `000020957` |
| `George Alert` | 1 | `011060173` … `011060173` |
| `Grab` | 5 | `000020860` … `000020864` |
| `Gradient` | 6 | `000020800` … `000020805` |
| `Grid` | 3 | `000020040` … `000020042` |
| `Guidelines` | 35 | `011020040` … `011020126` |
| `Guides` | 5 | `000020045` … `000020049` |
| `Image` | 5 | `000020445` … `000020449` |
| `Image Buffer` | 4 | `000020440` … `000020443` |
| `ImageMarks` | 113 | `000020811` … `011020870` |
| `Interface` | 144 | `012103986` … `000020014` |
| `Layer` | 234 | `000060193` … `121038068` |
| `Layer ` | 2 | `000020915` … `000020916` |
| `LoadExtension()` | 2 | `000070020` … `000070026` |
| `Mark In/Out` | 6 | `000020830` … `000020835` |
| `Perspective ` | 1 | `000026050` … `000026050` |
| `Preview` | 16 | `000020128` … `011020139` |
| `Printer` | 2 | `000020410` … `000020411` |
| `Project` | 84 | `000003137` … `000075135` |
| `Reference frame has changed ` | 1 | `011061100` … `011061100` |
| `Rename ` | 3 | `011085153` … `011085155` |
| `Rigging ` | 5 | `012060012` … `012060016` |
| `Roles` | 14 | `012104150` … `012114415` |
| `Scene` | 1 | `009580205` … `009580205` |
| `Select ` | 1 | `000021322` … `000021322` |
| `Select Mode` | 5 | `010120740` … `010120744` |
| `Selection` | 9 | `009581124` … `012002665` |
| `Set the layout§\n\n_ Overlay` | 1 | `011003260` … `011003260` |
| `Sets the jitter mode ` | 1 | `011062029` … `011062029` |
| `Shape` | 29 | `000020019` … `010520734` |
| `Shape Select` | 17 | `000020555` … `010520720` |
| `Shape Settings` | 8 | `012031170` … `012031177` |
| `Shape Transform` | 11 | `000020720` … `011020730` |
| `Shortcut Panel` | 4 | `011060183` … `011060186` |
| `Spare` | 2 | `000020140` … `000020141` |
| `Speedfill Assistant ` | 3 | `011085109` … `011085111` |
| `SpeedFill Brush` | 1 | `011020000` … `011020000` |
| `Telephone ` | 1 | `000030254` … `000030254` |
| `Timeline` | 27 | `000020112` … `000020752` |
| `Tools` | 39 | `000020015` … `010521004` |
| `Tools Healing` | 1 | `000020231` … `000020231` |
| `Tools Mode` | 3 | `000020706` … `000020708` |
| `Tools Option` | 35 | `000020454` … `100020460` |
| `Tools Pantograph` | 1 | `000020230` … `000020230` |
| `TVP (.tvp` | 1 | `011031080` … `011031080` |
| `TVP File Requester` | 2 | `011060188` … `011060189` |
| `TVPaint Animation` | 27 | `000020010` … `011020594` |
| `Twain` | 1 | `000020415` … `000020415` |
| `Undo` | 9 | `000020280` … `011020289` |
| `Video ` | 1 | `000030050` … `000030050` |
| `Video in` | 3 | `010085021` … `010085023` |
| `Warning` | 2 | `011063125` … `012043819` |
| `Wizard` | 1 | `011063111` … `011063111` |
| `Zoom` | 39 | `000020160` … `100020673` |

The categories visible in the live capture (`shots/live-shortcuts-dialog.png`) are: `Animator Panel`, `Audio`, `Bookmarks`, `Brush`, `Camera`, `Chalking`, `Clipboard`, `Color Panel`, `Color`, `Correction`, `Display`, `Drawing Mode`, `File Export`, `File Import`, `Flips`, `FX Stack`, `Grab Tools Panel`, `Grab`, `Gradient`, `Guidelines`, `Howard Winshurst Brushes`, `Image Buffer`, `Image`, `ImageMarks`, `Interface`, `Layer Preset`, `Layer`, `Mark In/Out`, `Nature`, `Paintbrushes`.

> **Important finding:** the entries `Animator Panel`, `Chalking`, `Correction`, `Grab Tools Panel`, `Howard Winshurst Brushes`, `Nature`, `Paintbrushes` **do not exist anywhere in the .loc file** (nor as ASCII/UTF-16 in `TVPaint Animation 12 Pro Demo.exe` / `Loader.dll`). They are the names of the **shipped custom-panel toolboxes** in `Resources/custompanels/`:
> `AnimatorPanel.bin`, `Chalks_v1.bin`, `Correction.bin`, `GrabTools.bin`, `Howard_ Wimshurst_Brushes_v1.bin`, `Nature_v1.bin`, `PaintBrushes_v1.bin`.
> So the Shortcuts tree mixes *built-in action categories* (localised) with *custom-panel toolbox names* (hard-coded/derived from the resource files). The `.loc` file only carries the first kind.

The left pane of the dialog shows **key → function** pairs such as `A  Zoom: Shake`, `B  Brush: Toggle CutBrush`, `Shift D  Tools: Open Preferences Panel` — those are rendered from the same `Category: Function` strings plus the key names of §3.4.

## 4. Every string in the file matching the requested keyword list

**883** of the 9 196 entries match. Entries already fully listed in §2/§3 are marked **[listed above]**; everything else is printed here so nothing is missed.

Keywords (case-insensitive): `preference`, `preferences`, `shortcut`, `keyboard`, `keymap`, `assign`, `unassign`, `undo size`, `cache`, `startup`, `temp dir`, `physical memory`, `theme`, `panel`, `language`, `sound`, `path`, `draw`, `timeline`, `clip`, `thumbnail`, `default config`, `general`, `interface`.

| id | text |
|---|---|
| `000060352` | Groups edition.§\n\nAt each line of this panel, it is possible\nto choose a group color and give it a name.\nTo change a group color, click on the wanted colored box,\nthen click anywhere in the software window\nto get the new group color.\nThe names of the groups can be changed in\nthe text fields near each box.\n\nNote: To reset all the groups,\njust click on the Reset button. |
| `000002367` | Path not found! |
| `000002373` | Clipboard is empty! |
| `000004070` | Path and File Name field |
| `000004077` | Thumbnail view |
| `000004085` | Close File Browser Panel |
| `000030710` | Configure Video§\nClick here to open the AVI Video configuration panel |
| `000030711` | Configure Audio§\nClick here to open the AVI Audio configuration panel |
| `000030014` | SoftClip |
| `010530910` | http://127.0.0.1:35980/core/importDrawing?deleteSource=1&path= |
| `011030921` | The resulting image is too large.\n\nThe size of the clip or the number of images must be reduced |
| `011062001` | General |
| `011062026` | Change the General or Brush parameters |
| `011062036` | Image source thumbnail |
| `000025920` | Expand / Collapse FX user interface |
| `011063002` | General |
| `011063014` | Change the General or Texture parameters. |
| `000029230` | Path |
| `000029231` | Path Name ? |
| `000029232` | New Path Name ? |
| `000029237` | Record a path |
| `000029269` | Draw |
| `000029381` | Average path |
| `000029382` | Smooth path |
| `000029383` | A minimum of 2 paths is required ! |
| `000029384` | A path is required ! |
| `000029429` | Draw stroke (mouse down) |
| `000029430` | Noise value§\nAdds random motion to the path. |
| `000029481` | Create a copy of the current path |
| `000029482` | Rename the current path |
| `000029483` | Delete the current path |
| `000029484` | Invert the current path in time |
| `000029487` | Path list |
| `000044037` | Clipboard |
| `000044671` | The color used to draw the plane in the HUD |
| `000044851` | Do you want to create planes from\n- open clips ?\n- current clip layers ? |
| `000044852` | Open clips |
| `000044853` | Layers from current clip |
| `000044870` | Select which open clips to stage.\nAdjust color coding.\nAdjust Z-depth. |
| `000042773` | Particle's Path |
| `000042774` | Emitter's Path |
| `000042846` | Particles follow path after it has been generated |
| `000027551` | Color of the shadow§\nClick on the color swatch and click on any color\nin the interface to be used as the shadow color. |
| `000028052` | Defines the reaction of the drawing on the borders. |
| `000043062` | Filling Gradient Preview (click in gradient watch to open gradient editor panel) |
| `000041916` | Current Clip |
| `000028971` | Path |
| `000028982` | Export to LW Motion path |
| `000028995` | Path Manager |
| `000002735` | Save Clip |
| `000025863` | Clip List |
| `000025865` | Clip: |
| `000025882` | Path Recorder |
| `000025884` | Path Manager |
| `000025886` | Copy From Path Bin |
| `000001071` | Clipboard |
| `000001111` | Numeric field§\n\nClick to enter a numeric\nvalue with the keyboard. |
| `009528810` | Clip |
| `010528811` | Custom Panels |
| `009528595` | Split Clip |
| `009528596` | Rename Clip... |
| `009528597` | New Clip |
| `009528598` | Duplicate Clip |
| `009528599` | Delete Clip |
| `009528605` | Clip Name |
| `011028612` | Merge clips |
| `000028455` | ClipBoard |
| `000028465` **[listed above]** | Preferences... |
| `011028495` **[listed above]** | Shortcuts... |
| `009528408` | Export Clip |
| `000028435` | Create New Clips |
| `012102792` | Open/Close the Timesheet Panel |
| `000028509` | Sound Tracks |
| `000028510` | Reload All Sound Tracks |
| `000028512` | Load Sound... |
| `000028518` | Remove All Sound Tracks! |
| `010528511` | Embed external sound track(s) into project/ on save |
| `000028703` | Timeline |
| `000028705` | Color Panel |
| `000028714` | Custom Panels |
| `000028721` | Custom Panel |
| `000028730` | Path Manager |
| `000028732` | Path Recorder |
| `000028733` | Drawing Recorder |
| `009528712` | Sound |
| `011028802` | Drawing |
| `000028355` | Enable/Disable Paper§\n\nRight click to open Paper panel.\nAllows the user to select from a group of paper types.\nPaper types can be images dropped in the papers directory. |
| `000028360` | Open/Close Tool panel |
| `000028361` | Open/Close Navigator panel |
| `000028362` | Open/Close Timeline |
| `000028363` | Open/Close Color panel |
| `000028364` | Open/Close Gradient panel |
| `000028365` | Open/Close Script panel |
| `000028366` | Open/Close Coordinates panel |
| `000028367` | Open/Close Remote panel |
| `000028368` | Open/Close FX Stack Panel |
| `000028369` | Open/Close Light Table Panel |
| `000028372` | Open/Close Custom Panel |
| `000028380` | Proxy rendering state's§\n\nRMB to open the Preview settings panel |
| `010528357` | Open/Close Guidelines Panel |
| `010528358` | Open/Close Share Manager Panel |
| `011028360` | Open/Close Image Library Panel |
| `011028384` | Open/close Main Panel |
| `012003519` | This Shortcut is not allowed on this type of layer. |
| `095191003` | Shortcuts |
| `110200215` | You cannot draw on this layer, because\nthe stencil function is enabled.\n\nTo colorize your lines: 1) disable the\nstencil function and 2) use the preserve\ntransparency function on your layer.\n\nIf you're experienced you can get rid of \nthis message from the preferences, in \nGeneral>Stencil. |
| `100200300` | Dear users,\n\nWe inform you that this 64 bit Mac version of TVPaint Animation 10 Professional Edition is very new and could need some adjustements.\nCurrently, in order to optimize the use of the software with a graphic tablet, the dock shall not be visible on screen.\nPlease, be sure to modify your preferences of the dock display.\nIf you have any comment to share, please inform us via our forum : https://forum.tvpaint.com\n\nThe TVPaint team. |
| `100200301` | Dear users,\n\nIf you notice some slowdowns, please uncheck the "Use OpenGL" option in the preferences panel.\nIf you have any comment to share, please inform us via our forum : https://forum.tvpaint.com\n\nThe TVPaint team. |
| `000029120` | Copy Info to Clipboard |
| `010029120` | Copied to clipboard ! |
| `011070103` | Paths previously used to search this dependency: |
| `011070110` | Missing sound dependencies |
| `011070111` | Alternative Paths |
| `011070113` | Ignore all sound dependencies |
| `011073023` | Marks each Holes§\nMakes it easier to see holes on the drawing. |
| `000060500` | Color Variations Panel |
| `011060512` | Custom panel from Color Variations |
| `000051081` | This Panel |
| `000051082` | All Panels |
| `010551000` | Custom Panel |
| `010551008` | Do you really want to delete this custom panel? |
| `010551009` | New Custom Panel |
| `010551010` | New Embedded Custom Panel |
| `010551011` | Generating custom panel... |
| `010551016` | Load a Custom Panel... |
| `011051099` | The panel position is locked! |
| `000151018` | Grab Custom Panel |
| `000151050` | Set an identification string for the exported TVPX file, internally in the TVPX file.§\n\nHere's an example : you make a panel containing a few brushes, you export it and give it the identification number "My_Brushes", and the name "My Brushes 1.0". \nWhen you decide to update it, you keep the identification "My_Brushes", and as you have updated it, you name it "My Brushes 1.1".\n\nSo, when someone will install it, TVPaint Animation will look if an existing panel has the same identification number, \nand if it founds one, it will consider that we are installing an update. |
| `000151052` | The Splash Screen Image.§\n\nSelect the Image which will be displayed during\nthe installation of the TVPX file.\n* None : No image\n* Current Image : the current image of the clip\n* Custom Brush : the current image of the custom brush\n* Grab Custom Panel : make a preview of the custom panel |
| `000151053` | Path of the license file.§\n\nThe license text will be displayed during the installation\nof the TVPX file. |
| `000151057` | Path of the file to save the TVPX file.§\n\nThe TVPX file will be saved with this name at this place. |
| `011051060` | Path empty. |
| `000021766` | Paper opacity§\n\nAdjusting the Paper opacity makes\nthe amount of effect the Paper has on\nthe drawing tool or brush.\nIt is adjusted using the slider next to\nthe number. |
| `000073000` | Drawing Recorder |
| `000073001` | Preview of the drawing.§\n\nThe Drawing Recorder allows to record and to store\nall the strokes made in the clip. Each stroke \nwill be added to the previous ones and they will be drawn\nin a new frame. The result of this feature is an animation\nwhich shows each step of your drawing and how your drawing\nhas been constructed. When your drawing is finished,\nit is possible to create a new clip containing the recording. |
| `000073002` | Current Frame.§\n\nThis Slider allows to change the current frame\nof the Drawing Recorder. |
| `000073003` | Start recording/Pause recording.§\n\nPress this button one first time to start recording\nthe drawing. When it is already recording, it is\npossible to pause/start again the recording\nby clicking on this same button. |
| `000073004` | Create a clip with the recording.§\n\nPress this button to create a clip with the recording.\nIt will then open up as an animation layer in a new clip.\nEach time this button is used, a new clip is created\ncontaining the recording. |
| `000073005` | Stop and Delete the current recording.§\n\nPress this button to delete all the recording.\nIf the recording has not been stored by creating\na new clip, it will be lost. |
| `000003136` | Export Sound Track |
| `000003138` | Clip: Layers structure    |
| `000003169` | This path doesn't exist ! Please choose an existing directory.\n\nCurrent path: |
| `000003186` | Close panel |
| `000003192` | Open File Format configuration panel |
| `000003201` | Export Animation with current Sound Track |
| `000003270` | The export path doesn't exist yet, so TVPaint \nwill create the intermediate folders.\n\nDo you agree to create these folders ? |
| `009503111` | EDL + Sound |
| `009503140` | Clip: Display    |
| `009503167` | Clip :  |
| `009503169` | Split Scenes/Clip in different files |
| `009503197` | Current Clip Parameters |
| `011003117` | Add a black border around the content with the current frame, the name of the project and clip, and the date. |
| `011031072` | Resets the MarkIn to the value according to the export panel current tab. |
| `011031073` | Resets the MarkOut to the value according to the export panel current tab. |
| `011031090` | Select the exporting structure of the clip§\n\nThe JSON structure exports the structure and images of the clip \nas they can be imported again in After Effects via a script |
| `012104144` | Export Storyboard Sound Track |
| `012104145` | Export animation with Sound Track from the storyboard |
| `011030951` | Set the file name pattern§\n\nThe file name will be computed from the pattern text by replacing those special characters:\n_ %[[0\| ]number]pfn: project (file) name\n_ %[[0\| ]number]cn: clip name\n---\n_ %[[0\| ]number]ln: layer name\n_ %[[0\| ]number]li: layer index\n---\n_ %[[0\| ]number]in: instance name\n_ %[[0\| ]number]ii: instance index\n---\n_ %[[0\| ]number]di: folder number (see folder pattern)\n_ %[[0\| ]number]fi: file number (to have an incremental number)\n\nThe text between brackets [] are optionals.\nThe symbol '\|' means 'or'.\n\nExample: \n%ln%05in      : "A00002"\n[%4ii] %ln    : "[0025] rough"\n[%fi] %ln-%in : "[15] background-key"\n-%5ii-%08in-  : "-00035-0000key-" |
| `011030952` | Set the folder name pattern§\n\nThe folder name will be computed from the pattern text by replacing those special characters:\n_ %[[0\| ]number]pfn: project (file) name\n_ %[[0\| ]number]cn: clip name\n---\n_ %[[0\| ]number]ln: layer name\n_ %[[0\| ]number]li: layer index\n---\n_ %[[0\| ]number]di: folder number (to have an incremental number)\n\nThe text between brackets [] are optionals.\nThe symbol '\|' means 'or'.\n\nExample: \n%ln          : "color"\n[%3li] %ln   : "[004] rough"\n%li_%ln      : "4_background"\n-%5li-%12ln- : "-00004-  background-"\n |
| `001204578` | Invalid export path. |
| `009580502` | \n\nThis clip name is not unique in the storyboard.\nA new file name will be generated. |
| `009580503` | \n\nThis clip name contains forbidden caracter(s) to create a valid filename.\nThe caracter(s) will be replaced by '_'. |
| `009580507` | Export of all the clips ... |
| `009580332` | Clip |
| `009580347` | Thumbnail View |
| `009580358` | Clip Background |
| `009580360` | Advanced Clip Options ... |
| `009580382` | More clip options for the export available here |
| `009580403` | Select the color of the clip background§\n\n_ The first color is the background of clips inside an even scene\n_ The second color is the background of clips inside an odd scene |
| `009580412` | Clips organization |
| `009580419` | One Clip per line |
| `009580429` | One clip per page |
| `009580455` | Select the organization of the Clip§\n\n_ Horizontal: all the Clip informations will be\ndisplayed one next to each other\n_ Vertical: all the Clip informations will be\ndisplayed one under each other |
| `009580457` | Select the separation between each Clip§\n\n_ No Separation: one Clip will be displayed\nnext to each other\n_ One Scene per line: all the Clips of the\nsame scene will be displayed on the same line\n_ One Clip per line: all the Clips will be\ndisplayed on a different line |
| `009580460` | Display/Hide the title of each clip |
| `009580465` | Display/Hide the informations of the clip§\n\nThe informations are:\n_ The scene number in which the clip is\n_ The clip number in the scene\n_ The duration of the clip in frame |
| `009580467` | Display/Hide the preview of each clip |
| `009580472` | Choose the Image View§\n\n_ Project View: the image will display\nthe project view\n_ Project View (with camera): the image\nwill display the project view with all camera\npositions and the path between them\n_ Optimal Project View (with camera): the image\nwill display the project view with all camera positions\nand the path between them, but the image will have\nthe size of the minimal bounding box of all camera\npositions |
| `009580475` | Display/Hide Action/Dialog/Notes part§\n\nIt is possible to choose what parts will be\ndisplayed for each clip. |
| `011019255` | Thumbnail infos |
| `011019256` | Clip related |
| `011019258` | Allows to choose if the thumbnail informations are related to the clip or to the project. |
| `095190060` | Thumbnail size |
| `095190080` | Choose the dimension of each thumbnail§\n\n_ if Small is selected, the thumbnails will be smaller than Medium,\nso there will be more thumbnails on each page.\n_ if Large is selected, the thumbnails will be larger than Medium,\nso there will be less thumbnails on each page. |
| `095190082` | Choose the content of each thumbnail§\n\n_ Camera Variable Size: the thumbnail represents the camera path\nin the project but keep only the optimal size of the camera path.\nEach thumbnail will have different size in the page. Its size can be\nseveral times a simple clip size.\n_ Camera Constant Size: the thumbnail represents the camera path\nin the project but keep only the optimal size of the camera path.\nIn this case, the size of the thumbnails never changes.\n_ Full Project Size: the thumbnail represents the camera path\nin the project. In this case too, the size of the thumbnails\nnever changes. |
| `095190084` | Choose the layout of the content of a page§\n\n_ Japanese: the clips in the page will be displayed\nfrom top to bottom\n_ Occidental: the clips in the page will be displayed\nfrom left to right |
| `095190088` | Show Hidden clips§\n\nSometimes some clips can be hidden in TVPaint Animation,\nby default, these clips don't appear in the page. \nBy checking this option, these hidden clips will appear\nin the page, but they will be cross out. |
| `095190090` | If checked show only thumbnails.\nUncheck fields Actions / Dialog / Notes. |
| `095190240` | Thumbnail View |
| `095190260` | Show only thumbnails |
| `095190265` | Show Hidden Clips |
| `095190266` | Show clip color |
| `100190090` | Frame allows you to select which image will be used as a thumbnail when printing your storyboard§ :\n\nThe first image from each clip (Clip Frame in),\nthe last image from each clip (Clip current frame),\nor the first bookmarked image from each clip (Bookmarks). |
| `100190091` | This option will display the color of the clip around the thumbnail. |
| `100190251` | Clip current frame |
| `100190252` | Clip frame in |
| `011074011` | Clip |
| `011074027` **[listed above]** | Shortcut |
| `011074028` **[listed above]** | Assign... |
| `011074033` **[listed above]** | Shortcut left |
| `011074034` **[listed above]** | Shortcut right |
| `011074045` | Defines the flip's limits.§\n\nThe limits can be the duration of the clip or the current layer, the Mark In/Out values, the Bookmarks, the Image Marks, or you can set your own limits. |
| `011074052` **[listed above]** | Assign a shortcut for this flip. |
| `011074053` **[listed above]** | The shortcut for this flip. |
| `011074056` **[listed above]** | Assign a key for the right direction. |
| `011074057` **[listed above]** | Assign a key for the left direction. |
| `011074058` **[listed above]** | The shortcut for the right direction of the flip. |
| `011074059` **[listed above]** | The shortcut for the left direction of the flip. |
| `000021925` | Adjust grid size manually§\n\nAllows the user to set the distance between the grid lines \nrunning on the both axis by drawing a box \nwith the left mouse on the screen. The height and width\nof the box become the size of the grid |
| `011022502` | Toggle Snap on the guide.§\n\nSnap will magnet the drawing on the\nguide when it's near the guide. |
| `011022503` | Toggle Assist.§\n\nThe drawing will follow the guide remotely.\nAssist will also affect Panning, Transform, Perspective, Warp and Crop Tools. |
| `011022517` | Toggle Snap on all the guides.§\n\nSnap will magnet the drawing on all the\nguides when it's near the guides. |
| `011022343` | Path |
| `011022352` | Image not found, select a new path for it? |
| `011022353` | Select the new image path... |
| `011022355` | Image path. |
| `011022443` | Image path |
| `010087007` | Remove all marks of the clip |
| `000003074` | Name used for creating new layer, new clip or new project |
| `000003084` | Close panel |
| `000953034` | New Clip |
| `000953060` | Clip |
| `095193063` | Clip |
| `095193064` | Clip-Image |
| `095193065` | Scene-Clip |
| `095193066` | Scene-Clip-Image |
| `000070024` | Sounds aren't installed inside TVPA[P].\nYou'll have to choose a folder on your drive to store them.\nDo you want to install them ? |
| `000070025` | Choose where to install the sounds. |
| `011030054` | Hold single image as current clip |
| `011030065` | Hold single image as current clip |
| `011030068` | From clip start |
| `011030069` | From clip end |
| `011030077` | To clip start |
| `011030078` | To clip end |
| `011030098` **[listed above]** | Assign a shortcut |
| `011030155` **[listed above]** | Assign |
| `011072025` | Create a clip in current project from this image |
| `012072030` | Path of the file to import |
| `012072104` | Order in Timeline |
| `012072109` | Order in Timeline |
| `012104256` | Please, select a sound to continue |
| `012104257` | Add sound |
| `012104259` | Add sound from library |
| `012172121` | Cannot move in the timeline in Rig mode |
| `012103807` | Bridge between clips |
| `009581200` | One Point Dot§\n\nDraw one point. |
| `009581201` | Dot§\n\nDraw a freehand dotted line. |
| `009581202` | Stroke§\n\nDraw a freehand stroke. |
| `009581203` | Filled Stroke§\n\nDraw a freehand stroke.\nAt the end, the shape is completed and filled. |
| `009581204` | Line§\n\nDraw a straight line. A first click starts the line,\na second click ends it. |
| `009581205` | Filled Line§\n\nDraw several straight lines.\nAt the end, the shape is completed and filled. |
| `009581206` | Rectangle§\n\nDraw a rectangle. |
| `009581207` | Filled Rectangle§\n\nDraw a filled rectangle. |
| `009581208` | Ellipse§\n\nDraw an ellipse. |
| `009581209` | 2 Pts Circle§\n\nDraw a circle by setting only 2 points. |
| `009581210` | 3 Pts Circle§\n\nDraw a circle by setting 3 points. |
| `009581211` | Filled Ellipse§\n\nDraw a filled ellipse. |
| `009581212` | Filled 2 Pts Circle§\n\nDraw a filled circle by setting only 2 points. |
| `009581213` | Filled 3 Pts Circle§\n\nDraw a filled circle by setting 3 points. |
| `009581214` | 3 Pts Spline§\n\nDraw a simple 3 points spline. |
| `009581215` | Bezier Spline§\n\nDraw a Bezier spline. |
| `009581216` | B-Spline Spline§\n\nDraw a B-Spline spline. |
| `009581217` | Filled Bezier Spline§\n\nDraw a filled Bezier spline. |
| `009581218` | Filled B-Spline Spline§\n\nDraw a filled B-Spline spline. |
| `009581301` | Help Draw |
| `009581501` | 2 Pts Ellipse§\n\nDraw an ellipse by setting only 2 points. |
| `009581502` | 3 Pts Ellipse§\n\nDraw a ellipse by setting 3 points. |
| `009581503` | Filled 2 Pts Ellipse§\n\nDraw a filled ellipse by setting only 2 points. |
| `009581504` | Filled 3 Pts Ellipse§\n\nDraw a filled ellipse by setting 3 points. |
| `009581505` | Circle§\n\nDraw a circle. |
| `009581506` | Filled Circle§\n\nDraw a filled circle. |
| `012002662` | Pen Brush Select§\n\nA brush that select an area by drawing it. |
| `000029000` | Main Panel |
| `000029050` | FreeHand Dot and Single Dot Shape§\nThis tool sketches in real-time but may\nnot draw a solid line. Right clicking\nbrings up its options. |
| `000029051` | FreeHandLine and FreeHandFill§\nAlways draws a solid line. Clicking on the icon again\nstarts the filled freehand mode. When a shape is drawn,\nit is always completed and filled. |
| `000029052` | Line and PolyFill§\nAlways draws a straight line. Left clicking tacs down\nright clicking completes. Clicking on the icon again\nstarts the filled freehand mode. When a shape is drawn\nand completed it is filled. |
| `000022176` | Close this panel |
| `009522106` | Clip: |
| `009599001` | Converting Clip |
| `010022109` | Current Clip:  |
| `010022112` | Clip Current Image:  |
| `000022432` | Drawing Area |
| `000021536` | Custom panel from current palette |
| `010521400` | Color Panel |
| `000029205` | Path Manager |
| `000029385` | Path 1 |
| `000029386` | Path 2 |
| `000029387` | Path 3 |
| `000029388` | Path 4 |
| `000029390` | Path |
| `000029392` | Smooth Path |
| `000029500` | Set Path 1 of the average function |
| `000029501` | Set Path 2 of the average function |
| `000029502` | Set Path 3 of the average function |
| `000029503` | Set Path 4 of the average function |
| `000029504` | Click here to Apply the Average Path function |
| `000029510` | Set the Path to smooth |
| `000029512` | Click here to Apply the Smooth Path function |
| `000029523` | Set the Path to Resize |
| `000029603` | Path |
| `000021100` **[listed above]** | Preferences |
| `000021110` **[listed above]** | Interface |
| `000021111` **[listed above]** | General |
| `000021113` **[listed above]** | Memory&Cache |
| `000021114` **[listed above]** | Sound |
| `000021117` **[listed above]** | Startup |
| `000021307` **[listed above]** | Active/Deactive the border option§\n\nCheck the box to active the border\naround each element of the interface. |
| `000021380` **[listed above]** | Active/Deactive the Mirror option§\n\nCheck the box in order to\ninvert the highlight effect\nof the interface. |
| `011021120` **[listed above]** | Drawing |
| `000121309` **[listed above]** | Set the mode of the Scrub.§\n\nNever : never play the sound track\nScrub : play the sound track only during a scrub\nAlways : always play the sound track |
| `000121311` **[listed above]** | Set the Sampling Rate.§\n\nAll of the imported sound tracks in TVPaint\nwill be converted to this sampling rate. |
| `000121313` **[listed above]** | Play project sound in clip |
| `000121314` **[listed above]** | Play project sound while the clip is playing |
| `000121315` **[listed above]** | Sound when export is complete |
| `000121316` **[listed above]** | Automatic sound panel |
| `000021183` **[listed above]** | DirectDraw |
| `000021187` **[listed above]** | Hide the brush while drawing |
| `000021196` **[listed above]** | Apply the gamma settings on the whole interface |
| `000021198` **[listed above]** | Real-time output vs re-draw\nwhen mouse is released.§\nIn real-time mode the toaster output\nis constantly updated. In non real-time mode\nthe output is updated when the mouse\nbutton is released. |
| `000021199` **[listed above]** | use RGB refresh mode for DirectDraw display instead of YUV |
| `000022833` **[listed above]** | Display Time Code instead of frame numbers in the Timeline |
| `000022834` **[listed above]** | Timeline |
| `000121180` **[listed above]** | Drawers |
| `000121183` **[listed above]** | Enable the Left Drawer |
| `000121185` **[listed above]** | Enable the Right Drawer |
| `000121186` **[listed above]** | Large Timeline |
| `000121187` **[listed above]** | With this option checked, the Timeline uses all\nthe width of the software window. In the contrary case,\nthe Timeline uses all the space available between the Left\nand Right drawers. |
| `000121188` **[listed above]** | Vertical Timeline |
| `000121189` **[listed above]** | With this option checked, the Timeline becomes\nvertical, docked to the Right Drawer. |
| `011021205` **[listed above]** | Sets the behavior when drag and dropping images in the timeline.§\n\nIf checked, a pop-up will appear when drag and dropping images and you will be able to choose between Move, Copy and Insert.\n\nIf unchecked, you will need to hold Ctrl to copy images and Shift to insert images. If no key is hold, images will be moved. |
| `000002001` | Please quit and restart the program\nto validate the new path |
| `000002002` | Bad Path |
| `000021129` **[listed above]** | Language |
| `000021134` **[listed above]** | Keyboard Shortcuts |
| `000021136` **[listed above]** | Temp Directory |
| `000021140` **[listed above]** | SubPixel Coordinates§\n\nIf checked, coordinates are got in a\nresolution bigger than pixel resolution.\nProblem can appear with some displays\nconfigurations or graphics tablets.\nThis option is recommended for free drawing. |
| `000021148` **[listed above]** | Click here to edit your keyboard shortcuts |
| `000021149` **[listed above]** | Click here to choose your temporary file directory§\n\nClick on the set button\nNavigate to the directory you wish to use as the Temp Dir\nClick OK |
| `000021150` **[listed above]** | temp directory |
| `000021153` **[listed above]** | Choose Language |
| `000121131` **[listed above]** | Change the current frame during drawing with CTRL |
| `000121132` **[listed above]** | When this option is activated and the CTRL key\nis pressed during drawing, each time the current brush is\napplied on the frame, it will be drawn on the next frame.\nWhen the last frame of the layer is reached, the process\nstarts again on the first frame. |
| `000121143` **[listed above]** | Prevent drawing on the stencil(s) |
| `011021200` **[listed above]** | Scroll lock panels |
| `011021201` **[listed above]** | If you check this, the locked panels in the bins will also scroll |
| `000021231` **[listed above]** | Panel |
| `000021242` **[listed above]** | Always behind Panel |
| `000021243` **[listed above]** | Images / Instances Thumbnails |
| `000021255` **[listed above]** | Set your cursor style while drawing§\n\nThis allows the user to change\nthe shape of the cursor used for drawing. |
| `000021259` **[listed above]** | Choose the file requester system (TVPaint Animation or Windows)§\n\nTVPaint Animation's file requestor allows the user to right click\non images, video clips and animations for instant veiwing.\nThe windows requestor allows for the creation of \nsub directories and is more commonly used in other applications. |
| `000021265` **[listed above]** | If On, Panels will be always in front of the project window |
| `000021266` **[listed above]** | Click here if you want to have your layer thumbnails always displayed by default |
| `000021267` **[listed above]** | Set the Highlight of the Interface§\n\nSet the value in the box or use the\nmini-slider on the right to ajust the\nhighlight of the interface. |
| `000021273` **[listed above]** | Clip Thumbnails |
| `000021275` **[listed above]** | Enable this to have the clip playing automatically inside the thumbnail, when you hover it in the project view. |
| `000021276` **[listed above]** | Images / Instances Thumbnails |
| `000060151` **[listed above]** | Panel Outline |
| `000060152` **[listed above]** | Panel Outline Light |
| `000060153` **[listed above]** | Panel Outline Dark |
| `000060154` **[listed above]** | Panel Background |
| `000060155` **[listed above]** | Panel Drag Bar |
| `000060156` **[listed above]** | Panel Drag Bar Selected |
| `000060157` **[listed above]** | Panel Title |
| `000060158` **[listed above]** | Panel System 1 |
| `000060159` **[listed above]** | Panel System 2 |
| `000060184` **[listed above]** | Menu Shortcut |
| `011021127` **[listed above]** | General |
| `011021128` **[listed above]** | Theme |
| `011021129` **[listed above]** | Panels |
| `011060170` **[listed above]** | Gives a flat aspect to the interface |
| `011060183` **[listed above]** | Shortcut Panel: Normal Text |
| `011060184` **[listed above]** | Shortcut Panel: Selection |
| `011060185` **[listed above]** | Shortcut Panel: Search Results |
| `011060186` **[listed above]** | Shortcut Panel: Function Bound to a Key |
| `011060286` **[listed above]** | Shortcut Function Bound to Key |
| `012021202` **[listed above]** | Multi-screen panels |
| `012021203` **[listed above]** | Drag'n drop the panels accross multiple screens |
| `012021205` **[listed above]** | Panels in the taskbar |
| `012043816` **[listed above]** | Import the selected custom settings from\n a .tvpsettings file. Shortcuts and FX\n Stacks presets will be added to their \nrespective preset lists. Custom Panels,\n Palettes and Mixers will be added or \nwill replace already exisiting ones if \nthey bear the same name. Imported Layer \nPresets and Color Groups will replace the\n existing ones. |
| `012060004` **[listed above]** | Base panels |
| `012060006` **[listed above]** | Will reset positions for all default panels (timeline, color picker, etc...) to the default one from the original configuration. |
| `012102152` **[listed above]** | Clicking on this button allows you to export all your custom settings -Shortcuts, Palettes, Custom Panels, FX Stack etc.- in a dedicated folder, which lets you to reimport them quickly later on. |
| `012102155` **[listed above]** | Enter a valid export path to be able to click on the OK button. |
| `010083000` **[listed above]** | Default config |
| `012002852` | Soundtrack Annotations |
| `000021133` **[listed above]** | Undo Size |
| `000021280` **[listed above]** | Cache usage |
| `000021281` **[listed above]** | Physical Memory |
| `000021285` **[listed above]** | Cache size |
| `000021291` **[listed above]** | Sets cache amount automatically§\n\nAutomatically sets the amount of\nmemory used for the undo buffer. |
| `000021292` **[listed above]** | Allows user to choose how much RAM is used for cache.\nThis setting directly effects the real-time preview playback |
| `000021293` **[listed above]** | Size of your cache§\n\nDisplays the current size\nod the cache. |
| `000021298` **[listed above]** | Clear the cache |
| `012104312` **[listed above]** | Paths |
| `000121322` **[listed above]** | Startup Panel |
| `000121340` **[listed above]** | Select the starting project settings (Width/Height/Fields/FrameRate/...).§\n\nWhen the software starts, the first project settings can\nbe one of them:\n* Last Project Settings: Set the starting project settings\nto the settings of the last current project before quitting.\n* Startup Panel: Open the Startup Panel before starting the\nsoftware.\n* Template: A popup menu appears below to choose a Template\nto start with.\n* Load Last Opened Project: With this option, it is the last\nproject which will be load again at startup, and not only their\nsettings. |
| `105121320` **[listed above]** | Startup configuration |
| `105121322` **[listed above]** | Open Startup Panel |
| `105121324` **[listed above]** | Open last project on startup |
| `105121327` **[listed above]** | Resetting the configuration will also delete your Custom Panels.\nYou will need to restart the software.\nProceed? |
| `117101726` **[listed above]** | Uncompacted timeline at opening |
| `011021122` **[listed above]** | General |
| `011021123` **[listed above]** | Timeline |
| `011021124` **[listed above]** | Clip |
| `011021125` **[listed above]** | Thumbnail |
| `011021126` **[listed above]** | Default config |
| `000028151` | Open the Settings panel§\nSetting include play all frames and time code. |
| `000021325` | Print your clip |
| `009530561` | Force the render of the Proxy\nbefore playing a project/clip |
| `000028250` | Set this to save the config.§\nYour config includes key board shortcuts\ntemp file location and extrenal filter location. |
| `000030452` | Play with sound when enabled |
| `000030487` | Center timeline§\n\nClick here to center the timeline on current instance and layer. |
| `011070000` | Clips in all projects |
| `011070001` | Images in current clip |
| `011070006` | Items in All Custom Panels |
| `011070050` | Clips |
| `011070056` | Custom Panels |
| `011070057` **[listed above]** | Keyboard Shortcuts |
| `000022971` | Drawing Smoothing§\n |
| `000022973` | Real Time Drawing Smoothing |
| `011022978` | Shows the HUD while drawing |
| `000074002` | Clip |
| `000074003` | Custom Panel |
| `000074051` | Unable to open the clip into the current project because they have not the same dimensions. |
| `000019900` **[listed above]** | Configure Keyboard Shortcuts |
| `000019901` **[listed above]** | Assign |
| `000019902` **[listed above]** | Unassign |
| `000019903` **[listed above]** | Clear KeyMap |
| `000019904` **[listed above]** | Default KeyMap |
| `000019905` **[listed above]** | Load KeyMap |
| `000019906` **[listed above]** | Save KeyMap |
| `000019908` **[listed above]** | Cannot open KeyMap |
| `000019912` **[listed above]** | Assign§\n\nClick on the keystroke on the left side\nand then on the function on the right side\nand then click this button to assign it.\n\nHolding the CTRL key while doing this will allow you to assign several functions to a single shortcut. |
| `000019913` **[listed above]** | Unassign§\n\nClick on the keystroke on the left side\nand then click this button to assign it |
| `000019914` **[listed above]** | Keymap File popup§\n\nAllows the user to select, load\nand save keymaps. |
| `000019916` **[listed above]** | Result§\n\nShows the currently selected key\nor function and if it is assigned. |
| `000019917` **[listed above]** | Keyboard keys§\n\nThese are the individual keys\non the keyboard. |
| `000019918` **[listed above]** | TVPaint Animation Function§\n\nThese are the functions that\ncan be assigned to the keys |
| `010019919` **[listed above]** | Export shortcuts |
| `011019920` **[listed above]** | Predefined keymaps |
| `011003221` | Clip |
| `000023018` | Config Path |
| `000023051` | Choose your config§\n\nYour config is your project size,\nKeyboard shortcuts, temp file location and more. |
| `010586027` | Create sound from tempo |
| `010586028` | Create sound from marks |
| `012103986` | Interface: Toggle Timesheet Panel |
| `012103990` | Different Roles can be assigned to frames. This can be done from TVPaint's Timesheet or its Timeline\nthrough a right click. Roles each have a specific symbol: |
| `012103951` | General |
| `012104019` | Invalid path |
| `000023382` | Draw |
| `011021165` **[listed above]** | "Hide tool preview" checked in preferences |
| `121023450` | Check this option to extend the colors under your drawings' outlines. |
| `009582200` | Load/Save/Reset commands§\n\n_Invert: invert the path of the camera\n_Load: load camera settings\n_Save: save the current camera settings\n_Reset: reset the current camera |
| `009582210` | Select the time profile of the camera§\n\nThis profile allows to modify the way that the camera\nwill move along path.\nThe time axis begins to the first frame and ends\nto the last frame.\nThe position axis begins to the first key point\nand ends to the last key point of the path.\n\nFor example: to make a back and forth camera move,\nselect the next to last preset in the Bin presets. |
| `009582220` | Select the interpolation between each key point§\n\n_Linear: straight line between each key point\n_Spline: curved lines are used to smooth the path |
| `000023150` | Set your speed sensitivity§\n\nAdjusts the amount of speed change needed\nfor the connection to effect the tool.\nHow fast do I have to draw before the \nconnection kicks in. |
| `000023662` | Click to edit the custom brush§\n\nBrings up the custom brush editing panel.\nAllows the user to apply opacity maps and\nother modifcation to the brush with \nreal-time preview. |
| `011060012` | Activates/Inactivates Continuous Rigidity Calculation.\nThe tool will compute the grid rigidity continuously \nwhile you're not using it.\nYou will find some balance in your drawing.\nWhen the result suits you, uncheck the function \nto deactivate it and stop computing. |
| `011060016` | Lets you to change the grid’s color. \nYou need to click on the little blue (by default) square to get a picker. \nYou will then be able to look for another color in the Color Panel or in the software’s interface.\nThe adjacent value (50% by default) allows you to modify this grid’s opacity.\n |
| `011060020` | Display the number of locked points§\n\nLocked points can be added with a right-click on selected point(s).\n\nNote:\n[Shift] + click (on 1 point): lock/unlock this point.\n[Shift] + left-click: draw an area to select several points.\n[Shift] + right-click: draw an area to deselect several points.\n[Ctrl] + left-click: move all the grid points.\n[Ctrl] + right-click: resize the grid.\n[Ctrl] + [Shift] + left-click: rotate all the grid points. |
| `000024050` | Linear Gradient§\nCreates a linear gradient pattern. Try dragging\nout a square. Then, left click and drag inside\nof the square from left to right to drag out the\ndirectional-length vector. If you want to invert or\nchange the effect of the gradient, this can be done\nin the gradient panel or by drawing the \ndirectional-length vector differently.\nTo open the gradient panel, right click on the gradient\nsample in the Filling Shape panel. |
| `000024051` | Spherical gradient§\nCreates a spherical gradient. Try dragging out a square.\nThen, left click and drag from the inside of the square to\nabout halfway to the edge to drag out the directional-length\nvector. If you want to invert the effect\nof the gradient, this can be done in the \ngradient panel or by drawing the directional-length\nvector differently. To open the gradient\npanel,  right click on the gradient sample in the\nFilling Shape panel. |
| `000024052` | Bi Linear Gradient§\nCreates a bi linear gradient pattern. Try dragging\nout a square. Then, left click and drag inside\nof the square from left to right to drag out the\ndirectional-length vector. If you want to invert or\nchange the effect of the gradient, this can be done\nin the gradient panel or by drawing the \ndirectional-length vector differently.\nTo open the gradient panel, right click on the gradient\nsample in the Filling Shape panel. |
| `000024053` | Radial Gradient§\nCreates a radial gradient pattern. Try dragging\nout a square. Then, left click and drag inside\nof the square from the center to the edge to drag out the\ndirectional-length vector. If you want to invert or\nchange the effect of the gradient, this can be done\nin the gradient panel or by drawing the \ndirectional-length vector differently.\nTo open the gradient panel, right click on the gradient\nsample in the Filling Shape panel. |
| `000024054` | Rectangular Gardient§\nCreates a rectangular gradient pattern. Try dragging\nout a square. Then, left click and drag inside\nof the square from the center to the edge to drag out the\ndirectional-length vector. If you want to invert or\nchange the effect of the gradient, this can be done\nin the gradient panel or by drawing the \ndirectional-length vector differently.\nTo open the gradient panel, right click on the gradient\nsample in the Filling Shape panel. |
| `000024061` | Brush Warping On/Off (disables the Gradient)§\n\nThis will fill any drawn filled shape with the current \ncustom brush. Use the height and width popups to stretch,\ntile or warp brushes to the new shape. |
| `000024062` | Gradient On/Off (disables the Brush Warping)§\n\nThis will fill any drawn filled shape with the current \ngradient. Also, when a shape is drawn to be filled with\na gradient, After drawing the shape, left click\nand drag a line across the shape. This line defines\nthe length and direction of the gradient. This line\ncan also extend beyond the limits of the shape to create\na gradient bigger than the shape itself. |
| `000024331` | Border color§\nUse this to adjust the boarder color of the brush.\nClick on the color swatch and click on the new \ncolor to be used. You can use any color from the interface |
| `000024334` | Glow color§\nUse this to adjust the glow color of the brush.\nClick on the color swatch and click on the new \ncolor to be used. You can use any color from the interface |
| `000024343` | Draw the text input Letter by Letter§\n\nUse this to apply text to a spline or circle |
| `000024344` | Draw the whole text input§\n\nUse this to preview the text as a brush |
| `000030653` | Open the video device's settings panel |
| `000019920` | Keyboard shortcut |
| `000020000` | Clipboard: Copy Image |
| `000020002` | Clipboard: Paste Image |
| `000020003` | Clipboard: Copy Brush |
| `000020004` | Clipboard: Paste Brush |
| `011020709` | Color Panel: A & B mode |
| `011020710` | Color Panel: Slider mode |
| `011020711` | Color Panel: Picker mode |
| `011020712` | Color Panel: Mixer mode |
| `011020713` | Color Panel: Palette mode |
| `011020714` | Color Panel: Chromatic Wheel mode |
| `011020715` | Color Panel: Color Variation mode |
| `011020716` | Color Panel: Switch to Next mode |
| `011020717` | Color Panel: Switch to Previous mode |
| `000020930` | Drawing Mode: 01 (Color) |
| `000020931` | Drawing Mode: 02 (Behind) |
| `000020932` | Drawing Mode: 03 (Erase) |
| `000020933` | Drawing Mode: 04 (Panto) |
| `000020934` | Drawing Mode: 05 (Merge) |
| `000020935` | Drawing Mode: 06 (Shade) |
| `000020936` | Drawing Mode: 07 (Light) |
| `000020937` | Drawing Mode: 08 (Colorize) |
| `000020938` | Drawing Mode: 09 (Tint) |
| `000020939` | Drawing Mode: 10 (Grain) |
| `000020940` | Drawing Mode: 11 (Smooth) |
| `000020941` | Drawing Mode: 12 (Noise) |
| `000020942` | Drawing Mode: 13 (Negative) |
| `000020943` | Drawing Mode: 14 (Sharp) |
| `000020944` | Drawing Mode: 15 (Emboss) |
| `000020945` | Drawing Mode: 16 (Solarize) |
| `000020946` | Drawing Mode: 17 (Saturate) |
| `000020947` | Drawing Mode: 18 (UnSaturate) |
| `000020948` | Drawing Mode: 19 (Add) |
| `000020949` | Drawing Mode: 20 (Sub) |
| `000020950` | Drawing Mode: 21 (Multiply) |
| `000020951` | Drawing Mode: 22 (Screen) |
| `000020952` | Drawing Mode: 23 (Alpha Diff) |
| `000020953` | Drawing Mode: 24 (Healing) |
| `000020975` | Drawing Mode: 25 (Overlay) |
| `000020976` | Drawing Mode: 26 (Burn) |
| `000020977` | Drawing Mode: 27 (Dodge) |
| `000020978` | Drawing Mode: 28 (Darken) |
| `000020979` | Drawing Mode: 29 (Lighten) |
| `011020111` | Guidelines: Panel: Collapse All |
| `011020112` | Guidelines: Panel: Uncollapse All |
| `011020113` | Guidelines: Panel: Toggle All |
| `000020260` | Interface: Open Main Menu |
| `000020262` | Interface: Toggle Main Menu |
| `000020263` | Interface: Close Main Menu |
| `000020310` | Interface: Toggle windows display |
| `000020315` | Interface: Close all windows |
| `000020404` **[listed above]** | Interface: Configure Keyboard |
| `000020405` | Interface: Next Cursor |
| `000020596` | Interface: Close Main Panel |
| `000020597` | Interface: Close Menu Bar |
| `000020598` | Interface: Toggle Main Panel |
| `000020599` | Interface: Toggle Menu Bar |
| `000020600` | Interface: Open Main Panel |
| `000020601` | Interface: Open Menu Bar |
| `000020602` | Interface: Toggle Tool Panel |
| `000020603` | Interface: Open Tool Panel |
| `000020604` | Interface: Close Tool Panel |
| `000020605` | Interface: Toggle Color Panel |
| `000020606` | Interface: Open Color Panel |
| `000020607` | Interface: Close Color Panel |
| `000020608` | Interface: Toggle Layer Panel |
| `000020609` | Interface: Open Layer Panel |
| `000020610` | Interface: Close Layer Panel |
| `000020611` | Interface: Toggle Navigator Panel |
| `000020612` | Interface: Open Navigator Panel |
| `000020613` | Interface: Close Navigator Panel |
| `000020614` | Interface: Toggle Gradient Panel |
| `000020615` | Interface: Open Gradient Panel |
| `000020616` | Interface: Close Gradient Panel |
| `000020617` | Interface: Toggle Coordinates Panel |
| `000020618` | Interface: Open Coordinates Panel |
| `000020619` | Interface: Close Coordinates Panel |
| `000020620` | Interface: Toggle Script Panel |
| `000020621` | Interface: Open Script Panel |
| `000020622` | Interface: Close Script Panel |
| `000020623` | Interface: Open Paper Panel |
| `000020624` | Interface: Open Guides Panel |
| `000020625` | Interface: Open Grid Panel |
| `000020626` **[listed above]** | Interface: Open Preferences Panel |
| `000020627` | Interface: Open Display Panel |
| `000020628` | Interface: Open Shape Settings Panel |
| `000020629` | Interface: Open Connection Panel |
| `000020630` | Interface: Inlay View |
| `000020631` | Interface: Open Ease Key Panel |
| `000020632` | Interface: Close Ease Key Panel |
| `000020633` | Interface: Toggle Ease Key Panel |
| `000020634` | Interface: Close Grid Panel |
| `000020635` | Interface: Toggle Grid Panel |
| `000020636` | Interface: Close Guides Panel |
| `000020637` | Interface: Toggle Guides Panel |
| `000020638` | Interface: Close Paper Panel |
| `000020639` | Interface: Toggle Paper Panel |
| `000020640` | Interface: Toggle Remote Panel |
| `000020641` | Interface: Open Remote Panel |
| `000020642` | Interface: Close Remote Panel |
| `000020643` | Interface: Open Video In Panel |
| `000020644` | Interface: Open Preview Settings Panel |
| `000020645` | Interface: Toggle FX Panel |
| `000020646` | Interface: Open FX Panel |
| `000020647` | Interface: Close FX Panel |
| `000020648` | Interface: Open Video Options Panel |
| `000020649` | Interface: Open Custom Panel |
| `000020660` | Interface: Toggle Light Table Panel |
| `000020661` | Interface: Open Light Table Panel |
| `000020662` | Interface: Close Light Table Panel |
| `000020665` | Interface: Open Path Manager Panel |
| `000020666` | Interface: Open Pixel Tracker Panel |
| `000020667` | Interface: Open Path Recorder Panel |
| `000020668` | Interface: Open Drawing Recorder Panel |
| `000020674` | Interface: Open Timeline Panel |
| `000020675` | Interface: Open XSheet Panel |
| `000020676` | Interface: Open Project Panel |
| `000020680` | Interface: Close Preview Settings Panel |
| `000020681` | Interface: Toggle Preview Settings Panel |
| `000020682` | Interface: Close Display Panel |
| `000020683` | Interface: Toggle Display Panel |
| `000020684` | Interface: Close Shape Settings Panel |
| `000020685` | Interface: Toggle Shape Settings Panel |
| `000020686` | Interface: Close Path Manager Panel |
| `000020687` | Interface: Toggle Path Manager Panel |
| `000020688` | Interface: Close Custom Panel |
| `000020689` | Interface: Toggle Custom Panel |
| `000020690` | Interface: Open Video Out Panel |
| `000020691` | Interface: Close Video Out Panel |
| `000020692` | Interface: Toggle Video Out Panel |
| `000020695` | Interface: Close Video Options Panel |
| `000020696` | Interface: Toggle Video Options Panel |
| `000020697` | Interface: Close Video In Panel |
| `000020698` | Interface: Toggle Video In Panel |
| `009520669` | Interface: Close Drawing Recorder Panel |
| `009520670` | Interface: Toggle Drawing Recorder Panel |
| `009520690` | Interface: Open Peg-Holes Registration Panel |
| `009520691` | Interface: Close Peg-Holes Registration Panel |
| `009520692` | Interface: Toggle Peg-Holes Registration Panel |
| `010020693` | Interface: Open Image Mark Panel |
| `010020694` | Interface: Close Image Mark Panel |
| `010020695` | Interface: Toggle Image Mark Panel |
| `010020696` | Interface: Open Stopwatch Panel |
| `010020697` | Interface: Close Stopwatch Panel |
| `010020698` | Interface: Toggle Stopwatch Panel |
| `010020699` | Interface: Open History Panel |
| `010020700` | Interface: Close History Panel |
| `010020701` | Interface: Toggle History Panel |
| `010520650` | Interface: Open Guidelines Panel |
| `010520651` | Interface: Close Guidelines Panel |
| `010520652` | Interface: Toggle Guidelines Panel |
| `010520660` | Interface: Open Share Manager Panel |
| `010520661` | Interface: Close Share Manager Panel |
| `010520662` | Interface: Toggle Share Manager Panel |
| `011020600` | Interface: Pin Left Drawer |
| `011020601` | Interface: Unpin Left Drawer |
| `011020602` | Interface: Toggle Left Drawer |
| `011020603` | Interface: Pin Right Drawer |
| `011020604` | Interface: Unpin Right Drawer |
| `011020605` | Interface: Toggle Right Drawer |
| `011020606` | Interface: Pin Timeline Panel |
| `011020607` | Interface: Unpin Timeline Panel |
| `011020608` | Interface: Toggle Timeline Panel |
| `011020609` | Interface: Pin L+R Drawers and Timeline |
| `011020610` | Interface: Unpin L+R Drawers and Timeline |
| `011020611` | Interface: Toggle L+R Drawers and Timeline |
| `011020613` | Interface: Unpin/Restore L+R Drawers and Timeline |
| `011020614` | Interface: Close/Restore L+R Drawers and Timeline |
| `011020620` | Interface: Open Layer Presets Manager |
| `011020650` | Interface: Open Image Library Panel |
| `011020651` | Interface: Close Image Library Panel |
| `011020652` | Interface: Toggle Image Library Panel |
| `011020670` | Interface: Open Flip Options Panel |
| `011020671` | Interface: Close Flip Options Panel |
| `011020672` | Interface: Toggle Flip Options Panel |
| `011020680` | Interface: Open Color Checker Panel |
| `011020681` | Interface: Close Color Checker Panel |
| `011020682` | Interface: Toggle Color Checker Panel |
| `011020705` | Interface: Open Layer Color Group |
| `011020706` | Interface: Close Layer Color Group |
| `011020707` | Interface: Toggle Layer Color Group |
| `011722549` | Interface: Panning & Zoom (held) |
| `012002530` | Interface: Pan (held with left click) |
| `012002531` | Interface: Zoom (held with left click) |
| `012002532` | Interface: Pan (held with right click) |
| `012002533` | Interface: Zoom (held with right click) |
| `012100666` | Interface: Rotation (held with left click) |
| `012100667` | Interface: Rotation (held with right click) |
| `000020915` | Layer : Sound: Load |
| `000020916` | Layer : Sound: Delete |
| `011020128` | Preview: Play the selected clip in project view |
| `000030915` | Project: Sound: Load a Sound Track |
| `000030916` | Project: Sound: Reload All Tracks |
| `000030917` | Project: Sound: Embed External Sound track(s) into project on save |
| `000075113` | Project: ReExport in EDL (Current clip, Original param.) |
| `000075114` | Project: ReExport in EDL (Current clip, Custom param.) |
| `000075140` | Project: New Project From Selected Clips |
| `000075141` | Project: Clip: Copy Current |
| `000075142` | Project: Storyboard: Change current view to thumbnail view. |
| `000075145` | Project: Storyboard: Change current view to timeline view. |
| `000075146` | Project: Storyboard: Open Clip |
| `000075147` | Project: New Projects for each delected Clips |
| `000020156` | Project: Clip: Insert Images After Current |
| `000020157` | Project: Clip: Insert Single Image After Current |
| `000020158` | Project: Clip: Insert Images Before Current |
| `000020159` | Project: Clip: Insert Single Image Before Current |
| `000020174` | Project: Clip: Save Current Clip |
| `000020370` | Project: Clip: Add Exposures |
| `000020371` | Project: Clip: Add Single Exposure |
| `000020923` | Project: Clip: Delete Image |
| `000020924` | Project: Clip: Duplicate Image |
| `000020925` | Project: Clip: Duplicate Single Image |
| `000020926` | Project: Clip: Split |
| `000075102` | Project: Clip: Duplicate |
| `000075103` | Project: Clip: Split |
| `000075104` | Project: Clip: Add |
| `000075105` | Project: Clip: Insert |
| `000075106` | Project: Clip: Remove |
| `000075120` | Project: Clip: Goto Previous |
| `000075121` | Project: Clip: Goto Previous with selection |
| `000075122` | Project: Clip: Goto Next |
| `000075123` | Project: Clip: Goto Next with selection |
| `000075124` | Project: Clip: Goto First |
| `000075125` | Project: Clip: Goto First with selection |
| `000075126` | Project: Clip: Goto Last |
| `000075127` | Project: Clip: Goto Last with selection |
| `011075106` | Project: Clip: Toggle Visibility |
| `011075107` | Project: Clip: Show |
| `011075108` | Project: Clip: Hide |
| `011075109` | Project: Clip: Rename |
| `011075124` | Project: Clip: Goto Head |
| `011075126` | Project: Clip: Goto Tail |
| `011075915` | Project: Clip: Delete Image (Keep empty) |
| `011075916` | Project: Clip: Delete Image (Fill gap from left) |
| `011075917` | Project: Clip: Delete Image (Fill gap from right) |
| `011075918` | Project: Clip: Delete Image (Stay put) |
| `012175103` | Project: Clip: Toggle loop mode between selected frames |
| `012175104` | Project: Clip: Convert selection to Loop mode limits |
| `012114409` | Roles: Assign Keyframe |
| `012114410` | Roles: Assign Breakdown |
| `012114411` | Roles: Assign Inbetween (To Do) |
| `012114412` | Roles: Assign Inbetween (Done) |
| `012114413` | Roles: Assign Special Inbetween (To Do) |
| `012114414` | Roles: Assign Special Inbetween (Done) |
| `012114415` | Roles: Assign None |
| `000021092` **[listed above]** | - keyboard shortcut not available -  |
| `000020112` | Timeline: Toggle Frames/Time Code |
| `000020125` | Timeline: Expand / Collapse Current Layer |
| `000020132` | Timeline: Zoom In |
| `000020133` | Timeline: Zoom Out |
| `000020910` | Timeline: Fit To Clip |
| `000020911` | Timeline: Fit To Selection |
| `000020912` | Timeline: Fit To Layer |
| `000020913` | Timeline: Fit To Keyframes |
| `000020920` | Timeline: Fit To Sound |
| `000020922` | Timeline: Fit To Frame |
| `012102322` | Timeline: Fit To Mark In-Mark Out |
| `012104118` | Timeline: Show/Hide Roles on Timeline |
| `012104119` | Timeline: Show/Hide Roles on Current Layer only |
| `951920922` | Timeline: Fit To Exposure Handle |
| `951920923` | Timeline: Switch to Next Tab |
| `951920924` | Timeline: Switch to Previous Tab |
| `951920925` | Timeline: Toggle Empty Instance Identification |
| `951920926` | Timeline: Toggle X Mark on Empty Instances |
| `000020753` | Timeline: Audio: Toggle |
| `000020754` | Timeline: Audio: Open |
| `000020755` | Timeline: Audio: Close |
| `000020747` | Timeline: Notes: Toggle Display |
| `000020748` | Timeline: Notes: Show |
| `000020749` | Timeline: Notes: Hide |
| `000020750` | Timeline: Notes: Toggle |
| `000020751` | Timeline: Notes: Open |
| `000020752` | Timeline: Notes: Close |
| `000020483` | Tools: Draw Dot |
| `000020014` | Interface: Close Window |
| `000020659` | Zoom: Fit Project Panel |
| `000009302` | Can't create cache file:\n%s\nUse default path |
| `000009303` | Flushing Memory Cache |
| `009523815` | Copy last point of previous clip |
| `009523816` | Copy first point of next clip |
| `009523820` | No Previous Clip |
| `009523821` | No Next Clip |
| `009523822` | Previous clip has no camera |
| `009523823` | Next clip has no camera |
| `011061014` | Reference Image for texture not found. Please adjust it in the Texturize Panel. |
| `011061027` | Lets you change the grid color.§\n\nClick on the blue (by default) square to get the picker. You can choose a color in the Color panel or in the software's interface. The adjacent value (50%% by default) can change the grid's opacity. |
| `011061033` | Display the number of locked points§\n\nLocked points can be added with a right-click on selected point(s).\n\nNote:\n[Shift] + click (on 1 point): lock/unlock this point.\n[Shift] + left-click: draw an area to select several points.\n[Shift] + right-click: draw an area to deselect several points.\n[Ctrl] + left-click: move all the grid points.\n[Ctrl] + right-click: resize the grid.\n[Ctrl] + [Shift] + left-click: rotate all the grid points. |
| `010085002` | Import clip |
| `010085004` | Duplicate clip |
| `010085019` | Split audio to clips |
| `010085025` | Delete selected clips |
| `010085027` | New clip |
| `010085028` | Delete clip |
| `010085030` | Move clip |
| `010085032` | Join clips |
| `010085053` | Split clip |
| `010085064` | Change sound track order |
| `010085075` | Change current clip |
| `010085076` | Hide clip |
| `010085079` | Move clip in scene |
| `010085080` | Modify clip limits |
| `010085104` | Merge Clips |
| `012104283` | Remove all Marks from current Clip |
| `000022357` | Pan around the project§\n\nLeft click and drag this button\nto pan around the image.\n\nKeyboard shortcut Alt+LMB |
| `000022359` | Enable / Disable the project background video§\n\nRight-click to open the Video In panel. |
| `000022365` | Rotate the view§\n\nClick with LMB and drag to modify\nview angle.\nClick with RMB to display rotation\nmenu.\n\nKeyboard shortcut CTRL+Alt+LMB |
| `000022366` | Show User Interface |
| `000022389` | Show Timeline Notes |
| `000029650` | Clip: Timeline  |
| `000029651` | Clip: XSheet  |
| `000071010` | Add a Sound Track |
| `000071012` | Delete a Sound Track |
| `000071014` | Move a Sound Track |
| `000071016` | Load a Sound Track |
| `000071023` | Load Sound... |
| `000071024` | Load a Sound Track.§\n\nWhen there is no Sound Track loaded,\nclick on the this button to select and\nto load one. |
| `000071025` | Optimized/Reduced Display.§\n\nThis feature allows to switch between the Optimized and the Reduced Display of the Sound Track.\nWith the Optimized Display, the preview of the Sound Track is extended\nand more new options become available. |
| `000071027` | The name of the Sound Track |
| `000071029` | Activate/Desactivate the Sound Track.§\n\nThis box Activates/Desactivates the playing of the Sound Track.\n\nNote: If the box of the MASTER Track is off, no sound will be played. |
| `000071031` | Different parameters of the Sound Track.§\n\nThese options are different for the MASTER Track and all the other Sound Track.\n* For the MASTER Track, it is possible to Load a new Sound Track.\nAnd there is an history of all the Sound Tracks which was loaded.\n* For the other Tracks, the Lock/Offset/Delete/Duplicate options appears. |
| `000071033` | The Sound Track Volume Slider.§\n\nThis Slider controls the volume of the sound Track.\n\nNote: If the slider of the MASTER Track is at its minimum, no sound will be played. |
| `000071035` | Preview of the Sound Track.§\n\nAll this graphical part represents the Preview of the Sound Track.\n* The yellow line represents the Sound over the time.\n* The blue straight lines can modify the Fade value. This Fade value\nincrease or decrease the Sound volume at the begining or the ending\nof the Sound Track. Just click on the blue squares and move them\nto change the Fade. |
| `000071036` | Load a Sound Track... |
| `000071041` | Lock the current Sound Track.§\n\nWhen a Sound is locked, it is yet impossible to modify it.\nIt can not be split, deleted, or its offset changed. |
| `000025001` | Fit to Clip |
| `000025006` | Fit to Sound |
| `000025093` | Clip |
| `000025149` | Sound |
| `000025150` | No Sound |
| `000025151` | Load Sound |
| `000025152` | Delete Sound |
| `000025155` | Load Sound File |
| `000025190` | Show Thumbnails |
| `000025314` | Create a key§\nCreates a key on the timeline for \nthe currently selected image and the \ncurrently selected filter variables |
| `000025315` | Delete a key§\nDeletes a key on the timeline for \nthe currently selected image and the \ncurrently selected filter variables |
| `000025319` | Sound Popup§\nThis is where WAV files can be loaded into TVPaint Animation.\nThey playback with the preview and can be saved\nout with an AVI. |
| `000025320` | Timeline§\n\nLeft clicking and dragging in this area\nwill scrub the clip. A clip can only be\nscrubbed to the end of the selected layer.\nA single left click in this area jumps to that frame. |
| `000025322` | Time sound area§\nThis area will display the loaded sound file's waveform.\nSound files can be offset by holding\ndown Ctrl and left clicking and dragging the waveform. |
| `000025330` | Fit popup§\nAllows user to fit the clip to the timeline window.\nAlso allows for fitting to keys and selections. |
| `000025331` | Interactive Zoom Ratio§\nClick and drag on this icon to interactively\nchange the zoom level on the timeline. |
| `000029660` | Select what you want to see§\n\nSelect the Project tab to see all\nclips of the current project.\nSelect the Clip: Timeline tab to see\nthe layers of your current clip.\n |
| `011085133` | Sound |
| `011085144` | Show timeline notes. |
| `011085145` | Show timeline sound. |
| `011085146` | Toggle the Color Group panel. |
| `011085170` | Thumbnail.§\n\nShows a thumbnail of the current frame. |
| `012104116` | Show-Hide Roles on Timeline |
| `000025588` | Add Empty Exposures§\n\nClick here to add empty exposures.\n\nA popup panel will ask you the number\nof exposures you want to add. |
| `000072014` | All the Display Modes of the Timeline Notes over the project window.§\n\nWith this menu, it is possible to display\nall the Timeline Notes over the project window\nduring its playing.\n* The first set of parameters allows to place the\nTimeline Notes at the wanted place over the project window.\n* The second set of parameters change the place where\nthe Notes will be read inside the Timeline Notes preview.\n* The third set of parameters contains the Size\nat which the Timeline Notes will be displayed over the project\nwindow. |
| `000072017` | Size of the Tool used in the Timeline Notes to draw.§\n\nLike the Size parameter of the tools in the software,\nthis option modify the Size of the Tool used in the Timeline Notes.\n\nNote: Each Tool has its own value for the Size option. |
| `000072021` | Set the Blue color in the Timeline Notes. |
| `000072023` | Set the Red color in the Timeline Notes. |
| `000072025` | Set the Black color in the Timeline Notes. |
| `000072027` | Clear all the content of the Timeline Notes. |
| `000072029` | Select the Eraser Tool.§\n\nThe Eraser Tool erase the strokes in the\nTimeline Notes independently of their colors. |
| `000072031` | Select the Pencil Tool.§\n\nThe Pencil Tool allows to draw in the\nTimeline Notes with the selected color. |
| `000072033` | Select the Color Eraser Tool.§\n\nThe Color Eraser Tool erases the strokes\nin the Timeline Notes which has the same color\nthan the one which is selected. |
| `000072035` | Select the Tint Tool.§\n\nThe Tint Tool changes the color of the strokes\nin the Timeline Notes by the one which is selected. |
| `000072037` | Erase all the strokes in the Timeline Notes of the selected color.§\n\nThis option allows to erase all the strokes in the\nTimeline Notes which are of the selected color. |
| `000072039` | Tint all the strokes in the Timeline Notes with the selected color. |
| `000072041` | Select the Move Tool.§\n\nWith this tool, it is possible to move all the Timeline Notes\nto position them at the wanted frame. After selecting\nthis Tool, click on the Timeline Notes and then drag them. |
| `000072043` | Select the Slice Tool.§\n\nThe Slice Tool splits the Timeline Notes and moves only\nthe right side of the Timeline Notes. Like the Move\nTool, click on the Timeline Notes and then when they are\ndragged, only the right side can be positioning. |
| `000072045` | Display vertical lines support over the Timeline Notes to synchronize the strokes with the images.§\n\nThis option display a vertical line over the Timeline Notes\nevery n-th images.\n\nNote: If the value is 0, no vertical lines will be\ndisplayed. |
| `000072047` | The Timeline Notes.§\n\nThis part is dedicated to the Timeline Notes.\nThe aim of this feature is to allow the user\nto add some comments/remarks/ideas/suggestions/notes\nover the animation on which he is working.\nThis Timeline Notes part is only a help for the animator,\nthey are played over the project window at the same\ntime than the animation is played in the software.\nOf course, they won't be added in the final\nanimation render. |
| `010072070` | Lock/Unlock the Timeline Notes. |
| `009580020` | Timeline of the Project§\n\nThis Timeline allows the display and the play\nof all the Clips in the current project.\nIt is also possible to add global sound tracks\nfor current the project in addition of the sound\ntracks of each clip. |
| `009580028` | Add a Clip before the current Clip |
| `009580029` | Add a Clip after the current Clip |
| `009580030` | Delete the current Clip |
| `009580031` | Duplicate the current Clip |
| `009580032` | Selects the Thumbnail View |
| `009580035` | Selects the Timeline View |
| `009580036` | Interactive Zoom Ratio§\n\nClick and drag on this icon to interactively\nchange the zoom level on the Timeline. |
| `009580038` | Merge clips§\n\nClick here to merge selected clip with the following one. |
| `009580057` |  FromClip |
| `011080039` | Split clip |
| `011080041` | Clips to Project |
| `011080042` | There is only one clip in the project. This option requires at least two clips. |
| `009571010` | Add a Sound Track |
| `009571012` | Delete a Sound Track |
| `009571014` | Move a Sound Track |
| `009571016` | Load a Sound Track |
| `009571025` | Optimized/Reduced Display.§\n\nThis feature allows to switch between the Optimized and the Reduced Display of the Sound Track.\nWith the Optimized Display, the preview of the Sound Track is extended\nand more new options become available. |
| `009571029` | Activate/Desactivate the Sound Track.§\n\nThis box Activates/Desactivates the playing of the Sound Track. |
| `009571031` | Different parameters of the Sound Track.§\n\nFor the current Track, the Lock/Offset/Delete/Duplicate options appears. |
| `009571033` | The Sound Track Volume Slider.§\n\nThis Slider controls the volume of the sound Track. |
| `009571036` | Load a Sound Track... |
| `009571041` | Lock the current Sound Track.§\n\nWhen a Sound is locked, it is yet impossible to modify it.\nIt can not be deleted, or its offset changed. |
| `009571045` | Split Track To Clips |
| `009580205` | Scene: %d Clip: %d/%d |
| `009580213` | Clip Removed |
| `009580220` | Rename Clip... |
| `009580221` | Add Clip after the current one |
| `009580222` | Add Clip before the current one |
| `009580223` | Delete Clip |
| `009580224` | Duplicate Clip |
| `009580225` | Hide Clip |
| `009580240` | Select Clip |
| `009580241` | Select Scene's Clips |
| `009580242` | Select all Clips |
| `009580254` | Create a new project from selected clips |
| `009580255` | All clips in one project |
| `009580256` | One project per selected clip |
| `010080243` | Select all same group clips |
| `009580105` | Clip |
| `000029708` | Clip |
| `000029712` | Clip:  |
| `000029808` | Select the Source Clip§\n\nSelect an available Clip in the list. |
| `000029818` | Add multiple Tweens§\n\nClick here to add multiple tweens\nfor each selected frame.\n\nA popup panel will appear to set\nthe number of tweens to add. |
| `000029820` | Delete multiple Tweens§\n\nClick here to delete multiple\ntweens for each selected frames.\n\nA popup panel will appear to set\nthe number of tweens to delete. |
| `000029841` | Lock/Unlock Layer§\n\nClick here to lock or\nunlock the layer.\n\nYou can't draw on a\nlocked layer. |

## 5. Notes, anomalies and things that were surprising

1. **`§` is the tooltip separator.** In TVPaint a tooltip entry is `Caption§\n\nBody text`. Many captions therefore exist twice: a bare caption ID *and* a `§` ID whose prefix repeats the caption (e.g. `000019901` `Assign` and `000019912` `Assign§\n\nClick on the keystroke…`). Tooltips that have no caption of their own are stored as plain sentences (`000021198`, `000021260`, `000021292`).
2. **Caption→tooltip order is not consistent.** Usually the caption has the lower ID and the tooltip the higher one (e.g. `000121137` `Barbecue` caption → `000121138` help; `011021200` `Scroll lock panels` caption → `011021201` help), but the XSheet pair is **inverted**: `011021202` `If checked, toggles the XSheet Layer tab.` (the help text) comes *before* `011021203` `Display XSheet tab` (the caption). Do not assume caption-first when pairing IDs.
3. **One entry contains a stray CR byte** — `011084005` reads `This will clear the Undo/Redo stack.\r\nYou won't be able to Undo/Redo all the action in the current list.` (a `0x0D` immediately before the `\n` escape). Every other entry in the file uses plain `\n` escapes and never a real line break.
4. **Real user-visible wording oddities worth reproducing verbatim:**
   * `000021198` `Real-time output vs re-draw\nwhen mouse is released.` — the caption itself contains a hard line break.
   * `000121135` `  minutes` and `000121306` `  secs` and `011060280` `Colors: ` — leading/trailing spaces are significant (spinbox suffixes).
   * `000021188` `Works  with a 16bits pixels depth only` — **double space** after "Works".
   * `000021296` `Are you sure you want to use OpenGL ?` — space before `?`.
   * `000021199` `use RGB refresh mode…` — lower-case start.
   * `000021221` `Color scheme`, `000021222` `Apply`, `000021223` `Reset` — note `Apply`/`Reset` are reused by the colour-scheme *and* the Default-config dialog.
   * `000021293` `Size of your cache§\n\nDisplays the current size\nod the cache.` — typo **"od"** (should be "of") is in the shipped file.
   * `000021292` `…directly effects the real-time preview playback` — "effects" instead of "affects".
   * `011021442` `Negociate` (one "c") — misspelling shipped in all localisations.
5. **Duplicate text under different IDs** is normal and intentional: `General` ×3, `Display` ×many, `Save`, `Drawing`, `Timeline`, `Clip`, `Sound`, `Interface`, `Undo`, `Tab` ×2, `Space` ×2, `Undo Size` (`000021133`), `Cache size` (`000021285`) and `Cache usage` (`000021280`).
6. **The `000021112` `Display` / `000021113` `Memory&Cache` / `000021117` `Startup` category names are NOT in the 12.1.0 tree.** They are leftovers from the older TVPaint 11 Preferences dialog (tabs: Interface / General / Display / Memory&Cache / Sound / Startup). The 12.1.0 tree uses `0110211xx` labels instead. `000021110` `Interface` and `000021114` `Sound` are shared by both generations.
7. **The `Network` node (`011021119`) has no content block of its own that is clearly labelled** — its only obvious content is the Proxy block `011021400`–`011021446`. It is not visible in the 12.1.0 demo tree.
8. **`Paths` (`012104312`) is nearly empty** — only `Plugin Folders` + `All the places to search for plugins.` The five directory rows reuse the General-page IDs (`000021136`–`000021159`).
9. **The Shortcuts tree mixes localised and non-localised labels** — see §3.7. The custom-panel names come from `Resources/custompanels/*.bin`, so they cannot be rebuilt from the `.loc` file alone.
10. **The `000021xxx` and `011021xxx` spaces both carry Preference text.** The `0000xxxxx` pool is the legacy string pool, the `0110xxxxx` pool is the current one the 12.1.0 UI draws, and the two overlap in *meaning* without sharing IDs — e.g. `000021165` `Hide tool preview (for all tools!)` (caption) vs `011021165` `"Hide tool preview" checked in preferences` (the warning raised when that option is on); `000021143` `Mixers Directory` (caption) vs `011021151` `Mixers directory` + `011021152` its tooltip.
11. **The file is not sorted.** Any tooling that reads it must sort by ID itself; and any tooling that maps "ID → string" must expect the same ID to be reused in a different context (e.g. `011021122` `General` is a *tree node*, `000021111` `General` is a *category list entry*).
12. The `Resources/Default Config/keymaps/Fauxtoshop.cfg` file maps keys → internal command names (`A=SelectShapePolygone`, `Shift A=ToggleToolPanel`, …). Those command names are **not** the `.loc` strings; the `.loc` gives the human-readable `Category: Function` labels the same commands are displayed with.
