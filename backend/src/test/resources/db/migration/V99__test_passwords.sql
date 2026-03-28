-- Test-only migration: reset passwords for known test users to password123
-- Hashes generated with PBKDF2WithHmacSHA256, 120000 iterations, 256-bit key
UPDATE app_users SET
    password_salt = '98ee4eccba79b04161a95643fe8ca658',
    password_hash = '29b7b53c5a74fa5b917e1057ee6ba4e4c785f15aafde0919ac66d62eda1b3aad'
WHERE user_id = 'user-1';

UPDATE app_users SET
    password_salt = '1f29abc353748b34f52401961f97cf74',
    password_hash = '20c5d5ab475288768039d8c16922fe3eff3ceb3813e4a210cafb43ce65634489'
WHERE user_id = 'manager-1';

UPDATE app_users SET
    password_salt = '4f6e6f37e4de46a700f0da60e1dcc7f1',
    password_hash = '6e8cefe12bd7f7e2db43fa498d1630269c0c00e91adfa55e1114c1093ea890a8'
WHERE user_id = 'ic-product';

UPDATE app_users SET
    password_salt = '92f481073e5a963eec48e595326d5283',
    password_hash = '9ae9aa4c47d8ca3fd3ab7ca2fbda04780709bec259a0fadded58ede7d69c98b5'
WHERE user_id = 'ic-design';
