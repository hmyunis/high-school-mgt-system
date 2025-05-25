# High School Management System

## Technologies used:
* Backend: Node Js. + SQLite (For Database)
* Frontend: React Js. + HeroUI (UI Library)

## 🚀 Getting Started: Easy Setup!

Here's how to get everything running:

**Step 1: Get the Helper Program (Node.js) 🛠️**
*   First, you need a helper program called **Node.js**.
*   If you don't have it, a quick search for "install Node.js" on the internet will show you how. Download and install it. ✅

**Step 2: Rename a Settings File 📝**
1.  Go into the `backend` folder on your computer.
2.  Look for a file named `.env.example`.
3.  Rename this file to just `.env` (remove the `.example` part).

**Step 3: Fill in Some Settings ⚙️**
1.  Open that new `.env` file with any simple text editor (like Notepad on Windows, or TextEdit on Mac).
2.  Make sure the text inside looks like this:
    ```
    PORT=3001
    JWT_SECRET=PMMM1BAHqZb0F0lZBw6nIWFBrW4qyO1gVmz63CkE/kE=
    JWT_EXPIRES_IN=1d
    ```
    *   **A little tip:**
        *   `JWT_SECRET` is like a secret password for the app. You can change the long string of characters to any other random letters and numbers if you want!
        *   `JWT_EXPIRES_IN` means how long your login lasts. `1d` is "1 day". You could change it to `10m` for "10 minutes" or `1h` for "1 hour". ⏳

**Step 4: Get Tools for the "Backend" (The Engine) ⚙️➡️📦**
1.  Open a special window called "Terminal" (on Mac/Linux) or "Command Prompt" (on Windows).
2.  In this window, type commands to go into the `backend` folder.
3.  Once you're "inside" the `backend` folder in your Terminal/Command Prompt, type this command and press Enter:
    ```bash
    npm install
    ```
    This tells your computer to download all the tools the backend needs. It might take a moment.

**Step 5: Start the "Backend" 🏃‍♂️**
1.  Once `npm install` is finished, in the *same* Terminal/Command Prompt window (still in the `backend` folder), type this command and press Enter:
    ```bash
    npm run dev
    ```
2.  This starts the "engine" part of the app. Keep this window open!

**Step 6: Get Tools & Start the "Frontend" (What You See) ✨➡️🖥️**
1.  Open a **NEW** Terminal (or Command Prompt) window.
2.  In this new window, go into the `frontend` folder.
3.  First, get its tools. Type this and press Enter:
    ```bash
    npm install
    ```
4.  When that's done, start the "frontend" part. Type this and press Enter:
    ```bash
    npm run dev
    ```
5.  This starts the part of the app you'll see and interact with. You leave this window open too!

**Step 7: Open it in Your Web Browser 🌐**
1.  Open your favorite web browser (like Chrome, Firefox, Safari, etc.).
2.  In the address bar at the top, type this and press Enter:
    ```
    http://localhost:5173
    ```

**Step 8: Log In! 🔑🚪**
1.  You should see a login page! 🎉
2.  Use these details to log in:
    *   **Username:** `admin`
    *   **Password:** `admin123`

You're in! Enjoy the app! 🥳