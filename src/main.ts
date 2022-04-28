import honkSrc from "./honk.mp3";

// <editor-fold desc="INFRASTRUCTURE">
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d")!;
document.body.appendChild(canvas);

let inputBuffer: MouseEvent[] = [];
canvas.addEventListener("click", (e) => {
  inputBuffer.push(e);
});

document.addEventListener("visibilitychange", () => {
  window.cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  if (document.visibilityState === "visible")
    animationFrame = window.requestAnimationFrame((now) => loop(now, now));
});
let animationFrame = window.requestAnimationFrame((now) => loop(now, now));

function createTimer(interval: number, cb: (dt: number) => void) {
  let accumulator = 0;
  return (dt: number) => {
    accumulator += dt;
    while (accumulator > interval) {
      accumulator -= interval;
      cb(interval);
    }
  };
}

function createAudioBuffer(src: string, size: number) {
  const pool = new Array(size).fill(undefined).map(() => new Audio(src));
  return () => {
    for (let i = 0; i < pool.length; i++) {
      const audio = pool[i];
      if (audio.ended || audio.currentTime === 0) {
        console.log(i);
        audio.play();
        break;
      }
    }
  };
}

function loop(then: DOMHighResTimeStamp, now = then) {
  const dt = now - then;

  handleInput(dt);
  update(dt);
  render(context, dt);

  if (document.visibilityState === "visible")
    window.requestAnimationFrame(loop.bind(null, now));
}
// </editor-fold>

// <editor-fold desc="ASSETS">
const playAudio = createAudioBuffer(honkSrc, 3);
// </editor-fold>

// <editor-fold desc="STATE">
const MAX_CIRCLES = 5;
let circleIterator = 0;
let circles: [number, number, number][] = [];
let maxDt = 0;

const updateCircleSpawning = createTimer(1000, (_dt: number) => {
  const [x, y] = [canvas.width, canvas.height].map((n) =>
    Math.floor(Math.random() * n)
  );
  circles[circleIterator] = [x, y, 0];
  circleIterator = (circleIterator + 1) % MAX_CIRCLES;
});

const updateCircleGrowth = createTimer(5000 / 60, (_dt: number) => {
  circles.forEach((circle) => {
    if (!circle) console.log(circles);
    if (circle.length < 3) console.log(circle);
    circle[2]++;
  });
});
// </editor-fold>

// <editor-fold desc="GAME">
function handleInput(_dt: number) {
  for (const event of inputBuffer) {
    const { offsetX, offsetY } = event;

    circles = circles.filter(([x, y, r]) => {
      if (r < Math.sqrt(Math.pow(x - offsetX, 2) + Math.pow(y - offsetY, 2)))
        return true;
      playAudio();
      return false;
    });
  }
  inputBuffer = [];
}

function update(dt: number) {
  maxDt = Math.max(dt, maxDt);
  updateCircleSpawning(dt);
  updateCircleGrowth(dt);
}

function render(context: CanvasRenderingContext2D, dt: number) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textBaseline = "hanging";

  circles.forEach(([x, y, r]) => {
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
    context.closePath();
  });

  JSON.stringify({ dt, maxDt }, null, 2)
    .split("\n")
    .slice(1, -1)
    .map((str, i) => {
      context.fillText(str, 0, i * 12);
    });
}
// </editor-fold>
