"use client";

import { useState } from "react";
import { XP_BY_DIFFICULTY, type Difficulty } from "@questlog/engine";
import { BOSSES, BOSS_IDS, type BossArtId } from "@/assets/registry";
import { DIFFICULTY_LABEL } from "@/lib/types";
import { Sprite } from "./Sprite";

export interface QuestDraft {
  title: string;
  difficulty: Difficulty;
}

const DEFAULT_ART: BossArtId = "deadline_dragon";

export function NewBossForm({
  onCreate,
}: {
  onCreate: (title: string, drafts: QuestDraft[], art: BossArtId) => void;
}) {
  const [open, setOpen] = useState(false);
  const [bossTitle, setBossTitle] = useState("");
  const [art, setArt] = useState<BossArtId>(DEFAULT_ART);
  const [drafts, setDrafts] = useState<QuestDraft[]>([]);
  const [qTitle, setQTitle] = useState("");
  const [qDiff, setQDiff] = useState<Difficulty>("medium");

  if (!open) {
    return (
      <button className="pixel-btn self-start" onClick={() => setOpen(true)}>
        ⚔ Новий бос
      </button>
    );
  }

  const totalHp = drafts.reduce(
    (sum, d) => sum + XP_BY_DIFFICULTY[d.difficulty],
    0,
  );

  function addDraft() {
    const text = qTitle.trim();
    if (!text) return;
    setDrafts((d) => [...d, { title: text, difficulty: qDiff }]);
    setQTitle("");
  }

  function close() {
    setOpen(false);
    setBossTitle("");
    setArt(DEFAULT_ART);
    setDrafts([]);
    setQTitle("");
  }

  function submit() {
    const title = bossTitle.trim();
    if (!title || drafts.length === 0) return;
    onCreate(title, drafts, art);
    close();
  }

  return (
    <section className="pixel-card flex flex-col gap-3">
      <h2 className="text-sm">Новий бос</h2>

      <input
        className="pixel-input"
        placeholder="Велика ціль, наприклад: Захистити диплом"
        value={bossTitle}
        onChange={(e) => setBossTitle(e.target.value)}
      />

      <div
        role="radiogroup"
        aria-label="Вигляд боса"
        className="flex flex-wrap gap-1"
      >
        {BOSS_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={art === id}
            aria-label={BOSSES[id].name}
            title={BOSSES[id].name}
            className={`boss-option ${art === id ? "is-selected" : ""}`}
            onClick={() => setArt(id)}
          >
            <Sprite sprite={BOSSES[id].sprite} />
          </button>
        ))}
      </div>
      <p className="opacity-70">Обрано: {BOSSES[art].name}</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="pixel-input flex-1"
          placeholder="Крок до цілі..."
          value={qTitle}
          onChange={(e) => setQTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addDraft()}
        />
        <select
          className="pixel-input"
          value={qDiff}
          onChange={(e) => setQDiff(e.target.value as Difficulty)}
        >
          {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABEL[d]}
            </option>
          ))}
        </select>
        <button className="pixel-btn" onClick={addDraft}>
          + Крок
        </button>
      </div>

      {drafts.length > 0 && (
        <ul className="flex flex-col gap-1">
          {drafts.map((d, i) => (
            <li key={i} className="flex items-center justify-between gap-2">
              <span>
                {d.title} · {DIFFICULTY_LABEL[d.difficulty]}
              </span>
              <button
                className="pixel-btn"
                aria-label={`Прибрати крок ${d.title}`}
                onClick={() =>
                  setDrafts((all) => all.filter((_, j) => j !== i))
                }
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <p>HP боса: {totalHp}</p>

      <div className="flex gap-3">
        <button
          className="pixel-btn"
          disabled={!bossTitle.trim() || drafts.length === 0}
          onClick={submit}
        >
          Створити боса
        </button>
        <button className="pixel-btn" onClick={close}>
          Скасувати
        </button>
      </div>
    </section>
  );
}
