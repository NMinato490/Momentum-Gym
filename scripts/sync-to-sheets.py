#!/usr/bin/env python

import os
import json
from datetime import datetime

import gspread
import mysql.connector
from oauth2client.service_account import ServiceAccountCredentials

SERVICE_ACCOUNT_JSON = json.loads(r'''{"type":"service_account","project_id":"praxis-dolphin-478603-n4","private_key_id":"d75f4b4af333810f3e3f455d7f7d112268916feb","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2CemnFRjckLjR\nGqYDMjCUoGLQmUyw3J7Qtf0VJ4w5cb+I/wicMm22yhi9M7WXmrVwT5+S1/+oG2R3\nfr2ftaqTdnZ2B6Ykl+leAZsdmwAN8Jbi2u7HCaaN6LVOHovSRBHVHVQxsHl+WTkf\nT4e069IsgOn+dtk33UXQZ7dlnor9OXwXw07kGSxHqxSoak98xMPvIjzY4JP7/3yq\nKbCV8eiUW66/QyshOkTyg0GjFzBja4KmqM5uEPliRzemmCFlI+AorTN8BRF269Fh\nK1A3LSrupFtCVZTAAOSrZ40UTD5kZDFqyN0y+KwpaHxV0+A+4mtbfEAE8lCQMZ/A\n+j+IRxQfAgMBAAECggEAG+FxyVbYW3PI8rHPql6mBSV5bPSFw/LOWi39aJ+JgQTU\nbpGNCotItX3HgzbnwaP+1QhE6vMtI1yqqwic11i2GubCZvpt7l3b7rt1O/gQ7pGi\nMnWQq6hlO4fgOOpBxP8K8iaPThr2yKy2rH58TO/vXUSTUhd21nEL78rq0mQRao4A\nhyxYhPMFGVw7Bb6+mA4MAX7o9r2oflDbXTc2PctA1XBmSJqj4juSFqwr2NtbmgVR\nNS/g3TrtI9Iq749HDTGu2teS1zS1y9bEtytehSlX3iDZq8U4NlvnqAxEX/wG9dEY\nHjkH4t0QEK4Y1sdD7Rouzco1Z+EfNR9gnR8sEFPIuQKBgQDpuBBZpCAoGUYjJqU1\nGogZiWK8M1Y2nX97zY8p8RmeXy2vN9VtPyGzMXFjiZp3hNok7oUKCN/r1w3Ek/Pt\npx17eJLmzin5P9atiVnv0DwCX34KElIksrSYSFYRl578pZr+ZC1iAZYcxqUNJ9fF\nwWtnHAPYUOY3GlVu7DAh8t0zVwKBgQDHZJYbkArrTgYo0FEJba9RpCWIo27qgsvp\nmZODat+lBhr94kbzLYN2chA8G5/Ud90lfq0bWYDSM58xTdTjGSVkgjwm4yVZuMvN\nA9lXg1g4ho/YtvJwgk8dwONVjj0xK+EjBsg2jPWvDlcAhPb4zV4GU8V/8WW08QS8\nlRXIQkKweQKBgAsffm+1tu4RndvoZ+5qD9YfSrqoOs8ombubodeeKNj3sKXpI1gq\nrADqNnpFPzu27+bYDy7WE0oXFwmm/PHvhSCuMVeYsjixiBcENWqLX3/Baa8zBgPH\nGX8x2h7GN4PQodq/i8VhS/KcpZhFsCgyN1lV5PzzhLFUqII57WSAOXTLAoGAKH0o\nbhhl3zpMzeTfT8bSHwXyCTkGwOAmgB0Lc1g0adI/kOZt+dt4Ioku+sWxQvfEFGUQ\nycj2+7g3z086t5LXoP1BMbRWVU3NNKhfbgHh3DiW5S7hNC+B2Uzd3PWxP1bltLMf\n3NPq381NpXFapVMukKJaLIzcVk3K5HBxp+SsniECgYEAxn18puFukIF+grEyZGrx\n69aAXxosIW5b1Kz7xvHNz0RX016qiAWXR24j0SF+uDAaMs7VYY6J9f0aRX2/xt7r\nI5lP147PDYhjdi6sxPAj/nCJ+OiGamwQN6adipOqCLh5e0l/4VHdrVYZrF009uPP\nptRGgavc7Ghgi4Uk0NSfnys=\n-----END PRIVATE KEY-----\n","client_email":"christian-maliwat@praxis-dolphin-478603-n4.iam.gserviceaccount.com","client_id":"100077206960659388031","token_uri":"https://oauth2.googleapis.com/token"}''')


def sync_to_sheets() -> None:
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database="momentum_gym",
        )
        cursor = conn.cursor()

        cursor.execute("SELECT member_id, first_name, last_name, email, phone, membership_type, is_active, join_date FROM members ORDER BY member_id")
        members = cursor.fetchall()
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Found {len(members)} members")

        cursor.execute("SELECT zone_id, zone_name, capacity, description FROM zones ORDER BY zone_id")
        zones = cursor.fetchall()
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Found {len(zones)} zones")

        cursor.execute("SELECT log_id, member_id, first_name, last_name, zone_name, check_in_time, check_out_time, duration_minutes FROM check_ins ORDER BY check_in_time")
        checkins = cursor.fetchall()
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Found {len(checkins)} check-ins")

        scope = [
            "https://spreadsheets.google.com/feeds",
            "https://www.googleapis.com/auth/drive",
        ]

        creds = ServiceAccountCredentials.from_json_keyfile_dict(SERVICE_ACCOUNT_JSON, scope)
        client = gspread.authorize(creds)
        spreadsheet_id = os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID")
        if not spreadsheet_id:
            raise ValueError("GOOGLE_SHEETS_SPREADSHEET_ID not set")
        spreadsheet = client.open_by_key(spreadsheet_id)

        sheet_names = ["Members", "Zones", "Check-Ins", "Facility Summary"]

        # Members
        ws = spreadsheet.worksheet("Members")
        ws.clear()
        members_data = [["member_id", "first_name", "last_name", "email", "phone", "membership_type", "is_active", "join_date"]]
        for m in members:
            members_data.append([m[0], m[1], m[2], m[3] or "", m[4] or "", m[5], "TRUE" if m[6] else "FALSE", str(m[7] or "")])
        ws.append_rows(members_data)

        # Zones
        ws = spreadsheet.worksheet("Zones")
        ws.clear()
        zones_data = [["zone_id", "zone_name", "capacity", "description"]]
        for z in zones:
            zones_data.append([z[0], z[1], z[2], z[3] or ""])
        ws.append_rows(zones_data)

        # Check-Ins
        ws = spreadsheet.worksheet("Check-Ins")
        ws.clear()
        checkins_data = [["log_id", "member_id", "first_name", "last_name", "zone_name", "check_in_time", "check_out_time", "duration_minutes"]]
        for c in checkins:
            checkins_data.append([c[0], c[1], c[2], c[3], c[4], str(c[5] or ""), str(c[6] or ""), str(c[7] or "")])
        ws.append_rows(checkins_data)

        # Facility Summary
        ws = spreadsheet.worksheet("Facility Summary")
        ws.clear()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        facility_data = [["zone_id", "zone_name", "capacity", "active_members", "occupancy_percentage", "density_status", "total_equipment", "equipment_in_use", "last_updated"]]
        active_checkins = [c for c in checkins if c[6] is None]
        for z in zones:
            zid, zname, zcap, _ = z
            active = sum(1 for c in active_checkins if c[4] == zname)
            pct = (active / zcap * 100) if zcap > 0 else 0.0
            if active == 0:
                status = "Empty"
            elif pct < 30:
                status = "Low"
            elif pct < 60:
                status = "Medium"
            elif pct < 90:
                status = "High"
            else:
                status = "Full"
            facility_data.append([zid, zname, zcap, active, f"{pct:.2f}", status, 0, 0, now])
        ws.append_rows(facility_data)

        url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}"
        print(f"\nDone! All 4 sheets updated in batch.")
        print(f"RESULT_URL={url}")

    except Exception as e:
        print(f"Sync Error: {e}")
        raise
    finally:
        if conn and conn.is_connected():
            if cursor:
                cursor.close()
            conn.close()


if __name__ == "__main__":
    sync_to_sheets()
