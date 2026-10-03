const widget = document.getElementById("widget");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds");
const display = document.getElementById("display");
const message = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const bgColorInput = document.getElementById("bgColor");

const TICK_MS = 250;

let state = "idle"; // idle | running | paused | done
let remainingMs = getDurationMs();
let endTime = 0;
let intervalId = null;
let audioCtx = null;

function getDurationMs() {
  const minutes = Math.max(0, parseInt(minutesInput.value, 10) || 0);
  const seconds = Math.min(59, Math.max(0, parseInt(secondsInput.value, 10) || 0));
  return (minutes * 60 + seconds) * 1000;
}

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function render() {
  display.textContent = formatTime(remainingMs);
  message.hidden = state !== "done";

  startBtn.textContent = state === "paused" ? "Resume" : "Start";
  startBtn.disabled = state === "running" || state === "done";
  pauseBtn.disabled = state !== "running";

  const editable = state === "idle" || state === "done";
  minutesInput.disabled = !editable;
  secondsInput.disabled = !editable;
}

function tick() {
  remainingMs = Math.max(0, endTime - Date.now());
  if (remainingMs === 0) {
    finish();
    return;
  }
  render();
}

function start() {
  if (state === "running") return;
  if (state === "idle") {
    remainingMs = getDurationMs();
    if (remainingMs === 0) return;
  }

  initAudio();
  endTime = Date.now() + remainingMs;
  state = "running";
  intervalId = setInterval(tick, TICK_MS);
  render();
}

function pause() {
  if (state !== "running") return;
  clearInterval(intervalId);
  intervalId = null;
  remainingMs = Math.max(0, endTime - Date.now());
  state = "paused";
  render();
}

function reset() {
  clearInterval(intervalId);
  intervalId = null;
  state = "idle";
  remainingMs = getDurationMs();
  render();
}

function finish() {
  clearInterval(intervalId);
  intervalId = null;
  remainingMs = 0;
  state = "done";
  render();
  playBeep();
}

function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function beep(ctx, t) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.2);
}

function playBeep() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  for (let i = 0; i < 3; i++) {
    beep(audioCtx, now + i * 0.3);
  }
}

function getContrastingTextColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0f172a" : "#f8fafc";
}

function applyBgColor(color) {
  widget.style.setProperty("--bg-color", color);
  widget.style.setProperty("--text-color", getContrastingTextColor(color));
}

function onDurationChange() {
  if (state === "idle" || state === "done") {
    state = "idle";
    remainingMs = getDurationMs();
    render();
  }
}

startBtn.addEventListener("click", start);
pauseBtn.addEventListener("click", pause);
resetBtn.addEventListener("click", reset);
minutesInput.addEventListener("input", onDurationChange);
secondsInput.addEventListener("input", onDurationChange);
bgColorInput.addEventListener("input", (e) => applyBgColor(e.target.value));

applyBgColor(bgColorInput.value);
render();
