-- Query: Fetch all tracked games ordered by their latest current players count
SELECT g.game_name, t.current_players, t.recorded_at 
FROM (
    SELECT DISTINCT ON (app_id) app_id, current_players, recorded_at 
    FROM telemetry 
    ORDER BY app_id, recorded_at DESC
) t
JOIN games g ON t.app_id = g.app_id
ORDER BY t.current_players DESC;
