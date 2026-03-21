CREATE TABLE app_users (
    user_id VARCHAR(255) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('IC', 'MANAGER')),
    password_salt VARCHAR(64) NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_users_role ON app_users(role);
CREATE INDEX idx_app_users_active ON app_users(active);

INSERT INTO app_users (user_id, full_name, role, password_salt, password_hash) VALUES
    ('manager-1', 'Maya Reynolds', 'MANAGER', '7aaf5ce7e5a22a070d20c889bee74a76', 'bb4ab4441d80238ded36b7e1e6b315e32aef6b4808840e034c8e7694aa18a640'),
    ('director-ops', 'Adrian Cole', 'MANAGER', '09f6f266acfc769c613805b452060f49', '8c382406c03144e45971248827c01015dbda9bf1606cb2532ab3e82073b93a05'),
    ('lead-product', 'Nina Patel', 'MANAGER', '7f33bcd8ad987423893cfd3e26059ae8', '46fbafb132fe353a35ca7015b3693254249378caa7a4e783ae187c93b8bf25c5'),
    ('user-1', 'Jordan Kim', 'IC', '385d833a0733ce60a4386ab52688d3bd', '15c43199a049e95ceca60effa9f2f5c2957dbef98438163fd1a4ca5650d8a46b'),
    ('ic-product', 'Avery Brooks', 'IC', '793b3efe79c0454c44a73a8963419f57', 'd7f59ff4a1cdf3cf6804c34f85221fff2282d6cbfe614d5a86d0eaa0183a4cf5'),
    ('ic-design', 'Sam Rivera', 'IC', 'd63de4396d370c77a956cef6b692a996', '08609d933d1306fe636543161e9ccd54e5cbddacd53baeb1b64a601b03d37a31');
