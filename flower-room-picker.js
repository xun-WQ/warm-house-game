(() => {
  const storageKey = "dan-zong-house-flower-room";
  const dandanStorageKey = "dan-zong-house-dandan-esports-visit";
  const dandanVisitDuration = 10 * 60 * 1000;
  const rooms = ["egg", "flower", "esports", "bedroom"];
  const flowerRooms = ["egg", "flower", "esports"];
  const roomNames = {
    egg: "客厅",
    flower: "花花的小窝",
    esports: "电竞房",
    bedroom: "卧室"
  };
  const flowerRoom = document.body.dataset.flowerRoom;
  const dandanRoom = document.body.dataset.dandanRoom;
  const flowers = flowerRooms.includes(flowerRoom)
    ? [...document.querySelectorAll("[data-flower]")]
    : [];
  const flowerTriggers = flowerRooms.includes(flowerRoom)
    ? [...flowers, ...document.querySelectorAll("[data-flower-picker-trigger]")]
    : [];
  const dandanTriggers = [
    ...document.querySelectorAll("[data-dandan-character]"),
    ...document.querySelectorAll("[data-dandan-visitor]")
  ];
  const xiaoyiRoomKey = "dan-zong-house-xiaoyi-room";
  const xiaoyiRooms = ["egg", "esports", "bedroom"];
  const xiaoyiRoom = document.body.dataset.xiaoyiRoom;
  const xiaoyiTriggers = [...document.querySelectorAll("[data-xiaoyi-character]")];
  const triggers = [...flowerTriggers, ...dandanTriggers, ...xiaoyiTriggers];
  const scene = document.querySelector({
    egg: ".scene-card",
    flower: ".scene",
    esports: ".game-room",
    bedroom: ".bedroom-scene"
  }[flowerRoom || dandanRoom]);
  if (
    (flowerTriggers.length === 0 && dandanTriggers.length === 0) ||
    (!rooms.includes(dandanRoom) && !flowerRooms.includes(flowerRoom)) ||
    !scene
  ) return;

  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "flower-room-picker.css";
  document.head.append(style);

  const picker = document.createElement("section");
  picker.className = "flower-room-picker";
  picker.hidden = true;
  picker.setAttribute("role", "dialog");
  picker.setAttribute("aria-modal", "false");
  picker.setAttribute("aria-labelledby", "flower-room-picker-title");
  picker.innerHTML = '<div class="flower-room-picker-heading"><span id="flower-room-picker-title"></span><button class="flower-room-picker-close" type="button" aria-label="关闭">×</button></div><div class="flower-room-picker-options"></div>';
  document.body.append(picker);

  const options = picker.querySelector(".flower-room-picker-options");
  const title = picker.querySelector("#flower-room-picker-title");
  let pendingSingleClick;
  let activeFlower;
  let activeSubject;

  function closePicker() {
    picker.hidden = true;
    activeFlower = null;
  }

  function positionPicker() {
    const bounds = scene.getBoundingClientRect();
    const maxWidth = Math.max(0, Math.min(bounds.width, window.innerWidth) - 24);
    picker.style.maxWidth = `${maxWidth}px`;
    const pickerBounds = picker.getBoundingClientRect();
    const left = Math.max(bounds.left + 12, 12, Math.min(
      bounds.left + bounds.width / 2 - pickerBounds.width / 2,
      bounds.right - pickerBounds.width - 12,
      window.innerWidth - pickerBounds.width - 12
    ));
    picker.style.left = `${left}px`;
    picker.style.top = `${Math.max(bounds.top + 12, bounds.bottom - pickerBounds.height - 12)}px`;
  }

  function openPicker(flower) {
    activeFlower = flower;
    activeSubject = "flower";
    title.textContent = "让花花去哪里？";
    options.replaceChildren();
    for (const destination of flowerRooms) {
      if (destination === flowerRoom) continue;
      const button = document.createElement("button");
      button.className = "flower-room-picker-option";
      button.type = "button";
      button.dataset.flowerDestination = destination;
      button.textContent = `去${roomNames[destination]}`;
      options.append(button);
    }
    picker.hidden = false;
    positionPicker();
    options.querySelector("button")?.focus();
  }

  function openDandanPicker(character) {
    activeFlower = character;
    activeSubject = "dandan";
    title.textContent = "让蛋蛋去哪里？";
    options.replaceChildren();
    for (const destination of rooms) {
      if (destination === dandanRoom) continue;
      const button = document.createElement("button");
      button.className = "flower-room-picker-option";
      button.type = "button";
      button.dataset.flowerDestination = destination;
      button.textContent = `去${roomNames[destination]}`;
      options.append(button);
    }
    picker.hidden = false;
    positionPicker();
    options.querySelector("button")?.focus();
  }

  function openXiaoyiPicker(character) {
    activeFlower = character;
    activeSubject = "xiaoyi";
    title.textContent = "让小易去哪里？";
    options.replaceChildren();
    for (const destination of xiaoyiRooms) {
      if (destination === xiaoyiRoom) continue;
      const button = document.createElement("button");
      button.className = "flower-room-picker-option";
      button.type = "button";
      button.dataset.flowerDestination = destination;
      button.textContent = `去${roomNames[destination]}`;
      options.append(button);
    }
    picker.hidden = false;
    positionPicker();
    options.querySelector("button")?.focus();
  }

  function moveFlower(destination) {
    if (!flowerRooms.includes(destination)) return;
    const schedule = {
      seed: crypto.getRandomValues(new Uint32Array(1))[0],
      startedAt: Date.now(),
      firstRoom: destination
    };
    localStorage.setItem(storageKey, JSON.stringify(schedule));

    for (const flower of flowers) flower.hidden = destination !== flowerRoom;
    for (const status of document.querySelectorAll("[data-flower-status]")) {
      status.textContent = destination === flowerRoom
        ? "花花现在在这个房间陪你。"
        : `花花现在在${roomNames[destination]}。`;
    }
    window.dispatchEvent(new CustomEvent("flower-room-change", {
      detail: { room: destination }
    }));
    window.dispatchEvent(new CustomEvent("flower-room-schedule-change"));
    closePicker();
  }

  function moveDandan(destination) {
    if (!rooms.includes(destination)) return;
    const schedule = {
      room: destination,
      nextChangeAt: Date.now() + dandanVisitDuration
    };
    localStorage.setItem(dandanStorageKey, JSON.stringify(schedule));
    window.dispatchEvent(new CustomEvent("dandan-room-schedule-change"));
    closePicker();
  }

  function moveXiaoyi(destination) {
    if (!xiaoyiRooms.includes(destination)) return;
    localStorage.setItem(xiaoyiRoomKey, JSON.stringify({
      startedAt: Date.now(),
      firstRoom: destination
    }));
    window.dispatchEvent(new CustomEvent("xiaoyi-room-schedule-change"));
    closePicker();
  }

  picker.querySelector(".flower-room-picker-close").addEventListener("click", closePicker);
  options.addEventListener("click", (event) => {
    const button = event.target.closest("[data-flower-destination]");
    if (!button || !activeFlower) return;
    if (activeSubject === "dandan") moveDandan(button.dataset.flowerDestination);
    else if (activeSubject === "xiaoyi") moveXiaoyi(button.dataset.flowerDestination);
    else moveFlower(button.dataset.flowerDestination);
  });
  document.addEventListener("pointerdown", (event) => {
    if (!picker.hidden && !picker.contains(event.target) &&
      !triggers.some((flower) => flower.contains(event.target))) closePicker();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !picker.hidden) {
      const flower = activeFlower;
      closePicker();
      flower?.focus();
    }
  });
  window.addEventListener("resize", () => {
    if (!picker.hidden && activeFlower) positionPicker();
  });
  window.addEventListener("scroll", () => {
    if (!picker.hidden && activeFlower) positionPicker();
  }, true);

  for (const flower of flowerTriggers) {
    flower.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.clearTimeout(pendingSingleClick);
      pendingSingleClick = undefined;
      openPicker(flower);
    });
  }

  for (const character of dandanTriggers) {
    character.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.clearTimeout(pendingSingleClick);
      pendingSingleClick = undefined;
      openDandanPicker(character);
    });
  }

  for (const character of xiaoyiTriggers) {
    character.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.clearTimeout(pendingSingleClick);
      pendingSingleClick = undefined;
      openXiaoyiPicker(character);
    });
  }

  document.addEventListener("click", (event) => {
    const flower = triggers.find((item) => item === event.target || item.contains(event.target));
    if (!flower) return;
    if (event.detail > 1) {
      window.clearTimeout(pendingSingleClick);
      pendingSingleClick = undefined;
    }
  }, true);
})();
