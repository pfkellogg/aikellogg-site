#!/usr/bin/env python3
"""squeeze_mellotron.py: a Mellotron sound (35 eight-second tape strips, one per key) squeezed into one FM-1 user
sample slot (SLOOP / Felucca: 80 KiB of IMA ADPCM at 22050 Hz, up to 16 zones, about 7 s in all).

Up to 16 keys are kept, spread across the range; each keeps its attack, then a loop of its steady part (crossfaded
so the jump back is smooth), then a short tail. The zones loop while the key is held and play the tail when it's let
go (SLOOP 2.7+: looped = 2). All zones share one gain, so the strips' level slope stays. SLOOP's own encoder
(tools/sampleio.py, GPL-3.0, by Leo Kuroshita) does the ADPCM; this file only picks and shapes the audio.

  squeeze_mellotron.py build STRIPS_DIR NAME OUT_PREFIX [--zones 12]   (writes OUT.hdr, OUT.bin, OUT-preview.wav)
  squeeze_mellotron.py load SLOT STRIPS_DIR NAME [--zones 12]          (and sends it to the FM-1 over USB)
"""
import argparse, struct, sys, zlib, time
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import resample_poly

SLOOP_TOOLS = Path("/private/tmp/claude-502/-Users-luisramirez/4ba09697-4dd0-45b7-b529-d40ca3f61efa/scratchpad/sloopsrc/tools")
sys.path.insert(0, str(SLOOP_TOOLS))
import sampleio as sio  # noqa: E402

RATE = sio.SLOT_RATE
ATTACK_S, TAIL_S, XFADE_S = 0.26, 0.07, 0.035      # kept before the loop; after it; the loop's crossfade
LOOPED_HELD = 2                                     # loops while held, then plays on to the end (the tail)


def strip(dirpath, midi):
    x, sr = sf.read(str(Path(dirpath) / f"{midi:03d}.flac"), dtype="float64")
    if x.ndim > 1:
        x = x.mean(axis=1)
    g = np.gcd(int(sr), RATE)
    return resample_poly(x, RATE // g, int(sr) // g)


def zone(x, midi, n):
    """n samples: the attack, a loop [ls, le] of whole pitch periods, crossfaded into what comes before ls, a tail."""
    tail = int(TAIL_S * RATE)
    ls = int(ATTACK_S * RATE)
    period = RATE / (440.0 * 2 ** ((midi - 69) / 12))
    room = n - tail - ls
    k = max(1, int(room // period))
    le = ls + int(round(k * period)) - 1
    y = x[: le + 1 + tail].copy()
    X = min(int(XFADE_S * RATE), ls - 1, le - ls)
    for i in range(X):                               # so y[le] flows into y[ls] as y[ls - 1] did
        a = (i + 1) / X
        y[le - X + 1 + i] = (1 - a) * y[le - X + 1 + i] + a * y[ls - X + i]
    t = np.arange(tail)
    y[le + 1:] *= np.cos(t / tail * np.pi / 2) ** 2   # the tail fades out
    return y, ls, le


def build(dirpath, name, zones=12):
    have = sorted(int(p.stem) for p in Path(dirpath).glob("*.flac"))
    roots = [have[round(i * (len(have) - 1) / (zones - 1))] for i in range(zones)]
    budget = int(sio.SLOT_MAX_DATA * 2 * 0.985) // zones // 2 * 2       # samples per zone (4 bits each)
    made = [(m, *zone(strip(dirpath, m), m, budget)) for m in roots]
    pk = max(np.abs(y).max() for _, y, _, _ in made)
    zs, data, preview = [], bytearray(), []
    for m, y, ls, le in made:
        s = [int(v) for v in np.clip(np.round(y / pk * 30000), -32768, 32767)]
        adp, (pred, idx) = sio.ima_encode(s, ls)
        zs.append(dict(off=len(data), n=len(s), ls=ls, le=le, root=m, pred=pred, idx=idx))
        data += adp
        preview.append((m, np.array(s) / 32768.0, ls, le))
    if len(data) > sio.SLOT_MAX_DATA:
        raise ValueError(f"too long: {len(data)} > {sio.SLOT_MAX_DATA}")
    splits = sio.key_split([z["root"] for z in zs])
    rate = int(round(RATE / 44100 * 65536))
    zb = b"".join(struct.pack("<5I2h4B", z["off"], z["n"], z["ls"], z["le"], rate, z["root"] * 16, z["pred"], z["idx"],
                              lo, hi, LOOPED_HELD) for z, (lo, hi) in zip(zs, splits))
    nm = name.upper()[:8].encode().ljust(8, b"\0")
    hdr = struct.pack("<IHBB8sII8x", 0x504D5346, 1, len(zs), 0, nm, len(data), zlib.crc32(bytes(data))) + zb
    return hdr.ljust(sio.SLOT_HDR_LEN, b"\0"), bytes(data), preview


def upload(slot, hdr, data):
    import fm1_sample_upload as up
    link = up.Link()
    if link.req(11, [slot])[1]:
        sys.exit("begin failed")
    t0 = time.time()
    for off in range(0, len(data), 256):
        a = sio.SLOT_DATA_OFF + off
        r = link.req(12, [slot, a & 0x7F, (a >> 7) & 0x7F, (a >> 14) & 0x7F] + up.pack7(data[off:off + 256]))
        if r[4]:
            sys.exit(f"write at {a:#x} failed ({r[4]})")
    r = link.req(13, [slot] + up.pack7(hdr), 5)
    print(f"USR{slot + 1}: {len(data)} B in {time.time() - t0:.1f} s,", "ok" if r[1] == 0 else f"FAILED ({r[1]}, {up.RC.get(r[1], '?')})")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["build", "load"])
    ap.add_argument("args", nargs="+")
    ap.add_argument("--zones", type=int, default=12)
    a = ap.parse_args()
    if a.cmd == "build":
        d, name, out = a.args
    else:
        slot, d, name = a.args
    hdr, data, preview = build(d, name, a.zones)
    print(f"{name}: {hdr[6]} zones, {len(data)} of {sio.SLOT_MAX_DATA} B; per zone {preview[0][1].size / RATE:.2f} s, "
          f"loop {(preview[0][3] - preview[0][2]) / RATE:.2f} s")
    if a.cmd == "build":
        Path(out + ".hdr").write_bytes(hdr)
        Path(out + ".bin").write_bytes(data)
    else:
        upload(int(slot) - 1, hdr, data)
