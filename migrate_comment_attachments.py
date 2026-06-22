#!/usr/bin/env python3
"""
Migration script to add attachments column to comments table
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('todos.db')
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(comments)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'attachments' not in columns:
            print("Adding attachments column to comments table...")
            cursor.execute("ALTER TABLE comments ADD COLUMN attachments TEXT")
            conn.commit()
            print("✓ Migration completed successfully!")
        else:
            print("✓ Attachments column already exists, no migration needed.")
    
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
