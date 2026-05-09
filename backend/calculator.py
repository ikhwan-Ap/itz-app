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
    {"name": "Serangan Balik Cepat", "cost": 3.75, "attrs": ["Umpan", "Kreativitas", "Penyelesaian", "UmpanSilang", "Komunikasi"]},
    {"name": "Beralih Sisi Cepat", "cost": 2.25, "attrs": ["Umpan", "Kreativitas", "Penempatan", "UmpanSilang", "Kecepatan", "Komunikasi"]},
    {"name": "Oper, Lari, Tembak", "cost": 1.5, "attrs": ["Umpan", "Tembakan", "Kecepatan", "Antisipasi"]},
    {"name": "Permainan Sayap", "cost": 3.0, "attrs": ["Tembakan", "Sundulan", "Penyelesaian", "UmpanSilang", "Tinjuan"]},
    {"name": "Umpan Sebelum Tembak", "cost": 3.0, "attrs": ["Penempatan", "Umpan", "Penyelesaian", "Kreativitas", "Antisipasi"]},
    {"name": "Teknik Menembak", "cost": 2.25, "attrs": ["Kekuatan", "Tembakan", "Penyelesaian", "Refleks", "Kelincahan"]},
    {"name": "Penyelesaian 1 on 1", "cost": 1.5, "attrs": ["Dribel", "Penyelesaian", "Tekel", "Antisipasi", "KeluarSarang"]},
    {"name": "Umpan Bola Mati", "cost": 2.25, "attrs": ["Penjagaan", "Tembakan", "Sundulan", "UmpanSilang", "KeluarSarang"]},
    {"name": "Kontrol Bola", "cost": 0.75, "attrs": ["Sundulan", "Dribel", "Kreativitas", "Konsentrasi"]},
    {"name": "Carioca Bertangga", "cost": 1.5, "attrs": ["Agresivitas", "Kecepatan", "Kelincahan", "Konsentrasi"]},
    {"name": "Gunakan Kepala", "cost": 1.5, "attrs": ["Sundulan", "Kreativitas", "Penempatan", "Umpan"]},
    {"name": "Lari Halang Rintang", "cost": 3.0, "attrs": ["Agresivitas", "Keberanian", "Kecepatan", "Sepakan"]},
    {"name": "Lari Bolak Balik", "cost": 3.0, "attrs": ["Kekuatan", "Keberanian", "Kecepatan", "Kelincahan"]},
    {"name": "Analisis Video", "cost": 0.75, "attrs": ["Kreativitas", "Keberanian", "Penempatan", "Komunikasi"]},
    {"name": "Antisipasi Bola Atas", "cost": 2.25, "attrs": ["Penjagaan", "Sundulan", "Keberanian", "UmpanSilang", "JangkauanUdara"]},
    {"name": "Permainan Kontak", "cost": 2.25, "attrs": ["Kekuatan", "Penjagaan", "Agresivitas", "Keberanian", "Dribel"]},
    {"name": "Pertahanan Segaris", "cost": 2.25, "attrs": ["Penempatan", "Penjagaan", "Komunikasi", "Konsentrasi"]},
    {"name": "Hentikan Penyerangan", "cost": 2.25, "attrs": ["Kekuatan", "Penjagaan", "Keberanian", "Dribel", "Tekel"]},
    {"name": "Latihan Pressing", "cost": 3.0, "attrs": ["Penjagaan", "Keberanian", "Penempatan", "Agresivitas", "Tekel"]},
    {"name": "Giring Bola Zig Zag", "cost": 2.25, "attrs": ["Dribel", "Kebugaran", "Umpan", "Kecepatan"]},
    {"name": "Sprint", "cost": 3.75, "attrs": ["Dribel", "Kebugaran", "Kecepatan", "KeluarSarang"]},
    {"name": "Drill Sentuhan Pertama", "cost": 1.5, "attrs": ["Dribel", "Kebugaran", "Umpan", "Lemparan"]},
    {"name": "Lari Jauh", "cost": 2.25, "attrs": ["Kebugaran", "Kecepatan", "Konsentrasi"]},
    {"name": "Bertahan Dijalur", "cost": 2.25, "attrs": ["Kebugaran", "Kecepatan", "Penempatan", "JangkauanUdara"]},
    {"name": "Peregangan", "cost": 1.5, "attrs": ["Kebugaran", "Kekuatan", "Kecepatan", "Kelincahan"]},
    {"name": "Kucing - Kucingan", "cost": 1.5, "attrs": ["Kebugaran", "Umpan", "Penempatan", "Agresivitas", "Tekel"]},
    {"name": "Pemanasan", "cost": 0.75, "attrs": ["Sundulan", "Kebugaran", "Agresivitas", "Refleks"]},
    {"name": "Kebugaran", "cost": 3.75, "attrs": ["Kebugaran", "Kekuatan", "Sepakan", "Lemparan"]},
    {"name": "Latihan Kiper", "cost": 3.0, "attrs": ["Refleks", "JangkauanUdara", "Kelincahan", "Lemparan", "Sepakan"]},
]

for d in DRILLS_DB:
    d["size"] = len(d["attrs"])

ATTR_CAP = 340  # Top Eleven hard cap per attribute (base, before jenjang bonus)

ROLES_DB = {
    "MC":       ["Umpan", "Dribel", "Tekel", "Penjagaan", "Kreativitas", "Kebugaran", "Penempatan", "Keberanian", "Kecepatan", "Tembakan"],
    "AMC":      ["Umpan", "Dribel", "Tembakan", "Penyelesaian", "Sundulan", "Kreativitas", "Kecepatan", "Kebugaran"],
    "ST":       ["Penyelesaian", "Tembakan", "Sundulan", "Kekuatan", "Kecepatan", "Dribel", "Penempatan", "Umpan", "Kreativitas"],
    "DL/DR":    ["Tekel", "Penjagaan", "Penempatan", "Kecepatan", "Kebugaran", "Keberanian", "UmpanSilang", "Agresivitas"],
    "DC":       ["Sundulan", "Penjagaan", "Tekel", "Penempatan", "Kekuatan", "Keberanian", "Kebugaran", "Agresivitas"],
    "DMC":      ["Penempatan", "Tekel", "Penjagaan", "Umpan", "Sundulan", "Kekuatan", "Kebugaran", "Keberanian", "Agresivitas", "Kreativitas"],
    "AML/AMR":  ["Kecepatan", "Dribel", "Umpan", "Tembakan", "Penyelesaian", "Kreativitas", "Kebugaran", "UmpanSilang"],
    "MR/ML":    ["Umpan", "Dribel", "UmpanSilang", "Kreativitas", "Kebugaran", "Kecepatan", "Penempatan"],
    "GK":       ["Refleks", "Antisipasi", "Konsentrasi", "KeluarSarang", "Komunikasi",
                 "JangkauanUdara", "Tinjuan", "Lemparan", "Sepakan", "Kelincahan", "Kebugaran"],
}

ATTR_GROUPS = {
    "def": ["Tekel", "Penjagaan", "Penempatan", "Sundulan", "Keberanian"],
    "att": ["Umpan", "Dribel", "UmpanSilang", "Tembakan", "Penyelesaian"],
    "phy": ["Kebugaran", "Kekuatan", "Agresivitas", "Kecepatan", "Kreativitas"],
}
FIELD_ALL_ATTRS = ATTR_GROUPS["def"] + ATTR_GROUPS["att"] + ATTR_GROUPS["phy"]

GK_ATTR_GROUPS = {
    "gk1": ["Refleks", "Antisipasi", "Konsentrasi", "KeluarSarang", "Komunikasi"],
    "gk2": ["JangkauanUdara", "Tinjuan", "Lemparan", "Sepakan", "Kelincahan"],
    "phy": ["Kebugaran", "Kekuatan", "Agresivitas", "Kecepatan", "Kreativitas"],
}
GK_ALL_ATTRS = GK_ATTR_GROUPS["gk1"] + GK_ATTR_GROUPS["gk2"] + GK_ATTR_GROUPS["phy"]

# Superset for default initialization in simulate_sniper
_GK_SPECIFIC = ["Refleks", "Antisipasi", "Konsentrasi", "KeluarSarang", "Komunikasi",
                "JangkauanUdara", "Tinjuan", "Lemparan", "Sepakan", "Kelincahan"]
ALL_ATTRS = FIELD_ALL_ATTRS + _GK_SPECIFIC


def simulate_sniper(
    init_stats: Dict[str, int],
    white_set: set,
    targets: List[Dict],  # [{name, goal, prio}]
    grey_limit: int,
    drill_filter: Optional[List[str]] = None,  # names of drills to restrict to
    white_multiplier: int = 1,  # per-session gain multiplier for white attrs vs grey attrs
    valid_attrs: Optional[set] = None,  # if set, only these attrs are counted per drill (GK mode)
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
            # Effective attrs: filter to valid_attrs when in GK mode
            eff_attrs = [a for a in drill["attrs"] if valid_attrs is None or a in valid_attrs]
            if not eff_attrs:
                continue

            # Count hits against *active-priority* unfinished targets
            unfinished_active_hits = 0
            total_hits_active = 0
            dark_count = 0
            for da in eff_attrs:
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
                    "eff_attrs": eff_attrs,
                    "size": len(eff_attrs),
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
                attr_list = cand["eff_attrs"]  # only valid attrs for this drill
                total_count = len(attr_list)
                grey_drill_attrs = [a for a in attr_list if a not in white_set]
                white_drill_attrs = [a for a in attr_list if a in white_set]

                # A. 180% avg cap — effective gain per session accounts for multiplier:
                #    new_sum = sum + sessions*(grey_count + white_count*multiplier)
                #    sessions <= (180*total - sum) / (grey_count + white_count*multiplier)
                current_sum = sum(stats.get(a, 1) for a in attr_list)
                avg = current_sum / total_count
                if avg >= 180:
                    break

                effective_per_session = len(grey_drill_attrs) + len(white_drill_attrs) * white_multiplier
                if effective_per_session == 0:
                    break
                room_avg = (180 * total_count - current_sum) / effective_per_session

                # B. Grey limit cap — sessions limited by remaining room in grey attrs
                blocked = False
                room_grey = 10**6
                for da in grey_drill_attrs:
                    r = grey_limit - stats.get(da, 1)
                    if r < room_grey:
                        room_grey = r
                    if r <= 0:
                        blocked = True
                if blocked:
                    break

                # C. Goal + ATTR_CAP cap
                # White attrs: capped at min(explicit_goal, ATTR_CAP=340); grey attrs: explicit goal only
                room_goal = 10**6
                any_active_unfinished = False
                for da in attr_list:
                    val = stats.get(da, 1)
                    if da in white_set:
                        effective_cap = min(goal_by_name.get(da, ATTR_CAP), ATTR_CAP)
                        left = (effective_cap - val) / white_multiplier
                    elif da in goal_by_name:
                        left = goal_by_name[da] - val
                    else:
                        continue
                    if left < room_goal:
                        room_goal = left
                for at in active_targets:
                    if stats.get(at["name"], 1) < at["goal"]:
                        any_active_unfinished = True
                        break
                if not any_active_unfinished:
                    break
                if room_goal <= 0:
                    break

                # D. sessions = min of all room constraints
                step = min(room_avg, room_grey, room_goal)

                if step >= 1:
                    step = int(step)
                else:
                    # micro step: allow +1 session only if all rooms allow it
                    if room_grey >= 1 and room_avg >= 1 and room_goal >= 1:
                        step = 1
                    else:
                        step = 0

                if step <= 0:
                    break

                # Apply: grey attrs gain +step, white attrs gain +(step * white_multiplier)
                changes = {}
                for da in attr_list:
                    gain = step * white_multiplier if da in white_set else step
                    stats[da] = stats.get(da, 1) + gain
                    changes[da] = gain
                total_cost += drill["cost"] * step * 0.8

                new_avg = sum(stats.get(a, 1) for a in attr_list) / total_count
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
                        "snapshot": {a: stats.get(a, 1) for a in attr_list},
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
                        "size": len(attr_list),
                        "steps": [{
                            "step": step,
                            "endAvg": round(new_avg),
                            "changes": changes,
                            "snapshot": {a: stats.get(a, 1) for a in attr_list},
                        }],
                    })

    return {"history": history, "stats": stats, "totalCost": round(total_cost, 2)}
