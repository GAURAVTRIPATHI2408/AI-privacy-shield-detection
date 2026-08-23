from flask import Flask, render_template, request, redirect, url_for, session, flash
import sqlite3
import hashlib

app = Flask(__name__)

app.secret_key = "ai_privacy_shield_secret_2026"

DATABASE = "database.db"


# ==========================================
# DATABASE
# ==========================================

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


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

    # Registration form submit hua
    if request.method == "POST":

        name = request.form.get("name", "").strip()

        email = request.form.get("email", "").strip().lower()

        password = request.form.get("password", "")


        # Empty field check
        if not name or not email or not password:

            flash(
                "Please fill all fields.",
                "error"
            )

            return redirect(url_for("register"))


        # Password hash
        hashed_password = hashlib.sha256(
            password.encode()
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


    # ======================================
    # IMPORTANT
    # GET REQUEST KE LIYE YE RETURN HAI
    # ======================================

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


        if not email or not password:

            flash(
                "Please enter email and password.",
                "error"
            )

            return redirect(url_for("login"))


        hashed_password = hashlib.sha256(
            password.encode()
        ).hexdigest()


        conn = get_db()


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


        if user:

            session["user_id"] = user["id"]

            session["user_name"] = user["name"]

            session["user_email"] = user["email"]


            return redirect(
                url_for("dashboard")
            )


        flash(
            "Invalid email or password.",
            "error"
        )

        return redirect(
            url_for("login")
        )


    # GET request
    return render_template("login.html")


# ==========================================
# DASHBOARD
# ==========================================

@app.route("/dashboard")
def dashboard():

    if "user_id" not in session:

        return redirect(
            url_for("login")
        )


    return render_template(
        "dashboard.html",

        user_name=session.get(
            "user_name"
        ),

        user_email=session.get(
            "user_email"
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
# START SERVER
# ==========================================

if __name__ == "__main__":

    init_db()

    print("")
    print("======================================")
    print("        AI PRIVACY SHIELD")
    print("======================================")
    print("")
    print("Server running at:")
    print("http://127.0.0.1:5000")
    print("")
    print("Flow:")
    print("Register -> Login -> Dashboard")
    print("")
    print("======================================")


    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )