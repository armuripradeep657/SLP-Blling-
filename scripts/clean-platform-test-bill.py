#!/usr/bin/env python3
"""Clean the platform agent's test bill out of the repo DB.

The platform's redeploy session (commit bdc8fb6) left a test bill
SLP-INV-1005 (createdBy Owner via API at 15:32:27Z Nov 22, while the live
server was down — no real bill could exist) in db/custom.db, with the
dateISO COLUMN holding a raw epoch instead of the ISO string the app
writes (payloadJson has the ISO — a non-app writer made this row).

Keep: bill SLP-INV-1004 (real, Nov 19, payload OK, Due 220).
Remove: bill SLP-INV-1005 (test junk) and restore the counter so the next
real bill is SLP-INV-1005 (no number lost).
"""
import sqlite3

DB = "/home/z/my-project/db/custom.db"

con = sqlite3.connect(DB)
con.execute("PRAGMA foreign_keys=ON")
try:
    row = con.execute("SELECT id, payloadJson FROM BizInvoice WHERE no='SLP-INV-1005'").fetchone()
    if row is None:
        print("bill 1005 already absent — nothing to clean")
    else:
        import json
        payload = json.loads(row[1])
        assert payload.get("no") == "SLP-INV-1005", "payload mismatch — aborting"
        # safety: refuse to delete a real bill (real bills have proper ISO
        # in the COLUMN too; this junk row has a raw epoch there)
        col = con.execute("SELECT dateISO FROM BizInvoice WHERE no='SLP-INV-1005'").fetchone()[0]
        if isinstance(col, str) and col.startswith("2026-11-2"):
            raise SystemExit("dateISO column is a proper ISO string — NOT junk, aborting")
        con.execute("DELETE FROM BizInvoice WHERE no='SLP-INV-1005'")
        con.execute("UPDATE AppConfig SET nextBillNo=1005 WHERE slot='owner'")
        con.commit()
        print("removed test bill SLP-INV-1005, counter restored to 1005")
finally:
    ic = con.execute("PRAGMA integrity_check").fetchone()[0]
    counts = {
        "bills": con.execute("SELECT COUNT(*) FROM BizInvoice").fetchone()[0],
        "tombstones": con.execute("SELECT COUNT(*) FROM DeletedBill").fetchone()[0],
        "products": con.execute("SELECT COUNT(*) FROM BizProduct").fetchone()[0],
        "counter": con.execute("SELECT nextBillNo FROM AppConfig WHERE slot='owner'").fetchone()[0],
    }
    con.close()
print("integrity:", ic, "| counts:", counts)
