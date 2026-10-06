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

  // ---- Barra de acessibilidade (fonte, contraste, narração, rolagem) ----
  //
  // Preferências ficam salvas (localStorage) e valem pra todo o painel,
  // então navegar de uma aba pra outra mantém a fonte/contraste
  // escolhidos e, se a narração estiver ligada, a página nova já
  // começa a ser lida sozinha.
  var FONT_STEPS = [0.9, 1, 1.1, 1.25]; // A-, normal, A+, A++
  var FONT_KEY = 'a11y_font_step';
  var CONTRASTE_KEY = 'a11y_contraste';
  var NARRACAO_KEY = 'a11y_narracao';

  function getFontStep() {
    var v = parseInt(localStorage.getItem(FONT_KEY), 10);
    if (isNaN(v) || v < 0 || v >= FONT_STEPS.length) return 1;
    return v;
  }
  function aplicarFonte(step) {
    if ('zoom' in document.documentElement.style) {
      document.documentElement.style.zoom = FONT_STEPS[step];
    }
  }
  function aplicarContraste(ligado) {
    document.documentElement.classList.toggle('a11y-contraste', ligado);
  }

  function pegarTextoPagina() {
    var raiz = document.querySelector('main') || document.body;
    var clone = raiz.cloneNode(true);
    var ignorar = clone.querySelectorAll('.a11y-bar, script, style, noscript');
    ignorar.forEach(function (el) { el.remove(); });
    return (clone.innerText || clone.textContent || '').trim();
  }

  function falarPagina() {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    var texto = pegarTextoPagina();
    if (!texto) return;
    var trechos = (document.title + '. ' + texto)
      .split(/\n+/)
      .map(function (t) { return t.trim(); })
      .filter(Boolean);
    trechos.forEach(function (trecho) {
      var u = new SpeechSynthesisUtterance(trecho);
      u.lang = 'pt-BR';
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    });
  }

  function initA11yBar() {
    if (document.querySelector('.a11y-bar')) return;

    var temVoz = !!window.speechSynthesis;
    var fontStep = getFontStep();
    var contrasteLigado = localStorage.getItem(CONTRASTE_KEY) === '1';
    var narracaoLigada = temVoz && localStorage.getItem(NARRACAO_KEY) === '1';

    var bar = document.createElement('div');
    bar.className = 'a11y-bar';
    bar.innerHTML =
      '<button type="button" class="a11y-btn" data-a11y="font-menos" title="Diminuir fonte" aria-label="Diminuir fonte">A−</button>' +
      '<button type="button" class="a11y-btn" data-a11y="font-mais" title="Aumentar fonte" aria-label="Aumentar fonte">A+</button>' +
      '<button type="button" class="a11y-btn" data-a11y="contraste" title="Alto contraste" aria-label="Alternar alto contraste">◐</button>' +
      '<button type="button" class="a11y-btn" data-a11y="narracao" title="Ler página em voz alta" aria-label="Ligar ou desligar narração por voz"' +
        (temVoz ? '' : ' disabled') + '>🔊</button>' +
      '<button type="button" class="a11y-btn" data-a11y="topo" title="Ir para o topo" aria-label="Ir para o topo">↑</button>' +
      '<button type="button" class="a11y-btn" data-a11y="final" title="Ir para o final" aria-label="Ir para o final">↓</button>';
    document.body.appendChild(bar);

    var btnContraste = bar.querySelector('[data-a11y="contraste"]');
    var btnNarracao = bar.querySelector('[data-a11y="narracao"]');

    aplicarFonte(fontStep);
    aplicarContraste(contrasteLigado);
    btnContraste.classList.toggle('ativo', contrasteLigado);
    btnNarracao.classList.toggle('ativo', narracaoLigada);
    if (narracaoLigada) {
      // Dá um instante pro conteúdo da página terminar de montar antes de ler.
      setTimeout(falarPagina, 300);
    }

    bar.querySelector('[data-a11y="font-menos"]').addEventListener('click', function () {
      fontStep = Math.max(0, fontStep - 1);
      localStorage.setItem(FONT_KEY, String(fontStep));
      aplicarFonte(fontStep);
    });
    bar.querySelector('[data-a11y="font-mais"]').addEventListener('click', function () {
      fontStep = Math.min(FONT_STEPS.length - 1, fontStep + 1);
      localStorage.setItem(FONT_KEY, String(fontStep));
      aplicarFonte(fontStep);
    });
    btnContraste.addEventListener('click', function () {
      contrasteLigado = !contrasteLigado;
      localStorage.setItem(CONTRASTE_KEY, contrasteLigado ? '1' : '0');
      aplicarContraste(contrasteLigado);
      btnContraste.classList.toggle('ativo', contrasteLigado);
    });
    if (temVoz) {
      btnNarracao.addEventListener('click', function () {
        narracaoLigada = !narracaoLigada;
        localStorage.setItem(NARRACAO_KEY, narracaoLigada ? '1' : '0');
        btnNarracao.classList.toggle('ativo', narracaoLigada);
        if (narracaoLigada) {
          falarPagina();
        } else {
          window.speechSynthesis.cancel();
        }
      });
    }
    bar.querySelector('[data-a11y="topo"]').addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    bar.querySelector('[data-a11y="final"]').addEventListener('click', function () {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initA11yBar);
  } else {
    initA11yBar();
  }

  window.addEventListener('beforeunload', function () {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  });

  // ---- Sino de notificações (novo contato, suporte ou pedido pelo
  // WhatsApp, etc. — ver tabela public.notificacoes) ----
  //
  // Cada página chama vivoInitSinoNotificacoes(sb) já logada, passando
  // o client do Supabase que ela mesma criou. Conta quantas notificações
  // chegaram depois da última vez que alguém abriu a página
  // notificacoes.html neste navegador (marca salva em localStorage —
  // por isso é por aparelho/navegador, não por conta).
  var NOTIF_VISTO_KEY = 'notif_ultima_vista';

  async function vivoInitSinoNotificacoes(sb) {
    var sino = document.querySelector('.sino-notificacoes');
    if (!sino || !sb) return;
    var badge = sino.querySelector('.sino-badge');
    if (!badge) return;

    try {
      var ultimaVista = localStorage.getItem(NOTIF_VISTO_KEY) || '1970-01-01T00:00:00.000Z';
      var resultado = await sb
        .from('notificacoes')
        .select('id', { count: 'exact', head: true })
        .gt('criado_em', ultimaVista);
      if (resultado.error) return;
      var total = resultado.count || 0;
      if (total > 0) {
        badge.textContent = total > 99 ? '99+' : String(total);
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }
    } catch (e) {
      // Falha silenciosa — o sino simplesmente fica sem contador.
    }
  }

  window.vivoInitSinoNotificacoes = vivoInitSinoNotificacoes;

  // ---- VLibras (tradução em Libras do governo) ----
  //
  // Mesmo widget oficial usado nos cardápios digitais (acd-pizzaria-premium
  // etc.). Fica no canto onde ele mesmo se posiciona por padrão (direita);
  // por isso a barra de acessibilidade do painel (A-/A+/contraste/
  // narração/rolagem) mora do lado esquerdo — sem disputa de lugar.
  function initVLibras() {
    if (document.querySelector('[vw]')) return;

    var container = document.createElement('div');
    container.setAttribute('vw', '');
    container.className = 'enabled';
    container.innerHTML =
      '<div vw-access-button class="active"></div>' +
      '<div vw-plugin-wrapper>' +
        '<div class="vw-plugin-top-wrapper"></div>' +
      '</div>';
    document.body.appendChild(container);

    var script = document.createElement('script');
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    script.onload = function () {
      if (window.VLibras) new window.VLibras.Widget('https://vlibras.gov.br/app');
    };
    document.body.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVLibras);
  } else {
    initVLibras();
  }
})();
