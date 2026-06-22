import sqlite3

conn = sqlite3.connect('todos.db')
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE todos ADD COLUMN attachments TEXT")
    print("Added attachments column")
except sqlite3.OperationalError as e:
    print(f"attachments column already exists or error: {e}")

try:
    cursor.execute("ALTER TABLE todos ADD COLUMN parent_id INTEGER")
    print("Added parent_id column")
except sqlite3.OperationalError as e:
    print(f"parent_id column already exists or error: {e}")

try:
    cursor.execute("ALTER TABLE todos ADD COLUMN sort_order INTEGER DEFAULT 0")
    print("Added sort_order column")
except sqlite3.OperationalError as e:
    print(f"sort_order column already exists or error: {e}")

conn.commit()
conn.close()

print("Migration completed!")
