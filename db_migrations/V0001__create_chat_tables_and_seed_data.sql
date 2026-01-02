CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar VARCHAR(10) DEFAULT '👤',
    bio TEXT,
    online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    avatar VARCHAR(10),
    is_group BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_members (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    user_id INTEGER REFERENCES users(id),
    is_admin BOOLEAN DEFAULT false,
    pinned BOOLEAN DEFAULT false,
    muted BOOLEAN DEFAULT false,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    sender_id INTEGER REFERENCES users(id),
    text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id),
    user_id INTEGER REFERENCES users(id),
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

INSERT INTO users (username, display_name, avatar, online) VALUES
('anna_sokolova', 'Анна Соколова', '👩‍💼', true),
('team_dev', 'Команда разработки', '💻', false),
('maxim_petrov', 'Максим Петров', '👨‍🎨', true),
('mama', 'Мама ❤️', '👵', false),
('gym', 'Спортзал', '🏋️', false),
('me', 'Вы', '👤', true);

INSERT INTO chats (name, avatar, is_group) VALUES
('Анна Соколова', '👩‍💼', false),
('Команда разработки', '💻', true),
('Максим Петров', '👨‍🎨', false),
('Мама ❤️', '👵', false),
('Спортзал', '🏋️', false);

INSERT INTO chat_members (chat_id, user_id, pinned, muted) VALUES
(1, 1, true, false),
(1, 6, true, false),
(2, 2, false, false),
(2, 6, false, false),
(3, 3, false, false),
(3, 6, false, false),
(4, 4, true, false),
(4, 6, true, false),
(5, 5, false, true),
(5, 6, false, true);

INSERT INTO messages (chat_id, sender_id, text, status, created_at) VALUES
(1, 1, 'Привет! Как дела с проектом?', 'read', NOW() - INTERVAL '12 minutes'),
(1, 6, 'Отлично! Уже почти закончил дизайн', 'read', NOW() - INTERVAL '7 minutes'),
(1, 1, 'Круто! Можешь показать превью?', 'read', NOW() - INTERVAL '2 minutes'),
(1, 6, 'Конечно, отправлю через 5 минут', 'delivered', NOW() - INTERVAL '1 minute'),
(1, 1, 'Отлично, встретимся завтра!', 'sent', NOW());

INSERT INTO message_reactions (message_id, user_id, emoji) VALUES
(2, 1, '👍'),
(2, 1, '🔥');