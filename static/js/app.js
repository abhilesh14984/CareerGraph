/* =========================================================
   CAREERGRAPH - MAIN JAVASCRIPT
========================================================= */


/* =========================================================
   SEARCH SKILL
========================================================= */

async function searchSkill() {

    const input = document.getElementById("skillInput");

    const skill = input.value.trim();

    if (!skill) {
        showMessage("Please enter a skill.");
        return;
    }

    await fetchSkill(skill);
}


/* =========================================================
   POPULAR SKILL SEARCH
========================================================= */

async function searchPopularSkill(skill) {

    const input = document.getElementById("skillInput");

    input.value = skill;

    await fetchSkill(skill);
}


/* =========================================================
   ENTER KEY SEARCH
========================================================= */

function handleSearchKey(event) {

    if (event.key === "Enter") {
        searchSkill();
    }
}


/* =========================================================
   FETCH DATA FROM FLASK API
========================================================= */

async function fetchSkill(skill) {

    const loading =
        document.getElementById("loading");

    const empty =
        document.getElementById("empty");

    const results =
        document.getElementById("results");

    const resultCards =
        document.getElementById("resultCards");

    const resultTitle =
        document.getElementById("resultTitle");


    /* Reset previous results */

    loading.classList.remove("hidden");

    empty.classList.add("hidden");

    results.classList.add("hidden");

    resultCards.innerHTML = "";


    try {

        const response = await fetch(
            `/api/search?skill=${encodeURIComponent(skill)}`
        );


        const result = await response.json();


        loading.classList.add("hidden");


        /* API error */

        if (!response.ok || !result.success) {

            showMessage(
                result.message ||
                "Something went wrong."
            );

            return;
        }


        /* No data */

        if (!result.data) {

            empty.textContent =
                `No connections found for "${skill}".`;

            empty.classList.remove("hidden");

            return;
        }


        const data = result.data;


        /* =================================================
           RESULT TITLE
        ================================================= */

        resultTitle.textContent =
            `Career Connections for ${data.skill}`;


        /* =================================================
           PROJECTS
        ================================================= */

        if (
            data.projects &&
            data.projects.length > 0
        ) {

            const projectHeading =
                document.createElement("h3");

            projectHeading.textContent =
                "Projects using this skill";

            projectHeading.className =
                "result-section-title";


            resultCards.appendChild(
                projectHeading
            );


            const projectGrid =
                document.createElement("div");

            projectGrid.className =
                "result-grid";


            data.projects.forEach(
                project => {

                    const card =
                        document.createElement("div");

                    card.className =
                        "result-card";


                    card.innerHTML = `

                        <div class="project">
                            ${escapeHTML(project)}
                        </div>

                        <div class="skill">
                            Uses ${escapeHTML(data.skill)}
                        </div>

                    `;


                    projectGrid.appendChild(card);
                }
            );


            resultCards.appendChild(
                projectGrid
            );
        }


        /* =================================================
           GROUP CAREERS BY JOB
        ================================================= */

        const groupedCareers = {};


        if (data.careers) {

            data.careers.forEach(
                career => {

                    const job =
                        career.job;


                    if (!groupedCareers[job]) {

                        groupedCareers[job] = {

                            job: job,

                            companies: []
                        };
                    }


                    if (
                        career.company &&
                        !groupedCareers[job]
                            .companies
                            .includes(
                                career.company
                            )
                    ) {

                        groupedCareers[job]
                            .companies
                            .push(
                                career.company
                            );
                    }

                }
            );
        }


        const careers =
            Object.values(groupedCareers);


        /* =================================================
           CAREER CARDS
        ================================================= */

        if (careers.length > 0) {

            const careerHeading =
                document.createElement("h3");

            careerHeading.textContent =
                "Career opportunities";

            careerHeading.className =
                "result-section-title";


            resultCards.appendChild(
                careerHeading
            );


            const careerGrid =
                document.createElement("div");

            careerGrid.className =
                "result-grid";


            careers.forEach(
                career => {

                    const card =
                        document.createElement("div");

                    card.className =
                        "result-card";


                    const companies =
                        career.companies.length > 0

                        ? career.companies
                            .map(
                                company => `
                                    <span class="company-tag">
                                        ${escapeHTML(company)}
                                    </span>
                                `
                            )
                            .join("")

                        : `
                            <span class="skill">
                                Company information unavailable
                            </span>
                        `;


                    card.innerHTML = `

                        <div class="project">
                            ${escapeHTML(career.job)}
                        </div>

                        <div class="job">
                            ${escapeHTML(data.skill)}
                            →
                            ${escapeHTML(career.job)}
                        </div>

                        <div class="skill">
                            Hiring companies:
                        </div>

                        <div class="company-list">
                            ${companies}
                        </div>

                    `;


                    careerGrid.appendChild(card);

                }
            );


            resultCards.appendChild(
                careerGrid
            );
        }


        /* =================================================
           NO CONNECTIONS
        ================================================= */

        if (
            (!data.projects ||
             data.projects.length === 0) &&
            careers.length === 0
        ) {

            empty.textContent =
                `No connections found for "${skill}".`;

            empty.classList.remove("hidden");

            return;
        }


        /* =================================================
           SHOW RESULTS
        ================================================= */

        results.classList.remove("hidden");


        /* =================================================
           BUILD KNOWLEDGE GRAPH
        ================================================= */

        buildCareerGraph(data);


        /* Scroll to results */

        results.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    catch (error) {

        loading.classList.add("hidden");


        showMessage(
            "Unable to connect to the CareerGraph server."
        );


        console.error(
            "CareerGraph error:",
            error
        );
    }
}


/* =========================================================
   BUILD CAREER GRAPH
========================================================= */

function buildCareerGraph(data) {

    const container = document.getElementById("careerGraph");

    if (!container) {
        return;
    }

    const nodes = [];
    const edges = [];

    /* =====================================================
       CENTRAL SKILL
    ===================================================== */

    const skillId = `skill-${data.skill}`;

    nodes.push({
        id: skillId,
        label: data.skill,
        group: "skill",
        size: 40,
        font: {
            color: "#ffffff",
            size: 22,
            face: "Arial",
            bold: true
        }
    });


    /* =====================================================
       PROJECTS
    ===================================================== */

    if (data.projects) {

        data.projects.forEach((project, index) => {

            const projectId =
                `project-${index}-${project}`;

            nodes.push({
                id: projectId,
                label: project,
                group: "project",
                size: 28,
                font: {
                    color: "#ffffff",
                    size: 14,
                    face: "Arial",
                    bold: true
                }
            });

            edges.push({
                from: skillId,
                to: projectId,
                label: "USES",
                arrows: "to",
                color: {
                    color: "#d71920",
                    highlight: "#ff3333"
                },
                width: 2,
                font: {
                    color: "#d9a928",
                    size: 10,
                    face: "Arial",
                    strokeWidth: 0
                }
            });

        });
    }


    /* =====================================================
       JOBS + COMPANIES
    ===================================================== */

    if (data.careers) {

        data.careers.forEach((career, jobIndex) => {

            const job = career.job;

            const jobId =
                `job-${jobIndex}-${job}`;


            /* =============================================
               JOB NODE
            ============================================= */

            nodes.push({

                id: jobId,

                label: job,

                group: "job",

                size: 30,

                font: {

                    color: "#ffffff",

                    size: 16,

                    face: "Arial",

                    bold: true
                }

            });


            /* =============================================
               SKILL → JOB
            ============================================= */

            edges.push({

                from: skillId,

                to: jobId,

                label: "REQUIRED FOR",

                arrows: "to",

                color: {

                    color: "#d9a928",

                    highlight: "#f0c34e"
                },

                width: 2,

                font: {

                    color: "#d9a928",

                    size: 9,

                    face: "Arial",

                    strokeWidth: 0
                }

            });


            /* =============================================
               COMPANIES
            ============================================= */

            if (career.companies) {

                career.companies.forEach(
                    (company, companyIndex) => {

                        const companyId =
                            `company-${jobIndex}-${companyIndex}-${company}`;


                        /* ---------------------------------
                           COMPANY NODE
                        --------------------------------- */

                        nodes.push({

                            id: companyId,

                            label: company,

                            group: "company",

                            size: 22,

                            font: {

                                color: "#ffffff",

                                size: 13,

                                face: "Arial",

                                bold: true
                            }

                        });


                        /* ---------------------------------
                           COMPANY → JOB
                        --------------------------------- */

                        edges.push({

                            from: jobId,

                            to: companyId,

                            label: "HIRED BY",

                            arrows: "to",

                            color: {

                                color: "#8f6a16",

                                highlight: "#d9a928"
                            },

                            width: 1.5,

                            font: {

                                color: "#d9a928",

                                size: 9,

                                face: "Arial",

                                strokeWidth: 0
                            }

                        });

                    }
                );
            }

        });
    }


    /* =====================================================
       GRAPH DATA
    ===================================================== */

    const graphData = {

        nodes: new vis.DataSet(nodes),

        edges: new vis.DataSet(edges)

    };


    /* =====================================================
       GRAPH OPTIONS
    ===================================================== */

    const options = {

        autoResize: true,


        /* PHYSICS */

        physics: {

            enabled: true,

            stabilization: {

                enabled: true,

                iterations: 300,

                fit: true

            },

            barnesHut: {

                gravitationalConstant: -8000,

                centralGravity: 0.20,

                springLength: 230,

                springConstant: 0.035,

                damping: 0.09,

                avoidOverlap: 1

            }

        },


        /* NODES */

        nodes: {

            shape: "dot",

            borderWidth: 2,

            shadow: {

                enabled: true,

                size: 10,

                x: 0,

                y: 4

            }

        },


        /* =================================================
           GROUP COLORS
        ================================================= */

        groups: {

            /* GOLD - SKILL */

            skill: {

                color: {

                    background: "#d9a928",

                    border: "#f5d36a",

                    highlight: {

                        background: "#f0c34e",

                        border: "#ffffff"

                    }

                }

            },


            /* RED - PROJECT */

            project: {

                color: {

                    background: "#d71920",

                    border: "#ff4b50",

                    highlight: {

                        background: "#e51b23",

                        border: "#ffffff"

                    }

                }

            },


            /* BLACK + GOLD - JOB */

            job: {

                color: {

                    background: "#111111",

                    border: "#d9a928",

                    highlight: {

                        background: "#222222",

                        border: "#f0c34e"

                    }

                }

            },


            /* DARK + GOLD - COMPANY */

            company: {

                color: {

                    background: "#080808",

                    border: "#8f6a16",

                    highlight: {

                        background: "#1c1c1c",

                        border: "#d9a928"

                    }

                }

            }

        },


        /* =================================================
           EDGES
        ================================================= */

        edges: {

            width: 2,

            selectionWidth: 3,

            smooth: {

                type: "dynamic",

                roundness: 0.25

            },

            arrows: {

                to: {

                    enabled: true,

                    scaleFactor: 0.7

                }

            },

            font: {

                color: "#d9a928",

                size: 9,

                face: "Arial",

                strokeWidth: 0

            }

        },


        /* =================================================
           INTERACTION
        ================================================= */

        interaction: {

            hover: true,

            tooltipDelay: 100,

            navigationButtons: true,

            keyboard: true,

            zoomView: true,

            dragView: true,

            dragNodes: true

        },


        /* =================================================
           LAYOUT
        ================================================= */

        layout: {

            improvedLayout: true,

            randomSeed: 42

        }

    };


    /* =====================================================
       CLEAR OLD GRAPH
    ===================================================== */

    container.innerHTML = "";


    /* =====================================================
       CREATE NETWORK
    ===================================================== */

    const network = new vis.Network(

        container,

        graphData,

        options

    );


    /* =====================================================
       FIT GRAPH AFTER LOADING
    ===================================================== */

    network.once(
        "stabilizationIterationsDone",
        function () {

            network.fit({

                animation: {

                    duration: 800,

                    easingFunction:
                        "easeInOutQuad"

                }

            });

        }
    );


    /* =====================================================
       CLICK NODE
    ===================================================== */

    network.on(
        "selectNode",
        function (params) {

            if (
                params.nodes &&
                params.nodes.length > 0
            ) {

                network.focus(

                    params.nodes[0],

                    {

                        scale: 1.15,

                        animation: {

                            duration: 500,

                            easingFunction:
                                "easeInOutQuad"

                        }

                    }

                );

            }

        }
    );

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message) {

    const empty =
        document.getElementById(
            "empty"
        );


    empty.textContent =
        message;


    empty.classList.remove(
        "hidden"
    );
}


/* =========================================================
   HTML ESCAPE
   Prevents HTML injection from database values
========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;
}