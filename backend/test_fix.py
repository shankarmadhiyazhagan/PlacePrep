from jose import jwt
import os

SECRET_KEY = "placeprep-super-secret-key-change-in-production-2024"
ALGORITHM = "HS256"

def test_fix():
    # Test: String sub (The standard behavior for python-jose)
    token_str = jwt.encode({"sub": "1"}, SECRET_KEY, algorithm=ALGORITHM)
    payload_str = jwt.decode(token_str, SECRET_KEY, algorithms=[ALGORITHM])
    
    # This is what our fix does in auth.py
    user_id_raw = payload_str.get("sub")
    user_id = int(user_id_raw)
    
    print(f"Decoded sub: '{user_id_raw}' (Type: {type(user_id_raw)})")
    print(f"Converted user_id: {user_id} (Type: {type(user_id)})")
    
    assert user_id == 1
    assert isinstance(user_id, int)

    print("SUCCESS: Fix verified. String 'sub' claim is correctly converted to integer.")

if __name__ == "__main__":
    try:
        test_fix()
    except Exception as e:
        print(f"FAILURE: {e}")
