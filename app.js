(function () {
  const stage = document.querySelector("#stage");
  const state = { outfit: null, reply: null, answer: null };
  let lock = false;

  function go(id) {
    if (lock) return;
    lock = true;
    stage.classList.add("is-out");
    window.setTimeout(function () {
      draw(id);
      stage.scrollTop = 0;
      stage.classList.remove("is-out");
      lock = false;
    }, 180);
  }

  var steps = {
    cover: "01 Обложка",
    open: "02 Начало",
    outfit: "03 Одежда",
    ring: "04 Звонок",
    hello: "05 Алло",
    reply: "06 Что сказать",
    said_here: "07 Ответ",
    said_quiet: "07 Ответ",
    said_hold: "07 Ответ",
    woman: "08 Голос",
    woman_known: "08 Голос",
    answer: "09 Что сделать",
    end_who: "10 После звонка",
    end_hang: "10 После звонка",
    end_wait: "10 После звонка",
    floor: "11 Стук",
    door: "12 Дверь",
    reason: "13 Кухня",
    hold: "14 Не просыпайся",
    morning: "15 Утро"
  };

  var screens = {
    cover: "01 Обложка",
    open: "02 Начало",
    outfit: "03 Одежда",
    ring: "04 Звонок",
    hello: "05 Алло",
    reply: "06 Что сказать",
    said_here: "07 Я тут",
    said_quiet: "07 Молчу",
    said_hold: "07 Не клади трубку",
    woman: "08 Чужой голос",
    woman_known: "08 Уже слышала",
    answer: "09 Что сделать",
    end_who: "10 Кто там",
    end_hang: "10 Положила трубку",
    end_wait: "10 Подожду",
    floor: "11 Стук",
    door: "12 Дверь",
    reason: "13 Кухня",
    hold: "14 Не просыпайся",
    morning: "15 Утро"
  };

  var outfits = { shirt: "Его футболка", dress: "Красное платье", hoodie: "Худи" };
  var replies = { said_here: "Я тут", said_quiet: "Молчу", said_hold: "Не клади трубку" };
  var answers = { end_who: "Кто там", end_hang: "Положила трубку", end_wait: "Подожду" };

  function track(id) {
    var step = steps[id];
    if (!step) return;
    var data = { "Шаг": step, "Экран": screens[id] || step };
    var choice = outfits[state.outfit] && id === "ring" ? outfits[state.outfit] : replies[id] || answers[id];
    if (choice) data["Выбор"] = choice;
    ensureStory();
    if (typeof ym !== "function") return;
    ym(114415095, "params", data);
    ym(114415095, "reachGoal", "step_" + step.slice(0, 2));
    if (location.pathname.indexOf("dmb-shop") !== -1) {
      ym(113666212, "params", data);
      ym(113666212, "reachGoal", "step_" + step.slice(0, 2));
    }
  }

  function draw(id) {
    const scene = window.sceneById(id, state);
    track(id);
    stage.replaceChildren();
    if (scene.type === "cover") {
      drawCover(scene);
      return;
    }
    if (scene.kicker) stage.append(el("p", "kicker", scene.kicker));

    if (scene.type === "call") drawCall(scene);
    else if (scene.type === "wardrobe") drawWardrobe(scene);
    else if (scene.type === "lines") drawLines(scene);
    else if (scene.type === "morning") drawMorning(scene);
    else drawProse(scene);

    if (scene.type === "call" && navigator.vibrate) navigator.vibrate(18);
  }

  function drawCover(scene) {
    const wrap = el("section", "cover");
    wrap.append(el("p", "poster-label", scene.label));
    const image = document.createElement("img");
    image.className = "poster";
    image.src = scene.image;
    image.alt = "Потом объясню";
    wrap.append(image);
    const button = el("button", "go", scene.cta);
    button.type = "button";
    button.addEventListener("click", function () {
      if (location.pathname.indexOf("dmb-shop") !== -1 && typeof ym === "function") {
        ym(113666212, "reachGoal", "read_story");
      }
      ensureStory();
      go(scene.next);
    });
    wrap.append(button);
    stage.append(wrap);
  }

  function drawProse(scene) {
    if (scene.title) stage.append(el("h1", "", scene.title));
    if (scene.lead) stage.append(el("p", "lead", scene.lead));
    stage.append(blocks(scene.blocks));
    stage.append(dock(scene.cta || "Дальше", function () { go(scene.next); }));
  }

  function drawCall(scene) {
    const wrap = el("section", "call");
    wrap.append(el("div", "avatar", "С"));
    wrap.append(el("h2", "", scene.name));
    wrap.append(el("p", "status", scene.status));
    const button = el("button", "answer", scene.cta);
    button.type = "button";
    button.addEventListener("click", function () { go(scene.next); });
    wrap.append(button);
    stage.append(wrap);
  }

  function drawWardrobe(scene) {
    stage.append(el("h1", "", scene.prompt));
    const list = el("div", "choices");
    scene.options.forEach(function (option) {
      const button = el("button", "choice");
      button.type = "button";
      button.append(el("span", "cloth " + option.cloth, ""));
      const copy = el("span", "");
      copy.append(el("span", "name", option.name));
      copy.append(el("span", "note", option.note));
      button.append(copy);
      button.addEventListener("click", function () {
        Object.assign(state, option.set);
        go(option.next);
      });
      list.append(button);
    });
    stage.append(list);
  }

  function drawLines(scene) {
    stage.append(el("h1", "", scene.prompt));
    const list = el("div", "lines");
    scene.options.forEach(function (option) {
      const button = el("button", "line", option.text);
      button.type = "button";
      button.addEventListener("click", function () {
        Object.assign(state, option.set);
        go(option.next);
      });
      list.append(button);
    });
    stage.append(list);
  }

  function ensureStory() {
    if (window.__storyReady) return;
    window.__storyReady = true;
    var present = false;
    for (var j = 0; j < document.scripts.length; j++) {
      if ((document.scripts[j].src || "").indexOf("114415095") !== -1) present = true;
    }
    if (present) return;
    (function(m,e,t,r,i,k,a){
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var n = 0; n < document.scripts.length; n++) {if (document.scripts[n].src === r) { return; }}
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=114415095", "ym");
    ym(114415095, "init", {ssr:true, webvisor:true, clickmap:true, accurateTrackBounce:true, trackLinks:true});
  }

  function goal(name) {
    ensureStory();
    if (typeof ym !== "function") return;
    ym(114415095, "reachGoal", name);
    if (location.pathname.indexOf("dmb-shop") !== -1) ym(113666212, "reachGoal", name);
  }

  function drawMorning(scene) {
    goal("finished");
    stage.append(blocks(scene.blocks));
    const phone = el("section", "phone");
    const header = document.createElement("header");
    header.append(el("span", "", "Серёжа"));
    header.append(el("span", "", "08:47"));
    phone.append(header);
    const thread = el("div", "thread");
    thread.append(bubble("сегодня телефон у меня:) звони после обеда до 18"));
    phone.append(thread);

    const form = el("form", "composer");
    const draft = el("p", "draft", "Это был сон?");
    const send = el("button", "send", "Отправить");
    send.type = "submit";
    form.append(draft, send);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (thread.querySelector(".mine")) return;
      thread.append(bubble("Это был сон?", "нет сети", true));
      send.disabled = true;
      coda.hidden = false;
    });
    phone.append(form);
    stage.append(phone);

    const coda = el("p", "coda", "Сообщение не ушло. Вторая серия начнётся, когда он ответит.");
    coda.hidden = true;
    stage.append(coda);

    const next = document.createElement("a");
    next.className = "go next-episode";
    next.href = "https://t.me/dmbromance";
    next.target = "_blank";
    next.rel = "noopener";
    next.textContent = "Вместе ждать продолжение";
    next.addEventListener("click", function () { goal("episode2"); });
    stage.append(next);

    const mail = document.createElement("a");
    mail.className = "mail";
    mail.href = "mailto:wshp.no1@gmail.com?subject=" + encodeURIComponent("Потом объясню");
    mail.textContent = "Написать, что думаешь";
    mail.addEventListener("click", function () { goal("comment"); });
    stage.append(mail);

    const again = el("button", "again", "Сначала");
    again.type = "button";
    again.addEventListener("click", function () {
      state.outfit = null;
      state.reply = null;
      state.answer = null;
      go("open");
    });
    stage.append(again);
  }

  function bubble(text, meta, mine) {
    const node = el("div", mine ? "bubble mine" : "bubble");
    node.append(document.createTextNode(text));
    if (meta) node.append(el("span", "meta", meta));
    return node;
  }

  function blocks(list) {
    const wrap = el("div", "prose");
    list.forEach(function (block) {
      if (block.type === "say") {
        const say = el("div", "say");
        say.append(el("span", "who", block.who));
        say.append(el("p", "", block.text));
        wrap.append(say);
      } else {
        wrap.append(el("p", "", block.text));
      }
    });
    return wrap;
  }

  function dock(label, onClick) {
    const wrap = el("div", "dock");
    const button = el("button", "go", label);
    button.type = "button";
    button.addEventListener("click", onClick);
    wrap.append(button);
    return wrap;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  const browser = document.createElement("a");
  browser.className = "browser";
  browser.href = location.origin + location.pathname;
  browser.target = "_blank";
  browser.rel = "noopener";
  browser.textContent = "В браузере";
  browser.addEventListener("click", function () { goal("browser"); });
  document.body.append(browser);

  if (location.pathname.indexOf("dmb-shop") !== -1) ensureStory();
  draw("cover");
})();
