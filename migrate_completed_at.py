#!/usr/bin/env python3
"""
Migration script to add completed_at column to todos table
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('todos.db')
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(todos)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'completed_at' not in columns:
            print("Adding completed_at column to todos table...")
            cursor.execute("ALTER TABLE todos ADD COLUMN completed_at TIMESTAMP")
            conn.commit()
            print("✓ Migration completed successfully!")
        else:
            print("✓ completed_at column already exists, no migration needed.")
    
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
