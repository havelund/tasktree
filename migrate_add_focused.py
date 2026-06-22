#!/usr/bin/env python3
"""Migration script to add focused column to todos table"""

import sqlite3

def migrate():
    conn = sqlite3.connect('todos.db')
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(todos)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'focused' not in columns:
            print("Adding 'focused' column to todos table...")
            cursor.execute("ALTER TABLE todos ADD COLUMN focused BOOLEAN DEFAULT 0")
            conn.commit()
            print("Migration completed successfully!")
        else:
            print("Column 'focused' already exists, skipping migration.")
    
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
