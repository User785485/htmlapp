-- Cru00e9er la table des documents gu00e9nu00e9ru00e9s
CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('vente', 'compte-rendu', 'onboarding')),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE (client_email, document_type)
);

-- Cru00e9er la table des logs d'application
CREATE TABLE IF NOT EXISTS application_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  component TEXT NOT NULL,
  action TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB DEFAULT NULL,
  error_stack TEXT DEFAULT NULL,
  user_email TEXT DEFAULT NULL,
  client_email TEXT DEFAULT NULL,
  request_id TEXT DEFAULT NULL,
  session_id TEXT DEFAULT NULL,
  ip_address TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  duration_ms INTEGER DEFAULT NULL,
  status_code INTEGER DEFAULT NULL,
  environment TEXT DEFAULT 'development'
);

-- Cru00e9er les index
CREATE INDEX IF NOT EXISTS idx_generated_documents_client_email ON generated_documents (client_email);
CREATE INDEX IF NOT EXISTS idx_generated_documents_document_type ON generated_documents (document_type);
CREATE INDEX IF NOT EXISTS idx_application_logs_timestamp ON application_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_application_logs_level ON application_logs (level);

-- Cru00e9er une fonction pour obtenir les stats
CREATE OR REPLACE FUNCTION get_application_stats()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH stats AS (
    SELECT 
      COUNT(DISTINCT client_email) as total_clients,
      COUNT(*) as total_documents,
      jsonb_object_agg(document_type, COUNT(*)) as documents_by_type
    FROM generated_documents
  )
  SELECT 
    jsonb_build_object(
      'total_clients', total_clients,
      'total_documents', total_documents,
      'documents_by_type', documents_by_type
    )
  FROM stats
  INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
