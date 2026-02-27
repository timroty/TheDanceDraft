-- seed_tournament_games.sql
-- Inserts all 63 game slots for a given tournament.
--
-- CONFIGURE THESE VARIABLES BEFORE RUNNING:
DO $$
DECLARE
  v_tournament_id  uuid := '';

  -- Region assigned to each Elite Eight subtree root slot.
  -- Slot 4 subtree: slots 4, 8-9, 16-19, 32-39
  -- Slot 5 subtree: slots 5, 10-11, 20-23, 40-47
  -- Slot 6 subtree: slots 6, 12-13, 24-27, 48-55
  -- Slot 7 subtree: slots 7, 14-15, 28-31, 56-63
  Slot4TreeRegion  text := 'South';
  Slot5TreeRegion  text := 'East';
  Slot6TreeRegion  text := 'West';
  Slot7TreeRegion  text := 'Midwest';
BEGIN

  INSERT INTO game (tournament_id, slot, round, region) VALUES

    -- Round 6: Championship (slot 1, region NULL)
    (v_tournament_id,  1, 6, NULL),

    -- Round 5: Final Four (slots 2-3, region NULL)
    (v_tournament_id,  2, 5, NULL),
    (v_tournament_id,  3, 5, NULL),

    -- Round 4: Elite Eight (slots 4-7)
    (v_tournament_id,  4, 4, Slot4TreeRegion),
    (v_tournament_id,  5, 4, Slot5TreeRegion),
    (v_tournament_id,  6, 4, Slot6TreeRegion),
    (v_tournament_id,  7, 4, Slot7TreeRegion),

    -- Round 3: Sweet Sixteen (slots 8-15)
    (v_tournament_id,  8, 3, Slot4TreeRegion),
    (v_tournament_id,  9, 3, Slot4TreeRegion),
    (v_tournament_id, 10, 3, Slot5TreeRegion),
    (v_tournament_id, 11, 3, Slot5TreeRegion),
    (v_tournament_id, 12, 3, Slot6TreeRegion),
    (v_tournament_id, 13, 3, Slot6TreeRegion),
    (v_tournament_id, 14, 3, Slot7TreeRegion),
    (v_tournament_id, 15, 3, Slot7TreeRegion),

    -- Round 2: Round of 32 (slots 16-31)
    (v_tournament_id, 16, 2, Slot4TreeRegion),
    (v_tournament_id, 17, 2, Slot4TreeRegion),
    (v_tournament_id, 18, 2, Slot4TreeRegion),
    (v_tournament_id, 19, 2, Slot4TreeRegion),
    (v_tournament_id, 20, 2, Slot5TreeRegion),
    (v_tournament_id, 21, 2, Slot5TreeRegion),
    (v_tournament_id, 22, 2, Slot5TreeRegion),
    (v_tournament_id, 23, 2, Slot5TreeRegion),
    (v_tournament_id, 24, 2, Slot6TreeRegion),
    (v_tournament_id, 25, 2, Slot6TreeRegion),
    (v_tournament_id, 26, 2, Slot6TreeRegion),
    (v_tournament_id, 27, 2, Slot6TreeRegion),
    (v_tournament_id, 28, 2, Slot7TreeRegion),
    (v_tournament_id, 29, 2, Slot7TreeRegion),
    (v_tournament_id, 30, 2, Slot7TreeRegion),
    (v_tournament_id, 31, 2, Slot7TreeRegion),

    -- Round 1: Round of 64 (slots 32-63)
    -- Subtree A (Slot 4 region): slots 32-39
    (v_tournament_id, 32, 1, Slot4TreeRegion),
    (v_tournament_id, 33, 1, Slot4TreeRegion),
    (v_tournament_id, 34, 1, Slot4TreeRegion),
    (v_tournament_id, 35, 1, Slot4TreeRegion),
    (v_tournament_id, 36, 1, Slot4TreeRegion),
    (v_tournament_id, 37, 1, Slot4TreeRegion),
    (v_tournament_id, 38, 1, Slot4TreeRegion),
    (v_tournament_id, 39, 1, Slot4TreeRegion),
    -- Subtree B (Slot 5 region): slots 40-47
    (v_tournament_id, 40, 1, Slot5TreeRegion),
    (v_tournament_id, 41, 1, Slot5TreeRegion),
    (v_tournament_id, 42, 1, Slot5TreeRegion),
    (v_tournament_id, 43, 1, Slot5TreeRegion),
    (v_tournament_id, 44, 1, Slot5TreeRegion),
    (v_tournament_id, 45, 1, Slot5TreeRegion),
    (v_tournament_id, 46, 1, Slot5TreeRegion),
    (v_tournament_id, 47, 1, Slot5TreeRegion),
    -- Subtree C (Slot 6 region): slots 48-55
    (v_tournament_id, 48, 1, Slot6TreeRegion),
    (v_tournament_id, 49, 1, Slot6TreeRegion),
    (v_tournament_id, 50, 1, Slot6TreeRegion),
    (v_tournament_id, 51, 1, Slot6TreeRegion),
    (v_tournament_id, 52, 1, Slot6TreeRegion),
    (v_tournament_id, 53, 1, Slot6TreeRegion),
    (v_tournament_id, 54, 1, Slot6TreeRegion),
    (v_tournament_id, 55, 1, Slot6TreeRegion),
    -- Subtree D (Slot 7 region): slots 56-63
    (v_tournament_id, 56, 1, Slot7TreeRegion),
    (v_tournament_id, 57, 1, Slot7TreeRegion),
    (v_tournament_id, 58, 1, Slot7TreeRegion),
    (v_tournament_id, 59, 1, Slot7TreeRegion),
    (v_tournament_id, 60, 1, Slot7TreeRegion),
    (v_tournament_id, 61, 1, Slot7TreeRegion),
    (v_tournament_id, 62, 1, Slot7TreeRegion),
    (v_tournament_id, 63, 1, Slot7TreeRegion);

  RAISE NOTICE 'Seeded 63 games for tournament %', v_tournament_id;

END $$;
