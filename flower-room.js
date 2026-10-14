(() => {
  const storageKey = "dan-zong-house-flower-room";
  const interval = 8 * 60 * 1000;
  const rooms = ["egg", "flower", "esports"];
  const room = document.body.dataset.flowerRoom;
  const flower = document.querySelector("[data-flower]");
  const status = document.querySelector("[data-flower-status]");
  let timer;

  function readSchedule() {
    let value = localStorage.getItem(storageKey);
    if (value === null) {
      const schedule = {
        seed: crypto.getRandomValues(new Uint32Array(1))[0],
        startedAt: Date.now(),
        firstRoom: rooms[Math.floor(Math.random() * rooms.length)]
      };
      localStorage.setItem(storageKey, JSON.stringify(schedule));
      value = localStorage.getItem(storageKey);
    }
    if (value === null) throw new Error("房间安排没有保存成功。");

    let schedule = JSON.parse(value);
    if (
      Number.isInteger(schedule.seed) &&
      Number.isFinite(schedule.startedAt) &&
      schedule.firstRoom === "bedroom"
    ) {
      schedule = {
        seed: schedule.seed,
        startedAt: Date.now(),
        firstRoom: rooms[schedule.seed % rooms.length]
      };
      localStorage.setItem(storageKey, JSON.stringify(schedule));
    }
    if (
      !Number.isInteger(schedule.seed) ||
      !Number.isFinite(schedule.startedAt) ||
      !rooms.includes(schedule.firstRoom)
    ) {
      throw new Error("房间安排数据无效。");
    }
    return schedule;
  }

  function roomForInterval(seed, slot) {
    let value = (seed + Math.imul(slot, 0x9e3779b9)) >>> 0;
    value = Math.imul(value ^ (value >>> 16), 0x85ebca6b);
    value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35);
    value = (value ^ (value >>> 16)) >>> 0;
    return rooms[value % rooms.length];
  }

  function updateRoom() {
    window.clearTimeout(timer);
    try {
      const schedule = readSchedule();
      const slot = Math.max(0, Math.floor((Date.now() - schedule.startedAt) / interval));
      const currentRoom = slot === 0 ? schedule.firstRoom : roomForInterval(schedule.seed, slot);
      const flowerIsHere = room !== "bedroom" && room === currentRoom;
      flower.hidden = !flowerIsHere;
      status.textContent = room === "bedroom"
        ? "花花不会进入卧室。"
        : flowerIsHere
        ? "花花现在在这个房间陪你。"
        : `花花现在在${{
          egg: "蛋蛋的房间",
          flower: "花花的小窝",
          esports: "电竞房"
        }[currentRoom]}。`;
      window.dispatchEvent(new CustomEvent("flower-room-change", {
        detail: { room: room === "bedroom" ? null : currentRoom }
      }));

      const nextMove = schedule.startedAt + (slot + 1) * interval;
      timer = window.setTimeout(updateRoom, Math.max(250, nextMove - Date.now() + 25));
    } catch (error) {
      flower.hidden = true;
      status.textContent = "房间同步失败，请检查浏览器存储权限。";
      window.dispatchEvent(new CustomEvent("flower-room-change", {
        detail: { room: null }
      }));
      console.error("Unable to synchronize Huahua's room:", error);
    }
  }

  updateRoom();
  window.addEventListener("storage", (event) => {
    if (event.key === storageKey) updateRoom();
  });
  document.addEventListener("visibilitychange", updateRoom);
})();
