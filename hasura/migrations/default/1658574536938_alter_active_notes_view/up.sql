CREATE
OR REPLACE VIEW "public"."active_notes" AS
SELECT
  notes_note.*
FROM
  notes_note,
  notes_project
WHERE
  (
    (
      (notes_note.project_id = notes_project.id)
      AND (notes_project.done = true)
    )
    OR (notes_project.deleted = true)
  );
