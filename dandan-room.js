(() => {
  const storageKey = "dan-zong-house-dandan-esports-visit";
  const appearanceStorageKey = "dan-zong-house-dandan-appearance";
  const flowerStorageKey = "dan-zong-house-flower-room";
  const interval = 8 * 60 * 1000;
  const rooms = ["egg", "flower", "esports", "bedroom"];
  const flowerRooms = ["egg", "flower", "esports"];
  const currentRoom = document.body.dataset.dandanRoom;
  const character = document.querySelector("[data-dandan-character]");
  const flowerCharacter = document.querySelector("button[data-flower]");
  const livingTogetherArt = document.querySelector("[data-dandan-huahua-together]");
  const bedroomTogetherArt = document.querySelector("[data-dandan-huahua-bedroom]");
  const visitor = document.querySelector("[data-dandan-visitor]");
  const defaultArt = document.querySelector("[data-dandan-default-art]");
  const appearances = [
    {
      src: "1.webp",
      alt: "穿白色蕾丝婚纱的蛋蛋",
      pairSrc: "2.webp",
      pairAlt: "穿白色蕾丝婚纱的蛋蛋抱着花花",
      esportsPairSrc: "3.webp"
    },
    {
      src: "4.webp",
      alt: "穿白色礼服的蛋蛋",
      pairSrc: "5.webp",
      pairAlt: "穿白色礼服的蛋蛋抱着花花",
      esportsPairSrc: "6.webp"
    },
    {
      src: "7.webp",
      alt: "穿黄色格纹吊带裙的蛋蛋",
      pairSrc: "8.webp",
      pairAlt: "穿黄色格纹裙的蛋蛋抱着花花",
      esportsPairSrc: "9.webp"
    }
  ];
  const legacyAppearances = {
    "2.webp": "1.webp",
    "3.webp": "1.webp",
    "5.webp": "4.webp",
    "6.webp": "4.webp",
    "8.webp": "7.webp",
    "9.webp": "7.webp",
    "dandan-bedroom-wedding-floral.webp?v=1": "1.webp",
    "dandan-bedroom-wedding-huahua.webp?v=1": "1.webp",
    "dandan-bedroom-wedding-sad.webp?v=1": "1.webp",
    "dandan-bedroom-qipao-floral.webp?v=1": "4.webp",
    "dandan-bedroom-qipao-sad.webp?v=1": "4.webp",
    "dandan-bedroom-summer.webp": "7.webp",
    "dandan-bedroom-summer-huahua.webp?v=1": "7.webp",
    "dandan-bedroom-summer-angry.webp?v=1": "7.webp"
  };
  const togetherArt = document.querySelector("[data-dandan-together-art]");
  const visitorLabel = document.querySelector("[data-dandan-label]");
  const invitation = document.querySelector("[data-dandan-invitation]");
  const reaction = document.querySelector("[data-dandan-reaction]");
  const invitationKey = "dan-zong-house-dandan-invitation";
  const xiaoyiStorageKey = "dan-zong-house-xiaoyi-room";
  const status = document.querySelector("[data-dandan-status]");
  const presence = document.querySelector("[data-dandan-presence]");
  const conversation = [
    "蛋蛋：哼，小易就知道玩游戏！我都邀请你去客厅了。",
    "小易：再等我打完这一局嘛，马上就好！",
    "蛋蛋：你上次也说“马上”！我都等你好久啦。",
    "小易：这次是真的，我保证很快就去陪你。",
    "蛋蛋：那我就在这里等你，不能反悔哦！",
    "小易：好，一言为定！"
  ];
  let timer;
  let conversationTimer;
  let conversationVisit = null;

  function randomDuration() {
    return 10 * 60 * 1000;
  }

  function readSchedule() {
    const saved = localStorage.getItem(storageKey);
    if (saved === null) {
      const schedule = {
        room: rooms[Math.floor(Math.random() * rooms.length)],
        nextChangeAt: Date.now() + randomDuration()
      };
      localStorage.setItem(storageKey, JSON.stringify(schedule));
      return schedule;
    }

    const schedule = JSON.parse(saved);
    if (typeof schedule.room === "string" && rooms.includes(schedule.room) &&
      Number.isFinite(schedule.nextChangeAt)) {
      return schedule;
    }

    // Migrate the previous esports-only visible flag without changing its active visit.
    if (typeof schedule.visible === "boolean" && Number.isFinite(schedule.nextChangeAt)) {
      const migrated = {
        room: schedule.visible ? "esports" : "egg",
        nextChangeAt: schedule.nextChangeAt
      };
      localStorage.setItem(storageKey, JSON.stringify(migrated));
      return migrated;
    }
    throw new Error("蛋蛋的房间安排数据无效。");
  }

  function flowerRoomForInterval(seed, slot) {
    let value = (seed + Math.imul(slot, 0x9e3779b9)) >>> 0;
    value = Math.imul(value ^ (value >>> 16), 0x85ebca6b);
    value = Math.imul(value ^ (value >>> 13), 0xc2b2ae35);
    value = (value ^ (value >>> 16)) >>> 0;
    return flowerRooms[value % flowerRooms.length];
  }

  function readFlowerRoom() {
    const saved = localStorage.getItem(flowerStorageKey);
    if (saved === null) return { room: null, nextChangeAt: Infinity };

    let schedule = JSON.parse(saved);
    if (Number.isInteger(schedule.seed) && Number.isFinite(schedule.startedAt) &&
      schedule.firstRoom === "bedroom") {
      schedule = {
        seed: schedule.seed,
        startedAt: Date.now(),
        firstRoom: flowerRooms[schedule.seed % flowerRooms.length]
      };
      localStorage.setItem(flowerStorageKey, JSON.stringify(schedule));
    }
    if (!Number.isInteger(schedule.seed) || !Number.isFinite(schedule.startedAt) ||
      !flowerRooms.includes(schedule.firstRoom)) {
      throw new Error("花花的房间安排数据无效。");
    }

    const slot = Math.max(0, Math.floor((Date.now() - schedule.startedAt) / interval));
    return {
      room: slot === 0 ? schedule.firstRoom : flowerRoomForInterval(schedule.seed, slot),
      nextChangeAt: schedule.startedAt + (slot + 1) * interval
    };
  }

  function readXiaoyiRoom() {
    const saved = localStorage.getItem(xiaoyiStorageKey);
    if (saved === null) return { room: null, nextChangeAt: Infinity };

    const schedule = JSON.parse(saved);
    const xiaoyiRooms = ["egg", "esports", "bedroom"];
    if (!Number.isFinite(schedule.startedAt) ||
      !xiaoyiRooms.includes(schedule.firstRoom)) {
      throw new Error("小易的房间安排数据无效。");
    }

    const slot = Math.max(0, Math.floor((Date.now() - schedule.startedAt) / 900000));
    return {
      room: xiaoyiRooms[(xiaoyiRooms.indexOf(schedule.firstRoom) + slot) % xiaoyiRooms.length],
      nextChangeAt: schedule.startedAt + (slot + 1) * 900000
    };
  }

  function ensureInvitation(schedule, together) {
    if (!invitation || !together) {
      if (invitation) invitation.hidden = true;
      return null;
    }

    const saved = localStorage.getItem(invitationKey);
    const current = saved ? JSON.parse(saved) : null;
    if (!current || current.visitUntil !== schedule.nextChangeAt) {
      localStorage.setItem(invitationKey, JSON.stringify({
        visitUntil: schedule.nextChangeAt,
        state: "pending"
      }));
    }
    const active = JSON.parse(localStorage.getItem(invitationKey));
    invitation.hidden = active.state !== "pending";
    return active.state;
  }

  function stopConversation() {
    window.clearTimeout(conversationTimer);
    conversationTimer = undefined;
    conversationVisit = null;
    if (reaction) reaction.hidden = true;
  }

  function startConversation(visitUntil) {
    if (!reaction || conversationVisit === visitUntil) return;
    window.clearTimeout(conversationTimer);
    conversationVisit = visitUntil;
    let lineIndex = 0;
    reaction.hidden = false;
    const showLine = () => {
      const line = conversation[lineIndex];
      reaction.textContent = line;
      reaction.classList.toggle("is-xiaoyi", line.startsWith("小易："));
    };
    showLine();

    const showNextLine = () => {
      lineIndex += 1;
      if (lineIndex >= conversation.length) return;
      showLine();
      conversationTimer = window.setTimeout(showNextLine, 2600);
    };
    conversationTimer = window.setTimeout(showNextLine, 2600);
  }

  function updateRoom() {
    window.clearTimeout(timer);
    try {
      let schedule = readSchedule();
      if (Date.now() >= schedule.nextChangeAt) {
        const nextRooms = rooms.filter((room) => room !== schedule.room);
        schedule = {
          room: nextRooms[Math.floor(Math.random() * nextRooms.length)],
          nextChangeAt: Date.now() + randomDuration()
        };
        localStorage.setItem(storageKey, JSON.stringify(schedule));
      }

      const flowerSchedule = readFlowerRoom();
      const storedAppearance = localStorage.getItem(appearanceStorageKey);
      const savedAppearance = legacyAppearances[storedAppearance] || storedAppearance;
      let appearance = appearances.find(({ src }) => src === savedAppearance);
      if (!appearance) {
        appearance = appearances[0];
      }
      if (storedAppearance !== appearance.src) {
        localStorage.setItem(appearanceStorageKey, appearance.src);
      }
      const roomAppearance = currentRoom === "esports"
        ? { src: "3.webp", alt: "使用3号抠图形象的蛋蛋" }
        : appearance;
      if (defaultArt && roomAppearance) {
        if (defaultArt.getAttribute("src") !== roomAppearance.src) {
          defaultArt.setAttribute("src", roomAppearance.src);
        }
        defaultArt.alt = roomAppearance.alt;
      }
      const activeRoom = schedule.room;
      const dandanIsHere = currentRoom === activeRoom;
      const flowerIsHere = currentRoom === flowerSchedule.room;
      const dandanAndHuahuaAreHere = dandanIsHere && flowerIsHere;
      const useLivingTogetherArt = dandanAndHuahuaAreHere && currentRoom === "egg";
      const useCatTogetherArt = dandanAndHuahuaAreHere && currentRoom === "flower";
      const useBedroomTogetherArt = dandanAndHuahuaAreHere && currentRoom === "bedroom";
      const useEsportsTogetherArt = dandanAndHuahuaAreHere && currentRoom === "esports";
      const xiaoyiSchedule = readXiaoyiRoom();
      const theyAreTogether = dandanIsHere &&
        activeRoom === "esports" &&
        xiaoyiSchedule.room === "esports" &&
        !flowerIsHere;
      const togetherArtIsActive = theyAreTogether || useCatTogetherArt ||
        useBedroomTogetherArt || useEsportsTogetherArt;
      if (togetherArt) {
        const source = theyAreTogether && appearance?.esportsPairSrc
          ? appearance.esportsPairSrc
          : appearance?.pairSrc || "dandan-huahua-floral.webp?v=1";
        if (togetherArt.getAttribute("src") !== source) {
          togetherArt.setAttribute("src", source);
        }
        togetherArt.alt = theyAreTogether
          ? "蛋蛋和小易在电竞房一起玩耍"
          : appearance?.pairAlt || "穿白色刺绣中式礼服的蛋蛋抱着花花，一起休息";
      }
      const pairSource = appearance?.pairSrc || "dandan-huahua-floral.webp?v=1";
      const pairAlt = appearance?.pairAlt || "穿白色刺绣中式礼服的蛋蛋抱着花花";
      for (const pair of [livingTogetherArt, bedroomTogetherArt]) {
        const image = pair?.querySelector("img");
        if (!image) continue;
        if (image.getAttribute("src") !== pairSource) image.setAttribute("src", pairSource);
        image.alt = pairAlt;
      }
      const invitationState = ensureInvitation({ ...schedule, room: activeRoom }, theyAreTogether);
      if (theyAreTogether && invitationState === "declined") {
        startConversation(schedule.nextChangeAt);
      } else {
        stopConversation();
      }
      if (character) character.hidden = !dandanIsHere || useLivingTogetherArt || useBedroomTogetherArt;
      if (flowerCharacter) {
        flowerCharacter.hidden = !flowerIsHere ||
          useLivingTogetherArt || useCatTogetherArt ||
          useBedroomTogetherArt || useEsportsTogetherArt;
      }
      if (livingTogetherArt) livingTogetherArt.hidden = !useLivingTogetherArt;
      if (bedroomTogetherArt) bedroomTogetherArt.hidden = !useBedroomTogetherArt;
      if (visitor) visitor.hidden = !dandanIsHere;
      if (visitor) visitor.classList.toggle("is-with-flower", flowerIsHere);
      if (defaultArt) defaultArt.classList.toggle("is-hidden", togetherArtIsActive);
      if (togetherArt) togetherArt.classList.toggle(
        "is-hidden",
        useLivingTogetherArt || useBedroomTogetherArt ||
          (!useCatTogetherArt && !useEsportsTogetherArt && !theyAreTogether)
      );
      if (visitorLabel) {
        visitorLabel.hidden = theyAreTogether;
        visitorLabel.textContent = togetherArtIsActive
          ? theyAreTogether ? "✨ 蛋蛋和小易一起玩" : "蛋蛋和花花在一起"
          : flowerIsHere && currentRoom === "esports" ? "花花和蛋蛋都来啦"
          : currentRoom === "flower" ? "蛋蛋来找花花啦"
            : currentRoom === "bedroom" ? "蛋蛋来卧室休息啦" : "✨ 蛋蛋来玩啦";
      }
      if (status) {
        status.textContent = dandanIsHere
          ? "蛋蛋现在在这个房间陪你。"
          : `蛋蛋现在在${{
            egg: "客厅",
            flower: "花花的小窝",
            esports: "电竞房",
            bedroom: "卧室"
          }[activeRoom]}。`;
      }
      if (presence) {
        presence.textContent = dandanIsHere ? "蛋蛋在这里" : "蛋蛋外出中";
      }
      window.dispatchEvent(new CustomEvent("dandan-room-change", {
        detail: { room: activeRoom, isHere: dandanIsHere }
      }));

      const nextUpdateAt = Math.min(
        schedule.nextChangeAt,
        xiaoyiSchedule.nextChangeAt,
        flowerSchedule.nextChangeAt
      );
      timer = window.setTimeout(
        updateRoom,
        Math.max(250, nextUpdateAt - Date.now() + 25)
      );
    } catch (error) {
      if (character) character.hidden = true;
      if (visitor) visitor.hidden = true;
      if (defaultArt) defaultArt.classList.remove("is-hidden");
      if (togetherArt) togetherArt.classList.add("is-hidden");
      if (visitorLabel) visitorLabel.textContent = "✨ 蛋蛋来玩啦";
      if (status) status.textContent = "蛋蛋的位置同步失败，请检查浏览器存储权限。";
      if (presence) presence.textContent = "蛋蛋暂时无法定位";
      window.dispatchEvent(new CustomEvent("dandan-room-change", {
        detail: { room: null, isHere: false }
      }));
      if (invitation) invitation.hidden = true;
      if (livingTogetherArt) livingTogetherArt.hidden = true;
      if (bedroomTogetherArt) bedroomTogetherArt.hidden = true;
      stopConversation();
      console.error("Unable to synchronize Dandan's room:", error);
    }
  }

  const acceptInvitation = () => {
    try {
      const schedule = readSchedule();
      const xiaoyiSchedule = readXiaoyiRoom();
      if (schedule.room !== "esports" || xiaoyiSchedule.room !== "esports") {
        updateRoom();
        return;
      }

      const now = Date.now();
      localStorage.setItem(storageKey, JSON.stringify({
        room: "egg",
        nextChangeAt: now + randomDuration()
      }));
      localStorage.setItem(xiaoyiStorageKey, JSON.stringify({
        startedAt: now,
        firstRoom: "egg"
      }));
      localStorage.setItem(invitationKey, JSON.stringify({
        visitUntil: schedule.nextChangeAt,
        state: "accepted"
      }));
      window.dispatchEvent(new CustomEvent("xiaoyi-room-schedule-change"));
      updateRoom();
    } catch (error) {
      if (status) status.textContent = "暂时无法更新房间安排，请检查浏览器存储权限。";
      console.error("Unable to move Dandan and Xiaoyi to the living room:", error);
    }
  };

  const declineInvitation = () => {
    try {
      const schedule = readSchedule();
      localStorage.setItem(invitationKey, JSON.stringify({
        visitUntil: schedule.nextChangeAt,
        state: "declined"
      }));
      updateRoom();
    } catch (error) {
      if (status) status.textContent = "无法保存你的选择，请检查浏览器存储权限。";
      console.error("Unable to save Dandan's invitation choice:", error);
    }
  };

  document.querySelector("[data-invitation-accept]")?.addEventListener("click", acceptInvitation);
  document.querySelector("[data-invitation-decline]")?.addEventListener("click", declineInvitation);

  updateRoom();
  window.addEventListener("storage", (event) => {
    if (event.key === storageKey || event.key === appearanceStorageKey ||
      event.key === xiaoyiStorageKey ||
      event.key === invitationKey || event.key === flowerStorageKey) updateRoom();
  });
  window.addEventListener("dandan-appearance-change", updateRoom);
  window.addEventListener("dandan-room-schedule-change", updateRoom);
  window.addEventListener("flower-room-schedule-change", updateRoom);
  document.addEventListener("visibilitychange", updateRoom);
})();
