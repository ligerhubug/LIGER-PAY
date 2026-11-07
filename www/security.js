
/* =====================================
   LIGER-PAY ACCOUNT PROTECTION
   CUSTOM LOGOUT CONFIRMATION
===================================== */

(function () {
    "use strict";

    const SESSION_KEY = "ligerDemoSession";

    const protectedPages = [
        "wallet.html",
        "transfer.html",
        "receive.html",
        "history.html",
        "receipt.html",
        "account.html"
    ];

    const currentPage = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    if (!protectedPages.includes(currentPage)) {
        return;
    }

    // Check login session
    if (sessionStorage.getItem(SESSION_KEY) !== "active") {
        window.location.replace("login.html");
        return;
    }

    function createSecurityInterface() {

        if (document.getElementById("ligerLogoutButton")) {
            return;
        }

        // Logout button
        const logoutButton = document.createElement("button");

        logoutButton.id = "ligerLogoutButton";
        logoutButton.textContent = "Logout";

        logoutButton.style.cssText = `
            position:fixed;
            right:16px;
            bottom:20px;
            z-index:99998;
            background:#d5aa45;
            color:#101827;
            border:none;
            border-radius:30px;
            padding:14px 22px;
            font-size:15px;
            font-weight:bold;
            box-shadow:0 4px 14px #0008;
            cursor:pointer;
        `;

        document.body.appendChild(logoutButton);

        // Logout confirmation modal
        const modal = document.createElement("div");

        modal.id = "ligerLogoutModal";

        modal.style.cssText = `
            display:none;
            position:fixed;
            inset:0;
            z-index:999999;
            background:rgba(0,0,0,0.85);
            align-items:center;
            justify-content:center;
            padding:20px;
        `;

        modal.innerHTML = `
            <div style="
                width:100%;
                max-width:360px;
                background:#172235;
                border:2px solid #d5aa45;
                border-radius:18px;
                padding:24px;
                color:white;
                text-align:center;
                font-family:Arial,sans-serif;
            ">

                <h2 style="color:#e3bd65;margin-top:0;">
                    Logout?
                </h2>

                <p style="
                    color:#c3ccda;
                    line-height:1.6;
                    font-size:14px;
                ">
                    Are you sure you want to logout of LIGER-PAY?
                </p>

                <div style="
                    display:flex;
                    gap:12px;
                    margin-top:25px;
                ">

                    <button id="cancelLogout" style="
                        flex:1;
                        padding:14px;
                        border:none;
                        border-radius:10px;
                        background:#293a52;
                        color:white;
                        font-weight:bold;
                        font-size:14px;
                    ">
                        Cancel
                    </button>

                    <button id="confirmLogout" style="
                        flex:1;
                        padding:14px;
                        border:none;
                        border-radius:10px;
                        background:#d5aa45;
                        color:#101827;
                        font-weight:bold;
                        font-size:14px;
                    ">
                        Yes, Logout
                    </button>

                </div>
            </div>
        `;

        document.body.appendChild(modal);

        logoutButton.addEventListener("click", function () {
            modal.style.display = "flex";
        });

        document.getElementById("cancelLogout")
            .addEventListener("click", function () {
                modal.style.display = "none";
            });

        document.getElementById("confirmLogout")
            .addEventListener("click", function () {

                sessionStorage.removeItem(SESSION_KEY);

                window.location.replace("login.html");
            });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            createSecurityInterface
        );
    } else {
        createSecurityInterface();
    }

})();
