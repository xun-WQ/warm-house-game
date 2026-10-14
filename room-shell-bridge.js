(() => {
  const scenes = {
    "cloud-notes.html": "living",
    "cat.html": "cat",
    "bedroom.html": "bedroom",
    "esports-room.html": "esports"
  };
  const fileName = decodeURIComponent(window.location.pathname.split("/").pop() || "");
  const currentScene = scenes[fileName];

  if (window.top === window.self) {
    if (currentScene) {
      const shellUrl = new URL("index.html", window.location.href);
      shellUrl.searchParams.set("scene", currentScene);
      window.location.replace(shellUrl.href);
    }
    return;
  }

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
      event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a[href]");
    if (!link || link.target && link.target !== "_self" || link.hasAttribute("download")) return;

    const destination = new URL(link.href, window.location.href);
    if (destination.pathname.slice(0, destination.pathname.lastIndexOf("/") + 1) !==
      window.location.pathname.slice(0, window.location.pathname.lastIndexOf("/") + 1)) return;
    const scene = scenes[decodeURIComponent(destination.pathname.split("/").pop() || "")];
    if (!scene) return;

    event.preventDefault();
    window.parent.postMessage({ type: "room-shell:navigate", scene }, "*");
  });
})();
