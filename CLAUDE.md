# Painel de Avaliações — A Casa & Designer

Painel administrativo estático (HTML + Supabase, hospedado na Vercel). Cada aba é um `.html`: `index.html` (Avaliações), `crm`, `financeiro`, `leads`, `instalacao`, `central`. Páginas públicas: `avaliar.html`, `proposta.html`, demos dos restaurantes (`pizzaria-premium/`, `burger-foundry/`, `bistro-elegante/`, `peso-e-sabor/`).

## Padrão visual (referência: `central.html`)
- Tema escuro: `--bg:#0d0d0d`, `--card:#161616`, `--border:#2a2a2a`, `--gold:#C9A84C`.
- Header sticky com `.nav-links` (a aba atual leva `class="active"`), cards com raio 16px, ícone em tile dourado translúcido, hover com borda dourada.
- Novas telas devem copiar esse padrão; não reintroduzir estilos inline no menu.

## Aba Avaliações (`index.html`)
- Lista de restaurantes: constante `RESTAURANTES` (única fonte) — sempre em ordem alfabética pt-BR. Alimenta o filtro, o painel de desempenho e a "Sugestão do Dia".
- Tabela agrupada por restaurante (A→Z) e, dentro de cada grupo, avaliação mais recente primeiro.
- Todo texto vindo do banco passa por `esc()` (evita HTML injetado em sugestões).
- Ao adicionar um restaurante novo: incluir em `RESTAURANTES` e em `SLUG_POR_RESTAURANTE` (ver skill `novo-cliente`).

## Login unificado
- Todas as abas do painel usam só o login Supabase (e-mail + senha); a sessão é compartilhada entre as páginas. A antiga tela "Acesso restrito" (senha por hash no navegador) da aba Leads foi removida — não recriar: era só uma trava de tela, não protegia os dados. A proteção real dos dados é o RLS (seção abaixo).
- O gate de `proposta.html` (confirmar telefone do cliente) é outra coisa e permanece.

## Banco (Supabase, projeto `chwxepwdsyspcdkalaic`) e permissões
- Quem é admin: linhas da tabela `public.admins` (`user_id`). Todas as políticas "apenas admin" (leads, `crm_*`, `financeiro_cobrancas`, escrita de `sugestao_dia`, leitura total de `avaliacoes`) exigem estar nessa tabela. Restaurantes ficam em `perfis_restaurante` e só veem as próprias avaliações. Conta nova sem linha em nenhuma das duas não acessa nada.
- Antes (até 19/09/2026) valia "quem não é restaurante é admin", que liberaria qualquer conta nova. Não voltar a esse padrão em tabelas novas.
- Adicionar admin: `insert into public.admins (user_id) values ('<uuid>');` (a API não escreve nessa tabela).
- Tabela nova em `public`: o gatilho `ensure_rls` liga o RLS sozinho, mas é preciso criar as políticas (sem política, ninguém acessa).
- Migrações versionadas em `migracoes/` (aplicada: `2026-09-19_admins_explicitos_rls.sql`; desfazer com o `_ROLLBACK.sql`). Aplicar migração exige confirmação explícita: é produção.
- Authentication (feito manualmente pelo Paulo em 19/09/2026): cadastro público desligado; proteção contra senhas vazadas ligada e salva no painel. Mesmo assim o advisor de segurança do Supabase continua listando `auth_leaked_password_protection` ("Disabled") — é o único aviso restante. Causas possíveis: verificador atrasado, opção sem efeito no plano atual ou não persistida; não confirmado. Não é falha do código nem do RLS. Se quiser tirar a dúvida, tente criar um usuário de teste com senha vazada (ex.: `123456`) em Authentication → Users: deve ser recusado; apague o usuário depois. O cadastro público desligado não é visível pelas ferramentas de verificação — só no painel.

## Como testar sem senha
O login usa Supabase Auth. Para ver a tela localmente: `python -m http.server`, abrir a página, esconder `#login-wrap`, mostrar `#app`, chamar `montarFiltroRestaurantes()` e preencher `todasAvaliacoes` com dados de exemplo + `aplicarFiltros()`.

## Armadilha: service worker
`sw.js` usa cache "stale-while-revalidate" nas páginas admin. Após editar uma página, o navegador pode mostrar a versão antiga uma vez. Em testes, desregistre o SW e limpe o cache. Ao mudar muito, suba `CACHE_NAME` (hoje `painel-ad-v2`); o pré-cache já usa `cache:'reload'` para não pegar cópia velha do cache HTTP. Observação: `central.html` e `instalacao.html` não estão em `PRECACHE_URLS`/`ADMIN_PATHS`.
