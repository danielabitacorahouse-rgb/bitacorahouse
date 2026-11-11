document.addEventListener('DOMContentLoaded', () => {
  const heroTextBlock = document.getElementById('heroTextBlock');
  const bgVideo = document.getElementById('bgVideo');
  const track = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const cursor = document.getElementById('customCursor');

  /* ========================================================
     1. Video en Reproducción Nativa + Inercia por Scroll
     ======================================================== */
  const BASE_SPEED = 0.5;
  const MAX_SPEED = 2.8;
  let targetSpeed = BASE_SPEED;
  let currentSpeed = BASE_SPEED;
  let lastScrollY = window.scrollY;
  let scrollTimeout = null;

  function startVideo() {
    if (bgVideo) {
      bgVideo.playbackRate = BASE_SPEED;
      bgVideo.play().catch(() => {});
    }
  }

  if (bgVideo) {
    bgVideo.addEventListener('loadedmetadata', startVideo);
    if (bgVideo.readyState >= 2) {
      startVideo();
    }
  }

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const delta = Math.abs(currentScrollY - lastScrollY);
    lastScrollY = currentScrollY;

    // Titular hero original (webs.html): Difuminado progresivo
    const maxHeroScroll = 420;
    const heroProgress = Math.min(currentScrollY / maxHeroScroll, 1);
    if (heroTextBlock) {
      heroTextBlock.style.filter = `blur(${(heroProgress * 18).toFixed(1)}px)`;
      heroTextBlock.style.opacity = (1 - (heroProgress * 0.85)).toFixed(2);
      heroTextBlock.style.transform = `scale(${(1 - (heroProgress * 0.05)).toFixed(3)})`;
    }

    // Acelera la velocidad del video según la fuerza del scroll
    const boost = Math.min(delta * 0.045, MAX_SPEED - BASE_SPEED);
    targetSpeed = BASE_SPEED + boost;

    // Al detenerse el scroll, regresa a la velocidad base suavemente
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      targetSpeed = BASE_SPEED;
    }, 100);
  }, { passive: true });

  function updatePlaybackSpeed() {
    currentSpeed += (targetSpeed - currentSpeed) * 0.08;
    if (bgVideo && !bgVideo.paused) {
      bgVideo.playbackRate = Math.max(0.2, currentSpeed);
    }
    requestAnimationFrame(updatePlaybackSpeed);
  }
  requestAnimationFrame(updatePlaybackSpeed);


  /* ========================================================
     2. Carrusel Continuo + Controles de Video (Play & Mute)
     ======================================================== */
  let currentOffset = 0;
  const speed = 0.75;
  let isHovered = false;

  const totalCards = 5;
  const cardWidth = 250;
  const cardGap = 24;
  const singleLoopWidth = totalCards * (cardWidth + cardGap);

  function animateCarousel() {
    if (track && !isHovered) {
      currentOffset -= speed;
      if (Math.abs(currentOffset) >= singleLoopWidth) {
        currentOffset += singleLoopWidth;
      }
      track.style.transform = `translateX(${currentOffset}px)`;
    }
    requestAnimationFrame(animateCarousel);
  }
  requestAnimationFrame(animateCarousel);

  if (track) {
    track.addEventListener('mouseenter', () => isHovered = true);
    track.addEventListener('mouseleave', () => isHovered = false);
  }

  const stepJump = cardWidth + cardGap;

  if (nextBtn && track) {
    nextBtn.addEventListener('click', () => {
      currentOffset -= stepJump;
      if (Math.abs(currentOffset) >= singleLoopWidth) {
        currentOffset += singleLoopWidth;
      }
      track.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
      track.style.transform = `translateX(${currentOffset}px)`;
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
      track.style.transform = `translateX(${currentOffset}px)`;
      setTimeout(() => { track.style.transition = 'none'; }, 400);
    });
  }

  const reelCards = document.querySelectorAll('.reel-card');

  reelCards.forEach(card => {
    const video = card.querySelector('.reel-video');
    const playBtn = card.querySelector('.btn-play');
    const muteBtn = card.querySelector('.btn-mute');

    if (!video) return;

    video.muted = true;
    card.classList.remove('is-unmuted');

    if (!video.paused) {
      card.classList.add('is-playing');
    }

    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (video.paused) {
          video.currentTime = 0;
          video.play();
          card.classList.add('is-playing');
        } else {
          video.pause();
          card.classList.remove('is-playing');
        }
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        video.muted = !video.muted;
        if (video.muted) {
          card.classList.remove('is-unmuted');
        } else {
          card.classList.add('is-unmuted');
        }
      });
    }
  });


  /* ========================================================
     3. Acordeón Interactivo de Servicios
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
     4. Revelado Scroll: Hacia arriba y Laterales
     ======================================================== */
  const revealElements = document.querySelectorAll('.scroll-reveal, .slide-in-left, .slide-in-right');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      } else {
        // Se remueve para que el efecto ocurra de nuevo si subes y bajas en la página
        entry.target.classList.remove('is-visible');
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));


  /* ========================================================
     5. Cursor Magnético (Círculo con Flecha ↗) + Tilt 3D
     ======================================================== */
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


  /* ========================================================
     6. Animación de Números (Iniciando 100 números antes)
     ======================================================== */
  const counters = document.querySelectorAll('.counter');
  
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = +entry.target.getAttribute('data-target');
        const format = entry.target.getAttribute('data-format');
        
        // Arranca 100 números antes. Si el target es menor a 100 (ej. 50), arranca en 0.
        let count = Math.max(0, target - 100);
        
        const updateCount = () => {
          const diff = target - count;
          // Flujo elegante
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
     7. Carrusel de Visual Direction (Puntos de Paginación)
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
     8. Mini Carruseles de Social Media (Autoplay)
     ======================================================== */
  const autoCarousels = document.querySelectorAll('.auto-carousel');

  autoCarousels.forEach(carousel => {
    const track = carousel.querySelector('.auto-carousel-track');
    const dots = carousel.querySelectorAll('.post-dot');
    
    if (!track || dots.length === 0) return;

    const totalSlides = dots.length;
    let currentIndex = 0;

    function moveNextSlide() {
      currentIndex = (currentIndex + 1) % totalSlides;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      
      dots.forEach(dot => dot.classList.remove('active'));
      dots[currentIndex].classList.add('active');
    }

    setInterval(moveNextSlide, 3000);
  });


  /* ========================================================
     NUEVO: EFECTO ENFOQUE-DESENFOQUE (CORREGIDO PARA MOBILE)
     ======================================================== */
  const focusElements = document.querySelectorAll('.scroll-blur-focus');

  window.addEventListener('scroll', () => {
    const windowHeight = window.innerHeight;
    const windowCenter = windowHeight / 2; 

    focusElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      
      let distanceFromCenter = 0;

      // Si el centro de la pantalla está por encima del banner
      if (windowCenter < rect.top) {
        distanceFromCenter = rect.top - windowCenter;
      } 
      // Si el centro de la pantalla está por debajo del banner
      else if (windowCenter > rect.bottom) {
        distanceFromCenter = windowCenter - rect.bottom;
      } 
      // Si el centro de la pantalla está DENTRO del banner (ideal para móvil)
      else {
        distanceFromCenter = 0;
      }
      
      // Umbral: Empieza a difuminarse cuando el borde está a un 25% del centro de la pantalla
      const threshold = windowHeight * 0.25; 
      
      if (distanceFromCenter > threshold) {
        const excessDistance = distanceFromCenter - threshold;
        const progress = Math.min(excessDistance / (windowHeight * 0.3), 1);
        
        el.style.filter = `blur(${(progress * 15).toFixed(1)}px)`;
        el.style.opacity = (1 - (progress * 0.7)).toFixed(2);
      } else {
        // Mientras estés leyendo cualquier parte de este banner largo, se verá nítido
        el.style.filter = 'blur(0px)';
        el.style.opacity = '1';
      }
    });
  }, { passive: true });


 /* ========================================================
     9. Animación de Cursor Rojo en Clientes (V2)
     ======================================================== */
  const clientItems = document.querySelectorAll('.client-item');
  
  clientItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      // Lo buscamos directamente en el momento del hover
      const elCursor = document.getElementById('customCursor');
      if (elCursor) {
        elCursor.classList.add('is-active', 'is-client');
      }
    });
    
    item.addEventListener('mouseleave', () => {
      const elCursor = document.getElementById('customCursor');
      if (elCursor) {
        elCursor.classList.remove('is-active', 'is-client');
      }
    });
  });
});
