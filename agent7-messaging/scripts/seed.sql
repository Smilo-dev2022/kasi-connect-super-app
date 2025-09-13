-- seed a demo conversation and membership
do $$
declare cid uuid := gen_random_uuid();
begin
  insert into conversations(id, title) values (cid, 'Demo Chat');
  insert into memberships(conversation_id, user_id, role) values (cid, '00000000-0000-0000-0000-000000000001','member') on conflict do nothing;
  insert into memberships(conversation_id, user_id, role) values (cid, '00000000-0000-0000-0000-000000000002','member') on conflict do nothing;
exception when others then null;
end $$;
