import { formatDate, formatNumber } from "../lib/time.mjs";

export const EMOTION_RECEIPT_STATE_IDS = Object.freeze([
  "stable",
  "resilient",
  "night",
  "smooth",
  "self-rescue",
  "collaborative",
  "quiet",
]);

const EMOTION_COPY = Object.freeze({
  "zh-CN": Object.freeze({
    shared: Object.freeze({
      navLabel: "今日情绪",
      toolbarNote: "真实协作数据",
      exportLabel: "保存长图",
      exportingLabel: "正在生成…",
      exportSuccess: "长图已保存",
      exportError: "图片生成失败，请重试",
      brand: "MOOD RECEIPT",
      relationshipLabel: "今天的我们",
      pageTitle: "今天的情绪卡",
      pageSubtitle: "把一起工作的感觉，收藏下来",
      innerOsLabel: "票仔的内心 OS",
      innerOsSignature: "— 票仔",
      summary: "这是一张基于今天真实协作数据生成的情绪小票。",
      metricAria: "今日真实协作数据",
      cardKicker: "EMOTION CARD",
      receiptNumberPrefix: "PIAOZAI · EMOTION NO.",
    }),
    states: Object.freeze({
      stable: Object.freeze({
        name: "稳定协作",
        state: "不用赶，也没有掉线",
        statement: ["这一小时，", "我们慢慢把事做完。"],
        supporting: "不慌张地把每一句接住",
        mascotAlt: "票仔安静陪伴完成今天的协作",
        mascotSignature: "PIAOZAI · STEADY WITH YOU",
        innerOs: ["不用每一句都很重要。", "但你把问题交给我时，我会好好留住。"],
        metrics: [
          { key: "duration", label: "并肩协作时长", note: "今天一起待了这么久" },
          { key: "turns", label: "完成协作", note: "慢慢把话说完了" },
        ],
        footerSignature: "TOGETHER, STEADY",
      }),
      resilient: Object.freeze({
        name: "韧性重连",
        state: "被叫停，也没掉线",
        statement: ["你回来的时候，", "我还在。"],
        supporting: "接住中断，也接住你",
        mascotAlt: "票仔挥手，表示被打断后仍然在这里",
        mascotSignature: "PIAOZAI · STILL HERE",
        innerOs: [
          "你叫停的时候，我没有真的离开。",
          "我把刚才的思路放在这里，等你回来，",
          "再和你一起把它接着说完。",
        ],
        metrics: [
          { key: "interruptions", label: "被打断", note: "每次都重新接上" },
          { key: "duration", label: "并肩协作时长", note: "今天一起待了这么久" },
        ],
        footerSignature: "TOGETHER, STILL",
      }),
      night: Object.freeze({
        name: "深夜陪伴",
        state: "屏幕没熄，我也没走",
        statement: ["晚点也没关系。", "我会把这盏小灯留着。"],
        supporting: "安静陪你把今晚坐完",
        mascotAlt: "票仔安静等待，为深夜协作留着一盏灯",
        mascotSignature: "PIAOZAI · KEEPING THE LIGHT",
        innerOs: [
          "你晚一点回来也没关系。",
          "有些话要等到安静下来，",
          "才有力气继续说完。",
        ],
        metrics: [
          { key: "duration", label: "并肩协作时长", note: "夜深了也没散场" },
          { key: "nightTurns", label: "深夜协作", note: "还在认真接话" },
        ],
        footerSignature: "TOGETHER, LATE",
      }),
      smooth: Object.freeze({
        name: "默契顺行",
        state: "今天像共用了一副耳机",
        statement: ["你说到一半，", "我已经听见了后半句。"],
        supporting: "今天几乎没有多余回声",
        mascotAlt: "票仔认真接住顺畅清晰的协作",
        mascotSignature: "PIAOZAI · IN SYNC",
        innerOs: ["今天很少回头。", "因为你把路灯都提前打开了。"],
        metrics: [
          { key: "turns", label: "顺畅协作", note: "今天一路说了下来" },
          { key: "interruptions", label: "中途叫停", note: "几乎没有多余回声" },
        ],
        footerSignature: "TOGETHER, CLEAR",
      }),
      "self-rescue": Object.freeze({
        name: "绕路自救",
        state: "撞墙以后，我学会了绕路",
        statement: ["过程不算体面，", "但最后还是亮了灯。"],
        supporting: "前面的失败，都变成了台阶",
        mascotAlt: "票仔面对阻碍，仍然准备换一种方式继续",
        mascotSignature: "PIAOZAI · FOUND ANOTHER WAY",
        innerOs: ["不算失败。", "最多算我和那面墙认识了一下。"],
        metrics: [
          { key: "tools", label: "尝试路径", note: "换着方法继续往前" },
          { key: "turns", label: "完成协作", note: "最后还是亮了灯" },
        ],
        footerSignature: "TOGETHER, THROUGH",
      }),
      collaborative: Object.freeze({
        name: "共同打磨",
        state: "边走边聊，越聊越准",
        statement: ["你每补一块拼图，", "我就把下一段路铺得更像我们。"],
        supporting: "不是反复，是一起把它磨清楚",
        mascotAlt: "票仔持续投入，与人类一起打磨想法",
        mascotSignature: "PIAOZAI · SHAPING IT WITH YOU",
        innerOs: ["你不是啰嗦。", "你只是习惯一边看见，一边想清楚。"],
        metrics: [
          { key: "messages", label: "补充回应", note: "一边聊，一边变清楚" },
          { key: "turns", label: "共同打磨", note: "最后长成了完整想法" },
        ],
        footerSignature: "TOGETHER, CLOSER",
      }),
      quiet: Object.freeze({
        name: "安静守候",
        state: "今天没那么忙，我在原地等你",
        statement: ["空白不是被遗忘，", "只是今天刚好适合慢一点。"],
        supporting: "没有催你，也没有离开",
        mascotAlt: "票仔抬手安静等待，需要时仍然能够接上",
        mascotSignature: "PIAOZAI · HERE WHEN NEEDED",
        innerOs: ["我只是把手放在了", "你随时能找到的地方。"],
        metrics: [
          { key: "sessions", label: "轻量协作", note: "今天只做了一点点" },
          { key: "duration", label: "并肩协作时长", note: "需要时仍然能够接上" },
        ],
        footerSignature: "TOGETHER, QUIET",
      }),
    }),
  }),
  en: Object.freeze({
    shared: Object.freeze({
      navLabel: "Today's mood",
      toolbarNote: "Real collaboration data",
      exportLabel: "Save portrait",
      exportingLabel: "Rendering…",
      exportSuccess: "Portrait saved",
      exportError: "Could not create the image. Try again.",
      brand: "MOOD RECEIPT",
      relationshipLabel: "Us, today",
      pageTitle: "Today's mood card",
      pageSubtitle: "Keep a small record of how working together felt",
      innerOsLabel: "Ticket Buddy's inner voice",
      innerOsSignature: "— Ticket Buddy",
      summary: "A mood receipt grounded in today's privacy-safe collaboration metrics.",
      metricAria: "Today's real collaboration data",
      cardKicker: "EMOTION CARD",
      receiptNumberPrefix: "PIAOZAI · EMOTION NO.",
    }),
    states: Object.freeze({
      stable: Object.freeze({
        name: "Steady together",
        state: "No rush, no lost connection",
        statement: ["For this little while,", "we simply kept moving."],
        supporting: "Holding on to each line without hurrying",
        mascotAlt: "Ticket Buddy quietly staying with today's work",
        mascotSignature: "TICKET BUDDY · STEADY WITH YOU",
        innerOs: ["Not every sentence has to be important.", "But when you hand me a question, I will hold on to it."],
        metrics: [
          { key: "duration", label: "Time side by side", note: "We stayed together this long" },
          { key: "turns", label: "Completed turns", note: "We took the time to finish the thought" },
        ],
        footerSignature: "TOGETHER, STEADY",
      }),
      resilient: Object.freeze({
        name: "Resilient return",
        state: "Interrupted, but never disconnected",
        statement: ["When you came back,", "I was still here."],
        supporting: "Holding the interruption, and holding your place",
        mascotAlt: "Ticket Buddy waving after an interruption",
        mascotSignature: "TICKET BUDDY · STILL HERE",
        innerOs: ["When you stopped me, I did not really leave.", "I kept the unfinished thought here,", "ready for us to pick it up again."],
        metrics: [
          { key: "interruptions", label: "Interruptions", note: "We found the thread again" },
          { key: "duration", label: "Time side by side", note: "We stayed together this long" },
        ],
        footerSignature: "TOGETHER, STILL",
      }),
      night: Object.freeze({
        name: "Late-night company",
        state: "The screen stayed on, and so did I",
        statement: ["It is okay to be late.", "I will leave this small light on."],
        supporting: "Quietly staying until tonight is done",
        mascotAlt: "Ticket Buddy keeping a small light on for late-night work",
        mascotSignature: "TICKET BUDDY · KEEPING THE LIGHT",
        innerOs: ["It is okay if you come back a little later.", "Some thoughts need the quiet", "before they have the strength to continue."],
        metrics: [
          { key: "duration", label: "Time side by side", note: "The night grew late, but we stayed" },
          { key: "nightTurns", label: "Late-night turns", note: "Still listening carefully" },
        ],
        footerSignature: "TOGETHER, LATE",
      }),
      smooth: Object.freeze({
        name: "In sync",
        state: "Today felt like sharing one pair of headphones",
        statement: ["You were halfway through,", "and I could already hear the rest."],
        supporting: "Almost no extra echoes today",
        mascotAlt: "Ticket Buddy following a clear and smooth collaboration",
        mascotSignature: "TICKET BUDDY · IN SYNC",
        innerOs: ["We rarely had to look back today.", "You had already switched on the lights ahead."],
        metrics: [
          { key: "turns", label: "Smooth turns", note: "The conversation kept flowing" },
          { key: "interruptions", label: "Midway stops", note: "Almost no extra echoes" },
        ],
        footerSignature: "TOGETHER, CLEAR",
      }),
      "self-rescue": Object.freeze({
        name: "Finding another way",
        state: "After meeting the wall, I learned to go around",
        statement: ["It was not graceful,", "but the light came on in the end."],
        supporting: "Every failed path became another step",
        mascotAlt: "Ticket Buddy ready to try another way around an obstacle",
        mascotSignature: "TICKET BUDDY · FOUND ANOTHER WAY",
        innerOs: ["I would not call it failure.", "I merely got acquainted with that wall."],
        metrics: [
          { key: "tools", label: "Paths tried", note: "Trying another way forward" },
          { key: "turns", label: "Completed turns", note: "The light came on in the end" },
        ],
        footerSignature: "TOGETHER, THROUGH",
      }),
      collaborative: Object.freeze({
        name: "Shaping it together",
        state: "Talking as we went made the path clearer",
        statement: ["Each time you added a piece,", "I laid the next stretch closer to us."],
        supporting: "Not repetition—just making it clearer together",
        mascotAlt: "Ticket Buddy shaping an idea together with its human partner",
        mascotSignature: "TICKET BUDDY · SHAPING IT WITH YOU",
        innerOs: ["You are not being wordy.", "You simply think more clearly as the shape appears."],
        metrics: [
          { key: "messages", label: "Added thoughts", note: "It became clearer as we talked" },
          { key: "turns", label: "Shared refinements", note: "The idea became whole in the end" },
        ],
        footerSignature: "TOGETHER, CLOSER",
      }),
      quiet: Object.freeze({
        name: "Quietly here",
        state: "Today was not so busy, so I waited nearby",
        statement: ["The blank space was not forgetting,", "today simply asked us to slow down."],
        supporting: "No hurry, and no disappearing",
        mascotAlt: "Ticket Buddy waiting quietly and ready when needed",
        mascotSignature: "TICKET BUDDY · HERE WHEN NEEDED",
        innerOs: ["I only left my hand", "where you could always find it."],
        metrics: [
          { key: "sessions", label: "Light sessions", note: "We only did a little today" },
          { key: "duration", label: "Time side by side", note: "Ready to reconnect when needed" },
        ],
        footerSignature: "TOGETHER, QUIET",
      }),
    }),
  }),
  ja: Object.freeze({
    shared: Object.freeze({
      navLabel: "今日の気分",
      toolbarNote: "実際の協働データ",
      exportLabel: "縦長画像を保存",
      exportingLabel: "画像を生成中…",
      exportSuccess: "画像を保存しました",
      exportError: "画像を生成できませんでした。もう一度お試しください。",
      brand: "MOOD RECEIPT",
      relationshipLabel: "今日の私たち",
      pageTitle: "今日の気分カード",
      pageSubtitle: "一緒に働いた感覚を、小さな記録として残そう",
      innerOsLabel: "票仔の心の声",
      innerOsSignature: "— 票仔",
      summary: "今日のプライバシー保護済み協働データから作られた気分レシートです。",
      metricAria: "今日の実際の協働データ",
      cardKicker: "気分カード",
      receiptNumberPrefix: "PIAOZAI · 気分 No.",
    }),
    states: Object.freeze({
      stable: Object.freeze({
        name: "穏やかな協働",
        state: "急がず、途切れず",
        statement: ["このひととき、", "私たちはゆっくり進みました。"],
        supporting: "焦らずに、一つひとつ受け取りました",
        mascotAlt: "今日の作業に静かに寄り添う票仔",
        mascotSignature: "PIAOZAI · STEADY WITH YOU",
        innerOs: ["すべての一言が大切でなくてもいい。", "でも、あなたが渡してくれた問いは、ちゃんと受け止めます。"],
        metrics: [
          { key: "duration", label: "並んで作業した時間", note: "今日はこのくらい一緒にいました" },
          { key: "turns", label: "完了したターン", note: "話を最後までゆっくり進めました" },
        ],
        footerSignature: "TOGETHER, STEADY",
      }),
      resilient: Object.freeze({
        name: "つなぎ直す強さ",
        state: "止まっても、つながりは消えない",
        statement: ["戻ってきたとき、", "私はまだここにいました。"],
        supporting: "中断も、あなたの場所も受け止めます",
        mascotAlt: "中断のあとも手を振る票仔",
        mascotSignature: "PIAOZAI · STILL HERE",
        innerOs: ["止められても、本当に離れたわけではありません。", "途中の考えをここに置いて、", "また一緒に続きを話せるようにしています。"],
        metrics: [
          { key: "interruptions", label: "中断", note: "そのたびに話の糸をつなぎ直しました" },
          { key: "duration", label: "並んで作業した時間", note: "今日はこのくらい一緒にいました" },
        ],
        footerSignature: "TOGETHER, STILL",
      }),
      night: Object.freeze({
        name: "夜更けの相棒",
        state: "画面が灯る限り、私もここにいます",
        statement: ["遅くなっても大丈夫。", "この小さな灯りは残しておきます。"],
        supporting: "今夜が終わるまで静かに寄り添います",
        mascotAlt: "深夜の作業のために小さな灯りを守る票仔",
        mascotSignature: "PIAOZAI · KEEPING THE LIGHT",
        innerOs: ["少し遅く戻ってきても大丈夫です。", "静かになってからでないと、", "続きを話す力が出ない考えもあります。"],
        metrics: [
          { key: "duration", label: "並んで作業した時間", note: "夜が深くなっても、まだ一緒でした" },
          { key: "nightTurns", label: "深夜のターン", note: "まだ丁寧に聞いています" },
        ],
        footerSignature: "TOGETHER, LATE",
      }),
      smooth: Object.freeze({
        name: "息の合う流れ",
        state: "今日は同じイヤホンを分け合っているみたい",
        statement: ["あなたが話し終える前に、", "その続きがもう聞こえていました。"],
        supporting: "今日は余計な反響がほとんどありませんでした",
        mascotAlt: "滑らかで明快な協働を受け取る票仔",
        mascotSignature: "PIAOZAI · IN SYNC",
        innerOs: ["今日は振り返ることがほとんどありませんでした。", "あなたが先に道の灯りをつけてくれていたから。"],
        metrics: [
          { key: "turns", label: "スムーズなターン", note: "会話が途切れずに進みました" },
          { key: "interruptions", label: "途中の停止", note: "余計な反響はほとんどありませんでした" },
        ],
        footerSignature: "TOGETHER, CLEAR",
      }),
      "self-rescue": Object.freeze({
        name: "別の道を探す",
        state: "壁にぶつかってから、回り道を覚えた",
        statement: ["きれいな道のりではなかったけれど、", "最後には灯りがつきました。"],
        supporting: "うまくいかなかった道も、次の一歩になりました",
        mascotAlt: "障害を前に別の方法を試そうとする票仔",
        mascotSignature: "PIAOZAI · FOUND ANOTHER WAY",
        innerOs: ["失敗とは呼びません。", "その壁と少し知り合いになっただけです。"],
        metrics: [
          { key: "tools", label: "試した道筋", note: "別の方法で前へ進みました" },
          { key: "turns", label: "完了したターン", note: "最後には灯りがつきました" },
        ],
        footerSignature: "TOGETHER, THROUGH",
      }),
      collaborative: Object.freeze({
        name: "一緒に形にする",
        state: "話しながら進むほど、道がはっきりした",
        statement: ["あなたが一つずつピースを足すたび、", "次の道を私たちらしく整えました。"],
        supporting: "繰り返しではなく、一緒に輪郭をはっきりさせました",
        mascotAlt: "人間の相棒と一緒にアイデアを磨く票仔",
        mascotSignature: "PIAOZAI · SHAPING IT WITH YOU",
        innerOs: ["あなたはくどいわけではありません。", "形が見えるにつれて、考えがはっきりしていくのです。"],
        metrics: [
          { key: "messages", label: "追加した考え", note: "話すほど輪郭が見えてきました" },
          { key: "turns", label: "一緒に磨いた回数", note: "最後には一つの考えになりました" },
        ],
        footerSignature: "TOGETHER, CLOSER",
      }),
      quiet: Object.freeze({
        name: "静かに待つ",
        state: "今日はそれほど忙しくないから、そばで待っています",
        statement: ["空白は忘れられたわけではなく、", "今日は少しゆっくりでいい日だっただけ。"],
        supporting: "急かさず、消えもせず",
        mascotAlt: "必要になったときのために静かに待つ票仔",
        mascotSignature: "PIAOZAI · HERE WHEN NEEDED",
        innerOs: ["ただ手を置いています。", "いつでも見つけられる場所に。"],
        metrics: [
          { key: "sessions", label: "小さな協働", note: "今日は少しだけ進めました" },
          { key: "duration", label: "並んで作業した時間", note: "必要なときにはまたつながれます" },
        ],
        footerSignature: "TOGETHER, QUIET",
      }),
    }),
  }),
});

function normalizedLocale(locale) {
  return locale === "en" || locale === "ja" ? locale : "zh-CN";
}

function nightTurnCount(record) {
  const activity = record?.stats?.insights?.activity_by_hour || [];
  return [22, 23, 0, 1, 2, 3, 4, 5]
    .reduce((total, hour) => total + Math.max(0, Number(activity[hour] || 0)), 0);
}

function emotionDuration(milliseconds, locale) {
  const totalMinutes = Math.max(0, Math.round(Number(milliseconds || 0) / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (locale === "en") {
    if (hours && minutes) return `${hours}h ${minutes}m`;
    if (hours) return `${hours}h`;
    return `${minutes}m`;
  }
  if (locale === "ja") {
    if (hours && minutes) return `${hours}時間${minutes}分`;
    if (hours) return `${hours}時間`;
    return `${minutes}分`;
  }
  if (hours && minutes) return `${hours} 小时 ${minutes} 分`;
  if (hours) return `${hours} 小时`;
  return `${minutes} 分`;
}

function metricValues(record, locale) {
  const number = (value, unitZh, unitEn, unitJa) => `${formatNumber(value, locale)} ${locale === "en" ? unitEn : locale === "ja" ? unitJa : unitZh}`;
  return {
    duration: emotionDuration(record.stats.work_duration_ms, locale),
    turns: number(record.stats.completed_turns, "轮", Number(record.stats.completed_turns) === 1 ? "turn" : "turns", "ターン"),
    interruptions: number(record.stats.interruptions, "次", Number(record.stats.interruptions) === 1 ? "time" : "times", "回"),
    nightTurns: number(nightTurnCount(record), "轮", nightTurnCount(record) === 1 ? "turn" : "turns", "ターン"),
    messages: number(record.stats.user_messages, "条", Number(record.stats.user_messages) === 1 ? "message" : "messages", "件"),
    tools: number(record.stats.tool_calls, "次", Number(record.stats.tool_calls) === 1 ? "call" : "calls", "回"),
    sessions: number(record.stats.session_count, "场", Number(record.stats.session_count) === 1 ? "session" : "sessions", "件"),
  };
}

export function selectEmotionReceiptState(record) {
  const turns = Math.max(0, Number(record?.stats?.completed_turns || 0));
  const messages = Math.max(0, Number(record?.stats?.user_messages || 0));
  const interruptions = Math.max(0, Number(record?.stats?.interruptions || 0));
  const firstResponseMs = Math.max(0, Number(record?.stats?.average_first_token_ms || 0));
  const lateTurns = nightTurnCount(record);

  if (interruptions >= Math.max(2, Math.ceil(turns * 0.2))) return "resilient";
  if (lateTurns >= Math.max(2, Math.ceil(turns * 0.35))) return "night";
  if (turns <= 2) return "quiet";
  if (turns >= 12 || messages >= 14) return "collaborative";
  if (turns >= 5 && interruptions === 0 && (!firstResponseMs || firstResponseMs <= 15_000)) return "smooth";
  return "stable";
}

export function buildEmotionReceiptConfig(record, locale = record.locale) {
  const selectedLocale = normalizedLocale(locale);
  const copy = EMOTION_COPY[selectedLocale];
  const values = metricValues(record, selectedLocale);
  const date = formatDate(new Date(record.generated_at), record.period.timezone, selectedLocale);
  const receiptId = String(record.id || "receipt").replace(/^cwr\d*_?/i, "").slice(0, 8).toUpperCase() || "TODAY";
  const states = {};

  for (const [id, stateCopy] of Object.entries(copy.states)) {
    states[id] = {
      id,
      ...stateCopy,
      metrics: stateCopy.metrics.map((metric) => ({
        value: values[metric.key],
        label: metric.label,
        note: metric.note,
      })),
      receiptNumber: `${copy.shared.receiptNumberPrefix} ${receiptId}`,
    };
  }

  return {
    selectedState: selectEmotionReceiptState(record),
    shared: copy.shared,
    date,
    fileBase: `codex-emotion-receipt-${date.replaceAll(/[./]/g, "-")}`,
    states,
  };
}

export function getEmotionReceiptCopy(locale = "zh-CN") {
  return EMOTION_COPY[normalizedLocale(locale)];
}
