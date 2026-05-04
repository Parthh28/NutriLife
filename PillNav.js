/**
 * PillNav Vanilla JS Component
 * Adapted from React Bits PillNav
 */

class PillNav {
  constructor(options) {
    this.options = {
      container: options.container || '#pill-nav-root',
      logo: options.logo || '',
      logoAlt: options.logoAlt || 'Logo',
      items: options.items || [],
      activeHref: options.activeHref || '',
      ease: options.ease || 'power3.easeOut',
      baseColor: options.baseColor || '#3a7d44',
      pillColor: options.pillColor || '#ffffff',
      hoveredPillTextColor: options.hoveredPillTextColor || '#3a7d44',
      pillTextColor: options.pillTextColor || '#3a7d44',
      initialLoadAnimation: options.initialLoadAnimation !== undefined ? options.initialLoadAnimation : true,
      onItemClick: options.onItemClick || null
    };

    this.circleRefs = [];
    this.tlRefs = [];
    this.activeTweenRefs = [];
    this.isMobileMenuOpen = false;

    this.init();
  }

  init() {
    this.render();
    this.setupGSAP();
    this.addEventListeners();
    
    if (this.options.initialLoadAnimation) {
      this.runInitialAnimation();
    }
  }

  render() {
    const { logo, logoAlt, items, activeHref, baseColor, pillColor, hoveredPillTextColor, pillTextColor } = this.options;
    const resolvedPillTextColor = pillTextColor || baseColor;

    const cssVars = `
      --base: ${baseColor};
      --pill-bg: ${pillColor};
      --hover-text: ${hoveredPillTextColor};
      --pill-text: ${resolvedPillTextColor};
    `;

    const container = document.querySelector(this.options.container);
    if (!container) return;

    const html = `
      <div class="pill-nav-container">
        <nav class="pill-nav" aria-label="Primary" style="${cssVars}">
          ${logo ? `
            <a class="pill-logo" href="javascript:void(0)" aria-label="Home" id="pill-logo">
              <img src="${logo}" alt="${logoAlt}" id="pill-logo-img" />
            </a>
          ` : ''}

          <div class="pill-nav-items desktop-only" id="pill-nav-items">
            <ul class="pill-list" role="menubar">
              ${items.map((item, i) => `
                <li role="none">
                  <a role="menuitem" href="${item.href || '#'}" 
                     class="pill ${activeHref === item.href ? 'is-active' : ''}" 
                     data-index="${i}"
                     aria-label="${item.ariaLabel || item.label}">
                    <span class="hover-circle" aria-hidden="true"></span>
                    <span class="label-stack">
                      <span class="pill-label">${item.label}</span>
                      <span class="pill-label-hover" aria-hidden="true">${item.label}</span>
                    </span>
                  </a>
                </li>
              `).join('')}
            </ul>
          </div>

          <button class="mobile-menu-button mobile-only" id="pill-mobile-toggle" aria-label="Toggle menu">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>
        </nav>

        <div class="mobile-menu-popover mobile-only" id="pill-mobile-menu" style="${cssVars}">
          <ul class="mobile-menu-list">
            ${items.map((item, i) => `
              <li>
                <a href="${item.href || '#'}" 
                   class="mobile-menu-link ${activeHref === item.href ? 'is-active' : ''}"
                   data-index="${i}">
                  ${item.label}
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  setupGSAP() {
    const pills = document.querySelectorAll(`${this.options.container} .pill`);
    const circles = document.querySelectorAll(`${this.options.container} .hover-circle`);
    
    this.circleRefs = Array.from(circles);
    this.tlRefs = new Array(pills.length).fill(null);
    this.activeTweenRefs = new Array(pills.length).fill(null);

    const layout = () => {
      this.circleRefs.forEach((circle, i) => {
        if (!circle?.parentElement) return;

        const pill = circle.parentElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        if (w === 0) return; // Hidden or not rendered yet

        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;
        circle.style.left = `50%`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        });

        const label = pill.querySelector('.pill-label');
        const white = pill.querySelector('.pill-label-hover');

        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        if (this.tlRefs[i]) this.tlRefs[i].kill();
        const tl = gsap.timeline({ paused: true });

        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 0.4, ease: this.options.ease }, 0);

        if (label) {
          tl.to(label, { y: -(h + 8), duration: 0.4, ease: this.options.ease }, 0);
        }

        if (white) {
          gsap.set(white, { y: Math.ceil(h + 10), opacity: 0 });
          tl.to(white, { y: 0, opacity: 1, duration: 0.4, ease: this.options.ease }, 0);
        }

        this.tlRefs[i] = tl;
      });
    };

    layout();
    window.addEventListener('resize', () => layout());
    
    // Check for fonts ready
    if (document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(() => {});
    }
    
    // Initial hide for mobile menu
    const menu = document.getElementById('pill-mobile-menu');
    if (menu) {
      gsap.set(menu, { visibility: 'hidden', opacity: 0, scaleY: 1 });
    }
  }

  addEventListeners() {
    const pills = document.querySelectorAll(`${this.options.container} .pill`);
    const logo = document.getElementById('pill-logo');
    const toggle = document.getElementById('pill-mobile-toggle');
    const mobileLinks = document.querySelectorAll(`${this.options.container} .mobile-menu-link`);

    pills.forEach((pill, i) => {
      pill.addEventListener('mouseenter', () => this.handleEnter(i));
      pill.addEventListener('mouseleave', () => this.handleLeave(i));
      pill.addEventListener('click', (e) => {
        if (this.options.onItemClick) {
          e.preventDefault();
          const href = pill.getAttribute('href');
          this.options.onItemClick(href, pill.querySelector('.pill-label').innerText);
          this.setActive(href);
        }
      });
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        this.toggleMobileMenu(false);
        if (this.options.onItemClick) {
          e.preventDefault();
          const href = link.getAttribute('href');
          this.options.onItemClick(href, link.innerText.trim());
          this.setActive(href);
        }
      });
    });

    if (logo) {
      logo.addEventListener('mouseenter', () => this.handleLogoEnter());
      logo.addEventListener('click', (e) => {
        if (this.options.onItemClick) {
          e.preventDefault();
          this.options.onItemClick('home', 'Home');
          this.setActive('home');
        }
      });
    }

    if (toggle) {
      toggle.addEventListener('click', () => this.toggleMobileMenu());
    }
  }

  handleEnter(i) {
    const tl = this.tlRefs[i];
    if (!tl) return;
    if (this.activeTweenRefs[i]) this.activeTweenRefs[i].kill();
    this.activeTweenRefs[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease: this.options.ease,
      overwrite: 'auto'
    });
  }

  handleLeave(i) {
    const tl = this.tlRefs[i];
    if (!tl) return;
    if (this.activeTweenRefs[i]) this.activeTweenRefs[i].kill();
    this.activeTweenRefs[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease: this.options.ease,
      overwrite: 'auto'
    });
  }

  handleLogoEnter() {
    const img = document.getElementById('pill-logo-img');
    if (!img) return;
    gsap.to(img, {
      rotate: 360,
      duration: 0.6,
      ease: this.options.ease,
      overwrite: 'auto',
      onComplete: () => gsap.set(img, { rotate: 0 })
    });
  }

  toggleMobileMenu(forceState) {
    this.isMobileMenuOpen = forceState !== undefined ? forceState : !this.isMobileMenuOpen;
    const newState = this.isMobileMenuOpen;

    const hamburger = document.getElementById('pill-mobile-toggle');
    const menu = document.getElementById('pill-mobile-menu');

    if (hamburger) {
      const lines = hamburger.querySelectorAll('.hamburger-line');
      if (newState) {
        gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease: this.options.ease });
        gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease: this.options.ease });
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease: this.options.ease });
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease: this.options.ease });
      }
    }

    if (menu) {
      if (newState) {
        gsap.set(menu, { visibility: 'visible' });
        gsap.fromTo(
          menu,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: this.options.ease
          }
        );
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 10,
          duration: 0.2,
          ease: this.options.ease,
          onComplete: () => {
            gsap.set(menu, { visibility: 'hidden' });
          }
        });
      }
    }
  }

  runInitialAnimation() {
    const logo = document.getElementById('pill-logo');
    const navItems = document.getElementById('pill-nav-items');

    if (logo) {
      gsap.set(logo, { scale: 0 });
      gsap.to(logo, {
        scale: 1,
        duration: 0.6,
        ease: this.options.ease
      });
    }

    if (navItems) {
      gsap.set(navItems, { width: 0, opacity: 0 });
      gsap.to(navItems, {
        width: 'auto',
        opacity: 1,
        duration: 0.8,
        delay: 0.2,
        ease: this.options.ease
      });
    }
  }

  setActive(href) {
    this.options.activeHref = href;
    const pills = document.querySelectorAll(`${this.options.container} .pill`);
    const mobileLinks = document.querySelectorAll(`${this.options.container} .mobile-menu-link`);

    pills.forEach(p => {
      if (p.getAttribute('href') === href) p.classList.add('is-active');
      else p.classList.remove('is-active');
    });

    mobileLinks.forEach(l => {
      if (l.getAttribute('href') === href) l.classList.add('is-active');
      else l.classList.remove('is-active');
    });
  }
}

// Global initialization function
window.initPillNav = (options) => new PillNav(options);
