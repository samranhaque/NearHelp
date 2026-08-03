-- Migration: Clean up stale/old active SOS records
-- This resolves any SOS that has been active for more than 24 hours

-- Mark all SOS older than 24 hours as resolved
UPDATE sos 
SET 
    status = 'resolved',
    resolved_at = NOW(),
    response_time_seconds = EXTRACT(EPOCH FROM (NOW() - created_at))::INTEGER
WHERE 
    status IN ('active', 'responding') 
    AND created_at < NOW() - INTERVAL '24 hours';

-- Also mark any SOS created today but older than 2 hours as resolved
-- (in case you have recent tests that should be cleaned up)
UPDATE sos 
SET 
    status = 'resolved',
    resolved_at = NOW(),
    response_time_seconds = EXTRACT(EPOCH FROM (NOW() - created_at))::INTEGER
WHERE 
    status IN ('active', 'responding') 
    AND created_at < NOW() - INTERVAL '2 hours'
    AND created_at >= CURRENT_DATE;

-- Verify the update
SELECT 
    id, 
    status, 
    type,
    created_at, 
    resolved_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))::INTEGER / 60 AS age_minutes
FROM sos 
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC;
