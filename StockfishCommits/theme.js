(() => {
    "use strict";

    const storedTheme = localStorage.getItem("theme");

    const getPreferredTheme = () => {
        if (storedTheme) {
            return storedTheme;
        }

        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    };

    const setTheme = function (theme) {
        if (
            theme === "auto" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
            document.documentElement.setAttribute("data-bs-theme", "dark");
        } else {
            document.documentElement.setAttribute("data-bs-theme", theme);
        }

        if (theme === "dark") {
            document.getElementById("dark").style.display = "none";
            document.getElementById("light").style.display = "";
        } else {
            document.getElementById("light").style.display = "none";
            document.getElementById("dark").style.display = "";
        }
    };

    setTheme(getPreferredTheme());

    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", () => {
            if (storedTheme !== "light" || storedTheme !== "dark") {
                setTheme(getPreferredTheme());
            }
        });

    window.addEventListener("load", () => {
        setTheme(getPreferredTheme());

        document.querySelectorAll("[data-theme-value]").forEach((toggle) => {
            toggle.addEventListener("click", () => {
                const theme = toggle.getAttribute("data-theme-value");
                localStorage.setItem("theme", theme);
                setTheme(theme);
            });
        });
    });
})();
