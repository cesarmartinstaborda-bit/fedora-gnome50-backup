# Portabilidade do backup

## 1. Nesta mesma instalação

Confiabilidade: alta. Pacotes, caminhos, usuário, versões das extensões e schemas coincidem com a captura. A restauração seletiva é o cenário mais previsível. Ainda assim, o script cria um backup preventivo e exige logout/login depois de restaurar código ou CSS.

## 2. Reinstalação limpa do Fedora 44 + GNOME 50

Confiabilidade: alta a moderada. Instale primeiro os RPMs inventariados, copie/instale as extensões nas versões exatas e confirme uma sessão Wayland. Depois restaure. Alguns valores ausentes nos dumps representam defaults do Fedora 44; por isso a mesma base de sistema é importante. O wallpaper é gerenciado pelo pacote de backgrounds do Fedora e não está duplicado neste backup.

## 3. Outra máquina com Fedora 44 + GNOME 50

Confiabilidade: moderada. GNOME e extensões devem ser compatíveis, mas resolução, escala, conectores de monitores, drivers gráficos e nomes/caminhos do usuário podem afetar Dock, blur, wallpaper, bookmarks e XDG. O script deliberadamente verifica o usuário `cesar`; em outro nome de usuário, os dumps e caminhos devem ser revisados antes de qualquer restauração.

## 4. Versão futura do Fedora/GNOME

Confiabilidade: baixa sem adaptação e testes. Não restaure cegamente a árvore de extensões de GNOME 50 em uma versão futura.

- APIs JavaScript do GNOME Shell podem mudar e impedir o carregamento de Dash to Dock, Blur My Shell, Vibe Panel ou ArcMenu.
- Novas versões das extensões podem alterar nomes de chaves, formato de valores, estrutura de arquivos e compatibilidade declarada.
- Schemas podem ser removidos, renomeados ou ganhar tipos incompatíveis; revise cada dump antes de importar.
- Seletores, propriedades e semântica do CSS do Shell podem mudar, invalidando bordas, sombras, raios ou margens.
- Mutter pode alterar alocação de atores, composição e efeitos de blur; isso é especialmente relevante aos pipelines e ao BlurEffect manual do ArcMenu.
- libadwaita/GTK podem mudar temas, métricas, botões e comportamento do Nautilus, mesmo com o nome Adwaita preservado.

Para migrar, instale extensões compatíveis com o GNOME de destino, reaplique manualmente os pequenos diffs sobre o código novo, valide schemas chave a chave e teste em uma conta separada. Use os dumps como referência seletiva, não como imagem universal do perfil.
