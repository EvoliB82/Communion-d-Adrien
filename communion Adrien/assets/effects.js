(function () {
    "use strict";

    var AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    var ctx = null;
    var unlocked = false;
    var mutedByControl = false;
    var lastSoundAt = 0;
    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var sounds = {
        hover: { start: 520, end: 720, duration: 0.07, gain: 0.025, type: "sine" },
        click: { start: 290, end: 470, duration: 0.11, gain: 0.055, type: "triangle" },
        open: { start: 440, end: 880, duration: 0.18, gain: 0.06, type: "sine" },
        close: { start: 420, end: 220, duration: 0.12, gain: 0.045, type: "triangle" },
        reveal: { start: 660, end: 990, duration: 0.16, gain: 0.035, type: "sine" },
        final: { start: 520, end: 1040, duration: 0.28, gain: 0.075, type: "sine" }
    };

    function unlock() {
        if (!AudioContextConstructor) {
            return null;
        }

        if (!ctx) {
            ctx = new AudioContextConstructor();
        }

        if (ctx.state === "suspended") {
            ctx.resume().catch(function () {});
        }

        unlocked = true;
        return ctx;
    }

    function play(name) {
        var sound = sounds[name] || sounds.click;
        var now = Date.now();
        var context = ctx || (unlocked ? unlock() : null);

        if (!context || mutedByControl || now - lastSoundAt < 38) {
            return;
        }

        lastSoundAt = now;

        var startTime = context.currentTime;
        var endTime = startTime + sound.duration;
        var oscillator = context.createOscillator();
        var gain = context.createGain();

        oscillator.type = sound.type;
        oscillator.frequency.setValueAtTime(sound.start, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, sound.end), endTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(sound.gain, startTime + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startTime);
        oscillator.stop(endTime + 0.02);
    }

    function sparkle(x, y, strong) {
        if (prefersReducedMotion) {
            return;
        }

        var count = strong ? 9 : 5;
        var ripple = document.createElement("span");
        ripple.className = "sfx-ripple";
        ripple.style.left = x + "px";
        ripple.style.top = y + "px";
        document.body.appendChild(ripple);
        ripple.addEventListener("animationend", function () {
            ripple.remove();
        }, { once: true });

        for (var index = 0; index < count; index += 1) {
            var particle = document.createElement("span");
            var angle = (Math.PI * 2 * index) / count;
            var distance = strong ? 46 : 30;

            particle.className = "sfx-sparkle";
            particle.style.left = x + "px";
            particle.style.top = y + "px";
            particle.style.setProperty("--spark-x", Math.cos(angle) * distance + "px");
            particle.style.setProperty("--spark-y", Math.sin(angle) * distance + "px");
            particle.style.setProperty("--spark-delay", index * 18 + "ms");
            document.body.appendChild(particle);
            particle.addEventListener("animationend", function (event) {
                event.currentTarget.remove();
            }, { once: true });
        }
    }

    function interactiveTarget(element) {
        if (!element || !element.closest) {
            return null;
        }

        return element.closest(".btn, .sound-btn, .menu-btn, .site-footer a, .milestone, .dialogue-close, .enter-btn");
    }

    function setupInteractionEffects() {
        document.addEventListener("pointerdown", function () {
            unlock();
        }, { once: true, capture: true });

        document.addEventListener("keydown", function () {
            unlock();
        }, { once: true, capture: true });

        document.addEventListener("click", function (event) {
            var target = interactiveTarget(event.target);

            if (!target) {
                return;
            }

            var strong = target.classList.contains("final") || target.classList.contains("enter-btn");
            play(strong ? "final" : "click");
            sparkle(event.clientX, event.clientY, strong);
        }, true);

        document.addEventListener("mouseover", function (event) {
            var target = interactiveTarget(event.target);

            if (!target || target.contains(event.relatedTarget)) {
                return;
            }

            play("hover");
        });

        document.addEventListener("focusin", function (event) {
            if (interactiveTarget(event.target)) {
                play("hover");
            }
        });

        document.addEventListener("communion:audio-state", function (event) {
            if (event.detail && event.detail.userInitiated) {
                mutedByControl = !event.detail.isPlaying;
            }
        });
    }

    function setupRevealEffects() {
        var targets = document.querySelectorAll(".story-chapter, .menu-section, .menu-card, .credit-section");

        if (!targets.length || !("IntersectionObserver" in window)) {
            return;
        }

        var seen = 0;
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    if (seen < 4) {
                        play("reveal");
                    }
                    seen += 1;
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.45 });

        targets.forEach(function (target) {
            observer.observe(target);
        });
    }

    window.CommunionSfx = {
        play: play,
        sparkle: sparkle,
        setMuted: function (isMuted) {
            mutedByControl = Boolean(isMuted);
        }
    };

    document.addEventListener("DOMContentLoaded", function () {
        setupInteractionEffects();
        setupRevealEffects();
    });
}());
