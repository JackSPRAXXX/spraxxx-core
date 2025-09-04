CREATE TABLE IF NOT EXISTS entitlements (
    id INTEGER PRIMARY KEY,
    userId INTEGER,
    active BOOLEAN,
    FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY,
    userId INTEGER,
    amount REAL,
    FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY,
    userId INTEGER,
    deviceName TEXT,
    FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    password TEXT
);