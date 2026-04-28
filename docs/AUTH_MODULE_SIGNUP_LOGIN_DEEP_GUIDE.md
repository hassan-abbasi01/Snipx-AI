# SnipX Auth Module Deep Guide (Signup -> Login -> Protected Access)

This guide explains your complete user authentication module in beginner-friendly language.

It covers:
- Frontend pages and UI behavior
- Backend APIs and service logic
- Password hashing and JWT token flow
- Google OAuth login flow
- Route protection and logout
- Viva-ready architecture explanation

---

## 1) Big Picture Architecture

Your auth system has 3 core layers:

1. Frontend React UI
- User fills Signup/Login form.
- Frontend sends request to backend auth endpoints.
- On login success, token is saved in browser localStorage.

2. Backend Flask API
- Validates credentials.
- Hashes passwords at signup.
- Verifies password hash at login.
- Generates JWT token.

3. Database (MongoDB)
- Stores user record with password hash (not plain password).
- Stores profile fields (first name, last name, email, created time, etc).

---

## 2) Where Code Lives (Quick Map)

### Frontend files

- App routes and protected route rules:
  [src/App.tsx](../src/App.tsx#L44)

- Auth provider (session state, bootstrap from token):
  [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx#L27)

- API helper (token set/get, Authorization header, login/register methods):
  [src/services/api.ts](../src/services/api.ts#L74)

- Signup page UI + validation + register API call:
  [src/pages/Signup.tsx](../src/pages/Signup.tsx#L52)

- Login page UI + password login + Google login trigger:
  [src/pages/Login.tsx](../src/pages/Login.tsx#L28)

- OAuth callback page (token read from URL, fetch user, set session):
  [src/components/AuthCallback.tsx](../src/components/AuthCallback.tsx#L13)

- App wrapped with AuthProvider:
  [src/main.tsx](../src/main.tsx#L11)

- Logout buttons in UI:
  [src/components/Navbar.tsx](../src/components/Navbar.tsx#L127)

### Backend files

- Auth endpoints (register/login/google/me):
  [backend/app.py](../backend/app.py#L161)

- Auth business logic (hashing, JWT generation, token verification):
  [backend/services/auth_service.py](../backend/services/auth_service.py#L20)

- User model structure:
  [backend/models/user.py](../backend/models/user.py#L4)

- Backend auth env values:
  [backend/.env](../backend/.env#L7)

---

## 3) Signup Flow (Normal Email/Password)

### Step A: User fills Signup form

Form logic is in:
[src/pages/Signup.tsx](../src/pages/Signup.tsx#L52)

What happens:
- Zod schema validates fields (name/email/password/confirm password).
- Password rules include:
  - minimum length 8
  - at least one uppercase
  - at least one special character
- If validation fails: errors shown on UI.

Schema starts at:
[src/pages/Signup.tsx](../src/pages/Signup.tsx#L6)

### Step B: Frontend calls backend register endpoint

In handleSubmit, frontend sends POST request to:

`/auth/register`

Call line:
[src/pages/Signup.tsx](../src/pages/Signup.tsx#L57)

Payload includes:
- firstName
- lastName
- email
- password

### Step C: Backend register API receives request

Endpoint:
[backend/app.py](../backend/app.py#L256)

Backend checks:
- Request body exists
- email/password present

Then calls service:
[backend/app.py](../backend/app.py#L266)

### Step D: Password hashing and DB insert

Auth service function:
[backend/services/auth_service.py](../backend/services/auth_service.py#L20)

Hashing is done here:
- generate salt:
  [backend/services/auth_service.py](../backend/services/auth_service.py#L24)
- hash password:
  [backend/services/auth_service.py](../backend/services/auth_service.py#L25)

Important:
- Plain password is never stored.
- Stored field is password_hash (bcrypt hash bytes).

If email already exists, service throws:
"Email already registered"

---

## 4) Login Flow (Normal Email/Password)

### Step A: User submits login form

UI handler:
[src/pages/Login.tsx](../src/pages/Login.tsx#L28)

It calls context method login(email, password):
[src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx#L60)

### Step B: Context calls ApiService.login

Api call method:
[src/services/api.ts](../src/services/api.ts#L211)

On success token is saved:
[src/services/api.ts](../src/services/api.ts#L217)

Token storage helpers:
- set token: [src/services/api.ts](../src/services/api.ts#L74)
- get token: [src/services/api.ts](../src/services/api.ts#L79)
- clear token: [src/services/api.ts](../src/services/api.ts#L86)

### Step C: Backend login endpoint

Endpoint:
[backend/app.py](../backend/app.py#L279)

Backend calls auth service login_user:
[backend/app.py](../backend/app.py#L286)

### Step D: Password verification

Function:
[backend/services/auth_service.py](../backend/services/auth_service.py#L37)

Verification line:
[backend/services/auth_service.py](../backend/services/auth_service.py#L54)

How it works:
- Fetch user by email
- Read stored hash (password_hash or legacy password)
- Compare input password with bcrypt.checkpw
- If mismatch: "Invalid email or password"

### Step E: JWT token generation

Token generator:
[backend/services/auth_service.py](../backend/services/auth_service.py#L70)

JWT encode line:
[backend/services/auth_service.py](../backend/services/auth_service.py#L76)

Payload contains:
- user_id
- exp (1 day expiry)

### Step F: Frontend route transition

On success login page navigates to editor:
[src/pages/Login.tsx](../src/pages/Login.tsx#L35)

---

## 5) Is JWT used? Where?

Yes, JWT is fully used for auth session.

### Generate JWT
- [backend/services/auth_service.py](../backend/services/auth_service.py#L70)

### Verify JWT
- [backend/services/auth_service.py](../backend/services/auth_service.py#L80)
- decode line: [backend/services/auth_service.py](../backend/services/auth_service.py#L82)

### Middleware-like decorator for protected APIs
- [backend/app.py](../backend/app.py#L189)

This decorator:
- reads Authorization Bearer token
- verifies token
- injects user_id into route handler

---

## 6) Is password hashed? Where?

Yes, password hashing is implemented.

### Hash during signup
- salt: [backend/services/auth_service.py](../backend/services/auth_service.py#L24)
- hash: [backend/services/auth_service.py](../backend/services/auth_service.py#L25)

### Verify during login
- compare: [backend/services/auth_service.py](../backend/services/auth_service.py#L54)

Algorithm: bcrypt

---

## 7) Google Sign-In Flow

### Frontend trigger

Login and Signup both redirect browser to backend Google login endpoint:
- Login button handler: [src/pages/Login.tsx](../src/pages/Login.tsx#L57)
- Signup button handler: [src/pages/Signup.tsx](../src/pages/Signup.tsx#L90)

Both hit:
`/auth/google/login`

### Backend OAuth entry

Route:
[backend/app.py](../backend/app.py#L161)

### Backend OAuth callback

Route:
[backend/app.py](../backend/app.py#L166)

What callback does:
1. Exchange auth code for Google token
2. Parse Google ID token (user profile)
3. Find user by email in Mongo
4. If not found, create user with provider=google
5. Generate your app JWT
6. Redirect to frontend `/auth/callback?token=...`

JWT generation in callback:
[backend/app.py](../backend/app.py#L184)

### Frontend OAuth callback page

Component:
[src/components/AuthCallback.tsx](../src/components/AuthCallback.tsx#L13)

What it does:
1. Read token from URL query
2. Save token in localStorage via ApiService.setToken
3. Call `/auth/me` with Bearer token
4. Set user in AuthContext
5. Navigate to features page

Token save line:
[src/components/AuthCallback.tsx](../src/components/AuthCallback.tsx#L15)

User fetch line:
[src/components/AuthCallback.tsx](../src/components/AuthCallback.tsx#L17)

---

## 8) Route Protection in Frontend

Router uses isAuthenticated checks:
[src/App.tsx](../src/App.tsx#L44)

Examples:
- /login and /signup are blocked when already logged in.
- /profile, /admin, /admin/tickets require login.

Protected route examples:
- [src/App.tsx](../src/App.tsx#L68)
- [src/App.tsx](../src/App.tsx#L69)

---

## 9) Auth Bootstrap on Refresh (Important)

When app reloads, user should stay logged in if token exists.

This logic runs in AuthContext useEffect:
[src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx#L27)

Flow:
1. Read token from localStorage
2. If token exists, call `/auth/me`
3. If response valid, set user state
4. If invalid/expired token, clear token

Token read:
[src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx#L31)

Token invalid cleanup:
[src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx#L51)

---

## 10) Logout Flow

Logout button calls context logout():
- [src/components/Navbar.tsx](../src/components/Navbar.tsx#L127)

Logout function:
- [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx#L94)

What logout does:
- Clears token from localStorage
- Clears in-memory user state

---

## 11) Backend Endpoint Summary (Auth)

### POST /api/auth/register
- File: [backend/app.py](../backend/app.py#L256)
- Purpose: create account
- Calls: auth_service.register_user

### POST /api/auth/login
- File: [backend/app.py](../backend/app.py#L279)
- Purpose: verify user and issue JWT
- Returns: token + user

### POST /api/auth/demo
- File: [backend/app.py](../backend/app.py#L295)
- Purpose: demo account token

### GET /api/auth/me
- File: [backend/app.py](../backend/app.py#L1767)
- Protected: yes (require_auth)
- Purpose: return current user profile (without password fields)

### GET /api/auth/google/login
- File: [backend/app.py](../backend/app.py#L161)
- Purpose: start OAuth redirect to Google

### GET /api/auth/google/callback
- File: [backend/app.py](../backend/app.py#L166)
- Purpose: finish OAuth and redirect back to frontend with JWT

---

## 12) Sequence Flow (End-to-End)

### A) Email Signup

1. User enters form on Signup page
2. Zod validates input
3. Frontend POST `/api/auth/register`
4. Backend register route validates required fields
5. AuthService hashes password with bcrypt
6. MongoDB stores user doc
7. Frontend redirects user to login page

### B) Email Login

1. User submits Login form
2. Frontend calls ApiService.login
3. Backend login route calls AuthService.login_user
4. bcrypt verifies password hash
5. JWT generated and returned
6. Frontend stores token in localStorage
7. AuthContext stores user in state
8. User navigated to editor

### C) Google Login

1. User clicks "Sign in/up with Google"
2. Browser redirects to backend `/auth/google/login`
3. Backend redirects to Google OAuth consent
4. Google redirects back to backend callback
5. Backend creates/fetches user and generates JWT
6. Backend redirects to frontend `/auth/callback?token=...`
7. AuthCallback stores token and fetches `/auth/me`
8. User session is set in AuthContext

---

## 13) UI-Level Notes (What Sir can ask)

### Login UI
- Email/password fields with show/hide password
- Social login button (Google)
- Demo mode button
- On success: toast + navigation to editor

Reference: [src/pages/Login.tsx](../src/pages/Login.tsx#L28)

### Signup UI
- Client-side validation with Zod
- Password strength meter
- Confirm password matching
- Google signup button

Reference: [src/pages/Signup.tsx](../src/pages/Signup.tsx#L6)

### Session-aware Navbar
- If authenticated: shows user first name + Logout
- If not authenticated: shows Get Started

Reference: [src/components/Navbar.tsx](../src/components/Navbar.tsx#L119)

---

## 14) Important Security and Design Observations

1. Good practices already present
- Password hashing with bcrypt
- JWT expiry present (1 day)
- Sensitive password fields removed in `/auth/me`
- Protected API decorator exists

2. Practical gaps you should know for viva
- Signup page uses direct fetch instead of AuthContext/ApiService abstraction.
- Google callback redirects to hardcoded localhost URL in current backend file.
- Token is stored in localStorage (simple but XSS-sensitive in theory).

3. Production recommendations
- Move JWT to HttpOnly secure cookies for higher security.
- Add refresh token strategy.
- Add rate limiting on login endpoint.
- Add email verification flow (UI text exists, backend flow currently not complete).

---

## 15) Environment Variables Relevant to Auth

Frontend:
- API URL: [/.env](../.env#L6)

Backend:
- JWT secret: [backend/.env](../backend/.env#L7)
- Mongo URI: [backend/.env](../backend/.env#L10)
- Google client id: [backend/.env](../backend/.env#L19)
- Google secret: [backend/.env](../backend/.env#L21)

Note: Secrets should never be committed to git in real projects.

---

## 16) Viva One-Minute Explanation (Memorize)

"Frontend React mein Signup/Login pages hain. Signup par Zod validation ke baad backend `/api/auth/register` call hoti hai. Backend AuthService bcrypt se password hash karke MongoDB mein store karta hai. Login par backend bcrypt check karta hai, valid hone par JWT generate karta hai aur frontend ko return karta hai. Frontend token localStorage mein save karta hai aur har protected API call mein Authorization Bearer header bhejta hai. Backend `require_auth` decorator JWT verify karke user_id nikalta hai. Google login mein OAuth callback ke baad bhi same JWT-based session set hoti hai."

---

## 17) Quick QA (Sir ki possible questions)

Q: Plain password store hota hai?
A: Nahi, bcrypt hash store hota hai.

Q: Session kis se maintain hoti hai?
A: JWT token + localStorage + AuthContext state.

Q: Token verify kahan hota hai?
A: Backend AuthService.verify_token and require_auth decorator.

Q: Google login alag auth system hai?
A: OAuth sirf identity verify karta hai, final app session phir bhi JWT se hoti hai.

Q: Protected route frontend aur backend dono par hai?
A: Haan. Frontend route guards + backend token verification both.

---

## 18) Real Frontend Code Snippets (UI -> API)

### A) Signup form submit code (actual)

Source: [src/pages/Signup.tsx](../src/pages/Signup.tsx#L52)

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    signupSchema.parse(formData);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      }),
    });
    const result = await response.json();
    if (response.ok) {
      alert('Account created-redirecting!');
      navigate('/login');
    } else {
      alert(`Signup failed: ${result.error || 'Unknown error'}`);
    }
  } catch (err) {
    // zod errors etc
  }
};
```

### B) Login form submit code (actual)

Source: [src/pages/Login.tsx](../src/pages/Login.tsx#L28)

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    await login(email, password);
    toast.success('Login successful!');
    navigate('/editor');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Login failed');
  } finally {
    setIsLoading(false);
  }
};
```

### C) Google login button flow (actual)

Source: [src/pages/Login.tsx](../src/pages/Login.tsx#L57), [src/pages/Signup.tsx](../src/pages/Signup.tsx#L90)

```tsx
const handleGoogleLogin = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  window.location.href = `${API_URL}/auth/google/login`;
};
```

### D) OAuth callback processing (actual)

Source: [src/components/AuthCallback.tsx](../src/components/AuthCallback.tsx#L13)

```tsx
const token = searchParams.get('token');
if (token) {
  ApiService.setToken(token);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(userData => {
      setUser({
        email: userData.email,
        firstName: userData.first_name || userData.firstName,
        lastName: userData.last_name || userData.lastName
      });
      navigate('/features');
    });
}
```

### E) Auth context bootstrap on page refresh (actual)

Source: [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx#L27)

```tsx
useEffect(() => {
  const token = ApiService.getToken();
  if (token && token !== 'demo-token-123456') {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(userData => setUser({
        email: userData.email,
        firstName: userData.first_name || userData.firstName,
        lastName: userData.last_name || userData.lastName
      }))
      .catch(() => {
        ApiService.clearToken();
        setUser(null);
      });
  }
}, []);
```

---

## 19) Real Backend Code Snippets (API -> Service -> JWT)

### A) Register and Login routes (actual)

Source: [backend/app.py](../backend/app.py#L256), [backend/app.py](../backend/app.py#L279)

```python
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    user_id = auth_service.register_user(
        email=data['email'],
        password=data['password'],
        first_name=data.get('firstName'),
        last_name=data.get('lastName')
    )
    return jsonify({'message': 'User registered successfully', 'user_id': str(user_id)}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    token, user = auth_service.login_user(data['email'], data['password'])
    return jsonify({'token': token, 'user': user}), 200
```

### B) Password hashing and verification (actual)

Source: [backend/services/auth_service.py](../backend/services/auth_service.py#L20), [backend/services/auth_service.py](../backend/services/auth_service.py#L37)

```python
def register_user(self, email, password, first_name=None, last_name=None):
    if self.users.find_one({"email": email}):
        raise ValueError("Email already registered")

    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)
    self.users.insert_one({
        "email": email,
        "password_hash": password_hash,
        "first_name": first_name,
        "last_name": last_name,
        "created_at": datetime.utcnow()
    })

def login_user(self, email, password):
    user_doc = self.users.find_one({"email": email})
    stored_hash = user_doc.get('password_hash') or user_doc.get('password')
    if not bcrypt.checkpw(password.encode('utf-8'), stored_hash):
        raise ValueError("Invalid email or password")
```

### C) JWT generate + verify (actual)

Source: [backend/services/auth_service.py](../backend/services/auth_service.py#L70), [backend/services/auth_service.py](../backend/services/auth_service.py#L80)

```python
def generate_token(self, user_id):
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, self.secret_key, algorithm='HS256')

def verify_token(self, token):
    payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
    return payload['user_id']
```

### D) Protected route gatekeeper (actual)

Source: [backend/app.py](../backend/app.py#L189)

```python
def require_auth(f):
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        token_param = request.args.get('token')

        if not auth_header and not token_param:
            return jsonify({'error': 'No authorization header'}), 401

        if auth_header:
            token = auth_header.split(' ')[1]
        else:
            token = token_param

        user_id = auth_service.verify_token(token)
        return f(user_id, *args, **kwargs)

    decorated.__name__ = f.__name__
    return decorated
```

---

## 20) MongoDB Deep Mapping (What goes where)

### A) DB connection and database selection

Source: [backend/app.py](../backend/app.py#L68), [backend/app.py](../backend/app.py#L98)

```python
def connect_mongodb():
    local_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    atlas_uri = os.getenv('MONGODB_ATLAS_URI')
    ...

client = connect_mongodb()
db = client.snipx
```

### B) Collections used in auth module

1. Users collection
- Binding: [backend/services/auth_service.py](../backend/services/auth_service.py#L13)
- Used for signup/login/profile data.

2. Videos collection
- Used during account delete cleanup: [backend/services/auth_service.py](../backend/services/auth_service.py#L118)

3. Support tickets collection
- Used during account delete cleanup: [backend/services/auth_service.py](../backend/services/auth_service.py#L145)

### C) User document shape in MongoDB

After signup, user record typically has:

```json
{
  "_id": "ObjectId(...)",
  "email": "user@example.com",
  "password_hash": "<bcrypt-bytes>",
  "first_name": "Ali",
  "last_name": "Khan",
  "created_at": "2026-..."
}
```

Note:
- password_hash is stored, not plain password.
- `/api/auth/me` removes password fields before sending to frontend.

---

## 21) Chat Endpoint + Auth Relation

You asked "chat + mongodb + jwt" too, so here is current chat API behavior.

### A) Chat endpoint code

Source: [backend/app.py](../backend/app.py#L303)

```python
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({'error': 'Message is required'}), 400

    message = data['message']
    conversation_history = data.get('history', [])

    response = "I'm a basic chatbot..."
    return jsonify({
        'response': response,
        'timestamp': datetime.utcnow().isoformat()
    }), 200
```

### B) Important observation

Current `/api/chat` route:
- does not use `@require_auth`
- does not store chat history in MongoDB
- returns a static fallback response

So auth module and chat module are currently separate.

---

## 22) End-to-End API Examples (Request/Response)

### A) Register API example

Request:

```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "Ali",
  "lastName": "Khan",
  "email": "ali@example.com",
  "password": "Strong@123"
}
```

Response:

```json
{
  "message": "User registered successfully",
  "user_id": "662f..."
}
```

### B) Login API example

Request:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "ali@example.com",
  "password": "Strong@123"
}
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "662f...",
    "email": "ali@example.com",
    "firstName": "Ali",
    "lastName": "Khan"
  }
}
```

### C) Protected API call example using Bearer token

```http
GET /api/auth/me
Authorization: Bearer <jwt_token_here>
```

### D) JWT payload concept

Token payload generated by backend contains:

```json
{
  "user_id": "662f...",
  "exp": 1713500000
}
```

`exp` means expiry time. If expired, backend reject karega.

---

## 23) One-Line Flow Formula (Memorize)

UI form -> frontend handler -> API call -> Flask route -> AuthService -> MongoDB + bcrypt/JWT -> token to frontend -> localStorage -> Authorization Bearer on protected APIs.
