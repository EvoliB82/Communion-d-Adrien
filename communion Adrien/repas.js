(function () {
    "use strict";

    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function setupMusicControl() {
        var music = document.getElementById("music") || document.querySelector("audio");
        var button = document.querySelector(".sound-btn");

        if (!music) {
            return;
        }

        music.volume = 0.42;

        function syncButton(userInitiated) {
            if (!button) {
                return;
            }

            var isPlaying = !music.paused && !music.ended;
            button.classList.toggle("is-playing", isPlaying);
            button.setAttribute("aria-pressed", String(isPlaying));
            button.setAttribute("aria-label", isPlaying ? "Mettre la musique en pause" : "Lancer la musique");
            button.title = isPlaying ? "Mettre la musique en pause" : "Lancer la musique";

            document.dispatchEvent(new CustomEvent("communion:audio-state", {
                detail: {
                    isPlaying: isPlaying,
                    userInitiated: Boolean(userInitiated)
                }
            }));
        }

        function playMusic(userInitiated) {
            return music.play().then(function () {
                syncButton(userInitiated);
            }).catch(function () {
                syncButton(userInitiated);
            });
        }

        if (button) {
            button.type = "button";
            button.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();

                if (music.paused || music.ended) {
                    playMusic(true);
                } else {
                    music.pause();
                    syncButton(true);
                }
            });
        }

        document.addEventListener("pointerdown", function (event) {
            if (button && event.target.closest(".sound-btn")) {
                return;
            }
            playMusic(false);
        }, { once: true });

        music.addEventListener("play", function () { syncButton(false); });
        music.addEventListener("pause", function () { syncButton(false); });
        music.addEventListener("ended", function () { syncButton(false); });
        syncButton(false);
    }

    function setupDishReveals() {
        var items = document.querySelectorAll(".dish, .menu-section h2, .menu-divider");

        if (!items.length || !("IntersectionObserver" in window) || prefersReducedMotion) {
            return;
        }

        items.forEach(function (el, index) {
            el.classList.add("will-reveal");
            el.style.setProperty("--reveal-delay", Math.min(index * 35, 260) + "ms");
        });

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

        items.forEach(function (el) {
            observer.observe(el);
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        document.documentElement.classList.add("js-ready");
        setupMusicControl();
        setupDishReveals();
    });
}());
