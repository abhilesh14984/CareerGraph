from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from neo4j import GraphDatabase
import os

load_dotenv()

app = Flask(__name__)


# =========================================================
# COGNODB CONNECTION
# =========================================================

URI = os.getenv("COGNODB_URI")
USERNAME = os.getenv("COGNODB_USERNAME")
PASSWORD = os.getenv("COGNODB_PASSWORD")

driver = GraphDatabase.driver(
    URI,
    auth=(USERNAME, PASSWORD)
)


# =========================================================
# HOME PAGE
# =========================================================

@app.route("/")
def home():
    return render_template("index.html")


# =========================================================
# SEARCH API
# =========================================================

@app.route("/api/search")
def search():

    skill = request.args.get("skill", "").strip()

    if not skill:
        return jsonify({
            "success": False,
            "message": "Please enter a skill."
        }), 400

    try:

        with driver.session() as session:

            # -------------------------------------------------
            # FIND SKILL
            # -------------------------------------------------

            skill_result = session.run("""
                MATCH (s:Skill)
                WHERE toLower(s.name) = toLower($skill)
                RETURN s.name AS skill
            """, skill=skill)

            skill_record = skill_result.single()

            if not skill_record:

                return jsonify({
                    "success": True,
                    "data": None
                })


            actual_skill = skill_record["skill"]


            # -------------------------------------------------
            # FIND PROJECTS USING THE SKILL
            # -------------------------------------------------

            project_result = session.run("""
                MATCH (p:Project)-[:USES]->(s:Skill)
                WHERE toLower(s.name) = toLower($skill)

                RETURN collect(DISTINCT p.name) AS projects
            """, skill=skill)


            project_record = project_result.single()

            projects = [
                project
                for project in project_record["projects"]
                if project
            ]


            # -------------------------------------------------
            # FIND CAREER OPPORTUNITIES
            # Skill -> Job -> Company
            # -------------------------------------------------

            career_result = session.run("""
                MATCH (s:Skill)
                    <-[:REQUIRES]-
                    (j:Job)

                OPTIONAL MATCH
                    (c:Company)-[:HIRES_FOR]->(j)

                WHERE toLower(s.name) = toLower($skill)

                RETURN
                    j.name AS job,
                    collect(DISTINCT c.name) AS companies

                ORDER BY j.name
            """, skill=skill)


            careers = []


            for record in career_result:

                companies = [
                    company
                    for company in record["companies"]
                    if company
                ]


                careers.append({

                    "job": record["job"],

                    "companies": companies

                })


            # -------------------------------------------------
            # FIND COMPLETE CAREER PATHS
            #
            # Skill
            #    ↓
            # Project
            #    ↓
            # Job
            #    ↓
            # Company
            # -------------------------------------------------

            path_result = session.run("""
                MATCH (p:Project)-[:USES]->(s:Skill)
                    <-[:REQUIRES]-
                    (j:Job)

                OPTIONAL MATCH
                    (c:Company)-[:HIRES_FOR]->(j)

                WHERE toLower(s.name) = toLower($skill)

                RETURN DISTINCT

                    s.name AS skill,

                    p.name AS project,

                    j.name AS job,

                    c.name AS company

                ORDER BY
                    j.name,
                    p.name
            """, skill=skill)


            career_paths = []


            for record in path_result:

                career_paths.append({

                    "skill": record["skill"],

                    "project": record["project"],

                    "job": record["job"],

                    "company": record["company"]

                })


            # -------------------------------------------------
            # REMOVE DUPLICATE CAREER PATHS
            # -------------------------------------------------

            unique_paths = []

            seen_paths = set()


            for path in career_paths:

                path_key = (

                    path["project"],

                    path["job"],

                    path["company"]

                )


                if path_key not in seen_paths:

                    seen_paths.add(path_key)

                    unique_paths.append(path)


            # -------------------------------------------------
            # RESPONSE
            # -------------------------------------------------

            return jsonify({

                "success": True,

                "data": {

                    "skill": actual_skill,

                    "projects": projects,

                    "careers": careers,

                    "career_paths": unique_paths

                }

            })


    except Exception as e:

        print("Database error:", e)

        return jsonify({

            "success": False,

            "message":
                "Unable to connect to the database."

        }), 500


# =========================================================
# APPLICATION START
# =========================================================

if __name__ == "__main__":

    try:

        driver.verify_connectivity()

        print(
            "Connected to CognoDB successfully!"
        )

        print(
            "CareerGraph application starting..."
        )

        app.run(debug=True)


    except Exception as e:

        print(
            "Database connection failed:",
            e
        )


    finally:

        driver.close()