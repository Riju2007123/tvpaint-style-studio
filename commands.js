/* ------------------------------------------------------------------
   TVPaint's COMMAND TABLE.

   The command names below were extracted from the executable with REA:
   every command is registered with FUN_1406e0470 and the names are the
   string literals of the ~500 command table builders.  This is the same
   inventory TVPaint itself uses, so the panels, the menus and the keys
   carry TVPaint's own names.

   The dockable windows of TVPaint are the Open / Close / Toggle Panel
   commands:

     Main        Palette(Color)  Tool         Timeline     Project
     XSheet      Chrono         ColorChecker ColorGroup   DisplayOption
     Effect      Guideline      ImageMark    LT(Light Table)
     LibraryImage Menu          Navigator    PathManager  PixelTracker
     PreviewSet  ProjectRecorder Remote       ShapeSettings
     ShareServices StrokeRecorder Undo        VideoIn
     ConnectionSettings  Settings
   ------------------------------------------------------------------ */
const TV_PANEL_COMMANDS = [
  { cmd: "ToggleMainPanel", panel: "main", title: "Main Panel" },
  { cmd: "TogglePalettePanel", panel: "color", title: "Color Panel" },
  { cmd: "ToggleToolPanel", panel: "tool", title: "Tools" },
  { cmd: "ToggleTimelinePanel", panel: "timeline", title: "Timeline" },
  { cmd: "ToggleProjectPanel", panel: "project", title: "Project" },
  { cmd: "ToggleXSheetPanel", panel: "xsheet", title: "XSheet" },
  { cmd: "ToggleChronoPanel", panel: "chrono", title: "Chrono" },
  { cmd: "ToggleColorCheckerPanel", panel: "colorchecker", title: "Color Checker" },
  { cmd: "ToggleColorGroupPanel", panel: "colorgroup", title: "Color Group" },
  { cmd: "ToggleDisplayOptionPanel", panel: "displayoption", title: "Display Option" },
  { cmd: "ToggleEffectPanel", panel: "fxstack", title: "Effects" },
  { cmd: "ToggleGuidelinePanel", panel: "guideline", title: "Guidelines" },
  { cmd: "ToggleImageMarkPanel", panel: "imagemark", title: "Image Mark" },
  { cmd: "ToggleLTPanel", panel: "lt", title: "Light Table" },
  { cmd: "ToggleLibraryImagePanel", panel: "library", title: "Library" },
  { cmd: "ToggleMenuPanel", panel: "menu", title: "Menu" },
  { cmd: "ToggleNavigatorPanel", panel: "navigator", title: "Navigator" },
  { cmd: "TogglePathManagerPanel", panel: "pathmanager", title: "Path Manager" },
  { cmd: "TogglePixelTrackerPanel", panel: "pixeltracker", title: "Pixel Tracker" },
  { cmd: "TogglePreviewSetPanel", panel: "previewset", title: "Preview Set" },
  { cmd: "ToggleProjectRecorderPanel", panel: "projectrecorder", title: "Project Recorder" },
  { cmd: "ToggleRemotePanel", panel: "remote", title: "Remote Control" },
  { cmd: "ToggleShapeSettingsPanel", panel: "shapesettings", title: "Shape Settings" },
  { cmd: "ToggleShareServicesPanel", panel: "share", title: "Share Services" },
  { cmd: "ToggleShareServiceManagerPanel", panel: "sharemanager", title: "Share Manager" },
  { cmd: "ToggleStrokeRecorderPanel", panel: "strokerecorder", title: "Stroke Recorder" },
  { cmd: "ToggleUndoPanel", panel: "undo", title: "Undo" },
  { cmd: "ToggleVideoInPanel", panel: "videoin", title: "Video In" },
  { cmd: "ToggleLineSmoothingPanel", panel: "smoothing", title: "Line Smoothing" },
  { cmd: "ToggleFlipPanel", panel: "flip", title: "Flip" },
  { cmd: "OpenConnectionSettingsPanel", panel: "connection", title: "Connection Settings" },
  { cmd: "OpenSettingsPanel", panel: "settings", title: "Settings" }
];
// the commands TVPaint registers for the camera (the command table builder
// FUN_1405d30e0) - four independent channels, each with its own keys
const TV_CAMERA_COMMANDS = [
  "CameraAddKey", "CameraAddPositionKey", "CameraAddRotationKey",
  "CameraAddZoomKey", "CameraAddSizeKey",
  "CameraDeleteKey", "CameraDeletePositionKey", "CameraDeleteRotationKey",
  "CameraDeleteZoomKey", "CameraDeleteSizeKey",
  "CameraMoveToNextKey", "CameraMoveToPreviousKey",
  "CameraMoveToFirstKey", "CameraMoveToLastKey",
  "CameraCurrentMode", "CameraData", "CameraPath", "CameraPrecisionAngle",
  "CameraSafeArea", "CameraSafeAreaBorderIn", "CameraSafeAreaBorderOut",
  "CameraSizeX", "CameraSizeY", "CameraWidth", "CameraHeight",
  "CameraMultiplierWidth", "CameraMultiplierHeight", "Camera43Border",
  "CameraCalibration1", "CameraCalibration2", "CameraSerialNumber"
];
