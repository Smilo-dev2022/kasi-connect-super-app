insert into conversations(id, title, participant_ids)
values
  ('c_demo_1','Demo Chat',{ 'user-demo','business-1' })
on conflict do nothing;
