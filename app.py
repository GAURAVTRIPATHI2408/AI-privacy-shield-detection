from flask import Flask, render_template, request, redirect, url_for, session, flash
import sqlite3
import hashlib
import os

app = Flask(__name__)

# ==========================================
# SECRET KEY
# ==========================================

app.secret_key = os.environ.get(
    "SECRET_KEY",
    "ai_privacy_shield_secret_2026"
)

# ==========================================
# DATABASE PATH
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "database.db")


# ==========================================
# DATABASE CONNECTION
# ==========================================

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


# ==========================================
# INITIALIZE DATABASE
# ==========================================

def init_db():

    conn = get_db()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


# IMPORTANT:
# Render/Gunicorn app load karte waqt bhi database create ho
init_db()


# ==========================================
# HOME
# ==========================================

@app.route("/")
def home():

    if "user_id" in session:
        return redirect(url_for("dashboard"))

    return redirect(url_for("register"))


# ==========================================
# REGISTER
# ==========================================

@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        # Check empty fields
        if not name or not email or not password:

            flash(
                "Please fill all fields.",
                "error"
            )

            return redirect(url_for("register"))

        # Password hash
        hashed_password = hashlib.sha256(
            password.encode("utf-8")
        ).hexdigest()

        conn = get_db()

        try:

            conn.execute(
                """
                INSERT INTO users
                (name, email, password)
                VALUES (?, ?, ?)
                """,
                (
                    name,
                    email,
                    hashed_password
                )
            )

            conn.commit()
            conn.close()

            flash(
                "Registration successful! Please login.",
                "success"
            )

            return redirect(url_for("login"))

        except sqlite3.IntegrityError:

            conn.close()

            flash(
                "This email is already registered.",
                "error"
            )

            return redirect(url_for("register"))

        except Exception as e:

            conn.close()

            print("REGISTER ERROR:", e)

            flash(
                "Registration failed.",
                "error"
            )

            return redirect(url_for("register"))

    return render_template("register.html")


# ==========================================
# LOGIN
# ==========================================

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form.get(
            "email",
            ""
        ).strip().lower()

        password = request.form.get(
            "password",
            ""
        )

        # Empty fields
        if not email or not password:

            flash(
                "Please enter email and password.",
                "error"
            )

            return redirect(url_for("login"))

        # Hash password
        hashed_password = hashlib.sha256(
            password.encode("utf-8")
        ).hexdigest()

        conn = get_db()

        try:

            user = conn.execute(
                """
                SELECT *
                FROM users
                WHERE email = ?
                AND password = ?
                """,
                (
                    email,
                    hashed_password
                )
            ).fetchone()

            conn.close()

        except Exception as e:

            conn.close()

            print("LOGIN DATABASE ERROR:", e)

            flash(
                "Database error. Please try again.",
                "error"
            )

            return redirect(url_for("login"))

        # User found
        if user:

            session.clear()

            session["user_id"] = user["id"]
            session["user_name"] = user["name"]
            session["user_email"] = user["email"]

            print(
                "LOGIN SUCCESS:",
                user["email"]
            )

            return redirect(
                url_for("dashboard")
            )

        # Wrong credentials
        flash(
            "Invalid email or password.",
            "error"
        )

        return redirect(
            url_for("login")
        )

    return render_template("login.html")


# ==========================================
# DASHBOARD
# ==========================================

@app.route("/dashboard")
def dashboard():

    # Login check
    if "user_id" not in session:

        return redirect(
            url_for("login")
        )

    # Dashboard open
    return render_template(
        "dashboard.html",
        user_name=session.get(
            "user_name",
            "User"
        ),
        user_email=session.get(
            "user_email",
            ""
        )
    )


# ==========================================
# LOGOUT
# ==========================================

@app.route("/logout")
def logout():

    session.clear()

    flash(
        "You have been logged out.",
        "success"
    )

    return redirect(
        url_for("login")
    )


# ==========================================
# HEALTH CHECK
# ==========================================

@app.route("/health")
def health():

    return {
        "status": "ok",
        "application": "AI Privacy Shield"
    }


# ==========================================
# ERROR HANDLER
# ==========================================

@app.errorhandler(500)
def internal_error(error):

    print(
        "INTERNAL SERVER ERROR:",
        error
    )

    return """
    <h1>AI Privacy Shield</h1>
    <h2>Internal Server Error</h2>
    <p>Please check the Render logs.</p>
    """, 500


# ==========================================
# LOCAL SERVER
# ==========================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )

    print("======================================")
    print("       AI PRIVACY SHIELD")
    print("======================================")
    print("Server starting...")
    print("Port:", port)
    print("======================================")

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )