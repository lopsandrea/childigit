/* CHILDIGIT 2027 — small progressive enhancements. The page works without JS. */
(() => {
  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();

  /* Mobile menu ----------------------------------------------------------- */
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-menu');

  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    header.classList.toggle('menu-open', open);
  };

  toggle.addEventListener('click', () => {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  header.addEventListener('focusout', (event) => {
    if (header.classList.contains('menu-open') && !header.contains(event.relatedTarget)) setMenu(false);
  });

  /* Header border once the page scrolls ------------------------------------ */
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Highlight the current section in the nav ------------------------------ */
  const navLinks = [...menu.querySelectorAll('a:not(.btn)[href^="#"]')];
  const linkFor = new Map(navLinks.map((a) => [a.hash.slice(1), a]));

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.removeAttribute('aria-current'));
        linkFor.get(entry.target.id)?.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    linkFor.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* Countdown to the submission deadline ----------------------------------- */
  document.querySelectorAll('[data-deadline]').forEach((el) => {
    const left = Date.parse(el.dataset.deadline) - now;
    const num = el.querySelector('[data-count]');
    const label = el.querySelector('[data-count-label]');
    const days = Math.floor(left / DAY);
    num.parentElement.hidden = false;

    if (left <= 0) {
      el.classList.add('is-closed');
      num.textContent = '0';
      label.textContent = 'submissions closed';
    } else if (days === 0) {
      num.textContent = '<1';
      label.textContent = 'day to go';
    } else {
      num.textContent = String(days);
      label.textContent = days === 1 ? 'day to go' : 'days to go';
    }
  });

  /* Timeline status: passed / next up / upcoming -------------------------- */
  let nextFound = false;
  document.querySelectorAll('.tl-item[data-ends]').forEach((item) => {
    const status = item.querySelector('.tl-status');
    if (Date.parse(item.dataset.ends) < now) {
      item.classList.add('is-past');
      status.textContent = 'Passed';
    } else if (!nextFound) {
      item.classList.add('is-next');
      status.textContent = 'Next up';
      nextFound = true;
    } else {
      status.textContent = 'Upcoming';
    }
  });

  /* Copy e-mail subject ----------------------------------------------------- */
  const copyStatus = document.getElementById('copy-status');
  document.querySelectorAll('[data-copy]').forEach((button) => {
    if (!navigator.clipboard) {
      button.hidden = true;
      return;
    }
    const label = button.querySelector('.copy-label');
    button.addEventListener('click', async () => {
      const text = document.querySelector(button.dataset.copy).textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
        button.classList.add('is-done');
        label.textContent = 'Copied!';
        copyStatus.textContent = 'E-mail subject copied to the clipboard.';
      } catch {
        label.textContent = 'Copy failed';
        copyStatus.textContent = 'Copy failed: please select the subject and copy it manually.';
      }
      setTimeout(() => {
        button.classList.remove('is-done');
        label.textContent = 'Copy';
        copyStatus.textContent = '';
      }, 3000);
    });
  });

  /* Expandable bios --------------------------------------------------------- */
  const toggles = [...document.querySelectorAll('.bio-toggle')];

  const refreshBios = () => {
    toggles.forEach((button) => {
      const bio = document.getElementById(button.getAttribute('aria-controls'));
      if (bio.classList.contains('is-open')) return;
      bio.classList.remove('fits');
      const fits = bio.scrollHeight <= bio.clientHeight + 2;
      bio.classList.toggle('fits', fits);
      button.hidden = fits;
    });
  };

  toggles.forEach((button) => {
    button.addEventListener('click', () => {
      const bio = document.getElementById(button.getAttribute('aria-controls'));
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      bio.classList.toggle('is-open', open);
      button.querySelector('.bio-toggle-label').textContent = open ? 'Show less' : 'Read full bio';
    });
  });

  refreshBios();
  document.fonts?.ready.then(refreshBios);
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refreshBios, 150);
  });
})();
