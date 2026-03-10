from auth import create_access_token, SECRET_KEY, ALGORITHM
from jose import jwt

def test_final_fix():
    print("Starting final verification...")
    
    # 1. Test token creation with integer ID
    user_id = 123
    token = create_access_token(data={"sub": user_id})
    print(f"Token created for user_id: {user_id}")
    
    # 2. Verify decoded payload has string 'sub'
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    sub_val = payload.get("sub")
    print(f"Decoded 'sub' value: '{sub_val}' (Type: {type(sub_val)})")
    
    assert isinstance(sub_val, str), "Error: 'sub' claim should be a string"
    assert sub_val == "123", f"Error: Expected '123', got '{sub_val}'"
    
    # 3. Verify conversion to int (what get_current_user does)
    converted_id = int(sub_val)
    print(f"Converted back to int: {converted_id} (Type: {type(converted_id)})")
    assert converted_id == user_id, "Error: Converted ID does not match original"
    
    print("\nSUCCESS: Final verification passed!")

if __name__ == "__main__":
    try:
        test_final_fix()
    except Exception as e:
        print(f"\nFAILURE: {e}")
        exit(1)
