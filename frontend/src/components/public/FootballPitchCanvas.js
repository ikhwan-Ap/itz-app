import React, { useEffect, useRef } from "react";

const PLAYER_COUNT = 11;
const PLAYER_RADIUS = 3.5;
const BALL_RADIUS = 2.5;
const POSSESSION_DURATION = 300;
const CELEBRATION_DURATION = 180;
const PASS_SPEED = 2.5;

const FORMATIONS = [
  [
    [0.08, 0.50], [0.20, 0.20], [0.20, 0.40], [0.20, 0.60], [0.20, 0.80],
    [0.32, 0.30], [0.32, 0.50], [0.32, 0.70],
    [0.44, 0.25], [0.44, 0.50], [0.44, 0.75],
  ],
  [
    [0.92, 0.50], [0.80, 0.20], [0.80, 0.40], [0.80, 0.60], [0.80, 0.80],
    [0.68, 0.30], [0.68, 0.50], [0.68, 0.70],
    [0.56, 0.25], [0.56, 0.50], [0.56, 0.75],
  ],
];

export default function FootballPitchCanvas() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = container.offsetWidth;
    let height = container.offsetHeight;

    const resizeCanvas = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();

    const grassColor = "#0B1221";
    const lineColor = "rgba(0, 168, 255, 0.35)";
    const centerCircleColor = "rgba(0, 168, 255, 0.25)";
    const teamColors = ["#00A8FF", "#E50914"];

    let players = [];
    let ball;
    let trail = [];
    let particles = [];
    let possessingTeam = 0;
    let possessionTimer = POSSESSION_DURATION;
    let passCount = 0;
    let celebrating = false;
    let celebrationTimer = 0;
    let celebratingTeam = null;
    let isVisible = true;
    let rafId = 0;

    function initPlayers() {
      players = [];
      for (let team = 0; team < 2; team++) {
        for (let i = 0; i < PLAYER_COUNT; i++) {
          const [fx, fy] = FORMATIONS[team][i];
          players.push({ x: fx * width, y: fy * height, vx: 0, vy: 0, team });
        }
      }
    }

    function initBall() {
      const startPlayer = 8 + Math.floor(Math.random() * 3);
      ball = {
        x: players[startPlayer].x,
        y: players[startPlayer].y,
        targetPlayer: startPlayer,
        targetTeam: 0,
      };
    }

    function drawPitch() {
      ctx.fillStyle = grassColor;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.012)";
      for (let i = 0; i < height; i += 12) {
        if (Math.floor(i / 12) % 2 === 0) ctx.fillRect(0, i, width, 6);
      }
      const marginX = width * 0.03;
      const marginY = height * 0.05;
      const pitchW = width - marginX * 2;
      const pitchH = height - marginY * 2;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(marginX, marginY, pitchW, pitchH);
      ctx.beginPath();
      ctx.moveTo(width / 2, marginY);
      ctx.lineTo(width / 2, height - marginY);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.09, 0, Math.PI * 2);
      ctx.strokeStyle = centerCircleColor;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();
      const penaltyW = pitchW * 0.16;
      const penaltyH = pitchH * 0.44;
      const sixYardW = pitchW * 0.06;
      const sixYardH = pitchH * 0.22;
      ctx.strokeStyle = lineColor;
      ctx.strokeRect(marginX, height / 2 - penaltyH / 2, penaltyW, penaltyH);
      ctx.strokeRect(marginX, height / 2 - sixYardH / 2, sixYardW, sixYardH);
      ctx.strokeRect(width - marginX - penaltyW, height / 2 - penaltyH / 2, penaltyW, penaltyH);
      ctx.strokeRect(width - marginX - sixYardW, height / 2 - sixYardH / 2, sixYardW, sixYardH);
      ctx.beginPath();
      ctx.arc(marginX + penaltyW * 0.6, height / 2, 2, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width - marginX - penaltyW * 0.6, height / 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    function updatePlayers() {
      for (let i = 0; i < players.length; i++) {
        const p = players[i];
        const team = p.team;
        const idx = i % PLAYER_COUNT;
        if (celebrating && celebratingTeam === team) {
          const goalX = team === 0 ? width * 0.95 : width * 0.05;
          const goalY = height / 2;
          const dx = goalX - p.x;
          const dy = goalY - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 10) { p.vx = (dx / dist) * 1.5; p.vy = (dy / dist) * 1.5; }
          else { p.vx = 0; p.vy = 0; }
        } else {
          const [fx, fy] = FORMATIONS[team][idx];
          const targetX = fx * width + (Math.random() - 0.5) * 12;
          const targetY = fy * height + (Math.random() - 0.5) * 12;
          p.vx = (targetX - p.x) * 0.02;
          p.vy = (targetY - p.y) * 0.02;
        }
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > 2) { p.vx = (p.vx / speed) * 2; p.vy = (p.vy / speed) * 2; }
        p.x += p.vx; p.y += p.vy;
      }
    }

    function updateBall() {
      if (celebrating) {
        const goalX = celebratingTeam === 0 ? width * 0.97 : width * 0.03;
        ball.x += (goalX - ball.x) * 0.05;
        ball.y += (height / 2 - ball.y) * 0.05;
        return;
      }
      const targetP = players[ball.targetPlayer];
      const dx = targetP.x - ball.x;
      const dy = targetP.y - ball.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        ball.x += (dx / dist) * PASS_SPEED;
        ball.y += (dy / dist) * PASS_SPEED;
      } else {
        ball.x = targetP.x; ball.y = targetP.y;
        possessionTimer--;
        if (possessionTimer <= 0) {
          const team = ball.targetTeam;
          const teamPlayers = players.filter((p) => p.team === team);
          let nextIdx = Math.floor(Math.random() * teamPlayers.length);
          ball.targetPlayer = players.indexOf(teamPlayers[nextIdx]);
          possessionTimer = POSSESSION_DURATION;
          passCount++;
          if (passCount > 8 && Math.random() < 0.3) triggerGoal(team);
          if (Math.random() < 0.15) {
            const otherTeam = team === 0 ? 1 : 0;
            const otherPlayers = players.filter((p) => p.team === otherTeam);
            const interceptor = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
            ball.targetPlayer = players.indexOf(interceptor);
            ball.targetTeam = otherTeam;
            possessingTeam = otherTeam;
          }
        }
      }
      trail.push({ x: ball.x, y: ball.y });
      if (trail.length > 20) trail.shift();
    }

    function triggerGoal(team) {
      celebrating = true;
      celebrationTimer = CELEBRATION_DURATION;
      celebratingTeam = team;
      passCount = 0;
      const goalX = team === 0 ? width * 0.97 : width * 0.03;
      const goalY = height / 2;
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        particles.push({
          x: goalX, y: goalY,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          radius: 1 + Math.random() * 3,
          opacity: 1,
          color: Math.random() > 0.5 ? "#00A8FF" : "#FFFFFF",
          decay: 0.01 + Math.random() * 0.02,
        });
      }
    }

    function updateParticles() {
      particles = particles.filter((p) => {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.98; p.vy *= 0.98;
        p.opacity -= p.decay;
        return p.opacity > 0;
      });
      if (celebrating) {
        celebrationTimer--;
        if (celebrationTimer <= 0) {
          celebrating = false;
          celebratingTeam = null;
          const centerIdx = possessingTeam === 0 ? 8 : 19;
          ball.targetPlayer = centerIdx;
          ball.targetTeam = possessingTeam;
          possessionTimer = POSSESSION_DURATION;
        }
      }
    }

    function drawTrail() {
      if (trail.length < 2) return;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
      ctx.stroke();
    }

    function drawPlayers() {
      for (const p of players) {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, PLAYER_RADIUS * 3);
        grad.addColorStop(0, teamColors[p.team] + "40");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PLAYER_RADIUS * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = teamColors[p.team];
        ctx.beginPath();
        ctx.arc(p.x, p.y, PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawBall() {
      const grad = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, BALL_RADIUS * 4);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.3)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawParticles() {
      for (const p of particles) {
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function animate() {
      if (!isVisible) { rafId = requestAnimationFrame(animate); return; }
      ctx.clearRect(0, 0, width, height);
      drawPitch();
      updatePlayers();
      updateBall();
      updateParticles();
      drawTrail();
      drawParticles();
      drawPlayers();
      drawBall();
      rafId = requestAnimationFrame(animate);
    }

    const observer = new IntersectionObserver(([entry]) => { isVisible = entry.isIntersecting; }, { threshold: 0.1 });
    observer.observe(container);

    let resizeTimeout;
    function handleResize() {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        resizeCanvas();
        for (let i = 0; i < players.length; i++) {
          const team = Math.floor(i / PLAYER_COUNT);
          const idx = i % PLAYER_COUNT;
          const [fx, fy] = FORMATIONS[team][idx];
          players[i].x = fx * width;
          players[i].y = fy * height;
        }
        ball.x = width / 2;
        ball.y = height / 2;
      }, 200);
    }
    window.addEventListener("resize", handleResize);

    initPlayers();
    initBall();
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} aria-label="Animated football pitch" />
    </div>
  );
}
