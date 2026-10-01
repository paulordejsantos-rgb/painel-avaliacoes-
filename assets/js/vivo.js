/* ============================================================
   vivo.js — pequenos toques de vida compartilhados entre as
   telas internas do painel (A Casa & Designer).

   Hoje faz duas coisas:
   1) Dá sombra no cabeçalho fixo quando a página rola, pra ele
      parecer "flutuar" em vez de ficar colado sem profundidade.
   2) Anima os números dos cards de KPI contando de 0 até o valor
      real quando a tela carrega ou os filtros mudam.
   Ambas seguras de incluir em qualquer página — não dependem de
   nenhum elemento específico existir.
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

  // ---- Contador animado dos números de KPI/stat-card ----
  //
  // Lê o número já pronto que o JS da página colocou no elemento
  // (ex.: "4,5", "2", "R$ 1.234,56", "5 leads") e anima de 0 até
  // esse valor, preservando o formato (R$, vírgula decimal, texto
  // depois do número, e qualquer elemento filho como "<small>/5</small>").
  // Se não conseguir reconhecer um número no texto (ex.: "—"),
  // não mexe em nada.
  function vivoCountUp(el) {
    if (!el) return;
    var textNode = null;
    for (var i = 0; i < el.childNodes.length; i++) {
      var node = el.childNodes[i];
      if (node.nodeType === 3 && node.textContent.trim() !== '') {
        textNode = node;
        break;
      }
    }
    if (!textNode) return;

    var raw = textNode.textContent;
    var m = raw.match(/^(\s*R\$\s*)?(-?[\d.]*\d(?:,\d+)?)(.*)$/);
    if (!m) return;

    var prefix = m[1] || '';
    var numStr = m[2];
    var suffix = m[3] || '';
    var decimals = numStr.indexOf(',') !== -1 ? numStr.split(',')[1].length : 0;
    var target = parseFloat(numStr.replace(/\./g, '').replace(',', '.'));
    if (isNaN(target)) return;

    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    function fmt(v) {
      return prefix + v.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }) + suffix;
    }

    var duration = 650;
    var start = null;
    textNode.textContent = fmt(0);

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      textNode.textContent = fmt(target * eased);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        textNode.textContent = raw; // garante o texto original exato no final
      }
    }
    requestAnimationFrame(step);
  }

  // Anima todos os ".val" dentro de um container (ex.: a div #stats
  // recém-preenchida por um renderStats()). Chamar depois de montar
  // o innerHTML dos cards.
  function vivoAnimateStats(container) {
    if (!container) return;
    container.querySelectorAll('.val').forEach(vivoCountUp);
  }

  window.vivoCountUp = vivoCountUp;
  window.vivoAnimateStats = vivoAnimateStats;
})();
