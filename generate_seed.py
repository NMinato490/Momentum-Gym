import random
from datetime import datetime, timedelta

def generate_sql():
    members_sql = "INSERT INTO members (member_id, first_name, last_name, email, phone, membership_type, is_active, join_date) VALUES\n"
    checkins_sql = "INSERT INTO check_ins (log_id, member_id, first_name, last_name, zone_name, check_in_time, check_out_time, duration_minutes) VALUES\n"
    
    first_names = ["John", "Jane", "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy", "Mallory", "Victor", "Peggy", "Trent", "Walter", "Mark", "Julia", "Sam"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson"]
    types = ["basic", "premium", "vip"]
    zones = ["Cardio Zone", "Free Weights", "Machines", "Yoga Studio", "Pool", "Crossfit"]
    
    members = []
    
    # Generate 600 members
    member_values = []
    for i in range(1, 601):
        member_id = f"M{100000+i}"
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        email = f"{fname.lower()}.{lname.lower()}{i}@example.com"
        phone = f"555-{random.randint(100,999)}-{random.randint(1000,9999)}"
        mtype = random.choices(types, weights=[60, 30, 10])[0]
        is_active = random.choice([True, True, True, False]) # 75% active
        join_date = datetime.now() - timedelta(days=random.randint(0, 1095))
        
        members.append({
            "member_id": member_id,
            "first_name": fname,
            "last_name": lname,
            "join_date": join_date
        })
        
        join_str = join_date.strftime('%Y-%m-%dT%H:%M:%S.000Z')
        member_values.append(f"('{member_id}', '{fname}', '{lname}', '{email}', '{phone}', '{mtype}', {str(is_active).upper()}, '{join_str}')")
        
    members_sql += ",\n".join(member_values) + ";\n\n"
    
    # Generate 1500 check-ins
    checkin_values = []
    for i in range(1, 1501):
        member = random.choice(members)
        log_id = f"L{200000+i}"
        zone = random.choice(zones)
        
        # Check-in time after join date
        days_since_join = (datetime.now() - member["join_date"]).days
        if days_since_join <= 0:
            days_since_join = 1
        
        check_in_date = member["join_date"] + timedelta(days=random.randint(0, days_since_join))
        check_in_date = check_in_date.replace(hour=random.randint(6, 21), minute=random.randint(0, 59))
        duration = random.randint(30, 150)
        check_out_date = check_in_date + timedelta(minutes=duration)
        
        in_str = check_in_date.strftime('%Y-%m-%dT%H:%M:%S.000Z')
        out_str = check_out_date.strftime('%Y-%m-%dT%H:%M:%S.000Z')
        
        checkin_values.append(f"('{log_id}', '{member['member_id']}', '{member['first_name']}', '{member['last_name']}', '{zone}', '{in_str}', '{out_str}', {duration})")
        
    checkins_sql += ",\n".join(checkin_values) + ";\n"
    
    with open("C:/Users/nmina/OneDrive/Desktop/Momentum-Gym-main/supabase_seed.sql", "w", encoding="utf-8") as f:
        f.write("-- SQL Seed generated for 600 members and 1500 check-ins\n\n")
        f.write(members_sql + checkins_sql)

if __name__ == "__main__":
    generate_sql()
