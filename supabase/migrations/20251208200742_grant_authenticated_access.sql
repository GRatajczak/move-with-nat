DO $$
DECLARE
    table_name TEXT;
BEGIN
    -- Pętla po wszystkich tabelach w schemacie 'public'
    FOR table_name IN
        SELECT t.table_name FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    LOOP
        -- Włączenie Row Level Security dla tabeli, jeśli jest wyłączone
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_name);

        -- Usunięcie istniejącej polityki, jeśli istnieje, aby uniknąć konfliktu.
        -- Zmień "Allow full access for authenticated users" jeśli używasz innej nazwy.
        EXECUTE format('DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.%I;', table_name);

        -- Stworzenie nowej, ogólnej polityki dającej pełen dostęp (SELECT, INSERT, UPDATE, DELETE)
        -- dla każdego zalogowanego użytkownika (rola 'authenticated').
        EXECUTE format('
            CREATE POLICY "Allow full access for authenticated users"
            ON public.%I
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
        ', table_name, table_name);
    END LOOP;
END;
$$;
