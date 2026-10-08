-- Agrega a Walter (Product Owner) como integrante de Foresite para que pueda ver el proyecto
-- con el nuevo control de acceso. Si usas un esquema propio: SET search_path TO tu_esquema;
INSERT INTO project_members (id, project_id, user_id, role)
SELECT gen_random_uuid()::text, 'b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000004', 'Product Owner'
WHERE NOT EXISTS (
  SELECT 1 FROM project_members
  WHERE project_id = 'b1000000-0000-4000-8000-000000000001' AND user_id = 'a1000000-0000-4000-8000-000000000004'
);
