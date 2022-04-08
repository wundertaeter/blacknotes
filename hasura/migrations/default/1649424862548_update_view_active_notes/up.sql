CREATE OR REPLACE VIEW "public"."active_notes" AS 
 SELECT notes_note.id,
    notes_note.content,
    notes_note.title,
    notes_note.user_id,
    notes_note.project_id,
    notes_note.deleted,
    notes_note.deadline,
    notes_note.completed_at,
    notes_note.done,
    notes_note."position",
    notes_note.today_position,
    notes_note.upcoming_position,
    notes_note.deleted_at,
    notes_note.someday_position,
    notes_note.anytime_position
   FROM notes_note
  WHERE (NOT (notes_note.id IN ( SELECT notes_note_1.id
           FROM notes_note notes_note_1,
            notes_project
          WHERE (((notes_note_1.project_id = notes_project.id) AND (notes_project.done = true)) OR (notes_project.deleted = true)))));
