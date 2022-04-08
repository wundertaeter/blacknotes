CREATE VIEW active_notes AS
select * from notes_note
where id not in (select notes_note.id from notes_note, notes_project
where notes_note.project_id = notes_project.id
and notes_project.done = true or notes_project.deleted = true);
