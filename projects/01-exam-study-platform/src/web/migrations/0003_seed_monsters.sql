-- Seed: monsters (10 隻)
-- Apply after 0002 migration
-- Apply local:  npx wrangler d1 execute exam-study-platform-access --local --file=migrations/0003_seed_monsters.sql
-- Apply remote: npx wrangler d1 execute exam-study-platform-access --file=migrations/0003_seed_monsters.sql

INSERT OR IGNORE INTO monsters (id, name, idle_image, battle_image, style_tag, display_order, is_active) VALUES
  (1,  '火焰龍 Flamedrake',       '/images/monsters/01-idle.png', '/images/monsters/01-battle.png', 'rpg',         1,  1),
  (2,  '石巨人 Golem Rex',        '/images/monsters/02-idle.png', '/images/monsters/02-battle.png', 'rpg',         2,  1),
  (3,  '暗黑騎士 Shadow Knight',  '/images/monsters/03-idle.png', '/images/monsters/03-battle.png', 'rpg',         3,  1),
  (4,  '雷鷹 Thunderwing',        '/images/monsters/04-idle.png', '/images/monsters/04-battle.png', 'rpg',         4,  1),
  (5,  '史萊姆球 Blobby',         '/images/monsters/05-idle.png', '/images/monsters/05-battle.png', 'cartoon',     5,  1),
  (6,  '毛球熊 Fluffybear',       '/images/monsters/06-idle.png', '/images/monsters/06-battle.png', 'cartoon',     6,  1),
  (7,  '惡作劇狐 Trickster Fox',  '/images/monsters/07-idle.png', '/images/monsters/07-battle.png', 'cartoon',     7,  1),
  (8,  '暗影惡靈 Shadowwraith',   '/images/monsters/08-idle.png', '/images/monsters/08-battle.png', 'dark-fantasy', 8, 1),
  (9,  '骷髏王 Bone King',        '/images/monsters/09-idle.png', '/images/monsters/09-battle.png', 'dark-fantasy', 9, 1),
  (10, '深淵蛇妖 Abyssal Serpent','/images/monsters/10-idle.png', '/images/monsters/10-battle.png', 'dark-fantasy', 10, 1);
