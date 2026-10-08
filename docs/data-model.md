## QuickNotes data-model

## Entity Relationship Overview

The core domain model consists of four entities:
1. **`users`**: Represents registered platform accounts.
2. **`notes`**: Stores user-created text content.
3. **`tags`**: Stores categorization categories (e.g., "Personal", "Work").
4. **`note_tags`**: Join table managing many-to-many associations between notes and tags.

### Relationships Explanation
* **One-to-Many (`users` -> `notes`)**: One user can own multiple notes (`1:N`). Each note belongs strictly to a single user via foreign key `notes.user_id`.
* **Many-to-Many (`notes` <-> `tags`)**: A single note can possess multiple tags, and a tag can be associated with multiple notes (`M:N`). Managed through the composite join table `note_tags`.

---

## Schema DDL (CREATE TABLE Statements)

```sql
-- Enforce UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Notes Table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_notes_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Tags Table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Note Tags Join Table (Composite Primary Key)
CREATE TABLE note_tags (
    note_id UUID NOT NULL,
    tag_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    CONSTRAINT fk_note_tags_note FOREIGN KEY (note_id) 
        REFERENCES notes(id) ON DELETE CASCADE,
    CONSTRAINT fk_note_tags_tag FOREIGN KEY (tag_id) 
        REFERENCES tags(id) ON DELETE CASCADE
); 
```


## Database Indexing
```sql
-- Index on foreign key and order column for fast user note fetching
CREATE INDEX idx_notes_user_id_created_at ON notes(user_id, created_at DESC); 
```

## Index Justification

When users open their dashboard, the app frequently asks the database for one thing: **“Show me this specific user's latest notes, sorted from newest to oldest.”**

* Without an index (The Slow Way): The database may need to scan a large number of note records to find the notes belonging to the requested user and then sort them by date.
* With an index (The Fast Way) A composite index on `user_id` and `created_at DESC` acts like an organized filing system or the index at the back of a book. It groups each user's notes together and keeps them ordered by creation date.

This allows PostgreSQL to efficiently locate the requested user's notes and retrieve the newest records without scanning the entire notes table, improving query performance as the database grows.


## Example SQL Queries
1. Insert a New Note
```sql
INSERT INTO notes (user_id, title, body)
VALUES ('e7b8a1c0-3e21-4f8a-9a00-112233445566', 'Meeting Notes', 'Discuss scaling goals.')
RETURNING id, title, created_at;
```
2. JOIN
```sql
SELECT 
    n.id AS note_id,
    n.title,
    n.body,
    n.created_at,
    COALESCE(STRING_AGG(t.name, ', '), '') AS tags
FROM notes n
LEFT JOIN note_tags nt ON n.id = nt.note_id
LEFT JOIN tags t ON nt.tag_id = t.id
WHERE n.user_id = 'e7b8a1c0-3e21-4f8a-9a00-112233445566' 
  AND n.is_archived = FALSE
GROUP BY n.id
ORDER BY n.created_at DESC
LIMIT 10 OFFSET 0;
```
3. Count Total Active Notes per User
```sql
SELECT user_id, COUNT(*) AS active_note_count
FROM notes
WHERE is_archived = FALSE
GROUP BY user_id;
```

## SQL vs. NoSQL
I select SQL over NoSQL because:

    (i) Notes and user relations require strict transactional boundaries. If tag associations or note creation steps fail, rolling back must be atomic.

    (ii) QuickNotes features dynamic search filtering across users, notes, and tags. SQL's multi-table JOIN engine and composite indexing support fast relational lookups without needing manual application-layer data aggregation or redundant data duplication across documents.

    (iii) Referential integrity (ON DELETE CASCADE foreign keys) prevents orphaned tags or dangling note entities at the engine level.