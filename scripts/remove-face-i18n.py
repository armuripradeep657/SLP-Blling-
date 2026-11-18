#!/usr/bin/env python3
"""Remove all face-unlock i18n keys (EN + TE) from src/lib/i18n.ts."""
import re

PATH = '/home/z/my-project/src/lib/i18n.ts'
FACE_KEYS = [
    'face.title', 'face.hint', 'face.scanning', 'face.matched', 'face.denied',
    'face.tryBtn', 'face.errNoMatch', 'face.errNoSession', 'face.errExpired',
    'face.errCamera', 'face.errPerm',
    'settings.faceUnlock', 'settings.faceUnlockDesc', 'settings.faceEnroll',
    'settings.faceStarting', 'settings.faceModel', 'settings.faceCapturing',
    'settings.faceDone', 'settings.faceEnrolled', 'settings.faceDisable',
    'settings.faceRemoved',
]
KEY_RE = re.compile(r"^\s*'(" + '|'.join(re.escape(k) for k in FACE_KEYS) + r")':")

with open(PATH, encoding='utf-8') as f:
    lines = f.readlines()

out, removed = [], []
for ln in lines:
    m = KEY_RE.match(ln)
    if m:
        removed.append(ln.strip()[:60])
        continue
    out.append(ln)

with open(PATH, 'w', encoding='utf-8') as f:
    f.writelines(out)

print(f"removed {len(removed)} lines")
for r in removed:
    print(' ', r)
# safety: nothing face-related may remain
left = [l for l in out if re.search(r"'face\.|'settings\.face", l)]
print("remaining face keys:", len(left))
