import sqlite3

db_path = "c:/Users/ASUS/PropNexa/backend/data/real_estate.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Update the tenant name and username
cursor.execute("UPDATE users SET username='Rohan', password='Rohan123' WHERE username='Chintu'")

# Also update the properties table where tenant_name is Chintu
cursor.execute("UPDATE properties SET tenant_name='Rohan' WHERE tenant_name='Chintu'")

conn.commit()
print("Updated database records from Chintu to Rohan.")
conn.close()
