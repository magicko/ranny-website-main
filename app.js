/* ================================
   Ranny - Lash Designer • app.js
   ================================ */

/* --------- Utilidades --------- */
// Obter número do WhatsApp do primeiro link encontrado na seção Localização
const getDefaultWhatsApp = () => {
  const link = document.querySelector('#localizacao a[href*="wa.me"], #localizacao a[href*="api.whatsapp.com"]');
  return link ? new URL(link.href) : null;
};

// Codifica mensagens de forma segura
const enc = (str) => encodeURIComponent(str);

/* --------- Smooth Scroll com offset --------- */
(() => {
  const header = document.querySelector('header.hero-section');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getOffset = () => {
    // Se no futuro houver navbar fixa, ajuste aqui
    const extra = 12; // respiro
    return extra;
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const id = a.getAttribute('href');
    if (id === '#') return;

    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.pageYOffset - getOffset();

    window.scrollTo({
      top,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });

    // Move foco para acessibilidade
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
})();

/* --------- Bootstrap ScrollSpy (se usar navbar fixa no futuro) --------- */
(() => {
  const main = document.querySelector('#main-content');
  if (!main) return;
  // Ativa scrollspy no body observando o main
  if (bootstrap && typeof bootstrap.ScrollSpy === 'function') {
    new bootstrap.ScrollSpy(document.body, {
      target: '#navbar', // id de uma navbar se existir
      rootMargin: '0px 0px -60%',
      offset: 80,
    });
  }
})();

/* --------- Carrossel de Depoimentos: autoplay + pausa no hover + swipe --------- */
(() => {
  const carouselEl = document.querySelector('#testimonialCarousel');
  if (!carouselEl || !bootstrap || !bootstrap.Carousel) return;

  const carousel = new bootstrap.Carousel(carouselEl, {
    interval: 5000,
    ride: 'carousel',
    pause: false,
    touch: true,
    wrap: true,
  });

  // Pausar no hover (desktop)
  carouselEl.addEventListener('mouseenter', () => carousel.pause());
  carouselEl.addEventListener('mouseleave', () => carousel.cycle());

  // Swipe manual (fallback robusto)
  let startX = 0;
  const threshold = 30;
  carouselEl.addEventListener('touchstart', (e) => {
    startX = e.changedTouches[0].clientX;
  });
  carouselEl.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > threshold) {
      if (dx < 0) carousel.next();
      else carousel.prev();
    }
  });
})();

/* --------- Acordeão do FAQ: fecha outros itens ao abrir (já é o comportamento do .flush) --------- */
// Como já está com data-bs-parent, o Bootstrap cuida disso.
// Complemento: rolar até a pergunta aberta para melhor UX
(() => {
  const acc = document.querySelector('#faqAccordion');
  if (!acc) return;

  acc.addEventListener('shown.bs.collapse', (e) => {
    const btn = e.target.previousElementSibling?.querySelector('button');
    if (!btn) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = btn.getBoundingClientRect().top + window.pageYOffset - 12;
    window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
  });
})();

/* --------- Botões de WhatsApp: mensagem automática por seção --------- */
(() => {
  // Mapeia CTAs para mensagens diferentes
  const sectionMessage = (sectionId) => {
    switch (sectionId) {
      case 'home':
        return 'Olá, vi seu site e quero agendar meus cílios. Pode me ajudar?';
      case 'sobre':
        return 'Oi, Ranny! Gostei do seu trabalho e quero saber valores e disponibilidade.';
      case 'especialidades':
        return 'Quero agendar: fiquei interessada nas suas especialidades. Como funciona?';
      case 'antes-depois':
        return 'Vi os resultados do antes e depois! Quero um olhar marcante. Pode me atender?';
      case 'depoimentos':
        return 'Os depoimentos são ótimos! Quero marcar um horário.';
      case 'estudio':
        return 'Quero conhecer seu estúdio e agendar um procedimento.';
      case 'localizacao':
        return 'Vi o endereço no site. Você tem horários disponíveis esta semana?';
      case 'faq':
        return 'Li o FAQ e tenho mais dúvidas. Pode me orientar e agendar?';
      default:
        return 'Olá! Quero agendar um horário para extensão de cílios/sobrancelhas.';
    }
  };

  // Seleciona todos os links que parecem WhatsApp e todos os CTAs que apontam para #contato
  const whatsLinks = Array.from(document.querySelectorAll('a[href*="wa.me"], a[href*="api.whatsapp.com"]'));
  const ctas = Array.from(document.querySelectorAll('a.btn.cta-button'));

  // Garante que todos os CTAs sem número virem WhatsApp com mensagem
  const base = getDefaultWhatsApp();
  if (base) {
    ctas.forEach((btn) => {
      // Se já for WhatsApp, deixa; se for âncora, transformamos em WhatsApp
      const isWhats = /wa\.me|api\.whatsapp\.com/.test(btn.href);
      if (!isWhats) {
        btn.dataset.forceWhats = '1';
      }
    });
  }

  const buildWhatsURL = (fromSection) => {
    const url = base ? new URL(base.href) : null;
    if (!url) return null;

    // Em wa.me, a mensagem vai como ?text=
    // Em api.whatsapp.com/send, idem.
    const msg = sectionMessage(fromSection);
    url.searchParams.set('text', msg);

    return url.toString();
  };

  const enhanceClick = (el) => {
    el.addEventListener('click', (e) => {
      const fromSection = el.closest('section, header, footer')?.id || 'site';
      const isWhats = /wa\.me|api\.whatsapp\.com/.test(el.href);
      const needsForce = el.dataset.forceWhats === '1';

      // Se já é Whats, apenas anexa a mensagem; se não, converte (quando possível)
      if (isWhats) {
        e.preventDefault();
        const u = new URL(el.href);
        const msg = sectionMessage(fromSection);
        u.searchParams.set('text', msg);
        window.open(u.toString(), '_blank', 'noopener,noreferrer');
      } else if (needsForce && base) {
        e.preventDefault();
        const final = buildWhatsURL(fromSection);
        if (final) window.open(final, '_blank', 'noopener,noreferrer');
      }
    });
  };

  [...whatsLinks, ...ctas].forEach(enhanceClick);
})();

/* --------- Botão "Voltar ao topo" (versão alinhada) --------- */
(() => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Voltar ao topo');

  // estilos base
  Object.assign(btn.style, {
    position: 'fixed',
    right: 'clamp(12px, 2vw, 24px)',
    bottom: 'clamp(12px, 2.5vw, 28px)',
    zIndex: '1050',
    display: 'none',
    width: '48px',
    height: '48px',
    padding: '0',
    border: 'none',
    borderRadius: '999px',
    background: '#d4af7a',
    color: '#121212',
    boxShadow: '0 6px 20px rgba(0,0,0,.25)',
    cursor: 'pointer',
    // alinhamento perfeito
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: '0',
  });

  // ícone SVG (centralizado geometricamente)
  btn.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7.41 14.59 12 10l4.59 4.59 1.41-1.41L12 7.17l-6 6z" fill="currentColor"/>
    </svg>
  `;

  document.body.appendChild(btn);

  const toggle = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    btn.style.display = y > 600 ? 'flex' : 'none';
  };
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();

  btn.addEventListener('click', () => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  });
})();

/* --------- Animações sutis ao entrar na tela --------- */
(() => {
  const targets = document.querySelectorAll(
    '.specialty-card, .logo, .hero-section h1, .hero-section p, .hero-section .btn, ' +
    '#sobre img, #especialidades h2, #antes-depois img, #depoimentos .testimonial-card, #estudio img, #localizacao .map-container'
  );

  // Adiciona classe base; defina no CSS:
  // .reveal { opacity: 0; transform: translateY(12px); transition: opacity .6s ease, transform .6s ease; }
  // .reveal.in { opacity: 1; transform: translateY(0); }
  targets.forEach((el) => el.classList.add('reveal'));

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((el) => io.observe(el));
})();

/* --------- Pequenos aprimoramentos de acessibilidade --------- */
(() => {
  // Marca o elemento principal como landmark (já é #main-content)
  const main = document.querySelector('#main-content');
  if (main && !main.hasAttribute('role')) {
    main.setAttribute('role', 'main');
  }

  // Garante aria-label nos botões do carrossel, caso o HTML seja alterado futuramente
  document.querySelectorAll('[data-bs-target="#testimonialCarousel"]').forEach((btn) => {
    const dir = btn.getAttribute('data-bs-slide');
    if (dir === 'prev' && !btn.getAttribute('aria-label')) btn.setAttribute('aria-label', 'Anterior');
    if (dir === 'next' && !btn.getAttribute('aria-label')) btn.setAttribute('aria-label', 'Próximo');
  });
})();

/* --------- Guarda simples de erros em produção --------- */
window.addEventListener('error', (e) => {
  // Evita travar a UX; aqui você poderia enviar para um serviço de logs se quiser
  // console.error('Erro capturado:', e.message);
}, true);