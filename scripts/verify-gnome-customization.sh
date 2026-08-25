#!/usr/bin/env bash
set -u
set -o pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
BACKUP_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
ok=0 warn=0 err=0

report() {
    local level=$1 component=$2 message=$3
    printf '%-7s %-22s %s\n' "$level" "$component" "$message"
    case $level in OK) ((ok+=1));; WARNING) ((warn+=1));; ERROR) ((err+=1));; esac
}

check_cmd() { command -v "$1" >/dev/null 2>&1 || { report ERROR dependencias "$1 ausente"; return 1; }; }
for cmd in gsettings gnome-extensions gnome-shell sha256sum dconf jq; do check_cmd "$cmd" || true; done

fedora=$(rpm -E %fedora 2>/dev/null || printf '?')
shell=$(gnome-shell --version 2>/dev/null || printf 'indisponível')
[[ $fedora == 44 ]] && report OK sistema "Fedora 44" || report WARNING sistema "Fedora detectado: $fedora (esperado 44)"
[[ $shell == *" 50."* ]] && report OK gnome "$shell" || report WARNING gnome "$shell (esperado GNOME 50.x)"
[[ ${XDG_SESSION_TYPE:-} == wayland ]] && report OK sessao "Wayland" || report WARNING sessao "${XDG_SESSION_TYPE:-não detectada}"

declare -A EXPECTED=(
  [dash-to-dock@micxgx.gmail.com]=105
  [blur-my-shell@aunetx]=72
  [vibe-panel@pakovm]=6
  [arcmenu@arcmenu.com]=69.2
)
enabled=$(gsettings get org.gnome.shell enabled-extensions 2>/dev/null || printf '[]')
for uuid in dash-to-dock@micxgx.gmail.com blur-my-shell@aunetx vibe-panel@pakovm arcmenu@arcmenu.com; do
    dir="$HOME/.local/share/gnome-shell/extensions/$uuid"
    if [[ ! -f $dir/metadata.json ]]; then report ERROR "$uuid" "ausente"; continue; fi
    version=$(jq -r 'if .["version-name"] then .["version-name"] else (.version|tostring) end' "$dir/metadata.json" 2>/dev/null)
    [[ $version == "${EXPECTED[$uuid]}" ]] && report OK "$uuid" "versão $version" || report ERROR "$uuid" "versão $version; esperada ${EXPECTED[$uuid]}"
    [[ $enabled == *"'$uuid'"* ]] && report OK "$uuid" "habilitada" || report ERROR "$uuid" "não habilitada"
    details=$(gnome-extensions info "$uuid" 2>/dev/null || true)
    [[ $details == *"State: ACTIVE"* ]] && report OK "$uuid" "ACTIVE" || report WARNING "$uuid" "estado ACTIVE não confirmado"
done

declare -a FILES=(
  "dash-to-dock@micxgx.gmail.com/stylesheet.css"
  "vibe-panel@pakovm/dynamic_panel.js"
  "vibe-panel@pakovm/stylesheet.css"
  "arcmenu@arcmenu.com/menuButton.js"
  "arcmenu@arcmenu.com/stylesheet.css"
)
for rel in "${FILES[@]}"; do
    live="$HOME/.local/share/gnome-shell/extensions/$rel"
    saved="$BACKUP_DIR/extensions/$rel"
    if [[ -f $live && -f $saved ]] && [[ $(sha256sum "$live" | cut -d' ' -f1) == $(sha256sum "$saved" | cut -d' ' -f1) ]]; then
        report OK arquivos "$rel"
    else
        report ERROR arquivos "$rel difere do backup ou está ausente"
    fi
done

layout=$(gsettings get org.gnome.desktop.wm.preferences button-layout 2>/dev/null || true)
[[ $layout == "'appmenu:minimize,maximize,close'" ]] && report OK botoes "$layout" || report ERROR botoes "$layout"

dock_pos=$(gsettings get org.gnome.shell.extensions.dash-to-dock dock-position 2>/dev/null || true)
[[ $dock_pos == "'BOTTOM'" ]] && report OK dock "posição BOTTOM" || report WARNING dock "posição: $dock_pos"
pipeline=$(gsettings get org.gnome.shell.extensions.blur-my-shell.dash-to-dock pipeline 2>/dev/null || true)
[[ $pipeline == "'pipeline_dock_glass'" ]] && report OK blur "pipeline_dock_glass" || report ERROR blur "pipeline: $pipeline"
panel_blur=$(gsettings get org.gnome.shell.extensions.blur-my-shell.panel blur 2>/dev/null || true)
[[ $panel_blur == true ]] && report OK topbar "blur habilitado" || report ERROR topbar "blur não habilitado"

wall_light=$(gsettings get org.gnome.desktop.background picture-uri 2>/dev/null | sed "s/^'//;s/'$//;s#^file://##")
wall_dark=$(gsettings get org.gnome.desktop.background picture-uri-dark 2>/dev/null | sed "s/^'//;s/'$//;s#^file://##")
[[ -f $wall_light ]] && report OK wallpaper "$wall_light" || report ERROR wallpaper "arquivo claro ausente: $wall_light"
[[ -f $wall_dark ]] && report OK wallpaper "$wall_dark" || report ERROR wallpaper "arquivo escuro ausente: $wall_dark"
[[ -s $HOME/.config/gtk-3.0/bookmarks ]] && report OK bookmarks "presente" || report ERROR bookmarks "ausente ou vazio"

for dump in "$BACKUP_DIR"/dconf/*.dconf; do
    [[ -f $dump ]] || { report ERROR dconf "nenhum dump"; break; }
    if [[ -s $dump ]]; then
        head -n1 "$dump" | grep -Eq '^\[.*\]$' && report OK dconf "$(basename "$dump")" || report ERROR dconf "formato inesperado: $(basename "$dump")"
    else
        report WARNING dconf "$(basename "$dump") vazio (sem overrides)"
    fi
done

if [[ -f $BACKUP_DIR/SHA256SUMS.txt ]] && (cd "$BACKUP_DIR" && sha256sum --check --quiet SHA256SUMS.txt); then
    report OK integridade "SHA256SUMS íntegro"
else
    report ERROR integridade "manifesto ausente ou divergente"
fi

printf '\nResumo: OK=%d WARNING=%d ERROR=%d\n' "$ok" "$warn" "$err"
(( err == 0 ))
