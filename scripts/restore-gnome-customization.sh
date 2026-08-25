#!/usr/bin/env bash
set -euo pipefail

# Restaura somente os componentes documentados neste backup.
# Este script não é executado automaticamente.

EXPECTED_USER="cesar"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
BACKUP_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
STAMP="$(date +%Y%m%d-%H%M%S)"
SAFETY_DIR="${HOME}/GNOME-Customizacao-Pre-Restore-${STAMP}"

die() { printf 'ERRO: %s\n' "$*" >&2; exit 1; }
note() { printf '%s\n' "$*"; }
need() { command -v "$1" >/dev/null 2>&1 || die "dependência ausente: $1"; }

[[ $EUID -ne 0 ]] || die "não execute como root"
[[ ${USER:-} == "$EXPECTED_USER" ]] || die "este backup pertence a $EXPECTED_USER; usuário atual: ${USER:-desconhecido}"
[[ -d $BACKUP_DIR/extensions && -d $BACKUP_DIR/dconf ]] || die "estrutura do backup incompleta em $BACKUP_DIR"

for cmd in cp date dconf gsettings gnome-extensions install mkdir sha256sum; do need "$cmd"; done

if [[ -f $BACKUP_DIR/SHA256SUMS.txt ]]; then
    note "Validando integridade do backup..."
    (cd "$BACKUP_DIR" && sha256sum --check --quiet SHA256SUMS.txt) || die "falha de integridade; restauração cancelada"
fi

mkdir -p "$SAFETY_DIR/extensions" "$SAFETY_DIR/config" "$SAFETY_DIR/nautilus" "$SAFETY_DIR/dconf"
note "Backup preventivo do estado atual: $SAFETY_DIR"

declare -a EXT_FILES=(
  "dash-to-dock@micxgx.gmail.com:stylesheet.css"
  "vibe-panel@pakovm:dynamic_panel.js"
  "vibe-panel@pakovm:stylesheet.css"
  "arcmenu@arcmenu.com:menuButton.js"
  "arcmenu@arcmenu.com:stylesheet.css"
)

# Faz todo o preflight antes da primeira sobrescrita, evitando restauração parcial
# quando uma extensão ou um arquivo do backup estiver ausente.
for item in "${EXT_FILES[@]}"; do
    uuid=${item%%:*}
    rel=${item#*:}
    [[ -d $HOME/.local/share/gnome-shell/extensions/$uuid ]] || die "extensão de usuário ausente: $uuid (instale a versão documentada e repita)"
    [[ -f $BACKUP_DIR/extensions/$uuid/$rel ]] || die "arquivo ausente no backup: extensions/$uuid/$rel"
done

for item in "${EXT_FILES[@]}"; do
    uuid=${item%%:*}
    rel=${item#*:}
    src="$BACKUP_DIR/extensions/$uuid/$rel"
    ext_dir="$HOME/.local/share/gnome-shell/extensions/$uuid"
    dst="$ext_dir/$rel"
    if [[ -e $dst ]]; then
        mkdir -p "$SAFETY_DIR/extensions/$uuid/$(dirname -- "$rel")"
        cp -a -- "$dst" "$SAFETY_DIR/extensions/$uuid/$rel"
    fi
    install -m "$(stat -c %a "$src")" -- "$src" "$dst"
done

# Preserva dumps do estado imediatamente anterior antes da importação seletiva.
declare -a DCONF_SPECS=(
  "dash-to-dock:/org/gnome/shell/extensions/dash-to-dock/"
  "blur-my-shell:/org/gnome/shell/extensions/blur-my-shell/"
  "arcmenu:/org/gnome/shell/extensions/arcmenu/"
  "vibe-panel:/org/gnome/shell/extensions/vibe-panel/"
  "desktop-interface:/org/gnome/desktop/interface/"
  "wm-preferences:/org/gnome/desktop/wm/preferences/"
  "desktop-background:/org/gnome/desktop/background/"
  "nautilus:/org/gnome/nautilus/"
  "gnome-shell:/org/gnome/shell/"
)

for spec in "${DCONF_SPECS[@]}"; do
    name=${spec%%:*}
    path=${spec#*:}
    dump="$BACKUP_DIR/dconf/$name.dconf"
    [[ -f $dump ]] || die "dump ausente: $dump"
    dconf dump "$path" > "$SAFETY_DIR/dconf/$name.dconf"
    if [[ -s $dump ]]; then
        dconf load "$path" < "$dump"
    else
        note "Dump $name vazio (nenhum override dconf); etapa ignorada."
    fi
done

for pair in \
  "$BACKUP_DIR/nautilus/bookmarks:$HOME/.config/gtk-3.0/bookmarks" \
  "$BACKUP_DIR/config/user-dirs.dirs:$HOME/.config/user-dirs.dirs" \
  "$BACKUP_DIR/config/user-dirs.locale:$HOME/.config/user-dirs.locale"; do
    src=${pair%%:*}
    dst=${pair#*:}
    [[ -f $src ]] || die "arquivo ausente no backup: $src"
    mkdir -p "$(dirname -- "$dst")"
    if [[ -e $dst ]]; then
        cp -a -- "$dst" "$SAFETY_DIR/config/$(basename -- "$dst")"
    fi
    install -m "$(stat -c %a "$src")" -- "$src" "$dst"
done

# Este conjunto usa wallpapers fornecidos pelo Fedora. Caso uma cópia local
# seja adicionada futuramente ao backup, ela é restaurada sem apagar nada.
if [[ -d $BACKUP_DIR/wallpaper/files ]]; then
    mkdir -p "$HOME/.local/share/backgrounds/GNOME-Customizacao"
    cp -a -- "$BACKUP_DIR/wallpaper/files/." "$HOME/.local/share/backgrounds/GNOME-Customizacao/"
fi

layout=$(gsettings get org.gnome.desktop.wm.preferences button-layout)
[[ $layout == *minimize* && $layout == *maximize* && $layout == *close* ]] || die "button-layout restaurado sem os três botões esperados: $layout"

note "Restauração concluída. Nenhuma extensão foi recarregada por este script."
note "Faça logout/login para que código e CSS restaurados sejam carregados de modo seguro."
note "Estado anterior preservado em: $SAFETY_DIR"
