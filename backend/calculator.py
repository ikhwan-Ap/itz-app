"""TE Sniper Calculator — drills DB + fixed simulator.

BUG FIXES vs original HTML version:
1. Priority bug: at every step we respect the goal cap of **ALL** targets (not only
   active-priority ones). This prevents overspending on an already-satisfied
   higher-priority target while working on a lower-priority target, which was
   producing "jomplang/tumpang tindih" results.
2. Within a priority we pick drills that touch MORE distinct unfinished active
   targets first (balances hits when multiple targets share the same priority).
3. Single-drill mode: accept `drill_filter` so user can run only one drill.
4. Per-drill per-step detail history is returned so the UI can show what rises.
"""

from copy import deepcopy
from typing import List, Dict, Optional

DRILLS_DB = [
    {"name": "Serangan Balik Cepat", "cost": 3.75, "attrs": ["Umpan", "Kreativitas", "Penyelesaian", "UmpanSilang"]},
    {"name": "Beralih Sisi Cepat", "cost": 2.25, "attrs": ["Umpan", "Kreativitas", "Penempatan", "UmpanSilang", "Kecepatan"]},
    {"name": "Oper, Lari, Tembak", "cost": 1.5, "attrs": ["Umpan", "Tembakan", "Kecepatan"]},
    {"name": "Permainan Sayap", "cost": 3.0, "attrs": ["Tembakan", "Sundulan", "Penyelesaian", "UmpanSilang"]},
    {"name": "Umpan Sebelum Tembak", "cost": 3.0, "attrs": ["Penempatan", "Umpan", "Penyelesaian", "Kreativitas"]},
    {"name": "Teknik Menembak", "cost": 2.25, "attrs": ["Kekuatan", "Tembakan", "Penyelesaian"]},
    {"name": "Penyelesaian 1 on 1", "cost": 1.5, "attrs": ["Dribel", "Penyelesaian", "Tekel"]},
    {"name": "Umpan Bola Mati", "cost": 2.25, "attrs": ["Penjagaan", "Tembakan", "Sundulan", "UmpanSilang"]},
    {"name": "Kontrol Bola", "cost": 0.75, "attrs": ["Sundulan", "Dribel", "Kreativitas"]},
    {"name": "Carioca Bertangga", "cost": 1.5, "attrs": ["Agresivitas", "Kecepatan"]},
    {"name": "Gunakan Kepala", "cost": 1.5, "attrs": ["Sundulan", "Kreativitas", "Penempatan", "Umpan"]},
    {"name": "Lari Halang Rintang", "cost": 3.0, "attrs": ["Agresivitas", "Keberanian", "Kecepatan"]},
    {"name": "Lari Bolak Balik", "cost": 3.0, "attrs": ["Kekuatan", "Keberanian", "Kecepatan"]},
    {"name": "Analisis Video", "cost": 0.75, "attrs": ["Kreativitas", "Keberanian", "Penempatan"]},
    {"name": "Antisipasi Bola Atas", "cost": 2.25, "attrs": ["Penjagaan", "Sundulan", "Keberanian", "UmpanSilang"]},
    {"name": "Permainan Kontak", "cost": 2.25, "attrs": ["Kekuatan", "Penjagaan", "Agresivitas", "Keberanian", "Dribel"]},
    {"name": "Pertahanan Segaris", "cost": 2.25, "attrs": ["Penempatan", "Penjagaan"]},
    {"name": "Hentikan Penyerangan", "cost": 2.25, "attrs": ["Kekuatan", "Penjagaan", "Keberanian", "Dribel", "Tekel"]},
    {"name": "Latihan Pressing", "cost": 3.0, "attrs": ["Penjagaan", "Keberanian", "Penempatan", "Agresivitas", "Tekel"]},
    {"name": "Giring Bola Zig Zag", "cost": 2.25, "attrs": ["Dribel", "Kebugaran", "Umpan", "Kecepatan"]},
    {"name": "Sprint", "cost": 3.75, "attrs": ["Dribel", "Kebugaran", "Kecepatan"]},
    {"name": "Drill Sentuhan Pertama", "cost": 1.5, "attrs": ["Dribel", "Kebugaran", "Umpan"]},
    {"name": "Lari Jauh", "cost": 2.25, "attrs": ["Kebugaran", "Kecepatan"]},
    {"name": "Bertahan Dijalur", "cost": 2.25, "attrs": ["Kebugaran", "Kecepatan", "Penempatan"]},
    {"name": "Peregangan", "cost": 1.5, "attrs": ["Kebugaran", "Kekuatan", "Kecepatan"]},
    {"name": "Kucing - Kucingan", "cost": 1.5, "attrs": ["Kebugaran", "Umpan", "Penempatan", "Agresivitas", "Tekel"]},
    {"name": "Pemanasan", "cost": 0.75, "attrs": ["Sundulan", "Kebugaran", "Agresivitas"]},
    {"name": "Kebugaran", "cost": 3.75, "attrs": ["Kebugaran", "Kekuatan"]},
]

for d in DRILLS_DB:
    d["size"] = len(d["attrs"])

ROLES_DB = {
    "MC":       ["Umpan", "Dribel", "Tekel", "Penjagaan", "Kreativitas", "Kebugaran", "Penempatan", "Keberanian", "Kecepatan", "Tembakan"],
    "AMC":      ["Umpan", "Dribel", "Tembakan", "Penyelesaian", "Sundulan", "Kreativitas", "Kecepatan", "Kebugaran"],
    "ST":       ["Penyelesaian", "Tembakan", "Sundulan", "Kekuatan", "Kecepatan", "Dribel", "Penempatan", "Umpan", "Kreativitas"],
    "DL/DR":    ["Tekel", "Penjagaan", "Penempatan", "Kecepatan", "Kebugaran", "Keberanian", "UmpanSilang", "Agresivitas"],
    "DC":       ["Sundulan", "Penjagaan", "Tekel", "Penempatan", "Kekuatan", "Keberanian", "Kebugaran", "Agresivitas"],
    "DMC":      ["Penempatan", "Tekel", "Penjagaan", "Umpan", "Sundulan", "Kekuatan", "Kebugaran", "Keberanian", "Agresivitas", "Kreativitas"],
    "AML/AMR":  ["Kecepatan", "Dribel", "Umpan", "Tembakan", "Penyelesaian", "Kreativitas", "Kebugaran", "UmpanSilang"],
    "MR/ML":    ["Umpan", "Dribel", "UmpanSilang", "Kreativitas", "Kebugaran", "Kecepatan", "Penempatan"],
}

ATTR_GROUPS = {
    "def": ["Tekel", "Penjagaan", "Penempatan", "Sundulan", "Keberanian"],
    "att": ["Umpan", "Dribel", "UmpanSilang", "Tembakan", "Penyelesaian"],
    "phy": ["Kebugaran", "Kekuatan", "Agresivitas", "Kecepatan", "Kreativitas"],
}
ALL_ATTRS = ATTR_GROUPS["def"] + ATTR_GROUPS["att"] + ATTR_GROUPS["phy"]


def simulate_sniper(
    init_stats: Dict[str, int],
    white_set: set,
    targets: List[Dict],  # [{name, goal, prio}]
    grey_limit: int,
    drill_filter: Optional[List[str]] = None,  # names of drills to restrict to
) -> Dict:
    stats = deepcopy(init_stats)
    # ensure defaults
    for a in ALL_ATTRS:
        stats.setdefault(a, 1)

    history = []
    total_cost = 0.0

    # Fast lookups for target goals by name (all priorities)
    goal_by_name = {t["name"]: t["goal"] for t in targets}

    if not targets:
        return {"history": history, "stats": stats, "totalCost": total_cost}

    priorities = sorted(set(t["prio"] for t in targets))

    # Drill pool (filtered if single-drill mode)
    if drill_filter:
        drills_pool = [d for d in DRILLS_DB if d["name"] in drill_filter]
    else:
        drills_pool = DRILLS_DB

    for current_prio in priorities:
        active_targets = [t for t in targets if t["prio"] == current_prio]

        # Candidate drills for this priority
        candidates = []
        for drill in drills_pool:
            # Count hits against *active-priority* unfinished targets
            unfinished_active_hits = 0
            total_hits_active = 0
            dark_count = 0
            for da in drill["attrs"]:
                t = next((x for x in active_targets if x["name"] == da), None)
                if t is not None:
                    total_hits_active += 1
                    if stats.get(da, 1) < t["goal"]:
                        unfinished_active_hits += 1
                if da not in white_set:
                    dark_count += 1
            if total_hits_active > 0:
                candidates.append({
                    "drill": drill,
                    "size": drill["size"],
                    "dark_count": dark_count,
                    "unfinished_hits": unfinished_active_hits,
                    "total_hits": total_hits_active,
                })

        # Sorting:
        # 1. MORE unfinished active hits first (balances multi-target priority)
        # 2. Smaller size (hemat cost)
        # 3. Fewer dark attrs (hemat limit)
        # 4. More total hits to active targets
        candidates.sort(key=lambda c: (-c["unfinished_hits"], c["size"], c["dark_count"], -c["total_hits"]))

        for cand in candidates:
            drill = cand["drill"]
            while True:
                # A. 180% avg cap
                avg = sum(stats.get(a, 1) for a in drill["attrs"]) / len(drill["attrs"])
                if avg >= 180:
                    break

                # B. Grey limit cap for dark attrs in this drill
                blocked = False
                room_grey = 10**6
                for da in drill["attrs"]:
                    if da not in white_set:
                        r = grey_limit - stats.get(da, 1)
                        if r < room_grey:
                            room_grey = r
                        if r <= 0:
                            blocked = True
                if blocked:
                    break

                # C. Goal cap — respect goals of ALL targets touching this drill,
                #    not only the active-priority ones. This is the bug-1 fix.
                room_goal = 10**6
                any_active_unfinished = False
                for da in drill["attrs"]:
                    if da in goal_by_name:
                        left = goal_by_name[da] - stats.get(da, 1)
                        if left < room_goal:
                            room_goal = left
                # check whether any *active* target is unfinished
                for at in active_targets:
                    if stats.get(at["name"], 1) < at["goal"]:
                        any_active_unfinished = True
                        break
                if not any_active_unfinished:
                    break
                if room_goal <= 0:
                    break

                # D. step = min(roomAvg, roomGrey, roomGoal)
                room_avg = 180 - avg
                step = min(room_avg, room_grey, room_goal)

                if step >= 1:
                    step = int(step)
                else:
                    # micro step: allow +1 only if all rooms allow ≥1
                    if room_grey >= 1 and room_avg >= 1 and room_goal >= 1:
                        step = 1
                    else:
                        step = 0

                if step <= 0:
                    break

                # Apply step
                changes = {}
                for da in drill["attrs"]:
                    stats[da] = stats.get(da, 1) + step
                    changes[da] = step
                total_cost += drill["cost"] * step * 0.8

                new_avg = sum(stats.get(a, 1) for a in drill["attrs"]) / len(drill["attrs"])
                # Merge into previous history if same drill
                if history and history[-1]["drill"] == drill["name"]:
                    last = history[-1]
                    last["gain"] += step
                    last["endAvg"] = round(new_avg)
                    # append a per-step detail
                    last["steps"].append({
                        "step": step,
                        "endAvg": round(new_avg),
                        "changes": changes,
                        "snapshot": {a: stats.get(a, 1) for a in drill["attrs"]},
                    })
                    for k, v in changes.items():
                        last["changes"][k] = last["changes"].get(k, 0) + v
                else:
                    history.append({
                        "drill": drill["name"],
                        "gain": step,
                        "startAvg": round(avg),
                        "endAvg": round(new_avg),
                        "changes": dict(changes),
                        "prioLevel": current_prio,
                        "size": drill["size"],
                        "steps": [{
                            "step": step,
                            "endAvg": round(new_avg),
                            "changes": changes,
                            "snapshot": {a: stats.get(a, 1) for a in drill["attrs"]},
                        }],
                    })

    return {"history": history, "stats": stats, "totalCost": round(total_cost, 2)}
