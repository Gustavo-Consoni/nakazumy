/* ==========================================================================
   Nakazumy Sushi — comportamento da página (Alpine.js)

   Todo o conteúdo (cardápio, rodízio, galeria) está escrito direto no
   index.html, para que buscadores e redes sociais leiam tudo sem precisar
   executar JavaScript. Este arquivo só cuida da interação.

   Precisa ser carregado ANTES do Alpine (sem defer).
   ========================================================================== */

// Horário de funcionamento (todos os dias), em minutos desde 00:00
const SHIFTS = [
  { label: 'Almoço', from: 12 * 60, to: 15 * 60 },
  { label: 'Jantar', from: 19 * 60, to: 23 * 60 },
];

// "Salmão" -> "salmao": busca sem diferenciar acentos e maiúsculas
const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

document.addEventListener('alpine:init', () => {
  Alpine.data('site', () => ({
    scrolled: false,
    mobileOpen: false,
    activeSection: '',

    tab: 'entradas',
    query: '',

    gallery: [],
    lightbox: { open: false, index: 0 },

    now: new Date(),
    year: new Date().getFullYear(),

    init() {
      // A galeria do lightbox é lida das fotos que já estão no HTML
      this.gallery = [...document.querySelectorAll('[data-gallery] img')].map((img) => ({
        src: img.getAttribute('src'),
        alt: img.alt,
      }));
      this.onScroll();
      setInterval(() => (this.now = new Date()), 60 * 1000);
    },

    onScroll() {
      this.scrolled = window.scrollY > 24;
      const offset = window.innerHeight * 0.35;
      let current = '';
      document.querySelectorAll('main section[id]').forEach((s) => {
        if (s.getBoundingClientRect().top - offset <= 0) current = s.id;
      });
      this.activeSection = current;
    },

    /* ---------- Cardápio ---------- */
    get normalizedQuery() {
      return normalize(this.query.trim());
    },

    get searching() {
      return this.normalizedQuery.length >= 2;
    },

    // Cada <li> do cardápio tem data-s com nome, descrição, grupo e categoria já normalizados
    matches(el) {
      return el.dataset.s.includes(this.normalizedQuery);
    },

    hasMatch(el) {
      return [...el.querySelectorAll('[data-s]')].some((li) => this.matches(li));
    },

    get anyMatch() {
      return this.hasMatch(document.getElementById('cardapio'));
    },

    selectTab(id) {
      this.tab = id;
      this.query = '';
      this.$nextTick(() => {
        const btn = this.$refs.tabs?.querySelector(`[data-tab="${id}"]`);
        btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
    },

    /* ---------- Galeria ---------- */
    openLightbox(i) {
      this.lightbox = { open: true, index: i };
      document.documentElement.classList.add('overflow-hidden');
      this.$nextTick(() => this.$refs.lightboxClose?.focus());
    },
    closeLightbox() {
      this.lightbox.open = false;
      document.documentElement.classList.remove('overflow-hidden');
    },
    step(dir) {
      const n = this.gallery.length;
      this.lightbox.index = (this.lightbox.index + dir + n) % n;
    },

    /* ---------- Aberto agora ---------- */
    get spTime() {
      // Hora atual em Santos (America/Sao_Paulo), independente do fuso do visitante
      const parts = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      }).formatToParts(this.now);
      const get = (t) => Number(parts.find((p) => p.type === t).value);
      return get('hour') * 60 + get('minute');
    },

    get status() {
      const m = this.spTime;
      const fmt = (min) => `${Math.floor(min / 60)}h`;
      const open = SHIFTS.find((s) => m >= s.from && m < s.to);
      if (open) return { open: true, label: 'Aberto agora', detail: `até às ${fmt(open.to)}` };
      const next = SHIFTS.find((s) => m < s.from);
      if (next) return { open: false, label: 'Fechado agora', detail: `abre às ${fmt(next.from)}` };
      return { open: false, label: 'Fechado agora', detail: `abre amanhã às ${fmt(SHIFTS[0].from)}` };
    },
  }));
});
