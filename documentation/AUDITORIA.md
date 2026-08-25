# Auditoria técnica final

Este documento complementa o README e registra a classificação objetiva da captura.

- Estado esperado confirmado: Fedora 44, GNOME Shell 50.4, Wayland, kernel 7.1.10-200.fc44.x86_64.
- Extensões principais: Dash to Dock 105, Blur My Shell 72, Vibe Panel 6 e ArcMenu 69.2, todas habilitadas e ACTIVE.
- Extensão adicional habilitada/ACTIVE: Background Logo 50.1.
- Extensões adicionais instaladas/desativadas: Apps Menu, Launch New Instance, Places Status Indicator e Window List, todas 50.3 e pertencentes ao conjunto oficial GNOME Shell Extensions.
- Redundância: cópias de sistema e usuário de Dash to Dock e Blur My Shell. A cópia do usuário tem precedência. Nada removido.
- Erros atuais reais: nenhum crash, ERROR de extensão, exceção GJS ou falha funcional comprovada.
- Aviso atual: mensagens de alocação de atores do Dash to Dock/Blur My Shell durante renderização. Mantido sem intervenção para não alterar o visual.
- Erros antigos: nenhuma ocorrência relevante encontrada no intervalo pesquisado de 18 a 24 de agosto de 2026.
- Limpeza: zero itens removidos; nenhum temporário foi comprovado.
- `button-layout`: `appmenu:minimize,maximize,close`, preservado.
- Wallpaper: arquivos claro/escuro RPM-managed do Fedora 44 presentes.
- Nautilus: versão 50.2.2 inicia e comunica com Tracker; não há erro atual nos logs. Não foi mantido aberto pela auditoria.

As evidências completas estão em `../system/`, `../config/`, `../dconf/`, `../diffs/` e no manifesto `../SHA256SUMS.txt`.
