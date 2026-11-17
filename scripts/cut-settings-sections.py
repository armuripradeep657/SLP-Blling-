"""Cut the staff/sync/discount sections out of SettingsView (admin-only refactor).

Removes:
  - DiscountLimitsSection (+ banner)      — staff-only feature
  - StaffSection + SyncSecuritySection (+ banners) — staff & vault-sync UI
  - their <Section /> + <Separator /> usages in the SettingsView JSX
  - their now-dead imports (staff API fns, StaffRow, @/lib/sync)
Keeps every other section untouched.
"""
import re

PATH = 'src/components/SettingsView.tsx'
lines = open(PATH).read().split('\n')


def find_line(pred, start=0):
    for i in range(start, len(lines)):
        if pred(lines[i]):
            return i
    raise SystemExit(f'marker not found after line {start}')


def banner_start(fn_line):
    """Walk up over the contiguous comment banner directly above fn_line."""
    i = fn_line
    while i > 0 and (lines[i - 1].strip().startswith('/*') or lines[i - 1].strip().startswith('*') or lines[i - 1].strip().endswith('*/')):
        i -= 1
    return i


# ---- function-body cuts -------------------------------------------------
fdl = find_line(lambda l: l.startswith('function DiscountLimitsSection'))
fap = find_line(lambda l: l.startswith('function AppearanceSection'))
fst = find_line(lambda l: l.startswith('function StaffSection'))
fbk = find_line(lambda l: l.startswith('function BackupSection'))

cut1 = (banner_start(fdl), banner_start(fap))          # discount section
cut2 = (banner_start(fst), banner_start(fbk))          # staff + sync sections
assert cut1[0] < cut1[1] < cut2[0] < cut2[1], (cut1, cut2)

# apply the later cut first so indices stay valid
del lines[cut2[0]:cut2[1]]
del lines[cut1[0]:cut1[1]]

# ---- JSX usage cuts -----------------------------------------------------
def drop_block(marker, count=2):
    """Drop <marker /> plus the <Separator /> line that follows it."""
    i = find_line(lambda l: marker in l)
    assert lines[i + 1].strip() == '', lines[i + 1]
    assert 'Separator' in lines[i + 2], lines[i + 2]
    del lines[i:i + 3]

drop_block('<DiscountLimitsSection />')
drop_block('<StaffSection />')
drop_block('<SyncSecuritySection />')

# ---- import cuts --------------------------------------------------------
src = '\n'.join(lines)
src = src.replace("  apiConfigGet,\n", "")
for fn in ('apiStaffCreate', 'apiStaffDelete', 'apiStaffList', 'apiStaffUpdate'):
    src = src.replace(f"  {fn},\n", "")
src = src.replace("  type StaffRow,\n", "")
src = re.sub(r"import \{ getSyncStatus, saveConfigToServer, syncNow \} from '@/lib/sync';\n", "", src)
open(PATH, 'w').write(src)

print('cut OK — lines now:', len(src.split('\n')))
