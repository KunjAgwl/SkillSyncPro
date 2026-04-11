# Database Architecture & SQL Guide

This document explains the database schema, queries, and logic used in the **Resume Job-Matcher PWA**. We use **Turso (LibSQL)** as our edge database with native vector search capabilities.

## 1. Table Schema: `jobs`

We use a single table to store both the raw job data and the high-dimensional AI vectors.

```sql
CREATE TABLE jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  company TEXT,
  description TEXT,
  skills TEXT,          -- Stored as a JSON string
  embedding F32_BLOB(3072), -- Vector storage for AI embeddings
  UNIQUE(title, company)
);
```

### Why these types?
*   **`F32_BLOB(3072)`**: This is a specialized vector type. We use **3072** dimensions to match the output of the `gemini-embedding-2-preview` model.
*   **`UNIQUE(title, company)`**: Prevents the seeder from adding the same job twice if you run it multiple times.

---

## 2. Vector Indexing

To make searching through thousands of jobs instantaneous, we use a **Vector Index**.

```sql
CREATE INDEX jobs_idx ON jobs (
  libsql_vector_idx(embedding, 'metric=cosine')
);
```
*   **`metric=cosine`**: This is the standard for text similarity. It measures the "angle" between the resume vector and the job vector to find a semantic match even if the words aren't identical.

---

## 3. The "Deep Migration" Query
In `generate-embeddings.js`, we use a specific pattern to upgrade the database from 768-D to 3072-D:

1.  **`ALTER TABLE jobs RENAME TO jobs_old;`**: Backs up your data.
2.  **`CREATE TABLE jobs (...);`**: Creates the fresh 3072-D schema.
3.  **`INSERT INTO jobs (...) SELECT ... FROM jobs_old;`**: Moves your text data back.
4.  **`DROP TABLE jobs_old;`**: Cleans up.

**Why?** SQLite does not support `ALTER COLUMN` to change a vector's dimensions. Only a full recreation ensures the database is perfectly optimized for the new AI model.

---

## 4. Semantic Search Query
This is the core query used in `server/index.js` to find the 15 best jobs:

```sql
SELECT d.id, d.title, d.company, d.description 
FROM vector_top_k('jobs_idx', vector(?), 15) AS v
JOIN jobs AS d ON d.rowid = v.id;
```
*   **`vector(?)`**: Converts the incoming array of numbers from Gemini into the database's native vector format.
*   **`vector_top_k`**: A specialized Turso function that finds the "Top K" (15) most similar items in the vector index.
*   **`JOIN`**: Connects the search results back to the original text data.

---

## 5. Insert Pattern
When seeding or generating embeddings, we use:

```sql
INSERT OR IGNORE INTO jobs (...) VALUES (...);
-- OR
UPDATE jobs SET embedding = vector(?) WHERE id = ?;
```
*   **`INSERT OR IGNORE`**: Automatically skips records that already exist (based on the Unique constraint).
*   **`UPDATE ... vector(?)`**: Efficiently updates the specific job with its new AI "meaning."
