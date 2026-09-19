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

## Como testar sem senha
O login usa Supabase Auth. Para ver a tela localmente: `python -m http.server`, abrir a página, esconder `#login-wrap`, mostrar `#app`, chamar `montarFiltroRestaurantes()` e preencher `todasAvaliacoes` com dados de exemplo + `aplicarFiltros()`.

## Armadilha: service worker
`sw.js` usa cache "stale-while-revalidate" nas páginas admin. Após editar uma página, o navegador pode mostrar a versão antiga uma vez. Em testes, desregistre o SW e limpe o cache. Ao mudar muito, considere subir `CACHE_NAME`. Observação: `central.html` e `instalacao.html` não estão em `PRECACHE_URLS`/`ADMIN_PATHS`.
