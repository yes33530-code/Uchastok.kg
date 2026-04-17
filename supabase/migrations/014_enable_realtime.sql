-- Enable realtime for tables used by the kanban board
alter publication supabase_realtime add table plots;
alter publication supabase_realtime add table plot_comments;
alter publication supabase_realtime add table plot_activity;
alter publication supabase_realtime add table plot_checklists;
