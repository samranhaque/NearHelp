-- Resolve ALL currently active SOS immediately
-- This will clean up any stale/test SOS records

UPDATE sos 
SET 
    status = 'resolved',
    resolved_at = NOW(),
    response_time_seconds = EXTRACT(EPOCH FROM (NOW() - created_at))::INTEGER
WHERE 
    status IN ('active', 'responding');

-- Show what was updated
SELECT 
    id, 
    type,
    status, 
    created_at, 
    resolved_at,
    seeker_id
FROM sos 
WHERE resolved_at >= NOW() - INTERVAL '1 minute'
ORDER BY resolved_at DESC;

-- Verify no active SOS remain
SELECT COUNT(*) as remaining_active_sos
FROM sos 
WHERE status IN ('active', 'responding');
