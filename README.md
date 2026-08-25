# Backup da personalização GNOME

Captura técnica realizada em 25 de agosto de 2026, sem alterar ou recarregar o ambiente visual.

## Plataforma e sessão

- Fedora 44 (Forty Four), GNOME Shell 50.4 e GNOME Nautilus 50.2.2.
- Sessão GNOME em Wayland.
- Kernel `7.1.10-200.fc44.x86_64`.
- GTK e tema de janelas: Adwaita; `color-scheme`: `default`.
- GNOME Shell: tema padrão (User Themes não está instalada/habilitada).
- Ícones e cursor: Adwaita; cursor de 24 px.
- Fontes: Adwaita Sans 11; documentos Adwaita Sans 12; títulos Adwaita Sans Bold 11; monoespaçada Adwaita Mono 11.
- Wallpaper claro: `/usr/share/backgrounds/f44/default/f44-01-day.jxl`.
- Wallpaper escuro: `/usr/share/backgrounds/f44/default/f44-01-night.jxl`.

Os temas, ícones, cursor e wallpapers são componentes do sistema Fedora; não foi duplicado conteúdo binário gerenciado por RPM. Os caminhos e pacotes necessários estão inventariados em `system/`.

## Extensões

| Extensão | Versão | Estado capturado | Função |
|---|---:|---|---|
| Dash to Dock | 105 | habilitada, ACTIVE | Dock inferior, autohide/intellihide e apresentação dos lançadores. |
| Blur My Shell | 72 | habilitada, ACTIVE | Pipelines de blur da Dock e da Top Bar. |
| Vibe Panel | 6 | habilitada, ACTIVE | Transparência e acabamento da Top Bar. |
| ArcMenu | 69.2 (metadata 73) | habilitada, ACTIVE | Menu de aplicações no painel. |
| Background Logo | 50.1 | habilitada, ACTIVE | Logo de fundo padrão do Fedora. |

Extensões do sistema instaladas, porém desativadas: Apps Menu 50.3, Launch New Instance 50.3, Places Status Indicator 50.3 e Window List 50.3. São componentes oficiais do pacote GNOME Classic, não evidência suficiente de tentativa abandonada, e não foram removidos.

Existem cópias RPM de Dash to Dock 105 e Blur My Shell 72 em `/usr/share/gnome-shell/extensions`, sombreadas pelas cópias ativas em `~/.local/share/gnome-shell/extensions`. Essa duplicação é redundante para carregamento, mas os pacotes do sistema foram preservados.

## Configuração visual principal

Dock: posição `BOTTOM`, ícones de 54 px, `autohide=true`, `intellihide=true`, modo `ALL_WINDOWS`, transparência `FIXED`, camada neutra branca a 9%, margem inferior de 9 px, raio visual de 24 px, borda branca de 1 px a 12% e sombra `0 8px 24px` preta a 13%. O pipeline Blur My Shell preservado é `pipeline_dock_glass`, com blur estático, raio 38, brilho 0,95, `sigma=32` e override do fundo.

Top Bar: Vibe Panel com transparência habilitada em 30%, ajustes de tema claro habilitados e cantos próprios desabilitados. Blur My Shell no painel está habilitado, brilho 0,88, sigma 24 e background override; a alteração manual do Vibe Panel mantém a transparência com janela maximizada.

ArcMenu: layout `elementary`, posição esquerda, tema sobrescrito, fundo `rgba(30,34,40,0.34)`, raio 22, borda de 1 px, menu 550 px de altura e blur/sombra localizados.

Janelas: foco por clique, duplo clique no título alterna maximização, tema Adwaita e quatro workspaces. O valor confirmado de `org.gnome.desktop.wm.preferences button-layout` é exatamente:

```text
appmenu:minimize,maximize,close
```

Assim, minimizar, maximizar e fechar permanecem à direita. Esta captura não modificou esse valor.

Nautilus: visualização padrão por ícones, zoom médio, ordenação por nome crescente, duplo clique, arquivos ocultos desabilitados, miniaturas e contagens apenas locais, pesquisa recursiva apenas local. Os bookmarks atuais e o backup anterior estão em `nautilus/`; nenhum conteúdo das pastas pessoais foi copiado. Os caminhos XDG estão em `config/`.

## Arquivos modificados manualmente

- `~/.local/share/gnome-shell/extensions/dash-to-dock@micxgx.gmail.com/stylesheet.css`: margem inferior visual, arredondamento, borda e sombra da Dock. Base comparável: arquivo RPM em `/usr/share/...`; diff `diffs/dash-to-dock-stylesheet.diff`.
- `~/.local/share/gnome-shell/extensions/vibe-panel@pakovm/dynamic_panel.js`: preserva transparência ao maximizar. Não foi localizado backup original correspondente.
- `~/.local/share/gnome-shell/extensions/vibe-panel@pakovm/stylesheet.css`: acabamento glass da Top Bar. Não foi localizado backup original correspondente.
- `~/.local/share/gnome-shell/extensions/arcmenu@arcmenu.com/menuButton.js`: BlurEffect localizado no popup. Original: `menuButton.js.pre-glass-backup`.
- `~/.local/share/gnome-shell/extensions/arcmenu@arcmenu.com/stylesheet.css`: sombra localizada. Original: `stylesheet.css.pre-glass-backup`.

Os `gschemas.compiled` de Dash to Dock, Vibe Panel e ArcMenu também têm data recente, coerente com compilação de schemas durante a configuração; eles são artefatos gerados, não uma personalização fonte adicional. Nenhum outro arquivo fonte manualmente alterado foi comprovado pela auditoria.

Aviso: atualizações do Dash to Dock, Vibe Panel e ArcMenu podem sobrescrever essas alterações manuais. Antes e depois de atualizar, compare os hashes e diffs deste backup.

## Backups originais encontrados

- ArcMenu `menuButton.js.pre-glass-backup`, 31.824 bytes.
- ArcMenu `stylesheet.css.pre-glass-backup`, 2.203 bytes.
- Nautilus `bookmarks.pre-nautilus-organize-backup`, 195 bytes.

Caminhos absolutos, datas, tamanhos e hashes estão em `system/existing-backups.txt` e `system/existing-backups-sha256.txt`. Nenhum foi excluído.

## Logs e resíduos

Não foram encontrados crashes, exceções GJS, extensões em estado ERROR ou erro atual do Nautilus, Vibe Panel ou ArcMenu. O journal do boot atual registra mensagens repetidas `needs an allocation` para atores do Dash to Dock e Blur My Shell. Como ambas permanecem ACTIVE e os pipelines estão válidos, são avisos atuais de ciclo de layout/renderização, não falha funcional comprovada; nenhuma correção arriscada foi aplicada. Há ainda um aviso inofensivo de geolocalização sem permissão e um alerta do libinput sobre salto do touchpad, ambos fora da personalização.

Não foi comprovado arquivo temporário sem função dentro do escopo. Portanto, a limpeza removeu zero itens. Backups, extensões desativadas, configurações e caches foram preservados.

## Conteúdo e hashes

- `dconf/`: dumps seletivos por componente. `relevant-all-readable.txt` é apenas uma visão agregada documentacional e não deve ser importada.
- `extensions/`: cópia integral das quatro extensões de usuário, sem caches.
- `diffs/`: comparações disponíveis e marcadores explícitos quando não existe base anterior.
- `system/`: versões, extensões, RPMs, Flatpaks relevantes, logs e estado visual.
- `SHA256SUMS.txt`: hashes SHA256 de todos os arquivos do backup, exceto do próprio manifesto.

## Restauração

1. Leia `documentation/PORTABILIDADE.md` e instale previamente Fedora/GNOME, versões compatíveis das extensões e pacotes listados em `system/`.
2. Confira o manifesto com `sha256sum -c SHA256SUMS.txt` a partir desta pasta.
3. Execute `scripts/verify-gnome-customization.sh` manualmente para diagnosticar o destino.
4. Revise `scripts/restore-gnome-customization.sh`; só então execute-o como o usuário `cesar`, nunca como root.
5. O script cria um backup preventivo, restaura apenas os cinco arquivos personalizados, importa apenas dumps específicos e restaura bookmarks/XDG. Ele não reseta dconf, não remove extensões e não sobrescreve `~/.config` inteiro.
6. Faça logout/login ao final para carregar código e CSS com segurança e rode novamente o script de verificação.

O script de restauração não foi executado. O script de verificação também não é executado automaticamente por design.
