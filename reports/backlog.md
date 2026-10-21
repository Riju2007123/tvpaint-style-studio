# The whole application - the 1:1 backlog

The rule for every part of TVPaint 12 that we rebuild:

1. **Look** - measured on the live application, pixel by pixel (the capture
   of the live, the same geometry in our panel, the same colours).
2. **Work** - the behaviour is real: the value is stored, the application
   reacts, and the application answers to the setting.
3. **Be exactly the same** - the wording, the icons, the colours and the
   sounds come from the resources TVPaint itself ships
   (`Resources/data/*.tvpaint.loc`, `Resources/colorschemes/*.ini`,
   `Resources/audio/*.wav`, `Resources/papers`, `Resources/icons`), and the
   internals are read from the decompilation of the live binary with REA.

## The method (the same for every panel)

| step | tool |
|---|---|
| the exact wording of every caption, label and tooltip | `tools/parse-loc.js` -> `reports/prefs-strings.md` (the ids of the live) |
| the internals (the class, the function, the style names) | REA on `TVPaint Animation 12 Pro Demo.exe` |
| the geometry and the colours | a capture of the running TVPaint + the measurement scripts |
| the comparison | `tools/compare.js` - our capture against the capture of the live, pixel diff |
| the catalogue of the commands | `reports/prefs-strings.md`, `menus.js`, `reports/timeline-evidence.md` |

## Where we are

| part | look | works | same resources |
|---|---|---|---|
| menu bar + the 11 menus | done | done | the labels come from the .loc of the live |
| the menus of the pop ups (windows, custom panels) | done | done | idem |
| the canvas / the drawing tools | done | done | the papers and the brushes of the live |
| the Main Panel, the Tool panel, the Color panel | done | done | idem |
| the layer panel, the timeline, the notes, the sound panel | done | done | idem |
| the export panel (all the tabs, the slate, the frame slider) | done | done | the papers of the live |
| the printer config | done | done | - |
| **Edit > Shortcuts...** | **done** | **done** | the colours of the live (--tv-key-*) |
| **Edit > Preferences...** (12 pages, 164 controls) | **done** | **done** | the .loc, the .ini of the colours, the .wav |
| the language (english / french / japanese / chinese) | done | done | the .loc of the live |
| the file requester / the workspaces / the rooms | to do | to do | - |
| the XSheet tab of the timeline | to do | to do | - |
| the audio engine (the scrub, the metronome) | to do | to do | the .wav of the live |
| the tablet (Wintab / Ink) | to do | to do | - |
| the .tvpp format (the project of the live) | to do | to do | - |
| the video plug-ins of the live (AVI / QuickTime / MPEG) | to do | to do | - |

## The rule for the next panel

Never "close enough": a panel is only done when the comparison against
the capture of the live is empty, the controls do what the live does, and
the wording comes from the .loc of the live.
