# Bracket Advancement Reference

The `bracket_advancement` table encodes the NCAA tournament bracket as a binary tree with **63 slots** (1–63). The sync service uses it to advance winners: when a game at `from_slot` finishes, the winner moves to `to_slot`.

## Core Formula

```
to_slot = floor(from_slot / 2)
```

All 62 rows follow this formula. The table stores it explicitly so the sync service never computes it.

---

## Slot Index

| Round | Name             | Slots  | Games |
|-------|------------------|--------|-------|
| 6     | Championship     | 1      | 1     |
| 5     | Final Four       | 2–3    | 2     |
| 4     | Elite Eight      | 4–7    | 4     |
| 3     | Sweet Sixteen    | 8–15   | 8     |
| 2     | Round of 32      | 16–31  | 16    |
| 1     | Round of 64      | 32–63  | 32    |
|       | **Total**        |        | **63** |

Slots **1–3** have `region = NULL` (Championship and Final Four are neutral site).
Slots **4–63** each belong to one of four regions, assigned at game-seeding time — not derived from the slot number.

---

## Region Subtrees

The bracket is four identical 15-game subtrees. Two subtrees feed each Final Four game.

| Subtree Root | Slots by Round (E8 → S16 → R32 → R64)    | Feeds Into  |
|--------------|-------------------------------------------|-------------|
| Slot 4       | 4 → 8, 9 → 16–19 → 32–39                | Slot 2 (FF) |
| Slot 5       | 5 → 10, 11 → 20–23 → 40–47              | Slot 2 (FF) |
| Slot 6       | 6 → 12, 13 → 24–27 → 48–55              | Slot 3 (FF) |
| Slot 7       | 7 → 14, 15 → 28–31 → 56–63              | Slot 3 (FF) |

---

## Visual Bracket

### Subtree A — Slot 4 (feeds Final Four Slot 2)

```
R64     R32      S16     E8
[32] ─┐
      ├── [16] ─┐
[33] ─┘         │
                ├── [8] ─┐
[34] ─┐         │        │
      ├── [17] ─┘        │
[35] ─┘                  ├── [4] ──→ Final Four (Slot 2)
[36] ─┐                  │
      ├── [18] ─┐        │
[37] ─┘         │        │
                ├── [9] ─┘
[38] ─┐         │
      ├── [19] ─┘
[39] ─┘
```

### Subtree B — Slot 5 (feeds Final Four Slot 2)

```
R64     R32      S16      E8
[40] ─┐
      ├── [20] ─┐
[41] ─┘         │
                ├── [10] ─┐
[42] ─┐         │         │
      ├── [21] ─┘         │
[43] ─┘                   ├── [5] ──→ Final Four (Slot 2)
[44] ─┐                   │
      ├── [22] ─┐         │
[45] ─┘         │         │
                ├── [11] ─┘
[46] ─┐         │
      ├── [23] ─┘
[47] ─┘
```

### Subtree C — Slot 6 (feeds Final Four Slot 3)

```
R64     R32      S16      E8
[48] ─┐
      ├── [24] ─┐
[49] ─┘         │
                ├── [12] ─┐
[50] ─┐         │         │
      ├── [25] ─┘         │
[51] ─┘                   ├── [6] ──→ Final Four (Slot 3)
[52] ─┐                   │
      ├── [26] ─┐         │
[53] ─┘         │         │
                ├── [13] ─┘
[54] ─┐         │
      ├── [27] ─┘
[55] ─┘
```

### Subtree D — Slot 7 (feeds Final Four Slot 3)

```
R64     R32      S16      E8
[56] ─┐
      ├── [28] ─┐
[57] ─┘         │
                ├── [14] ─┐
[58] ─┐         │         │
      ├── [29] ─┘         │
[59] ─┘                   ├── [7] ──→ Final Four (Slot 3)
[60] ─┐                   │
      ├── [30] ─┐         │
[61] ─┘         │         │
                ├── [15] ─┘
[62] ─┐         │
      ├── [31] ─┘
[63] ─┘
```

### Final Four + Championship

```
Slot 4 winner ─┐
               ├── Slot 2 (FF) ─┐
Slot 5 winner ─┘                │
                                ├── Slot 1 (Championship)
Slot 6 winner ─┐                │
               ├── Slot 3 (FF) ─┘
Slot 7 winner ─┘
```

```
Slot 2 (FF) ─┐                         ┌─ Slot 3 (FF)
             └─ Slot 1 (Championship) ─┘ 
```

## Notes

- **Slot 1 has no entry in `bracket_advancement`** — the Championship winner is the final state; no further advancement exists.
- **`bracket_advancement` is tournament-agnostic** — the 62 rows are seeded once and never modified. The `game` table holds all per-tournament state.
- **Region labels are not derived from slot numbers.** Slots 4–7 each map to one region, but the assignment (e.g., slot 4 = South vs. East) is set on the `game` row at seeding time and can vary by year if the bracket layout changes.
