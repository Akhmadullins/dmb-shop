window.CALENDARS = [
  { id: "v1-frame", group: "variant1", title: "С рамкой", theme: "light", photos: [], hint: "" },
  { id: "v1-white", group: "variant1", title: "Белый фон", theme: "light", photos: [], hint: "" },
  { id: "v1-red", group: "variant1", title: "Красный", theme: "dark", photos: [], hint: "" },
  { id: "v1-plain", group: "variant1", title: "Без рамки", theme: "light", photos: [], hint: "" },
  {
    id: "v2-plain",
    group: "variant2",
    title: "Без рамки",
    theme: "light",
    hint: "Лучше горизонтальные фото в оба окна.",
    photos: [
      { id: "photo-1", x: 9, y: 17.35, w: 38.73, h: 32.59 },
      { id: "photo-2", x: 9, y: 52.88, w: 38.73, h: 32.59 }
    ]
  },
  {
    id: "v2-white",
    group: "variant2",
    title: "Белый",
    theme: "light",
    hint: "Лучше горизонтальные фото в оба окна.",
    photos: [
      { id: "photo-1", x: 9, y: 17.35, w: 38.73, h: 32.59 },
      { id: "photo-2", x: 9, y: 52.88, w: 38.73, h: 32.59 }
    ]
  },
  {
    id: "v2-red",
    group: "variant2",
    title: "Красный",
    theme: "dark",
    hint: "Лучше горизонтальные фото в оба окна.",
    photos: [
      { id: "photo-1", x: 8.26, y: 18.1, w: 38.9, h: 32.62 },
      { id: "photo-2", x: 8.3, y: 52.94, w: 38.9, h: 32.62 }
    ]
  }
];

// Позиции: X/Y из замеров ÷ артборд 7087×5032 (W×H листа в PNG; в Фигме часто пишут W5032 H7087).
const ART_W = 7087;
const ART_H = 5032;

// Вар.1: имя — крупнее; даты в одной колонке, правее имени.
const V1_NAME_X = 728;
const V1_DATE_X = 802;
const V1_LIFT = 28;
const V1_RED_EXTRA_LIFT = 24;
// Вар.2: один X для всех строк; имя чуть ниже, даты чуть выше (Jar Binks на линиях).
const V2_SHIFT_X = 15;
const V2_SHIFT_Y = -15;
const V2_VALUE_X = 6088 + V2_SHIFT_X;
const V2_NAME_Y_NUDGE = 12 + V2_SHIFT_Y;
const V2_DATE_Y_NUDGE = -34 + V2_SHIFT_Y;
const V2_DATE_SCALE = 0.94 / 1.5;
const V2_RED_EXTRA_X = 95;
const V2_RED_EXTRA_LIFT = 52;

const DATE_FIELD = { font: "Helvetica Neue", scale: 0.94 };

function v1Fields(extraLift) {
  const lift = V1_LIFT + extraLift;
  return [
    {
      id: "name",
      label: "Имя",
      placeholder: "Как подписать",
      x: pct(V1_NAME_X, ART_W),
      y: pct(4212 + 18 - lift, ART_H),
      dy: -0.1,
      scale: 1.22,
      bold: true
    },
    {
      id: "callup",
      label: "Призыв",
      placeholder: "01.12.24",
      x: pct(V1_DATE_X, ART_W),
      y: pct(4549 + 22 - 38 - lift, ART_H),
      dy: -0.08,
      ...DATE_FIELD,
      scale: V2_DATE_SCALE,
      weight: 700
    },
    {
      id: "dembel",
      label: "Дембель",
      placeholder: "01.12.25",
      x: pct(V1_DATE_X, ART_W),
      y: pct(4746 + 22 - 38 - lift, ART_H),
      dy: -0.08,
      ...DATE_FIELD,
      scale: V2_DATE_SCALE,
      weight: 700
    }
  ];
}

function v2Fields(extraX, extraLift) {
  const valueX = V2_VALUE_X + extraX;
  const lift = extraLift;
  return [
    {
      id: "name",
      label: "Имя",
      placeholder: "Как подписать",
      x: pct(valueX, ART_W),
      y: pct(214 + V2_NAME_Y_NUDGE - lift, ART_H),
      dy: 0.04,
      bold: true,
      scale: 1.08
    },
    {
      id: "callup",
      label: "Призыв",
      placeholder: "01.12.24",
      x: pct(valueX, ART_W),
      y: pct(551 + V2_DATE_Y_NUDGE - lift, ART_H),
      dy: 0.02,
      ...DATE_FIELD,
      scale: V2_DATE_SCALE,
      weight: 700
    },
    {
      id: "dembel",
      label: "Дембель",
      placeholder: "01.12.25",
      x: pct(valueX, ART_W),
      y: pct(745 + V2_DATE_Y_NUDGE - lift, ART_H),
      dy: 0.02,
      ...DATE_FIELD,
      scale: V2_DATE_SCALE,
      weight: 700
    }
  ];
}

window.CAL_FIELDS = {
  variant1: v1Fields(0),
  "v1-red": v1Fields(V1_RED_EXTRA_LIFT),
  variant2: v2Fields(0, 0),
  "v2-red": v2Fields(V2_RED_EXTRA_X, V2_RED_EXTRA_LIFT)
};

function pct(px, base) {
  return Math.round((px / base) * 10000) / 100;
}