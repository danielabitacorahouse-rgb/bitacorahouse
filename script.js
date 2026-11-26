document.addEventListener('DOMContentLoaded', () => {
  const isMobileDevice = window.innerWidth <= 900;

  const heroTextBlock = document.getElementById('heroTextBlock');
  const bgVideoEl = document.getElementById('bgVideo');
  const track = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const cursor = document.getElementById('customCursor');

  /* ========================================================
     0. CONTROL RÁPIDO DEL LOADER (NO ESPERA A VIDEOS EXTERNOS)
     ======================================================== */
  const loader = document.getElementById('contenedor-loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('oculto');
      setTimeout(() => {
        loader.remove();
      }, 600);
    }, 600);
  }

  /* ========================================================
     1. VIDEO DE FONDO (ACTIVO EN MÓVIL, SAFARI Y ESCRITORIO)
     ======================================================== */
  const IDLE_SPEED = 0.85;
  const MAX_SPEED = 3.8;
  let targetRate = IDLE_SPEED;
  let currentRate = IDLE_SPEED;
  let lastScrollY = window.scrollY;
  let scrollTimeout = null;

  if (bgVideoEl && bgVideoEl.tagName.toLowerCase() === 'video') {
    bgVideoEl.muted = true;
    bgVideoEl.defaultMuted = true;
    bgVideoEl.setAttribute('muted', '');
    bgVideoEl.setAttribute('playsinline', '');
    bgVideoEl.playbackRate = isMobileDevice ? 0.75 : IDLE_SPEED;

    const startBgVideo = () => {
      bgVideoEl.play().catch(() => {});
    };

    startBgVideo();
    document.addEventListener('touchstart', startBgVideo, { once: true, passive: true });
    document.addEventListener('click', startBgVideo, { once: true });

    if (!isMobileDevice) {
      function updateBgSpeed() {
        currentRate += (targetRate - currentRate) * 0.1;
        if (!bgVideoEl.paused) {
          bgVideoEl.playbackRate = Math.max(IDLE_SPEED, Math.min(currentRate, MAX_SPEED));
        }
        requestAnimationFrame(updateBgSpeed);
      }
      requestAnimationFrame(updateBgSpeed);
    }
  }

  /* ========================================================
     2. CARRUSEL CONTINUO + CONTROLES DE VIDEO (PLAY & MUTE)
     ======================================================== */
  let currentOffset = 0;
  const speed = 0.75;
  let isHovered = false;
  const cardWidth = isMobileDevice ? 200 : 250;
  const cardGap = 24;
  let singleLoopWidth = 0;

  if (track) {
    const originalCards = Array.from(track.children);
    singleLoopWidth = originalCards.length * (cardWidth + cardGap);

    originalCards.forEach(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      const cloneVid = clone.querySelector('video');
      if (cloneVid) cloneVid.preload = 'none';
      track.appendChild(clone);
    });
  }

  function animateCarousel() {
    if (track && !isHovered && singleLoopWidth > 0) {
      currentOffset -= speed;
      if (Math.abs(currentOffset) >= singleLoopWidth) {
        currentOffset += singleLoopWidth;
      }
      track.style.transform = `translate3d(${currentOffset}px, 0, 0)`;
    }
    requestAnimationFrame(animateCarousel);
  }
  requestAnimationFrame(animateCarousel);

  if (track) {
    track.addEventListener('mouseenter', () => { isHovered = true; });
    track.addEventListener('mouseleave', () => { isHovered = false; });
  }

  const stepJump = cardWidth + cardGap;

  if (nextBtn && track) {
    nextBtn.addEventListener('click', () => {
      currentOffset -= stepJump;
      if (Math.abs(currentOffset) >= singleLoopWidth) {
        currentOffset += singleLoopWidth;
      }
      track.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
      track.style.transform = `translate3d(${currentOffset}px, 0, 0)`;
      setTimeout(() => { track.style.transition = 'none'; }, 400);
    });
  }

  if (prevBtn && track) {
    prevBtn.addEventListener('click', () => {
      currentOffset += stepJump;
      if (currentOffset > 0) {
        currentOffset -= singleLoopWidth;
      }
      track.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
      track.style.transform = `translate3d(${currentOffset}px, 0, 0)`;
      setTimeout(() => { track.style.transition = 'none'; }, 400);
    });
  }

  // Delegación de eventos para Play y Mute (funciona en tarjetas originales y clonadas)
  document.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.btn-play');
    const muteBtn = e.target.closest('.btn-mute');

    if (playBtn) {
      e.stopPropagation();
      const card = playBtn.closest('.reel-card');
      const video = card ? card.querySelector('.reel-video') : null;
      if (!video) return;

      if (video.paused) {
        video.play().catch(() => {});
        card.classList.add('is-playing');
      } else {
        video.pause();
        card.classList.remove('is-playing');
      }
    }

    if (muteBtn) {
      e.stopPropagation();
      const card = muteBtn.closest('.reel-card');
      const video = card ? card.querySelector('.reel-video') : null;
      if (!video) return;

      video.muted = !video.muted;
      card.classList.toggle('is-unmuted', !video.muted);
    }
  });

  /* ========================================================
     2.5. ASIGNACIÓN Y CARGA DE VIDEOS DESKTOP VS MOBILE (BRAND.HTML)
     ======================================================== */
  const stackedVideos = document.querySelectorAll('.stacked-video');
  stackedVideos.forEach(video => {
    const desktopSrc = video.getAttribute('data-desktop-src');
    const mobileSrc = video.getAttribute('data-mobile-src');
    const originalSrc = video.getAttribute('src');
    let chosenSrc = null;

    if (desktopSrc || mobileSrc) {
      chosenSrc = isMobileDevice ? (mobileSrc || desktopSrc) : desktopSrc;
    } else if (originalSrc) {
      chosenSrc = isMobileDevice ? originalSrc.replace(/(\.[^.]+)$/, 'mob$1') : originalSrc;
    }

    if (chosenSrc) {
      video.src = chosenSrc;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.load();
      video.play().catch(() => {});
    }
  });

  /* ========================================================
     3. PRECARGA CONTROLADA + REPRODUCCIÓN INTELIGENTE
     ======================================================== */
  const allVideos = document.querySelectorAll('.reel-video');

  if (allVideos.length > 0) {
    const preloadObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target;
          if (video.preload === 'none') {
            video.preload = 'metadata';
            video.load();
          }
          obs.unobserve(video);
        }
      });
    }, {
      rootMargin: '300px 200px 300px 200px',
      threshold: 0.01
    });

    allVideos.forEach(vid => preloadObserver.observe(vid));

    const activeVideos = new Set();
    const maxSimultaneous = isMobileDevice ? 2 : 4;

    const playObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target;
        const card = video.closest('.reel-card');

        if (entry.isIntersecting) {
          if (activeVideos.size >= maxSimultaneous) {
            const oldest = activeVideos.values().next().value;
            if (oldest && oldest !== video) {
              oldest.pause();
              const oldCard = oldest.closest('.reel-card');
              if (oldCard) oldCard.classList.remove('is-playing');
              activeVideos.delete(oldest);
            }
          }

          video.play().then(() => {
            activeVideos.add(video);
            if (card) card.classList.add('is-playing');
          }).catch(() => {});
        } else {
          video.pause();
          activeVideos.delete(video);
          if (card) card.classList.remove('is-playing');
        }
      });
    }, {
      threshold: 0.4
    });

    allVideos.forEach(vid => playObserver.observe(vid));
  }

  /* ========================================================
     4. ACORDEÓN INTERACTIVO DE SERVICIOS
     ======================================================== */
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.tagName.toLowerCase() === 'a') return;

      const isAlreadyActive = item.classList.contains('active');
      accordionItems.forEach(el => el.classList.remove('active'));

      if (!isAlreadyActive) {
        item.classList.add('active');
      }
    });
  });

  /* ========================================================
     5. REVELADO SCROLL: HACIA ARRIBA Y LATERALES
     ======================================================== */
  const revealElements = document.querySelectorAll('.scroll-reveal, .slide-in-left, .slide-in-right');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      } else {
        entry.target.classList.remove('is-visible');
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  /* ========================================================
     6. CURSOR MAGNÉTICO + TILT 3D (SOLO ESCRITORIO)
     ======================================================== */
  if (!isMobileDevice) {
    let mouseX = -100;
    let mouseY = -100;
    let cursorX = -100;
    let cursorY = -100;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function renderCursor() {
      cursorX += (mouseX - cursorX) * 0.18;
      cursorY += (mouseY - cursorY) * 0.18;
      if (cursor) {
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
      }
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    const brandItems = document.querySelectorAll('.brand-item');
    brandItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        if (cursor) cursor.classList.add('is-active');
      });

      item.addEventListener('mouseleave', () => {
        if (cursor) cursor.classList.remove('is-active');
        const wrapper = item.querySelector('.brand-image-wrapper');
        if (wrapper) {
          wrapper.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        }
      });

      item.addEventListener('mousemove', (e) => {
        const wrapper = item.querySelector('.brand-image-wrapper');
        if (!wrapper) return;

        const rect = item.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -9;
        const rotateY = ((x - centerX) / centerX) * 9;

        wrapper.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
    });

    const clientItems = document.querySelectorAll('.client-item');
    clientItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        if (cursor) cursor.classList.add('is-active', 'is-client');
      });

      item.addEventListener('mouseleave', () => {
        if (cursor) cursor.classList.remove('is-active', 'is-client');
      });
    });
  }

  /* ========================================================
     7. ANIMACIÓN DE NÚMEROS (CONTADORES)
     ======================================================== */
  const counters = document.querySelectorAll('.counter');

  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = +entry.target.getAttribute('data-target');
        const format = entry.target.getAttribute('data-format');
        let count = Math.max(0, target - 100);

        const updateCount = () => {
          const diff = target - count;
          count += diff * 0.05;

          if (diff < 1) {
            count = target;
          }

          if (count < target) {
            let displayVal = Math.floor(count);
            if (format === 'mil') {
              displayVal = displayVal.toLocaleString('es-ES');
            }
            entry.target.innerText = '+' + displayVal;
            requestAnimationFrame(updateCount);
          } else {
            let finalVal = target;
            if (format === 'mil') {
              finalVal = finalVal.toLocaleString('es-ES');
            }
            entry.target.innerText = '+' + finalVal;
          }
        };

        updateCount();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  counters.forEach(counter => counterObserver.observe(counter));

  /* ========================================================
     8. CARRUSEL DE VISUAL DIRECTION (PUNTOS DE PAGINACIÓN)
     ======================================================== */
  const vdTrack = document.getElementById('vdCarouselTrack');
  const vdDots = document.querySelectorAll('.vd-dot');

  if (vdTrack && vdDots.length > 0) {
    vdDots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        vdTrack.style.transform = `translateX(-${index * 100}%)`;
        vdDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
      });
    });
  }

  /* ========================================================
     9. MINI CARRUSELES DE SOCIAL MEDIA (AUTOPLAY)
     ======================================================== */
  const autoCarousels = document.querySelectorAll('.auto-carousel');

  autoCarousels.forEach(carousel => {
    const cTrack = carousel.querySelector('.auto-carousel-track');
    const dots = carousel.querySelectorAll('.post-dot');

    if (!cTrack || dots.length === 0) return;

    const totalSlides = dots.length;
    let currentIndex = 0;

    setInterval(() => {
      currentIndex = (currentIndex + 1) % totalSlides;
      cTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
      dots.forEach(dot => dot.classList.remove('active'));
      dots[currentIndex].classList.add('active');
    }, 3000);
  });

  /* ========================================================
     10. EVENTO DE SCROLL UNIFICADO (HERO, BG SPEED Y BLUR-FOCUS)
     ======================================================== */
  const focusElements = document.querySelectorAll('.scroll-blur-focus');
  const brandHeroSection = document.getElementById('brandsHeroContainer');
  const brandTitle = document.getElementById('bhTitle');
  const brandSubtitle = document.getElementById('bhSubtitle');
  let tickingScroll = false;

  function handleScrollEffects() {
    const currentScrollY = window.scrollY;
    const delta = Math.abs(currentScrollY - lastScrollY);
    lastScrollY = currentScrollY;

    if (heroTextBlock) {
      const maxHeroScroll = 420;
      const heroProgress = Math.min(currentScrollY / maxHeroScroll, 1);
      heroTextBlock.style.filter = `blur(${(heroProgress * 18).toFixed(1)}px)`;
      heroTextBlock.style.opacity = (1 - (heroProgress * 0.85)).toFixed(2);
      heroTextBlock.style.transform = `scale(${(1 - (heroProgress * 0.05)).toFixed(3)})`;
    }

    if (!isMobileDevice && bgVideoEl) {
      targetRate = IDLE_SPEED + (delta * 0.35);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        targetRate = IDLE_SPEED;
      }, 100);
    }

    if (!isMobileDevice && focusElements.length > 0) {
      const windowHeight = window.innerHeight;
      const windowCenter = windowHeight / 2;

      focusElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        let distanceFromCenter = 0;

        if (windowCenter < rect.top) {
          distanceFromCenter = rect.top - windowCenter;
        } else if (windowCenter > rect.bottom) {
          distanceFromCenter = windowCenter - rect.bottom;
        }

        const threshold = windowHeight * 0.25;
        if (distanceFromCenter > threshold) {
          const excessDistance = distanceFromCenter - threshold;
          const progress = Math.min(excessDistance / (windowHeight * 0.3), 1);
          el.style.filter = `blur(${(progress * 15).toFixed(1)}px)`;
          el.style.opacity = (1 - (progress * 0.7)).toFixed(2);
        } else {
          el.style.filter = 'blur(0px)';
          el.style.opacity = '1';
        }
      });
    }

    if (brandHeroSection && brandTitle && brandSubtitle) {
      const rect = brandHeroSection.getBoundingClientRect();
      const scrollDistance = rect.height - window.innerHeight;
      let progress = -rect.top / scrollDistance;
      progress = Math.max(0, Math.min(1, progress));

      const topPos = 75 - (progress * 45);
      const maxGrow = isMobileDevice ? 0.25 : 0.8;
      const scaleVal = 1 + (progress * maxGrow);

      brandTitle.style.top = `${topPos}%`;
      brandTitle.style.transform = `translate(-50%, -50%) scale(${scaleVal})`;

      if (progress > 0.6) {
        const subProgress = (progress - 0.6) / 0.4;
        brandSubtitle.style.opacity = subProgress;
        brandSubtitle.style.transform = `translateY(${20 - (subProgress * 20)}px)`;
      } else {
        brandSubtitle.style.opacity = 0;
        brandSubtitle.style.transform = 'translateY(20px)';
      }
    }

    tickingScroll = false;
  }

  window.addEventListener('scroll', () => {
    if (!tickingScroll) {
      window.requestAnimationFrame(handleScrollEffects);
      tickingScroll = true;
    }
  }, { passive: true });

  /* ========================================================
     11. CONTROL DE GALERÍAS DE BRANDING (1, 2 y 3 + ÚNICA)
     ======================================================== */
  const singlePrev = document.getElementById('brandGalleryPrev');
  const singleNext = document.getElementById('brandGalleryNext');
  const singleTrack = document.getElementById('brandGalleryTrack');

  if (singleTrack && singleNext && singlePrev) {
    const viewport = singleTrack.parentElement;
    viewport.addEventListener('scroll', () => {
      singlePrev.classList.toggle('is-visible', viewport.scrollLeft > 10);
    }, { passive: true });

    singleNext.addEventListener('click', () => viewport.scrollBy({ left: 410, behavior: 'smooth' }));
    singlePrev.addEventListener('click', () => viewport.scrollBy({ left: -410, behavior: 'smooth' }));
  }

  for (let i = 1; i <= 3; i++) {
    const gPrevBtn = document.getElementById(`brandGalleryPrev${i}`);
    const gNextBtn = document.getElementById(`brandGalleryNext${i}`);
    const gTrack = document.getElementById(`brandGalleryTrack${i}`);

    if (gTrack && gNextBtn && gPrevBtn) {
      const viewport = gTrack.parentElement;

      viewport.addEventListener('scroll', () => {
        gPrevBtn.classList.toggle('is-visible', viewport.scrollLeft > 10);
      }, { passive: true });

      gNextBtn.addEventListener('click', () => {
        viewport.scrollBy({ left: 410, behavior: 'smooth' });
      });

      gPrevBtn.addEventListener('click', () => {
        viewport.scrollBy({ left: -410, behavior: 'smooth' });
      });
    }
  }

  /* ========================================================
     12. MODAL DE REPRODUCTOR DE VIDEO PARA CARRUSELES
     ======================================================== */
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'video-modal-overlay';
  modalOverlay.id = 'videoModalOverlay';
  modalOverlay.innerHTML = `
    <div class="video-modal-container">
      <video class="video-modal-player" id="videoModalPlayer" controls playsinline loop></video>
      <button class="video-modal-close" id="videoModalClose" aria-label="Cerrar video">&times;</button>
    </div>
  `;
  document.body.appendChild(modalOverlay);

  const modalPlayer = document.getElementById('videoModalPlayer');
  const modalCloseBtn = document.getElementById('videoModalClose');

  function openVideoModal(videoSrc) {
    if (!videoSrc) return;

    document.querySelectorAll('.reel-video').forEach(v => {
      v.pause();
      const card = v.closest('.reel-card');
      if (card) card.classList.remove('is-playing');
    });

    if (bgVideoEl && !bgVideoEl.paused) {
      bgVideoEl.pause();
    }

    modalPlayer.src = videoSrc;
    modalPlayer.muted = false;
    modalOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    modalPlayer.play().catch(() => {});
  }

  function closeVideoModal() {
    modalOverlay.classList.remove('is-open');
    modalPlayer.pause();
    modalPlayer.removeAttribute('src');
    modalPlayer.load();
    document.body.style.overflow = '';

    if (bgVideoEl) {
      bgVideoEl.play().catch(() => {});
    }
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.reel-card');
    if (!card) return;

    if (e.target.closest('.reel-controls') || e.target.closest('a')) return;

    const video = card.querySelector('.reel-video');
    if (video) {
      const src = video.currentSrc || video.getAttribute('src');
      openVideoModal(src);
    }
  });

  modalCloseBtn.addEventListener('click', closeVideoModal);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeVideoModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) {
      closeVideoModal();
    }
  });
});


/* ========================================================
     8. CARRUSEL DE VISUAL DIRECTION (PUNTOS + DESLIZAR CON DEDO)
     ======================================================== */
  const vdTrack = document.getElementById('vdCarouselTrack');
  const vdDots = document.querySelectorAll('.vd-dot');

  if (vdTrack && vdDots.length > 0) {
    let vdIndex = 0;
    const totalVd = vdDots.length;

    function goToVdSlide(index) {
      vdIndex = (index + totalVd) % totalVd;
      vdTrack.style.transform = `translateX(-${vdIndex * 100}%)`;
      vdDots.forEach(d => d.classList.remove('active'));
      vdDots[vdIndex].classList.add('active');
    }

    vdDots.forEach((dot, index) => {
      dot.addEventListener('click', () => goToVdSlide(index));
    });

    // Soporte táctil (Swipe con el dedo)
    let vdStartX = 0;
    vdTrack.addEventListener('touchstart', (e) => {
      vdStartX = e.touches[0].clientX;
    }, { passive: true });

    vdTrack.addEventListener('touchend', (e) => {
      const diffX = vdStartX - e.changedTouches[0].clientX;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) {
          goToVdSlide(vdIndex + 1); // Deslizar a la izquierda -> siguiente
        } else {
          goToVdSlide(vdIndex - 1); // Deslizar a la derecha -> anterior
        }
      }
    }, { passive: true });
  }

  /* ========================================================
     9. MINI CARRUSELES DE SOCIAL MEDIA (AUTOPLAY + DESLIZAR CON DEDO)
     ======================================================== */
  const autoCarousels = document.querySelectorAll('.auto-carousel');

  autoCarousels.forEach(carousel => {
    const cTrack = carousel.querySelector('.auto-carousel-track');
    const dots = carousel.querySelectorAll('.post-dot');

    if (!cTrack || dots.length === 0) return;

    const totalSlides = dots.length;
    let currentIndex = 0;

    function goToPostSlide(index) {
      currentIndex = (index + totalSlides) % totalSlides;
      cTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
      dots.forEach(dot => dot.classList.remove('active'));
      dots[currentIndex].classList.add('active');
    }

    let autoTimer = setInterval(() => {
      goToPostSlide(currentIndex + 1);
    }, 3000);

    // Soporte táctil (Swipe con el dedo)
    let postStartX = 0;
    carousel.addEventListener('touchstart', (e) => {
      postStartX = e.touches[0].clientX;
      clearInterval(autoTimer); // Pausa el autoplay mientras toca
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
      const diffX = postStartX - e.changedTouches[0].clientX;
      if (Math.abs(diffX) > 35) {
        if (diffX > 0) {
          goToPostSlide(currentIndex + 1);
        } else {
          goToPostSlide(currentIndex - 1);
        }
      }
      // Reanuda el autoplay después de deslizar
      autoTimer = setInterval(() => {
        goToPostSlide(currentIndex + 1);
      }, 3000);
    }, { passive: true });
  });

  // Deslizar carrusel de reels con el dedo en móvil
  if (track) {
    let reelStartX = 0;
    let reelPrevOffset = 0;

    track.addEventListener('touchstart', (e) => {
      isHovered = true;
      reelStartX = e.touches[0].clientX;
      reelPrevOffset = currentOffset;
      track.style.transition = 'none';
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      const deltaX = e.touches[0].clientX - reelStartX;
      currentOffset = reelPrevOffset + deltaX;
      if (currentOffset > 0) currentOffset -= singleLoopWidth;
      if (Math.abs(currentOffset) >= singleLoopWidth) currentOffset += singleLoopWidth;
      track.style.transform = `translate3d(${currentOffset}px, 0, 0)`;
    }, { passive: true });

    track.addEventListener('touchend', () => {
      isHovered = false;
    }, { passive: true });
  }