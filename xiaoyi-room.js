(() => {
  const storageKey = "dan-zong-house-xiaoyi-room";
  const interval = 15 * 60 * 1000;
  const rooms = ["egg", "esports", "bedroom"];
  const currentRoom = document.body.dataset.xiaoyiRoom;
  const character = document.querySelector("[data-xiaoyi-character]");
  const status = document.querySelector("[data-xiaoyi-status]");
  const roomBackdrop = document.querySelector("[data-xiaoyi-backdrop]");
  const roomName = document.querySelector("[data-xiaoyi-name]");
  const roomPresence = document.querySelector("[data-xiaoyi-presence]");
  const roomScene = document.querySelector(".game-room");
  let timer;

  function readSchedule() {
    let value = localStorage.getItem(storageKey);
    if (value === null) {
      const schedule = {
        startedAt: Date.now(),
        firstRoom: rooms[Math.floor(Math.random() * rooms.length)]
      };
      localStorage.setItem(storageKey, JSON.stringify(schedule));
      value = localStorage.getItem(storageKey);
    }
    if (value === null) throw new Error("小易的房间安排没有保存成功。");

    const schedule = JSON.parse(value);
    if (
      !Number.isFinite(schedule.startedAt) ||
      !rooms.includes(schedule.firstRoom)
    ) {
      throw new Error("小易的房间安排数据无效。");
    }
    return schedule;
  }

  function updateRoom() {
    window.clearTimeout(timer);
    try {
      const schedule = readSchedule();
      const slot = Math.max(0, Math.floor((Date.now() - schedule.startedAt) / interval));
      const roomIndex = (rooms.indexOf(schedule.firstRoom) + slot) % rooms.length;
      const activeRoom = rooms[roomIndex];
      const xiaoyiIsHere = currentRoom === activeRoom;

      if (character) character.hidden = !xiaoyiIsHere;
      if (status) {
        status.textContent = xiaoyiIsHere
          ? "小易现在在这个房间陪你。"
          : `小易现在在${{
            egg: "客厅",
            esports: "电竞房",
            bedroom: "卧室"
          }[activeRoom]}。`;
      }
      if (roomBackdrop) {
        roomBackdrop.src = xiaoyiIsHere
          ? "xiaoyi-esports-room.webp"
          : "xiaoyi-esports-room-empty.webp?v=2";
        roomBackdrop.alt = xiaoyiIsHere
          ? "小易在电竞房玩游戏"
          : "电竞房里的电脑和游戏设备";
      }
      if (roomName) {
        roomName.textContent = xiaoyiIsHere
          ? "✨ 小易 · 游戏中"
          : "🎮 小易去客厅啦";
      }
      if (roomPresence) {
        roomPresence.textContent = xiaoyiIsHere
          ? "PLAYER ONE · 小易已上线"
          : "PLAYER ONE · 小易外出中";
      }
      if (roomScene) {
        roomScene.setAttribute(
          "aria-label",
          xiaoyiIsHere ? "小易在电竞房玩游戏" : "小易暂时不在的电竞房"
        );
      }
      window.dispatchEvent(new CustomEvent("xiaoyi-room-change", {
        detail: { room: activeRoom }
      }));

      const nextMove = schedule.startedAt + (slot + 1) * interval;
      timer = window.setTimeout(updateRoom, Math.max(250, nextMove - Date.now() + 25));
    } catch (error) {
      if (character) character.hidden = true;
      if (status) status.textContent = "小易的房间同步失败，请检查浏览器存储权限。";
      if (roomBackdrop) roomBackdrop.src = "xiaoyi-esports-room-empty.webp?v=2";
      if (roomName) roomName.textContent = "🎮 小易的座位";
      if (roomPresence) roomPresence.textContent = "PLAYER ONE · 状态同步失败";
      window.dispatchEvent(new CustomEvent("xiaoyi-room-change", {
        detail: { room: null }
      }));
      console.error("Unable to synchronize Xiaoyi's room:", error);
    }
  }

  updateRoom();
  window.addEventListener("storage", (event) => {
    if (event.key === storageKey) updateRoom();
  });
  window.addEventListener("xiaoyi-room-schedule-change", updateRoom);
  document.addEventListener("visibilitychange", updateRoom);
})();
