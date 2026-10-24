# TVPaint 12 compatibility status

This is a behavior and layout compatibility project. Implementations are original; this report does not treat TVPaint's executable as a source-code donor.

## Baseline gathered

- The reference is the installed TVPaint Animation 12.1.0 Pro Demo x64 executable, SHA-256 `c998c6fe9d14e0a4d23726f2b667f1406f72631de2ab20aa52c34a3c97432c2a`.
- REA's read-only PE resource inventory completed with **106 directory entries / 50 resources** (Evidence `ev_d4629040ef773114a9d3da709bebf42e2eba956fc5ef316254e71a061dcd81b2`). The inventory confirms resource structure and hashes; it does not establish how the app loads those resources or how its features behave.
- The install has `Resources` groups for `data`, `icons`, `custompanels`, `plugins`, `colorschemes`, `audio`, `papers`, `cursors`, and `storyboard`, plus Qt runtime libraries.
- The existing captures document the 1936x1048 shell, toolbar positions, 18 Main Panel icons in a 6x3 grid, the brush panel, and many menu/preferences/timeline states. REA's native UI capture provider is unavailable on this Windows host, so interactive states must be supported by already saved captures or a new capture path that works on Windows.

## Verified tool-strip correction

- The live capture labels the selected drawing tool `Pen Brush`; the clone had shown `FreeHand Line`. The clone label is corrected.
- `Perspective` was incorrectly aliased to `Transform`, and `Crop` to rectangular selection. Those aliases are removed. Both remain visibly listed but report as unsupported until their separate behavior is implemented and observed.
- The existing evidence names only five of the 18 Main Panel tools with confidence. The remaining icon-to-name mappings still need tooltip/runtime confirmation; their current labels are not considered verified merely because they appear in the grid.

## Backlog recorded by the project

The existing `reports/backlog.md` lists these as unfinished: file requester/workspaces/rooms, XSheet, audio scrub/metronome, tablet input (Wintab/Ink), `.tvpp` project format, and video plug-ins. Its other rows are previous project claims, not a fresh independent verification of every interaction.

## Remaining audit rule

For each feature group, record the observed location and labels, activation/shortcut, state changes, undo behavior, and edge cases. Mark it verified only after comparing a saved reference capture with the clone and exercising the behavior. Missing runtime evidence stays explicitly unknown; it is not filled in by guessing from binary pseudocode.
