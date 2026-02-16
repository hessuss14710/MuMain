; MU Giloria - NSIS Installer Script
; Generates a Windows installer from Linux using makensis

;--------------------------------
; Includes
!include "MUI2.nsh"
!include "FileFunc.nsh"

;--------------------------------
; General
Name "MU Giloria Season 6"
OutFile "MuGiloria-Setup.exe"
Unicode True
InstallDir "$LOCALAPPDATA\MU Giloria"
InstallDirRegKey HKCU "Software\MU Giloria" "InstallDir"
RequestExecutionLevel user

;--------------------------------
; Interface Settings
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "MU Giloria Season 6"
!define MUI_WELCOMEPAGE_TEXT "Este asistente instalara MU Giloria Season 6 en tu equipo.$\r$\n$\r$\nSe recomienda cerrar todas las aplicaciones antes de continuar.$\r$\n$\r$\nPulsa Siguiente para continuar."
!define MUI_FINISHPAGE_RUN "$INSTDIR\MU Giloria.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Ejecutar MU Giloria"

;--------------------------------
; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

;--------------------------------
; Languages
!insertmacro MUI_LANGUAGE "Spanish"
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "Portuguese"

;--------------------------------
; Version Info
VIProductVersion "1.1.0.0"
VIAddVersionKey /LANG=${LANG_SPANISH} "ProductName" "MU Giloria"
VIAddVersionKey /LANG=${LANG_SPANISH} "CompanyName" "MU Giloria"
VIAddVersionKey /LANG=${LANG_SPANISH} "FileDescription" "Instalador de MU Giloria Season 6"
VIAddVersionKey /LANG=${LANG_SPANISH} "FileVersion" "1.1.0"
VIAddVersionKey /LANG=${LANG_SPANISH} "ProductVersion" "1.1.0"

;--------------------------------
; Source directory - passed via command line: makensis -DSRCDIR=...
!ifndef SRCDIR
  !define SRCDIR "/tmp/MuGiloria"
!endif

;--------------------------------
; Installer Section
Section "MU Giloria" SecMain
  SectionIn RO

  ; Set output path to the installation directory
  SetOutPath "$INSTDIR"

  ; Game client
  File "${SRCDIR}\Main.exe"
  File "${SRCDIR}\MUnique.Client.Library.dll"
  File "${SRCDIR}\config.ini"
  File "${SRCDIR}\icon.ico"

  ; Game DLLs
  File "${SRCDIR}\glew32.dll"
  File "${SRCDIR}\ogg.dll"
  File "${SRCDIR}\vorbisfile.dll"
  File "${SRCDIR}\wzAudio.dll"

  ; MinGW runtime
  File "${SRCDIR}\libgcc_s_dw2-1.dll"
  File "${SRCDIR}\libstdc++-6.dll"

  ; Launcher (Electron)
  File "${SRCDIR}\MU Giloria.exe"
  File "${SRCDIR}\d3dcompiler_47.dll"
  File "${SRCDIR}\ffmpeg.dll"
  File "${SRCDIR}\libEGL.dll"
  File "${SRCDIR}\libGLESv2.dll"
  File "${SRCDIR}\vk_swiftshader.dll"
  File "${SRCDIR}\vk_swiftshader_icd.json"
  File "${SRCDIR}\vulkan-1.dll"
  File "${SRCDIR}\resources.pak"
  File "${SRCDIR}\chrome_100_percent.pak"
  File "${SRCDIR}\chrome_200_percent.pak"
  File "${SRCDIR}\snapshot_blob.bin"
  File "${SRCDIR}\v8_context_snapshot.bin"
  File "${SRCDIR}\icudtl.dat"
  File "${SRCDIR}\LICENSE.electron.txt"
  File "${SRCDIR}\LICENSES.chromium.html"

  ; Readme
  File /nonfatal "${SRCDIR}\LEEME.txt"

  ; Data directory (recursive)
  SetOutPath "$INSTDIR\Data"
  File /r "${SRCDIR}\Data\*.*"

  ; Translations directory (recursive)
  SetOutPath "$INSTDIR\Translations"
  File /r "${SRCDIR}\Translations\*.*"

  ; Locales directory (Electron - recursive)
  SetOutPath "$INSTDIR\locales"
  File /r "${SRCDIR}\locales\*.*"

  ; Resources directory (Electron - recursive)
  SetOutPath "$INSTDIR\resources"
  File /r "${SRCDIR}\resources\*.*"

  ; Reset output path
  SetOutPath "$INSTDIR"

  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Desktop shortcut
  CreateShortcut "$DESKTOP\MU Giloria.lnk" "$INSTDIR\MU Giloria.exe" "" "$INSTDIR\icon.ico"

  ; Start menu
  CreateDirectory "$SMPROGRAMS\MU Giloria"
  CreateShortcut "$SMPROGRAMS\MU Giloria\MU Giloria.lnk" "$INSTDIR\MU Giloria.exe" "" "$INSTDIR\icon.ico"
  CreateShortcut "$SMPROGRAMS\MU Giloria\Desinstalar.lnk" "$INSTDIR\Uninstall.exe"

  ; Registry: install dir
  WriteRegStr HKCU "Software\MU Giloria" "InstallDir" "$INSTDIR"

  ; Registry: Add/Remove Programs
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MU Giloria" "DisplayName" "MU Giloria Season 6"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MU Giloria" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MU Giloria" "DisplayIcon" "$INSTDIR\icon.ico"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MU Giloria" "Publisher" "MU Giloria"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MU Giloria" "DisplayVersion" "1.1.0"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MU Giloria" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MU Giloria" "NoRepair" 1

  ; Estimated size
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MU Giloria" "EstimatedSize" "$0"

SectionEnd

;--------------------------------
; Uninstaller Section
Section "Uninstall"

  ; Remove files
  Delete "$INSTDIR\Main.exe"
  Delete "$INSTDIR\MUnique.Client.Library.dll"
  Delete "$INSTDIR\config.ini"
  Delete "$INSTDIR\icon.ico"
  Delete "$INSTDIR\glew32.dll"
  Delete "$INSTDIR\ogg.dll"
  Delete "$INSTDIR\vorbisfile.dll"
  Delete "$INSTDIR\wzAudio.dll"
  Delete "$INSTDIR\libgcc_s_dw2-1.dll"
  Delete "$INSTDIR\libstdc++-6.dll"
  Delete "$INSTDIR\MU Giloria.exe"
  Delete "$INSTDIR\d3dcompiler_47.dll"
  Delete "$INSTDIR\ffmpeg.dll"
  Delete "$INSTDIR\libEGL.dll"
  Delete "$INSTDIR\libGLESv2.dll"
  Delete "$INSTDIR\vk_swiftshader.dll"
  Delete "$INSTDIR\vk_swiftshader_icd.json"
  Delete "$INSTDIR\vulkan-1.dll"
  Delete "$INSTDIR\resources.pak"
  Delete "$INSTDIR\chrome_100_percent.pak"
  Delete "$INSTDIR\chrome_200_percent.pak"
  Delete "$INSTDIR\snapshot_blob.bin"
  Delete "$INSTDIR\v8_context_snapshot.bin"
  Delete "$INSTDIR\icudtl.dat"
  Delete "$INSTDIR\LICENSE.electron.txt"
  Delete "$INSTDIR\LICENSES.chromium.html"
  Delete "$INSTDIR\LEEME.txt"
  Delete "$INSTDIR\Uninstall.exe"

  ; Remove directories
  RMDir /r "$INSTDIR\Data"
  RMDir /r "$INSTDIR\Translations"
  RMDir /r "$INSTDIR\locales"
  RMDir /r "$INSTDIR\resources"
  RMDir "$INSTDIR"

  ; Remove shortcuts
  Delete "$DESKTOP\MU Giloria.lnk"
  Delete "$SMPROGRAMS\MU Giloria\MU Giloria.lnk"
  Delete "$SMPROGRAMS\MU Giloria\Desinstalar.lnk"
  RMDir "$SMPROGRAMS\MU Giloria"

  ; Remove registry
  DeleteRegKey HKCU "Software\MU Giloria"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\MU Giloria"

SectionEnd
