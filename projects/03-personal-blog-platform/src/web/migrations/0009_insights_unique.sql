CREATE UNIQUE INDEX IF NOT EXISTS idx_insights_unique_source
ON insights (week_start, entity, data_source);
