from dotenv import load_dotenv
from neo4j import GraphDatabase
import os

load_dotenv()

URI = os.getenv("COGNODB_URI")
USERNAME = os.getenv("COGNODB_USERNAME")
PASSWORD = os.getenv("COGNODB_PASSWORD")

driver = GraphDatabase.driver(
    URI,
    auth=(USERNAME, PASSWORD)
)


def seed_database():

    with driver.session() as session:

        session.run("""
            // Skills
            MERGE (cpp:Skill {name: 'C++'})
            MERGE (python:Skill {name: 'Python'})
            MERGE (sql:Skill {name: 'SQL'})
            MERGE (java:Skill {name: 'Java'})
            MERGE (oops:Skill {name: 'OOP'})
            MERGE (ds:Skill {name: 'Data Structures'})
            MERGE (git:Skill {name: 'Git'})
            MERGE (flask:Skill {name: 'Flask'})
            MERGE (ml:Skill {name: 'Machine Learning'})

            // Jobs
            MERGE (software:Job {name: 'Software Engineer'})
            MERGE (data:Job {name: 'Data Analyst'})
            MERGE (backend:Job {name: 'Backend Developer'})
            MERGE (mljob:Job {name: 'Machine Learning Engineer'})

            // Projects
            MERGE (bank:Project {name: 'Bank Management System'})
            MERGE (snake:Project {name: 'Snake Game'})
            MERGE (social:Project {name: 'AI Social Media Generator'})
            MERGE (nids:Project {name: 'Network Intrusion Detection System'})
            MERGE (web:Project {name: 'CareerGraph'})

            // Companies
            MERGE (tcs:Company {name: 'TCS'})
            MERGE (infosys:Company {name: 'Infosys'})
            MERGE (accenture:Company {name: 'Accenture'})

            // Courses
            MERGE (cppcourse:Course {name: 'Object-Oriented Programming in C++'})
            MERGE (pythoncourse:Course {name: 'Python Programming'})
            MERGE (mlcourse:Course {name: 'Machine Learning Fundamentals'})

            // Job -> Skill
            MERGE (software)-[:REQUIRES]->(cpp)
            MERGE (software)-[:REQUIRES]->(oops)
            MERGE (software)-[:REQUIRES]->(ds)
            MERGE (software)-[:REQUIRES]->(git)
            MERGE (software)-[:REQUIRES]->(sql)

            MERGE (data)-[:REQUIRES]->(python)
            MERGE (data)-[:REQUIRES]->(sql)
            MERGE (data)-[:REQUIRES]->(git)

            MERGE (backend)-[:REQUIRES]->(python)
            MERGE (backend)-[:REQUIRES]->(sql)
            MERGE (backend)-[:REQUIRES]->(flask)
            MERGE (backend)-[:REQUIRES]->(git)

            MERGE (mljob)-[:REQUIRES]->(python)
            MERGE (mljob)-[:REQUIRES]->(ml)
            MERGE (mljob)-[:REQUIRES]->(sql)

            // Project -> Skill
            MERGE (bank)-[:USES]->(cpp)
            MERGE (bank)-[:USES]->(oops)
            MERGE (bank)-[:USES]->(sql)

            MERGE (snake)-[:USES]->(cpp)
            MERGE (snake)-[:USES]->(oops)

            MERGE (social)-[:USES]->(python)
            MERGE (social)-[:USES]->(ml)

            MERGE (nids)-[:USES]->(python)
            MERGE (nids)-[:USES]->(ml)
            MERGE (nids)-[:USES]->(sql)

            MERGE (web)-[:USES]->(python)
            MERGE (web)-[:USES]->(flask)
            MERGE (web)-[:USES]->(sql)

            // Company -> Job
            MERGE (tcs)-[:HIRES_FOR]->(software)
            MERGE (tcs)-[:HIRES_FOR]->(data)

            MERGE (infosys)-[:HIRES_FOR]->(software)
            MERGE (infosys)-[:HIRES_FOR]->(backend)

            MERGE (accenture)-[:HIRES_FOR]->(data)
            MERGE (accenture)-[:HIRES_FOR]->(mljob)

            // Course -> Skill
            MERGE (cppcourse)-[:TEACHES]->(cpp)
            MERGE (cppcourse)-[:TEACHES]->(oops)

            MERGE (pythoncourse)-[:TEACHES]->(python)

            MERGE (mlcourse)-[:TEACHES]->(ml)
            MERGE (mlcourse)-[:TEACHES]->(python)

            // Related skills
            MERGE (cpp)-[:RELATED_TO]->(oops)
            MERGE (oops)-[:RELATED_TO]->(ds)
            MERGE (python)-[:RELATED_TO]->(ml)
            MERGE (python)-[:RELATED_TO]->(flask)
            MERGE (sql)-[:RELATED_TO]->(python)
        """)

        print("Database seeded successfully!")


try:
    driver.verify_connectivity()

    print("Connected to CognoDB successfully!")

    seed_database()

except Exception as e:
    print("Database error:", e)

finally:
    driver.close()