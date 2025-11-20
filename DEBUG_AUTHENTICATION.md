# Debug Authentication Issues

## 🔍 **Problem Analysis**

You're getting 401 Unauthorized errors because the frontend is not properly authenticated. The AuthContext is failing to validate tokens on app load.

## 🛠 **Step-by-Step Debugging Solution**

### **Step 1: Verify Backend is Running**
```bash
# Check if backend is responding
curl http://localhost:5000/health
# Should return: {"status":"OK",...}
```

### **Step 2: Clear All Browser Data**
1. Open `http://localhost:5173` in browser
2. Press `F12` → **Application** tab
3. Click **Local Storage** → **localhost:5173**
4. Click **Clear storage** or delete all entries
5. Refresh the page

### **Step 3: Register New Account**
1. Go to `http://localhost:5173`
2. Click **"Don't have an account? Sign up"**
3. Fill in:
   - **First Name:** Test
   - **Last Name:** User
   - **Email:** testuser@example.com
   - **Password:** SecurePass2024!
4. Click **"Register"**

### **Step 4: Verify Registration Success**
- ✅ Should see success message
- ✅ Should redirect to login page
- ✅ Check console for any errors

### **Step 5: Login**
1. On login page, fill in:
   - **Email:** testuser@example.com
   - **Password:** SecurePass2024!
2. Click **"Sign in"**

### **Step 6: Verify Login Success**
- ✅ Should redirect to `/dashboard`
- ✅ Should see dashboard content
- ✅ Check console - should have no 401 errors

### **Step 7: Check Token Storage**
In browser console (F12):
```javascript
// Check if token exists
localStorage.getItem('token')

// Should return a long JWT string, not 'undefined'
```

### **Step 8: Test Authentication**
In browser console:
```javascript
// Test profile endpoint
fetch('http://localhost:5000/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(console.log)
```

Should return user profile, not 401 error.

### **Step 9: Test Questionnaire Creation**
1. Click **"Create Questionnaire"**
2. Fill in:
   - **Title:** Test Survey
   - **Description:** Testing authentication
3. Add one question:
   - Type: Short Text
   - Question: What is your name?
   - Required: ✅
4. Click **"Save"**

Should create successfully without 401 errors.

## 🔧 **If Still Failing**

### **Check Network Tab**
1. F12 → **Network** tab
2. Try to login
3. Look for `/api/auth/login` request
4. Check:
   - Status code (should be 200)
   - Response content (should have tokens)
   - Request headers

### **Manual API Test**
Test login directly:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass2024!"
  }'
```

Should return tokens.

### **Check Browser Console Errors**
- Look for JavaScript errors
- Check if axios is configured correctly
- Verify no CORS errors

### **Environment Variables**
Check `backend-node/.env`:
```env
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb+srv://...
```

### **Database Connection**
Ensure MongoDB Atlas is accessible and user exists.

## 🚨 **Common Issues & Fixes**

### **Issue: Token not stored**
**Fix:** Clear localStorage and login again

### **Issue: 400 Bad Request on login**
**Fix:** Check email/password are correct

### **Issue: CORS errors**
**Fix:** Backend CORS config should allow `http://localhost:5173`

### **Issue: JWT secret mismatch**
**Fix:** Ensure JWT_SECRET is consistent

## ✅ **Success Indicators**

- ✅ Login redirects to dashboard
- ✅ `localStorage.getItem('token')` returns JWT
- ✅ `/api/auth/profile` returns 200
- ✅ Can create questionnaires
- ✅ No 401 errors in console

## 🎯 **Final Test**

Once authenticated:
1. Create a questionnaire
2. Publish it
3. Access public link
4. Submit a response
5. View analytics

Your MERN Questionnaire Platform should work perfectly! 🎉