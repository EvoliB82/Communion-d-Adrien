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

    function setupReveals() {
        var revealItems = document.querySelectorAll(
            ".container > h1, .container > p, .container > .btn, .story-chapter, .story-divider, .menu-card"
        );

        if (!revealItems.length || prefersReducedMotion) {
            revealItems.forEach(function (item) {
                item.classList.add("is-revealed");
            });
            return;
        }

        revealItems.forEach(function (item, index) {
            item.classList.add("soft-reveal");
            item.style.setProperty("--reveal-delay", Math.min(index * 70, 420) + "ms");
        });

        if (!("IntersectionObserver" in window)) {
            revealItems.forEach(function (item) {
                item.classList.add("is-revealed");
            });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-revealed");
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

        revealItems.forEach(function (item) {
            observer.observe(item);
        });
    }

    function markCurrentLinks() {
        var current = window.location.pathname.split("/").pop() || "index.html";

        document.querySelectorAll(".site-footer a").forEach(function (link) {
            var href = link.getAttribute("href");
            var isCurrent = href === current;
            link.classList.toggle("active", isCurrent);
            if (isCurrent) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        document.documentElement.classList.add("js-ready");
        setupMusicControl();
        setupReveals();
        markCurrentLinks();
    });
}());
