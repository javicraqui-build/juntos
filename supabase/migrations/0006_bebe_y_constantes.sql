-- juntos · v6 · nuevas colecciones: movimientos del bebé, contracciones y constantes de ella (peso, tensión)
alter table public.entries drop constraint if exists entries_collection_check;
alter table public.entries add constraint entries_collection_check check (collection in ('appointments','tests','ultrasounds','symptoms','memories','names','family','tasks','customMilestones','milestones','kicks','contractions','vitals'));
