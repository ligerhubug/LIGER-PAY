
/* =====================================
   LIGER-PAY APPLICATION
   LOCAL DEMONSTRATION VERSION
===================================== */

const DEMO_BALANCE_KEY = "ligerDemoBalance";
const DEMO_TRANSACTIONS_KEY = "ligerDemoTransactions";
const DEMO_PROFILE_KEY = "ligerDemoProfile";

const SESSION_KEY = "ligerDemoSession";

let walletAction = "";

/* =====================================
   GENERAL NOTIFICATIONS
===================================== */

function showMessage(text) {
    const message = document.getElementById("message");

    if (!message) {
        alert(text);
        return;
    }

    message.textContent = text;
    message.style.display = "block";

    setTimeout(() => {
        message.style.display = "none";
    }, 2500);
}

/* =====================================
   PASSWORD VISIBILITY
===================================== */

function togglePassword(id, button) {
    const field = document.getElementById(id);

    if (!field) return;

    if (field.type === "password") {
        field.type = "text";
        button.textContent = "Hide";
    } else {
        field.type = "password";
        button.textContent = "Show";
    }
}

/* =====================================
   PASSWORD SECURITY
   PBKDF2 + SHA-256
===================================== */

function bytesToBase64(bytes) {
    let binary = "";

    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary);
}

function base64ToBytes(value) {
    const binary = atob(value);

    return Uint8Array.from(binary, char =>
        char.charCodeAt(0)
    );
}

async function createPasswordHash(password, salt) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error(
            "Secure password hashing is unavailable. Open the project using a secure local preview or HTTPS browser."
        );
    }

    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 210000,
            hash: "SHA-256"
        },
        keyMaterial,
        256
    );

    return new Uint8Array(derivedBits);
}

async function verifyPassword(password, profile) {
    if (!profile || !profile.passwordHash || !profile.passwordSalt) {
        return false;
    }

    const salt = base64ToBytes(profile.passwordSalt);

    const calculatedHash = await createPasswordHash(
        password,
        salt
    );

    const savedHash = base64ToBytes(profile.passwordHash);

    if (calculatedHash.length !== savedHash.length) {
        return false;
    }

    let difference = 0;

    for (let i = 0; i < calculatedHash.length; i++) {
        difference |= calculatedHash[i] ^ savedHash[i];
    }

    return difference === 0;
}

/* =====================================
   SAFE PROFILE READING
===================================== */

function getDemoProfile() {
    try {
        return JSON.parse(
            localStorage.getItem(DEMO_PROFILE_KEY) || "null"
        );
    } catch (error) {
        return null;
    }
}

/* =====================================
   DEMO REGISTRATION
===================================== */

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const name = document.getElementById("fullName").value.trim();

        const phone = document.getElementById("registerPhone").value.trim();

        const password = document.getElementById("registerPassword").value;

        const confirm = document.getElementById("confirmPassword").value;

        if (!name || !phone || !password || !confirm) {
            alert("Please complete all fields.");
            return;
        }

        const validPhone = /^(0\d{9}|\+?256\d{9})$/.test(phone);

        if (!validPhone) {
            alert("Enter a valid Ugandan phone number.");
            return;
        }

        if (password.length < 8) {
            alert("Password must have at least 8 characters.");
            return;
        }

        if (password.length > 128) {
            alert("Password is too long.");
            return;
        }

        if (password !== confirm) {
            alert("Passwords do not match.");
            return;
        }

        const submitButton = registerForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Creating Account...";
        }

        try {

            const salt = crypto.getRandomValues(
                new Uint8Array(16)
            );

            const passwordHash = await createPasswordHash(
                password,
                salt
            );

            const profile = {
                name: name,
                phone: phone,
                passwordSalt: bytesToBase64(salt),
                passwordHash: bytesToBase64(passwordHash),
                createdAt: new Date().toISOString()
            };

            const previousProfile = getDemoProfile();

            localStorage.setItem(
                DEMO_PROFILE_KEY,
                JSON.stringify(profile)
            );

            // Initialize wallet only if this is a new demo account.
            if (!previousProfile) {
                localStorage.setItem(DEMO_BALANCE_KEY, "0");
                localStorage.setItem(DEMO_TRANSACTIONS_KEY, "[]");
            }

            alert("Demo account created successfully! You can now sign in.");

            window.location.href = "login.html";

        } catch (error) {

            alert(error.message || "Account creation failed. Try again.");

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Create Account";
            }
        }
    });
}

/* =====================================
   DEMO LOGIN
===================================== */

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const phone = document.getElementById("loginPhone").value.trim();

        const password = document.getElementById("loginPassword").value;

        if (!phone || !password) {
            alert("Enter your phone number and password.");
            return;
        }

        const profile = getDemoProfile();

        if (!profile || profile.phone !== phone) {
            alert("No matching demo account. Please register first.");
            return;
        }

        if (!profile.passwordHash || !profile.passwordSalt) {
            alert(
                "This account was created before the security update. Please create a new demo account."
            );
            return;
        }

        const submitButton = loginForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Verifying...";
        }

        try {

            const passwordCorrect = await verifyPassword(
                password,
                profile
            );

            if (!passwordCorrect) {
                alert("Incorrect password. Please try again.");
                return;
            }

            sessionStorage.setItem(SESSION_KEY, "active");

            alert("Demo login successful!");

            window.location.href = "index.html";

        } catch (error) {

            alert(error.message || "Login failed. Please try again.");

        } finally {

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Sign In";
            }
        }
    });
}

/* =====================================
   WALLET DATA
===================================== */

function getWalletBalance() {
    const value = Number(
        localStorage.getItem(DEMO_BALANCE_KEY) || 0
    );

    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function getWalletTransactions() {
    try {
        const transactions = JSON.parse(
            localStorage.getItem(DEMO_TRANSACTIONS_KEY) || "[]"
        );

        return Array.isArray(transactions) ? transactions : [];

    } catch (error) {
        return [];
    }
}

function saveWalletData(balance, transactions) {
    localStorage.setItem(DEMO_BALANCE_KEY, String(balance));

    localStorage.setItem(
        DEMO_TRANSACTIONS_KEY,
        JSON.stringify(transactions)
    );
}

function formatUGX(amount) {
    return "UGX " + new Intl.NumberFormat("en-UG").format(amount);
}

/* =====================================
   TRANSACTION REFERENCES
===================================== */

function createReference() {
    return "LGP" +
        Date.now().toString() +
        Math.floor(Math.random() * 900 + 100);
}

/* =====================================
   UPDATE WALLET DISPLAY
===================================== */

function updateWalletDisplay() {

    const balanceElement = document.getElementById("walletBalance");

    if (balanceElement) {
        balanceElement.textContent = formatUGX(getWalletBalance());
    }

    renderWalletTransactions();
}

/* =====================================
   OPEN WALLET MODAL
===================================== */

function openWalletModal(action) {

    walletAction = action;

    const modal = document.getElementById("walletModal");

    const title = document.getElementById("modalTitle");

    const amount = document.getElementById("walletAmount");

    if (!modal || !title || !amount) return;

    if (action === "deposit") {
        title.textContent = "Add Demo Funds";
    } else {
        title.textContent = "Withdraw Demo Funds";
    }

    amount.value = "";

    modal.style.display = "flex";
}

/* =====================================
   CLOSE WALLET MODAL
===================================== */

function closeWalletModal() {

    const modal = document.getElementById("walletModal");

    if (modal) {
        modal.style.display = "none";
    }

    walletAction = "";
}

/* =====================================
   PROCESS DEMO TRANSACTION
===================================== */

const walletForm = document.getElementById("walletForm");

if (walletForm) {

    walletForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const amount = Number(
            document.getElementById("walletAmount").value
        );

        if (
            !Number.isSafeInteger(amount) ||
            amount <= 0 ||
            amount > 100000000
        ) {
            alert("Enter a valid whole amount between UGX 1 and UGX 100,000,000.");
            return;
        }

        let balance = getWalletBalance();

        const transactions = getWalletTransactions();

        if (walletAction === "deposit") {

            balance += amount;

        } else if (walletAction === "withdraw") {

            if (amount > balance) {
                alert("Insufficient demo wallet balance.");
                return;
            }

            balance -= amount;

        } else {

            alert("Invalid wallet action.");
            return;
        }

        const transaction = {
            reference: createReference(),
            type: walletAction,
            amount: amount,
            date: new Date().toLocaleString(),
            status: "DEMO COMPLETED"
        };

        transactions.unshift(transaction);

        saveWalletData(balance, transactions);

        updateWalletDisplay();

        closeWalletModal();

        alert(
            "Demo transaction completed!\n" +
            "Amount: " + formatUGX(amount) +
            "\nNew balance: " + formatUGX(balance)
        );
    });
}

/* =====================================
   DISPLAY TRANSACTION HISTORY
===================================== */

function renderWalletTransactions() {

    const list = document.getElementById("walletTransactions");

    if (!list) return;

    const transactions = getWalletTransactions();

    if (transactions.length === 0) {

        list.innerHTML =
            '<p class="empty">No transactions yet.</p>';

        return;
    }

    list.innerHTML = "";

    transactions.forEach(function(transaction) {

        const row = document.createElement("div");

        row.className = "transaction";

        const info = document.createElement("div");

        info.className = "transaction-info";

        const title = document.createElement("strong");

        title.textContent =
            transaction.type === "deposit"
                ? "Demo Deposit"
                : transaction.type === "withdrawal"
                ? "Demo Withdrawal"
                : "Demo Transfer";

        const details = document.createElement("small");

        details.textContent =
            transaction.date + " · " + transaction.reference;

        const amount = document.createElement("span");

        amount.className =
            "amount " +
            (transaction.type === "deposit" ? "credit" : "debit");

        amount.textContent =
            (transaction.type === "deposit" ? "+" : "-") +
            formatUGX(transaction.amount);

        info.appendChild(title);

        info.appendChild(details);

        row.appendChild(info);

        row.appendChild(amount);

        list.appendChild(row);
    });
}

/* =====================================
   DASHBOARD INITIALIZATION
===================================== */

document.addEventListener("DOMContentLoaded", function() {

    updateWalletDisplay();

    const balance = document.getElementById("balance");

    if (balance) {
        balance.textContent = formatUGX(getWalletBalance());
    }

    const profile = getDemoProfile();

    const welcome = document.querySelector(".welcome");

    if (profile && welcome) {

        const paragraph = welcome.querySelector("p");

        if (paragraph) {
            paragraph.textContent =
                "WELCOME, " + profile.name.toUpperCase();
        }
    }
});
