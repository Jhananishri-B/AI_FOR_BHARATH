#!/usr/bin/env python3
"""
Generate a proper bcrypt hash
"""

import bcrypt

# Generate hash for "pass123"
password = b"pass123"
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password, salt)
print(f"Password: pass123")
print(f"Hash: {hashed.decode()}")
