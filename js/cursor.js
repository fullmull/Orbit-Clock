export function initCursorTrail() {
  const canvas = document.createElement('canvas');
  canvas.id = 'canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let isHoveringSettings = false;
  const settingsElem = document.getElementById('clock-settings');
  if (settingsElem) {
    settingsElem.addEventListener('pointerenter', () => {
      isHoveringSettings = true;
      canvas.classList.add('paused');
    });
    settingsElem.addEventListener('pointerleave', () => {
      isHoveringSettings = false;
      canvas.classList.remove('paused');
      if (ctx.running && !isRendering) {
        isRendering = true;
        render();
      }
    });
  }

  function Line(e) {
    this.init(e || {});
  }
  Line.prototype = {
    init: function (e) {
      this.spring = e.spring + 0.1 * Math.random() - 0.02;
      this.friction = E.friction + 0.01 * Math.random() - 0.002;
      this.nodes = [];
      for (var t, n = 0; n < E.size; n++) {
        t = new Node();
        t.x = pos.x;
        t.y = pos.y;
        this.nodes.push(t);
      }
    },
    update: function () {
      var e = this.spring,
        t = this.nodes[0];
      t.vx += (pos.x - t.x) * e;
      t.vy += (pos.y - t.y) * e;
      for (var n, i = 0, a = this.nodes.length; i < a; i++)
        ((t = this.nodes[i]),
        0 < i &&
          ((n = this.nodes[i - 1]),
          (t.vx += (n.x - t.x) * e),
          (t.vy += (n.y - t.y) * e),
          (t.vx += n.vx * E.dampening),
          (t.vy += n.vy * E.dampening)),
        (t.vx *= this.friction),
        (t.vy *= this.friction),
        (t.x += t.vx),
        (t.y += t.vy),
        (e *= E.tension));
    },
    draw: function () {
      var e,
        t,
        n = this.nodes[0].x,
        i = this.nodes[0].y;
      ctx.beginPath();
      ctx.moveTo(n, i);
      for (var a = 1, o = this.nodes.length - 2; a < o; a++) {
        e = this.nodes[a];
        t = this.nodes[a + 1];
        n = 0.5 * (e.x + t.x);
        i = 0.5 * (e.y + t.y);
        ctx.quadraticCurveTo(e.x, e.y, n, i);
      }
      e = this.nodes[a];
      t = this.nodes[a + 1];
      ctx.quadraticCurveTo(e.x, e.y, t.x, t.y);
      ctx.stroke();
      ctx.closePath();
    },
  };

  function onMousemove(e) {
    function o() {
      lines = [];
      for (var e = 0; e < E.trails; e++)
        lines.push(new Line({ spring: 0.4 + (e / E.trails) * 0.025 }));
    }
    function c(e) {
      if (!ctx.running || isHoveringSettings) return;
      (e.touches
        ? ((pos.x = e.touches[0].pageX), (pos.y = e.touches[0].pageY))
        : ((pos.x = e.clientX - 2), (pos.y = e.clientY - 2)),
        e.preventDefault());
    }
    function l(e) {
      if (!ctx.running || isHoveringSettings) return;
      1 == e.touches.length &&
        ((pos.x = e.touches[0].pageX), (pos.y = e.touches[0].pageY));
    }
    document.removeEventListener('mousemove', onMousemove);
    document.removeEventListener('touchstart', onMousemove);
    document.addEventListener('mousemove', c);
    document.addEventListener('touchmove', c);
    document.addEventListener('touchstart', l);
    c(e);
    o();
    if (!isRendering && !isHoveringSettings) {
      isRendering = true;
      render();
    }
  }

  function getThemeColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--main-color').trim() || '#2830cc';
  }

  let isRendering = false;
  function render() {
    if (!ctx.running || isHoveringSettings) {
      isRendering = false;
      return;
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = getThemeColor();
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    for (var e, t = 0; t < E.trails; t++) {
      if (lines[t]) {
        lines[t].update();
        lines[t].draw();
      }
    }
    ctx.frame++;
    if (ctx.running && !isHoveringSettings) {
      window.requestAnimationFrame(render);
    } else {
      isRendering = false;
    }
  }

  function resizeCanvas() {
    // Bitmap size and displayed size must be identical (1 canvas px = 1 CSS px),
    // and the canvas must sit at the viewport origin, so that clientX/clientY
    // map 1:1 onto canvas coordinates.
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.canvas.style.position = 'fixed';
    ctx.canvas.style.top = '0';
    ctx.canvas.style.left = '0';
    ctx.canvas.style.width = w + 'px';
    ctx.canvas.style.height = h + 'px';
  }

  var pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    lines = [],
    E = {
      debug: true,
      friction: 0.5,
      trails: 20,
      size: 50,
      dampening: 0.25,
      tension: 0.98,
    };

  function Node() {
    this.x = 0;
    this.y = 0;
    this.vy = 0;
    this.vx = 0;
  }

  ctx.running = (localStorage.getItem('useTrail') ?? 'true') === 'true';
  ctx.frame = 1;

  document.addEventListener('mousemove', onMousemove);
  document.addEventListener('touchstart', onMousemove);
  document.body.addEventListener('orientationchange', resizeCanvas);
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  if (ctx.running) {
    lines = [];
    for (var e = 0; e < E.trails; e++) {
      lines.push(new Line({ spring: 0.4 + (e / E.trails) * 0.025 }));
    }
    isRendering = true;
    render();
  }

  return {
    setTrailActive: (isActive) => {
      ctx.running = isActive;
      localStorage.setItem('useTrail', isActive);
      if (isActive) {
        lines = [];
        for (var e = 0; e < E.trails; e++) {
          lines.push(new Line({ spring: 0.4 + (e / E.trails) * 0.025 }));
        }
        if (!isRendering && !isHoveringSettings) {
          isRendering = true;
          render();
        }
      } else {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
    }
  };
}