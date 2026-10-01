/* ============================================================
   vivo.js — pequenos toques de vida compartilhados entre as
   telas internas do painel (A Casa & Designer).

   Hoje faz uma coisa só: dá sombra no cabeçalho fixo quando a
   página rola, pra ele parecer "flutuar" em vez de ficar colado
   sem profundidade. Seguro de incluir em qualquer página — não
   depende de nenhum elemento específico existir.
   ============================================================ */
(function () {
  function initVivoHeaderScroll() {
    var header = document.querySelector('header.top');
    if (!header) return;
    var onScroll = function () {
      if (window.scrollY > 4) {
        header.classList.add('vivo-scrolled');
      } else {
        header.classList.remove('vivo-scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVivoHeaderScroll);
  } else {
    initVivoHeaderScroll();
  }
})();
